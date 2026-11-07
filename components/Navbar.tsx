"use client";

import Link from "next/link";
import { useState } from "react";
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ponudbaLinks = [
  { label: "Paketi", href: "/paketi" },
  { label: "Teambuildingi", href: "/teambuilding" },
  { label: "Inštrukcije streljanja", href: "/instrukcije" },
  { label: "Izobraževanja", href: "/usposabljanja" },
  { label: "Funpark", href: "https://www.funpark.si" },
  { label: "Ceniki", href: "/ceniki" },
];

const clanstvoLinks = [
  { label: "O članstvu", href: "/clanstvo" },
  { label: "Prijava na ligo SD Fenix", href: "/clanstvo/sd-fenix" },
];

export default function Navbar() {
  const [ponudbaOpen, setPonudbaOpen] = useState(false);
  const [clanstvoOpen, setClanstvoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{ background: "rgba(13, 15, 20, 0.95)" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BP}/logo.png`} alt="ŠRC Ra-Ta-Ta" width={32} height={32} className="object-contain" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
          <Link href="/" className="hover:text-white transition-colors">Domov</Link>

          {/* Ponudba dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setPonudbaOpen(true)}
              onMouseLeave={() => setPonudbaOpen(false)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Ponudba
              <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {ponudbaOpen && (
              <div
                onMouseEnter={() => setPonudbaOpen(true)}
                onMouseLeave={() => setPonudbaOpen(false)}
                className="absolute top-full left-0 mt-1 w-52 rounded-lg overflow-hidden shadow-xl"
                style={{ background: "#1a1f2e" }}
              >
                {ponudbaLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/o-nas" className="hover:text-white transition-colors">O nas</Link>
          <Link href="/news-events" className="hover:text-white transition-colors">Novice, dogodki</Link>
          <Link href="https://trgovina.strelisce-maribor.si" className="hover:text-white transition-colors">Trgovina</Link>

          {/* Članstvo dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setClanstvoOpen(true)}
              onMouseLeave={() => setClanstvoOpen(false)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Članstvo
              <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {clanstvoOpen && (
              <div
                onMouseEnter={() => setClanstvoOpen(true)}
                onMouseLeave={() => setClanstvoOpen(false)}
                className="absolute top-full left-0 mt-1 w-44 rounded-lg overflow-hidden shadow-xl"
                style={{ background: "#1a1f2e" }}
              >
                {clanstvoLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link>
        </div>

        {/* Right side: social + login */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="https://www.facebook.com/src.ratata" target="_blank" className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </Link>
          <Link href="http://www.instagram.com/src.ratata/" target="_blank" className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
              <circle cx="12" cy="12" r="4" strokeWidth={2} />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="ml-2 flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-white"
            style={{ background: "#3a3f52" }}
          >
            A
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-3 text-sm font-medium" style={{ background: "#0d0f14" }}>
          <Link href="/" onClick={() => setMobileOpen(false)}>Domov</Link>
          <div className="pl-2 border-l border-white/20 flex flex-col gap-2">
            <span className="text-white/50 text-xs uppercase tracking-wider">Ponudba</span>
            {ponudbaLinks.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-white/80">{l.label}</Link>)}
          </div>
          <Link href="/o-nas" onClick={() => setMobileOpen(false)}>O nas</Link>
          <Link href="/news-events" onClick={() => setMobileOpen(false)}>Novice, dogodki</Link>
          <Link href="https://trgovina.strelisce-maribor.si" onClick={() => setMobileOpen(false)}>Trgovina</Link>
          <Link href="/clanstvo" onClick={() => setMobileOpen(false)}>Članstvo</Link>
          <Link href="/clanstvo/sd-fenix" onClick={() => setMobileOpen(false)} className="text-white/60 pl-3">— Prijava na ligo</Link>
          <Link href="/kontakt" onClick={() => setMobileOpen(false)}>Kontakt</Link>
          <Link href="/login" onClick={() => setMobileOpen(false)}>Prijava za člane</Link>
        </div>
      )}
    </nav>
  );
}
