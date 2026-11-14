"use client";

import { GENRES } from "@/types/venue";
import { cn } from "@/lib/utils";

export interface Filters {
  genre: string | null;
  lively: boolean;
  openNow: boolean;
  cover: "all" | "free" | "cheap";
  favorites: boolean;
}

export const defaultFilters: Filters = { genre: null, lively: false, openNow: false, cover: "all", favorites: false };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-gold bg-wine text-[#f5ead8]" : "bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function VenueFilters({
  value,
  onChange,
  showFavorites,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  showFavorites: boolean;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  return (
    <div role="group" aria-label="Filtros" className="flex w-full max-w-full min-w-0 gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
      <Chip active={value.lively} onClick={() => set({ lively: !value.lively })}>
        🔥 Con ambiente
      </Chip>
      <Chip active={value.openNow} onClick={() => set({ openNow: !value.openNow })}>
        Abierto ahora
      </Chip>
      <Chip active={value.cover === "free"} onClick={() => set({ cover: value.cover === "free" ? "all" : "free" })}>
        Sin cover
      </Chip>
      <Chip active={value.cover === "cheap"} onClick={() => set({ cover: value.cover === "cheap" ? "all" : "cheap" })}>
        Cover ≤ $20 mil
      </Chip>
      {showFavorites ? (
        <Chip active={value.favorites} onClick={() => set({ favorites: !value.favorites })}>
          ♥ Favoritos
        </Chip>
      ) : null}
      <span className="mx-1 w-px shrink-0 bg-border" aria-hidden="true" />
      {GENRES.map((g) => (
        <Chip key={g} active={value.genre === g} onClick={() => set({ genre: value.genre === g ? null : g })}>
          {g}
        </Chip>
      ))}
    </div>
  );
}
