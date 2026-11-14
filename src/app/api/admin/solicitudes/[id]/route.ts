import { NextResponse } from "next/server";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { reviewVenueClaim } from "@/lib/server/admin";
import { claimDecisionSchema } from "@/schemas/admin";

/** POST /api/admin/solicitudes/{id} → aprueba o rechaza una solicitud de dueño (solo admin). */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/solicitudes/[id]">) {
  try {
    const admin = await verifyRequest(request, { roles: ["admin"] });
    const { id } = await ctx.params;
    const { decision } = await parseBody(request, claimDecisionSchema);
    await reviewVenueClaim(admin.uid, id, decision);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
