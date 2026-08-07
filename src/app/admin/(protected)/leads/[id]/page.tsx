import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth/permissions";
import { AdminLeadDetail } from "@/features/leads/components/admin-lead-detail";
import { getAdminLeadById, getLeadInteractions, getLeadOwners } from "@/features/leads/queries";
import { getPublicSiteSettings } from "@/features/settings/queries";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, interactions, owners, settings, access] = await Promise.all([getAdminLeadById(id), getLeadInteractions(id), getLeadOwners(), getPublicSiteSettings(), requirePermission("leads.view")]);
  if (!lead) notFound();
  return <AdminLeadDetail lead={lead} interactions={interactions} owners={owners} whatsappTemplate={lead.caravan ? settings.whatsapp.caravanTemplate : settings.whatsapp.generalTemplate} consultantName={access.profile.name || "equipe Leehov"} />;
}
