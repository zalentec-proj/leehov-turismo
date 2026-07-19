"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewsletterSignup } from "@/features/newsletter/components/newsletter-signup";
import type { Popup } from "@/features/popups/types";
import { buildWhatsAppUrl } from "@/features/settings/utils";
import type { WhatsAppSettings } from "@/features/settings/types";

function locationMatches(pathname: string, popup: Popup) {
  if (popup.displayLocation === "sitewide") return true;
  if (popup.displayLocation === "home") return pathname === "/";
  if (popup.displayLocation === "blog") return pathname === "/blog" || pathname.startsWith("/blog/");
  return pathname === "/caravanas" || pathname.startsWith("/caravanas/");
}

export function PublicPopupRenderer({ popup, whatsapp }: { popup: Popup | null; whatsapp: WhatsAppSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const storageKey = popup ? `leehov-popup:${popup.id}` : "";
  useEffect(() => {
    if (!popup || !locationMatches(pathname, popup)) return;
    const storage = popup.frequency === "session" ? sessionStorage : localStorage;
    const previous = Number(storage.getItem(storageKey) ?? 0);
    const elapsed = Date.now() - previous;
    const wait = popup.frequency === "daily" ? 86_400_000 : popup.frequency === "weekly" ? 604_800_000 : 0;
    if (popup.frequency !== "always" && previous && (popup.frequency === "session" || elapsed < wait)) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [pathname, popup, storageKey]);
  const href = useMemo(() => {
    if (!popup) return "";
    if (popup.popupType === "campaign") return popup.buttonUrl;
    if (popup.popupType === "caravan") return `/caravanas/${popup.relatedCaravanSlug}`;
    if (popup.popupType === "whatsapp" && whatsapp.number) return buildWhatsAppUrl(whatsapp.number, whatsapp.defaultMessage);
    return "";
  }, [popup, whatsapp]);
  if (!popup || !locationMatches(pathname, popup)) return null;
  function dismiss() {
    setOpen(false);
    if (popup?.frequency !== "always") (popup?.frequency === "session" ? sessionStorage : localStorage).setItem(storageKey, String(Date.now()));
  }
  return <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : dismiss()}><DialogContent className="overflow-hidden p-0 sm:max-w-xl" onEscapeKeyDown={dismiss} onPointerDownOutside={dismiss}>{popup.imageUrl ? <div className="h-48 bg-cover bg-center sm:h-56" style={{ backgroundImage: `url(${popup.imageUrl})` }} role="img" aria-label={popup.imageAlt} /> : null}<div className="p-6 sm:p-8"><DialogHeader><p className="text-xs font-black uppercase tracking-[0.16em] text-leehov-blue-600">Leehov Turismo</p><DialogTitle className="mt-2 text-2xl font-extrabold leading-tight text-leehov-navy-950">{popup.title}</DialogTitle>{popup.description ? <DialogDescription className="mt-2 leading-6">{popup.description}</DialogDescription> : null}</DialogHeader>{popup.popupType === "newsletter" ? <div className="mt-6"><NewsletterSignup source="popup" /></div> : href ? <Button asChild size="lg" className="mt-6 w-full bg-leehov-blue-600"><a href={href} target={href.startsWith("https://") ? "_blank" : undefined} rel={href.startsWith("https://") ? "noreferrer" : undefined} onClick={dismiss}>{popup.buttonText}</a></Button> : null}</div></DialogContent></Dialog>;
}
