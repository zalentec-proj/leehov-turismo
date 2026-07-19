import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Route, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";

export const metadata = {
  title: "Quem Somos",
  description: "Conheça a Leehov Turismo e nosso jeito de cuidar de caravanas e viagens em grupo acompanhadas.",
  alternates: { canonical: "/quem-somos" },
};

const principles = [
  { icon: HeartHandshake, title: "Atendimento humano", text: "Escuta, orientação clara e proximidade desde o primeiro contato." },
  { icon: Route, title: "Roteiros com propósito", text: "Experiências culturais, históricas e de fé organizadas com atenção aos detalhes." },
  { icon: UsersRound, title: "Força do grupo", text: "Viagens compartilhadas, com acolhimento e acompanhamento ao longo da jornada." },
  { icon: ShieldCheck, title: "Confiança em cada etapa", text: "Suporte antes, durante e depois da viagem para você seguir com tranquilidade." },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="bg-leehov-navy-950 px-5 pb-28 pt-40 text-white sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1312px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Sobre a Leehov</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-[52px] sm:leading-[1.08]">Viajar em grupo com cuidado, clareza e acompanhamento</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg">Desde 2014, a Leehov aproxima pessoas de destinos marcantes por meio de caravanas planejadas, atendimento próximo e suporte em cada fase da experiência.</p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-leehov-blue-500 px-6 text-white hover:bg-leehov-cyan"><Link href="/caravanas">Conhecer caravanas <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="relative min-h-[480px] overflow-hidden rounded-[28px] sm:min-h-[560px]"><Image src="/images/leehov/about-rio.jpg" alt="Viajante contemplando uma paisagem no Rio de Janeiro" fill priority sizes="(min-width: 1024px) 510px, 60vw" className="object-cover" /></div>
            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[22px]"><Image src="/images/leehov/about-santorini.jpg" alt="Arquitetura branca e azul de Santorini" fill sizes="(min-width: 1024px) 280px, 38vw" className="object-cover" /></div>
              <div className="relative overflow-hidden rounded-[22px]"><Image src="/images/leehov/about-island.jpg" alt="Ilha tropical cercada por mar azul" fill sizes="(min-width: 1024px) 280px, 38vw" className="object-cover" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Nossa história</p><h2 className="mt-4 text-3xl font-extrabold leading-tight text-leehov-navy-950 sm:text-[40px]">Muito além de escolher um destino</h2></div>
          <div className="space-y-6 text-[17px] leading-8 text-leehov-text">
            <p>A Leehov nasceu para transformar a organização de uma viagem em uma experiência mais segura, humana e bem acompanhada. Nosso trabalho combina planejamento, conhecimento de destinos e atenção às necessidades de cada grupo.</p>
            <p>Atuamos principalmente com turismo cultural, histórico e religioso. Em cada caravana, buscamos criar espaço para descoberta, conexão e boas memórias, mantendo a equipe próxima antes do embarque, durante o roteiro e no retorno.</p>
            <p>Não somos apenas um catálogo de viagens. Somos uma equipe que orienta decisões, organiza detalhes e caminha ao lado dos viajantes.</p>
          </div>
        </div>
      </section>

      <section className="bg-leehov-surface px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1312px]">
          <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Nosso jeito de cuidar</p><h2 className="mt-4 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">O que guia cada caravana</h2></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle) => <Card key={principle.title} className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card"><span className="flex size-11 items-center justify-center rounded-full bg-leehov-blue-500 text-white"><principle.icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 text-lg font-extrabold text-leehov-navy-950">{principle.title}</h3><p className="mt-3 text-sm leading-6 text-leehov-muted">{principle.text}</p></Card>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 text-center sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Vamos conversar</p><h2 className="mt-4 text-3xl font-extrabold text-leehov-navy-950 sm:text-[40px]">Sua próxima história pode começar em grupo</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-leehov-muted">Fale com a equipe Leehov e entenda qual caravana combina com o momento que você quer viver.</p><Button asChild size="lg" className="mt-8 rounded-full bg-leehov-blue-600 px-6 text-white"><a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer">Falar com um consultor <ArrowRight className="size-4" /></a></Button></div>
      </section>
    </main>
  );
}
