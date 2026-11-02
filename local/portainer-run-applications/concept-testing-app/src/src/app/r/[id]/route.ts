import { NextResponse, type NextRequest } from "next/server";
import { getResponse } from "@/lib/db";
import { setIdCookie } from "@/lib/session";

/** Resume link: adopt the response id on this device, then go to the test. */
export async function GET(req: NextRequest, ctx: RouteContext<"/r/[id]">) {
  const { id } = await ctx.params;
  const row = getResponse(id);
  // Relative Location so the redirect stays on the public host when running behind a reverse proxy.
  const res = new NextResponse(null, { status: 303, headers: { Location: row ? "/" : "/?resume=notfound" } });
  if (row) setIdCookie(req, res, row.id);
  return res;
}
