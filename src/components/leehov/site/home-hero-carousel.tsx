"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroSlide = {
  id: string;
  title: string;
  description: string;
  category: string;
  backgroundImage: string;
  cardImage: string;
  cardTitle: string;
  primaryHref: string;
  primaryLabel: string;
  whatsappHref: string;
};

const heroSlides: HeroSlide[] = [
  {
    id: "italia",
    title: "Itália",
    category: "História e cultura",
    description:
      "História, fé e cultura em cada detalhe. Viva viagens inesquecíveis pelos lugares mais icônicos da Itália.",
    backgroundImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/01KW5C1A7VTT5C5FVFV9GZVKND.jpg",
    cardImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/4W4PXC7M4SQVBT9VD2SDWA31PZ.jpg",
    cardTitle: "Coliseu",
    primaryHref: "/caravanas/italia-cultural",
    primaryLabel: "Ver roteiro",
    whatsappHref: "/contato",
  },
  {
    id: "santorini",
    title: "Santorini",
    category: "Viagem em grupo",
    description:
      "Mar, vilas brancas e experiências compartilhadas em um roteiro leve para viajar com tranquilidade.",
    backgroundImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/2SNJQS5KB0EFVF2967SAJZGJRE.jpg",
    cardImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/2SNJQS5KB0EFVF2967SAJZGJRE.jpg",
    cardTitle: "Santorini",
    primaryHref: "/caravanas",
    primaryLabel: "Ver destinos",
    whatsappHref: "/contato",
  },
  {
    id: "terra-santa",
    title: "Terra Santa",
    category: "Fé e memória",
    description:
      "Uma jornada acompanhada para viver lugares marcantes com contexto, cuidado e apoio próximo.",
    backgroundImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/0E8PM2ZTHHEJNGCZE08X1EK343.jpg",
    cardImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/0E8PM2ZTHHEJNGCZE08X1EK343.jpg",
    cardTitle: "Jerusalém",
    primaryHref: "/caravanas/terra-santa-completa",
    primaryLabel: "Ver roteiro",
    whatsappHref: "/contato",
  },
  {
    id: "japao",
    title: "Japão",
    category: "Cultura e tradição",
    description:
      "Templos, paisagens e convivência em grupo em um roteiro cultural com acompanhamento do início ao fim.",
    backgroundImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/4P1Y09KMHBZG2KX5Y8M5X1794D.jpg",
    cardImage:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/4P1Y09KMHBZG2KX5Y8M5X1794D.jpg",
    cardTitle: "Japão Tradicional",
    primaryHref: "/caravanas/japao-cultural",
    primaryLabel: "Ver roteiro",
    whatsappHref: "/contato",
  },
];

const desktopCardLayout = [
  {
    wrapperClassName: "w-[300px]",
    imageClassName: "h-[370px] w-[300px]",
  },
  {
    wrapperClassName: "w-[270px] pt-[18px]",
    imageClassName: "h-[350px] w-[270px]",
  },
  {
    wrapperClassName: "w-[270px] pt-[42px]",
    imageClassName: "h-[350px] w-[270px]",
  },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function HomeHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeSlide = heroSlides[activeIndex];
  const hasLongTitle =
    activeSlide.title.includes(" ") || activeSlide.title.length > 10;

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex(
      (currentIndex) =>
        (currentIndex - 1 + heroSlides.length) % heroSlides.length,
    );
  }, []);

  const visibleDesktopCards = useMemo(
    () =>
      desktopCardLayout.map((layout, offset) => {
        const slideIndex = (activeIndex + offset) % heroSlides.length;

        return {
          layout,
          slide: heroSlides[slideIndex],
          slideIndex,
        };
      }),
    [activeIndex],
  );

  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(nextSlide, 6000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, nextSlide, prefersReducedMotion]);

  return (
    <section
      aria-label="Destinos em destaque"
      aria-roledescription="carousel"
      className="relative isolate h-[850px] max-h-[100svh] min-h-[760px] overflow-hidden bg-leehov-navy-950 text-white"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
              index === activeIndex
                ? "opacity-100 motion-safe:scale-105"
                : "opacity-0 scale-100",
            )}
            style={{ backgroundImage: `url(${slide.backgroundImage})` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(190deg,rgb(255_255_255_/_0%)_-1%,rgb(8_60_90_/_68%)_38%,rgb(6_26_42_/_96%)_81%)] mix-blend-multiply" />
      <div className="absolute inset-0 bg-leehov-navy-950/20" />
      <div className="absolute left-1/2 top-[96px] h-[520px] w-[760px] -translate-x-1/3 rounded-full bg-[radial-gradient(circle,rgb(58_198_244_/_24%)_0%,rgb(12_168_232_/_12%)_42%,rgb(6_26_42_/_0%)_70%)]" />

      <div className="relative mx-auto h-full max-w-[1313px] px-5 sm:px-8 xl:px-0">
        <div className="absolute left-5 top-[176px] max-w-[560px] sm:left-8 sm:top-[220px] lg:top-[305px] xl:left-[56px]">
          <div key={activeSlide.id} aria-live="polite">
            <div className="relative -top-6 sm:-top-8 lg:-top-10 xl:-top-12">
              <p className="mb-5 text-[12px] font-extrabold uppercase leading-4 tracking-[0.16em] text-leehov-blue-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
                {activeSlide.category}
              </p>
              <h1
                className={cn(
                  "max-w-[560px] text-balance break-words font-extrabold leading-[0.92] tracking-normal text-white motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-700",
                  hasLongTitle
                    ? "text-[clamp(52px,6vw,88px)]"
                    : "text-[clamp(56px,8vw,104px)]",
                )}
              >
                {activeSlide.title}
              </h1>
              <p className="mt-7 max-w-[520px] text-[18px] font-medium leading-[31px] text-white/88 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-5 motion-safe:delay-100 motion-safe:duration-700 sm:text-[19px]">
                {activeSlide.description}
              </p>
            </div>
            <div className="mt-9 flex flex-col gap-[18px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:delay-200 motion-safe:duration-700 sm:flex-row">
              <Button asChild className="h-[58px] w-[190px] rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 text-[16px] font-extrabold text-white shadow-[0_14px_26px_rgb(8_117_205_/_30%)] hover:from-leehov-blue-500 hover:to-leehov-blue-600">
                <Link href={activeSlide.primaryHref}>
                  {activeSlide.primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-[58px] w-[210px] rounded-full border-white/55 bg-white/5 text-[16px] font-extrabold text-white hover:bg-white/12 hover:text-white">
                <Link href={activeSlide.whatsappHref}>
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              aria-label="Destino anterior"
              className="size-10 rounded-full border border-white/40 bg-white/8 text-white hover:bg-white/16 hover:text-white"
              onClick={prevSlide}
              size="icon"
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              aria-label="Próximo destino"
              className="size-10 rounded-full border border-white/40 bg-white/8 text-white hover:bg-white/16 hover:text-white"
              onClick={nextSlide}
              size="icon"
              type="button"
              variant="outline"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="ml-2 flex items-center gap-2" aria-hidden="true">
              {heroSlides.map((slide, index) => (
                <span
                  key={slide.id}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    index === activeIndex
                      ? "h-2 w-7 bg-leehov-blue-300"
                      : "size-2 bg-white/38",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-[54%] top-[196px] hidden items-start gap-[34px] lg:flex xl:left-[660px]">
          {visibleDesktopCards.map(({ layout, slide, slideIndex }) => (
            <button
              key={`${activeSlide.id}-${slide.id}`}
              aria-label={`Mostrar destino ${slide.title}`}
              aria-pressed={slideIndex === activeIndex}
              className={cn(
                "pointer-events-auto flex shrink-0 flex-col gap-3 text-left text-white transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-leehov-navy-950 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-700",
                layout.wrapperClassName,
              )}
              onClick={() => goToSlide(slideIndex)}
              type="button"
            >
              <div
                className={cn(
                  "text-[16px] font-extrabold leading-[18px] transition-colors",
                  slideIndex === activeIndex ? "text-white" : "text-white/76",
                )}
              >
                <p>{slide.cardTitle}</p>
                <p className="tracking-[0.08em]">★★★★★</p>
              </div>
              <div
                className={cn(
                  "relative overflow-hidden rounded-[18px] border bg-cover bg-center shadow-xl shadow-black/20 transition-[border-color,box-shadow,opacity,transform] duration-300",
                  slideIndex === activeIndex
                    ? "scale-[1.03] border-white/60 opacity-100 shadow-2xl shadow-black/30"
                    : "scale-100 border-white/20 opacity-80 hover:border-white/35 hover:opacity-95",
                  layout.imageClassName,
                )}
                style={{ backgroundImage: `url(${slide.cardImage})` }}
              >
                {slideIndex === activeIndex ? (
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/35 to-transparent" />
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <div className="absolute inset-x-5 bottom-9 lg:hidden">
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`Mostrar destino ${slide.title}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "flex min-w-[210px] items-center gap-3 rounded-[18px] border bg-white/10 p-2 text-left backdrop-blur-md transition",
                  index === activeIndex
                    ? "border-white/55 shadow-xl shadow-black/25"
                    : "border-white/16 opacity-80",
                )}
                onClick={() => goToSlide(index)}
                type="button"
              >
                <span
                  className="h-16 w-16 shrink-0 rounded-[14px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.cardImage})` }}
                />
                <span>
                  <span className="block text-[13px] font-extrabold leading-4 text-white">
                    {slide.cardTitle}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
                    {slide.category}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
