import type { MetadataRoute } from "next";
import { listPublicVenueIds } from "@/lib/venue-seo";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Mapa del sitio para buscadores: páginas públicas y la ficha de cada local activo. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const venues = await listPublicVenueIds();
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    ...venues.map((id) => ({ url: `${BASE}/locales/${id}`, changeFrequency: "hourly" as const, priority: 0.8 })),
    { url: `${BASE}/registro`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
