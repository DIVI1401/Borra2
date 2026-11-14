"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getErrorMessage } from "@/lib/firebase/errors";
import { deleteAccount } from "@/services/auth-service";

const CONFIRM_WORD = "ELIMINAR";

export function DeleteAccountCard({ usesPassword }: { usesPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = confirmText === CONFIRM_WORD && (!usesPassword || password.length > 0);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(usesPassword ? password : undefined);
      toast.success("Eliminamos tu cuenta y tus datos. ¡Gracias por haber usado Borra2!");
      router.replace("/");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Eliminar cuenta</h2>
        </CardTitle>
        <CardDescription>
          Borra tu cuenta, tus reseñas, tus favoritos y tus ubicaciones compartidas. No se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Eliminar mi cuenta
        </Button>
      </CardContent>

      <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran tu perfil y todo lo que has publicado. Escribe {CONFIRM_WORD} para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3">
            <FormField label={`Escribe ${CONFIRM_WORD}`}>
              {(field) => (
                <Input {...field} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
              )}
            </FormField>
            {usesPassword ? (
              <FormField label="Tu contraseña">
                {(field) => (
                  <PasswordInput
                    {...field}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                )}
              </FormField>
            ) : (
              <p className="text-xs text-muted-foreground">Te pediremos confirmar con Google.</p>
            )}
            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={!ready || busy}>
              {busy ? "Eliminando…" : "Eliminar para siempre"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
