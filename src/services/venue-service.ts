"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api-client";
import type { Promo, Review, Venue, VenueWithId } from "@/types/venue";
import type { ReportInput, ReviewInput, VenueStatusInput } from "@/schemas/venue";

/** Máximo de locales que trae el mapa de una zona (las reglas exigen límite). */
export const MAX_VENUES_PER_ZONE = 100;

const venuesCol = collection(db, "venues");

function withId(snap: QueryDocumentSnapshot): VenueWithId {
  return { id: snap.id, ...(snap.data() as Venue) };
}

/** Locales activos de una zona, en tiempo real (el semáforo se actualiza solo). */
export function subscribeToZoneVenues(
  zone: string,
  onData: (venues: VenueWithId[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    venuesCol,
    where("zone", "==", zone),
    where("status", "==", "active"),
    orderBy("name"),
    limit(MAX_VENUES_PER_ZONE)
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map(withId)), onError);
}

export function subscribeToVenue(
  venueId: string,
  onData: (venue: VenueWithId | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "venues", venueId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as Venue) } : null),
    onError
  );
}

export async function getVenue(venueId: string): Promise<VenueWithId | null> {
  const snap = await getDoc(doc(db, "venues", venueId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Venue) } : null;
}

export async function getActivePromos(venueId: string): Promise<(Promo & { id: string })[]> {
  const snap = await getDocs(
    query(collection(db, "venues", venueId, "promos"), where("active", "==", true), orderBy("createdAt", "desc"), limit(10))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Promo) }));
}

export interface ReviewPage {
  reviews: (Review & { id: string })[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/** Reseñas paginadas (de a `pageSize`), de la más reciente a la más antigua. */
export async function getReviewsPage(
  venueId: string,
  pageSize = 10,
  cursor: QueryDocumentSnapshot | null = null
): Promise<ReviewPage> {
  const base = query(collection(db, "venues", venueId, "reviews"), orderBy("updatedAt", "desc"), limit(pageSize + 1));
  const snap = await getDocs(cursor ? query(base, startAfter(cursor)) : base);
  const docs = snap.docs.slice(0, pageSize);
  return {
    reviews: docs.map((d) => ({ id: d.id, ...(d.data() as Review) })),
    cursor: docs.at(-1) ?? null,
    hasMore: snap.docs.length > pageSize,
  };
}

// ---- Escrituras que pasan por la API (el servidor valida y recalcula) ----

export function reportVenue(venueId: string, input: ReportInput) {
  return apiFetch<{ ok: true; onSite: boolean; message: string }>(`/api/locales/${venueId}/reportes`, input);
}

export function publishVenueStatus(venueId: string, input: VenueStatusInput) {
  return apiFetch<{ ok: true }>(`/api/locales/${venueId}/estado`, input);
}

export function saveReview(venueId: string, input: ReviewInput) {
  return apiFetch<{ ok: true; verifiedVisit: boolean }>(`/api/locales/${venueId}/resena`, input);
}

export function deleteReview(venueId: string, uid?: string) {
  const qs = uid ? `?uid=${encodeURIComponent(uid)}` : "";
  return apiFetch<{ ok: true }>(`/api/locales/${venueId}/resena${qs}`, undefined, { method: "DELETE" });
}
