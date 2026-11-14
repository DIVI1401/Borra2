import { FirebaseError } from "firebase/app";

/**
 * Traducción centralizada de los códigos de error de Firebase al español.
 * Los mensajes hablan de lo que pasó y de qué hacer, sin culpar a la persona.
 */
const messages: Record<string, string> = {
  // Autenticación
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
  "auth/invalid-email": "Ese correo no es válido.",
  "auth/invalid-credential": "El correo o la contraseña no coinciden.",
  "auth/wrong-password": "El correo o la contraseña no coinciden.",
  "auth/user-not-found": "El correo o la contraseña no coinciden.",
  "auth/user-disabled": "Esta cuenta está desactivada. Escríbenos si crees que es un error.",
  "auth/weak-password": "La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas, números y un símbolo.",
  "auth/password-does-not-meet-requirements": "La contraseña no cumple los requisitos de seguridad.",
  "auth/too-many-requests": "Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  "auth/network-request-failed": "No hay conexión. Revisa tu internet e intenta de nuevo.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/cancelled-popup-request": "Ya hay una ventana de inicio de sesión abierta.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e intenta de nuevo.",
  "auth/account-exists-with-different-credential": "Ese correo ya está registrado con otro método. Entra con correo y contraseña.",
  "auth/requires-recent-login": "Por seguridad, vuelve a confirmar tu contraseña para hacer este cambio.",
  "auth/expired-action-code": "El enlace venció. Pide uno nuevo.",
  "auth/invalid-action-code": "El enlace no es válido o ya se usó. Pide uno nuevo.",
  "auth/missing-password": "Escribe tu contraseña.",
  "auth/email-change-needs-verification": "Revisa tu nuevo correo para confirmar el cambio.",
  "auth/operation-not-allowed": "Este método de inicio de sesión no está activado.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase.",
  "auth/user-token-expired": "Tu sesión venció. Inicia sesión de nuevo.",
  // Firestore
  "permission-denied": "No tienes permiso para hacer esto.",
  "unavailable": "El servicio no está disponible en este momento. Intenta de nuevo en un rato.",
  "not-found": "No encontramos lo que buscas.",
  "already-exists": "Eso ya existe.",
  "resource-exhausted": "Se alcanzó un límite de uso. Intenta más tarde.",
  "unauthenticated": "Inicia sesión para continuar.",
  "deadline-exceeded": "La operación tardó demasiado. Intenta de nuevo.",
};

/** Error con mensaje ya listo para mostrar (lo lanzan nuestros servicios y la API). */
export class AppError extends Error {
  constructor(message: string, public readonly code = "app/error") {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? "Algo falló. Intenta de nuevo.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Algo falló. Intenta de nuevo.";
}

export function getErrorCode(error: unknown): string | null {
  if (error instanceof FirebaseError || error instanceof AppError) return error.code;
  return null;
}
