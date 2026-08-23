import { NextResponse } from "next/server";

import { syncGoogleReviewsAction } from "@/features/testimonials/actions";
import { getPermissionAccess } from "@/features/auth/permissions";
import { hasSameOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await syncGoogleReviewsAction();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
