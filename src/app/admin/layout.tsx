import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Admin · Borra2" },
  robots: { index: false },
};

/**
 * La guarda y el menú leen la URL (usePathname): con rutas dinámicas como
 * /admin/locales/[id], Next.js exige que eso esté dentro de <Suspense>.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthGuard roles={["admin"]}>
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6">
          <AdminNav />
          {children}
        </div>
      </AuthGuard>
    </Suspense>
  );
}
