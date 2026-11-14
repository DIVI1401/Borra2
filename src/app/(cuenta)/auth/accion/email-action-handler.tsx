"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/forms/form-field";
import { PasswordChecklist, PasswordInput } from "@/components/forms/password-input";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { newPasswordSchema, type NewPasswordInput } from "@/schemas/auth";
import { getResetEmail, recoverEmail, resetPassword, verifyEmailWithCode } from "@/services/auth-service";
import { getErrorMessage } from "@/lib/firebase/errors";

type Status = { kind: "loading" } | { kind: "done"; title: string; message: string } | { kind: "error"; message: string };

function ResultCard({ status }: { status: Exclude<Status, { kind: "loading" }> }) {
  const ok = status.kind === "done";
  return (
    <AuthCard title={ok ? status.title : "No pudimos completar la acción"}>
      <div className="grid gap-4">
        <Alert variant={ok ? "default" : "destructive"}>
          {ok ? <CheckCircle2Icon aria-hidden="true" /> : <TriangleAlertIcon aria-hidden="true" />}
          <AlertTitle>{ok ? "Listo" : "El enlace no funcionó"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
        <Link href={ok ? "/" : "/entrar"} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {ok ? "Ir a Borra2" : "Volver a iniciar sesión"}
        </Link>
      </div>
    </AuthCard>
  );
}

function ResetPasswordForm({ code }: { code: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    getResetEmail(code).then(setEmail, (e: unknown) => setError(getErrorMessage(e)));
  }, [code]);

  if (error) return <ResultCard status={{ kind: "error", message: error }} />;
  if (!email) return <PageSkeleton />;

  async function onSubmit(values: NewPasswordInput) {
    try {
      await resetPassword(code, values.password);
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.replace("/entrar");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AuthCard title="Crea una contraseña nueva" description={`Para la cuenta ${email}.`}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField label="Contraseña nueva" error={errors.password?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("password")} />}
        </FormField>
        <PasswordChecklist value={password} />
        <FormField label="Confirma la contraseña" error={errors.confirmPassword?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" {...register("confirmPassword")} />}
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </AuthCard>
  );
}

export function EmailActionHandler() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const { refreshClaims } = useAuth();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const ran = useRef(false);

  useEffect(() => {
    // Los códigos son de un solo uso: evitamos aplicarlo dos veces (modo estricto de React).
    if (ran.current || mode === "resetPassword") return;
    ran.current = true;

    async function run() {
      if (!code) throw new Error("Al enlace le falta información. Pide uno nuevo.");
      switch (mode) {
        case "verifyEmail":
          await verifyEmailWithCode(code);
          await refreshClaims();
          return { title: "Correo verificado", message: "Tu cuenta ya está activa. ¡A disfrutar la noche!" };
        case "verifyAndChangeEmail":
          await verifyEmailWithCode(code);
          return { title: "Correo actualizado", message: "Tu cuenta ahora usa el correo nuevo. Inicia sesión con él." };
        case "recoverEmail": {
          const restored = await recoverEmail(code);
          return {
            title: "Cambio deshecho",
            message: `Tu cuenta volvió a usar ${restored}. Si no pediste el cambio, cambia tu contraseña ya.`,
          };
        }
        default:
          throw new Error("Este enlace no es válido.");
      }
    }

    run().then(
      (result) => setStatus({ kind: "done", ...result }),
      (e: unknown) => setStatus({ kind: "error", message: getErrorMessage(e) })
    );
  }, [mode, code, refreshClaims]);

  if (mode === "resetPassword") return <ResetPasswordForm code={code} />;
  if (status.kind === "loading") return <PageSkeleton />;
  return <ResultCard status={status} />;
}
