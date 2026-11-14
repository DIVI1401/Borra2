import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Los buscadores indexan el mapa y las fichas; nunca las áreas privadas ni la API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/panel", "/perfil", "/favoritos", "/compartir/", "/auth/", "/verificar-correo"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
