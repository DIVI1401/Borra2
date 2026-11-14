"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api-client";
import type { Promo, Report } from "@/types/venue";
import type { PromoInput, VenueEditableInput } from "@/schemas/venue";

/**
 * Lo que hace el dueño de un local desde su panel.
 * Las Security Rules solo le dejan tocar SU local y solo estos campos.
 */

export async function updateVenueShowcase(venueId: string, data: VenueEditableInput & { photos?: string[] }) {
  await updateDoc(doc(db, "venues", venueId), { ...data, updatedAt: serverTimestamp() });
}

/** Solo la lista de fotos (las reglas exigen que el resto de la vitrina siga siendo válido). */
export async function updateVenuePhotos(venueId: string, photos: string[]) {
  const safe = photos.filter((url) => url.startsWith("https://res.cloudinary.com/")).slice(0, 6);
  await updateDoc(doc(db, "venues", venueId), { photos: safe, updatedAt: serverTimestamp() });
}

export function subscribeToAllPromos(
  venueId: string,
  onData: (promos: (Promo & { id: string })[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "venues", venueId, "promos"), orderBy("createdAt", "desc"), limit(30)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Promo) }))),
    () => onData([])
  );
}

export async function createPromo(venueId: string, input: PromoInput) {
  await addDoc(collection(db, "venues", venueId, "promos"), {
    title: input.title,
    detail: input.detail,
    active: input.active ?? true,
    startsAt: null,
    endsAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setPromoActive(venueId: string, promo: Promo & { id: string }, active: boolean) {
  await updateDoc(doc(db, "venues", venueId, "promos", promo.id), {
    title: promo.title,
    detail: promo.detail,
    active,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    createdAt: promo.createdAt,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePromo(venueId: string, promoId: string) {
  await deleteDoc(doc(db, "venues", venueId, "promos", promoId));
}

/** Últimos reportes recibidos (privados: solo los ve el dueño y el admin). */
export async function getRecentReports(venueId: string, max = 15): Promise<(Report & { id: string })[]> {
  const snap = await getDocs(query(collection(db, "venues", venueId, "reports"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Report) }));
}

/** Firma de Cloudinary para subir una foto (la pide el servidor; el secreto nunca llega al navegador). */
export function getUploadSignature(venueId: string) {
  return apiFetch<{ cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }>(
    "/api/fotos/firma",
    { venueId }
  );
}
