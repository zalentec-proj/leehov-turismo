import { notFound } from "next/navigation";
import { CaravanForm } from "@/features/caravans/components/caravan-form";
import { getCaravanById, getCaravanCategories } from "@/features/caravans/queries";
import { requirePermission } from "@/features/auth/permissions";
import { getMediaAssetOptions } from "@/features/media/queries";

export default async function EditCaravanPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("caravans.update");
  const { id } = await params;
  const [caravan, categories, mediaAssets] = await Promise.all([getCaravanById(id), getCaravanCategories(), getMediaAssetOptions()]);
  if (!caravan) notFound();
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Pacotes</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Editar pacote</h2><p className="mb-8 mt-2 text-sm text-leehov-muted">Última atualização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(caravan.updatedAt))}</p><CaravanForm caravan={caravan} categories={categories} mediaAssets={mediaAssets} /></div>;
}
