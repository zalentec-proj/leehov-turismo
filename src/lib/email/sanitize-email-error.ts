export function sanitizeEmailError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "Falha desconhecida no provedor.");
  return raw
    .replace(/re_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/([?&](?:token|token_hash|access_token|refresh_token|code)=)[^&#\s]+/gi, "$1[redacted]")
    .replace(/\b(?:token|token_hash|access_token|refresh_token|password|cookie)\s*[:=]\s*[^,;\s]+/gi, "[redacted]")
    .slice(0, 500);
}
