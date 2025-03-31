FROM node:22
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest
RUN corepack enable

RUN apt-get update && apt-get install -y ffmpeg
WORKDIR /ws
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@alveusgg/census-api --prod deploy /prod/api


WORKDIR /prod/api

CMD ["pnpm", "start"]
