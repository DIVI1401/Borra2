"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeToProfile } from "@/services/user-service";
import type { AuthClaims, Role, UserProfile } from "@/types/user";

interface AuthState {
  /** true mientras Firebase decide si hay sesión (evita parpadeos y redirecciones falsas). */
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  claims: AuthClaims;
  isVerified: boolean;
  /** Vuelve a leer el token (ej. después de verificar el correo o de que un admin cambie el rol). */
  refreshClaims: () => Promise<void>;
}

const defaultClaims: AuthClaims = { role: "user", venueId: null };
const AuthContext = createContext<AuthState | null>(null);

async function readClaims(user: User, force = false): Promise<AuthClaims> {
  const result = await user.getIdTokenResult(force);
  const role = (result.claims.role as Role | undefined) ?? "user";
  const venueId = (result.claims.venueId as string | undefined) ?? null;
  return { role, venueId };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<AuthClaims>(defaultClaims);
  const [isVerified, setIsVerified] = useState(false);

  // onIdTokenChanged también avisa cuando el token se renueva (claims nuevos).
  useEffect(() => {
    return onIdTokenChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        setClaims(await readClaims(next));
        setIsVerified(next.emailVerified);
      } else {
        setClaims(defaultClaims);
        setIsVerified(false);
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeToProfile(user.uid, setProfile);
  }, [user]);

  const refreshClaims = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;
    await current.reload();
    setClaims(await readClaims(current, true));
    setIsVerified(current.emailVerified);
    setUser(auth.currentUser);
  }, []);

  const value = useMemo(
    () => ({ loading, user, profile, claims, isVerified, refreshClaims }),
    [loading, user, profile, claims, isVerified, refreshClaims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
