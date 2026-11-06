import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const AKTIVNOSTI = [
  { ime: "Strelišče",        href: "/paketi",        barva: "#4f6bbd" },
  { ime: "Paketi",           href: "/paketi",        barva: "#4f6bbd" },
  { ime: "Teambuilding",     href: "/teambuilding",  barva: "#3dba8a" },
  { ime: "Praznovanje",      href: "/teambuilding",  barva: "#e67e22" },
  { ime: "Posladkaj se",     href: "/paketi",        barva: "#c0392b" },
  { ime: "Priji se zvit",    href: "/paketi",        barva: "#8e44ad" },
  { ime: "LaserMax",         href: "/paketi",        barva: "#e74c3c" },
  { ime: "Biljard",          href: "/paketi",        barva: "#2c8c5a" },
  { ime: "Ročni nogomet",    href: "/paketi",        barva: "#d35400" },
  { ime: "Mini nogomet",     href: "/paketi",        barva: "#16a085" },
  { ime: "Darts",            href: "/paketi",        barva: "#7f8c8d" },
  { ime: "Namizni tenis",    href: "/paketi",        barva: "#2980b9" },
  { ime: "Arcade igre",      href: "/paketi",        barva: "#8e44ad" },
]

const PARTNERJI = [
  {
    ime: "SD Fenix",
    opis: "Strelsko društvo",
    barva: "#e67e22",
    logo: `${BP}/logos/fenix.jpg`,
    logoBg: "#fff",
    url: null,
  },
  {
    ime: "Jiujitsu Ambition",
    opis: "Borilne veščine · BJJ",
    barva: "#8e44ad",
    logo: `${BP}/logos/ambition.png`,
    logoBg: "#111",
    url: "https://mmaribor.si",
  },
  {
    ime: "Razgoršek Nepremičnine",
    opis: "Nepremičninsko posredništvo",
    barva: "#c0392b",
    logo: `${BP}/logos/razgorsek.png`,
    logoBg: "#fff",
    url: "https://www.razgorsek.si",
  },
  {
    ime: "Roman's Cakes",
    opis: "Brez glutena · Vegansko",
    barva: "#2c8c5a",
    logo: `${BP}/logos/romancakes.png`,
    logoBg: "#1a1200",
    url: "https://www.romancakes.com",
  },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Video ozadje */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.25)" }}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={`${BP}/hero-bg.mp4`} type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: "rgba(13,15,20,0.55)" }} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-24">

        {/* Naslov */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-white/35 uppercase mb-3">
            Ulica heroja Šaranovića 36 · Maribor
          </p>
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight uppercase mb-2"
              style={{ letterSpacing: "-0.02em" }}>
            Kdo smo
          </h1>
          <div className="w-16 h-1 mx-auto rounded-full mt-4" style={{ background: "#4f6bbd" }} />
        </div>

        {/* ŠRC featured kartica */}
        <div className="rounded-2xl p-6 mb-4 border border-blue-500/30"
             style={{ background: "rgba(79,107,189,0.12)" }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                 style={{ background: "rgba(79,107,189,0.2)" }}>
              <img src={`${BP}/logo.png`} alt="ŠRC Ra-Ta-Ta" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <div className="text-white font-black text-xl tracking-wide">ŠRC Ra-Ta-Ta</div>
              <div className="text-white/50 text-sm">Več kot samo strelišče!</div>
            </div>
            <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "rgba(79,107,189,0.3)", color: "#7a9bd4" }}>
              Tukaj ste
            </span>
          </div>

          {/* Aktivnosti */}
          <div className="flex flex-wrap gap-2">
            {AKTIVNOSTI.map((a) => (
              <Link key={a.ime} href={a.href}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:brightness-125 hover:scale-105"
                style={{ background: a.barva + "25", color: a.barva, border: `1px solid ${a.barva}50` }}
              >
                {a.ime}
              </Link>
            ))}
          </div>
        </div>

        {/* Ostali partnerji */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PARTNERJI.map((p) => {
            const inner = (
              <div className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02]"
                   style={{ background: p.barva + "10", borderColor: p.barva + "35" }}>
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                     style={{ background: p.logoBg }}>
                  <img src={p.logo} alt={p.ime} className="w-full h-full object-contain p-0.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-xs leading-tight truncate">{p.ime}</div>
                  <div className="text-white/40 text-xs mt-0.5 truncate">{p.opis}</div>
                  {p.url && (
                    <span className="text-xs" style={{ color: p.barva }}>Obišči →</span>
                  )}
                </div>
              </div>
            )
            return p.url
              ? <a key={p.ime} href={p.url} target="_blank" rel="noopener noreferrer">{inner}</a>
              : <div key={p.ime}>{inner}</div>
          })}
        </div>

      </div>
    </section>
  )
}
