import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { SharedLocationView } from "./shared-location-view";

export const metadata: Metadata = {
  title: "Ubicación compartida",
  description: "Un amigo te compartió su ubicación en vivo desde Borra2.",
  robots: { index: false },
};

async function Content({ params }: { params: PageProps<"/compartir/[token]">["params"] }) {
  const { token } = await params;
  return <SharedLocationView token={token} />;
}

export default function SharedLocationPage({ params }: PageProps<"/compartir/[token]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
