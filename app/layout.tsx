import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavbarWrapper } from "./NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "ŠRC Ra-Ta-Ta | Strelišče Maribor",
  description: "Več kot samo strelišče! Paketi, teambuildingi, izobraževanja.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#0d0f14", color: "#fff" }}>
        <NavbarWrapper>{children}</NavbarWrapper>
      </body>
    </html>
  );
}
