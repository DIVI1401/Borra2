"use client";

import { useEffect, useState } from "react";
import { getActivePromos } from "@/services/venue-service";

/**
 * Promoción más reciente de cada local, para mostrarla en la lista.
 * Se pide una vez por local (la zona tiene pocos) y no en cada actualización del semáforo.
 */
export function usePromoHeadlines(venueIds: string[]): Record<string, string> {
  const [headlines, setHeadlines] = useState<Record<string, string>>({});
  const key = [...venueIds].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    Promise.all(
      key.split(",").map(async (id) => {
        try {
          const promos = await getActivePromos(id);
          return [id, promos[0]?.title] as const;
        } catch {
          return [id, undefined] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      setHeadlines(Object.fromEntries(pairs.filter((p): p is readonly [string, string] => !!p[1])));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return headlines;
}
