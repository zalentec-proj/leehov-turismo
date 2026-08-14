import { describe, expect, it } from "vitest";
import {
  caravanFormSchema,
  getCaravanHeroIssues,
  getCaravanPublicationIssues,
  type CaravanFormInput,
} from "@/features/caravans/schema";

function validDraft(overrides: Partial<CaravanFormInput> = {}): CaravanFormInput {
  return {
    id: "",
    title: "Pacote de teste",
    slug: "pacote-de-teste",
    destination: "Japão",
    categoryId: "",
    type: "",
    summary: "",
    description: "",
    duration: "",
    price: "",
    currency: "USD",
    status: "draft",
    cardImagePath: "",
    heroImagePath: "",
    videoUrl: "",
    videoThumbnailPath: "",
    isGroupTrip: true,
    isAccompanied: true,
    hasPortugueseGuide: false,
    hasLeehovRepresentative: false,
    hasTravelKit: false,
    hasTravelInsurance: false,
    minPeople: null,
    maxPeople: null,
    leaderName: "",
    leaderBio: "",
    leaderImagePath: "",
    included: [],
    notIncluded: [],
    notes: "",
    featuredHome: false,
    featuredHero: false,
    heroTitle: "",
    heroDescription: "",
    heroCtaText: "",
    heroCtaUrl: "",
    heroOrder: 0,
    published: false,
    seoTitle: "",
    seoDescription: "",
    departures: [],
    itinerary: [],
    images: [],
    ...overrides,
  };
}

describe("validação de pacotes", () => {
  it("permite salvar um rascunho sem os campos exclusivos de publicação", () => {
    expect(caravanFormSchema.safeParse(validDraft()).success).toBe(true);
  });

  it("lista todos os requisitos ausentes para publicar", () => {
    const issues = getCaravanPublicationIssues(validDraft({ published: true }));

    expect(issues).toEqual([
      { path: "summary", message: "Inclua um resumo antes de publicar." },
      { path: "description", message: "Inclua a descrição antes de publicar." },
      { path: "duration", message: "Informe a duração antes de publicar." },
      { path: "heroImagePath", message: "Inclua uma imagem principal antes de publicar." },
      { path: "status", message: "Escolha um status público antes de publicar." },
    ]);
  });

  it("mantém erros estruturais como bloqueadores", () => {
    const result = caravanFormSchema.safeParse(validDraft({
      itinerary: [
        { id: "", day: 1, title: "Dia 1", location: "", description: "", imagePath: "", meals: [], accommodation: "", notes: "", orderIndex: 0 },
        { id: "", day: 1, title: "Dia repetido", location: "", description: "", imagePath: "", meals: [], accommodation: "", notes: "", orderIndex: 10 },
      ],
    }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.join(".") === "itinerary")).toBe(true);
  });

  it("descreve o que falta para usar o destaque no Hero", () => {
    expect(getCaravanHeroIssues(validDraft({ featuredHero: true }))).toEqual([
      { path: "heroTitle", message: "Informe o título do Hero." },
      { path: "heroDescription", message: "Informe a descrição do Hero." },
      { path: "heroImagePath", message: "Informe a imagem do Hero." },
    ]);
  });
});
