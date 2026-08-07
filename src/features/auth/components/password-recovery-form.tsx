"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordRecoveryAction } from "@/features/auth/account-actions";

const initialState = { success: false, message: "" };

export function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState(requestPasswordRecoveryAction, initialState);
  return (
    <form action={action} className="space-y-5">
      {state.message ? <Alert variant={state.success ? "default" : "destructive"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail administrativo</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Enviando..." : "Receber instruções"}
      </Button>
    </form>
  );
}
