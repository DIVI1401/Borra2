"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { Level, VenueWithId } from "@/types/venue";
import type { Position } from "@/hooks/use-geolocation";

export const ZONE_CENTER: [number, number] = [8.7825, -75.8695];

const EMOJI: Record<Level, string> = { 0: "?", 1: "🍸", 2: "🎶", 3: "🔥" };

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function venueIcon(name: string, level: Level, selected: boolean) {
  return L.divIcon({
    className: "b2-pin-wrap",
    iconSize: [0, 0],
    html: `<div class="b2-pin b2-l${level}${selected ? " b2-sel" : ""}" aria-hidden="true">${EMOJI[level]}</div><div class="b2-pin-name">${escapeHtml(name)}</div>`,
  });
}

const meIcon = L.divIcon({ className: "b2-pin-wrap", iconSize: [0, 0], html: '<div class="b2-me" aria-hidden="true"></div>' });

/** Mueve la cámara cuando cambia el local seleccionado o la ubicación propia. */
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [map, target]);
  return null;
}

export interface MapVenue {
  venue: VenueWithId;
  level: Level;
}

interface VenueMapProps {
  venues: MapVenue[];
  selectedId: string | null;
  me: Position | null;
  onSelect: (id: string) => void;
  className?: string;
}

/** Mapa de OpenStreetMap con los locales como pines de colores según el semáforo. */
export default function VenueMap({ venues, selectedId, me, onSelect, className }: VenueMapProps) {
  const selected = venues.find((v) => v.venue.id === selectedId)?.venue;
  const target = useMemo<[number, number] | null>(
    () => (selected ? [selected.location.latitude, selected.location.longitude] : me ? [me.lat, me.lng] : null),
    [selected, me]
  );

  return (
    <MapContainer center={ZONE_CENTER} zoom={15} className={className} zoomControl attributionControl scrollWheelZoom>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      {venues.map(({ venue, level }) => (
        <Marker
          key={venue.id}
          position={[venue.location.latitude, venue.location.longitude]}
          icon={venueIcon(venue.name, level, venue.id === selectedId)}
          title={venue.name}
          alt={venue.name}
          keyboard
          zIndexOffset={venue.id === selectedId ? 1000 : level * 100}
          eventHandlers={{ click: () => onSelect(venue.id) }}
        />
      ))}
      {me ? <Marker position={[me.lat, me.lng]} icon={meIcon} title="Tu ubicación" alt="Tu ubicación" zIndexOffset={2000} /> : null}
      <FlyTo target={target} />
    </MapContainer>
  );
}
