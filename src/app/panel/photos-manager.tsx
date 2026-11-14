"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUploadSignature, updateVenuePhotos } from "@/services/panel-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import type { VenueWithId } from "@/types/venue";

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Fotos del local en Cloudinary (plan gratis). Se suben directo desde el navegador con firma del servidor. */
export function PhotosManager({ venue }: { venue: VenueWithId }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const photos = venue.photos ?? [];

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type)) return toast.error("Sube una imagen JPG, PNG o WebP.");
    if (file.size > MAX_BYTES) return toast.error("La imagen pesa más de 5 MB.");
    setBusy(true);
    try {
      const sig = await getUploadSignature(venue.id);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error("No se pudo subir la imagen. Intenta de nuevo.");
      const { secure_url } = (await res.json()) as { secure_url: string };
      await updateVenuePhotos(venue.id, [...photos, secure_url]);
      toast.success("Foto subida.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(url: string) {
    try {
      await updateVenuePhotos(venue.id, photos.filter((p) => p !== url));
      toast.success("Foto quitada.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Fotos</h2>
        </CardTitle>
        <CardDescription>Hasta {MAX_PHOTOS} fotos (JPG, PNG o WebP de máximo 5 MB).</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {photos.length ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((url, i) => (
              <li key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border">
                <Image src={url} alt={`Foto ${i + 1} de ${venue.name}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute top-1.5 right-1.5"
                  onClick={() => remove(url)}
                  aria-label={`Quitar la foto ${i + 1}`}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Las fotos ayudan a que la gente se anime a ir.</p>
        )}
        <input
          ref={input}
          type="file"
          accept={ALLOWED.join(",")}
          className="sr-only"
          id="subir-foto"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button variant="outline" className="justify-self-start" disabled={busy || photos.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>
          <ImagePlusIcon aria-hidden="true" /> {busy ? "Subiendo…" : "Subir foto"}
        </Button>
      </CardContent>
    </Card>
  );
}
