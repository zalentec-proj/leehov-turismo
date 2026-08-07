export function resolveEffectivePermissions(input: {
  active: boolean;
  role: "admin" | "editor";
  allPermissions: readonly string[];
  defaults: ReadonlyArray<{ permission_key: string; allowed: boolean }>;
  overrides: ReadonlyArray<{ permission_key: string; allowed: boolean }>;
}) {
  if (!input.active) return [];
  if (input.role === "admin") return [...input.allPermissions];
  const effective = new Set(input.defaults.filter((item) => item.allowed).map((item) => item.permission_key));
  for (const override of input.overrides) {
    if (override.allowed) effective.add(override.permission_key);
    else effective.delete(override.permission_key);
  }
  return [...effective];
}
