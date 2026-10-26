import type { Alert, AlertType } from "@alerts-shelters/shared";

const LABELS: Record<AlertType, string> = {
  air_raid: "Повітряна тривога",
  artillery_shelling: "Загроза артобстрілу",
  urban_fights: "Вуличні бої",
  chemical: "Хімічна загроза",
  nuclear: "Радіаційна загроза",
};

export function AlertBadge({ alert }: { alert: Alert }) {
  const since = alert.startedAt.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className={`badge badge--${alert.type}`}>
      <strong>{alert.regionName}</strong> | {LABELS[alert.type]} | з <b>{since}</b>
    </span>
  );
}
