"use client";

import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getVenue } from "@/services/venue-service";
import type { VenueAdminInput } from "@/schemas/venue";
import { VenueAdminForm } from "../venue-admin-form";

export function EditVenue({ venueId }: { venueId: string }) {
  const [initial, setInitial] = useState<VenueAdminInput | null | undefined>(undefined);

  useEffect(() => {
    getVenue(venueId).then(
      (v) =>
        setInitial(
          v
            ? {
                name: v.name,
                slug: v.id,
                type: v.type,
                address: v.address,
                location: { lat: v.location.latitude, lng: v.location.longitude },
                verified: v.verified,
                status: v.status,
                coverPrice: v.coverPrice,
                drinkPriceFrom: v.drinkPriceFrom,
                genres: v.genres,
                schedule: v.schedule,
                description: v.description,
                ambience: v.ambience,
                dressCode: v.dressCode,
              }
            : null
        ),
      () => setInitial(null)
    );
  }, [venueId]);

  if (initial === undefined) return <PageSkeleton />;
  if (initial === null) return <p className="text-muted-foreground">Ese local no existe.</p>;

  return (
    <main className="grid gap-4">
      <h1 className="text-3xl">Editar {initial.name}</h1>
      <VenueAdminForm mode="update" initial={initial} />
    </main>
  );
}
