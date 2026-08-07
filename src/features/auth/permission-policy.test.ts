import { describe, expect, it } from "vitest";
import { resolveEffectivePermissions } from "@/features/auth/permission-policy";

const all = ["dashboard.view", "blog.view", "blog.publish"];
const defaults = [
  { permission_key: "dashboard.view", allowed: true },
  { permission_key: "blog.view", allowed: true },
];

describe("resolveEffectivePermissions", () => {
  it("nega tudo para usuário inativo", () => {
    expect(resolveEffectivePermissions({ active: false, role: "admin", allPermissions: all, defaults, overrides: [] })).toEqual([]);
  });

  it("concede o catálogo completo ao Admin ativo", () => {
    expect(resolveEffectivePermissions({ active: true, role: "admin", allPermissions: all, defaults: [], overrides: [] })).toEqual(all);
  });

  it("preserva o preset do Editor", () => {
    expect(resolveEffectivePermissions({ active: true, role: "editor", allPermissions: all, defaults, overrides: [] })).toEqual(["dashboard.view", "blog.view"]);
  });

  it("faz concessões e negações individuais vencerem o preset", () => {
    const result = resolveEffectivePermissions({
      active: true,
      role: "editor",
      allPermissions: all,
      defaults,
      overrides: [
        { permission_key: "blog.view", allowed: false },
        { permission_key: "blog.publish", allowed: true },
      ],
    });
    expect(result).toEqual(["dashboard.view", "blog.publish"]);
  });
});
