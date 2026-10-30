# Збирається з кореня репозиторію: docker build -f packages/db/Dockerfile .
# Застосовує міграції й завершується; у compose — сервіс migrate перед api і worker
FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@alerts-shelters/db..."
WORKDIR /repo/packages/db
USER node
CMD ["node_modules/.bin/drizzle-kit", "migrate"]
