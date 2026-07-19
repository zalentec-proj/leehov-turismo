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
import { collectAttribution } from "@/features/shared/attribution";
import { createContactLeadAction } from "@/features/leads/actions";
import { contactLeadSchema, type ContactLeadInput } from "@/features/leads/schema";

const defaults: ContactLeadInput = {
  name: "",
  email: "",
  phone: "",
  message: "",
  pagePath: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  company: "",
  turnstileToken: "",
};

export function ContactForm() {
  const [result, setResult] = useState<{ message: string; whatsappUrl?: string } | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const form = useForm<ContactLeadInput>({ resolver: zodResolver(contactLeadSchema), defaultValues: defaults });
  const setTurnstileToken = useCallback((token: string) => form.setValue("turnstileToken", token), [form]);

  async function onSubmit(values: ContactLeadInput) {
    setResult(null);
    const response = await createContactLeadAction({ ...values, ...collectAttribution() });
    if (!response.success) {
      toast.error(response.message);
      return;
    }
    form.reset(defaults);
    setTurnstileKey((value) => value + 1);
    setResult({ message: response.message, whatsappUrl: response.whatsappUrl });
    toast.success(response.message);
  }

  const error = (name: keyof ContactLeadInput) => form.formState.errors[name]?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nome</Label>
        <Input id="contact-name" autoComplete="name" {...form.register("name")} aria-invalid={Boolean(error("name"))} />
        {error("name") ? <p className="text-sm text-destructive">{error("name")}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">E-mail</Label>
          <Input id="contact-email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={Boolean(error("email"))} />
          {error("email") ? <p className="text-sm text-destructive">{error("email")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">WhatsApp</Label>
          <Input id="contact-phone" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" {...form.register("phone")} aria-invalid={Boolean(error("phone"))} />
          {error("phone") ? <p className="text-sm text-destructive">{error("phone")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Como podemos ajudar?</Label>
        <Textarea id="contact-message" rows={6} {...form.register("message")} aria-invalid={Boolean(error("message"))} />
        {error("message") ? <p className="text-sm text-destructive">{error("message")}</p> : null}
      </div>
      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <Label htmlFor="contact-company">Empresa</Label>
        <Input id="contact-company" tabIndex={-1} autoComplete="off" {...form.register("company")} />
      </div>
      <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
      <Button disabled={form.formState.isSubmitting} type="submit" className="rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {form.formState.isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
      {result ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900" role="status">
          <AlertDescription className="flex flex-col gap-3">
            <span>{result.message}</span>
            {result.whatsappUrl ? <a className="inline-flex items-center gap-2 font-bold text-emerald-800 underline" href={result.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />Continuar no WhatsApp</a> : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
