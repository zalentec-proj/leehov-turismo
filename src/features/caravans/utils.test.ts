import { describe, expect, it } from "vitest";
import { formatDepartureLabel } from "@/features/caravans/utils";

describe("formatDepartureLabel", () => {
  it("gera um período legível a partir das datas", () => {
    expect(formatDepartureLabel("2027-07-10", "2027-07-21")).toBe("10/07/2027 a 21/07/2027");
  });

  it("aceita somente a data de início", () => {
    expect(formatDepartureLabel("2027-07-10", "")).toBe("10/07/2027");
  });

  it("não gera rótulo sem datas", () => {
    expect(formatDepartureLabel("", "")).toBe("");
  });
});
