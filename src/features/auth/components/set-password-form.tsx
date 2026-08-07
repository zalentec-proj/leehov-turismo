"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPasswordAction } from "@/features/auth/account-actions";

const initialState = { success: false, message: "" };

export function SetPasswordForm({ attempt }: { attempt?: string }) {
  const [state, action, pending] = useActionState(setPasswordAction, initialState);
  return (
    <form action={action} className="space-y-5">
      {attempt ? <input type="hidden" name="attempt" value={attempt} /> : null}
      {state.message ? <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <div className="space-y-2"><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required /></div>
      <div className="space-y-2"><Label htmlFor="confirmation">Confirmar senha</Label><Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></div>
      <p className="text-xs leading-5 text-leehov-muted">Use ao menos 12 caracteres, com letra maiúscula, minúscula e número.</p>
      <Button type="submit" disabled={pending} className="w-full rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Salvando..." : "Definir senha e entrar"}
      </Button>
    </form>
  );
}
