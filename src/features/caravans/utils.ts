import type { CaravanSummary } from "@/features/caravans/types";

export function buildCaravanWhatsAppMessage(caravan: CaravanSummary) {
  return `Olá, gostaria de mais informações sobre a caravana ${caravan.title}.`;
}
