# Getting started

## Prerequisites

1. Clone the repository.
2. Ensure you have `pnpm` installed and run `pnpm install`.
3. Ensure you have `docker` installed and running on your machine.
4. Clone `./api/.env.example` and rename as `./api/.env` and configure it as follows.

### Twitch setup

1. Go to the [Twitch Developer Dashboard](https://dev.twitch.tv/console).
2. Create a new application and add the following as OAuth Redirect URLs.
   - `http://localhost:35523/auth/redirect`
   - `http://localhost:35523/admin/redirect`
3. Copy the generated Client ID and Client Secret
   - Update the `./api/.env` file with `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.

### `JWT_SECRET` setup

This is the secret that the API uses to sign the JWTs. For local development, you can stick to the default value but know that it makes the token insecure. If you want to generate a new secret, you can run `pnpm --filter=@alveusgg/census-api setup:jwt` to generate a new secret.

## Running the services

1. Start the database.
   - In the root of the repo, run `docker compose up`.
2. Start the API.
   - `pnpm --filter=@alveusgg/census-api start`.
   - `pnpm --filter=@alveusgg/census-api dev` to start in watch mode.
3. Start the UI.
   - `pnpm --filter=@alveusgg/census-website start`.

## Seeding the database

You will need to seed the database with the correct data. To add yourself as an admin, run `pnpm --filter=@alveusgg/census-api setup:api` and follow the prompts.

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
