import { z } from "zod";

export const emailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3),
  templateKey: z.string().min(3),
});
