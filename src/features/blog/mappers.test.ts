import { describe, expect, it, vi } from "vitest";
import { resolveBlogAssetUrls } from "@/features/blog/mappers";

const mocks = vi.hoisted(() => ({
  mediaIn: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ in: mocks.mediaIn }) }),
  }),
}));

describe("resolveBlogAssetUrls", () => {
  it("gera URLs estáveis para caminhos únicos do Blog", async () => {
    mocks.mediaIn.mockResolvedValue({ data: [], error: null });
    const urls = await resolveBlogAssetUrls({} as never, [
      "post/capa.webp",
      "post/capa.webp",
      null,
      "post/galeria.webp",
    ]);

    expect(urls.get("post/capa.webp")).toBe("/api/media/legacy/blog-images/post/capa.webp");
    expect(urls.get("post/galeria.webp")).toBe("/api/media/legacy/blog-images/post/galeria.webp");
  });
});
