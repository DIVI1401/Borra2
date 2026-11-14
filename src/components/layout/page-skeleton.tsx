import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de carga genérico mientras se resuelve la sesión o los datos. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10" role="status" aria-label="Cargando">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/2" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
