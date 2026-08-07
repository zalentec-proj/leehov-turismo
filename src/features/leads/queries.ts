import "server-only";

import { requirePermission } from "@/features/auth/permissions";
import type { AdminLead, LeadAttribution, LeadInteraction, LeadMetrics, LeadOwner, LeadSource, LeadStatus } from "@/features/leads/types";
import { createAdminClient } from "@/lib/supabase/admin";

type LeadRow = {
  id: string; name: string; email: string | null; phone: string; city: string | null; state: string | null; message: string | null;
  source: string; caravan_id: string | null; status: LeadStatus; metadata: unknown; assigned_to: string | null; next_follow_up_at: string | null;
  created_at: string; updated_at: string;
  caravan: { id: string; title: string; slug: string } | null;
  assignee: LeadOwner | null;
};

function mapLead(row: LeadRow): AdminLead {
  return {
    id: row.id, name: row.name, email: row.email ?? "", phone: row.phone, city: row.city ?? "", state: row.state ?? "", message: row.message ?? "",
    source: row.source as LeadSource, caravanId: row.caravan_id, status: row.status,
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as LeadAttribution,
    assignedTo: row.assigned_to, nextFollowUpAt: row.next_follow_up_at, createdAt: row.created_at, updatedAt: row.updated_at,
    caravan: row.caravan, assignee: row.assignee,
  };
}

const leadSelect = "id, name, email, phone, city, state, message, source, caravan_id, status, metadata, assigned_to, next_follow_up_at, created_at, updated_at, caravan:caravans(id, title, slug), assignee:profiles!leads_assigned_to_fkey(id, name, email)";

export async function getAdminLeads(): Promise<AdminLead[]> {
  await requirePermission("leads.view");
  const { data, error } = await createAdminClient().from("leads").select(leadSelect).order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os leads: ${error.message}`);
  return ((data ?? []) as unknown as LeadRow[]).map(mapLead);
}

export async function getAdminLeadById(id: string): Promise<AdminLead | null> {
  await requirePermission("leads.view");
  const { data, error } = await createAdminClient().from("leads").select(leadSelect).eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o lead.");
  return data ? mapLead(data as unknown as LeadRow) : null;
}

export async function getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  await requirePermission("leads.view");
  const { data, error } = await createAdminClient().from("lead_interactions").select("id, lead_id, interaction_type, title, body, metadata, created_at, created_by_profile:profiles!lead_interactions_created_by_fkey(id, name, email)").eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar a linha do tempo.");
  return (data ?? []).map((row) => ({
    id: row.id, leadId: row.lead_id, type: row.interaction_type, title: row.title, body: row.body ?? "",
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {},
    createdBy: row.created_by_profile as unknown as LeadOwner | null, createdAt: row.created_at,
  }));
}

export async function getLeadOwners(): Promise<LeadOwner[]> {
  await requirePermission("leads.view");
  const { data } = await createAdminClient().from("profiles").select("id, name, email").eq("active", true).order("name");
  return (data ?? []).map((profile) => ({ id: profile.id, name: profile.name || profile.email, email: profile.email }));
}

export async function getRecentLeads(limit = 5) { return (await getAdminLeads()).slice(0, limit); }

export async function getLeadMetrics(): Promise<LeadMetrics> {
  await requirePermission("leads.view");
  const { data, error } = await createAdminClient().from("leads").select("status");
  if (error) return { total: 0, new: 0, inProgress: 0, converted: 0 };
  return { total: data.length, new: data.filter((lead) => lead.status === "new").length, inProgress: data.filter((lead) => lead.status === "in_progress").length, converted: data.filter((lead) => lead.status === "converted").length };
}
