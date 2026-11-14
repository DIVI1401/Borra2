import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAppCheck } from "firebase-admin/app-check";

/**
 * Firebase Admin SDK: solo corre en el servidor (rutas de API de Next.js).
 * Tiene permisos totales, por eso nunca se importa desde el cliente.
 *
 * - Con emuladores basta el projectId (las variables FIREBASE_*_EMULATOR_HOST
 *   hacen que el SDK hable con ellos).
 * - En producción usa la cuenta de servicio guardada en FIREBASE_SERVICE_ACCOUNT_BASE64.
 */
function createAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccount) {
    const json = JSON.parse(Buffer.from(serviceAccount, "base64").toString("utf8")) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: json.project_id,
        clientEmail: json.client_email,
        privateKey: json.private_key,
      }),
    });
  }

  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error(
      "Falta FIREBASE_SERVICE_ACCOUNT_BASE64. Sin cuenta de servicio el Admin SDK solo funciona con emuladores."
    );
  }
  return initializeApp({ projectId });
}

const adminApp = createAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminAppCheck = getAppCheck(adminApp);
