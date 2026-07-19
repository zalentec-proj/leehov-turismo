import { ImageIcon } from "lucide-react";
import { AdminMediaLibrary } from "@/features/media/components/admin-media-library";
import { getAdminMediaAssets } from "@/features/media/queries";

export default async function AdminMediaPage() {
  const assets = await getAdminMediaAssets();
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Conteúdo</p><h2 className="mt-3 flex items-center gap-3 text-3xl font-extrabold text-leehov-navy-950"><ImageIcon className="size-8 text-leehov-blue-500" />Mídia</h2><p className="mt-3 text-leehov-muted">Biblioteca privada com validação real do arquivo, texto alternativo e controle de uso.</p></div><AdminMediaLibrary assets={assets} /></>;
}
