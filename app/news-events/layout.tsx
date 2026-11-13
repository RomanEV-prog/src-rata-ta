import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novice in dogodki",
  description: "Novice, obvestila, izobraževanja in tekmovanja strelišča ŠRC Ra-Ta-Ta.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
