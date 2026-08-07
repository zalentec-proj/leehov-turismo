"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; status: string; friendly_name?: string };

export function MfaManager() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  async function refresh() {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors(data?.all ?? []);
  }
  useEffect(() => {
    let mounted = true;
    void createClient().auth.mfa.listFactors().then(({ data }) => {
      if (mounted) setFactors(data?.all ?? []);
    });
    return () => { mounted = false; };
  }, []);
  async function enroll() {
    setPending(true);
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Leehov Admin" });
    if (error) toast.error("Não foi possível iniciar o cadastro.");
    else setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setPending(false);
  }
  async function verify() {
    if (!enrollment) return;
    setPending(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrollment.id, code: code.replace(/\s/g, "") });
    if (error) toast.error("Código inválido ou expirado.");
    else { toast.success("MFA ativado com sucesso."); setEnrollment(null); setCode(""); await refresh(); }
    setPending(false);
  }
  async function remove(id: string) {
    setPending(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId: id });
    if (error) toast.error("Não foi possível remover o fator."); else { toast.success("MFA removido."); await refresh(); }
    setPending(false);
  }
  const verified = factors.filter((factor) => factor.status === "verified");
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5 text-leehov-blue-600" /><div><p className="font-bold text-leehov-navy-950">Autenticação em duas etapas</p><p className="mt-1 text-sm leading-6 text-leehov-muted">Use um aplicativo TOTP, como Google Authenticator, 1Password ou Authy.</p></div></div>
      {verified.map((factor) => <div key={factor.id} className="flex items-center justify-between rounded-xl border border-leehov-border p-4"><div><p className="font-semibold">{factor.friendly_name || "Aplicativo autenticador"}</p><p className="text-xs text-emerald-700">Verificado</p></div><Button type="button" variant="outline" disabled={pending} onClick={() => remove(factor.id)}>Remover</Button></div>)}
      {!enrollment ? <Button type="button" onClick={enroll} disabled={pending || verified.length > 0} variant="outline">{pending ? <Loader2 className="size-4 animate-spin" /> : null}{verified.length ? "MFA já configurado" : "Configurar aplicativo"}</Button> : (
        <div className="space-y-4 rounded-2xl border border-leehov-border bg-white p-5">
          <Image src={enrollment.qr} alt="QR Code para configurar o autenticador" width={192} height={192} unoptimized className="rounded-lg" />
          <p className="break-all rounded-lg bg-leehov-surface p-3 font-mono text-xs">{enrollment.secret}</p>
          <Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Código de 6 dígitos" />
          <Button type="button" onClick={verify} disabled={pending || code.length < 6}>Confirmar MFA</Button>
        </div>
      )}
    </div>
  );
}
