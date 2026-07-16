import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/leehov/shared/section-heading";
import { StatusBadge } from "@/components/leehov/shared/status-badge";
import { getCaravanBySlug, getPublishedCaravans } from "@/features/caravans/queries";

type CaravanPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const caravans = await getPublishedCaravans();
  return caravans.map((caravan) => ({ slug: caravan.slug }));
}

export default async function CaravanPage({ params }: CaravanPageProps) {
  const { slug } = await params;
  const caravan = await getCaravanBySlug(slug);

  if (!caravan) {
    notFound();
  }

  return (
    <>
      <section
        className="relative min-h-[560px] bg-leehov-navy-950 px-5 pb-20 pt-40 text-white sm:px-8 lg:px-12"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(6 26 42 / 86%), rgb(6 26 42 / 32%)), url(${caravan.imageUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end">
          <StatusBadge status={caravan.status} />
          <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-tight sm:text-7xl">
            {caravan.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
            {caravan.summary}
          </p>
        </div>
      </section>

      <section className="bg-leehov-surface px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          {[
            ["Destino", caravan.destination],
            ["Duracao", caravan.duration],
            ["Saidas", caravan.departureLabel],
            ["Investimento", caravan.price ?? "Sob consulta"],
          ].map(([label, value]) => (
            <Card key={label} className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
                {label}
              </p>
              <p className="mt-3 text-lg font-bold text-leehov-navy-950">{value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.7fr]">
          <div>
            <SectionHeading
              eyebrow="Roteiro"
              title="Dia a dia da experiência"
              description={caravan.description}
            />
            <div className="space-y-4">
              {caravan.itinerary.map((day) => (
                <Card key={day.day} className="rounded-[18px] border-leehov-border p-6">
                  <Badge className="rounded-full bg-leehov-blue-500 text-white">
                    Dia {day.day}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-bold text-leehov-navy-950">
                    {day.title}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-leehov-blue-600">
                    {day.location}
                  </p>
                  <p className="mt-4 leading-7 text-leehov-muted">
                    {day.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card">
              <h2 className="text-xl font-bold text-leehov-navy-950">Incluso</h2>
              <ul className="mt-5 space-y-3 text-sm text-leehov-text">
                {caravan.included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="size-5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card">
              <h2 className="text-xl font-bold text-leehov-navy-950">Não incluso</h2>
              <ul className="mt-5 space-y-3 text-sm text-leehov-text">
                {caravan.notIncluded.map((item) => (
                  <li key={item} className="flex gap-3">
                    <X className="size-5 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
