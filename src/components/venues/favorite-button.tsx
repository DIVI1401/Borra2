"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { addFavorite, removeFavorite } from "@/services/social-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { cn } from "@/lib/utils";

export function FavoriteButton({ venueId, venueName }: { venueId: string; venueName: string }) {
  const { user, isVerified } = useAuth();
  const router = useRouter();
  const favorites = useFavorites();
  const [busy, setBusy] = useState(false);
  const active = favorites.has(venueId);

  async function toggle() {
    if (!user) return router.push(`/entrar?next=/locales/${venueId}`);
    if (!isVerified) return router.push("/verificar-correo");
    setBusy(true);
    try {
      if (active) {
        await removeFavorite(user.uid, venueId);
        toast.success("Quitado de favoritos.");
      } else {
        await addFavorite(user.uid, venueId, venueName);
        toast.success("Guardado en favoritos.");
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={toggle} disabled={busy} aria-pressed={active}>
      <HeartIcon className={cn(active && "fill-wine text-wine")} aria-hidden="true" />
      {active ? "En favoritos" : "Guardar"}
    </Button>
  );
}
