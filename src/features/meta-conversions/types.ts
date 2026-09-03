export type MetaConversionSettings = {
  enabled: boolean;
  sourceId: string;
  pixelId: string;
  testEventCode: string;
  credentialsReady: boolean;
};

export type MetaConversionCampaign = { id: string; name: string; active: boolean };
export type MetaConversionEvent = {
  id: string;
  dealId: string;
  routeName: string;
  saleValue: number | null;
  status: "pending" | "processing" | "sent" | "failed" | "ignored" | "review_required";
  attempts: number;
  error: string;
  createdAt: string;
  completedAt: string;
};
export type MetaConversionMetrics = { sent: number; ignored: number; failed: number; pending: number; reviewRequired: number };
