"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { LevelBadge } from "@/components/venues/level-badge";
import { useNow } from "@/hooks/use-now";
import { useVenue, visibleLevel } from "@/hooks/use-venues";
import { timeAgo } from "@/lib/format";
import { StatusPublisher } from "./status-publisher";
import { ShowcaseForm } from "./showcase-form";
import { PromosManager } from "./promos-manager";
import { PhotosManager } from "./photos-manager";
import { RecentReports } from "./recent-reports";

export function VenuePanel() {
  const { claims } = useAuth();
  const venueId = claims.venueId ?? "";
  const { data: venue, loading } = useVenue(venueId);
  const now = useNow();

  if (loading) return <PageSkeleton />;
  if (!venue) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-3xl">No encontramos tu local</h1>
        <p className="mt-2 text-muted-foreground">Puede que un administrador lo haya ocultado. Escríbenos si crees que es un error.</p>
      </main>
    );
  }

  const level = visibleLevel(venue, now);

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gold">Panel de mi local</p>
          <h1 className="text-4xl">{venue.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Así te ven ahora: <LevelBadge level={level} queue={venue.live?.queue} />
            {level ? `· ${timeAgo(venue.live.updatedAt?.toMillis() ?? null, now)}` : null}
          </p>
        </div>
        <Link href={`/locales/${venue.id}`} className={buttonVariants({ variant: "outline" })}>
          <ExternalLinkIcon aria-hidden="true" /> Ver mi ficha
        </Link>
      </div>

      <StatusPublisher venueId={venue.id} />
      <PromosManager venueId={venue.id} />
      <RecentReports venueId={venue.id} />
      <ShowcaseForm venue={venue} />
      <PhotosManager venue={venue} />
    </main>
  );
}
