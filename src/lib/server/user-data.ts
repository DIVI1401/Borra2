import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { deleteReview } from "@/lib/server/venues";
import { releaseOwnedVenue } from "@/lib/server/admin";

/**
 * Borra todos los datos personales de una persona (derecho de supresión, Ley 1581).
 * Se llama al eliminar la cuenta.
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  // Reseñas: se borran una por una para que el promedio de cada local quede bien.
  const reviews = await adminDb.collectionGroup("reviews").where("uid", "==", uid).get();
  for (const review of reviews.docs) {
    const venueId = review.ref.parent.parent?.id;
    if (venueId) await deleteReview(venueId, uid);
  }

  // Reportes: se anonimizan (sirven para el historial del local, pero ya no apuntan a la persona).
  const reports = await adminDb.collectionGroup("reports").where("uid", "==", uid).get();
  const shared = await adminDb.collection("sharedLocations").where("uid", "==", uid).get();
  const claims = await adminDb.collection("venueClaims").where("uid", "==", uid).get();

  const ops = [
    ...reports.docs.map((d) => ({ type: "anon" as const, ref: d.ref })),
    ...shared.docs.map((d) => ({ type: "delete" as const, ref: d.ref })),
    ...claims.docs.map((d) => ({ type: "delete" as const, ref: d.ref })),
  ];
  for (let i = 0; i < ops.length; i += 400) {
    const batch = adminDb.batch();
    ops.slice(i, i + 400).forEach((op) =>
      op.type === "anon" ? batch.update(op.ref, { uid: "eliminado" }) : batch.delete(op.ref)
    );
    await batch.commit();
  }

  // Si era dueña de un local, el local queda sin dueño.
  await releaseOwnedVenue(uid);

  // Perfil y sus subcolecciones (favoritos).
  await adminDb.recursiveDelete(adminDb.collection("users").doc(uid));
}
