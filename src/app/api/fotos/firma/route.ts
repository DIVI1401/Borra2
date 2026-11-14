import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, HttpError, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";

const bodySchema = z.object({ venueId: z.string().regex(/^[a-z0-9-]{1,40}$/) });

/**
 * POST /api/fotos/firma
 * Devuelve una firma de Cloudinary (plan gratis) para que el dueño de un local
 * suba fotos directo desde el navegador. El secreto de la API se queda en el servidor.
 */
export async function POST(request: Request) {
  try {
    const user = await verifyRequest(request, { roles: ["venue", "admin"] });
    const { venueId } = await parseBody(request, bodySchema);
    if (user.role === "venue" && user.venueId !== venueId) {
      throw new HttpError(403, "Solo puedes subir fotos de tu propio local.", "venue/not-owner");
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new HttpError(503, "La subida de fotos aún no está configurada.", "photos/not-configured");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `borra2/venues/${venueId}`;
    // Cloudinary firma los parámetros ordenados alfabéticamente + el secreto (SHA-1).
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");

    return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder });
  } catch (error) {
    return errorResponse(error);
  }
}
