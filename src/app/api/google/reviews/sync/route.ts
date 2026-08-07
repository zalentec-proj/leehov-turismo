import { NextResponse } from "next/server";

import { syncGoogleReviewsAction } from "@/features/testimonials/actions";
import { getPermissionAccess } from "@/features/auth/permissions";

export async function POST() {
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await syncGoogleReviewsAction();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
