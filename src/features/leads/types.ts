export type LeadStatus = "new" | "in_progress" | "converted" | "archived";

export type LeadSource = "contact" | "caravan_interest" | "popup";

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
  createdAt: string;
  updatedAt: string;
};

export type AdminLead = Lead & {
  caravan: { id: string; title: string; slug: string } | null;
};

export type LeadMetrics = {
  total: number;
  new: number;
  inProgress: number;
  converted: number;
};

export type LeadActionResult = {
  success: boolean;
  message: string;
  id?: string;
  whatsappUrl?: string;
};
