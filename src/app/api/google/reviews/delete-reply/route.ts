import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/features/auth/queries";
import { removeGoogleReviewReply } from "@/features/testimonials/google-business";
import { googleReviewDeleteReplySchema } from "@/features/testimonials/schema";

export async function POST(request: Request) {
  await requireAdminProfile();
  const parsed = googleReviewDeleteReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Confirme a remoção da resposta." }, { status: 400 });
  try {
    await removeGoogleReviewReply(parsed.data.reviewId);
    return NextResponse.json({ success: true, message: "Resposta removida do Google." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Não foi possível remover a resposta." }, { status: 400 });
  }
}
