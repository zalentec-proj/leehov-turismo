import { NextRequest, NextResponse } from "next/server";
import { verifyEmailAssetToken } from "@/lib/email/asset-signing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyEmailAssetToken(id, token)) return new NextResponse("Imagem não autorizada.", { status: 403 });
  const admin = createAdminClient();
  const { data: asset } = await admin.from("media_assets").select("storage_bucket, storage_path").eq("id", id).maybeSingle();
  if (!asset) return new NextResponse("Imagem não encontrada.", { status: 404 });
  const { data, error } = await admin.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 300);
  if (error || !data?.signedUrl) return new NextResponse("Imagem indisponível.", { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 307, headers: { "cache-control": "private, no-store" } });
}
