# Збирається з кореня репозиторію: docker build -f apps/worker/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @alerts-shelters/worker build
RUN pnpm --filter @alerts-shelters/worker deploy --prod /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
USER node
# Імпорт укриттів: docker compose run --rm worker node dist/import-shelters.js
CMD ["node", "dist/index.js"]
