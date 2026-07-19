"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { caravanCategorySchema, caravanFormSchema, type CaravanFormInput } from "@/features/caravans/schema";
import { requireActiveProfile, requireAdminProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";
import { emitWebhookEvent } from "@/lib/webhooks/events";

type CaravanActionResult = { success: boolean; message: string; id?: string; path?: string; url?: string };

const emptyToNull = (value: string) => value.trim() || null;

function revalidateCaravans(slug?: string) {
  revalidatePath("/");
  revalidatePath("/caravanas");
  revalidatePath("/admin");
  revalidatePath("/admin/caravanas");
  if (slug) revalidatePath(`/caravanas/${slug}`);
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
  const profile = await requireActiveProfile();
  const parsed = caravanFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados da caravana." };
  }

  const input = parsed.data;
  const supabase = await createClient();
  const { data: duplicate } = await supabase.from("caravans").select("id").eq("slug", input.slug).neq("id", input.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicate) return { success: false, message: "Já existe uma caravana com este slug." };

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
    return { success: true, message: "Caravana salva com sucesso.", id: caravanId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível salvar a caravana." };
  }
}

export async function setCaravanPublishedAction(id: string, published: boolean): Promise<CaravanActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { data: caravan, error: loadError } = await supabase.from("caravans").select("id, slug, status, summary, description, duration, hero_image_url").eq("id", id).single();
  if (loadError) return { success: false, message: "Caravana não encontrada." };
  if (published && (caravan.status === "draft" || !caravan.summary || !caravan.description || !caravan.duration || !caravan.hero_image_url)) {
    return { success: false, message: "Complete status, resumo, descrição, duração e imagem principal antes de publicar." };
  }
  const { error } = await supabase.from("caravans").update({ published, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: error.message };
  if (published) await emitWebhookEvent("caravan.published", { caravanId: id, slug: caravan.slug });
  revalidateCaravans(caravan.slug);
  return { success: true, message: published ? "Caravana publicada." : "Caravana despublicada." };
}

export async function saveCaravanCategoryAction(formData: FormData): Promise<void> {
  await requireAdminProfile();
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

function validImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "image/avif") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp" && ["avif", "avis", "mif1"].includes(new TextDecoder().decode(bytes.slice(8, 12)));
  return false;
}

export async function uploadCaravanImageAction(caravanId: string, formData: FormData): Promise<CaravanActionResult> {
  await requireActiveProfile();
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, message: "Selecione uma imagem." };
  if (file.size > 8 * 1024 * 1024) return { success: false, message: "A imagem deve ter no máximo 8 MiB." };
  const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);
  const extension = allowed.get(file.type);
  if (!extension) return { success: false, message: "Use uma imagem JPEG, PNG, WebP ou AVIF." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validImageSignature(file.type, bytes)) return { success: false, message: "O conteúdo do arquivo não corresponde ao formato informado." };

  const supabase = await createClient();
  const { data: caravan } = await supabase.from("caravans").select("id").eq("id", caravanId).maybeSingle();
  if (!caravan) return { success: false, message: "Salve a caravana antes de enviar imagens." };
  const path = `${caravanId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("caravan-images").upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { success: false, message: error.message };
  const { data } = await supabase.storage.from("caravan-images").createSignedUrl(path, 3600);
  return { success: true, message: "Imagem enviada com sucesso.", path, url: data?.signedUrl };
}

export async function removeCaravanImageAction(caravanId: string, path: string): Promise<CaravanActionResult> {
  const profile = await requireActiveProfile();
  if (!path.startsWith(`${caravanId}/`)) return { success: false, message: "Caminho de imagem inválido." };
  const supabase = await createClient();
  const { data: caravan } = await supabase.from("caravans").select("slug, card_image_url, hero_image_url, video_thumbnail_url, leader_image_url").eq("id", caravanId).single();
  if (!caravan) return { success: false, message: "Caravana não encontrada." };
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
