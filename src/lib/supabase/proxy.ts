import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabasePublicEnv()) {
    return response;
  }

  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(url!, publishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const pathname = request.nextUrl.pathname;

  function redirectWithCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (pathname === "/admin/login") {
    if (!userId) return response;

    const { data: profile } = await supabase
      .from("profiles")
      .select("active")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.active) {
      return redirectWithCookies(new URL("/admin", request.url));
    }

    return response;
  }

  if (!userId) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.active) {
    return redirectWithCookies(new URL("/admin/login?error=inactive", request.url));
  }

  const adminOnly = ["/admin/usuarios", "/admin/configuracoes", "/admin/webhooks"];
  if (profile.role !== "admin" && adminOnly.some((prefix) => pathname.startsWith(prefix))) {
    return redirectWithCookies(new URL("/admin?error=forbidden", request.url));
  }

  return response;
}
