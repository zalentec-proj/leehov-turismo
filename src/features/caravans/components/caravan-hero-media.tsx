"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getCaravanBackgroundMedia } from "@/features/caravans/media";
import { cn } from "@/lib/utils";

type CaravanHeroMediaProps = {
  imageUrl: string;
  videoUrl?: string;
  priority?: boolean;
  className?: string;
};

export function CaravanHeroMedia({ imageUrl, videoUrl = "", priority = false, className }: CaravanHeroMediaProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const media = useMemo(() => getCaravanBackgroundMedia(videoUrl), [videoUrl]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-leehov-navy-950", className)} aria-hidden="true">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          unoptimized={imageUrl.startsWith("http")}
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : null}

      {!reduceMotion && !videoFailed && media?.kind === "video" ? (
        <video
          key={media.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
          onError={() => setVideoFailed(true)}
        >
          <source src={media.src} />
        </video>
      ) : null}

      {!reduceMotion && !videoFailed && (media?.kind === "youtube" || media?.kind === "vimeo") ? (
        <iframe
          key={media.src}
          src={media.src}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </div>
  );
}
