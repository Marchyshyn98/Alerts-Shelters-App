import type { AlertSource, SourceAlert } from "@alerts-shelters/shared";

/** Адаптер джерела тривог: повертає повний список активних тривог на цей момент. */
export interface AlertSourceAdapter {
  name: AlertSource;
  fetchActive(): Promise<SourceAlert[]>;
}
