# Getting started with developing

Prerequisites:

- Clone the repo
- Ensure you have `pnpm` installed
- Run `pnpm install` to install the dependencies
- Ensure you have `docker` installed and running on your machine
- You will need to copy the `src/services/api/.env.example` file to `src/services/api/.env` and supply the correct environment variables.

### Variables you will need to change

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

Go to the [Twitch Developer Dashboard](https://dev.twitch.tv/console) and create a new application to get your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. Ensure that you set the redirect URL to `http://localhost:35523/auth/redirect` & `http://localhost:35523/admin/redirect`.

- `STORAGE_ACCOUNT_NAME`
- `STORAGE_ACCOUNT_KEY`
- `CONTAINER_NAME`

Currently, we don't support the Azurite emulator for local development, so you'll need to have an Azure storage account and container that you can use.

### Variables you could change

- `JWT_SECRET`

This is the secret that the API uses to sign the JWTs. For local development, you can stick to the default value but know that it makes the token insecure. If you want to generate a new secret, you can run `pnpm --filter=@alveusgg/census-api setup:jwt` to generate a new secret.

### Variables you probably should keep the same

- `UI_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `HOST`
- `PORT`

These are all the default values that are used when the local docker compose file is ran. Unless you have a reason to change them, it's best to keep them the same.

### Running the services

In the root of the repo, run `docker compose up` to start the remaining services needed for the API to function.

- Edit the file found in `apps/ui/src/services/backstage/local.ts` and point the `apiBaseUrl` to the API URL you're running locally. (You can probably just uncomment the line.)

You can now make changes to both the UI and API and submit a PR for it!

- Run `pnpm --filter=@alveusgg/census-api start` to start the API (you can use `pnpm --filter=@alveusgg/census-api dev` to start the API in "watch" mode.)
- Run `pnpm --filter=@alveusgg/census-ui start` to start the UI

### Seeding the database

You will need to seed the database with the correct data. To add yourself as an admin, run `pnpm --filter=@alveusgg/census-api setup:api` and follow the prompts.
