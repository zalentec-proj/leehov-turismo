import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
type MediaBucket = "site-media" | "blog-images" | "caravan-images";

type ResolvedAsset = { bucket: MediaBucket; path: string };

function fallbackBucket(scope: string): MediaBucket {
  if (scope === "blog") return "blog-images";
  if (scope === "caravana") return "caravan-images";
  return "site-media";
}

async function resolveAsset(scope: string, slug: string): Promise<ResolvedAsset | null> {
  const admin = createAdminClient();
  let path = "";

  if (scope === "site" && slug === "principal") {
    const { data } = await admin
      .from("site_settings")
      .select("media_asset_id, public_read")
      .eq("key", "seo_global")
      .eq("public_read", true)
      .maybeSingle();
    if (!data?.media_asset_id) return null;
    const { data: media } = await admin
      .from("media_assets")
      .select("storage_bucket, storage_path")
      .eq("id", data.media_asset_id)
      .maybeSingle();
    if (!media || !["site-media", "blog-images", "caravan-images"].includes(media.storage_bucket)) return null;
    return { bucket: media.storage_bucket as MediaBucket, path: media.storage_path };
  }

  if (scope === "blog") {
    const { data } = await admin
      .from("blog_posts")
      .select("cover_image_url")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    path = data?.cover_image_url ?? "";
  }

  if (scope === "caravana") {
    const { data } = await admin
      .from("caravans")
      .select("hero_image_url, card_image_url")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    path = data?.hero_image_url || data?.card_image_url || "";
  }

  if (!path || path.startsWith("/") || /^https?:\/\//i.test(path)) return null;
  const { data: media } = await admin
    .from("media_assets")
    .select("storage_bucket")
    .eq("storage_path", path)
    .maybeSingle();
  const bucket = media?.storage_bucket ?? fallbackBucket(scope);
  if (!["site-media", "blog-images", "caravan-images"].includes(bucket)) return null;
  return { bucket: bucket as MediaBucket, path };
}

/**
 * Open Graph consumers receive an image streamed by our domain. This avoids
 * placing Storage bearer tokens in metadata while retaining private buckets.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ scope: string; slug: string }> }) {
  const { scope, slug } = await params;
  if (![["site", "blog", "caravana"].includes(scope), slug.length > 0 && slug.length <= 160].every(Boolean)) {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }

  const asset = await resolveAsset(scope, slug);
  if (!asset) return new NextResponse("Imagem não encontrada.", { status: 404 });

  const { data, error } = await createAdminClient().storage.from(asset.bucket).download(asset.path);
  if (error || !data || !imageMimeTypes.has(data.type)) return new NextResponse("Imagem não encontrada.", { status: 404 });

  return new NextResponse(data, {
    headers: {
      "content-type": data.type,
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
