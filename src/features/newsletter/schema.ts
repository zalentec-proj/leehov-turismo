import { z } from "zod";

export const newsletterSignupSchema = z.object({
  name: z.string().min(2).optional().or(z.literal("")),
  email: z.string().email("Informe um e-mail valido."),
  source: z.string().default("site"),
  turnstileToken: z.string().optional(),
});
