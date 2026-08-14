"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  caravanCategorySchema,
  caravanFormSchema,
  getCaravanHeroIssues,
  getCaravanPublicationIssues,
  type CaravanFormInput,
  type CaravanValidationIssue,
} from "@/features/caravans/schema";
import { requirePermission } from "@/features/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";
import { emitWebhookEvent } from "@/lib/webhooks/events";
import { validateCaravanImage } from "@/features/caravans/image-validation";
import { createMediaAsset } from "@/features/media/service";

export type CaravanActionResult = {
  success: boolean;
  message: string;
  id?: string;
  assetId?: string;
  path?: string;
  url?: string;
  issues?: CaravanValidationIssue[];
  savedAsDraft?: boolean;
  disabledFeaturedHero?: boolean;
};

const emptyToNull = (value: string) => value.trim() || null;

class CaravanCollectionError extends Error {
  constructor(public readonly section: "Saídas" | "Roteiro" | "Galeria", cause: unknown) {
    super(getDatabaseErrorMessage(cause));
  }
}

function getDatabaseErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Erro desconhecido ao gravar os dados.";
}

function friendlySaveError(error: unknown) {
  const message = getDatabaseErrorMessage(error);
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const collectionPrefix = error instanceof CaravanCollectionError
    ? `As informações gerais foram salvas, mas a seção ${error.section} apresentou um erro: `
    : "";

  if (code === "23505" || /duplicate key|unique constraint/i.test(message)) {
    if (/slug/i.test(message)) return "Já existe um pacote com este slug. Escolha outro endereço.";
    if (/day_number|itinerary/i.test(message)) return `${collectionPrefix}há dois dias com o mesmo número.`;
    if (/image_url|caravan_images/i.test(message)) return `${collectionPrefix}uma imagem já está vinculada à galeria. Remova a duplicada e tente novamente.`;
    return `${collectionPrefix}há uma informação duplicada que precisa ser corrigida.`;
  }
  if (code === "23514" || /check constraint/i.test(message)) {
    return `${collectionPrefix}há um valor fora do formato permitido. Revise datas, vagas, ordem e quantidade de pessoas.`;
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return `${collectionPrefix}uma categoria, imagem ou vínculo selecionado não existe mais. Atualize a página e selecione novamente.`;
  }
  if (code === "42501" || /permission|row-level security|rls/i.test(message)) {
    return "Sua sessão não tem permissão para salvar este pacote. Entre novamente ou fale com o administrador.";
  }
  if (/fetch failed|network|timeout/i.test(message)) {
    return "A conexão falhou durante o salvamento. Verifique a internet e tente novamente.";
  }
  return `${collectionPrefix || "Não foi possível salvar o pacote: "}revise os campos informados e tente novamente.`;
}

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
    const { data: catalogued } = await supabase.from("media_assets").select("storage_path").eq("storage_bucket", "caravan-images").in("storage_path", paths);
    const preserved = new Set((catalogued ?? []).map((asset) => asset.storage_path));
    const removablePaths = paths.filter((path) => !preserved.has(path));
    const { error: storageError } = removablePaths.length ? await supabase.storage.from("caravan-images").remove(removablePaths) : { error: null };
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
    if (error) throw new CaravanCollectionError("Saídas", error);
  }
  if (itinerary.length) {
    const { error } = await supabase.from("caravan_itinerary_days").upsert(itinerary);
    if (error) throw new CaravanCollectionError("Roteiro", error);
  }
  if (images.length) {
    const { error } = await supabase.from("caravan_images").upsert(images);
    if (error) throw new CaravanCollectionError("Galeria", error);
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
    if (error) {
      const section = table === "caravan_departures" ? "Saídas" : table === "caravan_itinerary_days" ? "Roteiro" : "Galeria";
      throw new CaravanCollectionError(section, error);
    }
  }
}

export async function saveCaravanAction(rawInput: CaravanFormInput): Promise<CaravanActionResult> {
  const parsed = caravanFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    return {
      success: false,
      message: issues.length === 1 ? issues[0].message : `Corrija ${issues.length} campos antes de salvar.`,
      issues,
    };
  }
  const { profile } = await requirePermission(parsed.data.id ? "caravans.update" : "caravans.create");

  const publicationIssues = getCaravanPublicationIssues(parsed.data);
  const heroIssues = getCaravanHeroIssues(parsed.data);
  const savedAsDraft = parsed.data.published && publicationIssues.length > 0;
  const disabledFeaturedHero = parsed.data.featuredHero && heroIssues.length > 0;
  const input: CaravanFormInput = {
    ...parsed.data,
    published: savedAsDraft ? false : parsed.data.published,
    featuredHero: disabledFeaturedHero ? false : parsed.data.featuredHero,
  };
  if (input.published) await requirePermission("caravans.publish");

  const supabase = await createClient();
  const { data: duplicate } = await supabase.from("caravans").select("id").eq("slug", input.slug).neq("id", input.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicate) return { success: false, message: "Já existe um pacote com este slug.", issues: [{ path: "slug", message: "Escolha outro slug." }] };

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
    try {
      await emitWebhookEvent(input.id ? "caravan.updated" : "caravan.created", { caravanId, slug: input.slug });
      if (input.published && !wasPublished) await emitWebhookEvent("caravan.published", { caravanId, slug: input.slug });
    } catch (error) {
      console.warn("[caravans] Pacote salvo, mas o webhook não foi enfileirado", {
        caravanId,
        error: getDatabaseErrorMessage(error),
      });
    }
    try {
      revalidateCaravans(input.slug);
    } catch (error) {
      console.warn("[caravans] Pacote salvo, mas a revalidação falhou", {
        caravanId,
        error: getDatabaseErrorMessage(error),
      });
    }
    const warnings = [...publicationIssues, ...heroIssues];
    const message = savedAsDraft
      ? "Pacote salvo como rascunho. Complete os itens indicados para publicá-lo."
      : disabledFeaturedHero
        ? "Pacote salvo. O destaque no Hero ficou desativado até os campos obrigatórios serem preenchidos."
        : "Pacote salvo com sucesso.";
    return { success: true, message, id: caravanId, issues: warnings, savedAsDraft, disabledFeaturedHero };
  } catch (error) {
    console.error("[caravans] Falha ao salvar pacote", {
      caravanId: input.id || null,
      slug: input.slug,
      error: getDatabaseErrorMessage(error),
    });
    return { success: false, message: friendlySaveError(error) };
  }
}

export async function setCaravanPublishedAction(id: string, published: boolean): Promise<CaravanActionResult> {
  const { profile } = await requirePermission("caravans.publish");
  const supabase = await createClient();
  const { data: caravan, error: loadError } = await supabase.from("caravans").select("id, slug, status, summary, description, duration, hero_image_url").eq("id", id).single();
  if (loadError) return { success: false, message: "Pacote não encontrado." };
  if (published) {
    const issues: CaravanValidationIssue[] = [];
    if (caravan.status === "draft") issues.push({ path: "status", message: "Escolha um status público." });
    if (!caravan.summary) issues.push({ path: "summary", message: "Inclua um resumo." });
    if (!caravan.description) issues.push({ path: "description", message: "Inclua a descrição." });
    if (!caravan.duration) issues.push({ path: "duration", message: "Informe a duração." });
    if (!caravan.hero_image_url) issues.push({ path: "heroImagePath", message: "Inclua uma imagem principal." });
    if (issues.length) {
      return {
        success: false,
        message: `Não foi possível publicar: faltam ${issues.length} ${issues.length === 1 ? "item" : "itens"}. O rascunho permanece salvo.`,
        issues,
      };
    }
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

export async function uploadCaravanImageAction(caravanId: string, formData: FormData): Promise<CaravanActionResult> {
  const startedAt = Date.now();
  const { profile } = await requirePermission("caravans.manage_media");
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, message: "Selecione uma imagem." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateCaravanImage(file.type, file.size, bytes.subarray(0, 32));
  if (!validation.success) return validation;

  const supabase = createAdminClient();
  const { data: caravan, error: caravanError } = await supabase.from("caravans").select("id, title, slug").eq("id", caravanId).maybeSingle();
  if (caravanError || !caravan) return { success: false, message: "Salve o pacote antes de enviar imagens." };
  try {
    const role = String(formData.get("role") ?? "gallery");
    const asset = await createMediaAsset({
      bytes,
      extension: validation.extension,
      fileName: file.name,
      mimeType: file.type,
      altText: caravan.title,
      folder: "packages",
      sourceType: "package",
      sourceId: caravan.id,
      sourceLabel: caravan.title,
      tags: [caravan.slug, role],
      createdBy: profile.id,
    });
    revalidatePath("/admin/midia");
    console.info(JSON.stringify({ level: "info", message: "caravan image uploaded", caravanId, assetId: asset.id, size: file.size, type: file.type, durationMs: Date.now() - startedAt }));
    return { success: true, message: "Imagem enviada e adicionada à Biblioteca de Mídia.", assetId: asset.id, path: asset.storagePath, url: asset.signedUrl };
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "caravan image upload failed", caravanId, error: error instanceof Error ? error.message : "unknown", durationMs: Date.now() - startedAt }));
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível enviar a imagem." };
  }
}

export async function removeCaravanImageAction(caravanId: string, path: string): Promise<CaravanActionResult> {
  const { profile } = await requirePermission("caravans.manage_media");
  const admin = createAdminClient();
  const { data: catalogued } = await admin
    .from("media_assets")
    .select("id, storage_bucket")
    .eq("storage_path", path)
    .maybeSingle();
  const isLegacyCaravanPath = path.startsWith(`${caravanId}/`);
  if (!catalogued && !isLegacyCaravanPath) return { success: false, message: "Caminho de imagem inválido." };
  const supabase = await createClient();
  const { data: caravan } = await supabase.from("caravans").select("slug, card_image_url, hero_image_url, video_thumbnail_url, leader_image_url").eq("id", caravanId).single();
  if (!caravan) return { success: false, message: "Pacote não encontrado." };
  if (!catalogued) {
    const { error: storageError } = await supabase.storage.from("caravan-images").remove([path]);
    if (storageError) return { success: false, message: storageError.message };
  }
  await supabase.from("caravan_images").delete().eq("caravan_id", caravanId).eq("image_url", path);
  const updates: TablesUpdate<"caravans"> = { updated_by: profile.id };
  if (caravan.card_image_url === path) updates.card_image_url = null;
  if (caravan.hero_image_url === path) updates.hero_image_url = null;
  if (caravan.video_thumbnail_url === path) updates.video_thumbnail_url = null;
  if (caravan.leader_image_url === path) updates.leader_image_url = null;
  await supabase.from("caravans").update(updates).eq("id", caravanId);
  await supabase.from("caravan_itinerary_days").update({ image_url: null }).eq("caravan_id", caravanId).eq("image_url", path);
  revalidateCaravans(caravan.slug);
  return { success: true, message: catalogued ? "Imagem desvinculada. O arquivo continua disponível na Biblioteca de Mídia." : "Imagem removida." };
}
