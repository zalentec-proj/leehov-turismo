import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveMediaUrls } from "@/features/media/resolve";

const mocks = vi.hoisted(() => ({
  mediaIn: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ in: mocks.mediaIn }) }),
  }),
}));

describe("resolveMediaUrls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa uma URL estável para mídia catalogada e assina apenas o arquivo legado", async () => {
    mocks.mediaIn.mockResolvedValue({
      data: [{ id: "asset-1", storage_path: "packages/shared.webp", storage_bucket: "site-media" }],
      error: null,
    });
    const result = await resolveMediaUrls(["packages/shared.webp", "legacy/cover.webp", "packages/shared.webp"], "blog-images");

    expect(result.get("packages/shared.webp")).toBe("/api/media/asset-1");
    expect(result.get("legacy/cover.webp")).toBe("/api/media/legacy/blog-images/legacy/cover.webp");
  });
});
