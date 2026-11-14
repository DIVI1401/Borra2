"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeToFavorites } from "@/services/social-service";

/** Ids de los locales favoritos de la persona (vacío si no ha iniciado sesión). */
export function useFavorites(): Set<string> {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    return subscribeToFavorites(user.uid, setIds);
  }, [user]);
  return user ? ids : new Set<string>();
}
