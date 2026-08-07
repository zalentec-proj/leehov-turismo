import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MfaChallenge } from "@/features/auth/components/mfa-challenge";
import { firstAllowedAdminPath, getEffectivePermissions } from "@/features/auth/permissions";
import { getCurrentProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function MfaVerificationPage() {
  const profile = await getCurrentProfile();
  if (!profile?.active) redirect("/admin/login?error=session");
  const supabase = await createClient();
  const [{ data: factors }, permissions] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    getEffectivePermissions(profile.id, profile.role, profile.active),
  ]);
  const factor = factors?.totp.find((item) => item.status === "verified");
  if (!factor) redirect(firstAllowedAdminPath(permissions));
  return (
    <main className="grid min-h-screen place-items-center bg-leehov-surface px-5">
      <Card className="w-full max-w-md rounded-[24px] border-leehov-border p-8 shadow-leehov-floating">
        <div className="mb-8"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-leehov-blue-500 text-white"><ShieldCheck className="size-5" /></div><h1 className="text-3xl font-extrabold text-leehov-navy-950">Verificação em duas etapas</h1><p className="mt-3 text-sm leading-6 text-leehov-muted">Digite o código temporário do seu aplicativo autenticador.</p></div>
        <MfaChallenge factorId={factor.id} destination={firstAllowedAdminPath(permissions)} />
      </Card>
    </main>
  );
}
