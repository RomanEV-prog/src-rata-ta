import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava na ligo SD Fenix",
  description: "Spletna prijava na Zimsko ligo Fenix — izpolnite prijavnico in pravila lige.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
