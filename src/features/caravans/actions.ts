"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { caravanCategorySchema, caravanFormSchema, type CaravanFormInput } from "@/features/caravans/schema";
import { requirePermission } from "@/features/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";
import { emitWebhookEvent } from "@/lib/webhooks/events";
import {
  CARAVAN_IMAGE_MAX_BYTES,
  getCaravanImageTypeFromPath,
  hasValidCaravanImageSignature,
  validateCaravanImageMetadata,
} from "@/features/caravans/image-validation";

type CaravanActionResult = { success: boolean; message: string; id?: string; path?: string; token?: string; url?: string };

const emptyToNull = (value: string) => value.trim() || null;

function revalidateCaravans(slug?: string) {
  revalidatePath("/");
  revalidatePath("/caravanas");
  revalidatePath("/admin");
  revalidatePath("/admin/caravanas");
  if (slug) revalidatePath(`/caravanas/${slug}`);
}

export async function deleteDraftCaravanAction(id: string): Promise<CaravanActionResult> {
  await requirePermission("caravans.update");
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    return { success: false, message: "Pacote inválido." };
  }

  const supabase = createAdminClient();
  const { data: caravan, error: caravanError } = await supabase
    .from("caravans")
    .select("id, slug, published, status")
    .eq("id", id)
    .maybeSingle();
  if (caravanError) return { success: false, message: caravanError.message };
  if (!caravan) return { success: false, message: "Pacote não encontrado." };
  if (caravan.published || caravan.status !== "draft") {
    return { success: false, message: "Despublique e mova o pacote para rascunho antes de excluí-lo." };
  }

  const { count: popupCount, error: popupError } = await supabase
    .from("popups")
    .select("id", { count: "exact", head: true })
    .eq("related_caravan_id", id);
  if (popupError) return { success: false, message: popupError.message };
  if (popupCount) {
    return { success: false, message: "Remova primeiro o vínculo deste pacote nos pop-ups." };
  }

  const { data: files, error: listError } = await supabase.storage.from("caravan-images").list(id, { limit: 1000 });
  if (listError) return { success: false, message: listError.message };
  const paths = (files ?? []).filter((file) => file.name).map((file) => `${id}/${file.name}`);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("caravan-images").remove(paths);
    if (storageError) return { success: false, message: `Não foi possível limpar as imagens: ${storageError.message}` };
  }

  const { error: deleteError } = await supabase.from("caravans").delete().eq("id", id);
  if (deleteError) return { success: false, message: deleteError.message };
  revalidateCaravans(caravan.slug);
  return { success: true, message: "Pacote em rascunho excluído definitivamente." };
}

async function syncCollections(supabase: Awaited<ReturnType<typeof createClient>>, caravanId: string, input: CaravanFormInput) {
  const departures = input.departures.map((item, index) => ({
    id: item.id || randomUUID(),
    caravan_id: caravanId,
    label: emptyToNull(item.label),
    start_date: emptyToNull(item.startDate),
    end_date: emptyToNull(item.endDate),
    available_spots: item.availableSpots,
    status: item.status,
    notes: emptyToNull(item.notes),
    order_index: item.orderIndex || index * 10,
  }));
  const itinerary = input.itinerary.map((item, index) => ({
    id: item.id || randomUUID(),
    caravan_id: caravanId,
    day_number: item.day,
    title: item.title,
    location: emptyToNull(item.location),
    description: emptyToNull(item.description),
    image_url: emptyToNull(item.imagePath),
    meals: item.meals,
    accommodation: emptyToNull(item.accommodation),
    notes: emptyToNull(item.notes),
    order_index: item.orderIndex || index * 10,
  }));
  const images = input.images.map((item, index) => ({
    id: item.id || randomUUID(),
    caravan_id: caravanId,
    image_url: item.imagePath,
    alt_text: emptyToNull(item.altText),
    caption: emptyToNull(item.caption),
    order_index: item.orderIndex || index * 10,
  }));

  if (departures.length) {
    const { error } = await supabase.from("caravan_departures").upsert(departures);
    if (error) throw error;
  }
  if (itinerary.length) {
    const { error } = await supabase.from("caravan_itinerary_days").upsert(itinerary);
    if (error) throw error;
  }
  if (images.length) {
    const { error } = await supabase.from("caravan_images").upsert(images);
    if (error) throw error;
  }

  const collections = [
    ["caravan_departures", departures.map((item) => item.id)],
    ["caravan_itinerary_days", itinerary.map((item) => item.id)],
    ["caravan_images", images.map((item) => item.id)],
  ] as const;
  for (const [table, ids] of collections) {
    let query = supabase.from(table).delete().eq("caravan_id", caravanId);
    if (ids.length) query = query.not("id", "in", `(${ids.join(",")})`);
    const { error } = await query;
    if (error) throw error;
  }
}

export async function saveCaravanAction(rawInput: CaravanFormInput): Promise<CaravanActionResult> {
  const parsed = caravanFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do pacote." };
  }
  const { profile } = await requirePermission(parsed.data.id ? "caravans.update" : "caravans.create");
  if (parsed.data.published) await requirePermission("caravans.publish");

  const input = parsed.data;
  const supabase = await createClient();
  const { data: duplicate } = await supabase.from("caravans").select("id").eq("slug", input.slug).neq("id", input.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicate) return { success: false, message: "Já existe um pacote com este slug." };

  const payload = {
    title: input.title,
    slug: input.slug,
    destination: input.destination,
    category_id: input.categoryId || null,
    type: emptyToNull(input.type),
    summary: emptyToNull(input.summary),
    description: emptyToNull(input.description),
    duration: emptyToNull(input.duration),
    price: emptyToNull(input.price),
    currency: input.currency,
    status: input.status,
    card_image_url: emptyToNull(input.cardImagePath),
    hero_image_url: emptyToNull(input.heroImagePath),
    video_url: emptyToNull(input.videoUrl),
    video_thumbnail_url: emptyToNull(input.videoThumbnailPath),
    is_group_trip: input.isGroupTrip,
    is_accompanied: input.isAccompanied,
    has_portuguese_guide: input.hasPortugueseGuide,
    has_leehov_representative: input.hasLeehovRepresentative,
    has_travel_kit: input.hasTravelKit,
    has_travel_insurance: input.hasTravelInsurance,
    min_people: input.minPeople,
    max_people: input.maxPeople,
    leader_name: emptyToNull(input.leaderName),
    leader_bio: emptyToNull(input.leaderBio),
    leader_image_url: emptyToNull(input.leaderImagePath),
    included: input.included,
    not_included: input.notIncluded,
    notes: emptyToNull(input.notes),
    featured_home: input.featuredHome,
    featured_hero: input.featuredHero,
    hero_title: emptyToNull(input.heroTitle),
    hero_description: emptyToNull(input.heroDescription),
    hero_cta_text: emptyToNull(input.heroCtaText),
    hero_cta_url: emptyToNull(input.heroCtaUrl),
    hero_order: input.heroOrder,
    published: input.published,
    seo_title: emptyToNull(input.seoTitle),
    seo_description: emptyToNull(input.seoDescription),
    updated_by: profile.id,
  };

  try {
    let caravanId = input.id;
    let wasPublished = false;
    if (caravanId) {
      const { data: current } = await supabase.from("caravans").select("published").eq("id", caravanId).single();
      wasPublished = current?.published ?? false;
      const { error } = await supabase.from("caravans").update(payload).eq("id", caravanId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("caravans").insert({ ...payload, created_by: profile.id }).select("id").single();
      if (error) throw error;
      caravanId = data.id;
    }
    await syncCollections(supabase, caravanId, input);
    await emitWebhookEvent(input.id ? "caravan.updated" : "caravan.created", { caravanId, slug: input.slug });
    if (input.published && !wasPublished) await emitWebhookEvent("caravan.published", { caravanId, slug: input.slug });
    revalidateCaravans(input.slug);
    return { success: true, message: "Pacote salvo com sucesso.", id: caravanId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível salvar o pacote." };
  }
}

export async function setCaravanPublishedAction(id: string, published: boolean): Promise<CaravanActionResult> {
  const { profile } = await requirePermission("caravans.publish");
  const supabase = await createClient();
  const { data: caravan, error: loadError } = await supabase.from("caravans").select("id, slug, status, summary, description, duration, hero_image_url").eq("id", id).single();
  if (loadError) return { success: false, message: "Pacote não encontrado." };
  if (published && (caravan.status === "draft" || !caravan.summary || !caravan.description || !caravan.duration || !caravan.hero_image_url)) {
    return { success: false, message: "Complete status, resumo, descrição, duração e imagem principal antes de publicar." };
  }
  const { error } = await supabase.from("caravans").update({ published, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: error.message };
  if (published) await emitWebhookEvent("caravan.published", { caravanId: id, slug: caravan.slug });
  revalidateCaravans(caravan.slug);
  return { success: true, message: published ? "Pacote publicado." : "Pacote despublicado." };
}

export async function saveCaravanCategoryAction(formData: FormData): Promise<void> {
  await requirePermission("caravans.manage_categories");
  const parsed = caravanCategorySchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    active: formData.get("active") === "true",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: emptyToNull(parsed.data.description),
    active: parsed.data.active,
    sort_order: parsed.data.sortOrder,
  };
  if (parsed.data.id) await supabase.from("caravan_categories").update(payload).eq("id", parsed.data.id);
  else await supabase.from("caravan_categories").insert(payload);
  revalidatePath("/admin/caravanas");
  revalidatePath("/admin/caravanas/novo");
}

export async function createCaravanImageUploadAction(caravanId: string, file: { type: string; size: number }): Promise<CaravanActionResult> {
  await requirePermission("caravans.manage_media");
  const validation = validateCaravanImageMetadata(file.type, file.size);
  if (!validation.success) return validation;
  const supabase = createAdminClient();
  const { data: caravan, error: caravanError } = await supabase.from("caravans").select("id").eq("id", caravanId).maybeSingle();
  if (caravanError || !caravan) return { success: false, message: "Salve o pacote antes de enviar imagens." };
  const path = `${caravanId}/${randomUUID()}.${validation.extension}`;
  const { data, error } = await supabase.storage.from("caravan-images").createSignedUploadUrl(path);
  if (error || !data?.token) return { success: false, message: error?.message ?? "Não foi possível preparar o envio da imagem." };
  return { success: true, message: "Envio autorizado.", path, token: data.token };
}

export async function confirmCaravanImageUploadAction(caravanId: string, path: string): Promise<CaravanActionResult> {
  await requirePermission("caravans.manage_media");
  if (!path.startsWith(`${caravanId}/`)) return { success: false, message: "Caminho de imagem inválido." };
  const type = getCaravanImageTypeFromPath(path);
  if (!type) return { success: false, message: "Formato de imagem inválido." };

  const supabase = createAdminClient();
  const filename = path.slice(caravanId.length + 1);
  const { data: objects, error: listError } = await supabase.storage.from("caravan-images").list(caravanId, { limit: 1, search: filename });
  const object = objects?.find((item) => item.name === filename);
  const objectSize = Number(object?.metadata?.size ?? 0);
  const objectType = String(object?.metadata?.mimetype ?? "");
  if (listError || !object || objectSize <= 0 || objectSize > CARAVAN_IMAGE_MAX_BYTES || objectType !== type) {
    await supabase.storage.from("caravan-images").remove([path]);
    return { success: false, message: "A imagem enviada não passou pela validação de tamanho ou formato." };
  }

  const { data: signed, error: signedError } = await supabase.storage.from("caravan-images").createSignedUrl(path, 3600);
  if (signedError || !signed?.signedUrl) return { success: false, message: signedError?.message ?? "Não foi possível validar a imagem enviada." };

  try {
    const response = await fetch(signed.signedUrl, { cache: "no-store", headers: { Range: "bytes=0-31" } });
    if (!response.ok || !response.body) throw new Error("Imagem indisponível");
    const reader = response.body.getReader();
    const firstChunk = await reader.read();
    await reader.cancel();
    if (!firstChunk.value || !hasValidCaravanImageSignature(type, firstChunk.value)) throw new Error("Assinatura inválida");
  } catch {
    await supabase.storage.from("caravan-images").remove([path]);
    return { success: false, message: "O conteúdo do arquivo não corresponde ao formato informado." };
  }

  return { success: true, message: "Imagem enviada com sucesso.", path, url: signed.signedUrl };
}

export async function removeCaravanImageAction(caravanId: string, path: string): Promise<CaravanActionResult> {
  const { profile } = await requirePermission("caravans.manage_media");
  if (!path.startsWith(`${caravanId}/`)) return { success: false, message: "Caminho de imagem inválido." };
  const supabase = await createClient();
  const { data: caravan } = await supabase.from("caravans").select("slug, card_image_url, hero_image_url, video_thumbnail_url, leader_image_url").eq("id", caravanId).single();
  if (!caravan) return { success: false, message: "Pacote não encontrado." };
  const { error: storageError } = await supabase.storage.from("caravan-images").remove([path]);
  if (storageError) return { success: false, message: storageError.message };
  await supabase.from("caravan_images").delete().eq("caravan_id", caravanId).eq("image_url", path);
  const updates: TablesUpdate<"caravans"> = { updated_by: profile.id };
  if (caravan.card_image_url === path) updates.card_image_url = null;
  if (caravan.hero_image_url === path) updates.hero_image_url = null;
  if (caravan.video_thumbnail_url === path) updates.video_thumbnail_url = null;
  if (caravan.leader_image_url === path) updates.leader_image_url = null;
  await supabase.from("caravans").update(updates).eq("id", caravanId);
  await supabase.from("caravan_itinerary_days").update({ image_url: null }).eq("caravan_id", caravanId).eq("image_url", path);
  revalidateCaravans(caravan.slug);
  return { success: true, message: "Imagem removida." };
}
