import { describe, expect, it } from "vitest";
import { normalizeGoogleReviewText } from "@/features/testimonials/review-text";

describe("normalizeGoogleReviewText", () => {
  it("mantém apenas o depoimento original quando o Google acrescenta a tradução", () => {
    expect(
      normalizeGoogleReviewText(
        "Viagem maravilhosa. (Translated by Google) Wonderful trip.",
      ),
    ).toBe("Viagem maravilhosa.");
  });

  it("usa o texto original quando o comentário começa pela tradução do Google", () => {
    expect(
      normalizeGoogleReviewText(
        "(Translated by Google) Wonderful trip. (Original) Viaje increíble.",
      ),
    ).toBe("Viaje increíble.");
  });

  it("preserva comentários sem tradução e trata comentários vazios", () => {
    expect(normalizeGoogleReviewText("Atendimento excelente!")).toBe(
      "Atendimento excelente!",
    );
    expect(normalizeGoogleReviewText(null)).toBe("Avaliação sem comentário.");
  });
});
