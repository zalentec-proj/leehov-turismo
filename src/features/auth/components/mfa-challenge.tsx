"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function MfaChallenge({ factorId, destination }: { factorId: string; destination: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function verify() {
    setPending(true); setError("");
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
    if (verifyError) { setError("Código inválido ou expirado."); setPending(false); return; }
    router.replace(destination); router.refresh();
  }
  return (
    <div className="space-y-5">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="space-y-2"><Label htmlFor="code">Código do autenticador</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={8} autoFocus /></div>
      <Button type="button" onClick={verify} disabled={pending || code.replace(/\s/g, "").length < 6} className="w-full rounded-full bg-leehov-blue-600 text-white">{pending ? <Loader2 className="size-4 animate-spin" /> : null}{pending ? "Verificando..." : "Verificar e continuar"}</Button>
    </div>
  );
}
