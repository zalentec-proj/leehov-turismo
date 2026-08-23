import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { replyToGoogleReview } from "@/features/testimonials/google-business";
import { googleReviewReplySchema } from "@/features/testimonials/schema";
import { parseSafeAdminJson } from "@/lib/security/request";

export async function POST(request: Request) {
  const body = await parseSafeAdminJson<unknown>(request);
  if (body === null) return NextResponse.json({ error: "Requisição não permitida" }, { status: 403 });
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = googleReviewReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Revise a resposta." }, { status: 400 });
  try {
    await replyToGoogleReview(parsed.data.reviewId, parsed.data.comment);
    return NextResponse.json({ success: true, message: "Resposta publicada no Google." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Não foi possível responder." }, { status: 400 });
  }
}
