import type { Metadata } from "next";
import { emptyVenue, VenueAdminForm } from "../venue-admin-form";

export const metadata: Metadata = { title: "Nuevo local" };

export default function NewVenuePage() {
  return (
    <main className="grid gap-4">
      <h1 className="text-3xl">Nuevo local</h1>
      <VenueAdminForm mode="create" initial={emptyVenue} />
    </main>
  );
}
