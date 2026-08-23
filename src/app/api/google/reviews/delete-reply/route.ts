import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { removeGoogleReviewReply } from "@/features/testimonials/google-business";
import { googleReviewDeleteReplySchema } from "@/features/testimonials/schema";
import { parseSafeAdminJson } from "@/lib/security/request";

export async function POST(request: Request) {
  const body = await parseSafeAdminJson<unknown>(request);
  if (body === null) return NextResponse.json({ error: "Requisição não permitida" }, { status: 403 });
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = googleReviewDeleteReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: "Confirme a remoção da resposta." }, { status: 400 });
  try {
    await removeGoogleReviewReply(parsed.data.reviewId);
    return NextResponse.json({ success: true, message: "Resposta removida do Google." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Não foi possível remover a resposta." }, { status: 400 });
  }
}
