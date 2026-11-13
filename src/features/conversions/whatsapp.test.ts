import { describe, expect, it } from "vitest";
import { withWhatsAppReference } from "./whatsapp";

describe("referência do WhatsApp", () => {
  it.each(["https://wa.me/5511912345678", "https://api.whatsapp.com/send?phone=5511912345678&lang=pt"])("preserva o destino e troca somente a referência %s", (value) => {
    const link = new URL(value);
    link.searchParams.set("text", "Olá! Quero saber sobre a caravana & o roteiro.");
    const first = withWhatsAppReference(link.href, "LH-ABCDEFGHIJKLMN")!;
    const second = withWhatsAppReference(first.href, "LH-123456789ABCDE")!;
    expect(second.hostname).toBe(link.hostname);
    expect(second.pathname).toBe(link.pathname);
    expect(second.searchParams.get("phone")).toBe(link.searchParams.get("phone"));
    expect(second.searchParams.get("lang")).toBe(link.searchParams.get("lang"));
    expect(second.searchParams.get("text")).toBe("Olá! Quero saber sobre a caravana & o roteiro. Referência: LH-123456789ABCDE.");
  });
  it("não altera links que imitam o WhatsApp", () => {
    expect(withWhatsAppReference("https://wa.me.exemplo.com/5511999999999", "LH-123456789ABCDE")).toBeNull();
  });
});
