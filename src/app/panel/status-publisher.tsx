"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVEL_BG_CLASS, LEVEL_ICON, LEVEL_TEXT_CLASS } from "@/components/venues/level-badge";
import { publishVenueStatus } from "@/services/venue-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS } from "@/types/venue";

/** Un toque y el mapa se actualiza para todos: el reporte del local pesa más que el de un usuario. */
export function StatusPublisher({ venueId }: { venueId: string }) {
  const [queue, setQueue] = useState(false);
  const [nowPlaying, setNowPlaying] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  async function publish(level: 1 | 2 | 3) {
    setBusy(level);
    try {
      await publishVenueStatus(venueId, { level, queue, nowPlaying: nowPlaying.trim() || null });
      toast.success(`Listo: tu local aparece como "${LEVEL_LABELS[level]}".`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">¿Cómo está el local ahora?</h2>
        </CardTitle>
        <CardDescription>Actualízalo cada vez que cambie. Pasados 90 minutos sin reportes, el mapa muestra “Sin datos”.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="sonando">¿Qué está sonando? (opcional)</Label>
            <Input id="sonando" maxLength={40} placeholder="Reggaetón viejo, DJ invitado…" value={nowPlaying} onChange={(e) => setNowPlaying(e.target.value)} />
          </div>
          <label className="flex h-9 items-center gap-2 text-sm">
            <Checkbox checked={queue} onCheckedChange={(c) => setQueue(c === true)} aria-label="Hay fila en la puerta" />
            Hay fila en la puerta
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((n) => {
            const Icon = LEVEL_ICON[n];
            return (
              <Button
                key={n}
                variant="outline"
                className={cn("h-auto flex-col gap-1 py-4", LEVEL_BG_CLASS[n], LEVEL_TEXT_CLASS[n])}
                onClick={() => publish(n)}
                disabled={busy !== null}
              >
                <Icon className="size-6" aria-hidden="true" />
                {busy === n ? "Publicando…" : LEVEL_LABELS[n]}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
