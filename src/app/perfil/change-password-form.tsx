"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { PasswordChecklist, PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/firebase/errors";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { changePassword } from "@/services/auth-service";

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await changePassword(values.currentPassword, values.password);
      reset();
      toast.success("Contraseña actualizada.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Contraseña</h2>
        </CardTitle>
        <CardDescription>Usa una contraseña que no uses en otros sitios.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField label="Contraseña actual" error={errors.currentPassword?.message}>
            {(field) => <PasswordInput {...field} autoComplete="current-password" {...register("currentPassword")} />}
          </FormField>
          <FormField label="Contraseña nueva" error={errors.password?.message}>
            {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("password")} />}
          </FormField>
          <PasswordChecklist value={password} />
          <FormField label="Confirma la contraseña nueva" error={errors.confirmPassword?.message}>
            {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("confirmPassword")} />}
          </FormField>
          <Button type="submit" className="justify-self-start" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
