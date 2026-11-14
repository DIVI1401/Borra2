"use client";

import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/user";

const userRef = (uid: string) => doc(db, "users", uid);

/**
 * Crea el perfil users/{uid} la primera vez que alguien entra.
 * Las Security Rules solo aceptan estos campos y fijan role = "user":
 * nadie puede crearse a sí mismo como admin.
 */
export async function ensureUserProfile(user: User, displayName?: string): Promise<void> {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    displayName: (displayName ?? user.displayName ?? "Parcero").slice(0, 40),
    email: user.email ?? "",
    photoURL: user.photoURL ?? null,
    role: "user",
    venueId: null,
    favoriteGenres: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToProfile(uid: string, cb: (profile: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
    () => cb(null)
  );
}

export async function updateProfileData(uid: string, data: { displayName?: string; favoriteGenres?: string[] }) {
  await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() });
}
