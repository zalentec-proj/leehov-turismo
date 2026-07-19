"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BedDouble, MapPin, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaravanItineraryDay } from "@/features/caravans/types";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 56;

export function CaravanItineraryCarousel({ days }: { days: CaravanItineraryDay[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const pointerStart = useRef<number | null>(null);
  const activeDay = days[activeIndex];

  const select = useCallback((index: number) => {
    if (index < 0 || index >= days.length) return;
    setActiveIndex(index);
  }, [days.length]);

  if (!activeDay) {
    return <p className="rounded-[18px] border border-dashed border-[#CBE4F4] bg-white p-8 text-center text-[#5D788F]">O roteiro detalhado será divulgado em breve.</p>;
  }

  function finishSwipe(clientX: number) {
    if (pointerStart.current === null) return;
    const distance = clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    select(distance < 0 ? activeIndex + 1 : activeIndex - 1);
  }

  return (
    <div aria-label="Roteiro dia a dia" aria-roledescription="carousel" className="space-y-7">
      <div className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Escolher dia do roteiro">
        {days.map((day, index) => (
          <button
            key={day.id || `${day.day}-${index}`}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls="itinerary-active-day"
            onClick={() => select(index)}
            className={cn(
              "min-w-16 snap-start rounded-full border px-4 py-2.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none",
              index === activeIndex
                ? "border-[#0077C8] bg-[#0077C8] text-white"
                : "border-[#CBE4F4] bg-white text-[#496980] hover:border-[#0077C8] hover:text-[#0077C8]",
            )}
          >
            Dia {String(day.day).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div
        id="itinerary-active-day"
        role="tabpanel"
        tabIndex={0}
        aria-live="polite"
        className="group relative overflow-hidden rounded-[24px] border border-[#D5E7F2] bg-white shadow-[0_22px_54px_rgb(6_42_68_/_10%)] outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300 lg:grid lg:min-h-[430px] lg:grid-cols-[minmax(320px,0.92fr)_1.08fr]"
        style={{ touchAction: "pan-y" }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") select(activeIndex - 1);
          if (event.key === "ArrowRight") select(activeIndex + 1);
          if (event.key === "Home") select(0);
          if (event.key === "End") select(days.length - 1);
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) {
            pointerStart.current = null;
            return;
          }
          pointerStart.current = event.clientX;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
        onPointerCancel={() => { pointerStart.current = null; }}
      >
        <div className="relative min-h-[300px] overflow-hidden bg-[#DDEAF5] lg:min-h-full">
          {activeDay.imageUrl && !failedImages.has(activeDay.id) ? (
            <Image
              key={activeDay.id}
              src={activeDay.imageUrl}
              alt={activeDay.title}
              fill
              unoptimized={activeDay.imageUrl.startsWith("http")}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
              onError={() => setFailedImages((current) => new Set(current).add(activeDay.id))}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_25%,rgb(58_198_244_/_42%),transparent_38%),linear-gradient(145deg,#083C5A,#061A2A)]" />
          )}
          <div className="absolute left-5 top-5 flex size-14 items-center justify-center rounded-full bg-[#0077C8] text-base font-extrabold text-white shadow-lg">
            {String(activeDay.day).padStart(2, "0")}
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-leehov-blue-500">{activeDay.location || `Dia ${activeDay.day}`}</p>
          <h3 className="mt-3 text-[clamp(28px,3.2vw,42px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-leehov-text">{activeDay.title}</h3>
          <p className="mt-5 text-[16px] leading-7 text-[#5D788F]">{activeDay.description || "Os detalhes deste dia serão apresentados pela equipe Leehov."}</p>

          {(activeDay.meals.length || activeDay.accommodation) ? (
            <div className="mt-7 flex flex-col gap-3 border-t border-[#DDEAF5] pt-6 text-sm text-[#496980] sm:flex-row sm:gap-7">
              {activeDay.meals.length ? <span className="inline-flex items-center gap-2"><Utensils className="size-4 text-leehov-blue-500" />{activeDay.meals.join(", ")}</span> : null}
              {activeDay.accommodation ? <span className="inline-flex items-center gap-2"><BedDouble className="size-4 text-leehov-blue-500" />{activeDay.accommodation}</span> : null}
            </div>
          ) : null}
          {activeDay.location ? <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#244B68]"><MapPin className="size-4 text-leehov-blue-500" />{activeDay.location}</span> : null}

          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-[#668098]">{activeIndex + 1} de {days.length}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="icon" className="rounded-full border-[#9ED6EB] text-[#0077C8]" aria-label="Dia anterior" disabled={activeIndex === 0} onClick={() => select(activeIndex - 1)}><ArrowLeft className="size-4" /></Button>
              <Button type="button" size="icon" className="rounded-full bg-[#0077C8] text-white hover:bg-leehov-blue-500" aria-label="Próximo dia" disabled={activeIndex === days.length - 1} onClick={() => select(activeIndex + 1)}><ArrowRight className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs font-semibold text-[#7A91A4]">Use as setas, arraste o painel ou escolha um dia acima.</p>
    </div>
  );
}
