import { describe, expect, it } from "vitest";
import { isPendingOneTimeUse } from "@/features/auth/one-time-state";

describe("isPendingOneTimeUse", () => {
  const now = new Date("2026-08-05T12:00:00Z").getTime();
  it("aceita somente uma solicitação pendente e dentro da validade", () => {
    expect(isPendingOneTimeUse({ expiresAt: "2026-08-06T12:00:00Z", status: "pending" }, now)).toBe(true);
  });
  it("rejeita token expirado, consumido, revogado ou reutilizado", () => {
    expect(isPendingOneTimeUse({ expiresAt: "2026-08-05T11:59:59Z", status: "pending" }, now)).toBe(false);
    expect(isPendingOneTimeUse({ expiresAt: "2026-08-06T12:00:00Z", consumedAt: "2026-08-05T10:00:00Z" }, now)).toBe(false);
    expect(isPendingOneTimeUse({ expiresAt: "2026-08-06T12:00:00Z", revokedAt: "2026-08-05T10:00:00Z" }, now)).toBe(false);
    expect(isPendingOneTimeUse({ expiresAt: "2026-08-06T12:00:00Z", status: "accepted" }, now)).toBe(false);
  });
});
