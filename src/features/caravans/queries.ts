import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapCaravanDetail, mapCaravanSummary, type CaravanQueryRow } from "@/features/caravans/mappers";
import type { AdminCaravan, CaravanCategory, CaravanDetail, CaravanSummary } from "@/features/caravans/types";

const caravanSelect = `
  *,
  caravan_categories (*),
  caravan_departures (*),
  caravan_itinerary_days (*),
  caravan_images (*)
`;

async function getCaravanRows(options: {
  published?: boolean;
  featuredHome?: boolean;
  featuredHero?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase.from("caravans").select(caravanSelect);
  if (options.published !== undefined) query = query.eq("published", options.published);
  if (options.featuredHome) query = query.eq("featured_home", true);
  if (options.featuredHero) query = query.eq("featured_hero", true);
  const { data, error } = await query.order(options.featuredHero ? "hero_order" : "published_at", { ascending: options.featuredHero, nullsFirst: false });
  if (error) throw new Error(`Não foi possível carregar as caravanas: ${error.message}`);
  return { supabase, rows: (data ?? []) as unknown as CaravanQueryRow[] };
}

export async function getPublishedCaravans(): Promise<CaravanSummary[]> {
  const { supabase, rows } = await getCaravanRows({ published: true });
  return Promise.all(rows.map((row) => mapCaravanSummary(supabase, row)));
}

export async function getFeaturedCaravans(): Promise<CaravanSummary[]> {
  const { supabase, rows } = await getCaravanRows({ published: true, featuredHome: true });
  return Promise.all(rows.map((row) => mapCaravanSummary(supabase, row)));
}

export async function getHeroCaravans(): Promise<CaravanDetail[]> {
  const { supabase, rows } = await getCaravanRows({ published: true, featuredHero: true });
  return Promise.all(rows.map((row) => mapCaravanDetail(supabase, row)));
}

export async function getCaravanBySlug(slug: string): Promise<CaravanDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("caravans").select(caravanSelect).eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a caravana: ${error.message}`);
  return data ? mapCaravanDetail(supabase, data as unknown as CaravanQueryRow) : null;
}

export async function getAdminCaravans(): Promise<AdminCaravan[]> {
  const { supabase, rows } = await getCaravanRows({});
  return Promise.all(rows.map((row) => mapCaravanDetail(supabase, row)));
}

export async function getCaravanById(id: string): Promise<AdminCaravan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("caravans").select(caravanSelect).eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a caravana: ${error.message}`);
  return data ? mapCaravanDetail(supabase, data as unknown as CaravanQueryRow) : null;
}

export async function getCaravanCategories(): Promise<CaravanCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("caravan_categories").select("id, name, slug, description, active, sort_order").order("sort_order");
  if (error) throw new Error(`Não foi possível carregar as categorias: ${error.message}`);
  return data;
}
