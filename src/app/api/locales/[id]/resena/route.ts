import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { parseBody } from "@/lib/server/body";
import { deleteReview, upsertReview } from "@/lib/server/venues";
import { reviewSchema } from "@/schemas/venue";

/**
 * POST /api/locales/{id}/resena  → crea o edita tu reseña (una por local).
 * DELETE /api/locales/{id}/resena → borra tu reseña. Un admin puede borrar
 *   la de otra persona con ?uid=… (moderación).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/locales/[id]/resena">) {
  try {
    const user = await verifyRequest(request);
    const { id } = await ctx.params;
    const input = await parseBody(request, reviewSchema);
    const profile = await adminDb.collection("users").doc(user.uid).get();
    const name = (profile.get("displayName") as string | undefined) ?? user.name ?? "Anónimo";
    const { verifiedVisit } = await upsertReview(id, { uid: user.uid, name }, input);
    return NextResponse.json({ ok: true, verifiedVisit });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/locales/[id]/resena">) {
  try {
    const user = await verifyRequest(request);
    const { id } = await ctx.params;
    const target = new URL(request.url).searchParams.get("uid");
    const reviewUid = target && user.role === "admin" ? target : user.uid;
    await deleteReview(id, reviewUid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
