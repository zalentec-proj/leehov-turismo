import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PasswordRecoveryForm } from "@/features/auth/components/password-recovery-form";

export default function PasswordRecoveryPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-leehov-surface px-5">
      <Card className="w-full max-w-md rounded-[24px] border-leehov-border p-8 shadow-leehov-floating">
        <div className="mb-8"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-leehov-blue-500 text-white"><KeyRound className="size-5" /></div><h1 className="text-3xl font-extrabold text-leehov-navy-950">Recuperar acesso</h1><p className="mt-3 text-sm leading-6 text-leehov-muted">Enviaremos um link seguro se houver uma conta ativa para o endereço informado.</p></div>
        <PasswordRecoveryForm />
        <p className="mt-6 text-center text-sm"><Link href="/admin/login" className="font-semibold text-leehov-blue-600 hover:underline">Voltar ao login</Link></p>
      </Card>
    </main>
  );
}
