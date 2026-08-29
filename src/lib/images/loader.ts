import type { ImageLoaderProps } from "next/image";

/**
 * Keeps image delivery independent from Vercel's paid optimizer. Media stored
 * by Leehov is resized by our own cacheable route; local and third-party
 * images are returned unchanged.
 */
export default function leehovImageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("/")) return src;

  const url = new URL(src, "https://leehov.local");
  url.searchParams.set("w", String(width));
  if (src.startsWith("/api/media/")) url.searchParams.set("q", String(quality ?? 78));
  return `${url.pathname}${url.search}`;
}
