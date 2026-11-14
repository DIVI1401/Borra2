import type { GeoPoint, Timestamp } from "firebase/firestore";

/** Niveles del semáforo. 0 = sin datos recientes. */
export const LEVELS = [0, 1, 2, 3] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  0: "Sin datos recientes",
  1: "Tranquilo",
  2: "Animado",
  3: "A reventar",
};

export const VENUE_TYPES = ["bar", "discoteca", "rooftop", "lounge"] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  bar: "Bar",
  discoteca: "Discoteca",
  rooftop: "Rooftop",
  lounge: "Lounge",
};

export const GENRES = ["Reggaetón", "Vallenato", "Champeta", "Salsa", "Crossover", "Electrónica"] as const;
export type Genre = (typeof GENRES)[number];

export const DAYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

/** Horario de un día: "HH:MM" (cierre puede pasar de medianoche) o null si no abre. */
export type DaySchedule = { open: string; close: string } | null;
export type Schedule = Record<Day, DaySchedule>;

/** Estado en vivo del local. Solo lo escribe el servidor al recibir reportes. */
export interface LiveStatus {
  level: Level;
  queue: boolean;
  nowPlaying: string | null;
  userReports1h: number;
  updatedAt: Timestamp | null;
}

export interface RatingSummary {
  /** Promedio redondeado a un decimal (para mostrar). */
  avg: number;
  count: number;
  /** Suma exacta de estrellas (para recalcular sin errores de redondeo). */
  sum: number;
}

/** venues/{venueId} (el id es el slug, ej. "neon41"). */
export interface Venue {
  name: string;
  slug: string;
  type: VenueType;
  genres: Genre[];
  city: string;
  zone: string;
  address: string;
  location: GeoPoint;
  coverPrice: number;
  drinkPriceFrom: number;
  schedule: Schedule;
  description: string;
  ambience: string;
  dressCode: string;
  photos: string[];
  verified: boolean;
  ownerUid: string | null;
  status: "active" | "hidden";
  /** 1 a 3: qué tan lleno suele estar (solo lo usa el modo demo). */
  popularity: number;
  live: LiveStatus;
  rating: RatingSummary;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface VenueWithId extends Venue {
  id: string;
}

/** venues/{venueId}/reports/{reportId}. Solo los crea el servidor. */
export interface Report {
  uid: string;
  level: Exclude<Level, 0>;
  queue: boolean;
  onSite: boolean;
  source: "user" | "venue" | "demo";
  createdAt: Timestamp;
}

/** venues/{venueId}/reviews/{uid}: una reseña por persona. Solo las escribe el servidor. */
export interface Review {
  uid: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedVisit: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** venues/{venueId}/promos/{promoId}. Las escribe el dueño del local o un admin. */
export interface Promo {
  title: string;
  detail: string;
  active: boolean;
  startsAt: Timestamp | null;
  endsAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** venueClaims/{claimId}: solicitud para administrar un local. */
export interface VenueClaim {
  uid: string;
  venueId: string;
  applicantName: string;
  phone: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** sharedLocations/{token}: ubicación compartida con amigos (se lee con el enlace). */
export interface SharedLocation {
  uid: string;
  name: string;
  location: GeoPoint;
  active: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** settings/app: configuración global que cambia el admin. */
export interface AppSettings {
  demoMode: boolean;
  updatedAt: Timestamp | null;
}
