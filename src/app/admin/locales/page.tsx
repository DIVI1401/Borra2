import type { Metadata } from "next";
import { VenuesAdmin } from "./venues-admin";

export const metadata: Metadata = { title: "Locales" };

export default function VenuesAdminPage() {
  return <VenuesAdmin />;
}
