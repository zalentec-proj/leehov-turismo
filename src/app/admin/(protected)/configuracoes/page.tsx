import { Settings } from "lucide-react";
import { requireAdminProfile } from "@/features/auth/queries";
import { getMediaAssetOptions } from "@/features/media/queries";
import { AdminSettingsForm } from "@/features/settings/components/admin-settings-form";
import { getAdminSiteSettings } from "@/features/settings/queries";
import { getGoogleBusinessSettings } from "@/features/testimonials/queries";

export default async function AdminSettingsPage() {
  await requireAdminProfile();
  const [settings, media, google] = await Promise.all([getAdminSiteSettings(), getMediaAssetOptions(), getGoogleBusinessSettings(true)]);
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Administração</p><h2 className="mt-3 flex items-center gap-3 text-3xl font-extrabold text-leehov-navy-950"><Settings className="size-8 text-leehov-blue-500" />Configurações</h2><p className="mt-3 text-leehov-muted">Dados institucionais, SEO, e-mails e rastreamento sem scripts livres.</p></div><AdminSettingsForm settings={settings} media={media} google={google} /></>;
}
