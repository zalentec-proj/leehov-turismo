import { describe, expect, it } from "vitest";
import { resolveStableCollectionIds } from "@/features/caravans/collection-sync";

function idFactory() {
  let index = 0;
  return () => `generated-${++index}`;
}

describe("sincronização das coleções de caravanas", () => {
  it("reaproveita o registro que já pertence ao mesmo número de dia", () => {
    const ids = resolveStableCollectionIds(
      [
        { id: "", key: 1 },
        { id: "", key: 2 },
        { id: "", key: 3 },
      ],
      [
        { id: "existing-1", key: 1 },
        { id: "existing-2", key: 2 },
      ],
      idFactory(),
    );

    expect(ids).toEqual(["existing-1", "existing-2", "generated-1"]);
  });

  it("resolve uma renumeração pela identidade do dia de destino", () => {
    const ids = resolveStableCollectionIds(
      [
        { id: "new-first-day", key: 1 },
        { id: "existing-1", key: 2 },
        { id: "existing-2", key: 3 },
      ],
      [
        { id: "existing-1", key: 1 },
        { id: "existing-2", key: 2 },
      ],
      idFactory(),
    );

    expect(ids).toEqual(["existing-1", "existing-2", "generated-1"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserva o id de um item novo quando ele não pertence a outro dia", () => {
    expect(resolveStableCollectionIds(
      [{ id: "client-created", key: 6 }],
      [{ id: "existing-1", key: 1 }],
      idFactory(),
    )).toEqual(["client-created"]);
  });
});
