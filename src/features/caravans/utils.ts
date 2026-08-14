import type { CaravanSummary } from "@/features/caravans/types";

export function buildCaravanWhatsAppMessage(caravan: CaravanSummary) {
  return `Olá, gostaria de mais informações sobre o pacote ${caravan.title}.`;
}

export function slugifyCaravanTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

const departureDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDepartureLabel(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (start && end) {
    const formattedStart = departureDateFormatter.format(start);
    const formattedEnd = departureDateFormatter.format(end);
    return formattedStart === formattedEnd ? formattedStart : `${formattedStart} a ${formattedEnd}`;
  }
  if (start) return departureDateFormatter.format(start);
  if (end) return `Até ${departureDateFormatter.format(end)}`;
  return "";
}
