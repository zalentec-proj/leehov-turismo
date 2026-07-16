import { z } from "zod";

export const caravanStatusSchema = z.enum([
  "available",
  "coming_soon",
  "waitlist",
  "sold_out",
  "draft",
]);

export const caravanInterestSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  phone: z.string().min(8, "Informe um WhatsApp valido."),
  email: z.string().email("Informe um e-mail valido.").optional().or(z.literal("")),
  city: z.string().optional(),
  state: z.string().optional(),
  message: z.string().max(1000).optional(),
  caravanId: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type CaravanInterestInput = z.infer<typeof caravanInterestSchema>;
