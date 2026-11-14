"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { GuestOnly } from "@/components/auth/auth-guard";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { FormField } from "@/components/forms/form-field";
import { PasswordChecklist, PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/schemas/auth";
import { signUp } from "@/services/auth-service";
import { getErrorMessage } from "@/lib/firebase/errors";

export function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
    mode: "onTouched",
  });


  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: SignUpInput) {
    try {
      const data = signUpSchema.parse(values);
      await signUp(data.displayName, data.email, data.password);
      toast.success("Cuenta creada. Te enviamos un correo para verificarla.");
      router.replace("/verificar-correo");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <GuestOnly>
      <AuthCard
        title="Crea tu cuenta"
        description="Para reportar cómo están los sitios, dejar reseñas y guardar tus favoritos."
        footer={
          <p>
            ¿Ya tienes cuenta?{" "}
            <Link href="/entrar" className="font-medium text-foreground underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        }
      >
        <div className="grid gap-4">
          <GoogleButton onSuccess={() => router.replace("/")} />
          <OrDivider />
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField label="Nombre" error={errors.displayName?.message}>
              {(field) => <Input {...field} autoComplete="name" placeholder="Sami Meza" {...register("displayName")} />}
            </FormField>
            <FormField label="Correo" error={errors.email?.message}>
              {(field) => (
                <Input {...field} type="email" autoComplete="email" placeholder="sami@correo.com" {...register("email")} />
              )}
            </FormField>
            <FormField label="Contraseña" error={errors.password?.message}>
              {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("password")} />}
            </FormField>
            <PasswordChecklist value={password} />
            <FormField label="Confirma la contraseña" error={errors.confirmPassword?.message}>
              {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("confirmPassword")} />}
            </FormField>

            <div className="grid gap-1.5">
              <Controller
                control={control}
                name="acceptTerms"
                render={({ field }) => (
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={!!errors.acceptTerms}
                      aria-label="Acepto los términos y la política de privacidad"
                      className="mt-0.5"
                    />
                    <span>
                      Acepto los{" "}
                      <Link href="/terminos" className="underline underline-offset-4" target="_blank">
                        términos
                      </Link>{" "}
                      y la{" "}
                      <Link href="/privacidad" className="underline underline-offset-4" target="_blank">
                        política de privacidad
                      </Link>
                      .
                    </span>
                  </label>
                )}
              />
              {errors.acceptTerms ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.acceptTerms.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creando tu cuenta…" : "Crear cuenta"}
            </Button>
          </form>
        </div>
      </AuthCard>
    </GuestOnly>
  );
}
