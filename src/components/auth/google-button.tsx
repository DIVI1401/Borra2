"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/services/auth-service";
import { getErrorCode, getErrorMessage } from "@/lib/firebase/errors";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/** Inicia sesión con Google. Las cuentas de Google ya vienen con el correo verificado. */
export function GoogleButton({ onSuccess }: { onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Ya iniciaste sesión.");
      onSuccess();
    } catch (error) {
      if (getErrorCode(error) !== "auth/popup-closed-by-user") toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleClick} disabled={busy}>
      <GoogleIcon /> {busy ? "Abriendo Google…" : "Continuar con Google"}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
    </div>
  );
}
