import { NextResponse } from "next/server";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { submitUserReport } from "@/lib/server/venues";
import { reportSchema } from "@/schemas/venue";

/**
 * POST /api/locales/{id}/reportes
 * "¿Cómo está esto ahora?" de un usuario con correo verificado.
 * El servidor decide si está en el sitio (GPS) y recalcula el semáforo.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/locales/[id]/reportes">) {
  try {
    const user = await verifyRequest(request);
    const { id } = await ctx.params;
    const input = await parseBody(request, reportSchema);
    const { onSite } = await submitUserReport(id, user.uid, input);
    return NextResponse.json({
      ok: true,
      onSite,
      message: onSite
        ? "¡Gracias! Tu reporte quedó verificado porque estás en el sitio."
        : "¡Gracias! Como no estás en el sitio, tu reporte cuenta menos.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
