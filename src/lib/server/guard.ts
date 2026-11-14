import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { adminAppCheck, adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types/user";

/** Error con código HTTP y mensaje en español para devolver al cliente. */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = "http/error") {
    super(message);
  }
}

interface GuardOptions {
  /** Exige correo verificado (por defecto sí). */
  requireVerified?: boolean;
  /** Roles permitidos; si se omite, cualquier usuario autenticado. */
  roles?: Role[];
  /** Exige que haya iniciado sesión hace menos de N segundos (acciones sensibles). */
  maxAuthAgeSeconds?: number;
}

/**
 * Verifica en el servidor quién hace la petición:
 * 1. App Check (si APP_CHECK_ENFORCE=true): que venga de nuestra app.
 * 2. Token de Firebase válido y no revocado.
 * 3. Correo verificado, rol y antigüedad del inicio de sesión según se pida.
 */
export async function verifyRequest(request: Request, options: GuardOptions = {}): Promise<DecodedIdToken> {
  const { requireVerified = true, roles, maxAuthAgeSeconds } = options;

  if (process.env.APP_CHECK_ENFORCE === "true") {
    const appCheckToken = request.headers.get("X-Firebase-AppCheck");
    if (!appCheckToken) throw new HttpError(401, "Solicitud no autorizada.", "app-check/missing");
    try {
      await adminAppCheck.verifyToken(appCheckToken);
    } catch {
      throw new HttpError(401, "Solicitud no autorizada.", "app-check/invalid");
    }
  }

  const header = request.headers.get("Authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!idToken) throw new HttpError(401, "Inicia sesión para continuar.", "auth/no-token");

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    throw new HttpError(401, "Tu sesión venció. Inicia sesión de nuevo.", "auth/invalid-token");
  }

  if (requireVerified && !decoded.email_verified) {
    throw new HttpError(403, "Verifica tu correo para usar esta función.", "auth/email-not-verified");
  }

  const role = (decoded.role as Role | undefined) ?? "user";
  if (roles && !roles.includes(role)) {
    throw new HttpError(403, "No tienes permiso para hacer esto.", "auth/forbidden");
  }

  if (maxAuthAgeSeconds !== undefined) {
    const age = Date.now() / 1000 - decoded.auth_time;
    if (age > maxAuthAgeSeconds) {
      throw new HttpError(401, "Por seguridad, vuelve a confirmar tu contraseña.", "auth/requires-recent-login");
    }
  }

  return decoded;
}

/** Convierte cualquier error en una respuesta JSON segura (sin filtrar detalles internos). */
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("[api]", error);
  return NextResponse.json({ error: "Algo falló en el servidor. Intenta de nuevo.", code: "server/error" }, { status: 500 });
}
