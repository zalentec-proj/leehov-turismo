import { NextResponse } from "next/server";
import { deliverMediaImage } from "@/features/media/delivery";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function imageNotFound(
  reason: "id" | "asset-error" | "asset-missing",
  errorCode?: string,
  errorMessage?: string,
) {
  const developmentHeaders = process.env.NODE_ENV === "development"
    ? {
        "x-leehov-media-reason": reason,
        ...(errorCode ? { "x-leehov-media-error-code": errorCode.replace(/[^a-z0-9_-]/gi, "") } : {}),
        ...(errorMessage ? { "x-leehov-media-error": encodeURIComponent(errorMessage).slice(0, 180) } : {}),
      }
    : undefined;
  return new NextResponse("Imagem não encontrada.", {
    status: 404,
    headers: developmentHeaders,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return imageNotFound("id");

  const admin = createAdminClient();
  const { data: asset, error } = await admin
    .from("media_assets")
    .select("id, storage_bucket, storage_path, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (error) return imageNotFound("asset-error", error.code, error.message);
  if (!asset) return imageNotFound("asset-missing");
  return deliverMediaImage(request, {
    id: asset.id,
    bucket: asset.storage_bucket,
    path: asset.storage_path,
    mimeType: asset.mime_type,
  });
}
