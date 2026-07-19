import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type { AdminLead, LeadAttribution, LeadMetrics, LeadSource, LeadStatus } from "@/features/leads/types";
import { createClient } from "@/lib/supabase/server";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  message: string;
  source: string;
  caravan_id: string | null;
  status: LeadStatus;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  caravan: { id: string; title: string; slug: string } | null;
};

function mapLead(row: LeadRow): AdminLead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city ?? "",
    state: row.state ?? "",
    message: row.message,
    source: row.source as LeadSource,
    caravanId: row.caravan_id,
    status: row.status,
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as LeadAttribution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    caravan: row.caravan,
  };
}

export async function getAdminLeads(): Promise<AdminLead[]> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, email, phone, city, state, message, source, caravan_id, status, metadata, created_at, updated_at, caravan:caravans(id, title, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar os leads: ${error.message}`);
  return ((data ?? []) as unknown as LeadRow[]).map(mapLead);
}

export async function getRecentLeads(limit = 5): Promise<AdminLead[]> {
  const leads = await getAdminLeads();
  return leads.slice(0, limit);
}

export async function getLeadMetrics(): Promise<LeadMetrics> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("status");
  if (error) return { total: 0, new: 0, inProgress: 0, converted: 0 };
  return {
    total: data.length,
    new: data.filter((lead) => lead.status === "new").length,
    inProgress: data.filter((lead) => lead.status === "in_progress").length,
    converted: data.filter((lead) => lead.status === "converted").length,
  };
}
