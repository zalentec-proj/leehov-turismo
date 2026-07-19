"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TurnstileField } from "@/components/leehov/shared/turnstile-field";
import { collectAttribution } from "@/features/shared/attribution";
import { subscribeNewsletterAction } from "@/features/newsletter/actions";
import { newsletterSignupSchema, type NewsletterSignupInput } from "@/features/newsletter/schema";
import type { NewsletterSource } from "@/features/newsletter/types";

export function NewsletterSignup({ source, variant = "light" }: { source: NewsletterSource; variant?: "banner" | "light" | "dark" }) {
  const [result, setResult] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const form = useForm<NewsletterSignupInput>({
    resolver: zodResolver(newsletterSignupSchema),
    defaultValues: { name: "", email: "", source, pagePath: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "", company: "", turnstileToken: "" },
  });
  const setTurnstileToken = useCallback((token: string) => form.setValue("turnstileToken", token), [form]);

  async function onSubmit(values: NewsletterSignupInput) {
    setResult("");
    const response = await subscribeNewsletterAction({ ...values, ...collectAttribution(), source });
    if (!response.success) {
      toast.error(response.message);
      return;
    }
    form.reset({ ...values, email: "", company: "", turnstileToken: "" });
    setTurnstileKey((value) => value + 1);
    setResult(response.message);
    toast.success(response.message);
  }

  const dark = variant === "banner" || variant === "dark";
  const inputClass = dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/55" : "border-leehov-border bg-white text-leehov-text";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" aria-label="Inscrição na newsletter" noValidate>
      <div className={variant === "banner" ? "flex max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-0" : "grid gap-3 sm:grid-cols-[1fr_auto]"}>
        <label className="sr-only" htmlFor={`newsletter-email-${source}`}>Seu melhor e-mail</label>
        <input id={`newsletter-email-${source}`} type="email" autoComplete="email" placeholder="Seu melhor e-mail" {...form.register("email")} className={`h-11 w-full rounded-full border px-5 text-sm outline-none transition focus:border-leehov-blue-300 ${inputClass} ${variant === "banner" ? "sm:w-[314px] sm:rounded-r-none" : ""}`} />
        <button type="submit" disabled={form.formState.isSubmitting} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 px-7 text-sm font-extrabold whitespace-nowrap text-white shadow-[0_10px_20px_rgb(8_117_205_/_24%)] disabled:opacity-60 ${variant === "banner" ? "sm:-ml-6 sm:w-[172px]" : ""}`}>
          {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}{form.formState.isSubmitting ? "Enviando..." : "Quero receber"}
        </button>
      </div>
      {form.formState.errors.email ? <p className={dark ? "text-sm text-red-200" : "text-sm text-destructive"}>{form.formState.errors.email.message}</p> : null}
      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true"><label htmlFor={`newsletter-company-${source}`}>Empresa</label><input id={`newsletter-company-${source}`} tabIndex={-1} autoComplete="off" {...form.register("company")} /></div>
      <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
      {result ? <p className={dark ? "text-sm text-emerald-200" : "text-sm text-emerald-700"} role="status">{result}</p> : null}
      <p className={`flex flex-wrap items-center gap-2 text-xs ${dark ? "text-white/72" : "text-leehov-muted"}`}><LockKeyhole className="size-4" />Sem spam. <Link href="/politica-de-privacidade" className="underline underline-offset-2">Política de Privacidade</Link></p>
    </form>
  );
}
