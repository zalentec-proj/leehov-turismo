export const LEEHOV_WHATSAPP_NUMBER = "5545999078380";
export const LEEHOV_WHATSAPP_DISPLAY = "+55 45 99907-8380";
export const LEEHOV_WHATSAPP_URL = `https://wa.me/${LEEHOV_WHATSAPP_NUMBER}`;

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}
