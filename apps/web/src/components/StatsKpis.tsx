import type { StatsSummary } from "@alerts-shelters/shared";

const fmt = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 });

function formatMinutes(minutes: number) {
  return minutes < 60 ? `${fmt.format(minutes)} хв` : `${fmt.format(minutes / 60)} год`;
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-(--lightgrey) p-4 shadow-lg">
      <div className="text-sm text-(--darkgrey)">{label}</div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${accent ? "text-(--crymson)" : ""}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-(--darkgrey)">{hint}</div> : null}
    </div>
  );
}

export function StatsKpis({ stats }: { stats: StatsSummary }) {
  const totalAlerts = stats.byRegion.reduce((sum, r) => sum + r.alerts, 0);
  const totalMinutes = stats.byRegion.reduce((sum, r) => sum + r.totalMinutes, 0);
  const averageMinutes = totalAlerts ? totalMinutes / totalAlerts : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
      <Kpi label="Активних тривог зараз" value={fmt.format(stats.activeAlerts)} accent={stats.activeAlerts > 0} />
      <Kpi
        label="Тривог за період"
        value={fmt.format(totalAlerts)}
        hint={`у ${stats.byRegion.length} регіонах`}
      />
      <Kpi label="Сумарна тривалість" value={formatMinutes(totalMinutes)} hint="по всіх регіонах" />
      <Kpi label="Середня тривалість" value={formatMinutes(averageMinutes)} hint="однієї тривоги" />
    </div>
  );
}
