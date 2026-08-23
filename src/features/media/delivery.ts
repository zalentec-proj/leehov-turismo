import "server-only";

import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/features/auth/queries";
import { isMediaPathPublic } from "@/features/media/public-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const allowedMediaBuckets = new Set(["site-media", "blog-images", "caravan-images"]);
export const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function mediaCacheControl(publicAsset: boolean) {
  return publicAsset
    ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
    : "private, no-store";
}

function mediaResponse(
  body: ArrayBuffer,
  contentType: string,
  publicAsset: boolean,
  optimized: boolean,
) {
  const cacheControl = mediaCacheControl(publicAsset);
  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
      "cdn-cache-control": cacheControl,
      "x-content-type-options": "nosniff",
      "x-leehov-image-optimized": optimized ? "1" : "0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function deliverMediaImage(
  request: Request,
  asset: { id?: string; bucket: string; path: string; mimeType?: string },
) {
  if (
    !allowedMediaBuckets.has(asset.bucket) ||
    (asset.mimeType && !allowedImageMimeTypes.has(asset.mimeType))
  ) {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const publicAsset = await isMediaPathPublic(asset.path, asset.id);
  if (!publicAsset) {
    const profile = await getCurrentProfile();
    if (!profile?.active) return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const { data, error } = await createAdminClient().storage.from(asset.bucket).download(asset.path);
  if (error || !data || !allowedImageMimeTypes.has(data.type)) {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const url = new URL(request.url);
  const width = boundedInteger(url.searchParams.get("w"), 1600, 64, 2560);
  const quality = boundedInteger(url.searchParams.get("q"), 82, 60, 92);
  const input = await data.arrayBuffer();
  try {
    const { default: sharp } = await import("sharp");
    const output = await sharp(Buffer.from(input), { failOn: "error" })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 4, smartSubsample: true })
      .toBuffer();
    return mediaResponse(Uint8Array.from(output).buffer, "image/webp", publicAsset, true);
  } catch {
    // A imagem original continua sendo entregue se o runtime não carregar o
    // binário nativo do Sharp. A URL estável ainda permite cache no CDN e evita
    // que uma falha opcional de otimização derrube as imagens do site.
    return mediaResponse(input, data.type, publicAsset, false);
  }
}
