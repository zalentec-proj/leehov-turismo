import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Headphones,
  LockKeyhole,
  Mail,
  Plane,
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
import type { CaravanSummary } from "@/features/caravans/types";
import type { TestimonialSummary } from "@/features/testimonials/types";

type HomePageProps = {
  caravans: CaravanSummary[];
  posts: BlogPostSummary[];
  testimonials: TestimonialSummary[];
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

const featuredRoutes = [
  {
    title: "Croácia & Ilhas Maur",
    meta: "12 dias | Relaxamento",
    price: "R$ 6.490",
    href: "/caravanas",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/37HBAT0TVYZ628ZWNXN29RCRCC.jpg",
  },
  {
    title: "Caminho de Santiago",
    meta: "15 dias | Religioso",
    price: "R$ 8.290",
    href: "/caravanas",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/2ADP4EQSJSGKBN5NBGTF74231Z.jpg",
  },
  {
    title: "Dubai & Abu Dhabi",
    meta: "8 dias | Luxo",
    price: "R$ 7.260",
    href: "/caravanas",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/6ZXSJJRGRJ14R1EHMX4HXGMG88.jpg",
  },
  {
    title: "Japão Tradicional",
    meta: "14 dias | Cultura",
    price: "R$ 11.420",
    href: "/caravanas/japao-cultural",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/4P1Y09KMHBZG2KX5Y8M5X1794D.jpg",
  },
];

const newsletterImage =
  "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/3SYAZSGFBPCFY23EG7M0JXXTV4.jpg";

export function HomePage({ posts, testimonials }: HomePageProps) {
  return (
    <>
      <HomeHeroCarousel />

      <section className="relative z-10 -mt-5 rounded-t-[28px] bg-[#f9fcff] px-5 pb-14 pt-[126px] sm:px-8 lg:px-12 xl:px-[112px]">
        <div className="mx-auto max-w-[1313px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[620px]">
              <p className="text-[13px] font-black uppercase leading-[13px] tracking-[0.08em] text-leehov-blue-500">
                Viagens incríveis
              </p>
              <h2 className="mt-[18px] text-[40px] font-extrabold leading-[46px] tracking-normal text-[#153b5b] sm:text-[48px] sm:leading-[54px]">
                Roteiros em destaque
              </h2>
              <p className="mt-[18px] max-w-[620px] text-[16px] font-normal leading-[26px] text-[#6d879d]">
                Seleção especial de roteiros para você explorar o melhor de cada destino com conforto, segurança e experiências únicas.
              </p>
            </div>
            <Button asChild variant="link" className="h-auto p-0 text-[15px] font-extrabold leading-[18px] text-leehov-blue-500 hover:text-leehov-blue-600">
              <Link href="/caravanas">
                Ver todos os roteiros
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {featuredRoutes.map((route) => (
              <Link
                key={route.title}
                href={route.href}
                className="group flex h-[420px] overflow-hidden rounded-[16px] border border-[#d7e7f5] bg-white shadow-[0_10px_28px_rgb(13_54_83_/_8%)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgb(13_54_83_/_12%)]"
              >
                <article className="flex w-full flex-col">
                  <div className="relative h-[250px] shrink-0 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${route.imageUrl})` }}
                      role="img"
                      aria-label={`Imagem do roteiro ${route.title}`}
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-leehov-blue-500 px-3 py-2 text-[12px] font-bold leading-4 text-white">
                      Grupo Acompanhado
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-[14px] px-[22px] pb-[18px] pt-[22px]">
                    <h3 className="text-[20px] font-extrabold leading-6 tracking-normal text-[#102f4d]">
                      {route.title}
                    </h3>
                    <p className="text-[14px] font-normal leading-[18px] text-[#7891a8]">
                      {route.meta}
                    </p>
                    <p className="text-[18px] font-extrabold leading-[22px] text-[#0a9fe3]">
                      {route.price}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="mt-14 flex justify-center gap-3" aria-hidden="true">
            <span className="size-[13px] rounded-full bg-leehov-blue-500" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
            <span className="mt-0.5 size-2 rounded-full bg-[#d6e6f2]" />
          </div>
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
                <span
                  aria-hidden="true"
                  className="mt-[20px] h-[3px] w-[52px] rounded-full bg-leehov-blue-500"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leehov-surface px-5 pb-[72px] pt-0 sm:px-8 lg:px-12 xl:px-11">
        <div className="mx-auto max-w-[1449px]">
          <div className="relative min-h-[300px] overflow-hidden rounded-[16px] bg-[linear-gradient(90deg,#082b46_0%,#0b5772_50%,#07253d_100%)] shadow-[0_22px_54px_rgb(6_42_68_/_10%)]">
            <div
              className="absolute inset-0 hidden bg-cover bg-center lg:block"
              style={{ backgroundImage: `url(${newsletterImage})` }}
              role="img"
              aria-label="Ilha tropical vista do alto"
            />
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

                <form
                  className="mt-[22px] flex max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-0"
                  aria-label="Inscrição na newsletter"
                >
                  <label className="sr-only" htmlFor="newsletter-email">
                    Seu melhor e-mail
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="h-11 w-full rounded-full border border-white/16 bg-[#073654] px-[22px] text-[13px] leading-4 text-white placeholder:text-[#98b5c8] outline-none transition focus:border-leehov-blue-300 sm:w-[314px] sm:rounded-r-none"
                  />
                  <button
                    type="button"
                    className="h-11 rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 px-8 text-[13px] font-extrabold leading-4 whitespace-nowrap text-white shadow-[0_10px_20px_rgb(8_117_205_/_30%)] transition hover:from-leehov-blue-500 hover:to-leehov-blue-600 sm:-ml-6 sm:w-[172px]"
                  >
                    Quero receber
                  </button>
                </form>

                <p className="mt-4 flex flex-wrap items-center gap-2 text-[12px] leading-4 text-white/72">
                  <LockKeyhole
                    aria-hidden="true"
                    className="size-4 fill-white text-white"
                  />
                  Prometemos não enviar spam.
                  <Link
                    href="/politica-de-privacidade"
                    className="underline underline-offset-2 transition hover:text-white"
                  >
                    Política de Privacidade
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Avaliado por viajantes"
            title="Depoimentos"
            description="Cards preparados para combinar depoimentos manuais e Google Reviews cacheados."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="rounded-[18px] border-leehov-border p-7 shadow-leehov-card">
                <div className="mb-4 text-sm font-bold text-leehov-blue-600">
                  {"★".repeat(testimonial.rating)}
                </div>
                <p className="text-sm leading-7 text-leehov-text">
                  {testimonial.text}
                </p>
                <div className="mt-6">
                  <p className="font-bold text-leehov-navy-950">{testimonial.name}</p>
                  <p className="text-sm text-leehov-muted">{testimonial.city}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-leehov-surface px-5 py-24 sm:px-8 lg:px-12">
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
                <div
                  className="h-48 bg-cover bg-center transition group-hover:scale-105"
                  style={{ backgroundImage: `url(${post.imageUrl})` }}
                />
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
      </section>
    </>
  );
}
