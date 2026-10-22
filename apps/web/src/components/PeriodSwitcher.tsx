import Link from "next/link";

export const PERIODS = [7, 30] as const;
export type Period = (typeof PERIODS)[number];

export function PeriodSwitcher({ value }: { value: Period }) {
  return (
    <div role="group" aria-label="Період" className="inline-flex rounded-lg border border-(--border) bg-(--card) p-1">
      {PERIODS.map((days) => {
        const active = days === value;
        return (
          <Link
            key={days}
            href={`?days=${days}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1 text-sm no-underline ${
              active ? "bg-(--accent) !text-white" : "text-(--fg) hover:bg-(--border)"
            }`}
          >
            {days} днів
          </Link>
        );
      })}
    </div>
  );
}
