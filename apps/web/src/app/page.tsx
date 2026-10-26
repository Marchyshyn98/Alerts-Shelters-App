"use client";

import type { NearbyShelter } from "@alerts-shelters/shared";
import { useEffect, useMemo, useState } from "react";
import { AlertBadge } from "@/components/AlertBadge";
import { Map } from "@/components/Map";
import { useAlertsStream } from "@/hooks/useAlertsStream";
import { useGeolocation } from "@/hooks/useGeolocation";
import { api } from "@/lib/api";
import Button from "@/components/Button";
import Input from "@/components/Input";

const LVIV = { lat: 49.8397, lon: 24.0297 };

export default function HomePage() {
  const { alerts, status, error: alertsError } = useAlertsStream();
  const geo = useGeolocation();
  const [nearby, setNearby] = useState<NearbyShelter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!geo.coords) return;
    api
      .nearbyShelters({ ...geo.coords, radius: 2000, limit: 20 })
      .then(setNearby)
      .catch((e: Error) => setError(e.message));
  }, [geo.coords]);

  useEffect(() => {
    geo.request();
  }, []);

  // маркери nearby shelters на карті
  const points = useMemo(
    () =>
      nearby.flatMap((s) =>
        s.lat !== null && s.lon !== null
          ? [{ id: s.id, lat: s.lat, lon: s.lon, label: `${s.type}: ${s.address}` }]
          : [],
      ),
    [nearby],
  );

  const filteredAlerts = useMemo(() => {
    const q = inputText.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter((a) => a.regionName.toLowerCase().includes(q));
  }, [alerts, inputText]);


  return (
    <>
      <h1>Найближчі укриття</h1>

      <div className="form">
        <Button onClick={geo.request} disabled={geo.loading} className="mb-3">
          {geo.loading ? "Визначаємо…" : "Знайти укриття поруч"}
        </Button>
        {geo.error && <span className="muted">{geo.error}</span>}
        {error && <span className="muted">{error}</span>}
      </div>

      <Map
        center={geo.coords ?? LVIV}
        zoom={geo.coords ? 17 : 12}
        me={geo.coords}
        points={points}
      />

      {nearby.length > 0 && (
        <ul className="list">
          {nearby.map((s) => (
            <li key={s.id}>
              <strong>{Math.round(s.distanceM)} м</strong> · {s.type} · {s.address}
              {s.capacity ? <span className="muted"> · до {s.capacity} осіб</span> : null}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-15">Активні тривоги</h2>
      <Input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Пошук району, міста, громади"
        className="w-full sm:w-1/2 lg:w-1/3 mb-7"
      />
      {alertsError && <p className="muted">Не вдалося завантажити тривоги: {alertsError}</p>}
      {status === "error" && <p className="muted">Немає з’єднання з сервером, перепідключаємось…</p>}
      <div className="badges">
        {status === "loading" && alerts.length === 0 ? (
          <span className="muted">Завантаження…</span>
        ) : alerts.length === 0 ? (
          <span className="muted">Активних тривог немає</span>
        ) : filteredAlerts.length === 0 ? (
          <span className="muted">За запитом "{inputText}" тривог не знайдено</span>
        ) : (
          filteredAlerts.map((a) => <AlertBadge key={a.id} alert={a} />)
        )}
      </div>


    </>
  );
}
