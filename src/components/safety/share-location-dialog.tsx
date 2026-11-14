"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RadioIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startSharingLocation, stopSharingLocation, updateSharedLocation } from "@/services/social-service";
import { getErrorMessage } from "@/lib/firebase/errors";

/** Mientras se comparte, la posición se envía como máximo cada 20 segundos. */
const SEND_EVERY_MS = 20_000;

export function ShareLocationButton() {
  const { user, isVerified, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  // Al salir de la página se deja de seguir el GPS.
  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    },
    []
  );

  const link = token ? `${window.location.origin}/compartir/${token}` : "";

  async function start() {
    if (!user) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const t = await startSharingLocation(user.uid, (name || profile?.displayName || "Tu parcero").slice(0, 40), {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
          });
          setToken(t);
          lastSent.current = Date.now();
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              if (Date.now() - lastSent.current < SEND_EVERY_MS) return;
              lastSent.current = Date.now();
              updateSharedLocation(t, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => undefined);
            },
            undefined,
            { enableHighAccuracy: true }
          );
          toast.success("Enlace listo. Mándaselo a tu parche.");
        } catch (e) {
          toast.error(getErrorMessage(e));
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        toast.error("Necesitamos permiso de ubicación para compartirla.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  async function stop() {
    if (!token) return;
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    try {
      await stopSharingLocation(token);
    } catch {
      // Si falla, igual vence sola a las 4 horas.
    }
    setToken(null);
    toast.success("Dejaste de compartir tu ubicación.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  }

  return (
    <>
      <Button
        size="icon-lg"
        variant={token ? "default" : "secondary"}
        className="rounded-full shadow-md"
        onClick={() => setOpen(true)}
        aria-label={token ? "Estás compartiendo tu ubicación" : "Compartir mi ubicación con amigos"}
      >
        <RadioIcon className={token ? "animate-pulse" : undefined} aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir mi ubicación</DialogTitle>
            <DialogDescription>
              Tus amigos verán dónde estás en un mapa durante 4 horas, mientras tengas Borra2 abierta. Puedes detenerlo cuando
              quieras.
            </DialogDescription>
          </DialogHeader>

          {!user ? (
            <Link href="/entrar" className={buttonVariants()}>
              Inicia sesión para compartir
            </Link>
          ) : !isVerified ? (
            <Link href="/verificar-correo" className={buttonVariants()}>
              Verifica tu correo para compartir
            </Link>
          ) : token ? (
            <div className="grid gap-3">
              <Label htmlFor="enlace-compartido">Enlace para tus amigos</Label>
              <div className="flex gap-2">
                <Input id="enlace-compartido" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" onClick={copy}>
                  Copiar
                </Button>
              </div>
              <a
                className={buttonVariants()}
                href={`https://wa.me/?text=${encodeURIComponent(`Esta es mi ubicación en vivo 📍 ${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar por WhatsApp
              </a>
              <Button variant="destructive" onClick={stop}>
                Dejar de compartir
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <Label htmlFor="nombre-compartir">Cómo te verán</Label>
              <Input
                id="nombre-compartir"
                maxLength={40}
                placeholder={profile?.displayName ?? "Sami"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={start} disabled={busy}>
                {busy ? "Obteniendo tu ubicación…" : "Generar enlace"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
