// Guards the researcher view (/admin, /admin/*, /admin/export.csv). Signed-out visitors go to /admin/login.
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminEnabled, verifyBasicAuth, verifySessionToken } from "@/lib/admin-auth";

export function proxy(req: NextRequest) {
  if (!adminEnabled()) {
    return new NextResponse("Researcher view is disabled. Set ADMIN_USER and ADMIN_PASSWORD.", { status: 503 });
  }
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value) || verifyBasicAuth(req.headers.get("authorization"))) {
    return NextResponse.next();
  }
  // Behind Cloudflare/ingress req.url can be the internal http address, so rebuild it like siteUrl() does.
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host") || req.nextUrl.host;
  const proto = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https";
  const login = new URL(`${proto}://${host}/admin/login`);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
