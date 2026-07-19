"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Globe2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const aboutImages = {
  rio: "/images/leehov/about-rio.jpg",
  santorini: "/images/leehov/about-santorini.jpg",
  island: "/images/leehov/about-island.jpg",
};

const metrics = [
  {
    icon: UserRoundCheck,
    value: "+15",
    label: "Anos de história",
  },
  {
    icon: UsersRound,
    value: "+5.000",
    label: "Clientes viajantes",
  },
  {
    icon: Globe2,
    value: "+120",
    label: "Destinos no mundo",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Segurança e dedicação",
  },
];

function getSegmentProgress(value: number, start: number, end: number) {
  const clamped = Math.min(1, Math.max(0, (value - start) / (end - start)));

  return clamped * clamped * (3 - 2 * clamped);
}

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

export function HomeAboutLeehovSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageCardsProgress, setImageCardsProgress] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let frameId = 0;

    const updateProgress = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        const section = sectionRef.current;

        if (!section) {
          frameId = 0;
          return;
        }

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const start = viewportHeight * 0.66;
        const end = viewportHeight * 0.02;
        const imageCardsStart = viewportHeight * 1.22;
        const imageCardsEnd = viewportHeight * 0.18;
        const nextProgress = Math.min(
          1,
          Math.max(0, (start - rect.top) / (start - end)),
        );
        const nextImageCardsProgress = Math.min(
          1,
          Math.max(
            0,
            (imageCardsStart - rect.top) / (imageCardsStart - imageCardsEnd),
          ),
        );

        setScrollProgress(Number(nextProgress.toFixed(3)));
        setImageCardsProgress(Number(nextImageCardsProgress.toFixed(3)));
        frameId = 0;
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsTextVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -26% 0px",
        threshold: 0.28,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const effectiveProgress = prefersReducedMotion ? 1 : scrollProgress;
  const effectiveImageCardsProgress = prefersReducedMotion
    ? 1
    : imageCardsProgress;
  const textIsVisible = prefersReducedMotion || isTextVisible;
  const textEntranceClass = (delayClassName = "") =>
    cn(
      "transition-[opacity,transform] duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
      textIsVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      delayClassName,
    );
  const easedProgress =
    effectiveProgress * effectiveProgress * (3 - 2 * effectiveProgress);
  const imageCardScrollStyle = ({
    start,
    end,
    x,
    y = 0,
    rotate,
  }: {
    start: number;
    end: number;
    x: number;
    y?: number;
    rotate: number;
  }) => {
    const cardProgress = prefersReducedMotion
      ? 1
      : getSegmentProgress(effectiveImageCardsProgress, start, end);

    return {
      transform: `translate3d(${(1 - cardProgress) * x}px, ${
        (1 - cardProgress) * y
      }px, 0) rotate(${(1 - cardProgress) * rotate}deg)`,
      transformOrigin: "center right",
    };
  };
  const planeTransform = prefersReducedMotion
    ? "translate3d(0, 0, 0) rotate(-1.5deg)"
    : `translate3d(${(1 - easedProgress) * -1120}px, ${
        (1 - easedProgress) * 96
      }px, 0) rotate(${-11 + easedProgress * 9.5}deg)`;

  return (
    <section
      ref={sectionRef}
      className="overflow-x-clip bg-leehov-surface px-5 pb-[72px] pt-6 sm:px-8 lg:px-8"
    >
      <div className="relative mx-auto min-h-[900px] max-w-[1473px] overflow-visible rounded-[20px] bg-[linear-gradient(180deg,#fbfdff_0%,#f2f9ff_100%)] px-6 py-16 sm:px-10 lg:min-h-[980px] lg:px-[100px] lg:py-[116px]">
        <div className="relative z-30 flex max-w-[610px] flex-col gap-[26px]">
          <p
            className={cn(
              "text-[13px] font-black uppercase leading-[13px] tracking-[0.08em] text-leehov-blue-500",
              textEntranceClass(),
            )}
          >
            <span className="mr-3 inline-block size-2.5 rounded-full bg-leehov-blue-500 align-middle" />
            Conheça a Leehov
          </p>
          <h2
            className={cn(
              "text-[42px] font-extrabold leading-[48px] tracking-normal text-[#102f4d] sm:text-[58px] sm:leading-[64px]",
              textEntranceClass("delay-75"),
            )}
          >
            Sobre a Leehov
          </h2>
          <p
            className={cn(
              "max-w-[610px] text-[18px] font-medium leading-[31px] text-[#425e76]",
              textEntranceClass("delay-150"),
            )}
          >
            A Leehov Turismo nasceu com o propósito de transformar viagens em
            experiências memoráveis e sem preocupações.
          </p>
          <p
            className={cn(
              "max-w-[610px] text-[16px] leading-[28px] text-[#627b91]",
              textEntranceClass("delay-200"),
            )}
          >
            Somos especialistas em conectar pessoas, destinos e culturas,
            combinando planejamento inteligente, atendimento próximo e roteiros
            que superam expectativas.
          </p>

          <div className="grid gap-5 pt-4 sm:grid-cols-2 lg:flex lg:gap-[42px] lg:pt-7">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={cn(
                  "min-w-0",
                  index > 0 &&
                    "lg:border-l lg:border-[#d7e7f5] lg:pl-[30px]",
                  textEntranceClass(
                    [
                      "delay-300",
                      "delay-[360ms]",
                      "delay-[420ms]",
                      "delay-[480ms]",
                    ][index],
                  ),
                )}
              >
                <metric.icon
                  aria-hidden="true"
                  className="mb-2 size-9 stroke-[1.8] text-[#169fe2]"
                />
                <p className="text-[22px] font-extrabold leading-7 text-[#143c5e]">
                  {metric.value}
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-4 text-[#6d879d]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          <Button
            asChild
            className={cn(
              "mt-2 h-[58px] w-[220px] rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 text-[15px] font-extrabold text-white shadow-[0_14px_26px_rgb(8_117_205_/_22%)] hover:from-leehov-blue-500 hover:to-leehov-blue-600",
              textEntranceClass("delay-[560ms]"),
            )}
          >
            <Link href="/quem-somos">
              Saiba mais sobre nós
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="pointer-events-none relative z-20 mt-14 h-[560px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
          <div
            className="absolute left-[8%] top-0 h-[430px] w-[72%] will-change-transform sm:left-[20%] sm:w-[420px] lg:left-auto lg:right-[190px] lg:top-[92px] lg:h-[690px] lg:w-[480px]"
            style={imageCardScrollStyle({
              start: 0,
              end: 0.72,
              x: 1180,
              y: 18,
              rotate: 3.5,
            })}
          >
            <div className="leehov-about-float relative h-full w-full overflow-hidden rounded-[20px] shadow-[0_22px_54px_rgb(6_42_68_/_12%)]"><Image src={aboutImages.rio} alt="Viajante observando a paisagem do Rio de Janeiro" fill sizes="(min-width: 1024px) 480px, 72vw" className="object-cover" /></div>
          </div>

          <div
            className="absolute right-[3%] top-[54px] h-[190px] w-[46%] will-change-transform sm:right-[12%] sm:w-[250px] lg:right-[72px] lg:top-[170px] lg:h-[230px] lg:w-[260px]"
            style={imageCardScrollStyle({
              start: 0.28,
              end: 0.88,
              x: 720,
              y: -18,
              rotate: 4,
            })}
          >
            <div className="leehov-about-float-delay relative h-full w-full overflow-hidden rounded-[16px] border border-white/70 shadow-[0_12px_28px_rgb(0_75_120_/_18%)]"><Image src={aboutImages.santorini} alt="Casas brancas e cúpulas azuis em Santorini" fill sizes="260px" className="object-cover" /></div>
          </div>

          <div
            className="absolute right-[7%] top-[312px] h-[180px] w-[43%] will-change-transform sm:right-[15%] sm:w-[230px] lg:right-[75px] lg:top-[528px] lg:h-[220px] lg:w-[230px]"
            style={imageCardScrollStyle({
              start: 0.48,
              end: 1,
              x: 760,
              y: 22,
              rotate: -4,
            })}
          >
            <div className="leehov-about-float-soft relative h-full w-full overflow-hidden rounded-[16px] border border-white/70 shadow-[0_12px_28px_rgb(0_75_120_/_18%)]"><Image src={aboutImages.island} alt="Ilha tropical com água cristalina" fill sizes="230px" className="object-cover" /></div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[320px] bg-[linear-gradient(180deg,rgb(246_251_255_/_0%)_0%,rgb(235_247_255_/_78%)_56%,rgb(255_255_255_/_92%)_100%)]" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[300px] opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 72%, rgb(255 255 255 / 72%) 0 12%, transparent 23%), radial-gradient(circle at 36% 90%, rgb(255 255 255 / 78%) 0 16%, transparent 30%), radial-gradient(circle at 68% 82%, rgb(255 255 255 / 68%) 0 13%, transparent 28%), radial-gradient(circle at 88% 70%, rgb(255 255 255 / 72%) 0 12%, transparent 26%)",
          }}
        />

        <svg
          aria-hidden="true"
          className="leehov-route-dash pointer-events-none absolute bottom-[42px] left-1/2 z-20 h-[310px] w-[1080px] max-w-none -translate-x-1/2 lg:left-[34px] lg:w-[1390px] lg:translate-x-0"
          viewBox="0 0 1390 310"
          fill="none"
        >
          <path
            d="M36 72C150 35 188 84 174 178C160 268 302 262 408 224C552 172 678 252 832 224C1002 194 1086 158 1202 218C1282 258 1304 300 1360 276"
            stroke="#0875CD"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="9 11"
          />
        </svg>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[246px] left-7 z-20 size-11 -rotate-[23deg]"
          viewBox="0.008 17.778 43 44"
          fill="none"
        >
          <defs>
            <linearGradient
              id="about-map-pin-gradient"
              x1="8"
              y1="4"
              x2="44"
              y2="58"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#35D0F5" />
              <stop offset="1" stopColor="#0875CD" />
            </linearGradient>
          </defs>
          <path
            d="M21.5 59.871s16.538-15.897 16.539-26.968A14.194 16.538 90 1 0 4.962 32.903c0 11.071 16.538 26.968 16.538 26.968z"
            fill="url(#about-map-pin-gradient)"
          />
          <circle cx="21.5" cy="32.903" r="4.968" fill="#FFFFFF" />
        </svg>

        <div className="pointer-events-none absolute bottom-[132px] -left-[12%] z-40 w-[760px] max-w-[108vw] sm:-left-[4%] lg:left-[2%] lg:w-[860px] xl:bottom-[116px] xl:left-6 xl:w-[980px]">
          <Image
            src="/images/leehov-plane.png"
            alt=""
            width={978}
            height={339}
            sizes="(min-width: 1280px) 980px, (min-width: 1024px) 860px, 108vw"
            className="h-auto w-full drop-shadow-[0_20px_28px_rgb(8_55_90_/_22%)] will-change-transform"
            style={{
              transform: planeTransform,
            }}
            priority={false}
          />
        </div>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-12 right-6 z-20 size-[72px] rotate-[23deg]"
          viewBox="0 0 72 72"
          fill="none"
        >
          <path
            d="M60.5 35.6c2.2.9 3.7 2.2 3.5 3.4-.3 1.8-3.7 2.4-7.4 1.4L43.2 37l-12 19.3-5.6-1.5 5.2-21.1-13.5-3.5-7 7.4-4.4-1.2 4.2-11.5-9.1-7.6 4.4-1.2 10.5 3.8 13.5 3.5 5.9-20.9 5.5 1.5.9 22.7 13.4 3.5c2 .5 3.9 1 5.4 1.4z"
            fill="#0875CD"
          />
        </svg>
      </div>
    </section>
  );
}
