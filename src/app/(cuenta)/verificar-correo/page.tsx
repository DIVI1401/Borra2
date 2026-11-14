import type { Metadata } from "next";
import { VerifyEmailPanel } from "./verify-email-panel";

export const metadata: Metadata = {
  title: "Verifica tu correo",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return <VerifyEmailPanel />;
}
