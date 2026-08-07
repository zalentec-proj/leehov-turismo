import { createElement } from "react";
import { NextResponse, type NextRequest } from "next/server";
import { AdminEmailChangedEmail } from "@/emails/templates/admin-email-changed-email";
import { hashOneTimeToken } from "@/features/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPendingOneTimeUse } from "@/features/auth/one-time-state";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token.length > 200) return NextResponse.redirect(new URL("/admin/login?error=invalid_link", request.url));
  const admin = createAdminClient();
  const { data: change } = await admin.from("user_email_change_requests")
    .select("id, profile_id, old_email, new_email, expires_at, consumed_at, revoked_at")
    .eq("token_hash", hashOneTimeToken(token))
    .maybeSingle();
  if (!change || !isPendingOneTimeUse({ expiresAt: change.expires_at, consumedAt: change.consumed_at, revokedAt: change.revoked_at })) {
    return NextResponse.redirect(new URL("/admin/login?error=expired_link", request.url));
  }
  const { data: profile } = await admin.from("profiles").select("name, active").eq("id", change.profile_id).maybeSingle();
  if (!profile?.active) return NextResponse.redirect(new URL("/admin/login?error=inactive", request.url));
  const now = new Date().toISOString();
  const { data: claimed } = await admin.from("user_email_change_requests")
    .update({ consumed_at: now })
    .eq("id", change.id)
    .is("consumed_at", null)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();
  if (!claimed) return NextResponse.redirect(new URL("/admin/login?error=expired_link", request.url));
  const { error: authError } = await admin.auth.admin.updateUserById(change.profile_id, { email: change.new_email, email_confirm: true });
  if (authError) {
    await admin.from("user_email_change_requests").update({ consumed_at: null }).eq("id", change.id).eq("consumed_at", now);
    return NextResponse.redirect(new URL("/admin/login?error=email_change", request.url));
  }
  const { error: profileError } = await admin.from("profiles").update({ email: change.new_email }).eq("id", change.profile_id);
  if (profileError) {
    await admin.auth.admin.updateUserById(change.profile_id, { email: change.old_email, email_confirm: true });
    await admin.from("user_email_change_requests").update({ consumed_at: null }).eq("id", change.id).eq("consumed_at", now);
    return NextResponse.redirect(new URL("/admin/login?error=email_change", request.url));
  }
  await admin.from("admin_audit_logs").insert({
    action: "user.email_changed",
    target_profile_id: change.profile_id,
    target_email: change.new_email,
    previous_values: { email: change.old_email },
    new_values: { email: change.new_email },
  });
  await sendTransactionalEmail({
    templateKey: "admin_email_changed",
    to: change.old_email,
    subject: "O e-mail do seu acesso Leehov foi alterado",
    react: createElement(AdminEmailChangedEmail, { name: profile?.name || "viajante", newEmail: change.new_email }),
    relatedEntityType: "profile",
    relatedEntityId: change.profile_id,
    idempotencyKey: `admin-email-changed-${change.id}`,
  });
  return NextResponse.redirect(new URL("/admin/login?email_changed=1", request.url));
}
