import "server-only";

import sharp from "sharp";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/features/auth/queries";
import { isMediaPathPublic } from "@/features/media/public-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const allowedMediaBuckets = new Set(["site-media", "blog-images", "caravan-images"]);
export const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

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
  try {
    const output = await sharp(Buffer.from(await data.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 4, smartSubsample: true })
      .toBuffer();
    const cacheControl = publicAsset
      ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      : "private, no-store";
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "content-type": "image/webp",
        "cache-control": cacheControl,
        "cdn-cache-control": cacheControl,
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch {
    return new NextResponse("Imagem inválida.", { status: 422 });
  }
}
