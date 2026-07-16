import type { PublicSiteSettings } from "@/features/settings/types";

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  return {
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    whatsappDefaultMessage: process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE,
    contactEmail: "contato@leehovturismo.com.br",
  };
}
