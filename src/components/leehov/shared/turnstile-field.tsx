"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileAppearance = "always" | "interaction-only";

type TurnstileFieldProps = {
  onTokenChange: (token: string) => void;
  /**
   * Mantém o desafio visual oculto para visitantes legítimos. O Turnstile ainda
   * solicita interação quando a análise de risco da Cloudflare determinar.
   */
  appearance?: TurnstileAppearance;
};

export function TurnstileField({
  onTokenChange,
  appearance = "interaction-only",
}: TurnstileFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      size: "normal",
      appearance,
      language: "pt-BR",
      callback: (token: string) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });
  }, [appearance, onTokenChange, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  return (
    <div
      className={cn(
        "w-fit max-w-full overflow-hidden rounded-xl",
        appearance === "always" && "min-h-[65px]",
      )}
      aria-label="Proteção anti-spam"
    >
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} />
    </div>
  );
}
