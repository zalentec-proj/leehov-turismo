import { describe, expect, it } from "vitest";
import { siteSettingsSchema } from "@/features/settings/schema";

const validSettings = {
  contact: { phone: "", contactEmail: "", address: "" },
  whatsapp: {
    number: "",
    defaultMessage: "Olá! Gostaria de falar com a equipe Leehov.",
    caravanMessage: "Olá! Gostaria de saber mais sobre esta caravana.",
    provider: "manual" as const,
    evolutionBaseUrl: "",
    evolutionInstance: "",
    apiKeyConfigured: false,
    generalTemplate: "Olá, {{nome}}! Aqui é {{consultor}}.",
    caravanTemplate: "Olá, {{nome}}! Sobre {{caravana}}, fale com {{consultor}}.",
  },
  social: { instagram: "", facebook: "", youtube: "" },
  home: { videoUrl: "", testimonialsEyebrow: "Quem viaja", testimonialsTitle: "Depoimentos" },
  seo: { siteName: "Leehov Turismo", titleTemplate: "%s | Leehov", defaultDescription: "Caravanas e viagens em grupo acompanhadas pela Leehov Turismo.", ogImageAssetId: "" },
  email: { enabled: true, visitorConfirmationsEnabled: true, contactRecipients: [], leadRecipients: [], senderName: "Leehov Turismo", replyTo: "", footerText: "Leehov Turismo", whatsapp: "" },
  tracking: { gaMeasurementId: "", gtmContainerId: "", metaPixelId: "" },
  consent: { enabled: true, version: 1, durationDays: 180 },
};

describe("validação de configurações", () => {
  it("permite salvar redes sociais em branco sem lançar erro", () => {
    expect(() => siteSettingsSchema.safeParse(validSettings)).not.toThrow();
    expect(siteSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it("rejeita URL social inválida sem quebrar a ação", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      social: { ...validSettings.social, instagram: "instagram.com/leehov" },
    });

    expect(result.success).toBe(false);
  });
});
