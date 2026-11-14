import type { Timestamp } from "firebase/firestore";

export const ROLES = ["user", "venue", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  user: "Usuario",
  venue: "Local aliado",
  admin: "Administrador",
};

/** Documento users/{uid}. `role` y `venueId` son copia de los custom claims y solo los escribe el servidor. */
export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  role: Role;
  venueId: string | null;
  favoriteGenres: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** Lo que leemos de los custom claims del token de Firebase. */
export interface AuthClaims {
  role: Role;
  venueId: string | null;
}
