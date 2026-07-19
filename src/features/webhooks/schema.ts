import { z } from "zod";

import { WEBHOOK_EVENTS } from "@/features/webhooks/types";

export const webhookSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Informe um nome.").max(120),
  url: z.string().trim().url("Informe uma URL válida.").max(2048),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "Selecione ao menos um evento.").max(WEBHOOK_EVENTS.length),
  validationKey: z.string().trim().max(256).optional().default(""),
  active: z.boolean().default(false),
});

export const webhookTestSchema = z.object({ id: z.string().uuid() });
export const webhookRetrySchema = z.object({ id: z.string().uuid(), confirmed: z.literal(true) });
