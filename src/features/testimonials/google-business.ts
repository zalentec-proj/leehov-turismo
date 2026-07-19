import "server-only";

import { randomUUID } from "node:crypto";

import {
  getLiveGoogleConnection,
  googleBusinessFetch,
  normalizeGoogleResourceId,
  type GoogleConnectionRow,
} from "@/lib/google/business-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const MAX_CACHE_DAYS = 30;

type GoogleAccountApi = {
  name: string;
  accountName?: string;
  type?: string;
  verificationState?: string;
  vettedState?: string;
};

type GoogleLocationApi = {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  metadata?: { mapsUri?: string; newReviewUri?: string };
};

type GoogleReviewApi = {
  name?: string;
  reviewId: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
};

export type GoogleBusinessAccount = {
  resourceName: string;
  id: string;
  name: string;
  type: string;
  verificationState: string;
};

export type GoogleBusinessLocation = {
  resourceName: string;
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
};

export type GoogleReviewSyncResult = {
  total: number;
  created: number;
  updated: number;
  newReviews: Array<{ id: string; rating: number }>;
};

function connectionRequired(connection: GoogleConnectionRow | null): asserts connection is GoogleConnectionRow {
  if (!connection) throw new Error("Conecte o Google Business Profile antes de continuar.");
}

export async function listGoogleBusinessAccounts(): Promise<GoogleBusinessAccount[]> {
  const connection = await getLiveGoogleConnection();
  connectionRequired(connection);
  const body = await googleBusinessFetch<{ accounts?: GoogleAccountApi[] }>(
    connection,
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20",
  );
  return (body.accounts ?? []).map((account) => ({
    resourceName: account.name,
    id: normalizeGoogleResourceId(account.name, "accounts/"),
    name: account.accountName || account.name,
    type: account.type ?? "",
    verificationState: account.verificationState ?? "",
  }));
}

export async function listGoogleBusinessLocations(accountResourceName: string): Promise<GoogleBusinessLocation[]> {
  if (!/^accounts\/[A-Za-z0-9_-]+$/.test(accountResourceName)) throw new Error("Conta do Google inválida.");
  const connection = await getLiveGoogleConnection();
  connectionRequired(connection);
  const endpoint = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountResourceName}/locations`);
  endpoint.searchParams.set("readMask", "name,title,storefrontAddress,metadata");
  endpoint.searchParams.set("pageSize", "100");
  const body = await googleBusinessFetch<{ locations?: GoogleLocationApi[] }>(connection, endpoint.toString());
  return (body.locations ?? []).map((location) => ({
    resourceName: location.name,
    id: normalizeGoogleResourceId(location.name, "locations/"),
    name: location.title || location.name,
    address: [
      ...(location.storefrontAddress?.addressLines ?? []),
      location.storefrontAddress?.locality,
      location.storefrontAddress?.administrativeArea,
      location.storefrontAddress?.postalCode,
    ].filter(Boolean).join(", "),
    googleMapsUrl: location.metadata?.mapsUri ?? "",
  }));
}

function mapStarRating(value: string | undefined) {
  const ratings: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return ratings[value ?? ""] ?? 0;
}

async function claimSyncLease() {
  const token = randomUUID();
  const now = new Date();
  const until = new Date(now.getTime() + 8 * 60 * 1000).toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("google_business_settings")
    .update({ sync_lock_token: token, sync_lock_until: until })
    .eq("singleton", true)
    .or(`sync_lock_until.is.null,sync_lock_until.lt.${now.toISOString()}`)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Já existe uma sincronização do Google em andamento.");
  return token;
}

async function releaseSyncLease(token: string) {
  await createAdminClient()
    .from("google_business_settings")
    .update({ sync_lock_token: null, sync_lock_until: null })
    .eq("singleton", true)
    .eq("sync_lock_token", token);
}

async function loadAllReviews(connection: GoogleConnectionRow) {
  if (!connection.account_id || !connection.location_id) {
    throw new Error("Confirme a localização da Leehov antes de sincronizar avaliações.");
  }
  const parent = `accounts/${normalizeGoogleResourceId(connection.account_id, "accounts/")}/locations/${normalizeGoogleResourceId(connection.location_id, "locations/")}`;
  const reviews: GoogleReviewApi[] = [];
  let pageToken = "";
  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await googleBusinessFetch<{ reviews?: GoogleReviewApi[]; nextPageToken?: string }>(connection, url.toString());
    reviews.push(...(page.reviews ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return reviews;
}

export async function syncGoogleBusinessReviews(): Promise<GoogleReviewSyncResult> {
  const connection = await getLiveGoogleConnection();
  connectionRequired(connection);
  const lease = await claimSyncLease();
  const supabase = createAdminClient();
  try {
    const reviews = await loadAllReviews(connection);
    const ids = reviews.map((review) => review.reviewId);
    const { data: existingRows } = ids.length
      ? await supabase.from("google_reviews_cache").select("google_review_id, visible, featured").in("google_review_id", ids)
      : { data: [] };
    const existing = new Map((existingRows ?? []).map((row) => [row.google_review_id, row]));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MAX_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const payload = reviews.map((review) => {
      const previous = existing.get(review.reviewId);
      const rating = mapStarRating(review.starRating);
      if (!rating) throw new Error(`O Google retornou uma nota inválida para a avaliação ${review.reviewId}.`);
      return {
        google_review_id: review.reviewId,
        review_name: review.name ?? null,
        reviewer_display_name: review.reviewer?.displayName ?? null,
        reviewer_profile_photo_url: review.reviewer?.profilePhotoUrl ?? null,
        reviewer_profile_url: null,
        star_rating: rating,
        comment: review.comment ?? null,
        create_time: review.createTime ?? null,
        update_time: review.updateTime ?? null,
        reply_comment: review.reviewReply?.comment ?? null,
        reply_update_time: review.reviewReply?.updateTime ?? null,
        reply_status: review.reviewReply ? "synced" as const : "none" as const,
        reply_error: null,
        reply_pending_at: null,
        visible: previous?.visible ?? true,
        featured: previous?.featured ?? false,
        raw_data: review as unknown as Json,
        connection_id: connection.id,
        synced_at: now.toISOString(),
        expires_at: expiresAt,
      };
    });

    if (payload.length) {
      const { error } = await supabase.from("google_reviews_cache").upsert(payload, { onConflict: "google_review_id" });
      if (error) throw new Error(`Não foi possível atualizar o cache: ${error.message}`);
    }
    const created = reviews.filter((review) => !existing.has(review.reviewId));
    await supabase.from("google_business_settings").update({
      last_sync_at: now.toISOString(),
      last_sync_status: "success",
      last_sync_error: null,
    }).eq("singleton", true);
    return {
      total: reviews.length,
      created: created.length,
      updated: reviews.length - created.length,
      newReviews: created.map((review) => ({ id: review.reviewId, rating: mapStarRating(review.starRating) })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Falha desconhecida na sincronização.";
    await supabase.from("google_business_settings").update({
      last_sync_status: "failed",
      last_sync_error: message,
    }).eq("singleton", true);
    throw error;
  } finally {
    await releaseSyncLease(lease);
  }
}

function assertReviewName(value: string | null) {
  if (!value || !/^accounts\/[A-Za-z0-9_-]+\/locations\/[A-Za-z0-9_-]+\/reviews\/[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Identificador da avaliação do Google inválido.");
  }
  return value;
}

export async function replyToGoogleReview(reviewId: string, comment: string) {
  const connection = await getLiveGoogleConnection();
  connectionRequired(connection);
  const supabase = createAdminClient();
  const { data: review, error } = await supabase.from("google_reviews_cache").select("id, review_name").eq("id", reviewId).single();
  if (error || !review) throw new Error("Avaliação não encontrada.");
  const reviewName = assertReviewName(review.review_name);
  await supabase.from("google_reviews_cache").update({ reply_status: "pending", reply_pending_at: new Date().toISOString(), reply_error: null }).eq("id", reviewId);
  try {
    const reply = await googleBusinessFetch<{ comment?: string; updateTime?: string }>(
      connection,
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      { method: "PUT", body: JSON.stringify({ comment }) },
    );
    await supabase.from("google_reviews_cache").update({
      reply_comment: reply.comment ?? comment,
      reply_update_time: reply.updateTime ?? new Date().toISOString(),
      reply_status: "synced",
      reply_pending_at: null,
      reply_error: null,
    }).eq("id", reviewId);
  } catch (replyError) {
    const message = replyError instanceof Error ? replyError.message.slice(0, 1000) : "Falha ao responder avaliação.";
    await supabase.from("google_reviews_cache").update({ reply_status: "error", reply_pending_at: null, reply_error: message }).eq("id", reviewId);
    throw replyError;
  }
}

export async function removeGoogleReviewReply(reviewId: string) {
  const connection = await getLiveGoogleConnection();
  connectionRequired(connection);
  const supabase = createAdminClient();
  const { data: review, error } = await supabase.from("google_reviews_cache").select("id, review_name").eq("id", reviewId).single();
  if (error || !review) throw new Error("Avaliação não encontrada.");
  const reviewName = assertReviewName(review.review_name);
  await supabase.from("google_reviews_cache").update({ reply_status: "delete_pending", reply_pending_at: new Date().toISOString(), reply_error: null }).eq("id", reviewId);
  try {
    await googleBusinessFetch<Record<string, never>>(
      connection,
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      { method: "DELETE" },
    );
    await supabase.from("google_reviews_cache").update({
      reply_comment: null,
      reply_update_time: null,
      reply_status: "none",
      reply_pending_at: null,
      reply_error: null,
    }).eq("id", reviewId);
  } catch (deleteError) {
    const message = deleteError instanceof Error ? deleteError.message.slice(0, 1000) : "Falha ao remover resposta.";
    await supabase.from("google_reviews_cache").update({ reply_status: "error", reply_pending_at: null, reply_error: message }).eq("id", reviewId);
    throw deleteError;
  }
}
