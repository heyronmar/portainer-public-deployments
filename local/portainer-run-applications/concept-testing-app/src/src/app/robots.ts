import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Only the landing page is public. Resume links, the API and the researcher view stay out of search results. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/r/", "/api/"] },
    sitemap: `${await siteUrl()}/sitemap.xml`,
  };
}
