"use client";

import { auth, getAppCheckToken } from "@/lib/firebase/client";
import { AppError } from "@/lib/firebase/errors";

interface ApiOptions {
  /** Pide un token nuevo (necesario justo después de reautenticarse). */
  forceRefresh?: boolean;
  /** Por defecto POST si hay cuerpo y GET si no. */
  method?: "GET" | "POST" | "DELETE";
}

/**
 * Llama a nuestras rutas de API enviando el token de sesión de Firebase
 * y el token de App Check. El servidor verifica ambos.
 */
export async function apiFetch<T>(path: string, body?: unknown, options: ApiOptions = {}): Promise<T> {
  const user = auth.currentUser;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (user) headers.Authorization = `Bearer ${await user.getIdToken(options.forceRefresh)}`;
  const appCheckToken = await getAppCheckToken();
  if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (body === undefined ? "GET" : "POST"),
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AppError("No hay conexión. Revisa tu internet e intenta de nuevo.", "app/network");
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string } & T;
  if (!response.ok) {
    throw new AppError(data.error ?? "Algo falló en el servidor. Intenta de nuevo.", data.code ?? `http/${response.status}`);
  }
  return data;
}
