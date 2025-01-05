# Getting started

## Prerequisites

1. Clone the repository.
2. Ensure you have `pnpm` installed and run `pnpm install`.
3. Ensure you have `docker` installed and running on your machine.
4. Ensure you have [`ffmpeg`](https://www.ffmpeg.org/) installed
   - MacOS: run `brew install ffmpeg`
5. Clone `./api/.env.example` and rename as `./api/.env` and configure it as follows.

### Twitch setup

1. Go to the [Twitch Developer Dashboard](https://dev.twitch.tv/console).
2. Create a new application and add the following as OAuth Redirect URLs.
   - `http://localhost:35523/auth/redirect`
   - `http://localhost:35523/admin/redirect`
3. Copy the generated Client ID and Client Secret
   - Update the `./api/.env` file with `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.

### `JWT_SECRET` setup

This is the secret that the API uses to sign the JWTs. For local development, you can stick to the default value but know that it makes the token insecure. If you want to generate a new secret, you can run `pnpm --filter=@alveusgg/census-api setup:jwt` to generate a new secret.

## Seeding the database

You will need to seed the database with the correct data. To add yourself as an admin, run `pnpm --filter=@alveusgg/census-api setup:api` and follow the prompts.

## Running the services

1. Start the local services, the database, cache & blob storage.
   - In the root of the repo, run `pnpm run deps:up`.
2. Start the API.
   - `pnpm --filter=@alveusgg/census-api start`.
   - `pnpm --filter=@alveusgg/census-api dev` to start in watch mode.
3. Start the UI.
   - `pnpm --filter=@alveusgg/census-website start`. This is always started in watch mode.

## Optional & additional setup

### Azure setup

If you want to actually host & store on the internet, you'll need to setup an Azure storage account.

1. Go to the Azure Portal.
2. Create a storage account:
   - Under Azure services, select Storage accounts and create a new storage account.
   - Update the `./api/.env` file with `STORAGE_ACCOUNT_NAME`.
3. Obtain the access key:
   - From your storage account's page, navigate to Security + networking > Access keys.
   - Update the `./api/.env` file with `STORAGE_ACCOUNT_KEY` with either `key1` or `key2`.
4. Create a storage container:
   - From your storage account's page, go to Data storage > Containers and create a new container.
   - Update the `./api/.env` file with `CONTAINER_NAME`.
5. Enable public access for the container
   - From your storage account's page, go to Configuration and set `Allow Blob anonymous access` to `Enabled`.
   - From your container's page, select Change access level and set the `anonymous access level` as `Container` or `Blob`.

# Getting started with development

## Coding style

### Error handling

#### Impossible or undefined states

When working in the api, there are two main ways to handle errors that cover two different classes of errors.

If you're protecting against an impossible state, i.e. something that should be guaranteed to not happen or would put the operation in an undefined state, you should use the `assert` function found in `src/utils/assert.ts`.

For example, here is a situation where we're coding defensively against a situation that should never happen.

```ts
// We create an asset on mux (a video hosting service)
const asset = await mux.video.assets.create({
  input: [{ url: videoUrl }],
  // We are explicitly setting the playback policy to public
  playback_policy: ['public'],
  video_quality: 'basic'
});

const assetId = asset.id;
// We need to find the public playback id
const publicPlayback = asset.playback_ids?.find(p => p.policy === 'public');

// This is a defensive check to ensure that the public playback id is present. It should always be, but you never know.
assert(publicPlayback?.id, 'No public playback found on the mux asset');

// This is now safe to use
const playbackId = publicPlayback.id;
```

We also have the `assert.shape` function which is a more powerful version of `assert` that allows you to specify a zod schema and a value to check against it. This is useful when you're working with more complex data structures. Here's a real-world example from `src/db/listen.ts`.

```ts
export const listen = async (row: Row | null, info: ReplicationEvent) => {
  // We assert that the object follows the schema
  assert.shape(z.object({ id: z.number() }), row, 'Row must have an id');

  // We create a change object
  const change: Change = {
    table: info.relation.table,
    id: row.id,
    event: info.command
  };

  // Do something with the change
  ...
};
```

Against what you might be used to, this isn't thrown and _possibly_ handled. Instead, it will exit the program with an assertion error outright. (Any teardown tasks specified in `/index.ts` will still run.)

There also might be situations where you're exhaustively checking multiple conditions manually and want to crash out if none of them are true. If that's true, you can use the `panic` function found in `src/utils/assert.ts` to crash the program with a message. Here's a real-world example from `src/services/auth/auth.ts`.

```ts
export const getHost = () => {
  const { variables } = useEnvironment();
  // If running locally
  if (variables.NODE_ENV === 'development') {
    return `http://${variables.HOST}:${variables.PORT}`;
  }
  // If a custom API url has been setup
  if (variables.API_URL) {
    return variables.API_URL;
  }
  // If we're running in an environment with a container app name
  if (variables.CONTAINER_APP_NAME && variables.CONTAINER_APP_ENV_DNS_SUFFIX) {
    return `https://${variables.CONTAINER_APP_NAME}.${variables.CONTAINER_APP_ENV_DNS_SUFFIX}`;
  }

  // If we can't find a host, we panic
  return panic('No host found');
};
```

#### Possible & expected errors

If you're handling an error that is expected to happen in the normal course of operations, you should throw an error. It's highly recommended, and required when in a request, to use the custom errors found in `@alveusgg/error`.

```diff
+ import { NotFoundError } from '@alveusgg/error';

const getCapture = async (id: number) => {
  const capture = await db.query.captures.findFirst({
    where: eq(captures.id, id),
  });

   // Don't do this. This doesn't have any semantic meaning and won't be automatically serialized.
-  if (!capture) throw new Error('Capture not found');

   // Do this. This allows the api & ui to have consistent error handling.
+  if (!capture) throw new NotFoundError('Capture not found');

  return capture;
};
```

This allows for automatic error serialization in the API and deserialization in the client without any additional work. If you don't find a suitable error, you can create a new one by extending the `CustomError` class.

This is useful because the error itself has a semantic meaning, allowing the client to handle it appropriately without doing any weird hacks around checking for a string in the error message.

### Long running operations

If you are performing any long running tasks like processing an image, downloading a video, waiting on an external service, etc, you should wrap that in the `runLongOperation` function.

It’s especially important if this task occurs outside of the request lifetime, e.g if it continues after a request is completed or if it’s triggered by a timer or event.

This prevents the application from shutting down until it's completed, which could happen at any point if a new version of the api is deployed. It also logs information about that specific operation.
