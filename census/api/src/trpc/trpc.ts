import {
  CustomError,
  ForbiddenError,
  InternalServerError,
  NotAuthenticatedError,
  UserBannedError
} from '@alveusgg/error';
import { context } from '@opentelemetry/api';
import { TTLCache } from '@isaacs/ttlcache';
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL
} from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/node';
import { initTRPC, TRPCError, TRPCMiddlewareBuilder } from '@trpc/server';
import { middlewareMarker } from '@trpc/server/unstable-core-do-not-import';
import { eq } from 'drizzle-orm';
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';
import { z } from 'zod';
import { feeds } from '../db/schema/index.js';
import { useDB } from '../db/transaction.js';
import { getPermissions, Permissions } from '../services/auth/role.js';
import { TokenPayload } from '../services/auth/router.js';
import { getUserByProviderId } from '../services/users/index.js';
import { useEnvironment, withUser } from '../utils/env/env.js';
import { createContext } from './context.js';
import { transformer } from './transformer.js';

export { jsonResponse } from './transformer.js';

const t = initTRPC.context<typeof createContext>().create({
  transformer,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 15_000
    },
    client: {
      reconnectAfterInactivityMs: 45_000
    }
  }
});
export const router = t.router;

type CacheKeyPart = string | number | boolean | null;
type CacheKey = readonly CacheKeyPart[];
type CacheKeyResolver<TInput> = CacheKey | ((opts: { input: TInput; path: string }) => CacheKey);
type CacheKeysResolver<TInput> = readonly CacheKey[] | ((opts: { input: TInput; path: string }) => readonly CacheKey[]);
type Context = Awaited<ReturnType<typeof createContext>>;
type CacheMiddleware<TInput> = TRPCMiddlewareBuilder<Context, object, object, TInput>;

type CacheEntry = {
  key: CacheKey;
  data: unknown;
};

const operationCache = new TTLCache<string, CacheEntry>({
  max: 1000,
  checkAgeOnGet: true
});

function resolveCacheKey<TInput>(resolver: CacheKeyResolver<TInput>, opts: { input: TInput; path: string }) {
  return typeof resolver === 'function' ? resolver(opts) : resolver;
}

function resolveCacheKeys<TInput>(resolver: CacheKeysResolver<TInput>, opts: { input: TInput; path: string }) {
  return typeof resolver === 'function' ? resolver(opts) : resolver;
}

function validateCacheKey(key: CacheKey) {
  if (!Array.isArray(key) || key.length === 0) {
    throw new InternalServerError('Operation cache keys must be non-empty arrays.');
  }

  for (const part of key) {
    if (part === null) continue;
    const type = typeof part;
    if (type !== 'string' && type !== 'number' && type !== 'boolean') {
      throw new InternalServerError('Operation cache key parts must be strings, numbers, booleans, or null.');
    }
  }
}

function serializeCacheKey(key: CacheKey) {
  validateCacheKey(key);
  return JSON.stringify(key);
}

function cacheKeyStartsWith(key: CacheKey, prefix: CacheKey) {
  if (prefix.length > key.length) return false;

  return prefix.every((part, index) => part === key[index]);
}

function invalidateCacheKeys(keys: readonly CacheKey[]) {
  for (const key of keys) {
    validateCacheKey(key);
  }

  for (const [serialized, entry] of operationCache.entries()) {
    if (keys.some(key => cacheKeyStartsWith(entry.key, key))) {
      operationCache.delete(serialized);
    }
  }
}

function validateTTL(ttl: number) {
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new InternalServerError('Operation cache ttl must be greater than 0 seconds.');
  }
}

function flagOperationCache(status: 'hit' | 'miss', key: string, ttl: number) {
  Sentry.getActiveSpan()?.setAttributes({
    'cache.status': status,
    'cache.key': key,
    'cache.ttl': ttl
  });
}

export const cache = {
  query<TInput = unknown>(options: { key: CacheKeyResolver<TInput>; ttl: number }) {
    validateTTL(options.ttl);

    const middleware = t.middleware(async opts => {
      if (opts.type !== 'query') {
        throw new InternalServerError('cache.query can only be used on queries.');
      }

      const key = resolveCacheKey(options.key, { input: opts.input as TInput, path: opts.path });
      const serialized = serializeCacheKey(key);
      const cached = operationCache.get(serialized, { checkAgeOnGet: true });

      if (cached) {
        flagOperationCache('hit', serialized, options.ttl);

        return {
          ok: true,
          data: cached.data,
          marker: middlewareMarker
        };
      }

      flagOperationCache('miss', serialized, options.ttl);

      const result = await opts.next();

      if (result.ok) {
        operationCache.set(serialized, { key, data: result.data }, { ttl: options.ttl * 1000 });
      }

      return result;
    });

    return middleware as unknown as CacheMiddleware<TInput>;
  },

  invalidate(keys: readonly CacheKey[]) {
    invalidateCacheKeys(keys);
  },

  mutation<TInput = unknown>(options: { key: CacheKeyResolver<TInput> } | { keys: CacheKeysResolver<TInput> }) {
    const middleware = t.middleware(async opts => {
      if (opts.type !== 'mutation') {
        throw new InternalServerError('cache.mutation can only be used on mutations.');
      }

      const result = await opts.next();

      if (result.ok) {
        const keys =
          'keys' in options
            ? resolveCacheKeys(options.keys, { input: opts.input as TInput, path: opts.path })
            : [resolveCacheKey(options.key, { input: opts.input as TInput, path: opts.path })];
        invalidateCacheKeys(keys);
      }

      return result;
    });

    return middleware as unknown as CacheMiddleware<TInput>;
  }
};

const AlveusAuthProviderMetadata = z.object({
  issuer: z.string(),
  jwks_uri: z.string()
});

type AuthProvider = ReturnType<typeof createRemoteJWKSet>;

const fetchAuthProvider = async (configuredIssuer: string): Promise<AuthProvider> => {
  const response = await fetch(new URL('/.well-known/oauth-authorization-server', configuredIssuer));
  if (!response.ok) {
    throw new NotAuthenticatedError('Could not reach the authentication provider to verify your token.');
  }

  const data = await response.json();
  const provider = AlveusAuthProviderMetadata.parse(data);

  return createRemoteJWKSet(new URL(provider.jwks_uri, provider.issuer), {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30_000,
    timeoutDuration: 5_000
  });
};

let authProvider: Promise<AuthProvider> | undefined;

const getAuthProvider = async (): Promise<AuthProvider> => {
  const { variables } = useEnvironment();

  if (!authProvider) {
    authProvider = fetchAuthProvider(variables.ALVEUS_AUTH_ISSUER);
  }

  return await authProvider;
};

const validateJWT = async (token: string) => {
  const { variables } = useEnvironment();

  try {
    const jwks = await getAuthProvider();
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      issuer: variables.ALVEUS_AUTH_ISSUER,
      // Absorb small clock drift between the client that minted/checked the
      // token and this server; anything larger is a real expiry and should fail.
      clockTolerance: '30s'
    });

    return {
      subject: payload.sub,
      payload
    };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new NotAuthenticatedError('Your token has expired.');
    }
    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      throw new NotAuthenticatedError(`Your token has an invalid claim: ${error.claim} (${error.reason}).`);
    }
    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      throw new NotAuthenticatedError('Your token signature could not be verified.');
    }
    if (error instanceof joseErrors.JWKSNoMatchingKey) {
      throw new NotAuthenticatedError('Your token was signed with an unknown key.');
    }
    if (error instanceof joseErrors.JOSEError) {
      throw new NotAuthenticatedError(`Your token could not be verified: ${error.code}.`);
    }
    throw new NotAuthenticatedError('Your token could not be verified.');
  }
};

const loggedProcedure = t.procedure.use(async opts => {
  const sentryTrace = opts.ctx.req.headers['sentry-trace'] as string | undefined;
  const baggage = opts.ctx.req.headers['baggage'] as string | undefined;

  return Sentry.continueTrace({ sentryTrace, baggage }, () =>
    Sentry.startSpan(
      {
        name: opts.path,
        op: `trpc.${opts.type}`,
        forceTransaction: true,
        attributes: {
          [SEMATTRS_HTTP_METHOD]: 'HTTP',
          [SEMATTRS_HTTP_URL]: opts.path,
          path: opts.path,
          type: opts.type
        }
      },
      async span => {
        const result = await opts.next();
        const rawInput = await opts.getRawInput();
        if (typeof rawInput === 'object' && (opts.type === 'query' || opts.type === 'subscription')) {
          span.setAttribute('input', JSON.stringify(rawInput));
        }
        span.setAttributes({
          ok: result.ok,
          [SEMATTRS_HTTP_STATUS_CODE]: result.ok ? 200 : 500
        });
        // 1 = OK, 2 = ERROR (OpenTelemetry status codes used by Sentry).
        span.setStatus({ code: result.ok ? 1 : 2, message: result.ok ? 'ok' : 'internal_error' });

        if (!result.ok && result.error) {
          if (result.error.cause instanceof CustomError) {
            result.error = new TRPCError({
              code: result.error.cause.category,
              message: JSON.stringify(result.error.cause.toJSON()),
              cause: result.error.cause
            });
          }

          Sentry.captureException(result.error, {
            mechanism: { type: 'trpc', handled: false },
            captureContext: {
              contexts: {
                trpc: {
                  path: opts.path,
                  type: opts.type,
                  code: result.error.code
                }
              }
            }
          });
        }

        return result;
      }
    )
  );
});
export const publicProcedure = loggedProcedure;

export const procedure = loggedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.authorization) {
    throw new NotAuthenticatedError('You are not authenticated.');
  }
  const [type, token] = ctx.authorization.split(' ');
  if (type !== 'Bearer') {
    throw new NotAuthenticatedError('You are using an invalid authentication method.');
  }

  try {
    const decoded = await Sentry.startSpan({ name: 'validateJWT', op: 'auth.jwt' }, () => validateJWT(token));
    if (!decoded.subject) throw new NotAuthenticatedError('Your token is malformed as it does not have a subject.');
    const payload = TokenPayload.safeParse(decoded.payload);
    if (!payload.success)
      throw new NotAuthenticatedError(
        `Your token is malformed as it does not have the required payload: ${payload.error.message}`
      );
    const user = await Sentry.startSpan({ name: 'getUserByProviderId', op: 'auth.user' }, () =>
      getUserByProviderId(payload.data.sub)
    );
    if (user.status === 'banned') {
      throw new UserBannedError('Your account has been banned.');
    }
    context.active().setValue(Symbol.for('ai.user.authUserId'), user.id);
    return withUser({ ...payload.data, ...user, points: ctx.points, achievements: ctx.achievements }, next);
  } catch (error) {
    // Preserve the specific auth failure reason; only wrap unexpected errors
    // (e.g. downstream user lookup failures) as a generic auth error.
    if (error instanceof NotAuthenticatedError) throw error;
    if (error instanceof UserBannedError) throw error;
    console.error('error', error);
    throw new NotAuthenticatedError('Your token could not be authenticated.');
  }
});

export const procedureWithPermissions = (required: keyof Permissions) => {
  return procedure.use(async ({ next }) => {
    const permissions = getPermissions();
    if (!permissions[required]) {
      throw new ForbiddenError('You are not authorized to perform this action.');
    }
    return next();
  });
};

export const integrationProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.authorization) {
    throw new NotAuthenticatedError('You are not authenticated.');
  }
  const [type, token] = ctx.authorization.split(' ');
  if (type !== 'Basic') {
    throw new NotAuthenticatedError('You are using an invalid authentication method.');
  }

  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');
  const db = useDB();
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, username));
  if (!feed || feed.key !== password) {
    throw new ForbiddenError('You are not authorized to perform this action.');
  }
  return next();
});
