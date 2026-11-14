import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { EditVenue } from "./edit-venue";

export const metadata: Metadata = { title: "Editar local" };

async function Content({ params }: { params: PageProps<"/admin/locales/[id]">["params"] }) {
  const { id } = await params;
  return <EditVenue venueId={id} />;
}

export default function EditVenuePage({ params }: PageProps<"/admin/locales/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
