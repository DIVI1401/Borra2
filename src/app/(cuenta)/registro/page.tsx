import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en Borra2 para reportar cómo están los sitios, dejar reseñas y guardar tus favoritos.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
