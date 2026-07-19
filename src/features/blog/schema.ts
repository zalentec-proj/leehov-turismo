import { z } from "zod";

const optionalId = z.string().uuid().or(z.literal(""));

const blogImageSchema = z.object({
  id: optionalId,
  imagePath: z.string().min(1, "Informe o path da imagem."),
  altText: z.string().trim().max(180, "Use até 180 caracteres."),
  caption: z.string().trim().max(300, "Use até 300 caracteres."),
  orderIndex: z.number().int().min(0),
});

export const blogPostFormSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(3, "Informe um título.").max(160, "Use até 160 caracteres."),
  slug: z.string().trim().min(3, "Informe o slug.").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  summary: z.string().trim().min(30, "O resumo deve ter ao menos 30 caracteres.").max(500, "Use até 500 caracteres."),
  content: z.string().trim().min(50, "O conteúdo deve ter ao menos 50 caracteres."),
  coverImagePath: z.string().trim(),
  coverAltText: z.string().trim().max(180),
  categoryId: optionalId,
  relatedCaravanId: optionalId,
  relatedDestination: z.string().trim().max(120),
  author: z.string().trim().max(120),
  publishedAt: z.string().trim(),
  featuredHome: z.boolean(),
  featuredBlog: z.boolean(),
  published: z.boolean(),
  seoTitle: z.string().trim().max(70, "Use até 70 caracteres."),
  seoDescription: z.string().trim().max(180, "Use até 180 caracteres."),
  images: z.array(blogImageSchema),
}).superRefine((input, context) => {
  if (!input.published) return;
  const required: Array<[keyof typeof input, string]> = [
    ["categoryId", "Selecione uma categoria antes de publicar."],
    ["author", "Informe a autoria antes de publicar."],
    ["coverImagePath", "Envie uma capa antes de publicar."],
    ["coverAltText", "Informe o texto alternativo da capa."],
    ["publishedAt", "Informe a data de publicação."],
  ];
  required.forEach(([path, message]) => {
    if (!String(input[path] ?? "").trim()) context.addIssue({ code: "custom", path: [path], message });
  });
  input.images.forEach((image, index) => {
    if (!image.altText.trim()) {
      context.addIssue({
        code: "custom",
        path: ["images", index, "altText"],
        message: `Informe o texto alternativo da imagem ${index + 1} antes de publicar.`,
      });
    }
  });
});

export const blogCategorySchema = z.object({
  id: optionalId,
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(300),
});

export type BlogPostFormInput = z.input<typeof blogPostFormSchema>;
