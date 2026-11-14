"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useZoneVenues } from "@/hooks/use-venues";
import { createVenueClaim, getMyClaims } from "@/services/social-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { venueClaimSchema, type VenueClaimInput } from "@/schemas/venue";
import type { VenueClaim } from "@/types/venue";

const STATUS: Record<VenueClaim["status"], { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En revisión", variant: "outline" },
  approved: { label: "Aprobada", variant: "secondary" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

export function ClaimForm() {
  const { user, claims } = useAuth();
  const preselected = useSearchParams().get("local") ?? "";
  const { data: venues } = useZoneVenues("norte");
  const [mine, setMine] = useState<(VenueClaim & { id: string })[]>([]);
  const [reload, setReload] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VenueClaimInput>({
    resolver: zodResolver(venueClaimSchema),
    defaultValues: { venueId: preselected, applicantName: "", phone: "", message: "" },
  });

  useEffect(() => {
    if (!user) return;
    getMyClaims(user.uid).then(setMine, () => setMine([]));
  }, [user, reload]);

  if (claims.role === "venue") {
    return (
      <main className="mx-auto grid w-full max-w-xl gap-4 px-4 py-10 text-center">
        <h1 className="text-3xl">Ya administras un local</h1>
        <Link href="/panel" className={buttonVariants({ size: "lg" })}>
          Ir al panel de mi local
        </Link>
      </main>
    );
  }

  const hasPending = mine.some((c) => c.status === "pending");

  async function onSubmit(values: VenueClaimInput) {
    if (!user) return;
    try {
      await createVenueClaim(user.uid, venueClaimSchema.parse(values));
      toast.success("Solicitud enviada. Te avisaremos cuando la revisemos.");
      reset({ venueId: "", applicantName: "", phone: "", message: "" });
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-4xl">Administra tu local en Borra2</h1>
        <p className="mt-2 text-muted-foreground">
          Con el acceso puedes publicar en un toque qué tan lleno está, subir promociones y mantener tus precios al día.
          Un administrador revisa cada solicitud.
        </p>
      </div>

      {mine.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl">Tus solicitudes</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {mine.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{venues.find((v) => v.id === c.venueId)?.name ?? c.venueId}</span>
                  <Badge variant={STATUS[c.status].variant}>{STATUS[c.status].label}</Badge>
                </li>
              ))}
            </ul>
            {mine.some((c) => c.status === "approved") ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Si ya te aprobaron, cierra sesión y vuelve a entrar para ver el panel de tu local.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {hasPending ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Ya tienes una solicitud en revisión. Espera la respuesta antes de enviar otra.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl">Nueva solicitud</h2>
            </CardTitle>
            <CardDescription>Usa datos reales: así podemos confirmar que trabajas en el local.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              <FormField label="Local" error={errors.venueId?.message}>
                {(field) => (
                  <select
                    {...field}
                    {...register("venueId")}
                    className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                  >
                    <option value="">Elige el local</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField label="Tu nombre completo" error={errors.applicantName?.message}>
                {(field) => <Input {...field} autoComplete="name" {...register("applicantName")} />}
              </FormField>
              <FormField label="Teléfono de contacto" error={errors.phone?.message} hint="Solo lo ve el equipo de Borra2.">
                {(field) => <Input {...field} type="tel" autoComplete="tel" placeholder="+57 300 123 4567" {...register("phone")} />}
              </FormField>
              <FormField label="¿Cuál es tu relación con el local?" error={errors.message?.message}>
                {(field) => (
                  <Textarea {...field} rows={3} maxLength={400} placeholder="Soy el administrador desde 2024…" {...register("message")} />
                )}
              </FormField>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Enviando…" : "Enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
