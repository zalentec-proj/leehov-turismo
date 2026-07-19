const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

function hasValidImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "image/avif") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp" && ["avif", "avis", "mif1"].includes(new TextDecoder().decode(bytes.slice(8, 12)));
  return false;
}

export function validateMediaImage(type: string, size: number, bytes: Uint8Array): { success: true; extension: string } | { success: false; message: string } {
  if (size > MAX_MEDIA_BYTES) return { success: false, message: "A imagem deve ter no máximo 8 MiB." };
  const extension = allowedImageTypes.get(type);
  if (!extension) return { success: false, message: "Use uma imagem JPEG, PNG, WebP ou AVIF. SVG não é aceito." };
  if (!hasValidImageSignature(type, bytes)) return { success: false, message: "O conteúdo do arquivo não corresponde ao formato informado." };
  return { success: true, extension };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
