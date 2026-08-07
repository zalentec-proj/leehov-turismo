import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email_changed?: string }> }) {
  const params = await searchParams;
  const linkError = params.error === "invalid_link" || params.error === "expired_link";
  const accessError = params.error === "inactive"
    ? "Esta conta está suspensa ou ainda não foi ativada. Fale com o administrador geral."
    : params.error === "session"
      ? "Sua sessão expirou. Entre novamente."
      : null;
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
            Entre com seu e-mail e senha para acessar o painel.
          </p>
        </div>
        {linkError ? <Alert variant="destructive" className="mb-5"><AlertDescription>Este link expirou, já foi utilizado ou não é válido. Solicite um novo convite ou uma nova recuperação de senha.</AlertDescription></Alert> : null}
        {accessError ? <Alert variant="destructive" className="mb-5"><AlertDescription>{accessError}</AlertDescription></Alert> : null}
        {params.email_changed === "1" ? <Alert className="mb-5"><AlertDescription>Novo e-mail confirmado. Entre novamente com o endereço atualizado.</AlertDescription></Alert> : null}
        <LoginForm />
      </Card>
    </main>
  );
}
