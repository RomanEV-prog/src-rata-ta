import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontakt, delovni čas in naslov strelišča ŠRC Ra-Ta-Ta v Mariboru.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
