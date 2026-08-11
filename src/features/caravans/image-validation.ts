export const CARAVAN_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const imageExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const imageMimeTypes = new Map([...imageExtensions].map(([type, extension]) => [extension, type]));

export function getCaravanImageExtension(type: string) {
  return imageExtensions.get(type);
}

export function getCaravanImageTypeFromPath(path: string) {
  return imageMimeTypes.get(path.split(".").pop()?.toLowerCase() ?? "");
}

export function validateCaravanImageMetadata(type: string, size: number) {
  if (size > CARAVAN_IMAGE_MAX_BYTES) return { success: false as const, message: "A imagem deve ter no máximo 8 MiB." };
  const extension = getCaravanImageExtension(type);
  if (!extension) return { success: false as const, message: "Use uma imagem JPEG, PNG, WebP ou AVIF." };
  return { success: true as const, extension };
}

export function hasValidCaravanImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "image/avif") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp" && ["avif", "avis", "mif1"].includes(new TextDecoder().decode(bytes.slice(8, 12)));
  return false;
}

export function validateCaravanImage(type: string, size: number, bytes: Uint8Array) {
  const metadata = validateCaravanImageMetadata(type, size);
  if (!metadata.success) return metadata;
  if (!hasValidCaravanImageSignature(type, bytes)) {
    return { success: false as const, message: "O conteúdo do arquivo não corresponde ao formato informado." };
  }
  return metadata;
}
