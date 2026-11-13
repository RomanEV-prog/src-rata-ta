import type { MetadataRoute } from "next";

// Potrebno pri output: export (statični izpis /sitemap.xml).
export const dynamic = "force-static";

// Kanonični naslov žive strani (ne GitHub Pages mirror).
const BASE = "https://www.strelisce-maribor.si";

// Javne poti (brez /admin, /login, /dostop).
const routes = [
  "",
  "ceniki",
  "paketi",
  "o-nas",
  "kontakt",
  "teambuilding",
  "instrukcije",
  "usposabljanja",
  "clanstvo",
  "clanstvo/sd-fenix",
  "news-events",
  "obrazci-zakoni",
  "trgovina",
];

// Generira /sitemap.xml (statično pri output: export).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((r) => ({
    url: `${BASE}/${r}${r ? "/" : ""}`,
    lastModified,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : 0.7,
  }));
}
