"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  GeoPoint,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AppSettings, SharedLocation, VenueClaim } from "@/types/venue";
import type { VenueClaimInput } from "@/schemas/venue";

// ---------- Favoritos: users/{uid}/favorites/{venueId} ----------

export function subscribeToFavorites(uid: string, onData: (ids: Set<string>) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "users", uid, "favorites"), orderBy("createdAt", "desc"), limit(100)),
    (snap) => onData(new Set(snap.docs.map((d) => d.id))),
    () => onData(new Set())
  );
}

export async function addFavorite(uid: string, venueId: string, venueName: string) {
  await setDoc(doc(db, "users", uid, "favorites", venueId), { venueName, createdAt: serverTimestamp() });
}

export async function removeFavorite(uid: string, venueId: string) {
  await deleteDoc(doc(db, "users", uid, "favorites", venueId));
}

// ---------- Solicitudes para administrar un local ----------

export async function createVenueClaim(uid: string, input: VenueClaimInput) {
  await addDoc(collection(db, "venueClaims"), {
    uid,
    venueId: input.venueId,
    applicantName: input.applicantName,
    phone: input.phone,
    message: input.message,
    status: "pending",
    reviewedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getMyClaims(uid: string): Promise<(VenueClaim & { id: string })[]> {
  const snap = await getDocs(
    query(collection(db, "venueClaims"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(10))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as VenueClaim) }));
}

// ---------- Ubicación compartida ----------

/** Duración máxima de una ubicación compartida (las reglas no permiten más de 4 h). */
export const SHARE_DURATION_MS = 4 * 60 * 60 * 1000 - 60_000;

/** Token largo y aleatorio: es lo único que protege el enlace, así que no debe adivinarse. */
function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function startSharingLocation(uid: string, name: string, position: { lat: number; lng: number }) {
  const token = randomToken();
  await setDoc(doc(db, "sharedLocations", token), {
    uid,
    name,
    location: new GeoPoint(position.lat, position.lng),
    active: true,
    expiresAt: Timestamp.fromMillis(Date.now() + SHARE_DURATION_MS),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return token;
}

export async function updateSharedLocation(token: string, position: { lat: number; lng: number }) {
  await updateDoc(doc(db, "sharedLocations", token), {
    location: new GeoPoint(position.lat, position.lng),
    active: true,
    updatedAt: serverTimestamp(),
  });
}

export async function stopSharingLocation(token: string) {
  await updateDoc(doc(db, "sharedLocations", token), { active: false, updatedAt: serverTimestamp() });
}

export function subscribeToSharedLocation(
  token: string,
  onData: (location: SharedLocation | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "sharedLocations", token),
    (snap) => onData(snap.exists() ? (snap.data() as SharedLocation) : null),
    onError
  );
}

// ---------- Configuración global ----------

export function subscribeToSettings(onData: (settings: AppSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "settings", "app"),
    (snap) => onData(snap.exists() ? (snap.data() as AppSettings) : { demoMode: false, updatedAt: null }),
    () => onData({ demoMode: false, updatedAt: null })
  );
}
