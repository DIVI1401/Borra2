"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DAY_LABELS, DAYS, GENRES, type DaySchedule, type Genre } from "@/types/venue";

/** Casillas de géneros musicales (máximo 4). Se usa en el panel del local y en el admin. */
export function GenresField<T extends FieldValues>({ control, name, error }: { control: Control<T>; name: Path<T>; error?: string }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">Géneros (máximo 4)</legend>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = (field.value ?? []) as Genre[];
          return (
            <div className="flex flex-wrap gap-3">
              {GENRES.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.includes(g)}
                    aria-label={g}
                    onCheckedChange={(c) => field.onChange(c === true ? [...value, g] : value.filter((x) => x !== g))}
                  />
                  {g}
                </label>
              ))}
            </div>
          );
        }}
      />
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Horario de la semana: cada día abre/cierra con su hora de apertura y cierre. */
export function ScheduleField<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">Horario</legend>
      {DAYS.map((d) => (
        <Controller
          key={d}
          control={control}
          name={`${name}.${d}` as Path<T>}
          render={({ field }) => {
            const value = field.value as DaySchedule;
            return (
              <div className="grid grid-cols-[7rem_1fr] items-center gap-2 sm:grid-cols-[7rem_auto_1fr_1fr]">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value !== null}
                    aria-label={`Abre el ${DAY_LABELS[d]}`}
                    onCheckedChange={(c) => field.onChange(c === true ? { open: "20:00", close: "02:00" } : null)}
                  />
                  {DAY_LABELS[d]}
                </label>
                {value ? (
                  <>
                    <span className="hidden text-xs text-muted-foreground sm:inline">de</span>
                    <Input
                      type="time"
                      aria-label={`Hora de apertura del ${DAY_LABELS[d]}`}
                      value={value.open}
                      onChange={(e) => field.onChange({ ...value, open: e.target.value })}
                    />
                    <Input
                      type="time"
                      aria-label={`Hora de cierre del ${DAY_LABELS[d]}`}
                      value={value.close}
                      onChange={(e) => field.onChange({ ...value, close: e.target.value })}
                    />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                )}
              </div>
            );
          }}
        />
      ))}
    </fieldset>
  );
}
