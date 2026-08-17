"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value);
    const videoId =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : url.pathname.startsWith("/shorts/")
          ? url.pathname.split("/")[2]
          : (url.searchParams.get("v") ?? "");
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : "";
  } catch {
    return "";
  }
}

export function HomeInstitutionalVideo({ videoUrl }: { videoUrl: string }) {
  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) return null;

  return <InstitutionalVideoContent key={videoId} videoId={videoId} />;
}

function InstitutionalVideoContent({ videoId }: { videoId: string }) {
  const maxResolutionThumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : "";
  const standardThumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
  const [thumbnailUrl, setThumbnailUrl] = useState(maxResolutionThumbnail);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative aspect-video w-full overflow-hidden rounded-[24px] bg-leehov-navy-950 text-left shadow-leehov-floating focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-leehov-blue-300"
        >
          <Image
            src={thumbnailUrl || "/images/leehov/hero-fallback.jpg"}
            alt="Prévia do vídeo institucional da Leehov"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            quality={90}
            className="object-cover opacity-72 transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
            onError={() => setThumbnailUrl((current) => current === maxResolutionThumbnail ? standardThumbnail : "")}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-leehov-navy-950/65 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/16 text-white backdrop-blur transition group-hover:scale-105 group-hover:bg-white/24 motion-reduce:transition-none">
              <Play className="ml-1 size-6 fill-white" aria-hidden="true" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 p-6 text-sm font-bold text-white">
            Assistir ao vídeo institucional
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,calc(88svh*16/9),1200px)] max-w-[calc(100%-1.5rem)] overflow-hidden border-0 bg-leehov-navy-950 p-0 text-white sm:max-w-[min(92vw,calc(88svh*16/9),1200px)] sm:rounded-[24px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Vídeo institucional da Leehov</DialogTitle>
          <DialogDescription>
            Conheça a experiência de viajar com a Leehov.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title="Vídeo institucional da Leehov"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
