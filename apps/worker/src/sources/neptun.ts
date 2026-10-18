import type { AlertSourceAdapter } from "./types";

/**
 * Заготовка адаптера для другого джерела ("neptun").
 * TODO: реалізувати, коли визначимось з форматом даних джерела.
 */
export function createNeptunSource(): AlertSourceAdapter {
  return {
    name: "neptun",
    async fetchActive() {
      throw new Error("neptun source is not implemented yet");
    },
  };
}
