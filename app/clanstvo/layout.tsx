import type { Metadata } from "next";

export const metadata: Metadata = {
  // Objekt (ne niz), da predloga velja tudi za podstran /clanstvo/sd-fenix.
  title: { default: "Članstvo", template: "%s | ŠRC Ra-Ta-Ta" },
  description: "Članstvo v SD Fenix: ugodnejše cene, rezervacije prek aplikacije, liga in usposabljanja.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
