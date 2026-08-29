import { NextResponse } from "next/server";
import { allowedMediaBuckets, deliverMediaImage } from "@/features/media/delivery";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path } = await params;
  const storagePath = path.join("/");
  if (
    !allowedMediaBuckets.has(bucket) ||
    !storagePath ||
    storagePath.length > 900 ||
    storagePath.includes("..") ||
    storagePath.startsWith("/")
  ) {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const { data: catalogAsset } = await createAdminClient()
    .from("media_assets")
    .select("*")
    .eq("storage_bucket", bucket)
    .eq("storage_path", storagePath)
    .maybeSingle();

  return deliverMediaImage(request, {
    id: catalogAsset?.id,
    bucket,
    path: storagePath,
    mimeType: catalogAsset?.mime_type,
    provider:
      catalogAsset && "storage_provider" in catalogAsset && catalogAsset.storage_provider === "r2"
        ? "r2"
        : "supabase",
  });
}
