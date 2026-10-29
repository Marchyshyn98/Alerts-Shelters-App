"use client";

import useSWR from "swr";
import { api } from "@/lib/api";

const REFRESH_MS = 30_000;

/** Опитує /v1/health; receivedAt потрібен, щоб «вік» даних ріс між запитами без звірки з годинником сервера */
export function useHealth() {
  return useSWR(
    "/v1/health",
    async () => ({ health: await api.health(), receivedAt: Date.now() }),
    { refreshInterval: REFRESH_MS, revalidateOnFocus: true },
  );
}
