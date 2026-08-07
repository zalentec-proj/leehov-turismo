export function isPendingOneTimeUse(input: {
  expiresAt: string;
  consumedAt?: string | null;
  revokedAt?: string | null;
  status?: string;
}, now = Date.now()) {
  return !input.consumedAt
    && !input.revokedAt
    && (!input.status || input.status === "pending")
    && Number.isFinite(new Date(input.expiresAt).getTime())
    && new Date(input.expiresAt).getTime() > now;
}
