export const referencePattern = /^LH-[A-Z0-9]{14}$/;

export function makeWhatsAppReference() {
  // Base32 preserves entropy without producing look-alike I, O, 0 or 1.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return "LH-" + Array.from(crypto.getRandomValues(new Uint8Array(14)), (byte) => alphabet[byte & 31]).join("");
}

export function withWhatsAppReference(href: string, reference: string) {
  if (!referencePattern.test(reference)) return null;
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const isWhatsApp = (url.hostname === "wa.me" && /^\/\d+\/?$/.test(url.pathname))
    || ((url.hostname === "api.whatsapp.com" || url.hostname === "web.whatsapp.com") && url.pathname === "/send");
  if (!isWhatsApp) return null;
  const text = (url.searchParams.get("text") ?? "").replace(/\s*Referência:\s*LH-[A-Z0-9]{14}\.?\s*$/i, "").trimEnd();
  url.searchParams.set("text", (text ? text + " " : "") + "Referência: " + reference + ".");
  return url;
}
