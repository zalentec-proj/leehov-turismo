import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AdminCaravan, CaravanCategory, CaravanSummary } from "@/features/caravans/types";

export type CaravanQueryRow = Database["public"]["Tables"]["caravans"]["Row"] & {
  caravan_categories: Database["public"]["Tables"]["caravan_categories"]["Row"] | null;
  caravan_departures: Database["public"]["Tables"]["caravan_departures"]["Row"][];
  caravan_itinerary_days: Database["public"]["Tables"]["caravan_itinerary_days"]["Row"][];
  caravan_images: Database["public"]["Tables"]["caravan_images"]["Row"][];
};

function jsonStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function resolveCaravanAssetUrl(
  supabase: SupabaseClient<Database>,
  value: string | null,
): Promise<string> {
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const configuredHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
      return configuredHost && new URL(value).hostname === configuredHost ? value : "";
    } catch {
      return "";
    }
  }
  const { data } = await supabase.storage.from("caravan-images").createSignedUrl(value, 3600);
  return data?.signedUrl ?? "";
}

function mapCategory(row: CaravanQueryRow["caravan_categories"]): CaravanCategory | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    active: row.active,
    sort_order: row.sort_order,
  };
}

export async function mapCaravanSummary(
  supabase: SupabaseClient<Database>,
  row: CaravanQueryRow,
): Promise<CaravanSummary> {
  const departures = [...(row.caravan_departures ?? [])].sort((a, b) => a.order_index - b.order_index);
  const firstDeparture = departures.find((departure) => departure.start_date) ?? departures[0];
  const imagePath = row.card_image_url || row.hero_image_url || "";
  const imageUrl = await resolveCaravanAssetUrl(supabase, imagePath);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    destination: row.destination,
    category: mapCategory(row.caravan_categories),
    duration: row.duration ?? "Duração a confirmar",
    departureLabel: firstDeparture?.label || firstDeparture?.start_date || "Saídas a confirmar",
    nextDeparture: firstDeparture?.start_date ?? null,
    status: row.status,
    price: row.price ?? "Sob consulta",
    summary: row.summary ?? "Conheça esta experiência acompanhada pela Leehov.",
    imagePath,
    imageUrl: imageUrl || "/images/leehov/hero-card-fallback.jpg",
    featuredHero: row.featured_hero,
    featuredHome: row.featured_home,
    heroOrder: row.hero_order,
    published: row.published,
    publishedAt: row.published_at,
  };
}

export async function mapCaravanDetail(
  supabase: SupabaseClient<Database>,
  row: CaravanQueryRow,
): Promise<AdminCaravan> {
  const summary = await mapCaravanSummary(supabase, row);
  const [heroImageUrl, videoThumbnailUrl, leaderImageUrl] = await Promise.all([
    resolveCaravanAssetUrl(supabase, row.hero_image_url),
    resolveCaravanAssetUrl(supabase, row.video_thumbnail_url),
    resolveCaravanAssetUrl(supabase, row.leader_image_url),
  ]);
  return {
    ...summary,
    type: row.type ?? "",
    description: row.description ?? "",
    currency: row.currency,
    heroImagePath: row.hero_image_url ?? "",
    heroImageUrl: heroImageUrl || "/images/leehov/hero-fallback.jpg",
    videoUrl: row.video_url ?? "",
    videoThumbnailPath: row.video_thumbnail_url ?? "",
    videoThumbnailUrl,
    isGroupTrip: row.is_group_trip,
    isAccompanied: row.is_accompanied,
    hasPortugueseGuide: row.has_portuguese_guide,
    hasLeehovRepresentative: row.has_leehov_representative,
    hasTravelKit: row.has_travel_kit,
    hasTravelInsurance: row.has_travel_insurance,
    minPeople: row.min_people,
    maxPeople: row.max_people,
    leaderName: row.leader_name ?? "",
    leaderBio: row.leader_bio ?? "",
    leaderImagePath: row.leader_image_url ?? "",
    leaderImageUrl,
    included: jsonStringArray(row.included),
    notIncluded: jsonStringArray(row.not_included),
    notes: row.notes ?? "",
    heroTitle: row.hero_title ?? "",
    heroDescription: row.hero_description ?? "",
    heroCtaText: row.hero_cta_text ?? "",
    heroCtaUrl: row.hero_cta_url ?? "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    departures: [...(row.caravan_departures ?? [])].sort((a, b) => a.order_index - b.order_index).map((item) => ({
      id: item.id,
      label: item.label ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      availableSpots: item.available_spots,
      status: item.status,
      notes: item.notes ?? "",
      orderIndex: item.order_index,
    })),
    itinerary: await Promise.all([...(row.caravan_itinerary_days ?? [])].sort((a, b) => a.order_index - b.order_index).map(async (item) => ({
      id: item.id,
      day: item.day_number,
      title: item.title,
      location: item.location ?? "",
      description: item.description ?? "",
      imagePath: item.image_url ?? "",
      imageUrl: await resolveCaravanAssetUrl(supabase, item.image_url),
      meals: jsonStringArray(item.meals),
      accommodation: item.accommodation ?? "",
      notes: item.notes ?? "",
      orderIndex: item.order_index,
    }))),
    images: await Promise.all([...(row.caravan_images ?? [])].sort((a, b) => a.order_index - b.order_index).map(async (item) => ({
      id: item.id,
      imagePath: item.image_url,
      imageUrl: await resolveCaravanAssetUrl(supabase, item.image_url),
      altText: item.alt_text ?? "",
      caption: item.caption ?? "",
      orderIndex: item.order_index,
    }))),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
