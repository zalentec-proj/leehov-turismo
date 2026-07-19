import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Clock3, ShieldCheck, UsersRound, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaravanItineraryCarousel } from "@/features/caravans/components/caravan-itinerary-carousel";
import { getCaravanBySlug } from "@/features/caravans/queries";
import { CaravanInterestForm } from "@/features/leads/components/caravan-interest-form";

type CaravanPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CaravanPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caravan = await getCaravanBySlug(slug);
  if (!caravan) return { title: "Caravana não encontrada" };
  const title = caravan.seoTitle || caravan.title;
  const description = caravan.seoDescription || caravan.summary;
  const image = caravan.heroImageUrl || caravan.imageUrl;
  return {
    title: caravan.seoTitle ? { absolute: caravan.seoTitle } : caravan.title,
    description,
    alternates: { canonical: `/caravanas/${caravan.slug}` },
    openGraph: { title, description, images: image ? [{ url: image, alt: caravan.title }] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export default async function CaravanPage({ params }: CaravanPageProps) {
  const { slug } = await params;
  const caravan = await getCaravanBySlug(slug);
  if (!caravan) notFound();

  const heroImage = caravan.heroImageUrl || caravan.imageUrl;
  const galleryImages = caravan.images.filter((image) => image.imageUrl);
  const overviewImages = galleryImages.length
    ? galleryImages.slice(0, 2)
    : heroImage
      ? [{ id: "hero", imageUrl: heroImage, altText: caravan.title, caption: "" }]
      : [];
  const tripSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: caravan.title,
    description: caravan.summary,
    touristType: "Viagem em grupo acompanhada",
    itinerary: caravan.destination,
    image: heroImage || undefined,
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(tripSchema).replaceAll("<", "\\u003c") }} />

      <section className="relative min-h-[720px] overflow-hidden bg-leehov-navy-950 px-5 pb-14 pt-36 text-white sm:px-8 lg:min-h-[774px] lg:px-12 lg:pb-[54px] lg:pt-[154px]">
        {heroImage ? <Image src={heroImage} alt="" fill priority unoptimized={heroImage.startsWith("http")} sizes="100vw" className="object-cover object-center lg:object-[72%_center]" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(6_26_42)_0%,rgb(6_26_42_/_94%)_38%,rgb(6_26_42_/_68%)_62%,rgb(6_26_42_/_18%)_100%)]" />
        <div className="absolute inset-0 bg-leehov-navy-950/12" />

        <div className="relative mx-auto grid min-h-[520px] max-w-[1312px] items-end gap-10 lg:grid-cols-[minmax(0,720px)_360px] lg:justify-between">
          <div className="self-center lg:pb-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#59DAFF]">{caravan.category?.name || "Caravana acompanhada"}</p>
            <h1 className="mt-[18px] max-w-[760px] text-[clamp(44px,5.2vw,72px)] font-extrabold leading-[1.03] tracking-[-0.035em] text-white">{caravan.heroTitle || caravan.title}</h1>
            <p className="mt-[18px] max-w-[640px] text-[18px] leading-[30px] text-white/82">{caravan.heroDescription || caravan.summary}</p>

            <div className="mt-9 grid max-w-[680px] grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
              <HeroMetric icon={Clock3} value={caravan.duration} label="Duração da viagem" />
              <HeroMetric icon={CalendarDays} value={caravan.departureLabel} label="Próxima saída" />
              <HeroMetric icon={UsersRound} value="Grupo acompanhado" label={caravan.leaderName ? `Com ${caravan.leaderName}` : "Com líder Leehov"} />
            </div>
          </div>

          <Card className="rounded-[18px] border-white/18 bg-[#051B2BEA] p-7 text-white shadow-[0_22px_42px_rgb(0_0_0_/_22%)] backdrop-blur-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#67DCF8]">Caravana completa</p>
            <p className="mt-3 text-[27px] font-extrabold leading-[33px] text-white">{caravan.price || "Valores sob consulta"}</p>
            <p className="mt-3 text-[13px] leading-5 text-white/72">Roteiro organizado, suporte próximo e acompanhamento Leehov durante a experiência.</p>
            <Button asChild className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 text-sm font-extrabold text-white">
              <Link href="#interesse">Quero este roteiro</Link>
            </Button>
          </Card>
        </div>
      </section>

      <nav aria-label="Navegação desta caravana" className="sticky top-[82px] z-40 border-b border-[#DDEAF5] bg-white/96 shadow-sm backdrop-blur">
        <div className="scrollbar-none mx-auto flex h-[66px] max-w-[1312px] items-center gap-7 overflow-x-auto px-5 text-sm font-bold text-[#496980] sm:px-8 lg:px-0">
          <Link className="whitespace-nowrap text-[#0077C8]" href="#visao-geral">Visão geral</Link>
          <Link className="whitespace-nowrap hover:text-[#0077C8]" href="#roteiro">Roteiro dia a dia</Link>
          <Link className="whitespace-nowrap hover:text-[#0077C8]" href="#inclusos">O que inclui</Link>
          <Link className="whitespace-nowrap hover:text-[#0077C8]" href="#informacoes">Informações</Link>
          <Button asChild size="sm" className="ml-auto hidden shrink-0 rounded-full bg-[#0077C8] px-6 text-white sm:inline-flex"><Link href="#interesse">Solicitar proposta</Link></Button>
        </div>
      </nav>

      <section id="visao-geral" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-12 lg:py-[102px]">
        <div className="mx-auto grid max-w-[1312px] gap-14 lg:grid-cols-[560px_minmax(0,1fr)] lg:items-center lg:gap-[90px]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.11em] text-leehov-blue-500">Uma viagem que atravessa culturas</p>
            <h2 className="mt-4 text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-leehov-text">{caravan.destination}, uma jornada inesquecível.</h2>
            <p className="mt-5 text-[17px] leading-7 text-[#5B778F]">{caravan.description || caravan.summary}</p>
            <div className="mt-7 grid grid-cols-3 gap-4 text-sm leading-5 text-[#173E5D]">
              <p><strong className="block text-2xl text-leehov-blue-600">{caravan.itinerary.length || "—"}</strong>Dias detalhados</p>
              <p><strong className="block text-2xl text-leehov-blue-600">{caravan.departures.length || "—"}</strong>Saídas previstas</p>
              <p><strong className="block text-2xl text-leehov-blue-600">1</strong>Grupo acompanhado</p>
            </div>
          </div>

          <div className="relative min-h-[390px]">
            {overviewImages[0] ? <div className="absolute inset-y-0 left-0 right-16 overflow-hidden rounded-[18px] bg-leehov-surface"><Image src={overviewImages[0].imageUrl} alt={overviewImages[0].altText || caravan.title} fill unoptimized={overviewImages[0].imageUrl.startsWith("http")} sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" /></div> : <div className="absolute inset-y-0 left-0 right-16 rounded-[18px] bg-leehov-surface" />}
            {overviewImages[1] ? <div className="absolute bottom-8 right-0 h-[220px] w-[42%] overflow-hidden rounded-[16px] border-[5px] border-white bg-leehov-surface shadow-[0_14px_30px_rgb(6_42_68_/_17%)]"><Image src={overviewImages[1].imageUrl} alt={overviewImages[1].altText || caravan.title} fill unoptimized={overviewImages[1].imageUrl.startsWith("http")} sizes="260px" className="object-cover" /></div> : null}
            {galleryImages.length ? <Button asChild size="sm" className="absolute bottom-5 left-5 rounded-full bg-leehov-navy-950/78 text-xs font-bold text-white backdrop-blur hover:bg-leehov-navy-950"><Link href="#galeria">Clique e explore as imagens</Link></Button> : null}
          </div>
        </div>
      </section>

      <section id="roteiro" className="scroll-mt-40 bg-leehov-surface px-5 py-20 sm:px-8 lg:px-12 lg:py-[94px]">
        <div className="mx-auto max-w-[1156px]">
          <p className="text-xs font-extrabold uppercase tracking-[0.11em] text-leehov-blue-500">Roteiro dia a dia</p>
          <h2 className="mb-11 mt-3 text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-leehov-text">Uma história a cada parada.</h2>
          <CaravanItineraryCarousel days={caravan.itinerary} />
        </div>
      </section>

      <section id="inclusos" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-12 lg:py-[90px]">
        <div className="mx-auto max-w-[1312px]">
          <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.11em] text-leehov-blue-500">Planeje com clareza</p><h2 className="mt-3 text-[clamp(34px,3.7vw,44px)] font-extrabold leading-tight tracking-[-0.03em] text-leehov-text">O que está incluso na viagem</h2></div>
            <p className="max-w-[360px] text-[15px] leading-6 text-[#668098]">Cada item é organizado para que você viva o roteiro com conforto e tranquilidade.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ListPanel title="Inclui" items={caravan.included} tone="included" />
            <ListPanel title="Não inclui" items={caravan.notIncluded} tone="excluded" />
          </div>
        </div>
      </section>

      <section id="informacoes" className="scroll-mt-40 bg-leehov-surface px-5 py-20 sm:px-8 lg:px-12 lg:py-[78px]">
        <div className="mx-auto grid max-w-[1312px] gap-12 lg:grid-cols-[450px_minmax(0,1fr)] lg:gap-[70px]">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.11em] text-leehov-blue-500">Informações importantes</p><h2 className="mt-3 text-[clamp(34px,3.6vw,44px)] font-extrabold leading-[1.18] tracking-[-0.03em] text-leehov-text">Tudo organizado antes do embarque.</h2>{caravan.leaderName ? <p className="mt-6 inline-flex items-center gap-2 font-bold text-[#244B68]"><ShieldCheck className="size-5 text-leehov-blue-500" />Acompanhamento de {caravan.leaderName}</p> : null}</div>
          <Accordion type="single" collapsible className="border-t border-[#D5E7F2]">
            <InformationItem value="documentation" title="Documentação e vistos">A equipe informa os documentos necessários, prazos e orientações específicas deste destino antes do embarque.</InformationItem>
            <InformationItem value="payment" title="Condições de pagamento">As condições atualizadas são apresentadas na proposta comercial enviada pelo consultor Leehov.</InformationItem>
            <InformationItem value="cancellation" title="Política de cancelamento">As regras aplicáveis constam no contrato da viagem e são explicadas antes da confirmação.</InformationItem>
            <InformationItem value="support" title="Dúvidas frequentes">Fale com a equipe para esclarecer hospedagem, alimentação, deslocamentos, ritmo do roteiro e suporte ao grupo.</InformationItem>
          </Accordion>
        </div>
      </section>

      {galleryImages.length ? (
        <section id="galeria" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1312px]">
            <p className="text-xs font-extrabold uppercase tracking-[0.11em] text-leehov-blue-500">Galeria</p>
            <h2 className="mt-3 text-[clamp(34px,3.6vw,44px)] font-extrabold tracking-[-0.03em] text-leehov-text">Conheça a experiência</h2>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => <figure key={image.id} className={index === 0 ? "sm:col-span-2 lg:row-span-2" : ""}><div className={index === 0 ? "relative h-[420px] overflow-hidden rounded-[18px] bg-leehov-surface lg:h-full lg:min-h-[520px]" : "relative h-[250px] overflow-hidden rounded-[18px] bg-leehov-surface"}><Image src={image.imageUrl} alt={image.altText || caravan.title} fill unoptimized={image.imageUrl.startsWith("http")} sizes={index === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"} className="object-cover transition duration-500 hover:scale-[1.02] motion-reduce:transition-none" /></div>{image.caption ? <figcaption className="px-1 pt-3 text-sm text-[#668098]">{image.caption}</figcaption> : null}</figure>)}
            </div>
          </div>
        </section>
      ) : null}

      <section id="interesse" className="scroll-mt-32 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1312px] gap-10 rounded-[24px] bg-[linear-gradient(110deg,#083C5A,#0877B8)] px-7 py-12 text-white sm:px-10 lg:grid-cols-[minmax(0,510px)_minmax(0,1fr)] lg:items-center lg:px-[58px]">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#70E6FF]">Fale com um especialista</p><h2 className="mt-3 text-[clamp(36px,4vw,48px)] font-extrabold leading-tight tracking-[-0.03em] text-white">Quer viajar com a Leehov?</h2><p className="mt-4 max-w-lg text-base leading-7 text-white/78">Receba a apresentação completa e tire todas as dúvidas sobre esta caravana.</p></div>
          <Card className="rounded-[18px] border-white/18 bg-white p-6 text-leehov-text shadow-xl"><CaravanInterestForm caravanId={caravan.id} caravanTitle={caravan.title} /></Card>
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ icon: Icon, value, label }: { icon: typeof Clock3; value: string; label: string }) {
  return <div className="min-w-0"><Icon className="size-5 text-[#6BE1FF]" aria-hidden="true" /><p className="mt-2 truncate text-[15px] font-bold text-white" title={value}>{value}</p><p className="mt-1 text-xs text-white/62">{label}</p></div>;
}

function ListPanel({ title, items, tone }: { title: string; items: string[]; tone: "included" | "excluded" }) {
  const included = tone === "included";
  return (
    <div className={included ? "min-h-[280px] rounded-[16px] border border-[#CBEBDD] bg-[#EFF9F4] p-7" : "min-h-[280px] rounded-[16px] border border-[#F5DEC4] bg-[#FFF8F1] p-7"}>
      <h3 className={included ? "text-xl font-extrabold text-[#16754D]" : "text-xl font-extrabold text-[#A85D10]"}>{title}</h3>
      {items.length ? <ul className={included ? "mt-5 grid gap-x-8 gap-y-3 text-sm leading-6 text-[#416A5C] sm:grid-cols-2" : "mt-5 space-y-3 text-sm leading-6 text-[#785F48]"}>{items.map((item) => <li key={item} className="flex gap-2">{included ? <Check className="mt-1 size-4 shrink-0" /> : <X className="mt-1 size-4 shrink-0" />}{item}</li>)}</ul> : <p className="mt-5 text-sm text-[#668098]">Os itens serão apresentados na proposta da caravana.</p>}
    </div>
  );
}

function InformationItem({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return <AccordionItem value={value} className="border-b border-[#D5E7F2]"><AccordionTrigger className="min-h-[62px] rounded-none py-4 text-base font-bold text-[#244B68] hover:no-underline">{title}</AccordionTrigger><AccordionContent className="pb-5 pr-10 text-[15px] leading-6 text-[#668098]">{children}</AccordionContent></AccordionItem>;
}
