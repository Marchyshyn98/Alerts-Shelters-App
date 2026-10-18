import { createDb } from "@alerts-shelters/db";
import { createAlertsInUaSource } from "./sources/alerts-in-ua";
import type { AlertSourceAdapter } from "./sources/types";
import { syncAlerts } from "./sync-alerts";

const token = process.env.ALERTS_API_TOKEN;
if (!token) {
  console.error("ALERTS_API_TOKEN is not set");
  process.exit(1);
}

const intervalMs = Number(process.env.POLL_INTERVAL_MS ?? 30_000);
const db = createDb();

// neptun підключимо сюди, коли адаптер буде реалізовано (./sources/neptun.ts)
const sources: AlertSourceAdapter[] = [createAlertsInUaSource(token)];

// у логах — київський час (UTC+3 влітку, UTC+2 взимку); у БД час зберігається як timestamptz
const kyivTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
  dateStyle: "short",
  timeStyle: "medium",
});

let running = false;

async function tick() {
  if (running) return; // попередній цикл ще не завершився
  running = true;
  try {
    for (const source of sources) {
      try {
        const result = await syncAlerts(db, source);
        if (result.opened || result.closed) console.log(kyivTime.format(new Date()), result);
      } catch (err) {
        console.error(`[${source.name}] sync failed:`, err);
      }
    }
  } finally {
    running = false;
  }
}

console.log(`worker started, polling every ${intervalMs} ms`);
await tick();
const timer = setInterval(tick, intervalMs);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    clearInterval(timer);
    void db.$client.end().then(() => process.exit(0));
  });
}
