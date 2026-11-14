"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { getDashboardCounts, setDemoMode } from "@/services/admin-service";
import { subscribeToSettings } from "@/services/social-service";
import { getErrorMessage } from "@/lib/firebase/errors";

export function AdminDashboard() {
  const [counts, setCounts] = useState<{ users: number; venues: number; pendingClaims: number } | null>(null);
  const [demo, setDemo] = useState<boolean | null>(null);

  useEffect(() => {
    getDashboardCounts().then(setCounts, (e: unknown) => toast.error(getErrorMessage(e)));
    return subscribeToSettings((s) => setDemo(s.demoMode));
  }, []);

  async function toggleDemo(next: boolean) {
    try {
      await setDemoMode(next);
      toast.success(next ? "Modo demo activado." : "Modo demo desactivado.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const stats = [
    { label: "Usuarios", value: counts?.users, href: "/admin/usuarios" },
    { label: "Locales", value: counts?.venues, href: "/admin/locales" },
    { label: "Solicitudes pendientes", value: counts?.pendingClaims, href: "/admin/solicitudes" },
  ];

  return (
    <main className="grid gap-6">
      <h1 className="text-4xl">Administración</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/60">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            {s.value === undefined ? <Skeleton className="mt-1 h-8 w-16" /> : <p className="font-heading text-4xl">{s.value}</p>}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">Modo demo</h2>
          </CardTitle>
          <CardDescription>
            Mientras alguien tenga el mapa abierto, el servidor simula reportes cada 5 minutos para que se vea con vida. Úsalo
            para presentaciones y apágalo cuando haya datos reales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demo === null ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={demo} onCheckedChange={(c) => toggleDemo(c === true)} aria-label="Modo demo activado" />
              {demo ? "Activado" : "Desactivado"}
            </label>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
