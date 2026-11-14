import { z } from "zod";

/** Quita espacios sobrantes y caracteres de control (protección básica de entradas). */
export const cleanText = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max, { error: `Máximo ${max} caracteres.` }));

export const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "Escribe tu correo." })
  .pipe(z.email({ error: "Ese correo no es válido." }))
  .transform((v) => v.toLowerCase());

/** Contraseña segura: 8+ caracteres, mayúscula, minúscula, número y símbolo. */
export const passwordRules = [
  { test: (v: string) => v.length >= 8, label: "Al menos 8 caracteres" },
  { test: (v: string) => /[A-ZÁÉÍÓÚÑ]/.test(v), label: "Una mayúscula" },
  { test: (v: string) => /[a-záéíóúñ]/.test(v), label: "Una minúscula" },
  { test: (v: string) => /\d/.test(v), label: "Un número" },
  { test: (v: string) => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(v), label: "Un símbolo (ej. ! # $ %)" },
] as const;

export const strongPasswordSchema = z
  .string()
  .max(128, { error: "Máximo 128 caracteres." })
  .refine((v) => passwordRules.every((r) => r.test(v)), {
    error: "La contraseña no cumple todos los requisitos.",
  });

export const displayNameSchema = cleanText(40).pipe(
  z.string().min(2, { error: "Escribe al menos 2 caracteres." })
);

export const signUpSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, {
      error: "Debes aceptar los términos y la política de privacidad.",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Escribe tu contraseña." }),
  remember: z.boolean(),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Escribe tu contraseña actual." }),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.password !== d.currentPassword, {
    error: "La nueva contraseña debe ser distinta a la actual.",
    path: ["password"],
  });

export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  currentPassword: z.string().optional(),
});

export const profileSchema = z.object({
  displayName: displayNameSchema,
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type ResetRequestInput = z.input<typeof resetRequestSchema>;
export type NewPasswordInput = z.input<typeof newPasswordSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangeEmailInput = z.input<typeof changeEmailSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
