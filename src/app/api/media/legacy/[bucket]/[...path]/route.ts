import { NextResponse } from "next/server";
import { allowedMediaBuckets, deliverMediaImage } from "@/features/media/delivery";

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
  return deliverMediaImage(request, { bucket, path: storagePath });
}
