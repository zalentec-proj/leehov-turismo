import { notFound } from "next/navigation";
import { CaravanForm } from "@/features/caravans/components/caravan-form";
import { getCaravanById, getCaravanCategories } from "@/features/caravans/queries";

export default async function EditCaravanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [caravan, categories] = await Promise.all([getCaravanById(id), getCaravanCategories()]);
  if (!caravan) notFound();
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Caravanas</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Editar caravana</h2><p className="mb-8 mt-2 text-sm text-leehov-muted">Última atualização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(caravan.updatedAt))}</p><CaravanForm caravan={caravan} categories={categories} /></div>;
}
