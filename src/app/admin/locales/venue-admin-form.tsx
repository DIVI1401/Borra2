"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GenresField, ScheduleField } from "@/components/venues/venue-fields";
import { saveVenue } from "@/services/admin-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { venueAdminSchema, type VenueAdminInput } from "@/schemas/venue";
import { VENUE_TYPE_LABELS, VENUE_TYPES } from "@/types/venue";

const selectClass = "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30";

export const emptyVenue: VenueAdminInput = {
  name: "",
  slug: "",
  type: "bar",
  address: "",
  location: { lat: 8.7825, lng: -75.8695 },
  verified: false,
  status: "active",
  coverPrice: 0,
  drinkPriceFrom: 0,
  genres: [],
  schedule: { lun: null, mar: null, mie: null, jue: null, vie: { open: "20:00", close: "02:00" }, sab: { open: "20:00", close: "02:00" }, dom: null },
  description: "",
  ambience: "",
  dressCode: "",
};

/** Crear o editar un local completo (solo admin). El identificador (slug) no se cambia después. */
export function VenueAdminForm({ mode, initial }: { mode: "create" | "update"; initial: VenueAdminInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VenueAdminInput>({ resolver: zodResolver(venueAdminSchema), defaultValues: initial });

  async function onSubmit(values: VenueAdminInput) {
    try {
      const { id } = await saveVenue(mode, values);
      toast.success(mode === "create" ? "Local creado." : "Local actualizado.");
      router.push(mode === "create" ? `/locales/${id}` : "/admin/locales");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre" error={errors.name?.message}>
              {(field) => <Input {...field} maxLength={60} {...register("name")} />}
            </FormField>
            <FormField
              label="Identificador (para el enlace)"
              error={errors.slug?.message}
              hint={mode === "create" ? "Ej. neon41 → borra2.app/locales/neon41. No se puede cambiar." : "No se puede cambiar."}
            >
              {(field) => <Input {...field} readOnly={mode === "update"} maxLength={40} {...register("slug")} />}
            </FormField>
            <FormField label="Tipo" error={errors.type?.message}>
              {(field) => (
                <select {...field} {...register("type")} className={selectClass}>
                  {VENUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {VENUE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label="Dirección" error={errors.address?.message}>
              {(field) => <Input {...field} maxLength={120} {...register("address")} />}
            </FormField>
            <FormField label="Latitud" error={errors.location?.lat?.message} hint="Clic derecho en Google Maps → copiar coordenadas.">
              {(field) => <Input {...field} type="number" step="0.0001" {...register("location.lat", { valueAsNumber: true })} />}
            </FormField>
            <FormField label="Longitud" error={errors.location?.lng?.message}>
              {(field) => <Input {...field} type="number" step="0.0001" {...register("location.lng", { valueAsNumber: true })} />}
            </FormField>
            <FormField label="Cover (COP)" error={errors.coverPrice?.message}>
              {(field) => <Input {...field} type="number" min={0} step={1000} {...register("coverPrice", { valueAsNumber: true })} />}
            </FormField>
            <FormField label="Trago desde (COP)" error={errors.drinkPriceFrom?.message}>
              {(field) => <Input {...field} type="number" min={0} step={500} {...register("drinkPriceFrom", { valueAsNumber: true })} />}
            </FormField>
          </div>

          <GenresField control={control} name="genres" error={errors.genres?.message} />
          <ScheduleField control={control} name="schedule" />

          <FormField label="Descripción" error={errors.description?.message}>
            {(field) => <Textarea {...field} rows={3} maxLength={400} {...register("description")} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Ambiente" error={errors.ambience?.message}>
              {(field) => <Input {...field} maxLength={120} {...register("ambience")} />}
            </FormField>
            <FormField label="Código de vestimenta" error={errors.dressCode?.message}>
              {(field) => <Input {...field} maxLength={60} {...register("dressCode")} />}
            </FormField>
          </div>

          <div className="flex flex-wrap gap-6">
            <Controller
              control={control}
              name="verified"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} aria-label="Aliado verificado" />
                  Aliado verificado
                </label>
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value === "active"}
                    onCheckedChange={(c) => field.onChange(c === true ? "active" : "hidden")}
                    aria-label="Visible en el mapa"
                  />
                  Visible en el mapa
                </label>
              )}
            />
          </div>

          <Button type="submit" size="lg" className="justify-self-start" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : mode === "create" ? "Crear local" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
