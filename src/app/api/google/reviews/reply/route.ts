import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { replyToGoogleReview } from "@/features/testimonials/google-business";
import { googleReviewReplySchema } from "@/features/testimonials/schema";

export async function POST(request: Request) {
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = googleReviewReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Revise a resposta." }, { status: 400 });
  try {
    await replyToGoogleReview(parsed.data.reviewId, parsed.data.comment);
    return NextResponse.json({ success: true, message: "Resposta publicada no Google." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Não foi possível responder." }, { status: 400 });
  }
}
