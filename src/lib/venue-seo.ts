import { cacheLife } from "next/cache";

/**
 * Datos básicos de un local para el SEO (título y descripción de su ficha).
 * Se leen por la API REST pública de Firestore (los locales activos son públicos),
 * así no hace falta la cuenta de servicio, y se guardan en caché unas horas.
 */
export interface VenueSeo {
  name: string;
  description: string;
}

function firestoreBase(): string {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  const host = emulator ? `http://${emulator}` : "https://firestore.googleapis.com";
  return `${host}/v1/projects/${project}/databases/(default)/documents`;
}

export async function getVenueSeo(slug: string): Promise<VenueSeo | null> {
  "use cache";
  cacheLife("hours");

  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return null;
  try {
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(`${firestoreBase()}/venues/${slug}?key=${key}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const doc = (await res.json()) as { fields?: Record<string, { stringValue?: string }> };
    const name = doc.fields?.name?.stringValue;
    if (!name) return null;
    return { name, description: doc.fields?.description?.stringValue ?? "" };
  } catch {
    return null;
  }
}
