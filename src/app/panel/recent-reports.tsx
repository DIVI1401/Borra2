"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/venues/level-badge";
import { useNow } from "@/hooks/use-now";
import { getRecentReports } from "@/services/panel-service";
import { timeAgo } from "@/lib/format";
import type { Report } from "@/types/venue";

const SOURCE: Record<Report["source"], string> = {
  user: "Usuario",
  venue: "Tu local",
  demo: "Simulado (demo)",
};

export function RecentReports({ venueId }: { venueId: string }) {
  const [reports, setReports] = useState<(Report & { id: string })[] | null>(null);
  const [reload, setReload] = useState(0);
  const now = useNow();

  useEffect(() => {
    let cancelled = false;
    getRecentReports(venueId).then(
      (r) => !cancelled && setReports(r),
      () => !cancelled && setReports([])
    );
    return () => {
      cancelled = true;
    };
  }, [venueId, reload]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Lo que reporta la gente</h2>
        </CardTitle>
        <CardDescription>“En el sitio” significa que el GPS confirmó que estaban en tu local. Los nombres no se muestran.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {reports === null ? (
          <Skeleton className="h-24" />
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay reportes.</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5 last:border-0">
                <span className="text-muted-foreground">
                  {SOURCE[r.source]}
                  {r.source === "user" ? (r.onSite ? " · en el sitio" : " · fuera del sitio") : ""}
                </span>
                <span className="flex items-center gap-2">
                  <LevelBadge level={r.level} queue={r.queue} className="text-sm" />
                  <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt?.toMillis() ?? null, now)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setReload((n) => n + 1)}>
          <RefreshCwIcon aria-hidden="true" /> Actualizar
        </Button>
      </CardContent>
    </Card>
  );
}
