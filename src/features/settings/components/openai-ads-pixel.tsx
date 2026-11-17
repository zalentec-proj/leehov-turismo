"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { publicPath } from "@/features/conversions/attribution";
import { openAIAdsPixelId, openAIAdsWhatsAppEvent, openAIClickReferencePattern } from "@/features/conversions/openai-ads";
import { rememberCampaignUtms } from "@/features/shared/attribution";

const opprefKey = "leehov-openai-oppref";

function validOppref(value: string | null): value is string {
  return value !== null && openAIClickReferencePattern.test(value);
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

async function measureWhatsApp(oppref: string, consentStorageKey: string, expiresAt: number) {
  const eventId = crypto.randomUUID();
  const path = publicPath(location.pathname);
  if (path) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3_500);
    try {
      // Let the server submit first while the WhatsApp link opens normally.
      await fetch("/api/medicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "openai_whatsapp", id: eventId, path, oppref: oppref || undefined }),
        keepalive: true,
        signal: controller.signal,
      });
    } catch {
      // The browser can still deliver the same event when the server is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (!hasConsent(consentStorageKey, expiresAt)) return;
  const url = new URL("https://bzr.openai.com/v1/sdk/events");
  url.search = new URLSearchParams({
    pid: openAIAdsPixelId,
    event: "custom",
    custom_event_name: openAIAdsWhatsAppEvent,
    event_id: eventId,
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
      void measureWhatsApp(landing.current || readOppref(), consentStorageKey, expiresAt);
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
