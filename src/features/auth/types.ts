import type { Tables } from "@/types/database";

export type AdminProfile = Pick<
  Tables<"profiles">,
  "id" | "name" | "email" | "role" | "active" | "invited_at" | "accepted_at" | "suspended_at"
>;

export type AdminUser = AdminProfile & {
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  mfaEnabled: boolean;
  permissions: string[];
  overrides: Record<string, boolean>;
  inviteStatus: "pending" | "accepted" | "revoked" | "failed" | "expired" | null;
  inviteExpiresAt: string | null;
  lastEmailStatus: string | null;
};
