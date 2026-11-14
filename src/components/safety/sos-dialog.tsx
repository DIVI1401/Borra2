"use client";

import { useState } from "react";
import { PhoneIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Botón de seguridad: línea de emergencias de Colombia (123) y consejos. */
export function SosButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon-lg"
        className="rounded-full bg-destructive font-bold text-white shadow-md hover:bg-destructive/90"
        onClick={() => setOpen(true)}
        aria-label="Ayuda y seguridad"
      >
        SOS
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Necesitas ayuda?</DialogTitle>
            <DialogDescription>
              Si estás en peligro, llama a la línea de emergencias. También puedes compartir tu ubicación con alguien de
              confianza desde el botón de la antena.
            </DialogDescription>
          </DialogHeader>
          <a href="tel:123" className={buttonVariants({ size: "lg", className: "bg-destructive text-white hover:bg-destructive/90" })}>
            <PhoneIcon aria-hidden="true" /> Llamar al 123
          </a>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>No recibas bebidas de desconocidos ni dejes tu trago solo.</li>
            <li>Pide el transporte desde una app y comparte la placa con tu parche.</li>
            <li>Acuerden un punto de encuentro por si se separan.</li>
            <li>Si tomaste, no manejes.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
