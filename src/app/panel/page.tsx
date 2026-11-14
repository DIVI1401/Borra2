import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { VenuePanel } from "./venue-panel";

export const metadata: Metadata = {
  title: "Panel de mi local",
  robots: { index: false },
};

export default function PanelPage() {
  return (
    <AuthGuard roles={["venue"]}>
      <VenuePanel />
    </AuthGuard>
  );
}
