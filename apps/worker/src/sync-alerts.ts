import { alerts, and, eq, isNull, notInArray, regions, sql, type Db } from "@alerts-shelters/db";
import type { SourceAlert } from "@alerts-shelters/shared";
import type { AlertSourceAdapter } from "./sources/types";

export interface SyncResult {
  source: string;
  active: number;
  opened: number;
  closed: number;
}

/**
 * Синхронізує активні тривоги джерела з БД:
 * - нові тривоги вставляє (регіони додає/оновлює),
 * - тривоги, яких більше немає у джерелі, закриває (ended_at = now()).
 */
export async function syncAlerts(db: Db, source: AlertSourceAdapter): Promise<SyncResult> {
  const active = await source.fetchActive();

  return db.transaction(async (tx) => {
    await upsertRegions(tx, active);

    const opened = active.length
      ? await tx
        .insert(alerts)
        .values(
          active.map((a) => ({
            regionId: a.regionId,
            type: a.type,
            source: a.source,
            externalId: a.externalId,
            startedAt: a.startedAt,
          })),
        )
        .onConflictDoNothing({ target: [alerts.source, alerts.externalId] })
        .returning({ id: alerts.id })
      : [];

    const activeIds = active.map((a) => a.externalId);
    const closed = await tx
      .update(alerts)
      .set({ endedAt: sql`now()` })
      .where(
        and(
          eq(alerts.source, source.name),
          isNull(alerts.endedAt),
          activeIds.length ? notInArray(alerts.externalId, activeIds) : undefined,
        ),
      )
      .returning({ id: alerts.id });

    // NOTIFY у транзакції доставляється лише після COMMIT:
    // API не прочитає незафіксованих даних, а при ROLLBACK сповіщення не буде
    if (opened.length || closed.length) {
      await tx.execute(sql`NOTIFY alerts_changed`);
    }

    return {
      source: source.name,
      active: active.length,
      opened: opened.length,
      closed: closed.length,
    };
  });
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function upsertRegions(tx: Tx, active: SourceAlert[]) {
  const byId = new Map(
    active.map((a) => [
      a.regionId,
      { id: a.regionId, name: a.regionName, type: a.regionType, parentId: a.parentRegionId },
    ]),
  );
  if (byId.size === 0) return;

  await tx
    .insert(regions)
    .values([...byId.values()])
    .onConflictDoUpdate({
      target: regions.id,
      set: { name: sql`excluded.name`, type: sql`excluded.type`, parentId: sql`excluded.parent_id` },
    });
}
