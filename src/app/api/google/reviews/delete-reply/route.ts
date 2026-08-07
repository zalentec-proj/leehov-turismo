import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { removeGoogleReviewReply } from "@/features/testimonials/google-business";
import { googleReviewDeleteReplySchema } from "@/features/testimonials/schema";

export async function POST(request: Request) {
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = googleReviewDeleteReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Confirme a remoção da resposta." }, { status: 400 });
  try {
    await removeGoogleReviewReply(parsed.data.reviewId);
    return NextResponse.json({ success: true, message: "Resposta removida do Google." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Não foi possível remover a resposta." }, { status: 400 });
  }
}
