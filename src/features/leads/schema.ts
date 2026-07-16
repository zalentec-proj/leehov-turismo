import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(8).optional().or(z.literal("")),
  message: z.string().max(1000).optional(),
  source: z.enum(["contact", "caravan_interest", "newsletter", "popup"]),
});
