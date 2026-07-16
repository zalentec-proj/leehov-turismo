import { z } from "zod";

export const webhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  event: z.string().min(3),
  validationKey: z.string().optional(),
  active: z.boolean().default(true),
});
