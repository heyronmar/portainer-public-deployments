import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [{ url: `${await siteUrl()}/`, changeFrequency: "monthly", priority: 1 }];
}
