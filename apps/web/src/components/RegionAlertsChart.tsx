"use client";

import { useMemo, useState } from "react";
import type { StatsSummary } from "@alerts-shelters/shared";

type RegionStat = StatsSummary["byRegion"][number];
type Metric = "alerts" | "totalMinutes" | "averageMinutes";

const fmt = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 });
const TOP_N = 15;

const METRICS: { key: Metric; label: string; format: (r: RegionStat) => string }[] = [
  { key: "alerts", label: "Кількість тривог", format: (r) => fmt.format(r.alerts) },
  { key: "totalMinutes", label: "Сумарна тривалість", format: (r) => `${fmt.format(r.totalMinutes / 60)} год` },
  { key: "averageMinutes", label: "Середня тривалість", format: (r) => `${fmt.format(r.averageMinutes / 60)} год` },
];

export function RegionAlertsChart({ data, days }: { data: StatsSummary["byRegion"]; days: number }) {
  const [metric, setMetric] = useState<Metric>("alerts");
  const [showAll, setShowAll] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const current = METRICS.find((m) => m.key === metric)!;
  const sorted = useMemo(() => [...data].sort((a, b) => b[metric] - a[metric]), [data, metric]);
  const rows = showAll ? sorted : sorted.slice(0, TOP_N);
  const max = sorted[0]?.[metric] || 1;

  return (
    <section className="mt-8 rounded-lg border border-(--border) bg-(--card) p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0">Тривоги за регіонами</h2>
          <p className="m-0 text-sm text-(--muted)">
            {current.label} за {days} днів
            {sorted.length > TOP_N && !showAll ? ` · топ-${TOP_N} з ${sorted.length}` : ""}
          </p>
        </div>

        <div role="group" aria-label="Метрика" className="inline-flex flex-wrap rounded-lg border border-(--border) p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={m.key === metric}
              onClick={() => setMetric(m.key)}
              className={`rounded-md !border-0 px-3 py-1 text-sm ${
                m.key === metric ? "!bg-(--accent) !text-white" : "!bg-(--card) !text-(--accent) hover:!bg-(--border)"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="muted">За цей період тривог не було.</p>
      ) : (
        <ul className="m-0 grid list-none gap-1 p-0">
          {rows.map((r) => {
            const active = hovered === r.regionId;
            return (
              <li
                key={r.regionId}
                tabIndex={0}
                onPointerEnter={() => setHovered(r.regionId)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(r.regionId)}
                onBlur={() => setHovered(null)}
                className={`relative grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 rounded-md px-2 py-1 outline-none sm:grid-cols-[14rem_1fr] ${
                  active ? "bg-(--border)/50" : ""
                }`}
              >
                <span className="truncate text-sm" title={r.regionName}>
                  {r.regionName}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="h-5 min-w-0.5 rounded-r bg-(--accent) transition-[width] duration-300"
                    style={{ width: `calc(${(r[metric] / max) * 100}% - 4.5rem)` }}
                  />
                  <span className="shrink-0 text-sm tabular-nums">{current.format(r)}</span>
                </span>

                {active ? (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute right-2 bottom-full z-10 mb-1 rounded-md border border-(--border) bg-(--card) px-3 py-2 text-xs shadow-lg"
                  >
                    <div className="mb-1 font-semibold">{r.regionName}</div>
                    {METRICS.map((m) => (
                      <div key={m.key} className="flex justify-between gap-4">
                        <span className="text-(--muted)">{m.label}</span>
                        <span className={`tabular-nums ${m.key === metric ? "font-semibold" : ""}`}>{m.format(r)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {sorted.length > TOP_N ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 !border-0 !bg-transparent !p-0 text-sm !text-(--accent) hover:underline"
        >
          {showAll ? `Показати топ-${TOP_N}` : `Показати всі (${sorted.length})`}
        </button>
      ) : null}
    </section>
  );
}
