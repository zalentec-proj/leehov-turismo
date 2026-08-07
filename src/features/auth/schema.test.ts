import { describe, expect, it } from "vitest";
import { setPasswordSchema } from "@/features/auth/schema";

describe("setPasswordSchema", () => {
  it("exige 12 caracteres, maiúscula, minúscula e número", () => {
    expect(setPasswordSchema.safeParse({ password: "curta", confirmation: "curta" }).success).toBe(false);
    expect(setPasswordSchema.safeParse({ password: "senha-sem-numero", confirmation: "senha-sem-numero" }).success).toBe(false);
    expect(setPasswordSchema.safeParse({ password: "SenhaSegura123", confirmation: "SenhaSegura123" }).success).toBe(true);
  });

  it("exige confirmação idêntica", () => {
    expect(setPasswordSchema.safeParse({ password: "SenhaSegura123", confirmation: "SenhaSegura124" }).success).toBe(false);
  });
});
