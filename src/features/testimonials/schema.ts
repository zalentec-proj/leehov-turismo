import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().min(2),
  city: z.string().optional(),
  text: z.string().min(10),
  rating: z.number().int().min(1).max(5),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});
