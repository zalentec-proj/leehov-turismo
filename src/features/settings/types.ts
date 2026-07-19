export type ContactSettings = { phone: string; contactEmail: string; address: string };
export type WhatsAppSettings = { number: string; defaultMessage: string; caravanMessage: string };
export type SocialSettings = { instagram: string; facebook: string; youtube: string };
export type HomeSettings = { videoUrl: string; testimonialsEyebrow: string; testimonialsTitle: string };
export type SeoSettings = { siteName: string; titleTemplate: string; defaultDescription: string; ogImageAssetId: string; ogImageUrl: string };
export type EmailSettings = {
  enabled: boolean;
  visitorConfirmationsEnabled: boolean;
  contactRecipients: string[];
  leadRecipients: string[];
  senderName: string;
  replyTo: string;
  footerText: string;
  whatsapp: string;
};
export type TrackingSettings = { gaMeasurementId: string; gtmContainerId: string; metaPixelId: string };
export type CookieConsentSettings = { enabled: boolean; version: number; durationDays: number };

export type PublicSiteSettings = {
  contact: ContactSettings;
  whatsapp: WhatsAppSettings;
  social: SocialSettings;
  home: HomeSettings;
  seo: SeoSettings;
  consent: CookieConsentSettings;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  contactEmail: string;
};

export type AdminSiteSettings = PublicSiteSettings & {
  email: EmailSettings;
  tracking: TrackingSettings;
};

export type SiteSettingsFormValues = {
  contact: ContactSettings;
  whatsapp: WhatsAppSettings;
  social: SocialSettings;
  home: HomeSettings;
  seo: Omit<SeoSettings, "ogImageUrl">;
  email: EmailSettings;
  tracking: TrackingSettings;
  consent: CookieConsentSettings;
};

export type SiteSettingsActionResult = { success: boolean; message: string };
export type CookieConsent = "analytics" | "essential";
