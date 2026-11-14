"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueCard } from "@/components/venues/venue-card";
import { useFavorites } from "@/hooks/use-favorites";
import { useNow } from "@/hooks/use-now";
import { useZoneVenues, visibleLevel } from "@/hooks/use-venues";
import { isOpenNow } from "@/lib/format";

export function FavoritesList() {
  const router = useRouter();
  const favorites = useFavorites();
  const { data: venues, loading } = useZoneVenues("norte");
  const now = useNow();
  const list = venues.filter((v) => favorites.has(v.id));

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-8">
      <h1 className="text-4xl">Mis favoritos</h1>
      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-[84px] rounded-xl" />
          <Skeleton className="h-[84px] rounded-xl" />
        </div>
      ) : list.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
          <HeartIcon className="size-8 text-wine" aria-hidden="true" />
          <p className="font-medium">Guarda los sitios que más te gustan</p>
          <p className="text-sm text-muted-foreground">Toca “Guardar” en la ficha de un sitio y aparecerá aquí con su semáforo en vivo.</p>
          <Link href="/" className={buttonVariants()}>
            Explorar el mapa
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {list.map((v) => (
            <VenueCard
              key={v.id}
              venue={v}
              level={visibleLevel(v, now)}
              open={isOpenNow(v.schedule, new Date(now))}
              nowMs={now}
              favorite
              onSelect={() => router.push(`/locales/${v.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
