# Alveus Census

<img width="1263" height="332" alt="Alveus Census banner" src="https://github.com/user-attachments/assets/dc19e6ec-d5c3-4ba5-af06-ad1710cd2ad6" />

A monorepo for Alveus Census research projects, starting with the Alveus Pollinator Census -- a community-driven citizen science platform where viewers identify and document wildlife from live camera feeds.

## What Is This

The pollinator census lets the Alveus community submit Twitch clips from the pollinator garden, identify the insects in them, vote on each other's identifications, and earn points for contributing. Think crowdsourced species logging, gamified.

## Repo Structure

```
alveusgg-census/
├── census/
│   ├── api/          # Fastify + tRPC backend, PostgreSQL via Drizzle ORM
│   ├── website/      # React + Vite frontend
│   ├── forms/        # Shared Zod form schemas
│   └── levels/       # Points, levels, and achievement definitions
├── shared/
│   ├── backstage/    # Suspense-based async component utilities
│   ├── node/         # AsyncLocalStorage context helpers
│   └── errors/       # Shared error types
├── infrastructure/
│   └── pulumi/       # Azure + Cloudflare infrastructure as code
├── local/            # Docker Compose configs for local dev services
└── docs/             # Architecture and developer docs
```

## Tech Stack

- **Backend** -- Fastify, tRPC, PostgreSQL, Drizzle ORM, S3-compatible storage, Mux for video
- **Frontend** -- React 18, Vite, Tailwind CSS, Radix UI, tRPC client, React Query
- **Infrastructure** -- Azure (API), Cloudflare Workers (website), Pulumi for IaC
- **Auth** -- Alveus Auth (OIDC/OAuth2), Twitch API for clip retrieval

## Getting Started

### Prerequisites

- Node.js 22
- pnpm (`npm install -g pnpm`)
- Docker (for local services)
- ffmpeg installed locally

### Setup

```bash
# Install dependencies
pnpm install

# Start local services (Postgres + MinIO)
pnpm run deps:up

# Configure the API
cp census/api/.env.example census/api/.env
# Edit census/api/.env with your credentials

# Seed an admin user
pnpm --filter=@alveusgg/census-api setup:api
```

### Running Locally

```bash
# Start the API (watch mode)
pnpm --filter=@alveusgg/census-api dev

# Start the website (watch mode)
pnpm --filter=@alveusgg/census-website start
```

The API runs on `http://localhost:3000` and the website on `http://localhost:5173` by default.

### Optional: Video Streaming

If you want to test capture/clip functionality locally:

```bash
pnpm run stream:up
```

This starts MediaMTX for local RTMP/HLS streaming.

## Database

Migrations run automatically on API startup via Drizzle. To generate a new migration after changing the schema:

```bash
pnpm --filter=@alveusgg/census-api db:generate
```

## Environment Variables

See [`census/api/.env.example`](census/api/.env.example) for all available options. Required ones to get started:

- `POSTGRES_*` -- database connection
- `S3_*` -- object storage (MinIO locally)
- `ALVEUS_AUTH_*` -- OIDC auth provider
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` -- for clip retrieval

## Deployment

The project deploys via GitHub Actions on push to `main`:

- API to Azure Container Instances (via Pulumi)
- Website to Cloudflare Workers
- Infrastructure changes via Pulumi apply

See [`.github/workflows/`](.github/workflows/) for the full pipeline.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for how to report it responsibly.

## License

MIT -- see [LICENSE](LICENSE).
