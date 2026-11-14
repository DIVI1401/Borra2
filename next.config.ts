import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Encabezados de seguridad para todas las páginas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // El navegador no "adivina" tipos de archivo (evita que un texto se ejecute como script).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nadie puede meter Borra2 dentro de un iframe (protege contra clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // No se envía la URL completa a otros sitios.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Solo Borra2 puede pedir la ubicación; cámara y micrófono desactivados.
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
          // Obliga a usar HTTPS durante 2 años (solo tiene efecto en producción con HTTPS).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  images: {
    // Fotos de los locales (Cloudinary, plan gratis).
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
};

export default nextConfig;
