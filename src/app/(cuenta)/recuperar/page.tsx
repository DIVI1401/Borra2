import type { Metadata } from "next";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Te enviamos un enlace para crear una contraseña nueva.",
};

export default function ResetRequestPage() {
  return <ResetRequestForm />;
}
