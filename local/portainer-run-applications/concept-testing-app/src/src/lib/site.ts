// Public URL of the app, for link previews, the canonical URL, robots.txt and sitemap.xml.
// The same image serves several domains, so this is worked out per request: SITE_URL if set, else the request's host.
import { headers } from "next/headers";

export async function siteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() || h.get("host") || "localhost:3000";
  // Public domains are always https. Proxies like Cloudflare Tunnel report http for their hop to the app, so don't trust it.
  const proto = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https";
  return `${proto}://${host}`;
}
