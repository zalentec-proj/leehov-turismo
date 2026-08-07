"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const initialState = { success: false, message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Validando acesso..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-leehov-muted">
        <Link href="/admin/recuperar-senha" className="font-semibold text-leehov-blue-600 hover:underline">Esqueci minha senha</Link>
      </p>
    </form>
  );
}
