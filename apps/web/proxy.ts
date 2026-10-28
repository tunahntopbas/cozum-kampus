import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homeFor, requiredRole, roleFromClaims, STUDENT_PANEL_COOKIE, type Role } from "@/lib/auth";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session cookie; must run before any redirect decision.
  // getClaims verifies the JWT locally against the project's signing keys, so no auth round trip.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const roles = requiredRole(pathname);
  if (!roles) return response;

  const redirectTo = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!claims) {
    const login = new URL("/giris", request.url);
    login.searchParams.set("next", pathname + search);
    return redirectTo(login);
  }

  let role = roleFromClaims(claims);
  if (!role) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.sub).single();
    role = (profile?.role ?? "student") as Role;
  }
  if (!roles.includes(role)) return redirectTo(new URL(homeFor(role), request.url));
  const adminViewsStudent = role === "admin" && request.cookies.get(STUDENT_PANEL_COOKIE)?.value === "1";
  if (pathname === "/" && homeFor(role) !== "/" && !adminViewsStudent) return redirectTo(new URL(homeFor(role), request.url));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs)$).*)"],
};
