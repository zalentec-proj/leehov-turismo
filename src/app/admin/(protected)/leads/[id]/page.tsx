import { z } from "zod";
import { CommercialLeadPanel } from "@/features/conversions/components/operations";
import { getCommercialLeadDetails } from "@/features/conversions/queries";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth/permissions";
import { AdminLeadDetail } from "@/features/leads/components/admin-lead-detail";
import { getAdminLeadById, getLeadInteractions, getLeadOwners } from "@/features/leads/queries";
import { getPublicSiteSettings } from "@/features/settings/queries";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [lead, interactions, owners, settings, access, commercial] = await Promise.all([getAdminLeadById(id), getLeadInteractions(id), getLeadOwners(), getPublicSiteSettings(), requirePermission("leads.view"), getCommercialLeadDetails(id)]);
  if (!lead) notFound();
  return <div className="space-y-6"><AdminLeadDetail lead={lead} interactions={interactions} owners={owners} whatsappTemplate={lead.caravan ? settings.whatsapp.caravanTemplate : settings.whatsapp.generalTemplate} consultantName={access.profile.name || "equipe Leehov"} />
    {commercial.lead && <CommercialLeadPanel key={id} lead={commercial.lead} caravans={commercial.caravans} linkedReferences={commercial.references}
      interests={commercial.interests} allowEdit={access.permissions.includes("leads.update")} allowTestChange={access.profile.role === "admin"} />}
  </div>;
}
