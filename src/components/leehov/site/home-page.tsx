import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Headphones,
  Mail,
  Plane,
  Play,
  ShoppingBag,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/leehov/shared/section-heading";
import { HomeAboutLeehovSection } from "@/components/leehov/site/home-about-leehov-section";
import { HomeHeroCarousel } from "@/components/leehov/site/home-hero-carousel";
import type { BlogPostSummary } from "@/features/blog/types";
import type { CaravanDetail, CaravanSummary } from "@/features/caravans/types";
import type { TestimonialSummary } from "@/features/testimonials/types";
import { NewsletterSignup } from "@/features/newsletter/components/newsletter-signup";
import { TestimonialsCarousel } from "@/features/testimonials/components/testimonials-carousel";
import type { HomeSettings } from "@/features/settings/types";

type HomePageProps = {
  caravans: CaravanSummary[];
  heroCaravans: CaravanDetail[];
  posts: BlogPostSummary[];
  testimonials: TestimonialSummary[];
  homeSettings: HomeSettings;
};

const benefits = [
  {
    icon: ShieldCheck,
    title: "Segurança e Confiança",
    text: "Seguimos os mais altos padrões de segurança para sua tranquilidade antes, durante e depois da viagem.",
  },
  {
    icon: UsersRound,
    title: "Viagens Personalizadas",
    text: "Roteiros feitos para o seu estilo, com atendimento próximo e consultores especialistas em cada detalhe.",
  },
  {
    icon: Headphones,
    title: "Atendimento Premiado",
    text: "Suporte dedicado antes, durante e após a viagem, sempre que você precisar.",
  },
  {
    icon: Globe2,
    title: "Experiências Únicas",
    text: "Destinos incríveis, parceiros selecionados e vivências que ficam na memória para sempre.",
  },
  {
    icon: ShoppingBag,
    title: "Tudo em um só lugar",
    text: "Passagens, hospedagens, traslados, passeios e seguros: praticidade e economia para aproveitar mais.",
  },
];

const newsletterImage = "/images/leehov/about-island.jpg";

export function HomePage({ caravans, heroCaravans, posts, testimonials, homeSettings }: HomePageProps) {
  return (
    <>
      <HomeHeroCarousel caravans={heroCaravans} />

      <section className="relative z-10 -mt-5 rounded-t-[28px] bg-[#f9fcff] px-5 pb-14 pt-[126px] sm:px-8 lg:px-12 xl:px-[112px]">
        <div className="mx-auto max-w-[1313px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[620px]">
              <p className="text-[13px] font-black uppercase leading-[13px] tracking-[0.08em] text-leehov-blue-500">
                Viagens incríveis
              </p>
              <h2 className="mt-[18px] text-[40px] font-extrabold leading-[46px] tracking-normal text-[#153b5b] sm:text-[48px] sm:leading-[54px]">
                Caravanas em destaque
              </h2>
              <p className="mt-[18px] max-w-[620px] text-[16px] font-normal leading-[26px] text-[#6d879d]">
                Viagens em grupo selecionadas para você explorar cada destino com organização, segurança e acompanhamento próximo.
              </p>
            </div>
            <Button asChild variant="link" className="h-auto p-0 text-[15px] font-extrabold leading-[18px] text-leehov-blue-500 hover:text-leehov-blue-600">
              <Link href="/caravanas">
                Ver todas as caravanas
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {caravans.map((route) => (
              <Link
                key={route.id}
                href={`/caravanas/${route.slug}`}
                className="group flex h-[420px] overflow-hidden rounded-[16px] border border-[#d7e7f5] bg-white shadow-[0_10px_28px_rgb(13_54_83_/_8%)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgb(13_54_83_/_12%)]"
              >
                <article className="flex w-full flex-col">
                  <div className="relative h-[250px] shrink-0 overflow-hidden bg-leehov-surface">
                    {route.imageUrl ? <Image src={route.imageUrl} alt={`Imagem da caravana ${route.title}`} fill unoptimized sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none" /> : null}
                    <span className="absolute left-4 top-4 rounded-full bg-leehov-blue-500 px-3 py-2 text-[12px] font-bold leading-4 text-white">
                      Grupo Acompanhado
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-[14px] px-[22px] pb-[18px] pt-[22px]">
                    <h3 className="text-[20px] font-extrabold leading-6 tracking-normal text-[#102f4d]">
                      {route.title}
                    </h3>
                    <p className="text-[14px] font-normal leading-[18px] text-[#7891a8]">
                      {route.duration} | {route.category?.name ?? "Caravana"}
                    </p>
                    <p className="text-[18px] font-extrabold leading-[22px] text-[#0a9fe3]">
                      {route.price ?? "Sob consulta"}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {!caravans.length ? <Card className="mt-12 rounded-[18px] border-leehov-border p-8 text-center text-leehov-muted">Novas caravanas serão publicadas em breve.</Card> : null}
          <div className="mt-14 flex justify-center gap-3" aria-hidden="true">
            <span className="size-[13px] rounded-full bg-leehov-blue-500" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
          </div>
        </div>
      </section>

      <section className="bg-[#f9fcff] px-5 py-20 sm:px-8 lg:px-12 xl:px-[112px]">
        <div className="mx-auto grid max-w-[1313px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-leehov-blue-500">Viaje com quem cuida</p>
            <h2 className="mt-4 text-[38px] font-extrabold leading-tight text-leehov-navy-950 sm:text-[48px]">A experiência Leehov começa antes do embarque</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-leehov-muted">Planejamento, orientação e presença humana para que o grupo viva cada destino com confiança.</p>
            <Button asChild variant="outline" size="lg" className="mt-7 rounded-full px-6"><Link href="/quem-somos">Conheça nosso jeito de viajar <ArrowRight className="size-4" /></Link></Button>
          </div>
          <a href={homeSettings.videoUrl || "/quem-somos"} target={homeSettings.videoUrl ? "_blank" : undefined} rel={homeSettings.videoUrl ? "noreferrer" : undefined} className="group relative aspect-video overflow-hidden rounded-[24px] bg-leehov-navy-950 shadow-leehov-floating focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300">
            <Image src="/images/leehov/hero-fallback.jpg" alt="Grupo viajando com a Leehov" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover opacity-72 transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" />
            <span className="absolute inset-0 bg-gradient-to-t from-leehov-navy-950/65 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center"><span className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/16 text-white backdrop-blur transition group-hover:scale-105 group-hover:bg-white/24 motion-reduce:transition-none"><Play className="ml-1 size-6 fill-white" aria-hidden="true" /></span></span>
            <span className="absolute inset-x-0 bottom-0 p-6 text-sm font-bold text-white">{homeSettings.videoUrl ? "Assistir ao vídeo institucional" : "Conhecer a história da Leehov"}</span>
          </a>
        </div>
      </section>

      <HomeAboutLeehovSection />

      <section className="bg-leehov-surface px-5 py-[88px] sm:px-8 lg:px-12 xl:px-[112px]">
        <div className="mx-auto max-w-[1313px]">
          <div className="max-w-[720px]">
            <p className="text-[13px] font-black uppercase leading-[13px] tracking-[0.08em] text-leehov-blue-500">
              <span className="mr-3 inline-block size-2.5 rounded-full bg-leehov-blue-500 align-middle" />
              Diferenciais Leehov
            </p>
            <h2 className="mt-[26px] text-[40px] font-extrabold leading-[46px] tracking-normal text-[#102f4d] sm:text-[52px] sm:leading-[62px]">
              Por que viajar com a Leehov?
            </h2>
            <p className="mt-[22px] max-w-[680px] text-[17px] font-normal leading-[31px] text-[#627b91]">
              Muito mais que destinos, entregamos confiança, cuidado e experiências feitas sob medida para você viver o melhor da sua jornada.
            </p>
          </div>

          <div className="mt-[68px] grid gap-7 sm:grid-cols-2 lg:grid-cols-5 lg:gap-9">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="flex min-h-[317px] flex-col items-center rounded-[16px] border border-[#d6e7f5] bg-white px-[30px] pb-[30px] pt-[36px] text-center shadow-[0_18px_46px_rgb(6_42_68_/_6%)]"
              >
                <div className="flex size-[42px] items-center justify-center rounded-full bg-leehov-blue-600 text-white">
                  <benefit.icon
                    aria-hidden="true"
                    className="size-[25px] stroke-[2.2]"
                  />
                </div>
                <h3 className="mt-[22px] min-h-[42px] text-[18px] font-extrabold leading-5 tracking-normal text-[#123e66]">
                  {benefit.title}
                </h3>
                <p className="mt-[20px] flex-1 text-[14px] font-normal leading-[22px] text-[#627b91]">
                  {benefit.text}
                </p>
                <span aria-hidden="true" className="mt-[20px] h-[3px] w-[52px] rounded-full bg-leehov-blue-500" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leehov-surface px-5 pb-[72px] pt-0 sm:px-8 lg:px-12 xl:px-11">
        <div className="mx-auto max-w-[1449px]">
          <div className="relative min-h-[300px] overflow-hidden rounded-[16px] bg-[linear-gradient(90deg,#082b46_0%,#0b5772_50%,#07253d_100%)] shadow-[0_22px_54px_rgb(6_42_68_/_10%)]">
            <Image src={newsletterImage} alt="Ilha tropical vista do alto" fill sizes="(min-width: 1024px) 1450px, 1px" className="hidden object-cover object-center lg:block" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#062a44_0%,#062a44_31%,rgb(6_42_68_/_92%)_43%,rgb(6_42_68_/_56%)_58%,rgb(6_26_42_/_18%)_76%,rgb(6_26_42_/_4%)_100%)]" />
            <svg
              aria-hidden="true"
              className="absolute right-[5.5%] top-[90px] hidden h-[120px] w-[500px] text-white/58 [mask-image:linear-gradient(90deg,transparent_0%,black_10%,black_96%,transparent_100%)] lg:block"
              viewBox="0 0 500 120"
              fill="none"
            >
              <path
                d="M8 88C92 18 157 18 214 62C266 102 311 96 359 64C405 34 452 42 488 75"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="3 10"
              />
            </svg>
            <Plane
              aria-hidden="true"
              className="absolute right-[5.55%] top-[155px] hidden size-5 rotate-[-18deg] fill-white text-white lg:block"
            />

            <div className="relative z-10 flex min-h-[300px] flex-col gap-8 px-6 py-10 sm:px-10 md:flex-row md:items-center md:gap-[46px] lg:px-[96px]">
              <div className="flex size-[78px] shrink-0 items-center justify-center rounded-full border-2 border-[#33c1f1] text-[#beefff]">
                <Mail aria-hidden="true" className="size-[34px] stroke-[1.8]" />
              </div>

              <div className="max-w-[560px]">
                <p className="text-[12px] font-black uppercase leading-4 tracking-[0.12em] text-[#5ed9ff]">
                  Receba o melhor do mundo no seu e-mail
                </p>
                <h2 className="mt-[18px] max-w-[560px] text-[27px] font-extrabold leading-[36px] tracking-normal text-white sm:text-[31px] sm:leading-[40px]">
                  Novos destinos, ofertas exclusivas e dicas de viagem selecionadas especialmente para você.
                </h2>

                <div className="mt-[22px]"><NewsletterSignup source="home" variant="banner" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsCarousel testimonials={testimonials} eyebrow={homeSettings.testimonialsEyebrow} title={homeSettings.testimonialsTitle} />

      {posts.length ? <section className="bg-leehov-surface px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Inspirações"
            title="Conteúdos para planejar melhor"
            action={
              <Button asChild variant="link" className="text-leehov-blue-600">
                <Link href="/blog">Ver blog</Link>
              </Button>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[18px] border border-leehov-border bg-white shadow-leehov-card">
                <div className="relative h-48 overflow-hidden bg-leehov-surface">{post.imageUrl ? <Image src={post.imageUrl} alt={post.coverAltText} fill unoptimized sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none" /> : null}</div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
                    {post.category}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-leehov-navy-950">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-leehov-muted">
                    {post.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section> : null}
    </>
  );
}
