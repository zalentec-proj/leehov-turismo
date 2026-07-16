import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(10),
  content: z.string().min(10),
  published: z.boolean().default(false),
});
