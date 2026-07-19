import type { Enums } from "@/types/database";

export type TestimonialSource = "manual" | "google";
export type ReviewDisplayMode = Enums<"review_display_mode">;

export type TestimonialSummary = {
  id: string;
  name: string;
  roleTitle: string;
  city: string;
  rating: number;
  text: string;
  imageUrl: string;
  source: TestimonialSource;
  featured: boolean;
  orderIndex: number;
  createdAt: string;
};

export type Testimonial = TestimonialSummary & {
  active: boolean;
  imageAssetId: string;
  updatedAt: string;
};

export type GoogleReview = TestimonialSummary & {
  googleReviewId: string;
  profileUrl: string;
  replyComment: string;
  visible: boolean;
  syncedAt: string;
  expiresAt: string;
  replyStatus: "none" | "pending" | "synced" | "delete_pending" | "error";
  replyError: string;
};

export type GoogleBusinessConnection = {
  id: string;
  status: "pending_location" | "connected" | "disconnected" | "error";
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  googleMapsUrl: string;
  connectedAt: string;
  lastTokenRefreshAt: string;
};

export type GoogleBusinessSettings = {
  displayMode: ReviewDisplayMode;
  reviewsLimit: number;
  minRating: number;
  cacheHours: number;
  enabled: boolean;
  accountId: string;
  locationId: string;
  lastSyncAt: string;
  lastSyncStatus: string;
  lastSyncError: string;
  credentialsConfigured: boolean;
  apiAccessStatus: "pending" | "approved" | "blocked";
  connection: GoogleBusinessConnection | null;
};

export type TestimonialMetrics = {
  total: number;
  active: number;
  featured: number;
  googleVisible: number;
};

export type TestimonialActionResult = { success: boolean; message: string; id?: string };
