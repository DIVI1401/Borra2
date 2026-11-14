import "server-only";

import type { z } from "zod";
import { HttpError } from "@/lib/server/guard";

/** Lee el JSON del cuerpo y lo valida con Zod. Devuelve el primer error en español. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new HttpError(400, "La solicitud no tiene un formato válido.", "request/invalid-json");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new HttpError(422, result.error.issues[0]?.message ?? "Los datos no son válidos.", "request/invalid");
  }
  return result.data;
}
