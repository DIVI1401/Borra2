/**
 * Asigna un rol (custom claim) a una cuenta. Sirve para crear el PRIMER admin,
 * porque nadie puede darse permisos a sí mismo desde la app.
 *
 * Uso:
 *   npm run set-role -- correo@ejemplo.com admin
 *   npm run set-role -- correo@ejemplo.com venue <venueId>
 *   npm run set-role -- correo@ejemplo.com user
 *
 * Con emuladores: carga .env.local (FIREBASE_AUTH_EMULATOR_HOST).
 * En producción: necesita FIREBASE_SERVICE_ACCOUNT_BASE64.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ROLES = ["user", "venue", "admin"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [email, role, venueId] = process.argv.slice(2);
  if (!email || !ROLES.includes(role as Role)) {
    console.error("Uso: npm run set-role -- <correo> <user|venue|admin> [venueId]");
    process.exit(1);
  }
  if (role === "venue" && !venueId) {
    console.error("El rol venue necesita el id del local.");
    process.exit(1);
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const app = serviceAccount
    ? initializeApp({
        credential: cert(JSON.parse(Buffer.from(serviceAccount, "base64").toString("utf8"))),
      })
    : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const user = await auth.getUserByEmail(email);
  const claims = role === "user" ? { role: "user" } : { role, venueId: role === "venue" ? venueId : null };
  await auth.setCustomUserClaims(user.uid, claims);
  await db
    .collection("users")
    .doc(user.uid)
    .set({ role, venueId: role === "venue" ? venueId : null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  console.log(`Listo: ${email} ahora tiene el rol "${role}". Debe cerrar sesión y volver a entrar para verlo.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
