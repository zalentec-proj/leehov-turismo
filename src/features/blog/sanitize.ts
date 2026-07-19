import sanitizeHtml from "sanitize-html";

export function sanitizeBlogHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br", "hr", "code", "pre"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "",
          ...(attribs.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  }).trim();
}

export function plainTextFromHtml(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateReadingTime(value: string): number {
  const words = plainTextFromHtml(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugifyBlogTitle(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
