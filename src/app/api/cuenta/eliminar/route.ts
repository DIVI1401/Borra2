import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { errorResponse, verifyRequest } from "@/lib/server/guard";
import { deleteAllUserData } from "@/lib/server/user-data";

/**
 * POST /api/cuenta/eliminar
 * Borra los datos y la cuenta de quien hace la petición.
 * Exige haber confirmado la identidad hace menos de 5 minutos.
 */
export async function POST(request: Request) {
  try {
    const user = await verifyRequest(request, { requireVerified: false, maxAuthAgeSeconds: 300 });
    await deleteAllUserData(user.uid);
    await adminAuth.deleteUser(user.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
