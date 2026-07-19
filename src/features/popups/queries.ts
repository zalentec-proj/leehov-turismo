import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type { Popup } from "@/features/popups/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const popupSelect = "*, image:media_assets(storage_path, alt_text), caravan:caravans(id, title, slug, published)";

async function mapPopup(row: Record<string, unknown>): Promise<Popup> {
  const image = row.image as { storage_path?: string; alt_text?: string | null } | null;
  const caravan = row.caravan as { id?: string; title?: string; slug?: string; published?: boolean } | null;
  let imageUrl = "";
  if (image?.storage_path) {
    const { data } = await createAdminClient().storage.from("site-media").createSignedUrl(image.storage_path, 3600);
    imageUrl = data?.signedUrl ?? "";
  }
  return {
    id: String(row.id), title: String(row.title), description: String(row.description ?? ""),
    imageAssetId: String(row.image_asset_id ?? ""), imageUrl, imageAlt: image?.alt_text ?? String(row.title),
    buttonText: String(row.button_text ?? ""), buttonUrl: String(row.button_url ?? ""), popupType: row.popup_type as Popup["popupType"],
    relatedCaravanId: String(row.related_caravan_id ?? ""), relatedCaravanTitle: caravan?.title ?? "", relatedCaravanSlug: caravan?.slug ?? "",
    displayLocation: row.display_location as Popup["displayLocation"], frequency: row.frequency as Popup["frequency"], active: Boolean(row.active),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export async function getActivePopup(): Promise<Popup | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("popups").select(popupSelect).eq("active", true).limit(1).maybeSingle();
  if (error || !data) return null;
  const caravan = data.caravan as unknown as { published?: boolean } | null;
  if (data.popup_type === "caravan" && !caravan?.published) return null;
  return mapPopup(data as unknown as Record<string, unknown>);
}

export async function getAdminPopups(): Promise<Popup[]> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.from("popups").select(popupSelect).order("updated_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os pop-ups: ${error.message}`);
  return Promise.all(((data ?? []) as unknown as Array<Record<string, unknown>>).map(mapPopup));
}
