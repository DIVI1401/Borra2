import { z } from "zod";
import { DAYS, GENRES, VENUE_TYPES } from "@/types/venue";
import { cleanText } from "@/schemas/auth";

/** Las mismas validaciones se usan en los formularios y en la API. */

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Usa el formato HH:MM." });

export const scheduleSchema = z.object(
  Object.fromEntries(DAYS.map((d) => [d, z.object({ open: time, close: time }).nullable()])) as Record<
    (typeof DAYS)[number],
    z.ZodNullable<z.ZodObject<{ open: typeof time; close: typeof time }>>
  >
);

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Reporte de un usuario: "¿cómo está esto ahora?". */
export const reportSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)], { error: "Elige cómo está el sitio." }),
  queue: z.boolean().default(false),
  position: coordinatesSchema.nullable().default(null),
});

/** Estado que publica el propio local desde su panel. */
export const venueStatusSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)], { error: "Elige un nivel." }),
  queue: z.boolean().default(false),
  nowPlaying: cleanText(40).nullable().default(null),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, { error: "Elige de 1 a 5 estrellas." }).max(5),
  comment: cleanText(500).pipe(z.string().min(3, { error: "Escribe un comentario corto." })),
  position: coordinatesSchema.nullable().default(null),
});

export const promoSchema = z.object({
  title: cleanText(80).pipe(z.string().min(3, { error: "Escribe el título de la promoción." })),
  detail: cleanText(160),
  active: z.boolean().default(true),
});

/** Datos que el dueño puede editar de su local. */
export const venueEditableSchema = z.object({
  coverPrice: z.number().int().min(0).max(1_000_000),
  drinkPriceFrom: z.number().int().min(0).max(1_000_000),
  genres: z.array(z.enum(GENRES)).min(1, { error: "Elige al menos un género." }).max(4),
  schedule: scheduleSchema,
  description: cleanText(400).pipe(z.string().min(10, { error: "Describe el sitio en al menos 10 caracteres." })),
  ambience: cleanText(120),
  dressCode: cleanText(60),
});

/** Datos completos que solo puede definir un admin al crear o editar un local. */
export const venueAdminSchema = venueEditableSchema.extend({
  name: cleanText(60).pipe(z.string().min(2)),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/, { error: "Solo minúsculas, números y guiones (3 a 40)." }),
  type: z.enum(VENUE_TYPES),
  address: cleanText(120).pipe(z.string().min(5)),
  location: coordinatesSchema,
  verified: z.boolean(),
  status: z.enum(["active", "hidden"]),
});

export const venueClaimSchema = z.object({
  venueId: z.string().min(1),
  applicantName: cleanText(60).pipe(z.string().min(3, { error: "Escribe tu nombre completo." })),
  phone: z.string().regex(/^\+?\d[\d\s-]{6,18}$/, { error: "Escribe un teléfono válido." }),
  message: cleanText(400).pipe(z.string().min(10, { error: "Cuéntanos tu relación con el local." })),
});

export type ReportInput = z.input<typeof reportSchema>;
export type VenueStatusInput = z.input<typeof venueStatusSchema>;
export type ReviewInput = z.input<typeof reviewSchema>;
export type PromoInput = z.input<typeof promoSchema>;
export type VenueEditableInput = z.input<typeof venueEditableSchema>;
export type VenueAdminInput = z.input<typeof venueAdminSchema>;
export type VenueClaimInput = z.input<typeof venueClaimSchema>;
