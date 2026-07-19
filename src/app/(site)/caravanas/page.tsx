import { CaravanCard } from "@/components/leehov/site/caravan-card";
import { getPublishedCaravans } from "@/features/caravans/queries";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Caravanas",
  description:
    "Conheça as caravanas e viagens em grupo acompanhadas da Leehov Turismo.",
  alternates: { canonical: "/caravanas" },
};

export default async function CaravansPage() {
  const caravans = await getPublishedCaravans();

  return (
    <main className="bg-leehov-surface pb-24">
      <section className="bg-leehov-navy-950 px-5 pb-28 pt-40 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[1312px]"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Viagens em grupo</p><h1 className="mt-5 text-4xl font-extrabold sm:text-[58px]">Caravanas Leehov</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">Experiências acompanhadas, com orientação antes do embarque, suporte durante o roteiro e cuidado até o retorno.</p></div></section>
      <section className="px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1312px]"><div className="mb-10"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Próximas experiências</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">Escolha sua próxima jornada</h2></div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {caravans.map((caravan) => (
            <CaravanCard key={caravan.id} caravan={caravan} />
          ))}
        </div>
        {!caravans.length ? <Card className="rounded-[18px] border-dashed border-leehov-border p-12 text-center"><h2 className="text-xl font-extrabold text-leehov-navy-950">Novas caravanas em preparação</h2><p className="mt-3 text-leehov-muted">Fale com nossa equipe para conhecer as próximas viagens em grupo.</p></Card> : null}
      </div></section>
    </main>
  );
}
