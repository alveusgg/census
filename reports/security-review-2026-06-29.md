# Security review report - 2026-06-29

## Scope and method

This review was performed by static inspection only. I did not run the application, tests, migrations, scripts, or probes against live services. I inspected the current worktree API routers, service layer, Drizzle schema, website auth/client usage, and Pulumi infrastructure.

Primary areas reviewed:

- API entrypoints under `census/api/src/api`
- Authentication and permission middleware under `census/api/src/services/auth` and `census/api/src/trpc`
- Data access and schema under `census/api/src/services`, `census/api/src/db/schema`, and `census/api/drizzle`
- Website authentication/API client usage under `census/website/src/services`
- Deployment posture under `infrastructure/pulumi`

## Executive summary

The most serious issues are authorization boundary failures rather than SQL injection or direct infrastructure exposure. The API contains unauthenticated guide write/publish procedures, an OAuth redirect flow that accepts an arbitrary return origin and sends access and refresh tokens there, and multiple regular-user mutations that can damage moderation integrity or inflate points.

The database is not directly internet-open in the Pulumi code reviewed; it permits Azure service access and the API connects with the generated administrator credentials. That limits direct database attack paths, but it increases blast radius for any application-layer compromise.

## Findings

### 1. Critical - OAuth sign-in can redirect access and refresh tokens to an attacker-controlled origin

**Bad actor goal:** Steal a victim's Census access token and refresh token, then act as that user. If the victim is a moderator/admin, inherit those privileges.

**Hypothesis:** The sign-in endpoint accepts `origin` from the request, stores it in OAuth state, then redirects the completed token response to that same origin without an allowlist.

**Evidence:**

`census/api/src/services/auth/router.ts` accepts arbitrary `origin`:

```ts
const SignInRequest = z.object({
  from: z.string().optional(),
  origin: z.string()
});
```

It stores that origin in the state passed into the OAuth request:

```ts
const { from, origin } = SignInRequest.parse(request.query);
const state: SignInMeta = { expires: addMinutes(new Date(), 10), origin };
const url = await AlveusAuthenticationMethodsProvider.createSignInRequest(
  `${host}/auth/redirect`,
  JSON.stringify(state)
);
```

After code exchange, it sends both tokens to `meta.origin`:

```ts
params.set('access_token', token.accessToken);
params.set('refresh_token', token.refreshToken);
return reply.redirect(`${meta.origin}/auth/redirect#${params.toString()}`);
```

The OAuth helper returns the original request state after token exchange:

```ts
return {
  accessToken: token.access_token,
  refreshToken: token.refresh_token,
  state: request.state
};
```

**Attack path:** Send a victim to:

```text
https://census-api.alveus.gg/auth/signin?origin=https://attacker.example
```

After the victim completes provider login, the API redirects to:

```text
https://attacker.example/auth/redirect#access_token=...&refresh_token=...
```

**Impact:** Account takeover for the Census app. This bypasses the website's normal use of `window.location.origin` because the backend trusts the caller-supplied origin directly.

**Priority:** Critical.

**Recommended fix:** Only allow exact configured redirect origins, preferably from server-side config. Reject all other origins before starting the OAuth flow. Consider not placing refresh tokens in URL fragments at all; use a server-side session or a backend-for-frontend pattern with secure, HttpOnly cookies.

---

### 2. Critical - Guide document reads, writes, and publish actions are unauthenticated

**Bad actor goal:** Deface published guide content, inject malicious links/content into guide documents, or read draft guide content.

**Hypothesis:** Guide write and publish procedures use `publicProcedure`, and public read procedures expose draft IDs/content that can be used to target writes.

**Evidence:**

`census/api/src/api/guides.ts` exposes document update and guide publish as public procedures:

```ts
update: publicProcedure
  .input(z.object({ id: z.string(), snapshot: z.any() }))
  .mutation(async ({ input }) => {
    await updateDocument(input.id, input.snapshot);
  })
```

```ts
publish: publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await publishGuide(input.id);
  })
```

Public read endpoints also return documents/guides:

```ts
getById: publicProcedure
getBySlug: publicProcedure
```

The service returns draft and published documents for guide lookup:

```ts
const guide = await db.query.guides.findFirst({
  where: eq(guides.slug, slug),
  with: {
    published: true,
    draft: true
  }
});
```

The write path directly updates the document JSON:

```ts
await db.update(documents).set({ content: snapshot }).where(eq(documents.id, id));
```

The publish path copies draft content into the published document:

```ts
.set({
  content: guide.draft.content
})
.where(eq(documents.id, guide.published.id))
```

**Attack path:** Use public guide metadata/slug lookup to obtain a guide ID or draft document ID, call `guides.document.update` with arbitrary `snapshot`, then call `guides.guide.publish`.

**Impact:** Unauthenticated content defacement and potential misinformation. If guide renderers support rich links/media, this can also become a phishing or stored-content abuse path. Draft content is also exposed to unauthenticated callers.

**Priority:** Critical.

**Recommended fix:** Require an admin/research/editor permission for document update, draft reads, and publish. Public guide reads should return only published, sanitized DTOs and should not expose `draftDocumentId` or draft content. Validate `snapshot` against the expected tldraw schema instead of `z.any()`.

---

### 3. High - A regular user can remove their own confirmed identification and unconfirm the observation

**Bad actor goal:** Vandalize moderated observations after a moderator confirms the bad actor's suggestion.

**Hypothesis:** The removal route is only authenticated, not moderator-gated. The service allows the suggester to remove an identification even if it has already been confirmed, then clears `observations.confirmedAs`.

**Evidence:**

`census/api/src/api/identification.ts` uses `procedure`, not `procedureWithPermissions('moderate')`, for removal:

```ts
remove: procedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    return await removeIdentification(input.id);
  })
```

`census/api/src/services/identifications/identifications.ts` allows the suggester or a moderator:

```ts
if (identification.suggestedBy !== user.id && !permissions.moderate) {
  throw new ForbiddenError('You are not authorized to remove this suggestion.');
}
```

It clears confirmation and deletes the identification:

```ts
await tx.update(observations).set({ confirmedAs: null }).where(eq(observations.confirmedAs, identification.id));
await tx.delete(identifications).where(eq(identifications.id, identification.id));
```

**Attack path:** Suggest an identification, wait for moderator confirmation, then call `identification.remove` on that identification ID. The observation becomes unconfirmed.

**Impact:** Loss of moderated data integrity. Feedback rows cascade-delete with the identification, and achievements already recorded for the confirmation are not revoked in this path.

**Priority:** High.

**Recommended fix:** Once `confirmedBy` is set or the identification is referenced by `observations.confirmedAs`, only moderators should be able to remove it. Prefer a soft-delete/audit trail and explicitly revoke or recalculate side effects if removal is legitimate.

---

### 4. High - Duplicate feedback submissions can inflate votes, comments, and points

**Bad actor goal:** Farm leaderboard points and distort community consensus by submitting repeated feedback on the same identification.

**Hypothesis:** The feedback mutation inserts a new row every time and records achievements every time. There is no service check or database uniqueness constraint to limit one feedback/vote per user per identification.

**Evidence:**

`census/api/src/api/identification.ts` records points on every feedback call:

```ts
await addFeedbackToIdentification(input.id, user.id, input.type, input.comment);
await recordAchievement('vote', user.id, { payload: { identificationId: input.id } }, true);
if (input.comment) {
  await recordAchievement('comment', user.id, { payload: { identificationId: input.id } }, true);
}
```

`census/api/src/services/identifications/identifications.ts` only blocks feedback on the caller's own suggestion:

```ts
if (identification.suggestedBy === userId)
  throw new BadRequestError('You cannot give feedback on your own suggestion');

return await db.insert(feedback).values({
  identificationId,
  userId,
  type,
  comment
});
```

`census/api/src/db/schema/identifications.ts` indexes feedback by identification and user separately, but does not define a unique index:

```ts
identificationIdx: index('identification_idx').on(table.identificationId),
userIdIdx: index('user_idx').on(table.userId)
```

`census/levels/index.ts` awards points for both vote and comment achievements:

```ts
const vote = achievement('vote', 20, z.object({ identificationId: z.number() }));
const comment = achievement('comment', 20, z.object({ identificationId: z.number() }));
```

**Attack path:** Repeatedly call `identification.feedback` for the same target identification with `comment` set. Each call can add another vote row and immediate vote/comment achievements.

**Impact:** Leaderboard manipulation, inflated consensus counts, noisy data, and potential database growth.

**Priority:** High.

**Recommended fix:** Enforce idempotency at the database layer, for example a unique constraint on `(identification_id, user_id)` for non-confirm feedback. Make the mutation update/replace prior feedback instead of inserting duplicates. Also make achievements unique/idempotent for `(user_id, type, identification_id)`.

---

### 5. High - Feedback "fog of war" can be bypassed through identification detail reads

**Bad actor goal:** See existing votes/comments before voting so the bad actor can bias their own vote or copy expert reasoning.

**Hypothesis:** `observation.list` tries to hide feedback until the user has given feedback, but `identification.get` returns the whole observation with feedback and does not apply the same visibility rule.

**Evidence:**

`census/api/src/api/observation.ts` contains an explicit fog-of-war rule:

```ts
// Fog of war: hide feedback from users who haven't given feedback yet
const hasGivenFeedback = data.some(observation =>
  observation.identifications.some(identification =>
    identification.feedback.some(feedback => feedback.userId === user.id)
  )
);

if (!hasGivenFeedback) {
  data = data.map(observation => ({
    ...observation,
    identifications: observation.identifications.map(identification => ({
      ...identification,
      feedback: []
    }))
  }));
}
```

`census/api/src/api/identification.ts` exposes detail reads to any authenticated user:

```ts
get: procedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return await getIdentification(input.id);
  })
```

`census/api/src/services/identifications/identifications.ts` returns the full observation:

```ts
return {
  ...identification,
  observation: await getObservation(identification.observationId)
};
```

`getObservation` includes feedback with submitter data:

```ts
identifications: {
  with: {
    suggester: true,
    feedback: {
      with: {
        submitter: true
      }
    },
    shiny: true
  }
}
```

**Attack path:** Call `observation.list` to get identification IDs, then call `identification.get` for the target identification before voting. The returned observation includes feedback.

**Impact:** Voting integrity issue and unintended exposure of comments/user feedback. The page-level `hasGivenFeedback` check in `observation.list` is also broad: one prior feedback item on the returned page reveals feedback for every identification in that page.

**Priority:** High.

**Recommended fix:** Centralize observation/identification serialization and enforce feedback visibility in every endpoint that returns feedback. Visibility should be per identification or per observation, not per arbitrary page of results. Moderators can be exempt if needed.

---

### 6. Medium - Public capture lookup/subscription exposes capture data by enumerable ID

**Bad actor goal:** Scrape raw capture metadata, video URLs, and associated sightings without authenticating.

**Hypothesis:** Capture detail and live capture subscriptions are public because of SSE constraints, but they call a service that returns full capture records and related data.

**Evidence:**

`census/api/src/api/capture.ts` exposes capture detail publicly:

```ts
capture: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
  return await captures.get(input.id);
})
```

The matching subscription is also public:

```ts
capture: publicProcedure.input(z.object({ id: z.number() })).subscription(async function* ({ input, signal }) {
  yield* captures.subscribe(input.id, { signal });
})
```

`census/api/src/services/capture/index.ts` returns the full capture row with sightings, images, and observation:

```ts
return await db.query.captures.findFirst({
  where: eq(captures.id, id),
  with: {
    sightings: {
      with: {
        images: true,
        observation: true
      }
    }
  }
});
```

Capture IDs are serial integers and include media fields:

```ts
id: serial('id').primaryKey(),
videoUrl: text('video_url'),
lowQualityVideoUrl: text('low_quality_video_url'),
muxAssetId: text('mux_asset_id'),
muxPlaybackId: text('mux_playback_id'),
clipId: text('clip_id').unique().notNull()
```

The Pulumi API resource exposes the service externally:

```ts
ingress: args.port
  ? {
      external: true,
      targetPort: args.port,
```

**Attack path:** Enumerate numeric capture IDs against the public `capture.capture` tRPC query or subscription.

**Impact:** Unauthenticated scraping of capture metadata and video/object URLs. This may be acceptable if captures are intentionally public, but the website routes place capture views under the authenticated app while the API does not enforce the same boundary.

**Priority:** Medium.

**Recommended fix:** If captures are not intended to be public, require authentication and solve SSE token renewal instead of making the data public. If some capture state must be public, return a narrow public DTO and use non-enumerable public IDs.

---

### 7. Medium - Missing input bounds and rate limits enable resource exhaustion and cost abuse

**Bad actor goal:** Use a normal active account to trigger many ffmpeg jobs, S3 uploads, database reads, or capture processing work.

**Hypothesis:** Regular active users receive `capture` permission, several inputs are unbounded arrays/numbers, and no route-level throttling was found in the API setup.

**Evidence:**

Regular active users receive capture permission:

```ts
permissions.vote = true;
permissions.capture = true;
permissions.suggest = true;
```

`createObservationsFromCapture` accepts an unbounded outer array and each observation payload is also an unbounded array:

```ts
export const ObservationPayload = z.array(Selection);
```

```ts
.input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload) }))
```

The service starts long-running work, probes video, extracts a frame for each selection, and uploads to S3:

```ts
return runLongOperation(async () => {
  const capture = await getCapture(captureId);
  ...
  const stats = await getStreamStats(videoUrl);
  ...
  await Promise.all(
    selections.map(async ({ timestamp, boundingBox }) => {
      const url = await getFrameFromVideo(videoUrl, timestamp);
```

Frame extraction uploads an object for each frame:

```ts
await extractFrameFromVideo(videoUrl, timestamp, frame);
await storage.send(
  new PutObjectCommand({
    Bucket: variables.S3_BUCKET,
    Key: frame.name,
    Body: createReadStream(frame.path)
  })
);
```

Pagination is also unbounded:

```ts
export const Pagination = z.object({
  page: z.number().default(1),
  size: z.number().default(30)
});
```

and is passed directly into database limits:

```ts
limit: pagination.size,
offset: (pagination.page - 1) * pagination.size
```

Other authenticated inputs are similarly open-ended. For example, sticker positions accept arbitrary JSON and write it directly to the user row:

```ts
updateStickerPositions: procedure.input(z.object({ positions: z.unknown() })).mutation(async ({ input }) => {
  const user = useUser();
  const result = await updateStickerPositionsForUser(user.id, input.positions);
```

```ts
await db.update(users).set({ stickers: positions }).where(eq(users.id, id));
```

**Attack path:** With a normal account, send large `observations`/`selections` arrays or very large `size` values. For captures, repeatedly call `capture.createFromClip` on eligible Twitch clips to queue capture processing.

**Impact:** CPU exhaustion from ffmpeg, S3/R2 object growth, database load/storage bloat, worker queue pressure, and potential Mux/camera-manager cost. This is especially relevant because the API is externally reachable and no rate limiter is registered in `census/api/src/index.ts`.

**Priority:** Medium.

**Recommended fix:** Add strict zod bounds: positive integer pages, maximum page size, maximum observations per capture, maximum selections per observation, bounded timestamps, normalized bounding boxes, maximum location boxes, and schema/size limits for JSON fields such as sticker positions. Add per-user/IP rate limits and queue quotas for capture and frame extraction paths.

---

### 8. Medium - SQL parameters and request inputs are sent to telemetry/logging

**Bad actor goal:** Obtain sensitive user data or content from observability systems rather than from the application database.

**Hypothesis:** The database logger serializes every SQL parameter into tracing attributes, while Sentry tracing is sampled at 100%. Some parameters include onboarding responses, guide document snapshots, comments, sticker JSON, and other user-generated content.

**Evidence:**

`census/api/src/db/db.ts` records SQL and serialized params:

```ts
attributes: {
  params: SuperJSON.stringify(params),
  [SEMATTRS_DB_SYSTEM]: 'postgresql',
  [SEMATTRS_DB_STATEMENT]: query
}
```

Sentry tracing is enabled for every transaction:

```ts
return Sentry.init({
  enableLogs: true,
  enableMetrics: true,
  sendDefaultPii: false,
  tracesSampleRate: 1.0,
  dsn,
```

tRPC query/subscription inputs are also flattened into spans:

```ts
if (typeof rawInput === 'object' && (opts.type === 'query' || opts.type === 'subscription')) {
  span.setAttributes(flatten({ input: SuperJSON.serialize(rawInput).json }));
}
```

Onboarding writes free-text responses and age-derived payloads:

```ts
await tx.insert(responses).values({ userId: id, type: 'onboarding', payload: data });
await tx.insert(anonymousResponses).values({ type: 'onboarding', payload: { age } });
```

**Attack path:** Compromise or over-broaden access to Sentry/Log Analytics, then read serialized DB parameters and query inputs.

**Impact:** Data exposure outside the primary database access controls. `sendDefaultPii: false` does not redact these custom attributes.

**Priority:** Medium.

**Recommended fix:** Do not attach raw SQL params to traces in production. Redact or hash values by default, with an explicit short-lived debug mode for incident response. Lower trace sampling and add Sentry `beforeSend`/span scrubbing for known sensitive keys.

---

### 9. Medium - Authenticated unfurl endpoint can SSRF arbitrary URLs

**Bad actor goal:** Make the API server fetch attacker-chosen internal or metadata URLs and return parsed information.

**Hypothesis:** The unfurl utility accepts any string URL and passes it to `unfurl.unfurl` from the server environment. The infrastructure does not show egress restrictions.

**Evidence:**

`census/api/src/api/guides.ts` accepts arbitrary URL strings:

```ts
unfurl: procedure
  .input(z.object({ url: z.string() }))
  .query(async ({ input }) => {
    const { title, description, open_graph, twitter_card, favicon } = await unfurl.unfurl(input.url);
```

The container app has a system-assigned identity:

```ts
identity: {
  type: 'SystemAssigned'
}
```

**Attack path:** Authenticated user calls `guides.utils.unfurl` with internal/private URLs, loopback URLs, link-local addresses, or attacker-controlled redirect chains.

**Impact:** Potential internal network probing and metadata leakage depending on what the runtime can reach and what headers the library sends. Azure IMDS has header requirements that may reduce token-theft risk, but the endpoint is still an arbitrary server-side fetch primitive.

**Priority:** Medium.

**Recommended fix:** Parse and validate URLs with `z.string().url()`, allow only `http`/`https`, block private/link-local/loopback ranges after DNS resolution, set short timeouts and response size limits, and consider a host allowlist for guide unfurls.

---

### 10. Low/Medium - Infrastructure hardening gaps increase blast radius

**Bad actor goal:** Turn an application-layer bug into broader data access or cross-origin abuse.

**Hypothesis:** The API is externally reachable, CORS is permissive at the Container App layer, the application connects to Postgres as the generated administrator login, and secret values are passed to the Container App as plain environment values rather than Container App secret references.

**Evidence:**

External ingress and permissive Container Apps CORS:

```ts
external: true,
targetPort: args.port,
corsPolicy: {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposeHeaders: ['*'],
  allowCredentials: true
}
```

The API gets the database administrator credentials:

```ts
POSTGRES_USER: server.administratorUsername,
POSTGRES_PASSWORD: server.administratorPassword,
```

Secrets are supplied in the API environment map:

```ts
TWITCH_CLIENT_SECRET: config.requireSecret('twitch-client-secret'),
...
S3_SECRET_ACCESS_KEY: config.requireSecret('s3-secret-access-key'),
...
ALVEUS_AUTH_CLIENT_SECRET: config.requireSecret('alveus-client-secret'),
```

But the Container App wrapper leaves its `secrets` list empty and writes every env var as a direct `value`:

```ts
const secrets: SecretArgs[] = [];
...
secrets
...
env: [
  ...Object.entries(args.env).map(([name, value]) => {
    return {
      name,
      value: output(value).apply(v => v || `WARNING: unknown value for ${name}`)
    };
  }),
```

The PostgreSQL firewall permits Azure services:

```ts
startIpAddress: '0.0.0.0',
endIpAddress: '0.0.0.0'
```

**Impact:** These are not standalone exploit paths in the reviewed code, but they increase impact if an application bug exposes credentials, enables SSRF/RCE, leaks bearer tokens, or grants read access to Container App configuration.

**Priority:** Low/Medium.

**Recommended fix:** Use a least-privilege database role for the API, separate migration/admin credentials from runtime credentials, pass secrets through Container App `secrets` plus `secretRef` environment entries, prefer private networking where possible, and restrict CORS to known frontend origins.

---

### 11. Medium - Any active user can permanently set an unlocated observation's location

**Bad actor goal:** Poison observation map/location data by being the first account to set a false location on observations that do not yet have one.

**Hypothesis:** `locate` requires only the regular `capture` permission, which all active users receive. The service blocks non-moderator overwrites, but it does not restrict the initial write to the observation creator or a moderator.

**Evidence:**

Regular active users receive `capture` permission:

```ts
permissions.vote = true;
permissions.capture = true;
permissions.suggest = true;
```

`census/api/src/api/observation.ts` exposes location writes to anyone with that permission:

```ts
locate: procedureWithPermissions('capture')
  .input(z.object({ id: z.number(), location: z.object({ x: z.number(), y: z.number() }) }))
  .mutation(async ({ input }) => {
    return await locateObservation(input.id, input.location);
  })
```

`census/api/src/services/observations/observations.ts` only checks whether an existing location is being overwritten:

```ts
if (observation.location && !permissions.moderate)
  throw new ForbiddenError(`You are not authorized to overwrite this observation's location`);

await db
  .update(observations)
  .set({
    location
  })
  .where(eq(observations.id, observationId));
```

**Attack path:** Find an observation with `location` unset and call `observation.locate` with false coordinates before the legitimate user or moderator sets it.

**Impact:** Data integrity loss for observation maps and spatial queries. Because non-moderators cannot overwrite a set location, the first malicious write may require moderator cleanup.

**Priority:** Medium.

**Recommended fix:** Restrict initial location writes to the observation creator/capture owner or moderators, or require moderator confirmation for location. Add coordinate bounds and an audit trail for location changes.

---

### 12. High - JWT validation does not enforce the Census OAuth audience/client

**Bad actor goal:** Use a token minted for another application under the same Alveus issuer to access Census APIs.

**Hypothesis:** The API verifies token signature and issuer, but it does not require `aud` to match the configured Census OAuth client. If the issuer has multiple clients and signs access tokens with the same JWKS, a token intended for another client can be accepted by Census as long as the subject maps to an existing Census user.

**Evidence:**

The runtime config has a Census client ID:

```ts
ALVEUS_AUTH_CLIENT_ID: 'census',
```

The OAuth sign-in request uses that client ID:

```ts
url.searchParams.set('client_id', variables.ALVEUS_AUTH_CLIENT_ID);
```

But `census/api/src/trpc/trpc.ts` does not pass `audience` into `jwtVerify`:

```ts
const { payload } = await jwtVerify(token, jwks, {
  algorithms: ['RS256'],
  issuer: variables.ALVEUS_AUTH_ISSUER,
  clockTolerance: '30s'
});
```

The accepted token payload schema also does not include or validate `aud`:

```ts
export const TokenPayload = z.object({
  sub: z.string(),
  roles: z.array(z.enum(['census_moderator', 'census_admin']).or(z.string()))
});
```

**Attack path:** Obtain a valid bearer token from the same issuer for a different client/application, then send it to Census as `Authorization: Bearer ...`. If `sub` exists in the Census `users` table, the API will build a Census user context from it.

**Impact:** Cross-client token replay into Census. Depending on the other application's token roles and user status, this can grant normal user or elevated permissions without going through the Census OAuth client flow.

**Priority:** High.

**Recommended fix:** Require `audience: variables.ALVEUS_AUTH_CLIENT_ID` in `jwtVerify`, and add `aud` validation to the parsed token shape if the provider's JWT format requires custom handling. Also consider checking authorized party/client claims if the issuer uses `azp`.

---

### 13. Medium - Later shiny achievement redemption can overwrite public shiny attribution

**Bad actor goal:** Steal or change which identification is publicly associated with an unlocked shiny bug.

**Hypothesis:** When an `identify` achievement is redeemed, the code grants a `shiny` achievement for any identification whose taxon is on the season shiny list, even if that shiny has already been unlocked. When the `shiny` achievement is redeemed, the code unconditionally writes the current identification ID onto the shared shiny row.

**Evidence:**

Confirmation creates an `identify` achievement for the suggester:

```ts
await recordAchievement('identify', identification.suggestedBy, { payload: { identificationId } });
```

Redeeming an identify achievement checks only whether the taxon exists in the season shiny list:

```ts
if (shiniesForSeason.some(shiny => shiny.inatId.toString() === identification.sourceId)) {
  await addAchievement('shiny', user.id, { identificationId: achievement.identificationId });
  user.achievements();
}
```

Redeeming a shiny achievement finds the shiny by taxon and unconditionally overwrites its `identificationId`:

```ts
const shiny = shiniesForSeason.find(shiny => shiny.inatId.toString() === identification.sourceId);
if (!shiny) continue;
if (shiny.seasonId !== season.id) continue;

await db
  .update(shinies)
  .set({
    identificationId: achievement.identificationId
  })
  .where(eq(shinies.id, shiny.id));
```

The public shiny UI opens the identification stored on that shared shiny row:

```ts
if ('identificationId' in shiny && shiny.identificationId) {
  identificationModalProps.open({ identificationId: shiny.identificationId });
}
```

**Attack path:** Submit or wait for a later confirmed identification with the same shiny taxon, redeem the `identify` achievement to generate a `shiny` achievement, then redeem the shiny achievement. The season shiny row now points at the later identification.

**Impact:** Public attribution and unlock history for shiny bugs can be changed after the fact. This undermines collectible/leaderboard integrity and can confuse which observation actually unlocked the shiny.

**Priority:** Medium.

**Recommended fix:** Treat shiny unlocks as first-writer-wins unless explicitly reset by staff. Only create a shiny achievement if the shiny row is still unclaimed, and update with a conditional `where` clause that includes `isNull(shinies.identificationId)`. Consider recording claimant/user separately for auditability.

---

### 14. Medium - Active users can spam Discord help posts, and the webhook URL is logged

**Bad actor goal:** Spam the configured Discord/forum webhook from inside the trusted Census integration, or obtain the webhook URL from logs and use it outside Census.

**Hypothesis:** The Discord notification endpoint is available to every active user through the broad `capture` permission. The service posts every time it is called, does not check whether the observation already has a `discordThreadId`, and logs the full webhook URL.

**Evidence:**

All active users receive `capture` permission:

```ts
permissions.vote = true;
permissions.capture = true;
permissions.suggest = true;
```

The notification route requires only `capture`:

```ts
notifyDiscordAboutObservation: procedureWithPermissions('capture')
  .input(z.object({ observationId: z.number() }))
  .mutation(async ({ input }) => {
    return await notifyDiscordAboutObservation(input.observationId);
  })
```

The service constructs the webhook URL, logs it, posts to it, and then overwrites `discordThreadId`:

```ts
const url = new URL(variables.DISCORD_WEBHOOK_URL);
url.searchParams.set('wait', 'true');
...
console.log(`url: ${url.toString()}, payload: ${JSON.stringify(payload)}`);

const response = await fetch(url.toString(), {
  method: 'POST',
  body: JSON.stringify(payload),
  headers: {
    'Content-Type': 'application/json'
  }
});
...
await db.update(observations).set({ discordThreadId: post.id }).where(eq(observations.id, observationId));
```

Sentry is configured to capture `console.log` output:

```ts
Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
```

**Attack path:** Call `observation.notifyDiscordAboutObservation` repeatedly for any observation that has an image. Separately, anyone with access to captured application logs can retrieve the Discord webhook URL because it is logged in full.

**Impact:** Discord/forum spam, trusted-notification abuse, webhook secret exposure in observability, and loss of the original `discordThreadId` if multiple posts are created.

**Priority:** Medium.

**Recommended fix:** Restrict this endpoint to moderators or add per-observation/per-user rate limits and idempotency. Refuse to post if `discordThreadId` is already set unless a moderator explicitly asks to repost. Never log webhook URLs; log only host/path-safe metadata.

---

### 15. Low/Medium - OAuth provider IDs are not unique, allowing duplicate Census identities under race

**Bad actor goal:** Create multiple Census user rows for one external auth identity, causing identity confusion or splitting moderation/account state across duplicates.

**Hypothesis:** Login maps an OAuth provider subject to a local user by first selecting `users.providerId` and then inserting a new row if none is found. The database schema indexes `providerId` but does not make it unique, so concurrent first-login requests for the same provider identity can both observe no row and both insert.

**Evidence:**

The users table stores provider identity as a required text field but only creates a non-unique index:

```ts
providerId: text('provider_id').notNull(),
...
providerIdIdx: index('provider_id_idx').on(table.providerId)
```

The migration creates the same non-unique index:

```sql
CREATE INDEX IF NOT EXISTS "provider_id_idx" ON "users" USING btree ("provider_id");
```

User creation is select-then-insert:

```ts
const [user] = await tx.select().from(users).where(eq(users.providerId, providerId));
if (!user) {
  const [user] = await tx.insert(users).values({ providerId, username, status: 'pending' }).returning();
  return user;
}
return user;
```

Subsequent lookup expects one row and accepts the first row returned:

```ts
const [user] = await db.select().from(users).where(eq(users.providerId, providerId));
```

**Attack path:** Trigger multiple concurrent first-time OAuth callback exchanges for the same provider account. Without a unique constraint, more than one transaction can insert a `pending` Census user for the same external subject.

**Impact:** A single external identity can be represented by duplicate local users. That can split onboarding status, achievements, observations, responses, and moderation decisions, and it makes account-level audit trails ambiguous. Exploitability depends on a first-login race, so this is lower priority than the direct authz issues.

**Priority:** Low/Medium.

**Recommended fix:** Add a database unique constraint or unique index on `users.providerId`, then change creation to an atomic upsert (`onConflictDoNothing`/`onConflictDoUpdate`) and re-select on conflict. Add a migration cleanup step for any existing duplicates before enforcing uniqueness.

---

### 16. Low - Moderator user list returns full user rows including provider IDs

**Bad actor goal:** Use a moderator-level account or compromised moderator session to extract external auth provider identifiers and other fields not needed by the admin users table.

**Hypothesis:** The moderator-only users list returns `db.select().from(users)`, exposing every column on the users table. The website users table only displays a smaller subset of fields, and public profile code already demonstrates a narrower projection pattern.

**Evidence:**

The users table includes `providerId` and `stickers`:

```ts
providerId: text('provider_id').notNull(),
username: text('username').notNull(),
stickers: json('stickers'),
```

The users list endpoint is moderator-only but returns the service result directly:

```ts
users: procedureWithPermissions('moderate')
  .use(cache.query({ key: ['users', 'list'], ttl: 60 }))
  .query(async () => {
    return await getUsers();
  }),
```

The service returns full rows:

```ts
return db.select().from(users).orderBy(desc(users.createdAt));
```

The admin UI only renders selected fields:

```ts
accessorKey: 'id'
accessorKey: 'username'
accessorKey: 'role'
accessorKey: 'createdAt'
accessorKey: 'banned'
accessorKey: 'restricted'
```

By contrast, the public profile service uses an explicit projection:

```ts
.select({ id: users.id, username: users.username, createdAt: users.createdAt, stickers: users.stickers })
```

**Attack path:** Obtain or compromise any account with `moderate` permission, call `users.users`, and collect the provider IDs and unused user-table fields for every Census user.

**Impact:** This is not a privilege escalation by itself, but it unnecessarily expands the data exposed to moderator clients and increases the blast radius of a moderator session compromise. Provider IDs can be stable cross-system identifiers depending on the upstream auth provider.

**Priority:** Low.

**Recommended fix:** Return an explicit admin-list DTO with only the fields needed for the users table and moderation workflows. Keep provider IDs behind a narrower administrative/audit endpoint if staff genuinely need them.

---

### 17. Medium - Any active user can create observations from any completed capture ID

**Bad actor goal:** Pollute the observation dataset, take over another user's capture conversion, or create duplicate/false sightings from a known completed capture.

**Hypothesis:** The capture conversion mutation is gated by the broad `capture` permission, which every active user receives, but the service does not require the capture to belong to the caller. It fetches any completed capture by ID and creates new observations/sightings attributed to the caller.

**Evidence:**

All active users receive `capture` permission:

```ts
permissions.vote = true;
permissions.capture = true;
permissions.suggest = true;
```

The mutation accepts a raw capture ID and requires only `capture`:

```ts
createObservationsFromCapture: procedureWithPermissions('capture')
  .input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload) }))
  ...
  .mutation(async ({ input }) => {
    return await createObservationsFromCapture(input.captureId, input.observations);
  }),
```

The service loops over the supplied payloads without checking `capture.capturedBy`:

```ts
export const createObservationsFromCapture = async (captureId: number, observations: ObservationPayload[]) => {
  ...
  return await Promise.all(
    observations.map(async selections => {
      return await createObservations(captureId, selections);
    })
  );
};
```

`createObservations` fetches the capture, checks only that it is complete, then records the sighting as the current user:

```ts
const capture = await getCapture(captureId);
if (capture.status !== 'complete') throw new BadRequestError('Capture is not completed');
...
observedBy: user.id
```

The normal UI surfaces only the caller's unconverted captures:

```ts
.where(and(eq(captures.capturedBy, userId), ne(captures.status, 'dead'), isNull(sightings.id)))
```

But the route used by the editor takes the URL capture ID directly:

```ts
await createObservationsFromCapture.mutateAsync({
  captureId: id,
  observations: payloads,
});
```

**Attack path:** Enumerate or obtain a completed capture ID, call `observation.createObservationsFromCapture` with arbitrary selections, and create observations/sightings on that capture as the attacker. This can be done even if the capture belongs to another user and even after the intended UI would no longer offer the attacker that work item.

**Impact:** Observation integrity and attribution can be corrupted. Attackers can generate false sightings from valid video clips, duplicate conversion work, and consume the same ffmpeg/S3 processing path described in the resource-exhaustion finding.

**Priority:** Medium.

**Recommended fix:** Require `capture.capturedBy === currentUser.id` unless the caller has moderator/admin permission. Also refuse conversion when a capture already has sightings unless a moderator explicitly creates an additional sighting, and consider a database uniqueness/idempotency guard around capture conversion ownership.

---

### 18. Low - Public recent-achievements feed exposes full internal achievement payloads

**Bad actor goal:** Scrape unauthenticated activity data for fields that were intended only for the achievement owner or internal UI logic.

**Hypothesis:** The recent-achievements endpoint is intentionally public, but it returns full achievement rows. The achievement schema distinguishes `message` from `publicMessage`, and the public website renders only `publicMessage`, which suggests the full payload is broader than the public DTO should be.

**Evidence:**

The recent achievements query and subscription are public:

```ts
recentAchievements: publicProcedure.query(async () => {
  return await recentAchievements.get();
}),
...
recentAchievements: publicProcedure.subscription(async function* ({ signal }) {
  yield* recentAchievements.subscribe({ signal });
}),
```

The service returns full achievement rows plus user and identification:

```ts
const rows = await db.query.achievements.findMany({
  where: and(eq(achievements.redeemed, true), eq(achievements.revoked, false)),
  orderBy: (a, { desc }) => [desc(a.createdAt)],
  limit,
  with: {
    user: {
      columns: {
        id: true,
        username: true
      }
    },
    identification: true
  }
});
return rows;
```

The achievement registry explicitly models both private/internal and public onboarding messages:

```ts
const onboard = achievement('onboard', 200, z.object({ message: z.string(), publicMessage: z.string().optional() }));
```

Onboarding achievements populate both fields:

```ts
payload: {
  message: 'Click to redeem your first achievement!',
  publicMessage: 'redeemed their first achievement'
}
```

The public activity feed renders only `publicMessage`:

```tsx
{username} {achievement.payload.payload.publicMessage ?? 'joined the census'}
```

**Attack path:** Call `users.recentAchievements` or subscribe to `users.live.recentAchievements` without authentication and inspect raw payloads rather than the public website rendering.

**Impact:** Current payloads appear low sensitivity, but the endpoint exposes internal message fields and full achievement/identification shapes to unauthenticated clients. Future achievement payloads could accidentally leak owner-facing text or moderation context unless a public DTO is enforced.

**Priority:** Low.

**Recommended fix:** Return an explicit public activity DTO, for example `{ user: { id, username }, type, points, publicMessage, targetName }`, and omit full `payload`, `sticker`, raw identification records, and other fields not rendered publicly.

---

### 19. Medium - Observation and identification reads expose full nested user rows to all authenticated users

**Bad actor goal:** Scrape external provider IDs and other account fields for users who observed, captured, suggested, confirmed, or commented on observations.

**Hypothesis:** Observation and identification detail/list queries use Drizzle relation loading with `observer: true`, `capturer: true`, `suggester: true`, and `submitter: true`. Those relation loads return full user rows, including `providerId`, even though the UI only needs `id` and `username`.

**Evidence:**

The users table includes `providerId`:

```ts
providerId: text('provider_id').notNull(),
username: text('username').notNull(),
stickers: json('stickers'),
```

Observation detail loads full nested users:

```ts
sightings: {
  with: {
    images: true,
    observer: true,
    capture: {
      with: {
        capturer: true
      }
    }
  }
},
identifications: {
  with: {
    suggester: true,
    feedback: {
      with: {
        submitter: true
      }
    },
```

Observation list uses the same full relation pattern:

```ts
sightings: {
  with: {
    images: true,
    observer: true,
    capture: {
      with: {
        capturer: true
      }
    }
  }
},
```

The public profile service already demonstrates a narrower user projection:

```ts
.select({ id: users.id, username: users.username, createdAt: users.createdAt, stickers: users.stickers })
```

The website components only need user IDs and usernames for links:

```tsx
<UserLinkList users={observation.sightings.flatMap(sighting => sighting.observer)} />
<UserLinkList users={observation.sightings.flatMap(sighting => sighting.capture.capturer)} />
```

```ts
user: {
  id: number;
  username: string;
};
```

**Attack path:** Sign in with any active account and call `observation.list`, `identification.get`, or related observation-backed endpoints across pages/IDs. The returned nested user objects include provider IDs for users appearing in those observations and feedback records.

**Impact:** Stable external account identifiers are exposed beyond the intended profile fields. This increases privacy risk and makes user correlation easier for any authenticated user, not only moderators.

**Priority:** Medium.

**Recommended fix:** Define public user projections for nested relations and use them consistently. Do not return `providerId`, status, stickers, or other full account fields unless the endpoint explicitly needs them. Consider response DTO mapping at the service boundary instead of returning raw Drizzle relation objects.

## Additional notes

- `feed.subscribeToRequestsForFeed` and `feed.completeCaptureRequest` are public but require a feed key before returning presigned upload URLs or completing captures. I did not find feed keys exposed in production config, though development scripts use predictable local keys.
- `integrationProcedure` exists for Basic auth against feed IDs/keys but does not appear to be used by any current router.
- `/auth/signout` also accepts an arbitrary `origin` and redirects back to it after provider logout. I treated this as a lower-risk open redirect because it does not carry tokens, but the same origin allowlist used for sign-in should cover sign-out too.
- I did not find evidence of direct SQL injection in the reviewed Drizzle query paths; the main risks are authorization, idempotency, unbounded work, and telemetry/data exposure.
- I did not run dynamic checks, fuzzers, or live endpoint probes. Findings above are from code evidence only.

## Suggested priority order

1. Fix OAuth origin validation and token return handling.
2. Lock down guide write/publish and draft read routes.
3. Prevent regular users from removing confirmed identifications.
4. Add feedback/achievement idempotency constraints.
5. Centralize feedback visibility filtering across observation/identification endpoints.
6. Enforce JWT audience/client validation.
7. Bound expensive inputs and add rate limits/quotas.
8. Restrict observation location writes to owners/moderators or add moderation.
9. Enforce capture ownership/idempotency when converting captures into observations.
10. Make shiny unlock attribution first-writer-wins.
11. Rate-limit/idempotently guard Discord notifications and stop logging webhook URLs.
12. Enforce unique provider IDs and atomic user creation.
13. Reduce telemetry data exposure.
14. Replace raw nested user relations with explicit public user DTOs.
15. Return explicit public/admin DTOs and revisit public capture DTOs/infra least-privilege hardening.
