"use server";

import { revalidatePath } from "next/cache";
import { requireActiveProfile, requireAdminProfile } from "@/features/auth/queries";
import { googleBusinessSettingsSchema, googleLocationSelectionSchema, testimonialSchema } from "@/features/testimonials/schema";
import type { TestimonialActionResult } from "@/features/testimonials/types";
import { listGoogleBusinessAccounts, listGoogleBusinessLocations, syncGoogleBusinessReviews } from "@/features/testimonials/google-business";
import { getGoogleOAuthConfiguration, getLiveGoogleConnection } from "@/lib/google/business-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emitWebhookEvent } from "@/lib/webhooks/events";

function emptyToNull(value: string) {
  return value.trim() || null;
}

function revalidateTestimonials() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/depoimentos");
  revalidatePath("/admin/midia");
}

export async function saveTestimonialAction(input: unknown): Promise<TestimonialActionResult> {
  const profile = await requireActiveProfile();
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do depoimento." };
  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    role_title: emptyToNull(parsed.data.roleTitle),
    city: emptyToNull(parsed.data.city),
    testimonial_text: parsed.data.text,
    rating: parsed.data.rating,
    image_asset_id: parsed.data.imageAssetId || null,
    active: parsed.data.active,
    featured: parsed.data.featured,
    order_index: parsed.data.orderIndex,
    updated_by: profile.id,
  };
  if (parsed.data.id) {
    const { error } = await supabase.from("testimonials").update(payload).eq("id", parsed.data.id);
    if (error) return { success: false, message: error.message };
    revalidateTestimonials();
    return { success: true, message: "Depoimento atualizado.", id: parsed.data.id };
  }
  const { data, error } = await supabase.from("testimonials").insert({ ...payload, created_by: profile.id }).select("id").single();
  if (error) return { success: false, message: error.message };
  revalidateTestimonials();
  return { success: true, message: "Depoimento criado.", id: data.id };
}

export async function setTestimonialActiveAction(id: string, active: boolean): Promise<TestimonialActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").update({ active, featured: active ? undefined : false, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidateTestimonials();
  return { success: true, message: active ? "Depoimento ativado." : "Depoimento desativado." };
}

export async function deleteTestimonialAction(id: string): Promise<TestimonialActionResult> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.from("testimonials").select("active").eq("id", id).maybeSingle();
  if (error || !data) return { success: false, message: "Depoimento não encontrado." };
  if (data.active) return { success: false, message: "Desative o depoimento antes de excluí-lo." };
  const { error: deleteError } = await supabase.from("testimonials").delete().eq("id", id).eq("active", false);
  if (deleteError) return { success: false, message: deleteError.message };
  revalidateTestimonials();
  return { success: true, message: "Depoimento excluído. A imagem permanece disponível na biblioteca." };
}

export async function setGoogleReviewVisibilityAction(id: string, visible: boolean, featured = false): Promise<TestimonialActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("google_reviews_cache").update({ visible, featured: visible ? featured : false, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidateTestimonials();
  return { success: true, message: "Visibilidade da avaliação atualizada." };
}

export async function saveGoogleBusinessSettingsAction(input: unknown): Promise<TestimonialActionResult> {
  const profile = await requireAdminProfile();
  const parsed = googleBusinessSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise as configurações." };
  const configured = getGoogleOAuthConfiguration().configured;
  const connection = await getLiveGoogleConnection();
  if (parsed.data.enabled && (!configured || !connection?.location_id)) return { success: false, message: "Conecte o OAuth e confirme a localização da Leehov antes de ativar avaliações do Google." };
  const supabase = await createClient();
  const { error } = await supabase.from("google_business_settings").update({
    display_mode: parsed.data.displayMode,
    reviews_limit: parsed.data.reviewsLimit,
    min_rating: parsed.data.minRating,
    cache_hours: parsed.data.cacheHours,
    enabled: parsed.data.enabled,
    account_id: connection?.account_id ?? null,
    location_id: connection?.location_id ?? null,
    updated_by: profile.id,
  }).eq("singleton", true);
  if (error) return { success: false, message: error.message };
  revalidateTestimonials();
  return { success: true, message: "Preferências do Google Business atualizadas." };
}

export async function syncGoogleReviewsAction(): Promise<TestimonialActionResult> {
  await requireAdminProfile();
  try {
    const result = await syncGoogleBusinessReviews();
    for (const review of result.newReviews) {
      await emitWebhookEvent("google_review.created", { googleReviewId: review.id, rating: review.rating });
      if (review.rating <= 3) await emitWebhookEvent("google_review.low_rating", { googleReviewId: review.id, rating: review.rating });
    }
    revalidateTestimonials();
    return { success: true, message: `${result.total} avaliações sincronizadas: ${result.created} novas e ${result.updated} atualizadas.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível sincronizar as avaliações." };
  }
}

export async function loadGoogleAccountsAction() {
  await requireAdminProfile();
  try {
    return { success: true as const, message: "Contas carregadas.", accounts: await listGoogleBusinessAccounts() };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Não foi possível carregar as contas.", accounts: [] };
  }
}

export async function loadGoogleLocationsAction(accountResourceName: string) {
  await requireAdminProfile();
  try {
    return { success: true as const, message: "Localizações carregadas.", locations: await listGoogleBusinessLocations(accountResourceName) };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Não foi possível carregar as localizações.", locations: [] };
  }
}

export async function selectGoogleBusinessLocationAction(input: unknown): Promise<TestimonialActionResult> {
  const profile = await requireAdminProfile();
  const parsed = googleLocationSelectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Localização inválida." };
  try {
    const [accounts, locations, connection] = await Promise.all([
      listGoogleBusinessAccounts(),
      listGoogleBusinessLocations(parsed.data.accountResourceName),
      getLiveGoogleConnection(),
    ]);
    if (!connection) return { success: false, message: "Conexão OAuth não encontrada." };
    const account = accounts.find((item) => item.resourceName === parsed.data.accountResourceName);
    const location = locations.find((item) => item.resourceName === parsed.data.locationResourceName);
    if (!account || !location) return { success: false, message: "A conta ou localização não pertence à conexão autenticada." };
    const supabase = createAdminClient();
    const { error } = await supabase.from("google_business_connections").update({
      account_id: account.resourceName,
      account_name: account.name,
      location_id: location.resourceName,
      location_name: location.name,
      google_maps_url: location.googleMapsUrl || null,
      status: "connected",
      updated_by: profile.id,
    }).eq("id", connection.id);
    if (error) return { success: false, message: "Não foi possível salvar a localização." };
    await supabase.from("google_business_settings").update({
      connection_id: connection.id,
      account_id: account.resourceName,
      location_id: location.resourceName,
      google_maps_url: location.googleMapsUrl || null,
      last_sync_status: "ready",
      last_sync_error: null,
      updated_by: profile.id,
    }).eq("singleton", true);
    revalidateTestimonials();
    revalidatePath("/admin/configuracoes");
    return { success: true, message: `Localização “${location.name}” confirmada.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível selecionar a localização." };
  }
}
