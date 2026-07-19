"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TurnstileField } from "@/components/leehov/shared/turnstile-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCaravanInterestAction } from "@/features/leads/actions";
import { caravanInterestLeadSchema, type CaravanInterestLeadInput } from "@/features/leads/schema";
import { collectAttribution } from "@/features/shared/attribution";

export function CaravanInterestForm({ caravanId, caravanTitle }: { caravanId: string; caravanTitle: string }) {
  const defaults: CaravanInterestLeadInput = {
    caravanId,
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    message: `Gostaria de receber mais informações sobre ${caravanTitle}.`,
    pagePath: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    company: "",
    turnstileToken: "",
  };
  const [result, setResult] = useState<{ message: string; whatsappUrl?: string } | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const form = useForm<CaravanInterestLeadInput>({ resolver: zodResolver(caravanInterestLeadSchema), defaultValues: defaults });
  const setTurnstileToken = useCallback((token: string) => form.setValue("turnstileToken", token), [form]);

  async function onSubmit(values: CaravanInterestLeadInput) {
    setResult(null);
    const response = await createCaravanInterestAction({ ...values, ...collectAttribution(), caravanId });
    if (!response.success) {
      toast.error(response.message);
      return;
    }
    form.reset(defaults);
    setTurnstileKey((value) => value + 1);
    setResult({ message: response.message, whatsappUrl: response.whatsappUrl });
    toast.success(response.message);
  }

  const error = (name: keyof CaravanInterestLeadInput) => form.formState.errors[name]?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor={`interest-name-${caravanId}`}>Nome</Label><Input id={`interest-name-${caravanId}`} autoComplete="name" {...form.register("name")} />{error("name") ? <p className="text-sm text-destructive">{error("name")}</p> : null}</div>
        <div className="space-y-2"><Label htmlFor={`interest-phone-${caravanId}`}>WhatsApp</Label><Input id={`interest-phone-${caravanId}`} type="tel" autoComplete="tel" {...form.register("phone")} />{error("phone") ? <p className="text-sm text-destructive">{error("phone")}</p> : null}</div>
      </div>
      <div className="space-y-2"><Label htmlFor={`interest-email-${caravanId}`}>E-mail</Label><Input id={`interest-email-${caravanId}`} type="email" autoComplete="email" {...form.register("email")} />{error("email") ? <p className="text-sm text-destructive">{error("email")}</p> : null}</div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2"><Label htmlFor={`interest-city-${caravanId}`}>Cidade</Label><Input id={`interest-city-${caravanId}`} autoComplete="address-level2" {...form.register("city")} />{error("city") ? <p className="text-sm text-destructive">{error("city")}</p> : null}</div>
        <div className="space-y-2"><Label htmlFor={`interest-state-${caravanId}`}>Estado</Label><Input id={`interest-state-${caravanId}`} autoComplete="address-level1" maxLength={50} {...form.register("state")} />{error("state") ? <p className="text-sm text-destructive">{error("state")}</p> : null}</div>
      </div>
      <div className="space-y-2"><Label htmlFor={`interest-message-${caravanId}`}>Mensagem</Label><Textarea id={`interest-message-${caravanId}`} rows={5} {...form.register("message")} />{error("message") ? <p className="text-sm text-destructive">{error("message")}</p> : null}</div>
      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true"><Label htmlFor={`interest-company-${caravanId}`}>Empresa</Label><Input id={`interest-company-${caravanId}`} tabIndex={-1} autoComplete="off" {...form.register("company")} /></div>
      <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
      <Button disabled={form.formState.isSubmitting} type="submit" className="rounded-full bg-leehov-blue-600 text-white">
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}{form.formState.isSubmitting ? "Enviando..." : "Quero saber mais"}
      </Button>
      {result ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900" role="status"><AlertDescription className="flex flex-col gap-3"><span>{result.message}</span>{result.whatsappUrl ? <a className="inline-flex items-center gap-2 font-bold underline" href={result.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />Continuar no WhatsApp</a> : null}</AlertDescription></Alert> : null}
    </form>
  );
}
