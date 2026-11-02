// Participant identity: an httpOnly cookie holding the response id.
import type { NextRequest, NextResponse } from "next/server";

export const COOKIE = "ct_id";

export function setIdCookie(req: NextRequest, res: NextResponse, id: string) {
  const https = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || req.nextUrl.protocol === "https:";
  res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: 60 * 60 * 24 * 365 });
}
