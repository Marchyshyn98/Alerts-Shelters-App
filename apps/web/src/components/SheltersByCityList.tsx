import type { StatsSummary } from "@alerts-shelters/shared";

const fmt = new Intl.NumberFormat("uk-UA");
const pct = new Intl.NumberFormat("uk-UA", { style: "percent", maximumFractionDigits: 1 });
const TOP_N = 10;

type Row = { key: string; label: string; shelters: number; muted?: boolean };

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "місто";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "міста";
  return "міст";
}

export function SheltersByCityList({ data }: { data: StatsSummary["sheltersByCity"] }) {
  const withCity = data.filter((c) => c.city !== null).sort((a, b) => b.shelters - a.shelters);
  const withoutCity = data.find((c) => c.city === null)?.shelters ?? 0;

  const top = withCity.slice(0, TOP_N);
  const rest = withCity.slice(TOP_N);
  const restTotal = rest.reduce((sum, c) => sum + c.shelters, 0);

  const rows: Row[] = top.map((c) => ({ key: c.city!, label: c.city!, shelters: c.shelters }));
  if (rest.length) {
    rows.push({ key: "__rest", label: `Інші (${rest.length} ${plural(rest.length)})`, shelters: restTotal, muted: true });
  }
  if (withoutCity) {
    rows.push({ key: "__none", label: "Без міста", shelters: withoutCity, muted: true });
  }

  const total = rows.reduce((sum, r) => sum + r.shelters, 0);
  const max = Math.max(...rows.map((r) => r.shelters), 1);

  return (
    <section className="mt-8 rounded-lg bg-(--lightgrey) shadow-lg p-4">
      <h2 className="m-0">Укриття за містами</h2>
      <p className="mt-0 mb-4 text-sm text-(--darkgrey)">
        Усього {fmt.format(total)} укриттів у {withCity.length} {plural(withCity.length)}
      </p>

      {rows.length === 0 ? (
        <p className="muted">Даних про укриття немає.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-xs text-(--darkgrey)">
              <th className="w-10 font-normal">#</th>
              <th className="font-normal">Місто</th>
              <th className="text-right font-normal">Укриттів</th>
              <th className="hidden text-right font-normal sm:table-cell">Частка</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={r.muted ? "text-(--darkgrey)" : ""}>
                <td className="text-sm tabular-nums text-(--darkgrey)">{r.muted ? "" : i + 1}</td>
                <td>
                  <div className="text-sm">{r.label}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-(--border)">
                    <div
                      className={`h-full rounded-full ${r.muted ? "bg-(--darkgrey)" : "bg-(--dark)"}`}
                      style={{ width: `${Math.max((r.shelters / max) * 100, 0.5)}%` }}
                    />
                  </div>
                </td>
                <td className="text-right text-sm font-semibold tabular-nums">{fmt.format(r.shelters)}</td>
                <td className="hidden text-right text-sm tabular-nums text-(--darkgrey) sm:table-cell">
                  {pct.format(r.shelters / total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
