"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPromo, deletePromo, setPromoActive, subscribeToAllPromos } from "@/services/panel-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { promoSchema, type PromoInput } from "@/schemas/venue";
import type { Promo } from "@/types/venue";

export function PromosManager({ venueId }: { venueId: string }) {
  const [promos, setPromos] = useState<(Promo & { id: string })[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PromoInput>({ resolver: zodResolver(promoSchema), defaultValues: { title: "", detail: "", active: true } });

  useEffect(() => subscribeToAllPromos(venueId, setPromos), [venueId]);

  async function onSubmit(values: PromoInput) {
    try {
      await createPromo(venueId, promoSchema.parse(values));
      reset();
      toast.success("Promoción publicada.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function run(action: () => Promise<void>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Promociones</h2>
        </CardTitle>
        <CardDescription>Las activas aparecen en tu ficha y en la lista del mapa.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {promos.length ? (
          <ul className="grid gap-2">
            {promos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  {p.detail ? <p className="truncate text-sm text-muted-foreground">{p.detail}</p> : null}
                </div>
                <Badge variant={p.active ? "secondary" : "outline"}>{p.active ? "Activa" : "Pausada"}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run(() => setPromoActive(venueId, p, !p.active), p.active ? "Promoción pausada." : "Promoción activada.")}
                >
                  {p.active ? "Pausar" : "Activar"}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Eliminar la promoción ${p.title}`}
                  onClick={() => {
                    if (confirm("¿Eliminar esta promoción?")) void run(() => deletePromo(venueId, p.id), "Promoción eliminada.");
                  }}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no tienes promociones. Crea la primera abajo.</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-xl bg-muted/50 p-3" noValidate>
          <FormField label="Título" error={errors.title?.message}>
            {(field) => <Input {...field} maxLength={80} placeholder="2x1 en cervezas hasta las 10 p. m." {...register("title")} />}
          </FormField>
          <FormField label="Detalle (opcional)" error={errors.detail?.message}>
            {(field) => <Input {...field} maxLength={160} placeholder="Solo cerveza nacional." {...register("detail")} />}
          </FormField>
          <Button type="submit" className="justify-self-start" disabled={isSubmitting}>
            {isSubmitting ? "Publicando…" : "Publicar promoción"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
