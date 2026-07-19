import { CaravanForm } from "@/features/caravans/components/caravan-form";
import { getCaravanCategories } from "@/features/caravans/queries";

export default async function NewCaravanPage() {
  const categories = await getCaravanCategories();
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Caravanas</p><h2 className="mb-8 mt-3 text-3xl font-extrabold text-leehov-navy-950">Nova caravana</h2><CaravanForm categories={categories} /></div>;
}
