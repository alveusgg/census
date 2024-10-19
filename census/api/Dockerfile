FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /ws
COPY . .

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@critter/api --prod deploy /prod/api

FROM base
COPY --from=build /prod/api /prod/api
WORKDIR /prod/api
CMD ["pnpm", "start"]
