/**
 * Carga los 12 locales de ejemplo con sus promos y reseñas.
 *
 * Uso:
 *   npm run seed            → crea solo los locales que no existen
 *   npm run seed -- --force → los vuelve a escribir (borra reseñas/promos de ejemplo y las recrea)
 *
 * Con emuladores usa .env.local. En producción necesita FIREBASE_SERVICE_ACCOUNT_BASE64.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, GeoPoint, getFirestore, Timestamp } from "firebase-admin/firestore";
import { seedVenues } from "./seed-data";

const force = process.argv.includes("--force");

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const app = serviceAccount
  ? initializeApp({ credential: cert(JSON.parse(Buffer.from(serviceAccount, "base64").toString("utf8"))) })
  : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore(app);

async function main() {
  let created = 0;
  for (const v of seedVenues) {
    const ref = db.collection("venues").doc(v.id);
    const exists = (await ref.get()).exists;
    if (exists && !force) continue;
    if (exists) await db.recursiveDelete(ref);

    const ratingCount = v.reviews.length;
    const ratingSum = v.reviews.reduce((s, r) => s + r.rating, 0);
    const ratingAvg = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

    const batch = db.batch();
    batch.set(ref, {
      name: v.name,
      slug: v.id,
      type: v.type,
      genres: v.genres,
      city: "Montería",
      zone: "norte",
      address: v.address,
      location: new GeoPoint(v.lat, v.lng),
      coverPrice: v.coverPrice,
      drinkPriceFrom: v.drinkPriceFrom,
      schedule: v.schedule,
      description: v.description,
      ambience: v.ambience,
      dressCode: v.dressCode,
      photos: [],
      verified: v.verified,
      ownerUid: null,
      status: "active",
      popularity: v.popularity,
      live: { level: 0, queue: false, nowPlaying: null, userReports1h: 0, updatedAt: null },
      rating: { avg: ratingAvg, count: ratingCount, sum: ratingSum },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    v.promos.forEach((p) => {
      batch.set(ref.collection("promos").doc(), {
        title: p.title,
        detail: p.detail,
        active: true,
        startsAt: null,
        endsAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    v.reviews.forEach((r, i) => {
      // Autores de ejemplo: uid ficticio "demo-…" (no corresponde a ninguna cuenta).
      const uid = `demo-${v.id}-${i}`;
      const when = Timestamp.fromMillis(Date.now() - (i + 1) * 86_400_000);
      batch.set(ref.collection("reviews").doc(uid), {
        uid,
        authorName: r.author,
        rating: r.rating,
        comment: r.comment,
        verifiedVisit: r.verifiedVisit,
        createdAt: when,
        updatedAt: when,
      });
    });

    await batch.commit();
    created++;
  }

  await db.collection("settings").doc("app").set({ demoMode: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`Listo: ${created} locales cargados (${seedVenues.length - created} ya existían). Modo demo activado.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
