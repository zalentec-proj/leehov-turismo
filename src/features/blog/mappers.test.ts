import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBlogAssetUrls } from "@/features/blog/mappers";
import type { Database } from "@/types/database";

describe("resolveBlogAssetUrls", () => {
  it("assina caminhos únicos do Blog em uma única requisição", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        { path: "post/capa.webp", signedUrl: "https://storage.test/capa" },
        { path: "post/galeria.webp", signedUrl: "https://storage.test/galeria" },
      ],
      error: null,
    });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({ createSignedUrls }),
      },
    } as unknown as SupabaseClient<Database>;

    const urls = await resolveBlogAssetUrls(supabase, [
      "post/capa.webp",
      "post/capa.webp",
      null,
      "post/galeria.webp",
    ]);

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith(["post/capa.webp", "post/galeria.webp"], 3600);
    expect(urls.get("post/capa.webp")).toBe("https://storage.test/capa");
    expect(urls.get("post/galeria.webp")).toBe("https://storage.test/galeria");
  });
});
