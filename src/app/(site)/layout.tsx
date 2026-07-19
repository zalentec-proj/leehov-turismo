import type { ReactNode } from "react";
import { FloatingWhatsAppButton } from "@/components/leehov/site/floating-whatsapp-button";
import { SiteFooter } from "@/components/leehov/site/site-footer";
import { SiteHeader } from "@/components/leehov/site/site-header";
import { getActivePopup } from "@/features/popups/queries";
import { PublicPopupRenderer } from "@/features/popups/components/public-popup-renderer";
import { CookieConsentManager } from "@/features/settings/components/cookie-consent";
import { getPublicSiteSettings, getServerTrackingSettings } from "@/features/settings/queries";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, tracking, popup] = await Promise.all([getPublicSiteSettings(), getServerTrackingSettings(), getActivePopup()]);
  return (
    <div className="min-h-screen bg-white text-leehov-text">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter settings={settings} />
      <FloatingWhatsAppButton />
      <PublicPopupRenderer popup={popup} whatsapp={settings.whatsapp} />
      <CookieConsentManager consent={settings.consent} tracking={tracking} />
    </div>
  );
}
