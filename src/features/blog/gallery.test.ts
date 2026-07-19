import { describe, expect, it } from "vitest";
import { getBlogGallerySwipeTarget, normalizeBlogGalleryOrder } from "@/features/blog/gallery";
import { blogPostFormSchema, type BlogPostFormInput } from "@/features/blog/schema";

function validPost(published: boolean): BlogPostFormInput {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Um artigo completo",
    slug: "um-artigo-completo",
    summary: "Resumo editorial com mais de trinta caracteres para validação.",
    content: "<p>Conteúdo editorial seguro e suficientemente longo para passar pela validação do formulário.</p>",
    coverImagePath: "post/cover/image.jpg",
    coverAltText: "Descrição da capa",
    categoryId: "00000000-0000-4000-8000-000000000002",
    relatedCaravanId: "",
    relatedDestination: "",
    author: "Bruna Moraes",
    publishedAt: "2026-07-18T10:00",
    featuredHome: false,
    featuredBlog: false,
    published,
    seoTitle: "",
    seoDescription: "",
    images: [{ id: "", imagePath: "post/gallery/one.jpg", altText: "", caption: "", orderIndex: 92 }],
  };
}

describe("galeria do Blog", () => {
  it("normaliza a ordem pela posição final de forma idempotente", () => {
    const images = [
      { id: "", imagePath: "c.jpg", altText: "C", caption: "", orderIndex: 80 },
      { id: "", imagePath: "a.jpg", altText: "A", caption: "", orderIndex: 0 },
      { id: "", imagePath: "b.jpg", altText: "B", caption: "", orderIndex: 700 },
    ];
    const normalized = normalizeBlogGalleryOrder(images);
    expect(normalized.map((image) => image.orderIndex)).toEqual([0, 10, 20]);
    expect(normalizeBlogGalleryOrder(normalized)).toEqual(normalized);
  });

  it("permite alt vazio em rascunho", () => {
    expect(blogPostFormSchema.safeParse(validPost(false)).success).toBe(true);
  });

  it("rejeita publicação com imagem sem texto alternativo", () => {
    const result = blogPostFormSchema.safeParse(validPost(true));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.join(".") === "images.0.altText")).toBe(true);
  });

  it("calcula swipe respeitando limiar e extremidades", () => {
    expect(getBlogGallerySwipeTarget(240, 120, 0, 4)).toBe(1);
    expect(getBlogGallerySwipeTarget(120, 240, 2, 4)).toBe(1);
    expect(getBlogGallerySwipeTarget(200, 170, 2, 4)).toBe(2);
    expect(getBlogGallerySwipeTarget(240, 120, 3, 4)).toBe(3);
    expect(getBlogGallerySwipeTarget(120, 240, 0, 4)).toBe(0);
  });
});
