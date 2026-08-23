import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

async function hasPublishedParent(
  admin: AdminClient,
  table: "caravan_images" | "caravan_itinerary_days" | "blog_post_images",
  foreignKey: "caravan_id" | "blog_post_id",
  path: string,
) {
  const { data } = await admin
    .from(table)
    .select(foreignKey)
    .eq("image_url", path)
    .limit(20);
  const ids = [...new Set((data ?? []).map((row) =>
    String((row as unknown as Record<string, unknown>)[foreignKey]),
  ))];
  if (!ids.length) return false;

  if (foreignKey === "caravan_id") {
    const { data: parent } = await admin
      .from("caravans")
      .select("id")
      .in("id", ids)
      .eq("published", true)
      .limit(1)
      .maybeSingle();
    return Boolean(parent);
  }

  const { data: parent } = await admin
    .from("blog_posts")
    .select("id")
    .in("id", ids)
    .eq("published", true)
    .limit(1)
    .maybeSingle();
  return Boolean(parent);
}

export async function isMediaPathPublic(path: string, assetId?: string) {
  const admin = createAdminClient();
  const assetReferences = assetId
    ? Promise.all([
        admin.from("site_settings").select("id").eq("media_asset_id", assetId).eq("public_read", true).limit(1).maybeSingle(),
        admin.from("popups").select("id").eq("image_asset_id", assetId).eq("active", true).limit(1).maybeSingle(),
        admin.from("testimonials").select("id").eq("image_asset_id", assetId).eq("active", true).limit(1).maybeSingle(),
      ])
    : Promise.resolve([]);
  const [references, caravan, blog] = await Promise.all([
    assetReferences,
    admin
      .from("caravans")
      .select("id")
      .eq("published", true)
      .or(`card_image_url.eq.${path},hero_image_url.eq.${path},video_thumbnail_url.eq.${path},leader_image_url.eq.${path}`)
      .limit(1)
      .maybeSingle(),
    admin.from("blog_posts").select("id").eq("cover_image_url", path).eq("published", true).limit(1).maybeSingle(),
  ]);

  if ([...references, caravan, blog].some((result) => Boolean(result.data))) return true;

  const [gallery, itinerary, blogGallery] = await Promise.all([
    hasPublishedParent(admin, "caravan_images", "caravan_id", path),
    hasPublishedParent(admin, "caravan_itinerary_days", "caravan_id", path),
    hasPublishedParent(admin, "blog_post_images", "blog_post_id", path),
  ]);
  return gallery || itinerary || blogGallery;
}
