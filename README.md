# Alerts & Shelters

Повітряні тривоги в реальному часі та пошук найближчих укриттів.

## Структура

```
apps/
  web/      Next.js (App Router): карта, пошук укриттів, статистика, джерела
  api/      Express REST API, SSE-потік тривог
  worker/   поллер тривог (alerts.in.ua) та імпорт укриттів з CSV
packages/
  shared/   Zod-схеми та TS-типи для web / api / worker
  db/       Drizzle: схема, клієнт Postgres, SQL-міграції (PostGIS)
```

## Швидкий старт (локально)

Потрібно: Node.js 22+, pnpm 9 (`corepack enable` або `npm i -g pnpm@9`), Docker.

```bash
cp .env.example .env            # вкажіть ALERTS_API_TOKEN
pnpm install

docker compose up -d db         # Postgres 16 + PostGIS
pnpm db:migrate                 # створити таблиці
pnpm import:shelters            # імпорт CSV з apps/worker/data/raw

pnpm dev                        # web :3000, api :4000, worker
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Усе в Docker

```bash
docker compose up -d --build
docker compose run --rm worker node dist/import-shelters.js
```

Міграції в Docker поки запускаються з хоста: `pnpm db:migrate`.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `pnpm dev` | запускає web, api і worker у режимі розробки |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | те саме, що в CI |
| `pnpm db:generate` | створює SQL-міграцію зі змін у `packages/db/src/schema.ts` |
| `pnpm db:migrate` | застосовує міграції |
| `pnpm import:shelters` | імпортує / оновлює укриття з CSV (ідемпотентно) |

## API

| Метод | Шлях | Опис |
| --- | --- | --- |
| GET | `/alerts/active` | активні тривоги |
| GET | `/alerts?regionId&from&to&limit` | історія тривог |
| GET | `/alerts/stream` | SSE: подія `alerts` при кожній зміні |
| GET | `/regions` | регіони |
| GET | `/shelters?city&q&limit&offset` | пошук укриттів |
| GET | `/shelters/nearby?lat&lon&radius&limit` | найближчі укриття (PostGIS) |
| GET | `/stats/summary?days` | статистика |

## Дані

| Файл | Записів | Координати |
| --- | --- | --- |
| `apps/worker/data/raw/lviv.csv` | 4795 | є |
| `apps/worker/data/raw/ivano-frankivsk.csv` | 131 | є |
