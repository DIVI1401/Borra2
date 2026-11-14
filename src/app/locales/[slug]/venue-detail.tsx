"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, BadgeCheckIcon, GiftIcon, MapPinIcon, MusicIcon, NavigationIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVEL_BG_CLASS, LevelBadge } from "@/components/venues/level-badge";
import { FavoriteButton } from "@/components/venues/favorite-button";
import { ReportPanel } from "@/components/venues/report-panel";
import { ReviewSection } from "@/components/venues/review-section";
import { useNow } from "@/hooks/use-now";
import { useVenue, visibleLevel } from "@/hooks/use-venues";
import { getActivePromos } from "@/services/venue-service";
import { formatCOP, isOpenNow, scheduleSummary, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DAY_LABELS, DAYS, VENUE_TYPE_LABELS, type Promo } from "@/types/venue";
import { formatHour } from "@/lib/format";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

export function VenueDetail({ venueId }: { venueId: string }) {
  const { data: venue, loading, error } = useVenue(venueId);
  const { claims } = useAuth();
  const now = useNow();
  const [promos, setPromos] = useState<(Promo & { id: string })[]>([]);

  useEffect(() => {
    getActivePromos(venueId).then(setPromos, () => setPromos([]));
  }, [venueId]);

  if (loading) return <PageSkeleton />;

  if (error || !venue) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-3xl">No encontramos este sitio</h1>
        <p className="text-muted-foreground">{error ?? "Puede que ya no esté en Borra2 o que el enlace esté mal escrito."}</p>
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Ver el mapa
        </Link>
      </main>
    );
  }

  const level = visibleLevel(venue, now);
  const open = isOpenNow(venue.schedule, new Date(now));
  const updated = venue.live?.updatedAt ? venue.live.updatedAt.toMillis() : null;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`;

  async function share() {
    const url = window.location.href;
    const text = `¿Caemos a ${venue!.name}? Míralo en vivo en Borra2`;
    try {
      if (navigator.share) await navigator.share({ title: venue!.name, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace copiado.");
      }
    } catch {
      // La persona canceló el menú de compartir.
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden="true" /> Volver al mapa
      </Link>

      <header className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-4xl leading-tight sm:text-5xl">{venue.name}</h1>
          {venue.verified ? (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheckIcon className="size-3.5 text-level-1" aria-hidden="true" /> Aliado verificado
            </Badge>
          ) : (
            <Badge variant="outline">Sin verificar</Badge>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <MapPinIcon className="size-4 shrink-0" aria-hidden="true" />
          {VENUE_TYPE_LABELS[venue.type]} · {venue.genres.join(", ")} · {venue.address}
        </p>
        <div className="flex flex-wrap gap-2">
          <FavoriteButton venueId={venue.id} venueName={venue.name} />
          <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            <NavigationIcon aria-hidden="true" /> Cómo llegar
          </a>
          <Button variant="outline" onClick={share}>
            <Share2Icon aria-hidden="true" /> Invitar al parche
          </Button>
        </div>
      </header>

      {/* Semáforo en vivo */}
      <section aria-live="polite" className={cn("rounded-2xl border p-4", LEVEL_BG_CLASS[level])}>
        <LevelBadge level={level} queue={venue.live?.queue} className="text-xl [&_svg]:size-6" />
        <p className="mt-1 text-sm text-muted-foreground">
          {level
            ? `Actualizado ${timeAgo(updated, now)}${venue.live.userReports1h ? ` · ${venue.live.userReports1h} reporte${venue.live.userReports1h > 1 ? "s" : ""} de usuarios en la última hora` : ""}`
            : "Nadie ha reportado en la última hora y media."}
        </p>
        {level && venue.live.nowPlaying ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            <MusicIcon className="size-4 text-gold" aria-hidden="true" /> Sonando ahora: {venue.live.nowPlaying}
          </p>
        ) : null}
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Cover">{formatCOP(venue.coverPrice)}</Fact>
        <Fact label="Trago desde">{formatCOP(venue.drinkPriceFrom)}</Fact>
        <Fact label="Ahora">{open ? <span className="text-level-1">Abierto</span> : "Cerrado"}</Fact>
        <Fact label="Vestimenta">{venue.dressCode || "Libre"}</Fact>
      </dl>

      <p className="leading-relaxed">{venue.description}</p>
      {venue.ambience ? <p className="text-sm text-muted-foreground">Ambiente: {venue.ambience}</p> : null}

      {promos.length ? (
        <section className="grid gap-2" aria-labelledby="promos-titulo">
          <h2 id="promos-titulo" className="flex items-center gap-2 text-2xl">
            <GiftIcon className="size-5 text-gold" aria-hidden="true" /> Promociones
          </h2>
          {promos.map((p) => (
            <div key={p.id} className="rounded-xl border border-gold/40 bg-wine/10 p-3">
              <p className="font-semibold">{p.title}</p>
              {p.detail ? <p className="text-sm text-muted-foreground">{p.detail}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      <ReportPanel venueId={venue.id} />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">Horario</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="sr-only">{scheduleSummary(venue.schedule)}</p>
          <ul className="grid gap-1 text-sm">
            {DAYS.map((d) => {
              const h = venue.schedule[d];
              return (
                <li key={d} className="flex justify-between border-b py-1 last:border-0">
                  <span>{DAY_LABELS[d]}</span>
                  <span className={h ? "" : "text-muted-foreground"}>{h ? `${formatHour(h.open)} – ${formatHour(h.close)}` : "Cerrado"}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <ReviewSection venueId={venue.id} rating={venue.rating} />

      {claims.role !== "venue" ? (
        <p className="text-center text-sm text-muted-foreground">
          ¿Administras este sitio?{" "}
          <Link href={`/panel/solicitar?local=${venue.id}`} className="underline underline-offset-4">
            Pide acceso para actualizarlo
          </Link>
        </p>
      ) : null}
    </main>
  );
}
