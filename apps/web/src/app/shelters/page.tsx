import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ city?: string; address?: string }>;
}

export default async function SheltersPage({ searchParams }: Props) {
  const { city, address } = await searchParams;
  const shelters = await api.shelters({ city, address, limit: 1000 }).catch(() => null);

  return (
    <>
      <h1>Пошук укриттів (Львів, Івано-Франківськ)</h1>
      <form className="form">
        <input name="city" placeholder="Місто (Львів)" />
        <input name="address" placeholder="Вулиця" />
        <button type="submit">Шукати</button>
      </form>

      {shelters === null ? (
        <p className="muted">Не вдалося завантажити дані з API.</p>
      ) : shelters.length === 0 ? (
        <p className="muted">Нічого не знайдено.</p>
      ) : (
        <ul className="list">
          {shelters.map((s) => (
            <li key={s.id}>
              <strong>{s.city}</strong>, {s.address} · {s.type}
              {s.capacity ? <span className="muted"> · до {s.capacity} осіб</span> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
