import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "../database.types";
import { getSupabaseConfig } from "./config";
import { isOfflinePreview } from "./availability";
import { isOperatorRole, workspaceHome } from "../workspace-routing";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (await isOfflinePreview()) {
    if (pathname === "/trainer/clients" || pathname.startsWith("/trainer/clients/")) {
      return NextResponse.redirect(new URL("/trainee", request.url));
    }
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const trainerRoute = pathname === "/trainer" || pathname.startsWith("/trainer/");
  const adminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (trainerRoute || adminRoute) {
    let destination = "";
    if (!user || user.is_anonymous) destination = trainerRoute ? "/auth/login" : "/auth/admin";
    else {
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      if (trainerRoute && profile?.role !== "coachsphere") destination = workspaceHome(profile?.role);
      if (adminRoute && !isOperatorRole(profile?.role)) destination = workspaceHome(profile?.role);
    }
    if (destination) {
      const redirect = NextResponse.redirect(new URL(destination, request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }
  return response;
}
