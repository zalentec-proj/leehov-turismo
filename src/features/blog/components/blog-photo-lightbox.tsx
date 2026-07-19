"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import type { BlogPostImage } from "@/features/blog/types";
import { getBlogGallerySwipeTarget } from "@/features/blog/gallery";
import { cn } from "@/lib/utils";

type BlogPhotoLightboxProps = {
  images: BlogPostImage[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
};

function PhotoFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0B1A25] text-white/58", className)}>
      <ImageOff className="size-9" aria-hidden="true" />
      <span className="text-sm font-semibold">Imagem indisponível</span>
    </div>
  );
}

export function BlogPhotoLightbox({ images, openIndex, onOpenIndexChange }: BlogPhotoLightboxProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const currentIndex = openIndex ?? 0;
  const currentImage = images[currentIndex];
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < images.length - 1;

  const select = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return;
    onOpenIndexChange(index);
  }, [images.length, onOpenIndexChange]);

  useEffect(() => {
    if (openIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (canGoBack) select(currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (canGoForward) select(currentIndex + 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        select(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        select(images.length - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoBack, canGoForward, currentIndex, images.length, openIndex, select]);

  if (!images.length || !currentImage) return null;

  return (
    <DialogPrimitive.Root open={openIndex !== null} onOpenChange={(open) => !open && onOpenIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-[#030E18]/95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby="blog-photo-lightbox-description"
          className="fixed inset-0 z-[101] flex flex-col overflow-hidden p-4 text-white outline-none sm:p-6 lg:p-8"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenIndexChange(null);
          }}
          onPointerDownOutside={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-lightbox-control]")) event.preventDefault();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Galeria de fotos do artigo</DialogPrimitive.Title>
          <DialogPrimitive.Description id="blog-photo-lightbox-description" className="sr-only">
            Use as setas do teclado para navegar e Escape para fechar.
          </DialogPrimitive.Description>

          <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between gap-5 pb-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold sm:text-base">
                  {currentImage.caption || currentImage.altText || "Foto da viagem"}
                </p>
                <p className="mt-1 text-xs text-white/58 sm:hidden">
                  {currentIndex + 1} de {images.length}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="hidden text-sm font-semibold text-white/70 sm:block" aria-live="polite">
                  {currentIndex + 1} de {images.length}
                </p>
                <DialogPrimitive.Close
                  data-lightbox-control
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none"
                  aria-label="Fechar galeria"
                >
                  <X className="size-5" aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>
            </header>

            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-black"
              onTouchStart={(event) => {
                event.stopPropagation();
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                event.stopPropagation();
                const start = touchStartX.current;
                const end = event.changedTouches[0]?.clientX;
                touchStartX.current = null;
                if (start === null || end === undefined) return;
                select(getBlogGallerySwipeTarget(start, end, currentIndex, images.length));
              }}
            >
              {failedImages[currentImage.id] || !currentImage.imageUrl ? (
                <PhotoFallback />
              ) : (
                <Image
                  key={currentImage.id}
                  src={currentImage.imageUrl}
                  alt={currentImage.altText}
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className="object-contain"
                  onError={() => setFailedImages((current) => ({ ...current, [currentImage.id]: true }))}
                />
              )}

              <button
                type="button"
                data-lightbox-control
                className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#061A2A]/74 text-white shadow-lg backdrop-blur transition hover:bg-[#061A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 disabled:cursor-not-allowed disabled:opacity-32 motion-reduce:transition-none sm:left-5 sm:size-12"
                aria-label="Foto anterior"
                disabled={!canGoBack}
                onClick={() => select(currentIndex - 1)}
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-lightbox-control
                className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#061A2A]/74 text-white shadow-lg backdrop-blur transition hover:bg-[#061A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 disabled:cursor-not-allowed disabled:opacity-32 motion-reduce:transition-none sm:right-5 sm:size-12"
                aria-label="Próxima foto"
                disabled={!canGoForward}
                onClick={() => select(currentIndex + 1)}
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex shrink-0 gap-2 overflow-x-auto pb-1 sm:justify-center" aria-label="Miniaturas da galeria">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  data-lightbox-control
                  aria-label={`Abrir foto ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  onClick={() => select(index)}
                  className={cn(
                    "relative h-[54px] w-[76px] shrink-0 overflow-hidden rounded-md border-2 bg-[#0B1A25] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none",
                    index === currentIndex ? "border-leehov-blue-500 opacity-100" : "border-transparent opacity-65 hover:opacity-100",
                  )}
                >
                  {failedImages[image.id] || !image.imageUrl ? (
                    <ImageOff className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-white/50" aria-hidden="true" />
                  ) : (
                    <Image
                      src={image.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="76px"
                      className="object-cover"
                      onError={() => setFailedImages((current) => ({ ...current, [image.id]: true }))}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
