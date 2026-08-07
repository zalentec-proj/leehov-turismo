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
  const publicAdminRoutes = [
    "/admin/login",
    "/admin/recuperar-senha",
    "/admin/auth/confirm",
    "/admin/definir-senha",
    "/admin/email/confirmar",
  ];

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

  if (publicAdminRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return response;

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

  if (pathname !== "/admin/mfa/verificar") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return redirectWithCookies(new URL("/admin/mfa/verificar", request.url));
    }
  }

  const adminOnly = ["/admin/usuarios"];
  if (profile.role !== "admin" && adminOnly.some((prefix) => pathname.startsWith(prefix))) {
    return redirectWithCookies(new URL("/admin?error=forbidden", request.url));
  }

  const routePermissions = [
    ["/admin/configuracoes", "settings.view"],
    ["/admin/webhooks", "webhooks.view"],
    ["/admin/caravanas", "caravans.view"],
    ["/admin/blog", "blog.view"],
    ["/admin/leads", "leads.view"],
    ["/admin/newsletter", "newsletter.view"],
    ["/admin/depoimentos", "testimonials.view"],
    ["/admin/popups", "popups.view"],
    ["/admin/midia", "media.view"],
  ] as const;
  const routePermission = routePermissions.find(([prefix]) => pathname.startsWith(prefix))?.[1]
    ?? (pathname === "/admin" ? "dashboard.view" : null);
  if (routePermission) {
    const { data: allowed } = await supabase.rpc("has_permission", { permission_name: routePermission });
    if (!allowed) return redirectWithCookies(new URL("/admin/sem-acesso", request.url));
  }

  return response;
}
