import { z } from "zod";

export const claimDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"], { error: "Decisión no válida." }),
});

export const roleChangeSchema = z.object({
  role: z.enum(["user", "admin"], { error: "Rol no válido." }),
});

export const venueFlagsSchema = z
  .object({
    status: z.enum(["active", "hidden"]).optional(),
    verified: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.verified !== undefined, { error: "No hay nada que cambiar." });
