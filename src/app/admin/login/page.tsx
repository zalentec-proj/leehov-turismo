import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            Login sera conectado ao Supabase Auth na fase de admin base.
          </p>
        </div>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="admin@leehov.com.br" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button type="button" className="w-full rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}
