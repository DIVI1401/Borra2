"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import type { Role } from "@/types/user";

interface AuthGuardProps {
  children: ReactNode;
  /** Exige correo verificado (por defecto sí). */
  requireVerified?: boolean;
  /** Roles que pueden ver la página. */
  roles?: Role[];
}

/**
 * Protege páginas en el navegador según la sesión, la verificación y el rol.
 * Es solo para la experiencia: la seguridad real está en las Security Rules y en la API.
 */
export function AuthGuard({ children, requireVerified = true, roles }: AuthGuardProps) {
  const { loading, user, isVerified, claims } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    !!user && (!requireVerified || isVerified) && (!roles || roles.includes(claims.role));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/entrar?next=${encodeURIComponent(pathname)}`);
    } else if (requireVerified && !isVerified) {
      router.replace("/verificar-correo");
    } else if (roles && !roles.includes(claims.role)) {
      router.replace("/");
    }
  }, [loading, user, isVerified, claims.role, requireVerified, roles, router, pathname]);

  if (loading || !allowed) return <PageSkeleton />;
  return <>{children}</>;
}

/** Para /entrar y /registro: si ya hay sesión, manda a la app. */
export function GuestOnly({ children, redirectTo = "/" }: { children: ReactNode; redirectTo?: string }) {
  const { loading, user, isVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(isVerified ? redirectTo : "/verificar-correo");
  }, [loading, user, isVerified, redirectTo, router]);

  if (loading || user) return <PageSkeleton />;
  return <>{children}</>;
}
