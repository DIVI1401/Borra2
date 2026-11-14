import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { recomputeLive } from "@/lib/server/venues";

/** Cada cuánto puede correr la simulación (evita abuso: es un endpoint público). */
const TICK_EVERY_MS = 5 * 60 * 1000;
/** Un local recibe reporte simulado si lleva más de esto sin reportes. */
const STALE_AFTER_MS = 20 * 60 * 1000;

/** Número pseudoaleatorio estable a partir de un texto (misma entrada, mismo resultado). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/**
 * Modo demo: simula reportes para que el mapa tenga vida en la presentación,
 * a cualquier hora. Solo actúa si el admin activó settings/app.demoMode.
 * Devuelve cuántos locales actualizó.
 */
export async function runDemoTick(): Promise<number> {
  const settingsRef = adminDb.collection("settings").doc("app");

  // La transacción garantiza que, aunque lleguen muchas visitas a la vez, solo una simule.
  const shouldRun = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(settingsRef);
    if (snap.get("demoMode") !== true) return false;
    const last = snap.get("lastDemoTick") as Timestamp | undefined;
    if (last && Date.now() - last.toMillis() < TICK_EVERY_MS) return false;
    tx.set(settingsRef, { lastDemoTick: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
  if (!shouldRun) return 0;

  const venues = await adminDb.collection("venues").where("status", "==", "active").limit(100).get();
  const block = Math.floor(Date.now() / STALE_AFTER_MS);
  let updated = 0;

  for (const venue of venues.docs) {
    const lastLive = venue.get("live.updatedAt") as Timestamp | null | undefined;
    if (lastLive && Date.now() - lastLive.toMillis() < STALE_AFTER_MS) continue;

    const popularity = (venue.get("popularity") as number | undefined) ?? 2;
    const noise = (hash(`${venue.id}-${block}`) % 3) - 1;
    const level = Math.min(3, Math.max(1, popularity + noise)) as 1 | 2 | 3;

    await venue.ref.collection("reports").add({
      uid: "demo",
      level,
      queue: level === 3 && hash(`fila-${venue.id}-${block}`) % 2 === 0,
      onSite: true,
      source: "demo",
      nowPlaying: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await recomputeLive(venue.ref);
    updated++;
  }
  return updated;
}
