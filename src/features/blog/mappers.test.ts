import { describe, expect, it, vi } from "vitest";
import { resolveBlogAssetUrls } from "@/features/blog/mappers";

const mocks = vi.hoisted(() => ({
  createSignedUrls: vi.fn(),
  mediaIn: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ in: mocks.mediaIn }) }),
    storage: { from: vi.fn().mockReturnValue({ createSignedUrls: mocks.createSignedUrls }) },
  }),
}));

describe("resolveBlogAssetUrls", () => {
  it("assina caminhos únicos do Blog em uma única requisição", async () => {
    mocks.mediaIn.mockResolvedValue({ data: [], error: null });
    mocks.createSignedUrls.mockResolvedValue({
      data: [
        { path: "post/capa.webp", signedUrl: "https://storage.test/capa" },
        { path: "post/galeria.webp", signedUrl: "https://storage.test/galeria" },
      ],
      error: null,
    });
    const urls = await resolveBlogAssetUrls({} as never, [
      "post/capa.webp",
      "post/capa.webp",
      null,
      "post/galeria.webp",
    ]);

    expect(mocks.createSignedUrls).toHaveBeenCalledTimes(1);
    expect(mocks.createSignedUrls).toHaveBeenCalledWith(["post/capa.webp", "post/galeria.webp"], 3600);
    expect(urls.get("post/capa.webp")).toBe("https://storage.test/capa");
    expect(urls.get("post/galeria.webp")).toBe("https://storage.test/galeria");
  });
});
