export type LeadStatus = "new" | "in_progress" | "converted" | "archived";

export type LeadSource = "contact" | "caravan_interest" | "popup" | "manual" | "whatsapp" | "phone" | "referral" | "social" | "other";

export type LeadInteractionType = "note" | "status_change" | "assignment" | "follow_up" | "call" | "whatsapp" | "profile_update";

export type LeadAttribution = {
  pagePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  source: LeadSource;
  caravanId: string | null;
  status: LeadStatus;
  metadata: LeadAttribution;
  assignedTo: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadOwner = { id: string; name: string; email: string };

export type AdminLead = Lead & {
  caravan: { id: string; title: string; slug: string } | null;
  assignee: LeadOwner | null;
};

export type LeadInteraction = {
  id: string;
  leadId: string;
  type: LeadInteractionType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  createdBy: LeadOwner | null;
  createdAt: string;
};

export type LeadMetrics = { total: number; new: number; inProgress: number; converted: number };

export type LeadActionResult = { success: boolean; message: string; id?: string; whatsappUrl?: string };
