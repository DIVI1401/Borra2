"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { GuestOnly } from "@/components/auth/auth-guard";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInInput } from "@/schemas/auth";
import { signIn } from "@/services/auth-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { safeNextPath } from "@/lib/utils";

export function SignInForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: SignInInput) {
    try {
      const data = signInSchema.parse(values);
      const user = await signIn(data.email, data.password, data.remember);
      toast.success("Ya iniciaste sesión.");
      router.replace(user.emailVerified ? next : "/verificar-correo");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <GuestOnly redirectTo={next}>
      <AuthCard
        title="Inicia sesión"
        description="Mira cómo está la noche y cuéntale a los demás."
        footer={
          <p>
            ¿Primera vez en Borra2?{" "}
            <Link href="/registro" className="font-medium text-foreground underline underline-offset-4">
              Crea tu cuenta
            </Link>
          </p>
        }
      >
        <div className="grid gap-4">
          <GoogleButton onSuccess={() => router.replace(next)} />
          <OrDivider />
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField label="Correo" error={errors.email?.message}>
              {(field) => (
                <Input {...field} type="email" autoComplete="email" placeholder="sami@correo.com" {...register("email")} />
              )}
            </FormField>
            <FormField label="Contraseña" error={errors.password?.message}>
              {(field) => <PasswordInput {...field} autoComplete="current-password" {...register("password")} />}
            </FormField>

            <div className="flex items-center justify-between gap-2">
              <Controller
                control={control}
                name="remember"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-label="Recordarme"
                    />
                    Recordarme
                  </label>
                )}
              />
              <Link href="/recuperar" className="text-sm underline underline-offset-4">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
      </AuthCard>
    </GuestOnly>
  );
}
