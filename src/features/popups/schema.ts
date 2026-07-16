import { z } from "zod";

export const popupSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  active: z.boolean().default(false),
  type: z.enum(["campaign", "newsletter", "whatsapp", "caravan"]),
});
