export const LEEHOV_WHATSAPP_NUMBER = "5545999860067";
export const LEEHOV_WHATSAPP_DISPLAY = "(45) 99986-0067";
export const LEEHOV_WHATSAPP_URL = `https://wa.me/${LEEHOV_WHATSAPP_NUMBER}`;

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}
