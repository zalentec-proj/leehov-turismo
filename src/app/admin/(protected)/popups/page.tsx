import { Megaphone } from "lucide-react";
import { getAdminCaravans } from "@/features/caravans/queries";
import { getMediaAssetOptions } from "@/features/media/queries";
import { AdminPopups } from "@/features/popups/components/admin-popups";
import { getAdminPopups } from "@/features/popups/queries";

export default async function AdminPopupsPage() {
  const [popups, media, caravans] = await Promise.all([getAdminPopups(), getMediaAssetOptions(), getAdminCaravans()]);
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Conversão</p><h2 className="mt-3 flex items-center gap-3 text-3xl font-extrabold text-leehov-navy-950"><Megaphone className="size-8 text-leehov-blue-500" />Pop-ups</h2><p className="mt-3 text-leehov-muted">Campanhas editáveis com frequência controlada. Nenhum pop-up nasce ativo.</p></div><AdminPopups popups={popups} media={media} caravans={caravans.filter((item) => item.published).map((item) => ({ id: item.id, title: item.title }))} /></>;
}
