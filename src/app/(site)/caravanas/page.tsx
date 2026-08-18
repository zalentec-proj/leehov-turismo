import { CaravanCard } from "@/components/leehov/site/caravan-card";
import { getPublishedCaravans } from "@/features/caravans/queries";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Pacotes",
  description:
    "Conheça os pacotes e viagens em grupo acompanhadas da Leehov Turismo.",
  alternates: { canonical: "/caravanas" },
};

export default async function CaravansPage() {
  const caravans = await getPublishedCaravans();

  return (
    <main className="bg-leehov-surface pb-24">
      <section className="bg-leehov-navy-950 px-10 pb-16 pt-28 text-white sm:px-8 sm:pb-28 sm:pt-40 lg:px-12"><div className="mx-auto max-w-[1312px]"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Viagens em grupo</p><h1 className="mt-4 text-[36px] font-extrabold leading-tight sm:mt-5 sm:text-[58px]">Pacotes Leehov</h1><p className="mt-4 max-w-2xl text-[15px] leading-6 text-white/68 sm:mt-6 sm:text-lg sm:leading-8">Experiências acompanhadas, com orientação antes do embarque, suporte durante o roteiro e cuidado até o retorno.</p></div></section>
      <section className="px-10 py-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1312px]"><div className="mb-10"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Próximas experiências</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">Escolha sua próxima jornada</h2></div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {caravans.map((caravan) => (
            <CaravanCard key={caravan.id} caravan={caravan} />
          ))}
        </div>
        {!caravans.length ? <Card className="rounded-[18px] border-dashed border-leehov-border p-12 text-center"><h2 className="text-xl font-extrabold text-leehov-navy-950">Novos pacotes em preparação</h2><p className="mt-3 text-leehov-muted">Fale com nossa equipe para conhecer as próximas viagens em grupo.</p></Card> : null}
      </div></section>
    </main>
  );
}
