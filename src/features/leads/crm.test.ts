import { describe, expect, it } from "vitest";
import { leadPipelineSchema, manualLeadSchema } from "@/features/leads/schema";

describe("CRM leve de leads", () => {
  it("permite lead manual sem e-mail e sem mensagem", () => {
    const result = manualLeadSchema.safeParse({ name: "Mariana Silva", phone: "+55 45 99999-9999", email: "", message: "", city: "", state: "", source: "manual", caravanId: "", assignedTo: "", nextFollowUpAt: "" });
    expect(result.success).toBe(true);
  });

  it("exige nome e WhatsApp no cadastro manual", () => {
    expect(manualLeadSchema.safeParse({ name: "", phone: "", email: "", message: "", city: "", state: "", source: "manual", caravanId: "", assignedTo: "", nextFollowUpAt: "" }).success).toBe(false);
  });

  it("valida mudanças de pipeline e acompanhamento em UTC", () => {
    expect(leadPipelineSchema.safeParse({ id: "00000000-0000-4000-8000-000000000001", status: "in_progress", nextFollowUpAt: "2026-08-10T15:00:00.000Z" }).success).toBe(true);
    expect(leadPipelineSchema.safeParse({ id: "inválido", status: "lost" }).success).toBe(false);
  });
});
