import { describe, expect, it } from "vitest";
import { sanitizeEmailError } from "@/lib/email/sanitize-email-error";

describe("sanitizeEmailError", () => {
  it("remove chaves, bearer tokens e parâmetros de autenticação", () => {
    const result = sanitizeEmailError("re_secret Bearer abc.def https://x.test?a=1&token_hash=secret-token password=MinhaSenha");
    expect(result).not.toContain("re_secret");
    expect(result).not.toContain("abc.def");
    expect(result).not.toContain("secret-token");
    expect(result).not.toContain("MinhaSenha");
  });
});
