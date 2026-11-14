import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = {
  title: "Mis favoritos",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <AuthGuard>
      <FavoritesList />
    </AuthGuard>
  );
}
