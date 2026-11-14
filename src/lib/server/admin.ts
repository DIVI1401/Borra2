import "server-only";

import { FieldValue, GeoPoint } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/server/guard";
import type { z } from "zod";
import type { venueAdminSchema } from "@/schemas/venue";
import type { Role } from "@/types/user";

/** Deja constancia de cada acción de administración (quién, qué y sobre qué). */
export async function logAdminAction(actorUid: string, action: string, target: string, details: Record<string, unknown> = {}) {
  await adminDb.collection("adminLogs").add({ actorUid, action, target, details, createdAt: FieldValue.serverTimestamp() });
}

/**
 * Cambia el rol de una cuenta: custom claims (lo que valen las reglas)
 * + copia en users/{uid} (para mostrarlo en la app).
 * Revoca los tokens para que el cambio aplique de inmediato.
 */
export async function setUserRole(uid: string, role: Role, venueId: string | null = null) {
  const claims = role === "venue" ? { role, venueId } : { role };
  await adminAuth.setCustomUserClaims(uid, claims);
  await adminAuth.revokeRefreshTokens(uid);
  await adminDb
    .collection("users")
    .doc(uid)
    .set({ role, venueId: role === "venue" ? venueId : null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

/** Si la persona era dueña de un local, lo deja sin dueño. */
export async function releaseOwnedVenue(uid: string) {
  const owned = await adminDb.collection("venues").where("ownerUid", "==", uid).limit(10).get();
  await Promise.all(owned.docs.map((d) => d.ref.update({ ownerUid: null, updatedAt: FieldValue.serverTimestamp() })));
}

/** Aprueba o rechaza una solicitud para administrar un local. */
export async function reviewVenueClaim(adminUid: string, claimId: string, decision: "approved" | "rejected") {
  const ref = adminDb.collection("venueClaims").doc(claimId);
  const claim = await ref.get();
  if (!claim.exists) throw new HttpError(404, "Esa solicitud no existe.", "claim/not-found");
  if (claim.get("status") !== "pending") throw new HttpError(409, "Esa solicitud ya fue revisada.", "claim/already-reviewed");

  const uid = claim.get("uid") as string;
  const venueId = claim.get("venueId") as string;

  if (decision === "approved") {
    const venueRef = adminDb.collection("venues").doc(venueId);
    const venue = await venueRef.get();
    if (!venue.exists) throw new HttpError(404, "El local ya no existe.", "venue/not-found");
    const currentOwner = venue.get("ownerUid") as string | null;
    if (currentOwner && currentOwner !== uid) {
      throw new HttpError(409, "Ese local ya tiene un dueño. Quítaselo primero desde Usuarios.", "venue/has-owner");
    }
    let user;
    try {
      user = await adminAuth.getUser(uid);
    } catch {
      throw new HttpError(404, "La cuenta que pidió el acceso ya no existe.", "user/not-found");
    }
    if (user.customClaims?.role === "admin") {
      throw new HttpError(409, "Esa cuenta es administradora; no se le puede asignar un local.", "user/is-admin");
    }
    await releaseOwnedVenue(uid);
    await setUserRole(uid, "venue", venueId);
    await venueRef.update({ ownerUid: uid, updatedAt: FieldValue.serverTimestamp() });

    // Las demás solicitudes pendientes para ese local quedan rechazadas.
    const others = await adminDb
      .collection("venueClaims")
      .where("venueId", "==", venueId)
      .where("status", "==", "pending")
      .limit(50)
      .get();
    const batch = adminDb.batch();
    others.docs
      .filter((d) => d.id !== claimId)
      .forEach((d) => batch.update(d.ref, { status: "rejected", reviewedBy: adminUid, updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
  }

  await ref.update({ status: decision, reviewedBy: adminUid, updatedAt: FieldValue.serverTimestamp() });
  await logAdminAction(adminUid, decision === "approved" ? "claim.approve" : "claim.reject", claimId, { uid, venueId });
}

/** Cambia el rol desde el panel (solo usuario ↔ admin, o quitar un local). */
export async function changeRoleFromPanel(adminUid: string, targetUid: string, role: "user" | "admin") {
  if (targetUid === adminUid && role !== "admin") {
    throw new HttpError(409, "No puedes quitarte tu propio rol de administrador.", "role/self-demote");
  }
  try {
    await adminAuth.getUser(targetUid);
  } catch {
    throw new HttpError(404, "Esa cuenta no existe.", "user/not-found");
  }
  await releaseOwnedVenue(targetUid);
  await setUserRole(targetUid, role);
  await logAdminAction(adminUid, "user.role", targetUid, { role });
}

type VenueAdminData = z.output<typeof venueAdminSchema>;

/** Crea o edita un local completo (solo admin). El id del documento es el slug. */
export async function saveVenueAsAdmin(adminUid: string, data: VenueAdminData, mode: "create" | "update") {
  const ref = adminDb.collection("venues").doc(data.slug);
  const exists = (await ref.get()).exists;
  if (mode === "create" && exists) throw new HttpError(409, "Ya existe un local con ese identificador.", "venue/exists");
  if (mode === "update" && !exists) throw new HttpError(404, "Ese local no existe.", "venue/not-found");

  const fields = {
    name: data.name,
    slug: data.slug,
    type: data.type,
    genres: data.genres,
    address: data.address,
    location: new GeoPoint(data.location.lat, data.location.lng),
    coverPrice: data.coverPrice,
    drinkPriceFrom: data.drinkPriceFrom,
    schedule: data.schedule,
    description: data.description,
    ambience: data.ambience,
    dressCode: data.dressCode,
    verified: data.verified,
    status: data.status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (mode === "create") {
    await ref.set({
      ...fields,
      city: "Montería",
      zone: "norte",
      photos: [],
      ownerUid: null,
      popularity: 2,
      live: { level: 0, queue: false, nowPlaying: null, userReports1h: 0, updatedAt: null },
      rating: { avg: 0, count: 0, sum: 0 },
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.update(fields);
  }
  await logAdminAction(adminUid, mode === "create" ? "venue.create" : "venue.update", data.slug);
}

export async function setVenueStatus(adminUid: string, venueId: string, patch: { status?: "active" | "hidden"; verified?: boolean }) {
  const ref = adminDb.collection("venues").doc(venueId);
  if (!(await ref.get()).exists) throw new HttpError(404, "Ese local no existe.", "venue/not-found");
  await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  await logAdminAction(adminUid, "venue.flags", venueId, patch);
}
