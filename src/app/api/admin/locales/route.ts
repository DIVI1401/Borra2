import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { saveVenueAsAdmin } from "@/lib/server/admin";
import { venueAdminSchema } from "@/schemas/venue";

const bodySchema = z.object({ mode: z.enum(["create", "update"]), venue: venueAdminSchema });

/** POST /api/admin/locales → crea o edita un local completo (solo admin). */
export async function POST(request: Request) {
  try {
    const admin = await verifyRequest(request, { roles: ["admin"] });
    const { mode, venue } = await parseBody(request, bodySchema);
    await saveVenueAsAdmin(admin.uid, venue, mode);
    return NextResponse.json({ ok: true, id: venue.slug });
  } catch (error) {
    return errorResponse(error);
  }
}
