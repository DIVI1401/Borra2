"use client";

import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ListStatesProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  children: ReactNode;
}

/** Estados comunes de las listas del admin: cargando, error, vacía y "cargar más". */
export function ListStates(props: ListStatesProps) {
  if (props.loading) {
    return (
      <div className="grid gap-2" role="status" aria-label="Cargando">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }
  if (props.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No pudimos cargar la lista</AlertTitle>
        <AlertDescription>
          {props.error}
          <Button size="sm" variant="outline" className="mt-2" onClick={props.onRetry}>
            Intentar de nuevo
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (props.empty) return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{props.emptyText}</p>;
  return (
    <div className="grid gap-3">
      {props.children}
      {props.hasMore ? (
        <Button variant="outline" onClick={props.onLoadMore} disabled={props.loadingMore} className="justify-self-center">
          {props.loadingMore ? "Cargando…" : "Cargar más"}
        </Button>
      ) : null}
    </div>
  );
}
