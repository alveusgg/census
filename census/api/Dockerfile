# syntax=docker/dockerfile:1.7

# ---- base ----------------------------------------------------------------
# Shared base for the dependency/build stages. Slim keeps the image small;
# the build stages add whatever they need on top.
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest && corepack enable
WORKDIR /ws

# ---- deps ----------------------------------------------------------------
# Copy only the files needed to resolve and install dependencies. This layer
# is cached in the GHA build cache and reused as long as the lockfile and
# every workspace package.json are unchanged - even when source code changes.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY census/api/package.json ./census/api/
COPY census/website/package.json ./census/website/
COPY census/website/ipx/package.json ./census/website/ipx/
COPY census/levels/package.json ./census/levels/
COPY census/forms/package.json ./census/forms/
COPY infrastructure/pulumi/package.json ./infrastructure/pulumi/
COPY shared/node/package.json ./shared/node/
COPY shared/backstage/package.json ./shared/backstage/
COPY shared/errors/package.json ./shared/errors/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter=@alveusgg/census-api... --frozen-lockfile

# ---- builder -------------------------------------------------------------
# Bring in the full source and produce a self-contained deployment for the
# api package under /prod/api (with only production dependencies hoisted in).
FROM deps AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter=@alveusgg/census-api --prod deploy /prod/api

# ---- runtime -------------------------------------------------------------
# Final image. Only ships node + ffmpeg + the deployed api. Everything from
# the build stages (other workspaces, dev deps, pnpm store, apt lists) is
# discarded, dramatically shrinking the pushed image.
FROM node:22-slim AS runtime
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
RUN npm i -g corepack@latest && corepack enable
WORKDIR /prod/api
COPY --from=builder /prod/api ./
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE
CMD ["pnpm", "start"]
