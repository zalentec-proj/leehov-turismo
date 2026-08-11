import { describe, expect, it } from "vitest";
import {
  CARAVAN_IMAGE_MAX_BYTES,
  getCaravanImageTypeFromPath,
  validateCaravanImage,
  validateCaravanImageMetadata,
} from "@/features/caravans/image-validation";

describe("validação de imagens dos pacotes", () => {
  it("aceita JPEG pela assinatura binária real", () => {
    expect(validateCaravanImage("image/jpeg", 1024, new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toEqual({
      success: true,
      extension: "jpg",
    });
  });

  it("recusa arquivo disfarçado de PNG", () => {
    expect(validateCaravanImage("image/png", 1024, new Uint8Array([1, 2, 3, 4]))).toEqual({
      success: false,
      message: "O conteúdo do arquivo não corresponde ao formato informado.",
    });
  });

  it("mantém o limite funcional de 8 MiB", () => {
    expect(validateCaravanImageMetadata("image/webp", CARAVAN_IMAGE_MAX_BYTES + 1)).toEqual({
      success: false,
      message: "A imagem deve ter no máximo 8 MiB.",
    });
  });

  it("deriva o MIME esperado pelo path assinado", () => {
    expect(getCaravanImageTypeFromPath("pacote/imagem.avif")).toBe("image/avif");
    expect(getCaravanImageTypeFromPath("pacote/imagem.svg")).toBeUndefined();
  });
});
