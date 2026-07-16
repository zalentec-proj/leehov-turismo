import "server-only";

export async function logEmailAttempt() {
  return {
    skipped: true,
    reason: "email_logs will be persisted after Supabase migrations.",
  };
}
