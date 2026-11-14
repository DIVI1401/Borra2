"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateVenueShowcase } from "@/services/panel-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { venueEditableSchema, type VenueEditableInput } from "@/schemas/venue";
import { GenresField, ScheduleField } from "@/components/venues/venue-fields";
import type { VenueWithId } from "@/types/venue";

/** Datos de la vitrina que el dueño puede cambiar (precios, horario, géneros, descripción). */
export function ShowcaseForm({ venue }: { venue: VenueWithId }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<VenueEditableInput>({
    resolver: zodResolver(venueEditableSchema),
    defaultValues: {
      coverPrice: venue.coverPrice,
      drinkPriceFrom: venue.drinkPriceFrom,
      genres: venue.genres,
      schedule: venue.schedule,
      description: venue.description,
      ambience: venue.ambience,
      dressCode: venue.dressCode,
    },
  });

  async function onSubmit(values: VenueEditableInput) {
    try {
      const data = venueEditableSchema.parse(values);
      await updateVenueShowcase(venue.id, data);
      reset(data);
      toast.success("Datos del local actualizados.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Datos del local</h2>
        </CardTitle>
        <CardDescription>El nombre, la dirección y la verificación los cambia un administrador.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cover (COP, 0 = gratis)" error={errors.coverPrice?.message}>
              {(field) => <Input {...field} type="number" min={0} step={1000} inputMode="numeric" {...register("coverPrice", { valueAsNumber: true })} />}
            </FormField>
            <FormField label="Trago desde (COP)" error={errors.drinkPriceFrom?.message}>
              {(field) => <Input {...field} type="number" min={0} step={500} inputMode="numeric" {...register("drinkPriceFrom", { valueAsNumber: true })} />}
            </FormField>
          </div>

          <GenresField control={control} name="genres" error={errors.genres?.message} />
          <ScheduleField control={control} name="schedule" />

          <FormField label="Descripción" error={errors.description?.message}>
            {(field) => <Textarea {...field} rows={3} maxLength={400} {...register("description")} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Ambiente" error={errors.ambience?.message} hint="Ej. Joven, universitario">
              {(field) => <Input {...field} maxLength={120} {...register("ambience")} />}
            </FormField>
            <FormField label="Código de vestimenta" error={errors.dressCode?.message}>
              {(field) => <Input {...field} maxLength={60} {...register("dressCode")} />}
            </FormField>
          </div>

          <Button type="submit" className="justify-self-start" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
