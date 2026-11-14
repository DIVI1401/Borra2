"use client";

import { useEffect, useState } from "react";
import { subscribeToVenue, subscribeToZoneVenues } from "@/services/venue-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { isStale } from "@/lib/live";
import type { Level, VenueWithId } from "@/types/venue";

interface State<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/** Locales activos de la zona, en tiempo real. */
export function useZoneVenues(zone = "norte"): State<VenueWithId[]> {
  const [state, setState] = useState<State<VenueWithId[]>>({ data: [], loading: true, error: null });
  useEffect(
    () =>
      subscribeToZoneVenues(
        zone,
        (data) => setState({ data, loading: false, error: null }),
        (e) => setState({ data: [], loading: false, error: getErrorMessage(e) })
      ),
    [zone]
  );
  return state;
}

/** Un local en tiempo real (null si no existe o está oculto). */
export function useVenue(venueId: string): State<VenueWithId | null> {
  const [state, setState] = useState<State<VenueWithId | null>>({ data: null, loading: true, error: null });
  useEffect(
    () =>
      subscribeToVenue(
        venueId,
        (data) => setState({ data, loading: false, error: null }),
        (e) => setState({ data: null, loading: false, error: getErrorMessage(e) })
      ),
    [venueId]
  );
  return state;
}

/** Nivel visible del semáforo: si el último reporte es viejo, "sin datos" (0). */
export function visibleLevel(venue: VenueWithId, nowMs: number): Level {
  const updated = venue.live?.updatedAt ? venue.live.updatedAt.toMillis() : null;
  return isStale(updated, nowMs) ? 0 : venue.live.level;
}
