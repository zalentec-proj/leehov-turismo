import { Card } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { MfaManager } from "@/features/auth/components/mfa-manager";
import { requireActiveProfile } from "@/features/auth/queries";

export default async function MyAccountPage() {
  const profile = await requireActiveProfile();
  return (
    <div className="space-y-8">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Segurança</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Minha conta</h2><p className="mt-3 text-sm text-leehov-muted">{profile.name || "Usuário"} · {profile.email}</p></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[20px] border-leehov-border p-6"><h3 className="mb-5 text-xl font-bold text-leehov-navy-950">Alterar senha</h3><ChangePasswordForm /></Card>
        <Card className="rounded-[20px] border-leehov-border p-6"><MfaManager /></Card>
      </div>
    </div>
  );
}
