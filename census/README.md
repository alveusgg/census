# Getting started

## Prerequisites

1. Clone the repository.
2. Ensure you have `pnpm` installed and run `pnpm install`.
3. Ensure you have `docker` installed and running on your machine.
4. Ensure you have [`ffmpeg`](https://www.ffmpeg.org/) installed
   - MacOS: run `brew install ffmpeg`
5. Clone `./api/.env.example` and rename as `./api/.env` and configure it as follows.


## Seeding the database

You will need to seed the database with the correct data. To add yourself as an admin, run `pnpm --filter=@alveusgg/census-api setup:api` and follow the prompts.

## Running the services

1. Start the local services, the database, cache & object storage (MinIO).
   - In the root of the repo, run `pnpm run deps:up`.
2. Start the API.
   - `pnpm --filter=@alveusgg/census-api start`.
   - `pnpm --filter=@alveusgg/census-api dev` to start in watch mode.
3. Start the UI.
   - `pnpm --filter=@alveusgg/census-website start`. This is always started in watch mode.

## Optional & additional setup

### S3-compatible object storage

Local development uses MinIO from `local/core-services.yml` (S3 API on host port **19000**, console on **19001** to avoid conflicts with other services using 9000/9001). A `minio-init` one-shot service creates the `census` bucket and sets **anonymous download** (public read) on it; use `S3_BUCKET=census` in `./api/.env`. You can use the console at `http://localhost:19001` to inspect objects.

For production, set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL` (the HTTPS base URL for public objects, e.g. your bucket website URL or CDN). Omit `S3_ENDPOINT` when using AWS S3.

Objects referenced by `videoUrl` (e.g. for Mux) must be **publicly readable** at `S3_PUBLIC_URL` (or the default virtual-hosted URL). For MinIO dev, set a bucket policy that allows anonymous `s3:GetObject` on the bucket, or use a CDN that signs requests appropriately.

# Getting started with development

See the [development guide](../docs/dev/README.md) for more information.
