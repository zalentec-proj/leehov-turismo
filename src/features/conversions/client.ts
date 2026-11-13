import { attributionWindow, classifyTouch, cleanTouch, publicPath, signalsFromUrl, type Touch } from "./attribution";

export const measurementCookie = "leehov_site_measurement";
const visitorKey = "leehov-measurement-visitor-v1";
const sessionKey = "leehov-measurement-session-v1";
const eraseKey = "leehov-measurement-erasure-v1";
const eraseWindow = 180 * 86400_000;
const sessionWindow = 30 * 60_000;
type Visitor = { id: string; expiresAt: number; first?: Touch; last?: Touch };
type Erasure = { id: string; expiresAt: number };
type Session = { id: string; touchedAt: number; touch: Touch };
export type MeasurementContext = { visitorId: string; sessionId: string; first?: Touch; last?: Touch; session: Touch };
let memoryVisitor: Visitor | undefined;
let memorySession: Session | undefined;
let activeLocation = "";
let memoryErasures: Erasure[] = [];

export function measurementExpiry(cookie: string | undefined, version?: number, now = Date.now()) {
  if (!cookie || !/^\d{1,6}\.\d{13}$/.test(cookie)) return 0;
  const [recordedVersion, expiry] = cookie.split(".").map(Number);
  return (version === undefined || recordedVersion === version) && expiry > now && expiry <= now + 180 * 86400_000 ? expiry : 0;
}

function readMeasurementCookie() {
  return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(measurementCookie + "="))?.slice(measurementCookie.length + 1);
}

export function clearMeasurementStorage() {
  memoryVisitor = undefined;
  memorySession = undefined;
  activeLocation = "";
  try { localStorage.removeItem(visitorKey); } catch { /* Storage can be blocked by browser settings. */ }
  try { sessionStorage.removeItem(sessionKey); } catch { /* Storage can be blocked by browser settings. */ }
}

function read<T>(storage: "localStorage" | "sessionStorage", key: string) {
  try { return JSON.parse(window[storage].getItem(key) ?? "null") as T | null; } catch { return null; }
}
function write(storage: "localStorage" | "sessionStorage", key: string, value: unknown) {
  try { window[storage].setItem(key, JSON.stringify(value)); } catch { /* Storage can be blocked by browser settings. */ }
}
function erasureCapabilities() {
  const saved = read<Erasure[]>("localStorage", eraseKey);
  const items = Array.isArray(saved) ? [...saved, ...memoryErasures] : memoryErasures;
  const capabilities = [...new Map(items.filter((entry) => typeof entry?.id === "string" && entry.expiresAt > Date.now()).map((entry) => [entry.id, entry])).values()];
  if (saved && capabilities.length !== saved.length) write("localStorage", eraseKey, capabilities);
  return capabilities;
}

function rememberErasure(id: string, now: number) {
  const current = erasureCapabilities();
  const existing = current.find((item) => item.id === id);
  if (existing && existing.expiresAt > now + eraseWindow - 86400_000) return;
  memoryErasures = [...current.filter((item) => item.id !== id), { id, expiresAt: now + eraseWindow }].slice(-30);
  write("localStorage", eraseKey, memoryErasures);
}

const campaignKey = (touch: Touch) => JSON.stringify({ ...touch, at: undefined, landingPath: undefined, referrerDomain: undefined });

export function getMeasurementContext(version?: number, memoryEntry?: Touch): MeasurementContext | undefined {
  if (typeof window === "undefined") return undefined;
  if (!measurementExpiry(readMeasurementCookie(), version)) {
    clearMeasurementStorage();
    return undefined;
  }

  const path = publicPath(location.pathname);
  if (!path || !globalThis.crypto?.randomUUID) return undefined;
  const now = Date.now();
  const locationKey = location.pathname + location.search;
  // document.referrer is the entry referrer, not the referrer of an SPA transition.
  const entry = activeLocation === "";
  const changedLocation = activeLocation !== locationKey;
  const currentSignal = signalsFromUrl(new URLSearchParams(location.search), entry ? document.referrer : "", location.hostname, path);
  const signal = entry && memoryEntry && classifyTouch(currentSignal).channel === "direct" ? memoryEntry : currentSignal;
  const hasCampaign = campaignKey(signal) !== "{}";
  const current = read<Visitor>("localStorage", visitorKey) ?? memoryVisitor;
  const oldSession = read<Session>("sessionStorage", sessionKey) ?? memorySession;
  let visitor: Visitor = current && current.expiresAt > now ? current : { id: crypto.randomUUID(), expiresAt: now + attributionWindow };
  let session = oldSession;

  if (!session || !current || current.expiresAt <= now || now - session.touchedAt >= sessionWindow ||
    (changedLocation && hasCampaign && campaignKey(session.touch) !== campaignKey(signal)) ||
    (entry && Boolean(signal.referrerDomain) && signal.referrerDomain !== session.touch.referrerDomain)) {
    const touch = { ...(entry || changedLocation ? signal : { landingPath: path }), at: now };
    session = { id: crypto.randomUUID(), touchedAt: now, touch };
    const channel = classifyTouch(touch).channel;
    if (channel !== "direct" && channel !== "unknown") {
      const first = visitor.first && now - (visitor.first.at ?? 0) <= attributionWindow ? visitor.first : touch;
      visitor = { ...visitor, first, last: touch, expiresAt: now + attributionWindow };
    }
  }

  // A full direct return can be a new session even when the tab is reused.
  if (entry && !signal.referrerDomain && !hasCampaign && session === oldSession
    && document.referrer === "" && classifyTouch(session.touch).channel !== "direct") {
    session = { id: crypto.randomUUID(), touchedAt: now, touch: { landingPath: path, at: now } };
  }
  session = { ...session, touchedAt: now };
  activeLocation = locationKey;
  memoryVisitor = visitor;
  memorySession = session;
  rememberErasure(visitor.id, now);
  write("localStorage", visitorKey, visitor);
  write("sessionStorage", sessionKey, session);
  return { visitorId: visitor.id, sessionId: session.id, first: cleanTouch(visitor.first), last: cleanTouch(visitor.last), session: cleanTouch(session.touch) };
}

export function emitMeasurement(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  // Keep navigation independent of network and retry with the same event ID.
  void fetch("/api/medicao", {
    method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
  }).then((response) => {
    if (response.status >= 500 && measurementExpiry(readMeasurementCookie())) {
      void fetch("/api/medicao", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  }).catch(() => {
    if (measurementExpiry(readMeasurementCookie()) && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/medicao", new Blob([body], { type: "application/json" }));
    }
  });
}

export async function eraseBrowserMeasurement() {
  const capabilities = erasureCapabilities();
  if (!capabilities.length) return false;
  const results = await Promise.all(capabilities.map(async (item) => {
    try {
      const response = await fetch("/api/medicao", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "erase", visitorId: item.id }),
      });
      return response.ok ? null : item;
    } catch { return item; }
  }));
  memoryErasures = results.filter((item): item is Erasure => item !== null);
  write("localStorage", eraseKey, memoryErasures);
  clearMeasurementStorage();
  if (memoryErasures.length) throw new Error("Measurement erasure failed");
  return true;
}
