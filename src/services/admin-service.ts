"use client";

import {
  collection,
  collectionGroup,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api-client";
import type { UserProfile } from "@/types/user";
import type { Review, Venue, VenueClaim } from "@/types/venue";
import type { VenueAdminInput } from "@/schemas/venue";

/** Resultado paginado genérico: nunca se lee una colección completa. */
export interface Page<T> {
  items: (T & { id: string; path: string })[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

async function fetchPage<T>(
  base: ReturnType<typeof collection> | ReturnType<typeof collectionGroup>,
  constraints: QueryConstraint[],
  pageSize: number,
  cursor: QueryDocumentSnapshot | null
): Promise<Page<T>> {
  const all = [...constraints, ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)];
  const snap = await getDocs(query(base, ...all));
  const docs = snap.docs.slice(0, pageSize);
  return {
    items: docs.map((d) => ({ id: d.id, path: d.ref.path, ...(d.data() as T) })),
    cursor: docs.at(-1) ?? null,
    hasMore: snap.docs.length > pageSize,
  };
}

export function getUsersPage(cursor: QueryDocumentSnapshot | null, pageSize = 20) {
  return fetchPage<UserProfile>(collection(db, "users"), [orderBy("createdAt", "desc")], pageSize, cursor);
}

export function getVenuesPage(cursor: QueryDocumentSnapshot | null, pageSize = 20) {
  return fetchPage<Venue>(collection(db, "venues"), [orderBy("name")], pageSize, cursor);
}

export function getClaimsPage(status: VenueClaim["status"], cursor: QueryDocumentSnapshot | null, pageSize = 20) {
  return fetchPage<VenueClaim>(
    collection(db, "venueClaims"),
    [where("status", "==", status), orderBy("createdAt", "desc")],
    pageSize,
    cursor
  );
}

export function getLatestReviewsPage(cursor: QueryDocumentSnapshot | null, pageSize = 20) {
  return fetchPage<Review>(collectionGroup(db, "reviews"), [orderBy("updatedAt", "desc")], pageSize, cursor);
}

/** Totales para el resumen (consultas de conteo: no descargan los documentos). */
export async function getDashboardCounts() {
  const [users, venues, pending] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "venues")),
    getCountFromServer(query(collection(db, "venueClaims"), where("status", "==", "pending"))),
  ]);
  return { users: users.data().count, venues: venues.data().count, pendingClaims: pending.data().count };
}

export async function setDemoMode(demoMode: boolean) {
  await setDoc(doc(db, "settings", "app"), { demoMode, updatedAt: serverTimestamp() }, { merge: true });
}

// ---- Acciones que pasan por la API (Admin SDK) ----

export function decideClaim(claimId: string, decision: "approved" | "rejected") {
  return apiFetch<{ ok: true }>(`/api/admin/solicitudes/${claimId}`, { decision });
}

export function changeUserRole(uid: string, role: "user" | "admin") {
  return apiFetch<{ ok: true }>(`/api/admin/usuarios/${uid}/rol`, { role });
}

export function saveVenue(mode: "create" | "update", venue: VenueAdminInput) {
  return apiFetch<{ ok: true; id: string }>("/api/admin/locales", { mode, venue });
}

export function setVenueFlags(venueId: string, patch: { status?: "active" | "hidden"; verified?: boolean }) {
  return apiFetch<{ ok: true }>(`/api/admin/locales/${venueId}`, patch);
}
