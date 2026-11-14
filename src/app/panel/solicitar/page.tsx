import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = {
  title: "Administrar un local",
  description: "Pide acceso para actualizar el estado, las promociones y los datos de tu local en Borra2.",
};

export default function ClaimPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<PageSkeleton />}>
        <ClaimForm />
      </Suspense>
    </AuthGuard>
  );
}
