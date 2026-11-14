import { NextResponse } from "next/server";
import { errorResponse, HttpError, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { submitVenueStatus } from "@/lib/server/venues";
import { venueStatusSchema } from "@/schemas/venue";

/**
 * POST /api/locales/{id}/estado
 * El dueño del local (o un admin) publica cómo está el sitio ahora.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/locales/[id]/estado">) {
  try {
    const user = await verifyRequest(request, { roles: ["venue", "admin"] });
    const { id } = await ctx.params;
    if (user.role === "venue" && user.venueId !== id) {
      throw new HttpError(403, "Solo puedes actualizar tu propio local.", "venue/not-owner");
    }
    const input = await parseBody(request, venueStatusSchema);
    await submitVenueStatus(id, user.uid, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
