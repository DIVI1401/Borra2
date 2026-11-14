import { NextResponse } from "next/server";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { changeRoleFromPanel } from "@/lib/server/admin";
import { roleChangeSchema } from "@/schemas/admin";

/** POST /api/admin/usuarios/{uid}/rol → hace admin a alguien o lo vuelve usuario (quita su local). */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/usuarios/[uid]/rol">) {
  try {
    const admin = await verifyRequest(request, { roles: ["admin"] });
    const { uid } = await ctx.params;
    const { role } = await parseBody(request, roleChangeSchema);
    await changeRoleFromPanel(admin.uid, uid, role);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
