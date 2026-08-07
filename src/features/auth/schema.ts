import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const passwordSchema = z
  .string()
  .min(12, "A senha deve ter pelo menos 12 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua ao menos um número.");

export const setPasswordSchema = z.object({
  password: passwordSchema,
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, {
  message: "As senhas não coincidem.",
  path: ["confirmation"],
});

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "editor"]),
  permissions: z.array(z.string()).default([]),
});

export const manageUserSchema = z.object({
  id: z.string().uuid("Usuário inválido."),
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  role: z.enum(["admin", "editor"]),
  permissions: z.array(z.string()).default([]),
});

export const userIdSchema = z.object({ id: z.string().uuid("Usuário inválido.") });

export const deleteUserSchema = userIdSchema.extend({
  confirmationEmail: z.string().trim().email("Confirme o e-mail do usuário.").transform((value) => value.toLowerCase()),
});

export const recoverySchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").transform((value) => value.toLowerCase()),
});

export const emailChangeSchema = z.object({
  profileId: z.string().uuid("Usuário inválido."),
  newEmail: z.string().trim().email("Informe um e-mail válido.").transform((value) => value.toLowerCase()),
});
