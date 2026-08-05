import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { newsletterCampaignSchema } from "@/features/newsletter/schema";

function campaign(content: unknown[]) {
  return { id: "", internalTitle: "Boletim de agosto", subject: "Novas caravanas Leehov", preheader: "Roteiros acompanhados", content };
}

describe("campanhas de newsletter", () => {
  it("aceita somente blocos conhecidos e conteúdo estruturado", () => {
    const result = newsletterCampaignSchema.safeParse(campaign([
      { id: randomUUID(), type: "heading", data: { text: "Próximas viagens", level: 2 } },
      { id: randomUUID(), type: "paragraph", data: { text: "Viaje em grupo com acompanhamento." } },
      { id: randomUUID(), type: "button", data: { label: "Ver caravanas", url: "https://leehovturismo.com.br/caravanas" } },
    ]));
    expect(result.success).toBe(true);
  });

  it("rejeita HTML livre, URL insegura e imagem sem alt", () => {
    expect(newsletterCampaignSchema.safeParse(campaign([{ id: randomUUID(), type: "html", data: { html: "<script>alert(1)</script>" } }])).success).toBe(false);
    expect(newsletterCampaignSchema.safeParse(campaign([{ id: randomUUID(), type: "button", data: { label: "Abrir", url: "javascript:alert(1)" } }])).success).toBe(false);
    expect(newsletterCampaignSchema.safeParse(campaign([{ id: randomUUID(), type: "image", data: { assetId: randomUUID(), alt: "" } }])).success).toBe(false);
  });
});
