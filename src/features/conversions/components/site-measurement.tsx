"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { clearMeasurementStorage, emitMeasurement, getMeasurementContext } from "../client";
import { publicPath, signalsFromUrl, classifyTouch, type Touch } from "../attribution";
import { makeWhatsAppReference, withWhatsAppReference } from "../whatsapp";

export function SiteMeasurement({ version, expiresAt }: { version: number; expiresAt: number | null }) {
  const path = usePathname();
  const query = useSearchParams().toString();
  const lastPage = useRef("");
  const inMemoryEntry = useRef<Touch | undefined>(undefined);
  const entrySeen = useRef(false);
  const recentClick = useRef<{ anchor: HTMLAnchorElement; at: number } | null>(null);

  useEffect(() => {
    const eventPath = publicPath(path);
    if (!eventPath) return;
    // A person can navigate before making a choice. Keep only the cleaned
    // entry in this document's memory, never browser storage or the network.
    if (!entrySeen.current) {
      const touch = signalsFromUrl(new URLSearchParams(query), document.referrer, location.hostname, eventPath);
      const channel = classifyTouch(touch).channel;
      if (channel !== "direct" && channel !== "unknown") inMemoryEntry.current = touch;
      entrySeen.current = true;
    }
    if (expiresAt === null) return;
    if (expiresAt <= Date.now()) {
      clearMeasurementStorage();
      if (lastPage.current) inMemoryEntry.current = undefined;
      lastPage.current = "";
      return;
    }
    const context = getMeasurementContext(version, inMemoryEntry.current);
    inMemoryEntry.current = undefined;
    if (!context) return;
    const key = context.sessionId + ":" + eventPath;
    if (lastPage.current === key) return;
    lastPage.current = key;
    emitMeasurement({ id: crypto.randomUUID(), type: "page", path: eventPath, context });
  }, [path, query, version, expiresAt]);

  useEffect(() => {
    if (!expiresAt || expiresAt <= Date.now()) return;
    let timer: ReturnType<typeof setTimeout>;
    const expiry = expiresAt;
    function watchExpiry() {
      const remaining = expiry - Date.now();
      if (remaining <= 0) clearMeasurementStorage();
      else timer = setTimeout(watchExpiry, Math.min(remaining, 2_147_483_647));
    }
    watchExpiry();

    function trackWhatsApp(event: MouseEvent) {
      if (!event.isTrusted || event.button !== (event.type === "auxclick" ? 1 : 0) || event.defaultPrevented || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      const eventPath = publicPath(location.pathname);
      if (!anchor || !eventPath || !globalThis.crypto?.randomUUID) return;
      const reference = makeWhatsAppReference();
      const destination = withWhatsAppReference(anchor.href, reference);
      if (!destination) return;
      const at = Date.now();
      const context = getMeasurementContext(version);
      if (!context) return;
      if (recentClick.current?.anchor === anchor && at - recentClick.current.at < 650) return;
      const original = anchor.getAttribute("href");
      anchor.href = destination.href;
      recentClick.current = { anchor, at };
      // The browser reads href for its native navigation after dispatch. Restore
      // the original for a later copy, cancellation, or click without consent.
      window.setTimeout(() => {
        if (anchor.href === destination.href && original !== null) anchor.setAttribute("href", original);
      }, 0);
      emitMeasurement({ id: crypto.randomUUID(), type: "whatsapp", path: eventPath, reference, context });
    }

    document.addEventListener("click", trackWhatsApp, { capture: true, passive: true });
    document.addEventListener("auxclick", trackWhatsApp, { capture: true, passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", trackWhatsApp, true);
      document.removeEventListener("auxclick", trackWhatsApp, true);
    };
  }, [expiresAt, version]);

  return null;
}
