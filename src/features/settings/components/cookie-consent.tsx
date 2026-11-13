"use client";

import Script from "next/script";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CookieConsent, CookieConsentSettings, TrackingSettings } from "@/features/settings/types";
import { SiteMeasurement } from "@/features/conversions/components/site-measurement";
import { clearMeasurementStorage, measurementCookie, measurementExpiry } from "@/features/conversions/client";
import { OpenAIAdsPixel } from "./openai-ads-pixel";

function storageKey(version: number) { return `leehov-cookie-consent-v${version}`; }

export function CookieConsentManager({ consent, tracking }: { consent: CookieConsentSettings; tracking: TrackingSettings }) {
  const [choice, setChoice] = useState<CookieConsent | null>(null);
  const [openAIExpiry, setOpenAIExpiry] = useState(0);
  const [measurement, setMeasurement] = useState(0);
  const [ready, setReady] = useState(false);
  const openAIKey = `leehov-openai-ads-consent-v1-${consent.version}`;
  const measurementKey = `leehov-site-measurement-v1-${consent.version}`;
  useEffect(() => {
    function syncOpenAIChoice() {
      const expiry = Number(localStorage.getItem(openAIKey));
      setOpenAIExpiry(Number.isFinite(expiry) ? expiry : 0);
      setMeasurement(measurementExpiry(localStorage.getItem(measurementKey) ?? undefined, consent.version));
    }
    const timer = window.setTimeout(() => {
      setChoice(localStorage.getItem(storageKey(consent.version)) as CookieConsent | null);
      syncOpenAIChoice();
      setReady(true);
    }, 0);
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey(consent.version) || event.key === null) {
        setChoice(localStorage.getItem(storageKey(consent.version)) as CookieConsent | null);
      }
      if (event.key === openAIKey || event.key === measurementKey || event.key === null) syncOpenAIChoice();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [consent.version, openAIKey, measurementKey]);
  function choose(value: CookieConsent) {
    localStorage.setItem(storageKey(consent.version), value);
    document.cookie = `leehov_cookie_consent=${value}; Max-Age=${consent.durationDays * 86400}; Path=/; SameSite=Lax`;
    const expiry = value === "analytics" ? Date.now() + consent.durationDays * 86_400_000 : 0;
    if (expiry) localStorage.setItem(openAIKey, String(expiry));
    else localStorage.removeItem(openAIKey);
    const siteExpiry = value === "analytics" ? Date.now() + Math.min(180, consent.durationDays) * 86_400_000 : 0;
    if (siteExpiry) {
      const marker = `${consent.version}.${siteExpiry}`;
      localStorage.setItem(measurementKey, marker);
      document.cookie = `${measurementCookie}=${marker}; Max-Age=${Math.min(180, consent.durationDays) * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } else {
      localStorage.removeItem(measurementKey);
      document.cookie = `${measurementCookie}=; Max-Age=0; Path=/; SameSite=Lax`;
      clearMeasurementStorage();
    }
    setMeasurement(siteExpiry);
    setOpenAIExpiry(expiry);
    setChoice(value);
  }
  function reviewChoice() {
    localStorage.removeItem(storageKey(consent.version));
    localStorage.removeItem(openAIKey);
    localStorage.removeItem(measurementKey);
    document.cookie = `${measurementCookie}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = "leehov_cookie_consent=; Max-Age=0; Path=/; SameSite=Lax";
    clearMeasurementStorage();
    setMeasurement(0);
    setOpenAIExpiry(0);
    setChoice(null);
  }
  const analytics = choice === "analytics";
  return <>{analytics ? <TrackingScripts tracking={tracking} /> : null}<Suspense fallback={null}><OpenAIAdsPixel consentStorageKey={openAIKey} consentExpiresAt={ready ? (analytics ? openAIExpiry : 0) : null} /><SiteMeasurement version={consent.version} expiresAt={ready ? (analytics && consent.enabled ? measurement : 0) : null} /></Suspense>{ready && consent.enabled && !choice ? <div className="fixed inset-x-4 bottom-[76px] z-50 mx-auto max-w-3xl rounded-[18px] border border-leehov-border bg-white p-5 shadow-[0_22px_70px_rgb(6_42_68_/_22%)] lg:bottom-4" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-description"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex-1"><h2 id="cookie-title" className="font-extrabold text-leehov-navy-950">Sua privacidade importa</h2><p id="cookie-description" className="mt-2 text-sm leading-6 text-leehov-muted">Usamos cookies essenciais para o site funcionar. Ao aceitar, ativamos a medição da Leehov no próprio site, métricas do Google e os pixels da Meta e da OpenAI para medir campanhas, conforme a <Link href="/politica-de-privacidade" className="underline underline-offset-2">Política de Privacidade</Link>.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => choose("essential")}>Somente essenciais</Button><Button className="bg-leehov-blue-600" onClick={() => choose("analytics")}>Aceitar analíticos</Button></div></div></div> : choice ? <button type="button" onClick={reviewChoice} className="fixed bottom-[84px] left-3 z-40 rounded-full border border-leehov-border bg-white px-3 py-2 text-xs font-bold text-leehov-navy-950 shadow-md lg:bottom-3">Rever cookies</button> : null}</>;
}

function TrackingScripts({ tracking }: { tracking: TrackingSettings }) {
  return <>{tracking.gaMeasurementId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${tracking.gaMeasurementId}`} strategy="afterInteractive" /><Script id="leehov-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${tracking.gaMeasurementId}',{anonymize_ip:true});`}</Script></> : null}{tracking.gtmContainerId ? <Script id="leehov-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${tracking.gtmContainerId}');`}</Script> : null}{tracking.metaPixelId ? <Script id="leehov-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${tracking.metaPixelId}');fbq('track','PageView');`}</Script> : null}</>;
}
