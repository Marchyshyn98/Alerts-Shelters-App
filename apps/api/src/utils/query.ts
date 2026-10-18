// Повертає значення query-параметра, якщо це рядок, інакше null
export const str = (v: unknown) => (typeof v === "string" ? v : null);
