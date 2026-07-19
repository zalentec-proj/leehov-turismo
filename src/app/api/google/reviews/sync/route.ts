import { NextResponse } from "next/server";

import { syncGoogleReviewsAction } from "@/features/testimonials/actions";

export async function POST() {
  const result = await syncGoogleReviewsAction();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
