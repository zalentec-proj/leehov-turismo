import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>(["invite", "magiclink", "recovery"]);
const allowedDestinations = new Set(["/admin/definir-senha"]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = request.nextUrl.searchParams.get("next") || "/admin/definir-senha";
  const attempt = request.nextUrl.searchParams.get("attempt");
  if (!tokenHash || !type || !allowedTypes.has(type) || !allowedDestinations.has(requestedNext)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_link", request.url));
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return NextResponse.redirect(new URL("/admin/login?error=expired_link", request.url));
  const destination = new URL(requestedNext, request.url);
  if (attempt && /^[0-9a-f-]{36}$/i.test(attempt)) destination.searchParams.set("attempt", attempt);
  return NextResponse.redirect(destination);
}
