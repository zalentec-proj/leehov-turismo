import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/features/auth/permissions";
import { exchangeRdAuthorizationCode } from "@/features/meta-conversions/rd-client";

const STATE_COOKIE = "leehov_rd_oauth_state";

function redirectToAdmin(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/admin/conversoes-meta?rd_oauth=${status}`, request.url));
}

function stateMatches(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: NextRequest) {
  await requirePermission("meta_conversions.manage");
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = (await cookies()).get(STATE_COOKIE)?.value;

  if (error || !code || !state || !storedState || !stateMatches(storedState, state)) {
    const response = redirectToAdmin(request, "invalid");
    response.cookies.delete(STATE_COOKIE);
    return response;
  }

  try {
    await exchangeRdAuthorizationCode(code);
    const response = redirectToAdmin(request, "connected");
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    const response = redirectToAdmin(request, "failed");
    response.cookies.delete(STATE_COOKIE);
    return response;
  }
}
