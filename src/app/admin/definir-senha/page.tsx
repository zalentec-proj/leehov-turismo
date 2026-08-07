import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/login?error=invalid_link");
  const { attempt } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-leehov-surface px-5">
      <Card className="w-full max-w-md rounded-[24px] border-leehov-border p-8 shadow-leehov-floating">
        <div className="mb-8"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-leehov-blue-500 text-white"><ShieldCheck className="size-5" /></div><h1 className="text-3xl font-extrabold text-leehov-navy-950">Defina sua senha</h1><p className="mt-3 text-sm leading-6 text-leehov-muted">Conclua o primeiro acesso ou crie uma nova senha para continuar.</p></div>
        <SetPasswordForm attempt={attempt} />
      </Card>
    </main>
  );
}
