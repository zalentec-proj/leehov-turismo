import { CaravanCard } from "@/components/leehov/site/caravan-card";
import { SectionHeading } from "@/components/leehov/shared/section-heading";
import { getPublishedCaravans } from "@/features/caravans/queries";

export const metadata = {
  title: "Caravanas",
  description:
    "Conheca as caravanas e viagens em grupo acompanhadas da Leehov Turismo.",
};

export default async function CaravansPage() {
  const caravans = await getPublishedCaravans();

  return (
    <section className="bg-leehov-surface px-5 pb-20 pt-40 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Roteiros acompanhados"
          title="Caravanas Leehov"
          description="Listagem inicial preparada para busca, filtros por categoria e status, e conexao futura com Supabase."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {caravans.map((caravan) => (
            <CaravanCard key={caravan.id} caravan={caravan} />
          ))}
        </div>
      </div>
    </section>
  );
}
