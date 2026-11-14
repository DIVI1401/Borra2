import "server-only";

import { FieldValue, Timestamp, type DocumentReference, type GeoPoint } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/server/guard";
import { computeLive, distanceMeters, LIVE_WINDOW_MS, ON_SITE_RADIUS_M, type ReportSample } from "@/lib/live";

/** Un usuario puede reportar el mismo local una vez cada 10 minutos. */
const REPORT_COOLDOWN_MS = 10 * 60 * 1000;

interface Coordinates {
  lat: number;
  lng: number;
}

async function getActiveVenue(venueId: string) {
  const ref = adminDb.collection("venues").doc(venueId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("status") !== "active") throw new HttpError(404, "Ese local no existe.", "venue/not-found");
  return { ref, snap };
}

function isOnSite(venueLocation: GeoPoint, position: Coordinates | null): boolean {
  if (!position) return false;
  return distanceMeters({ lat: venueLocation.latitude, lng: venueLocation.longitude }, position) <= ON_SITE_RADIUS_M;
}

/**
 * Recalcula venues/{id}.live a partir de los reportes recientes.
 * Lee solo la ventana de 90 minutos (máximo 100 reportes), nunca toda la colección.
 */
export async function recomputeLive(venueRef: DocumentReference): Promise<void> {
  const now = Date.now();
  const snap = await venueRef
    .collection("reports")
    .where("createdAt", ">=", Timestamp.fromMillis(now - LIVE_WINDOW_MS))
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const samples: ReportSample[] = snap.docs.map((d) => ({
    level: d.get("level"),
    queue: d.get("queue") === true,
    onSite: d.get("onSite") === true,
    source: d.get("source"),
    nowPlaying: d.get("nowPlaying") ?? null,
    createdAtMs: (d.get("createdAt") as Timestamp).toMillis(),
  }));

  const live = computeLive(samples, now);
  await venueRef.update({
    live: {
      level: live.level,
      queue: live.queue,
      nowPlaying: live.nowPlaying,
      userReports1h: live.userReports1h,
      updatedAt: live.lastReportMs ? Timestamp.fromMillis(live.lastReportMs) : null,
    },
  });
}

/** Reporte de un usuario ("¿cómo está esto ahora?"). Verifica en el servidor si está en el sitio. */
export async function submitUserReport(
  venueId: string,
  uid: string,
  input: { level: 1 | 2 | 3; queue: boolean; position: Coordinates | null }
): Promise<{ onSite: boolean }> {
  const { ref, snap } = await getActiveVenue(venueId);

  const last = await ref
    .collection("reports")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  const lastAt = last.docs[0]?.get("createdAt") as Timestamp | undefined;
  if (lastAt && Date.now() - lastAt.toMillis() < REPORT_COOLDOWN_MS) {
    throw new HttpError(429, "Ya reportaste este sitio hace poco. Puedes volver a hacerlo en 10 minutos.", "report/too-soon");
  }

  const onSite = isOnSite(snap.get("location") as GeoPoint, input.position);
  await ref.collection("reports").add({
    uid,
    level: input.level,
    queue: input.queue,
    onSite,
    source: "user",
    nowPlaying: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await recomputeLive(ref);
  return { onSite };
}

/** Estado publicado por el propio local desde su panel (pesa más que un usuario). */
export async function submitVenueStatus(
  venueId: string,
  uid: string,
  input: { level: 1 | 2 | 3; queue: boolean; nowPlaying: string | null }
): Promise<void> {
  const { ref } = await getActiveVenue(venueId);
  await ref.collection("reports").add({
    uid,
    level: input.level,
    queue: input.queue,
    onSite: true,
    source: "venue",
    nowPlaying: input.nowPlaying,
    createdAt: FieldValue.serverTimestamp(),
  });
  await recomputeLive(ref);
}


/**
 * La calificación guarda la SUMA exacta de estrellas además del promedio redondeado:
 * así, al editar o borrar reseñas, el promedio no se va descuadrando por redondeos.
 */
function currentRating(raw: unknown): { sum: number; count: number } {
  const r = (raw ?? {}) as { avg?: number; count?: number; sum?: number };
  const count = r.count ?? 0;
  // Compatibilidad: si un documento viejo no tiene "sum", se reconstruye del promedio.
  const sum = r.sum ?? Math.round((r.avg ?? 0) * count);
  return { sum, count };
}

function ratingFields(sum: number, count: number) {
  return { sum, count, avg: count ? Math.round((sum / count) * 10) / 10 : 0 };
}

/**
 * Crea o actualiza la reseña de una persona (una por local) y recalcula
 * la calificación promedio dentro de una transacción para que no se descuadre.
 */
export async function upsertReview(
  venueId: string,
  user: { uid: string; name: string },
  input: { rating: number; comment: string; position: Coordinates | null }
): Promise<{ verifiedVisit: boolean }> {
  const { ref, snap } = await getActiveVenue(venueId);
  const reviewRef = ref.collection("reviews").doc(user.uid);
  const verifiedVisit = isOnSite(snap.get("location") as GeoPoint, input.position);

  await adminDb.runTransaction(async (tx) => {
    const [venue, existing] = await Promise.all([tx.get(ref), tx.get(reviewRef)]);
    let { sum: total, count } = currentRating(venue.get("rating"));

    if (existing.exists) {
      total -= existing.get("rating") as number;
    } else {
      count += 1;
    }
    total += input.rating;

    tx.set(
      reviewRef,
      {
        uid: user.uid,
        authorName: user.name.slice(0, 40),
        rating: input.rating,
        comment: input.comment,
        // Si ya había sido verificada, no se pierde al editarla desde casa.
        verifiedVisit: verifiedVisit || existing.get("verifiedVisit") === true,
        createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: false }
    );
    tx.update(ref, { rating: ratingFields(total, count) });
  });

  return { verifiedVisit };
}

/** Borra una reseña (la propia, o cualquiera si es admin moderando) y ajusta el promedio. */
export async function deleteReview(venueId: string, reviewUid: string): Promise<void> {
  const ref = adminDb.collection("venues").doc(venueId);
  const reviewRef = ref.collection("reviews").doc(reviewUid);

  await adminDb.runTransaction(async (tx) => {
    const [venue, existing] = await Promise.all([tx.get(ref), tx.get(reviewRef)]);
    if (!existing.exists) throw new HttpError(404, "Esa reseña no existe.", "review/not-found");
    const rating = currentRating(venue.get("rating"));
    const count = Math.max(0, rating.count - 1);
    const total = count ? rating.sum - (existing.get("rating") as number) : 0;
    tx.delete(reviewRef);
    tx.update(ref, { rating: ratingFields(total, count) });
  });
}
