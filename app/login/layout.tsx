import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava za člane",
  description: "Prijava za člane prek mobilne aplikacije RangeOS.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
