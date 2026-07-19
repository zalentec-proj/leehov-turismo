import type { CaravanSummary } from "@/features/caravans/types";

export function buildCaravanWhatsAppMessage(caravan: CaravanSummary) {
  return `Olá, gostaria de mais informações sobre a caravana ${caravan.title}.`;
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
