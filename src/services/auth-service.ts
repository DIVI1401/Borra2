"use client";

import {
  applyActionCode,
  browserLocalPersistence,
  browserSessionPersistence,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
  type ActionCodeSettings,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { publicEnv } from "@/lib/env";
import { AppError } from "@/lib/firebase/errors";
import { apiFetch } from "@/lib/api-client";
import { ensureUserProfile } from "@/services/user-service";

/** Los enlaces de los correos llevan a nuestra página /auth/accion (en español). */
function actionSettings(continuePath = "/"): ActionCodeSettings {
  return { url: `${publicEnv.NEXT_PUBLIC_APP_URL}${continuePath}`, handleCodeInApp: false };
}

function requireUser(): User {
  const user = auth.currentUser;
  if (!user) throw new AppError("Inicia sesión para continuar.", "auth/no-user");
  return user;
}

export function hasPasswordProvider(user: User): boolean {
  return user.providerData.some((p) => p.providerId === "password");
}

export async function signUp(displayName: string, email: string, password: string) {
  await setPersistence(auth, browserLocalPersistence);
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await ensureUserProfile(user, displayName);
  await sendEmailVerification(user, actionSettings("/"));
  return user;
}

/** "Recordarme": local = la sesión sobrevive al cerrar el navegador; session = se borra al cerrarlo. */
export async function signIn(email: string, password: string, remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(user);
  return user;
}

export async function signInWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  await ensureUserProfile(user);
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resendVerificationEmail() {
  await sendEmailVerification(requireUser(), actionSettings("/"));
}

/** Recarga el usuario para saber si ya verificó el correo (y renueva el token con el claim email_verified). */
export async function refreshVerificationStatus(): Promise<boolean> {
  const user = requireUser();
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email, actionSettings("/entrar"));
}

// ---- Acciones que llegan por correo (/auth/accion) ----

export async function verifyEmailWithCode(code: string) {
  await applyActionCode(auth, code);
  if (auth.currentUser) {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
  }
}

export async function getResetEmail(code: string): Promise<string> {
  return verifyPasswordResetCode(auth, code);
}

export async function resetPassword(code: string, newPassword: string) {
  await confirmPasswordReset(auth, code, newPassword);
}

/** Deshace un cambio de correo (enlace "recoverEmail" que llega al correo anterior). */
export async function recoverEmail(code: string): Promise<string> {
  const info = await checkActionCode(auth, code);
  await applyActionCode(auth, code);
  return info.data.email ?? "";
}

// ---- Cambios sensibles: piden confirmar identidad otra vez ----

export async function reauthenticate(currentPassword?: string) {
  const user = requireUser();
  if (hasPasswordProvider(user)) {
    if (!currentPassword) throw new AppError("Escribe tu contraseña actual.", "auth/missing-password");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", currentPassword));
  } else {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await reauthenticate(currentPassword);
  await updatePassword(requireUser(), newPassword);
}

/** Envía un enlace al correo nuevo; el cambio se aplica cuando la persona lo abre. */
export async function changeEmail(newEmail: string, currentPassword?: string) {
  await reauthenticate(currentPassword);
  await verifyBeforeUpdateEmail(requireUser(), newEmail, actionSettings("/perfil"));
}

/** Borra los datos en el servidor (con Admin SDK) y luego la cuenta. */
export async function deleteAccount(currentPassword?: string) {
  await reauthenticate(currentPassword);
  await apiFetch<{ ok: true }>("/api/cuenta/eliminar", {}, { forceRefresh: true });
  await firebaseSignOut(auth);
}
