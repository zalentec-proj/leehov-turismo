import "server-only";

import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/features/auth/queries";
import { downloadMediaObject, type MediaStorageProvider } from "@/features/media/object-storage";
import { isMediaPathPublic } from "@/features/media/public-access";

export const allowedMediaBuckets = new Set(["site-media", "blog-images", "caravan-images"]);
export const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function mediaCacheControl(publicAsset: boolean, stableAsset: boolean) {
  if (!publicAsset) return "private, no-store";
  return publicAsset
    ? stableAsset
      ? "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800, immutable"
      : "public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000"
    : "private, no-store";
}

function mediaResponse(
  body: ArrayBuffer,
  contentType: string,
  publicAsset: boolean,
  optimized: boolean,
  stableAsset: boolean,
) {
  const cacheControl = mediaCacheControl(publicAsset, stableAsset);
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
  asset: {
    id?: string;
    bucket: string;
    path: string;
    mimeType?: string;
    provider?: MediaStorageProvider | null;
  },
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

  let mediaObject = await downloadMediaObject({
    provider: asset.provider,
    bucket: asset.bucket,
    path: asset.path,
  });
  if (!mediaObject && asset.provider === "r2") {
    mediaObject = await downloadMediaObject({
      provider: "supabase",
      bucket: asset.bucket,
      path: asset.path,
    });
  }
  if (!mediaObject || !allowedImageMimeTypes.has(mediaObject.contentType)) {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const url = new URL(request.url);
  const width = boundedInteger(url.searchParams.get("w"), 1600, 64, 1600);
  const quality = boundedInteger(url.searchParams.get("q"), 82, 68, 86);
  const input = mediaObject.bytes;
  try {
    const { default: sharp } = await import("sharp");
    const output = await sharp(Buffer.from(input), { failOn: "error" })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 4, smartSubsample: true })
      .toBuffer();
    return mediaResponse(Uint8Array.from(output).buffer, "image/webp", publicAsset, true, Boolean(asset.id));
  } catch {
    // A imagem original continua sendo entregue se o runtime não carregar o
    // binário nativo do Sharp. A URL estável ainda permite cache no CDN e evita
    // que uma falha opcional de otimização derrube as imagens do site.
    return mediaResponse(input.buffer as ArrayBuffer, mediaObject.contentType, publicAsset, false, Boolean(asset.id));
  }
}
