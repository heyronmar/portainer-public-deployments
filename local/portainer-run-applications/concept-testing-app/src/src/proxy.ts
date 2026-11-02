// HTTP basic auth for the researcher view (/admin, /admin/*, /admin/export.csv).
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const sha = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

export function proxy(req: NextRequest) {
  const user = process.env.ADMIN_USER, pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) {
    return new NextResponse("Researcher view is disabled. Set ADMIN_USER and ADMIN_PASSWORD.", { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    // Compare both parts every time so timing doesn't reveal which one was wrong.
    const userOk = same(i >= 0 ? decoded.slice(0, i) : "", user);
    const passOk = same(i >= 0 ? decoded.slice(i + 1) : "", pass);
    if (i >= 0 && userOk && passOk) return NextResponse.next();
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Portainer V3 concept test", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
