"use client";

import { AlertSchema, type Alert } from "@alerts-shelters/shared";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";

type Status = "loading" | "open" | "error";

/**
 * Початковий стан тривог береться з REST (/alerts/active),
 * далі оновлюється через SSE-потік. EventSource сам перепідключається після обриву.
 */
export function useAlertsStream() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  // 1. Початкове завантаження
  useEffect(() => {
    let cancelled = false;

    api.activeAlerts()
      .then(data => {
        if (cancelled) return;
        setAlerts(data);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Оновлення в реальному часі
  useEffect(() => {
    const source = new EventSource(api.alertsStreamUrl());

    source.onopen = () => setStatus("open");
    source.onerror = () => setStatus("error");
    source.addEventListener("alerts", (event) => {
      const parsed = z.array(AlertSchema).safeParse(JSON.parse(event.data));
      if (parsed.success) setAlerts(parsed.data);
    });

    return () => source.close();
  }, [])

  return { alerts, status, error };
}
