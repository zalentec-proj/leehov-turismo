"use server";

import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/features/auth/queries";
import { popupSchema } from "@/features/popups/schema";
import type { PopupActionResult } from "@/features/popups/types";
import { getPublicSiteSettings } from "@/features/settings/queries";
import { createClient } from "@/lib/supabase/server";

function emptyToNull(value: string) { return value.trim() || null; }

function revalidatePopups() {
  for (const path of ["/", "/blog", "/caravanas", "/admin/popups"]) revalidatePath(path);
}

export async function savePopupAction(input: unknown): Promise<PopupActionResult> {
  const profile = await requireActiveProfile();
  const parsed = popupSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do pop-up." };
  const value = parsed.data;
  const supabase = await createClient();
  if (value.popupType === "caravan") {
    const { data: caravan } = await supabase.from("caravans").select("id").eq("id", value.relatedCaravanId).eq("published", true).maybeSingle();
    if (!caravan) return { success: false, message: "Selecione uma caravana publicada." };
  }
  if (value.popupType === "whatsapp" && value.active) {
    const settings = await getPublicSiteSettings();
    if (!settings.whatsapp.number) return { success: false, message: "Configure o WhatsApp institucional antes de ativar este pop-up." };
  }
  const payload = {
    title: value.title, description: emptyToNull(value.description), image_asset_id: value.imageAssetId || null,
    button_text: emptyToNull(value.buttonText), button_url: emptyToNull(value.buttonUrl), popup_type: value.popupType,
    related_caravan_id: value.relatedCaravanId || null, display_location: value.displayLocation, frequency: value.frequency,
    active: value.active, updated_by: profile.id,
  };
  if (value.id) {
    const { error } = await supabase.from("popups").update(payload).eq("id", value.id);
    if (error) return { success: false, message: error.code === "23505" ? "Já existe outro pop-up ativo. Desative-o primeiro." : error.message };
    revalidatePopups();
    return { success: true, message: "Pop-up atualizado.", id: value.id };
  }
  const { data, error } = await supabase.from("popups").insert({ ...payload, created_by: profile.id }).select("id").single();
  if (error) return { success: false, message: error.code === "23505" ? "Já existe outro pop-up ativo. Desative-o primeiro." : error.message };
  revalidatePopups();
  return { success: true, message: "Pop-up criado.", id: data.id };
}

export async function setPopupActiveAction(id: string, active: boolean): Promise<PopupActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { data: popup } = await supabase.from("popups").select("popup_type, related_caravan_id").eq("id", id).maybeSingle();
  if (!popup) return { success: false, message: "Pop-up não encontrado." };
  if (active && popup.popup_type === "caravan") {
    const { data: caravan } = await supabase.from("caravans").select("id").eq("id", popup.related_caravan_id ?? "").eq("published", true).maybeSingle();
    if (!caravan) return { success: false, message: "A caravana vinculada não está publicada." };
  }
  if (active && popup.popup_type === "whatsapp" && !(await getPublicSiteSettings()).whatsapp.number) return { success: false, message: "Configure o WhatsApp institucional antes de ativar." };
  const { error } = await supabase.from("popups").update({ active, updated_by: profile.id }).eq("id", id);
  if (error) return { success: false, message: error.code === "23505" ? "Já existe outro pop-up ativo." : error.message };
  revalidatePopups();
  return { success: true, message: active ? "Pop-up ativado." : "Pop-up desativado." };
}

export async function deletePopupAction(id: string): Promise<PopupActionResult> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("popups").select("active").eq("id", id).maybeSingle();
  if (!data) return { success: false, message: "Pop-up não encontrado." };
  if (data.active) return { success: false, message: "Desative o pop-up antes de excluí-lo." };
  const { error } = await supabase.from("popups").delete().eq("id", id).eq("active", false);
  if (error) return { success: false, message: error.message };
  revalidatePopups();
  return { success: true, message: "Pop-up excluído." };
}
