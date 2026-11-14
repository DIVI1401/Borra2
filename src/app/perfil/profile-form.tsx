"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/client";
import { getErrorMessage } from "@/lib/firebase/errors";
import { profileSchema, type ProfileInput } from "@/schemas/auth";
import { updateProfileData } from "@/services/user-service";

export function ProfileForm({ uid, currentName }: { uid: string; currentName: string }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { displayName: currentName } });

  useEffect(() => reset({ displayName: currentName }), [currentName, reset]);

  async function onSubmit(values: ProfileInput) {
    try {
      const { displayName } = profileSchema.parse(values);
      await updateProfileData(uid, { displayName });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName });
      toast.success("Nombre actualizado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Tus datos</h2>
        </CardTitle>
        <CardDescription>Así te ven los demás en las reseñas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end" noValidate>
          <FormField label="Nombre" error={errors.displayName?.message}>
            {(field) => <Input {...field} autoComplete="name" {...register("displayName")} />}
          </FormField>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
