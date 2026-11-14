"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CrosshairIcon, NavigationIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LevelBadge } from "@/components/venues/level-badge";
import { VenueCard } from "@/components/venues/venue-card";
import { defaultFilters, VenueFilters, type Filters } from "@/components/map/venue-filters";
import { ShareLocationButton } from "@/components/safety/share-location-dialog";
import { SosButton } from "@/components/safety/sos-dialog";
import { DemoBanner } from "@/components/map/demo-banner";
import { useNow } from "@/hooks/use-now";
import { useZoneVenues, visibleLevel } from "@/hooks/use-venues";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useFavorites } from "@/hooks/use-favorites";
import { usePromoHeadlines } from "@/hooks/use-promo-headlines";
import { formatCOP, isOpenNow } from "@/lib/format";
import { distanceMeters } from "@/lib/live";
import { LEVEL_LABELS } from "@/types/venue";

// Leaflet usa `window`, así que el mapa solo se carga en el navegador (carga diferida).
const VenueMap = dynamic(() => import("@/components/map/venue-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

// Clases completas (Tailwind solo genera las que aparecen escritas tal cual).
const DOT_CLASS = { 0: "bg-level-0", 1: "bg-level-1", 2: "bg-level-2", 3: "bg-level-3" } as const;

function Legend() {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-[400] max-w-[calc(100%-4.5rem)] flex flex-wrap gap-x-3 gap-y-1 rounded-xl border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
      {([1, 2, 3, 0] as const).map((l) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${DOT_CLASS[l]}`} aria-hidden="true" />
          {LEVEL_LABELS[l]}
        </span>
      ))}
    </div>
  );
}

export function MapView() {
  const { user } = useAuth();
  const { data: venues, loading, error } = useZoneVenues("norte");
  const now = useNow();
  const favorites = useFavorites();
  const promos = usePromoHeadlines(venues.map((v) => v.id));
  const { position, locate, loading: locating } = useGeolocation();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enriched = useMemo(
    () =>
      venues.map((venue) => ({
        venue,
        level: visibleLevel(venue, now),
        open: isOpenNow(venue.schedule, new Date(now)),
        distance: position
          ? distanceMeters(position, { lat: venue.location.latitude, lng: venue.location.longitude })
          : null,
      })),
    [venues, now, position]
  );

  const visible = useMemo(() => {
    const list = enriched.filter(({ venue, level, open }) => {
      if (filters.genre && !venue.genres.includes(filters.genre as never)) return false;
      if (filters.lively && level < 2) return false;
      if (filters.openNow && !open) return false;
      if (filters.cover === "free" && venue.coverPrice > 0) return false;
      if (filters.cover === "cheap" && venue.coverPrice > 20000) return false;
      if (filters.favorites && !favorites.has(venue.id)) return false;
      return true;
    });
    return list.sort((a, b) =>
      a.distance !== null && b.distance !== null ? a.distance - b.distance : b.level - a.level || a.venue.name.localeCompare(b.venue.name)
    );
  }, [enriched, filters, favorites]);

  const selected = enriched.find((e) => e.venue.id === selectedId) ?? null;
  const lively = enriched.filter((e) => e.level >= 2).length;

  async function handleLocate() {
    const pos = await locate();
    if (!pos) {
      toast.error("No pudimos acceder a tu ubicación. Revisa los permisos del navegador.");
      return;
    }
    toast.success("Ordenamos los sitios por cercanía.");
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <DemoBanner />
      <VenueFilters value={filters} onChange={setFilters} showFavorites={!!user} />

      <div className="grid min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(300px,50dvh)_1fr] lg:grid-cols-[400px_minmax(0,1fr)] lg:grid-rows-1">
        {/* Mapa (arriba en celular, a la derecha en escritorio) */}
        <section aria-label="Mapa de bares y discotecas" className="relative lg:order-2 lg:h-[calc(100dvh-7rem)]">
          <VenueMap
            venues={visible.map(({ venue, level }) => ({ venue, level }))}
            selectedId={selectedId}
            me={position}
            onSelect={setSelectedId}
            className="size-full"
          />
          <Legend />

          <div className="absolute right-3 bottom-3 z-[400] flex flex-col gap-2">
            <Button size="icon-lg" variant="secondary" className="rounded-full shadow-md" onClick={handleLocate} disabled={locating} aria-label="Ordenar por cercanía usando mi ubicación">
              <CrosshairIcon aria-hidden="true" />
            </Button>
            <ShareLocationButton />
            <SosButton />
          </div>

          {selected ? (
            <div className="absolute inset-x-3 bottom-3 z-[450] mr-14 rounded-xl border bg-popover p-3 shadow-lg sm:max-w-sm" role="region" aria-label={`Resumen de ${selected.venue.name}`}>
              <p className="font-heading text-xl leading-tight">{selected.venue.name}</p>
              <LevelBadge level={selected.level} queue={selected.venue.live?.queue} />
              <p className="text-sm text-muted-foreground">
                Cover {formatCOP(selected.venue.coverPrice)} · {selected.open ? "Abierto ahora" : "Cerrado ahora"}
              </p>
              <div className="mt-2 flex gap-2">
                <Link href={`/locales/${selected.venue.id}`} className={buttonVariants({ size: "sm" })}>
                  Ver ficha y reportar
                </Link>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.venue.location.latitude},${selected.venue.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <NavigationIcon aria-hidden="true" /> Cómo llegar
                </a>
                <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)} aria-label="Cerrar resumen">
                  ✕
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Lista */}
        <section aria-label="Lista de sitios" className="border-t lg:order-1 lg:h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:border-t-0 lg:border-r">
          <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
            <h1 className="text-2xl">Esta noche</h1>
            {!loading && !error ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {visible.length} de {enriched.length} sitios · {lively} con ambiente
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 px-4 pb-6">
            {loading ? (
              Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[84px] rounded-xl" />)
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>No pudimos cargar los sitios</AlertTitle>
                <AlertDescription>
                  {error}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => location.reload()}>
                    <RefreshCwIcon aria-hidden="true" /> Intentar de nuevo
                  </Button>
                </AlertDescription>
              </Alert>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">Ningún sitio coincide con esos filtros</p>
                <p className="mt-1 text-sm text-muted-foreground">Quita alguno para ver más opciones.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setFilters(defaultFilters)}>
                  Quitar filtros
                </Button>
              </div>
            ) : (
              visible.map(({ venue, level, open, distance }) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  level={level}
                  open={open}
                  nowMs={now}
                  promo={promos[venue.id]}
                  distance={distance}
                  favorite={favorites.has(venue.id)}
                  selected={venue.id === selectedId}
                  onSelect={() => setSelectedId(venue.id)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
