import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-leehov-surface px-5">
      <Card className="w-full max-w-md rounded-[24px] border-leehov-border p-8 shadow-leehov-floating">
        <div className="mb-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-leehov-blue-500 text-white">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-leehov-navy-950">
            Acesso administrativo
          </h1>
          <p className="mt-3 text-sm leading-6 text-leehov-muted">
            Entre com seu e-mail e senha do Supabase Auth para acessar o painel.
          </p>
        </div>
        <LoginForm />
      </Card>
    </main>
  );
}
