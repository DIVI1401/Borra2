"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resetRequestSchema, type ResetRequestInput } from "@/schemas/auth";
import { requestPasswordReset } from "@/services/auth-service";
import { getErrorCode, getErrorMessage } from "@/lib/firebase/errors";

export function ResetRequestForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({ resolver: zodResolver(resetRequestSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ResetRequestInput) {
    const { email } = resetRequestSchema.parse(values);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (error) {
      // No revelamos si el correo existe o no (evita que alguien averigüe quién tiene cuenta).
      if (getErrorCode(error) === "auth/user-not-found") setSentTo(email);
      else toast.error(getErrorMessage(error));
    }
  }

  return (
    <AuthCard
      title="Recupera tu contraseña"
      description="Escribe el correo de tu cuenta y te enviamos un enlace para crear una nueva."
      footer={
        <Link href="/entrar" className="underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sentTo ? (
        <Alert>
          <MailCheckIcon aria-hidden="true" />
          <AlertTitle>Revisa tu correo</AlertTitle>
          <AlertDescription>
            Si {sentTo} tiene una cuenta, te llegará un enlace en unos minutos. Revisa también la carpeta de spam.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField label="Correo" error={errors.email?.message}>
            {(field) => (
              <Input {...field} type="email" autoComplete="email" placeholder="sami@correo.com" {...register("email")} />
            )}
          </FormField>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
