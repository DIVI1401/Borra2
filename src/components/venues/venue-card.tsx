import { GiftIcon, HeartIcon, StarIcon } from "lucide-react";
import { LEVEL_BG_CLASS, LEVEL_ICON, LEVEL_TEXT_CLASS, LevelBadge } from "@/components/venues/level-badge";
import { formatCOP, formatDistance, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VENUE_TYPE_LABELS, type Level, type VenueWithId } from "@/types/venue";

interface VenueCardProps {
  venue: VenueWithId;
  level: Level;
  nowMs: number;
  open: boolean;
  promo?: string | null;
  distance?: number | null;
  favorite?: boolean;
  selected?: boolean;
  onSelect: () => void;
}

/** Tarjeta de la lista del mapa. Es un botón: se puede usar con teclado. */
export function VenueCard({ venue, level, nowMs, open, promo, distance, favorite, selected, onSelect }: VenueCardProps) {
  const Icon = LEVEL_ICON[level];
  const updated = venue.live?.updatedAt ? venue.live.updatedAt.toMillis() : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "border-gold bg-accent/60"
      )}
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", LEVEL_BG_CLASS[level], LEVEL_TEXT_CLASS[level])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">{venue.name}</span>
          {favorite ? <HeartIcon className="size-3.5 shrink-0 fill-wine text-wine" aria-label="Favorito" /> : null}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {VENUE_TYPE_LABELS[venue.type]} · {venue.genres.join(", ")} · Cover {formatCOP(venue.coverPrice)}
          {venue.rating.count ? (
            <>
              {" "}· <StarIcon className="inline size-3 -translate-y-px fill-gold text-gold" aria-hidden="true" />{" "}
              <span className="sr-only">Calificación</span>
              {venue.rating.avg.toFixed(1).replace(".", ",")}
            </>
          ) : null}
          {distance != null ? ` · ${formatDistance(distance)}` : ""}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          <LevelBadge level={level} queue={venue.live?.queue} className="text-xs [&_svg]:hidden" />
          <span className="text-muted-foreground">{level ? timeAgo(updated, nowMs) : open ? "Abierto" : "Cerrado ahora"}</span>
        </span>
        {promo ? (
          <span className="mt-1 flex items-center gap-1 truncate text-xs text-gold">
            <GiftIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{promo}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
