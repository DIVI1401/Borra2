"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/firebase/errors";
import { changeEmailSchema, type ChangeEmailInput } from "@/schemas/auth";
import { changeEmail } from "@/services/auth-service";

export function ChangeEmailForm({ currentEmail, usesPassword }: { currentEmail: string; usesPassword: boolean }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", currentPassword: "" },
  });

  async function onSubmit(values: ChangeEmailInput) {
    const data = changeEmailSchema.parse(values);
    if (data.newEmail === currentEmail.toLowerCase()) {
      setError("newEmail", { message: "Ese ya es tu correo actual." });
      return;
    }
    if (usesPassword && !data.currentPassword) {
      setError("currentPassword", { message: "Escribe tu contraseña actual." });
      return;
    }
    try {
      await changeEmail(data.newEmail, data.currentPassword);
      reset();
      toast.success(`Te enviamos un enlace a ${data.newEmail}. El cambio se aplica cuando lo abras.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Correo</h2>
        </CardTitle>
        <CardDescription>
          Tu correo actual es <strong className="text-foreground">{currentEmail}</strong>. Para cambiarlo te enviamos un
          enlace al correo nuevo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField label="Correo nuevo" error={errors.newEmail?.message}>
            {(field) => <Input {...field} type="email" autoComplete="email" {...register("newEmail")} />}
          </FormField>
          {usesPassword ? (
            <FormField label="Contraseña actual" error={errors.currentPassword?.message} hint="Por seguridad, confirma que eres tú.">
              {(field) => <PasswordInput {...field} autoComplete="current-password" {...register("currentPassword")} />}
            </FormField>
          ) : (
            <p className="text-xs text-muted-foreground">Te pediremos confirmar con Google.</p>
          )}
          <Button type="submit" className="justify-self-start" disabled={isSubmitting}>
            {isSubmitting ? "Enviando enlace…" : "Cambiar correo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
