import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rezervacija proge",
  description: "Preverite proste termine in rezervirajte strelno progo.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
