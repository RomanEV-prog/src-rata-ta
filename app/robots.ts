import type { MetadataRoute } from "next";

// Potrebno pri output: export (statični izpis /robots.txt).
export const dynamic = "force-static";

// Generira /robots.txt (statično pri output: export).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Interni/zasebni deli — naj jih Google ne indeksira.
      disallow: ["/admin", "/login", "/dostop"],
    },
    sitemap: "https://www.strelisce-maribor.si/sitemap.xml",
    host: "https://www.strelisce-maribor.si",
  };
}
