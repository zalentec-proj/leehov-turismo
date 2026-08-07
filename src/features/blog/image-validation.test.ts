import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validateBlogImageDimensions } from "@/features/blog/image-validation";

async function makeJpeg(width: number, height: number) {
  return new Uint8Array(await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#287eb8",
    },
  }).jpeg().toBuffer());
}

describe("validateBlogImageDimensions", () => {
  it("aceita uma capa com resolução editorial adequada", async () => {
    const result = await validateBlogImageDimensions("cover", await makeJpeg(1600, 900));
    expect(result).toEqual({ success: true, width: 1600, height: 900 });
  });

  it("recusa uma miniatura do WordPress usada como foto de galeria", async () => {
    const result = await validateBlogImageDimensions("gallery", await makeJpeg(300, 225));
    expect(result).toEqual({
      success: false,
      message: "A imagem da galeria tem 300 × 225 px. Use pelo menos 1200 × 800 px para evitar perda de nitidez.",
    });
  });

  it("recusa uma imagem que não pode ser decodificada", async () => {
    const result = await validateBlogImageDimensions("gallery", new Uint8Array([1, 2, 3]));
    expect(result).toEqual({ success: false, message: "A imagem está corrompida ou não pôde ser processada." });
  });
});
