FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt update
RUN apt install -y streamlink ffmpeg


WORKDIR /ws
COPY . .

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@critter/ingest --prod deploy /prod/ingest

FROM base
COPY --from=build /prod/ingest /prod/ingest
WORKDIR /prod/ingest
CMD ["pnpm", "start"]
