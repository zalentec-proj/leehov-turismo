import { NextRequest, NextResponse } from "next/server";
import { confirmNewsletterAction } from "@/features/newsletter/actions";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await confirmNewsletterAction(token);
  const status = result.status ?? "invalid";
  return NextResponse.redirect(new URL(`/newsletter/resultado?status=${status}`, request.url));
}
