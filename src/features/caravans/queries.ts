import { demoCaravans } from "@/data/demo-content";
import type { CaravanDetail, CaravanSummary } from "@/features/caravans/types";

export async function getFeaturedCaravans(): Promise<CaravanSummary[]> {
  return demoCaravans.filter((caravan) => caravan.featuredHome);
}

export async function getPublishedCaravans(): Promise<CaravanSummary[]> {
  return demoCaravans;
}

export async function getCaravanBySlug(
  slug: string,
): Promise<CaravanDetail | null> {
  const caravan = demoCaravans.find((item) => item.slug === slug);

  if (!caravan) {
    return null;
  }

  return {
    ...caravan,
    description:
      "Esta pagina esta preparada para receber dados estruturados do Supabase. O conteudo inicial valida hierarquia, rota e componentes.",
    included: [
      "Acompanhamento conforme roteiro",
      "Orientacao antes do embarque",
      "Suporte da equipe Leehov",
    ],
    notIncluded: [
      "Despesas pessoais",
      "Documentacao individual",
      "Servicos nao mencionados no roteiro",
    ],
    itinerary: [
      {
        day: 1,
        title: "Encontro do grupo",
        location: caravan.destination,
        description:
          "Recepcao, alinhamento das orientacoes e inicio da experiencia em grupo.",
      },
      {
        day: 2,
        title: "Visitas principais",
        location: caravan.destination,
        description:
          "Roteiro guiado pelos pontos de maior relevancia cultural, historica ou espiritual.",
      },
    ],
  };
}
