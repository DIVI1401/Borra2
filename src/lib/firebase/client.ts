"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { publicEnv, usingEmulators } from "@/lib/env";

/**
 * Inicializa Firebase una sola vez en el navegador.
 * Con NEXT_PUBLIC_USE_EMULATORS=true todo se conecta a los emuladores locales.
 */
const firebaseConfig = {
  apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | null = null;

function init() {
  if (getApps().length) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    return;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "es";
  db = getFirestore(app);

  if (usingEmulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8085);
  }

  // App Check: prueba que las peticiones vienen de nuestra app y no de un script.
  const siteKey = publicEnv.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey && typeof window !== "undefined") {
    if (process.env.NODE_ENV !== "production") {
      // En desarrollo imprime un token de depuración en la consola para registrarlo en Firebase.
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

init();

export { app, auth, db };

/** Token de App Check para enviarlo a nuestras rutas de API (null si no está configurado). */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null;
  try {
    const { token } = await getToken(appCheck, false);
    return token;
  } catch {
    return null;
  }
}
