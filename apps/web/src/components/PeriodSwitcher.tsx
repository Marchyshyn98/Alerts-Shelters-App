import Link from "next/link";

export const PERIODS = [7, 30] as const;
export type Period = (typeof PERIODS)[number];

export function PeriodSwitcher({ value }: { value: Period }) {
  return (
    <div role="group" aria-label="Період" className="inline-flex rounded-lg mb-5 sm:mb-0">
      {PERIODS.map((days) => {
        const active = days === value;
        return (
          <Link
            key={days}
            href={`?days=${days}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-sm px-3 py-1 text-sm font-semibold tracking-[0.015em] no-underline ${
              active ? "bg-(--dark) !text-white" : "text-(--dark)"
            }`}
          >
            {days} днів
          </Link>
        );
      })}
    </div>
  );
}
