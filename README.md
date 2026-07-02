# Alveus Census

<img width="1263" height="332" alt="Alveus Census banner" src="https://github.com/user-attachments/assets/dc19e6ec-d5c3-4ba5-af06-ad1710cd2ad6" />

A monorepo for Alveus Census research projects, starting with the Alveus Pollinator Census -- a community-driven citizen science platform where viewers identify and document wildlife from live camera feeds.

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

## Getting Started

See [`census/README.md`](census/README.md) for setup instructions and [`docs/dev/`](docs/dev/) for architecture and developer guides.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.

## License

Apache 2.0 -- see [LICENSE](LICENSE).
