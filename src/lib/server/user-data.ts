import "server-only";

import { adminDb } from "@/lib/firebase/admin";

/**
 * Borra todos los datos personales de una persona (derecho de supresión, Ley 1581).
 * Se va ampliando a medida que la app guarda más cosas por usuario.
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  const userRef = adminDb.collection("users").doc(uid);

  // Subcolecciones y documento del perfil.
  await adminDb.recursiveDelete(userRef);

  // Reseñas (el id del documento es el uid) y ubicaciones compartidas.
  const reviews = await adminDb.collectionGroup("reviews").where("uid", "==", uid).get();
  const shared = await adminDb.collection("sharedLocations").where("uid", "==", uid).get();

  const docs = [...reviews.docs, ...shared.docs];
  for (let i = 0; i < docs.length; i += 400) {
    const batch = adminDb.batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
