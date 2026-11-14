"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const icon = L.divIcon({ className: "b2-pin-wrap", iconSize: [0, 0], html: '<div class="b2-me" aria-hidden="true"></div>' });

function Follow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 17));
  }, [map, lat, lng]);
  return null;
}

/** Mapa con la ubicación de un amigo; se mueve solo cuando llega una posición nueva. */
export default function FriendMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={17} className="h-[55dvh] rounded-2xl border">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" maxZoom={19} />
      <Marker position={[lat, lng]} icon={icon} title={name} alt={`Ubicación de ${name}`} />
      <Follow lat={lat} lng={lng} />
    </MapContainer>
  );
}
