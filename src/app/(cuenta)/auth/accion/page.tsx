import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { EmailActionHandler } from "./email-action-handler";

export const metadata: Metadata = {
  title: "Confirmación de cuenta",
  robots: { index: false },
};

/**
 * Página a la que llevan los enlaces de los correos de Firebase
 * (verificar correo, cambiar contraseña, confirmar o deshacer cambio de correo).
 * En la consola de Firebase se configura como "URL de acción" personalizada.
 */
export default function EmailActionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EmailActionHandler />
    </Suspense>
  );
}
