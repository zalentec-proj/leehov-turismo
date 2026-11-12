"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { rememberCampaignUtms } from "@/features/shared/attribution";

const opprefKey = "leehov-openai-oppref";

function validOppref(value: string | null): value is string {
  // Accept opaque token-shaped references, not phone numbers, emails, or names.
  return value !== null && /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9_-]{20,1024}={0,2}$/.test(value);
}

function hasConsent(key: string, expiry: number) {
  try {
    return expiry > Date.now() && Number(localStorage.getItem(key)) === expiry;
  } catch {
    return false;
  }
}

function storeOppref(value: string) {
  try {
    if (value) sessionStorage.setItem(opprefKey, value);
    else sessionStorage.removeItem(opprefKey);
  } catch {
    // The in-memory referral still works when session storage is unavailable.
  }
}

function readOppref() {
  try {
    const value = sessionStorage.getItem(opprefKey);
    return validOppref(value) ? value : "";
  } catch {
    return "";
  }
}

function measureWhatsApp(oppref: string) {
  const url = new URL("https://bzr.openai.com/v1/sdk/events");
  url.search = new URLSearchParams({
    pid: "AAy1gfaoDcQhWDighRrZqq",
    event: "custom",
    custom_event_name: "whatsapp_click",
    event_id: crypto.randomUUID(),
    "data[type]": "custom",
  }).toString();
  if (oppref) url.searchParams.set("oppref", oppref);

  const tag = new Image(1, 1);
  tag.referrerPolicy = "origin";
  tag.src = url.href;
}

export function OpenAIAdsPixel({ consentExpiresAt, consentStorageKey }: {
  consentExpiresAt: number | null;
  consentStorageKey: string;
}) {
  const params = useSearchParams();
  const landing = useRef("");
  const wasAllowed = useRef(false);

  useEffect(() => {
    rememberCampaignUtms(params);
    const allowed = consentExpiresAt !== null && hasConsent(consentStorageKey, consentExpiresAt);
    if (consentExpiresAt !== null && !allowed) {
      storeOppref("");
      if (wasAllowed.current) {
        wasAllowed.current = false;
        landing.current = "";
        return;
      }
    }
    const oppref = params.get("oppref");
    if (validOppref(oppref)) landing.current = oppref;
    wasAllowed.current = allowed;
    if (allowed && landing.current) storeOppref(landing.current);
  }, [params, consentExpiresAt, consentStorageKey]);

  useEffect(() => {
    if (!consentExpiresAt || consentExpiresAt <= Date.now()) return;
    const expiresAt = consentExpiresAt;
    let expiryTimer: ReturnType<typeof setTimeout>;
    function clearReferral() {
      landing.current = "";
      storeOppref("");
    }
    function watchExpiry() {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) clearReferral();
      else expiryTimer = setTimeout(watchExpiry, Math.min(remaining, 2_147_483_647));
    }
    watchExpiry();

    function onClick(event: MouseEvent) {
      if (!event.isTrusted || event.button !== (event.type === "auxclick" ? 1 : 0) || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.protocol !== "https:") return;
      const isWhatsApp = (link.hostname === "wa.me" && /^\/\d+\/?$/.test(link.pathname))
        || ((link.hostname === "api.whatsapp.com" || link.hostname === "web.whatsapp.com") && link.pathname === "/send");
      if (!isWhatsApp) return;
      if (!hasConsent(consentStorageKey, expiresAt)) { clearReferral(); return; }
      measureWhatsApp(landing.current || readOppref());
    }

    document.addEventListener("click", onClick, { capture: true, passive: true });
    document.addEventListener("auxclick", onClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      clearTimeout(expiryTimer);
    };
  }, [consentExpiresAt, consentStorageKey]);

  return null;
}
