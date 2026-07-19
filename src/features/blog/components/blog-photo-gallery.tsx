"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, Images } from "lucide-react";
import { BlogPhotoLightbox } from "@/features/blog/components/blog-photo-lightbox";
import type { BlogPostImage } from "@/features/blog/types";
import { cn } from "@/lib/utils";

type BlogPhotoGalleryProps = {
  images: BlogPostImage[];
};

const VISIBLE_THUMBNAILS = 3;

export function BlogPhotoGallery({ images }: BlogPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!images.length) return null;

  const selectedImage = images[selectedIndex] ?? images[0];
  const visibleImages = images.slice(0, VISIBLE_THUMBNAILS);
  const hiddenCount = Math.max(0, images.length - VISIBLE_THUMBNAILS);
  const canGoBack = selectedIndex > 0;
  const canGoForward = selectedIndex < images.length - 1;

  function openPhoto(index: number) {
    setSelectedIndex(index);
    setOpenIndex(index);
  }

  return (
    <section className="bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-[82px]" aria-labelledby="blog-gallery-title">
      <div className="mx-auto max-w-[1312px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-600">Galeria da viagem</p>
            <h2 id="blog-gallery-title" className="mt-3 text-[32px] font-extrabold leading-[1.22] text-leehov-navy-950 sm:text-[34px]">
              Momentos que contam essa história
            </h2>
          </div>
          <p className="text-sm font-medium text-leehov-muted">Clique nas imagens para ampliar</p>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-4 lg:h-[494px] lg:flex-row lg:gap-[18px]">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:w-36 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
            {visibleImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Abrir foto ${index + 1} em tela cheia`}
                aria-current={selectedIndex === index ? "true" : undefined}
                onClick={() => openPhoto(index)}
                className={cn(
                  "relative h-24 w-32 shrink-0 overflow-hidden rounded-[9px] border-[3px] bg-leehov-surface transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none lg:h-28 lg:w-36",
                  selectedIndex === index ? "border-leehov-blue-500" : "border-transparent opacity-78 hover:opacity-100",
                )}
              >
                {failedImages[image.id] || !image.imageUrl ? (
                  <ImageOff className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-leehov-muted" aria-hidden="true" />
                ) : (
                  <Image
                    src={image.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="144px"
                    className="object-cover"
                    onError={() => setFailedImages((current) => ({ ...current, [image.id]: true }))}
                  />
                )}
              </button>
            ))}
            {hiddenCount > 0 ? (
              <button
                type="button"
                aria-label={`Ver todas as ${images.length} fotos`}
                onClick={() => openPhoto(VISIBLE_THUMBNAILS)}
                className="flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-[9px] border border-leehov-border bg-leehov-surface text-leehov-navy-950 transition hover:border-leehov-blue-500 hover:bg-leehov-sky focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none lg:h-28 lg:w-36"
              >
                <Images className="size-5 text-leehov-blue-600" aria-hidden="true" />
                <span className="text-sm font-extrabold">+{hiddenCount} Ver todas</span>
              </button>
            ) : null}
          </div>

          <div className="relative aspect-[4/3] min-h-0 flex-1 overflow-hidden rounded-2xl bg-leehov-navy-950 lg:aspect-auto">
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-leehov-blue-300"
              aria-label={`Ampliar foto ${selectedIndex + 1}: ${selectedImage.altText || "foto da viagem"}`}
              onClick={() => openPhoto(selectedIndex)}
            >
              <span className="sr-only">Ampliar foto</span>
            </button>
            {failedImages[selectedImage.id] || !selectedImage.imageUrl ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-leehov-navy-950 text-white/60">
                <ImageOff className="size-10" aria-hidden="true" />
                <span className="text-sm font-semibold">Imagem indisponível</span>
              </div>
            ) : (
              <Image
                key={selectedImage.id}
                src={selectedImage.imageUrl}
                alt={selectedImage.altText}
                fill
                unoptimized
                sizes="(min-width: 1024px) 1150px, 100vw"
                className="object-cover"
                onError={() => setFailedImages((current) => ({ ...current, [selectedImage.id]: true }))}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-leehov-navy-950/92 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
              <p className="max-w-[75%] text-sm font-semibold leading-6 sm:text-[15px]">
                {selectedImage.caption || selectedImage.altText || "Foto da viagem"}
              </p>
              <p className="text-xs font-bold text-white/72" aria-live="polite">
                {selectedIndex + 1} / {images.length}
              </p>
            </div>
            <button
              type="button"
              aria-label="Foto anterior"
              disabled={!canGoBack}
              onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
              className="absolute left-4 top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-leehov-navy-950/72 text-white backdrop-blur transition hover:bg-leehov-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              disabled={!canGoForward}
              onClick={() => setSelectedIndex((index) => Math.min(images.length - 1, index + 1))}
              className="absolute right-4 top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-leehov-navy-950/72 text-white backdrop-blur transition hover:bg-leehov-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Ampliar foto em tela cheia"
              onClick={() => openPhoto(selectedIndex)}
              className="absolute right-4 top-4 z-30 inline-flex size-10 items-center justify-center rounded-full border border-white/24 bg-leehov-navy-950/72 text-white backdrop-blur transition hover:bg-leehov-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none"
            >
              <Expand className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <BlogPhotoLightbox images={images} openIndex={openIndex} onOpenIndexChange={setOpenIndex} />
    </section>
  );
}
