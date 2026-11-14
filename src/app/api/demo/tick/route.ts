import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/guard";
import { runDemoTick } from "@/lib/server/demo";

/**
 * POST /api/demo/tick
 * Lo llama el mapa mientras el modo demo está activo. Es público pero solo
 * hace algo una vez cada 5 minutos y únicamente si el admin activó la demo.
 */
export async function POST() {
  try {
    const updated = await runDemoTick();
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return errorResponse(error);
  }
}
