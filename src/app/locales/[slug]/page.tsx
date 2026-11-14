import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getVenueSeo } from "@/lib/venue-seo";
import { seedVenues } from "../../../../scripts/seed-data";
import { VenueDetail } from "./venue-detail";

/** Se prerenderizan las fichas de los locales de ejemplo; las nuevas se generan al visitarlas. */
export function generateStaticParams() {
  return seedVenues.map((v) => ({ slug: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/locales/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return { title: "Local", description: "Bares y discotecas de la zona norte de Montería en vivo." };
  const description = `${venue.description} Mira en vivo qué tan lleno está, el cover y la música antes de salir.`;
  return {
    title: venue.name,
    description,
    openGraph: { title: `${venue.name} · Borra2`, description },
    alternates: { canonical: `/locales/${slug}` },
  };
}

async function Detail({ params }: { params: PageProps<"/locales/[slug]">["params"] }) {
  const { slug } = await params;
  return <VenueDetail venueId={slug} />;
}

export default function VenuePage({ params }: PageProps<"/locales/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}
