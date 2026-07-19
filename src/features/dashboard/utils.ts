import type { DashboardTimelinePoint, DashboardTrend } from "@/features/dashboard/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function getRollingWindow(now = new Date(), days = 30) {
  const end = new Date(now);
  const currentStart = dayStart(new Date(now.getTime() - (days - 1) * DAY_MS));
  const previousStart = new Date(currentStart.getTime() - days * DAY_MS);
  return { end, currentStart, previousStart, days };
}

export function calculateTrend(dates: Array<string | null | undefined>, now = new Date(), days = 30): DashboardTrend {
  const { currentStart, previousStart, end } = getRollingWindow(now, days);
  const parsedDates = dates
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
  const current = parsedDates.filter((value) => value >= currentStart && value <= end).length;
  const previous = parsedDates.filter((value) => value >= previousStart && value < currentStart).length;
  return {
    current,
    previous,
    percentage: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
  };
}

export function buildDailyTimeline(dates: Array<string | null | undefined>, now = new Date(), days = 30): DashboardTimelinePoint[] {
  const { currentStart } = getRollingWindow(now, days);
  const counts = new Map<string, number>();

  for (const value of dates) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date < currentStart) continue;
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(currentStart.getTime() + index * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", ""),
      value: counts.get(key) ?? 0,
    };
  });
}

export function formatDashboardTrend(trend: DashboardTrend) {
  if (trend.percentage === null) {
    if (trend.current === 0) return { label: "Sem movimentação no período", tone: "neutral" as const };
    return { label: `${trend.current} no período`, tone: "positive" as const };
  }

  if (trend.percentage > 0) return { label: `↑ ${trend.percentage}% vs. período anterior`, tone: "positive" as const };
  if (trend.percentage < 0) return { label: `↓ ${Math.abs(trend.percentage)}% vs. período anterior`, tone: "negative" as const };
  return { label: "Estável vs. período anterior", tone: "neutral" as const };
}

export function formatRelativeTime(value: string, now = new Date()) {
  const date = new Date(value);
  const diffSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diffSeconds < 60) return "agora";
  if (diffSeconds < 3600) return formatter.format(-Math.floor(diffSeconds / 60), "minute");
  if (diffSeconds < 86_400) return formatter.format(-Math.floor(diffSeconds / 3600), "hour");
  if (diffSeconds < 2_592_000) return formatter.format(-Math.floor(diffSeconds / 86_400), "day");
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "L";
}
