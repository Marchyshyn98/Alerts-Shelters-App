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
pnpm import:shelters kyiv odesa # лише вказані міста, решту не чіпає

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
| `pnpm import:shelters [джерело ...]` | імпортує / оновлює укриття з CSV (ідемпотентно); без аргументів — усі джерела |
| `pnpm geocode:shelters <джерело ...>` | дозаповнює порожні координати в CSV через Nominatim (OSM); точність пише в `geocode_precision` / `coords_source` |

## API

| Метод | Шлях | Опис |
| --- | --- | --- |
| GET | `/alerts/active` | активні тривоги |
| GET | `/alerts/stream` | SSE: подія `alerts` при кожній зміні |
| GET | `/regions` | регіони |
| GET | `/shelters?city&q&limit&offset` | пошук укриттів |
| GET | `/shelters/nearby?lat&lon&radius&limit` | найближчі укриття (PostGIS) |
| GET | `/stats/summary?days` | статистика |

## Дані

CSV лежать в `apps/worker/data/raw/`.

| Джерело | Файл | Записів | З координатами |
| --- | --- | --- | --- |
| `lviv` | `lviv.csv` | 4795 | усі |
| `ivano-frankivsk` | `ivano-frankivsk.csv` | 131 | усі |
| `cherkasy` | `cherkasy_shelters.csv` | 237 | усі |
| `chernihiv` | `chernihiv_shelters.csv` | 1168 | 1166 |
| `chernivtsi` | `chernivtsi_shelters.csv` | 414 | усі |
| `dnipro` | `dnipro_shelters.csv` | 785 | усі |
| `kharkiv` | `kharkiv_shelters.csv` | 2542 | усі |
| `khmelnytskyi` | `khmelnytskyi_shelters.csv` | 710 | усі |
| `kropyvnytskyi` | `kropyvnytskyi_shelters.csv` | 319 | 300 (геокодовано) |
| `kyiv` | `kyiv_shelters.csv` | 4193 | усі |
| `lutsk` | `lutsk_shelters_geocoded.csv` | 104 | 102 |
| `mykolaiv` | `mykolaiv_shelters.csv` | 328 | усі |
| `odesa` | `odesa_shelters.csv` | 1026 | 1025 |
| `poltava` | `poltava_shelters.csv` | 335 | усі |
| `rivne` | `rivne_shelters.csv` | 258 | усі |
| `sumy` | `sumy_shelters.csv` | 183 | усі |
| `ternopil` | `ternopil_shelters.csv` | 321 | усі |
| `uzhhorod` | `uzhhorod_shelters.csv` | 249 | усі |
| `vinnytsia` | `vinnytsia_shelters.csv` | 1169 | усі |
| `zaporizhzhia` | `zaporizhzhia_shelters.csv` | 687 | усі |
| `zhytomyr` | `zhytomyr_shelters.csv` | 703 | усі |
