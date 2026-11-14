import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const heading = DM_Serif_Display({ variable: "--font-heading", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Borra2 · Tu noche, mejor dirigida", template: "%s · Borra2" },
  description:
    "Mira en vivo qué tan llenos están los bares y discotecas de la zona norte de Montería, cuánto cuesta entrar y qué música suena, antes de salir.",
  applicationName: "Borra2",
  keywords: ["Montería", "rumba", "bares", "discotecas", "vida nocturna", "zona norte"],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Borra2",
    title: "Borra2 · Tu noche, mejor dirigida",
    description: "Bares y discotecas de Montería en vivo: qué tan lleno está, cover y música.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#120b0b" },
    { media: "(prefers-color-scheme: light)", color: "#faf6ef" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${sans.variable} ${heading.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Saltar al contenido
        </a>
        <Providers>
          <SiteHeader />
          <div id="contenido" className="flex min-w-0 flex-1 flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
