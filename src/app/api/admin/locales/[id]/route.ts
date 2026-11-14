import { NextResponse } from "next/server";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { setVenueStatus } from "@/lib/server/admin";
import { venueFlagsSchema } from "@/schemas/admin";

/** POST /api/admin/locales/{id} → ocultar/mostrar o verificar un local (solo admin). */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/locales/[id]">) {
  try {
    const admin = await verifyRequest(request, { roles: ["admin"] });
    const { id } = await ctx.params;
    const patch = await parseBody(request, venueFlagsSchema);
    await setVenueStatus(admin.uid, id, patch);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
