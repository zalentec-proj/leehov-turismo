import { z } from "zod";

export const publicSiteSettingsSchema = z.object({
  whatsappNumber: z.string().optional(),
  whatsappDefaultMessage: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});
