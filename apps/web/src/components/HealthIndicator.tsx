"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/useHealth";

const rtf = new Intl.RelativeTimeFormat("uk", { numeric: "auto" });

const STYLES = {
  ok: "bg-[oklch(0.97_0.05_155.5)] text-green-800",
  degraded: "bg-yellow-50 text-yellow-800",
  down: "bg-red-50 text-red-800",
} as const;

/** «42 секунди тому» до хвилини, далі «5 хвилин тому» */
function formatAge(seconds: number) {
  return seconds < 60
    ? rtf.format(-seconds, "second")
    : rtf.format(-Math.floor(seconds / 60), "minute");
}

export function HealthIndicator() {
  const { data, error, isLoading } = useHealth();
  const [now, setNow] = useState(() => Date.now());

  // відносний час оновлюється щосекунди, не чекаючи наступного запиту
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading && !data) return null;

  // API не відповідає взагалі — так само, як 503
  const status = error || !data ? "down" : data.health.status;
  const ageSeconds =
    data?.health.sources.alerts.ageSeconds != null
      ? data.health.sources.alerts.ageSeconds + Math.max(0, Math.floor((now - data.receivedAt) / 1000))
      : null;

  const text =
    status === "down"
      ? "Сервіс тимчасово недоступний"
      : status === "degraded"
        ? ageSeconds === null
          ? "Дані можуть бути неактуальні"
          : `Дані можуть бути неактуальні — оновлено ${formatAge(ageSeconds)}`
        : `Оновлено ${formatAge(ageSeconds ?? 0)}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm", STYLES[status])}
    >
      {text}
    </div>
  );
}
