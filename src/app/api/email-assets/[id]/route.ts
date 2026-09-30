import { NextRequest, NextResponse } from "next/server";
import { downloadMediaObjectWithFallback } from "@/features/media/object-storage";
import { verifyEmailAssetToken } from "@/lib/email/asset-signing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyEmailAssetToken(id, token)) return new NextResponse("Imagem não autorizada.", { status: 403 });
  const admin = createAdminClient();
  const { data: asset } = await admin.from("media_assets").select("storage_bucket, storage_path, storage_provider").eq("id", id).maybeSingle();
  if (!asset) return new NextResponse("Imagem não encontrada.", { status: 404 });
  const mediaObject = await downloadMediaObjectWithFallback({
    bucket: asset.storage_bucket,
    path: asset.storage_path,
    provider: asset.storage_provider === "r2" ? "r2" : "supabase",
  });
  if (!mediaObject) return new NextResponse("Imagem indisponível.", { status: 404 });
  return new NextResponse(Uint8Array.from(mediaObject.bytes).buffer, {
    headers: {
      "content-type": mediaObject.contentType,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
