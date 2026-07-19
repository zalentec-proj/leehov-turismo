import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const updateProfileSchema = z.object({
  id: z.string().uuid("Perfil inválido."),
  role: z.enum(["admin", "editor"]),
  active: z.boolean(),
});
