const BLOG_TIME_ZONE = "America/Sao_Paulo";

export function formatBlogAdminDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BLOG_TIME_ZONE,
  }).format(new Date(value));
}

export function formatBlogDateTimeInput(value: string) {
  if (!value) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BLOG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function parseBlogDateTimeInput(value: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}:00-03:00`).toISOString();
  }
  return new Date(value).toISOString();
}
