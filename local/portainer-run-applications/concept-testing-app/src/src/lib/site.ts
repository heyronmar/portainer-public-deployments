// Public URL of the app, for link previews, the canonical URL, robots.txt and sitemap.xml.
// The same image serves several domains, so this is worked out per request: SITE_URL if set, else the request's host.
import { headers } from "next/headers";

export async function siteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
