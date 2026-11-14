import { MapView } from "@/components/map/map-view";

/** Inicio: mapa en vivo de la zona norte (público, no requiere cuenta). */
export default function HomePage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <MapView />
    </main>
  );
}
