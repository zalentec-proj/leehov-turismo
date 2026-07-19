"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CookieConsent, CookieConsentSettings, TrackingSettings } from "@/features/settings/types";

function storageKey(version: number) { return `leehov-cookie-consent-v${version}`; }

export function CookieConsentManager({ consent, tracking }: { consent: CookieConsentSettings; tracking: TrackingSettings }) {
  const [choice, setChoice] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setChoice(localStorage.getItem(storageKey(consent.version)) as CookieConsent | null);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [consent.version]);
  function choose(value: CookieConsent) {
    localStorage.setItem(storageKey(consent.version), value);
    document.cookie = `leehov_cookie_consent=${value}; Max-Age=${consent.durationDays * 86400}; Path=/; SameSite=Lax`;
    setChoice(value);
  }
  const analytics = choice === "analytics";
  return <>{analytics ? <TrackingScripts tracking={tracking} /> : null}{ready && consent.enabled && !choice ? <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-[18px] border border-leehov-border bg-white p-5 shadow-[0_22px_70px_rgb(6_42_68_/_22%)]" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-description"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex-1"><h2 id="cookie-title" className="font-extrabold text-leehov-navy-950">Sua privacidade importa</h2><p id="cookie-description" className="mt-2 text-sm leading-6 text-leehov-muted">Usamos cookies essenciais para o site funcionar. Métricas e pixels só carregam com sua autorização.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => choose("essential")}>Somente essenciais</Button><Button className="bg-leehov-blue-600" onClick={() => choose("analytics")}>Aceitar analíticos</Button></div></div></div> : choice ? <button type="button" onClick={() => { localStorage.removeItem(storageKey(consent.version)); setChoice(null); }} className="fixed bottom-3 left-3 z-40 rounded-full border border-leehov-border bg-white px-3 py-2 text-xs font-bold text-leehov-navy-950 shadow-md">Rever cookies</button> : null}</>;
}

function TrackingScripts({ tracking }: { tracking: TrackingSettings }) {
  return <>{tracking.gaMeasurementId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${tracking.gaMeasurementId}`} strategy="afterInteractive" /><Script id="leehov-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${tracking.gaMeasurementId}',{anonymize_ip:true});`}</Script></> : null}{tracking.gtmContainerId ? <Script id="leehov-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${tracking.gtmContainerId}');`}</Script> : null}{tracking.metaPixelId ? <Script id="leehov-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${tracking.metaPixelId}');fbq('track','PageView');`}</Script> : null}</>;
}
