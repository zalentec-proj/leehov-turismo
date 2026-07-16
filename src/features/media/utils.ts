export function isPublicImage(fileType?: string) {
  return Boolean(fileType?.startsWith("image/"));
}
