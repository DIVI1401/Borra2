import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Entra a tu cuenta de Borra2.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
