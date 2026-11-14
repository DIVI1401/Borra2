import type { Metadata } from "next";
import { ClaimsAdmin } from "./claims-admin";

export const metadata: Metadata = { title: "Solicitudes" };

export default function ClaimsPage() {
  return <ClaimsAdmin />;
}
