import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveMediaUrls } from "@/features/media/resolve";

const mocks = vi.hoisted(() => ({
  mediaIn: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ in: mocks.mediaIn }) }),
    storage: { from: mocks.storageFrom },
  }),
}));

describe("resolveMediaUrls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("assina cada arquivo no bucket catalogado e usa o bucket legado como fallback", async () => {
    mocks.mediaIn.mockResolvedValue({
      data: [{ storage_path: "packages/shared.webp", storage_bucket: "site-media" }],
      error: null,
    });
    mocks.storageFrom.mockImplementation((bucket: string) => ({
      createSignedUrls: vi.fn().mockImplementation((paths: string[]) => Promise.resolve({
        data: paths.map((path) => ({ path, signedUrl: `https://storage.test/${bucket}/${path}` })),
        error: null,
      })),
    }));

    const result = await resolveMediaUrls(["packages/shared.webp", "legacy/cover.webp", "packages/shared.webp"], "blog-images");

    expect(mocks.storageFrom).toHaveBeenCalledWith("site-media");
    expect(mocks.storageFrom).toHaveBeenCalledWith("blog-images");
    expect(result.get("packages/shared.webp")).toContain("/site-media/");
    expect(result.get("legacy/cover.webp")).toContain("/blog-images/");
  });
});
