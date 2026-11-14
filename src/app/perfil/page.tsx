import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileView />
    </AuthGuard>
  );
}
