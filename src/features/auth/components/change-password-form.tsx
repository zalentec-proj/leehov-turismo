"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPasswordAction } from "@/features/auth/account-actions";

const initialState = { success: false, message: "" };

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      {state.message ? <Alert variant={state.success ? "default" : "destructive"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <div className="space-y-2"><Label htmlFor="own-password">Nova senha</Label><Input id="own-password" name="password" type="password" autoComplete="new-password" minLength={12} required /></div>
      <div className="space-y-2"><Label htmlFor="own-confirmation">Confirmar senha</Label><Input id="own-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></div>
      <Button type="submit" disabled={pending}>Alterar senha</Button>
    </form>
  );
}
