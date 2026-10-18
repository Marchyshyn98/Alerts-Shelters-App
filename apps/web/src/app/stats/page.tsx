import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await api.stats(30).catch(() => null);

  if (!stats) {
    return (
      <>
        <h1>Статистика</h1>
        <p className="muted">Не вдалося завантажити дані з API.</p>
      </>
    );
  }

  return (
    <>
      <h1>Статистика за <b>{stats.days}</b> днів</h1>
      <p>
        Активних тривог зараз: <strong>{stats.activeAlerts}</strong>
      </p>

      <h2>Тривоги за регіонами</h2>
      <table>
        <thead>
          <tr>
            <th>Регіон</th>
            <th>Тривог</th>
            <th>Сумарно, год</th>
          </tr>
        </thead>
        <tbody>
          {stats.byRegion.map((r) => (
            <tr key={r.regionId}>
              <td>{r.regionName}</td>
              <td>{r.alerts}</td>
              <td>{(r.totalMinutes / 60).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Укриття за містами</h2>
      <table>
        <thead>
          <tr>
            <th>Місто</th>
            <th>Укриттів</th>
          </tr>
        </thead>
        <tbody>
          {stats.sheltersByCity.map((c) => (
            <tr key={c.city ?? "—"}>
              <td>{c.city ?? "—"}</td>
              <td>{c.shelters}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
