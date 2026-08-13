import { describe, expect, it } from "vitest";
import { formatBlogAdminDate, formatBlogDateTimeInput, parseBlogDateTimeInput } from "@/features/blog/date";

describe("datas administrativas do Blog", () => {
  it("renderiza a mesma data no fuso de São Paulo em servidor e navegador", () => {
    expect(formatBlogAdminDate("2026-08-10T18:05:00.000Z")).toBe("10/08/2026, 15:05");
    expect(formatBlogDateTimeInput("2026-08-10T18:05:00.000Z")).toBe("2026-08-10T15:05");
  });

  it("interpreta datetime-local como horário de São Paulo", () => {
    expect(parseBlogDateTimeInput("2026-08-10T15:05")).toBe("2026-08-10T18:05:00.000Z");
    expect(parseBlogDateTimeInput("")).toBeNull();
  });
});
