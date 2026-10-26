import { api } from "@/lib/api";
import { PERIODS, PeriodSwitcher, type Period } from "@/components/PeriodSwitcher";
import { StatsKpis } from "@/components/StatsKpis";
import { RegionAlertsChart } from "@/components/RegionAlertsChart";
import { SheltersByCityList } from "@/components/SheltersByCityList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ days?: string }>;
}

export default async function StatsPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const days: Period = PERIODS.find((p) => String(p) === daysParam) ?? 7;
  const stats = await api.stats(days).catch(() => null);

  const header = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h1>Статистика за {days} днів</h1>
      <PeriodSwitcher value={days} />
    </div>
  );

  if (!stats) {
    return (
      <>
        {header}
        <p className="muted">Не вдалося завантажити дані з API.</p>
      </>
    );
  }

  return (
    <>
      {header}

      <StatsKpis stats={stats} />
      
      <RegionAlertsChart data={stats.byRegion} days={stats.days} />

      <SheltersByCityList data={stats.sheltersByCity} />
    </>
  );
}
