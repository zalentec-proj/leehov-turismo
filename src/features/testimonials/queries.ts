import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type { GoogleBusinessSettings, GoogleReview, Testimonial, TestimonialMetrics, TestimonialSummary } from "@/features/testimonials/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getGoogleOAuthConfiguration, getLiveGoogleConnection } from "@/lib/google/business-profile";

const manualSelect = "*, image:media_assets(id, storage_path)";

async function signPath(path: string | null | undefined) {
  if (!path) return "";
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from("site-media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

function credentialsConfigured() {
  return getGoogleOAuthConfiguration().configured;
}

export async function getGoogleBusinessSettings(admin = false): Promise<GoogleBusinessSettings> {
  if (admin) await requireActiveProfile();
  const supabase = createAdminClient();
  const [{ data }, connection] = await Promise.all([
    supabase.from("google_business_settings").select("*").eq("singleton", true).single(),
    admin ? getLiveGoogleConnection() : Promise.resolve(null),
  ]);
  const apiAccess = process.env.GOOGLE_BUSINESS_API_ACCESS_STATUS;
  return {
    displayMode: data?.display_mode ?? "manual",
    reviewsLimit: data?.reviews_limit ?? 6,
    minRating: data?.min_rating ?? 4,
    cacheHours: data?.cache_hours ?? 24,
    enabled: data?.enabled ?? false,
    accountId: data?.account_id ?? "",
    locationId: data?.location_id ?? "",
    lastSyncAt: data?.last_sync_at ?? "",
    lastSyncStatus: data?.last_sync_status ?? "",
    lastSyncError: data?.last_sync_error ?? "",
    credentialsConfigured: credentialsConfigured(),
    apiAccessStatus: apiAccess === "approved" || apiAccess === "blocked" ? apiAccess : "pending",
    connection: connection ? {
      id: connection.id,
      status: connection.status,
      accountId: connection.account_id ?? "",
      accountName: connection.account_name ?? "",
      locationId: connection.location_id ?? "",
      locationName: connection.location_name ?? "",
      googleMapsUrl: connection.google_maps_url ?? "",
      connectedAt: connection.connected_at,
      lastTokenRefreshAt: connection.last_token_refresh_at ?? "",
    } : null,
  };
}

function mapManual(row: Record<string, unknown>, imageUrl: string): Testimonial {
  return {
    id: String(row.id),
    name: String(row.name),
    roleTitle: String(row.role_title ?? ""),
    city: String(row.city ?? ""),
    rating: Number(row.rating),
    text: String(row.testimonial_text),
    imageUrl,
    imageAssetId: String(row.image_asset_id ?? ""),
    source: "manual",
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    orderIndex: Number(row.order_index),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapGoogle(row: Record<string, unknown>): GoogleReview {
  return {
    id: String(row.id),
    googleReviewId: String(row.google_review_id),
    name: String(row.reviewer_display_name ?? "Viajante Google"),
    roleTitle: "Avaliação do Google",
    city: "Google Reviews",
    rating: Number(row.star_rating),
    text: String(row.comment ?? "Avaliação sem comentário."),
    imageUrl: String(row.reviewer_profile_photo_url ?? ""),
    profileUrl: String(row.reviewer_profile_url ?? ""),
    replyComment: String(row.reply_comment ?? ""),
    source: "google",
    featured: Boolean(row.featured),
    visible: Boolean(row.visible),
    orderIndex: 0,
    createdAt: String(row.create_time ?? row.created_at),
    syncedAt: String(row.synced_at),
    expiresAt: String(row.expires_at ?? ""),
    replyStatus: String(row.reply_status ?? "none") as GoogleReview["replyStatus"],
    replyError: String(row.reply_error ?? ""),
  };
}

export async function getFeaturedTestimonials(): Promise<TestimonialSummary[]> {
  const settings = await getGoogleBusinessSettings();
  const supabase = createAdminClient();
  const [manual, google] = await Promise.all([
    settings.displayMode === "google" ? Promise.resolve({ data: [] }) : supabase.from("testimonials").select(manualSelect).eq("active", true).order("featured", { ascending: false }).order("order_index").limit(settings.reviewsLimit),
    settings.displayMode === "manual" || !settings.enabled ? Promise.resolve({ data: [] }) : supabase.from("google_reviews_cache").select("*").eq("visible", true).gt("expires_at", new Date().toISOString()).gte("star_rating", settings.minRating).order("featured", { ascending: false }).order("create_time", { ascending: false }).limit(settings.reviewsLimit),
  ]);
  const manualItems = await Promise.all(((manual.data ?? []) as unknown as Array<Record<string, unknown>>).map(async (row) => {
    const image = row.image as { storage_path?: string } | null;
    return mapManual(row, await signPath(image?.storage_path));
  }));
  const googleItems = ((google.data ?? []) as unknown as Array<Record<string, unknown>>).map(mapGoogle);
  return [...manualItems, ...googleItems].sort((a, b) => Number(b.featured) - Number(a.featured) || a.orderIndex - b.orderIndex).slice(0, settings.reviewsLimit);
}

export async function getVisibleGoogleReviews(): Promise<GoogleReview[]> {
  const settings = await getGoogleBusinessSettings();
  if (!settings.enabled || settings.displayMode === "manual") return [];
  const supabase = createAdminClient();
  const { data } = await supabase.from("google_reviews_cache").select("*").eq("visible", true).gt("expires_at", new Date().toISOString()).gte("star_rating", settings.minRating).order("featured", { ascending: false }).limit(settings.reviewsLimit);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(mapGoogle);
}

export async function getAdminTestimonials(): Promise<Testimonial[]> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.from("testimonials").select(manualSelect).order("order_index").order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os depoimentos: ${error.message}`);
  return Promise.all(((data ?? []) as unknown as Array<Record<string, unknown>>).map(async (row) => {
    const image = row.image as { storage_path?: string } | null;
    return mapManual(row, await signPath(image?.storage_path));
  }));
}

export async function getAdminGoogleReviews(): Promise<GoogleReview[]> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("google_reviews_cache").select("*").order("create_time", { ascending: false });
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(mapGoogle);
}

export async function getTestimonialMetrics(): Promise<TestimonialMetrics> {
  await requireActiveProfile();
  const supabase = await createClient();
  const [total, active, featured, googleVisible] = await Promise.all([
    supabase.from("testimonials").select("id", { count: "exact", head: true }),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("featured", true),
    supabase.from("google_reviews_cache").select("id", { count: "exact", head: true }).eq("visible", true),
  ]);
  return { total: total.count ?? 0, active: active.count ?? 0, featured: featured.count ?? 0, googleVisible: googleVisible.count ?? 0 };
}
