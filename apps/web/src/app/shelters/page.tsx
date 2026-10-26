import { api } from "@/lib/api";
import Button from "@/components/Button";
import Input from "@/components/Input";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ city?: string; address?: string }>;
}

export default async function SheltersPage({ searchParams }: Props) {
  const { city, address } = await searchParams;
  const shelters = await api.shelters({ city, address, limit: 1000 }).catch(() => null);

  return (
    <>
      <h1>Пошук укриттів</h1>
      <form className="w-full flex gap-3 flex-wrap mt-3 mb-10 mx-0">
        <Input name="city" placeholder="Місто (Львів)" />
        <Input name="address" placeholder="Вулиця" />
        <Button type="submit" className="rounded-none">Шукати</Button>
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
