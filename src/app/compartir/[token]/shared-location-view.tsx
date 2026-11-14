"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { NavigationIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { useNow } from "@/hooks/use-now";
import { subscribeToSharedLocation } from "@/services/social-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { timeAgo } from "@/lib/format";
import type { SharedLocation } from "@/types/venue";

const FriendMap = dynamic(() => import("./friend-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[55dvh] rounded-2xl" />,
});

export function SharedLocationView({ token }: { token: string }) {
  const [data, setData] = useState<SharedLocation | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(15_000);

  useEffect(
    () =>
      subscribeToSharedLocation(
        token,
        setData,
        (e) => setError(getErrorMessage(e))
      ),
    [token]
  );

  if (data === undefined && !error) return <PageSkeleton />;

  if (error || !data) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-3xl">Este enlace no existe</h1>
        <p className="text-muted-foreground">Puede que esté mal copiado. Pídele a tu amigo que te lo envíe de nuevo.</p>
        <Link href="/" className={buttonVariants()}>
          Abrir Borra2
        </Link>
      </main>
    );
  }

  const expired = data.expiresAt.toMillis() < now;
  const live = data.active && !expired;
  const lat = data.location.latitude;
  const lng = data.location.longitude;

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-6">
      <div>
        <h1 className="text-3xl">📍 {data.name}</h1>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {live
            ? `Compartiendo en vivo · última actualización ${timeAgo(data.updatedAt?.toMillis() ?? null, now)}`
            : "Ya no está compartiendo su ubicación. Esta fue la última posición conocida."}
        </p>
      </div>
      <FriendMap lat={lat} lng={lng} name={data.name} />
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ size: "lg" })}
      >
        <NavigationIcon aria-hidden="true" /> Cómo llegar
      </a>
    </main>
  );
}
