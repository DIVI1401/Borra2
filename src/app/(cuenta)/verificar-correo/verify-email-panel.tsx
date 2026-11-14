"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { useResendLimit } from "@/hooks/use-resend-limit";
import { refreshVerificationStatus, resendVerificationEmail, signOut } from "@/services/auth-service";
import { getErrorMessage } from "@/lib/firebase/errors";

function VerifyEmailContent() {
  const router = useRouter();
  const { user, isVerified, refreshClaims } = useAuth();
  const { canSend, secondsLeft, remaining, register } = useResendLimit(`b2-verify-${user?.uid ?? "anon"}`);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isVerified) router.replace("/");
  }, [isVerified, router]);

  const check = useCallback(
    async (silent: boolean) => {
      setChecking(true);
      try {
        const verified = await refreshVerificationStatus();
        if (verified) {
          await refreshClaims();
          toast.success("¡Correo verificado! Ya puedes usar todo Borra2.");
        } else if (!silent) {
          toast.info("Todavía no vemos la verificación. Abre el enlace del correo y vuelve aquí.");
        }
      } catch (error) {
        if (!silent) toast.error(getErrorMessage(error));
      } finally {
        setChecking(false);
      }
    },
    [refreshClaims]
  );

  // Cuando la persona vuelve a esta pestaña (después de abrir el correo), revisamos solos.
  useEffect(() => {
    const onFocus = () => void check(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [check]);

  async function resend() {
    setSending(true);
    try {
      await resendVerificationEmail();
      register();
      toast.success("Te enviamos otro correo de verificación.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  let resendLabel = "Reenviar correo";
  if (sending) resendLabel = "Enviando…";
  else if (remaining === 0) resendLabel = "Límite alcanzado, intenta en una hora";
  else if (secondsLeft > 0) resendLabel = `Reenviar en ${secondsLeft} s`;

  return (
    <AuthCard
      title="Verifica tu correo"
      description={
        <>
          Te enviamos un enlace a <strong className="text-foreground">{user?.email}</strong>. Ábrelo para activar tu
          cuenta. Revisa también la carpeta de spam.
        </>
      }
      footer={
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={async () => {
            await signOut();
            router.replace("/entrar");
          }}
        >
          Usar otra cuenta
        </button>
      }
    >
      <div className="grid gap-3">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-gold" aria-hidden="true">
          <MailIcon className="size-7" />
        </div>
        <Button size="lg" className="w-full" onClick={() => check(false)} disabled={checking}>
          {checking ? "Revisando…" : "Ya lo verifiqué"}
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={resend} disabled={!canSend || sending}>
          {resendLabel}
        </Button>
        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          Puedes pedir hasta {remaining} reenvío{remaining === 1 ? "" : "s"} más en esta hora.
        </p>
      </div>
    </AuthCard>
  );
}

export function VerifyEmailPanel() {
  const { loading } = useAuth();
  if (loading) return <PageSkeleton />;
  return (
    <AuthGuard requireVerified={false}>
      <VerifyEmailContent />
    </AuthGuard>
  );
}
