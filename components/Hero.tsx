import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const AKTIVNOSTI = [
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
  { ime: "Arcade igre",      href: "/paketi",        barva: "#8e44ad" },
]

// Ostali sostanovalci (ŠRC je prikazan posebej, večji, nad njimi).
const PARTNERJI = [
  { ime: "SD Fenix",             logo: `${BP}/logos/fenix.jpg`,      logoBg: "#fff",        url: "/clanstvo/sd-fenix", intern: true },
  { ime: "Roman's Cakes",        logo: `${BP}/logos/romancakes.png`, logoBg: "#1a1200",     url: "https://www.romancakes.com" },
  { ime: "Razgoršek",            logo: `${BP}/logos/razgorsek.png`,  logoBg: "#fff",        url: "https://www.razgorsek.si" },
  { ime: "Jiujitsu Ambition",    logo: `${BP}/logos/ambition.png`,   logoBg: "#111",        url: "https://mmaribor.si" },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Video ozadje */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.25)" }}
        autoPlay muted loop playsInline
        poster={`${BP}/hero-poster.jpg`}
        preload="metadata"
      >
        <source src={`${BP}/hero-bg.mp4`} type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: "rgba(13,15,20,0.5)" }} />

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-20 flex flex-col gap-10">

        {/* 1. Naslov */}
        <div className="text-center">
          <h1
            className="text-6xl sm:text-8xl font-black tracking-tight text-white uppercase mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            ŠRC RA-TA-TA
          </h1>
          <p className="text-lg sm:text-xl text-white/80 font-medium">
            Več kot samo strelišče!
          </p>
        </div>

        {/* 2. Logo ŠRC — središče objekta */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <img src={`${BP}/logo.png`} alt="ŠRC Ra-Ta-Ta" className="w-full h-full object-contain p-2" />
          </div>
          <span className="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase">
            V središču objekta
          </span>
        </div>

        {/* 3. Ostali sostanovalci — pod ŠRC */}
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-white/30 uppercase text-center mb-6">
            Kdo je še v objektu
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {PARTNERJI.map((p) => {
              const logo = (
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:brightness-125"
                    style={{ background: p.logoBg, border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <img src={p.logo} alt={p.ime} className="w-full h-full object-contain p-2" />
                  </div>
                  <span className="text-white/50 text-xs font-medium text-center group-hover:text-white/80 transition-colors max-w-[7rem]">
                    {p.ime}
                  </span>
                </div>
              )
              if (!p.url) return <div key={p.ime}>{logo}</div>
              if ((p as { intern?: boolean }).intern) return <Link key={p.ime} href={p.url}>{logo}</Link>
              return <a key={p.ime} href={p.url} target="_blank" rel="noopener noreferrer">{logo}</a>
            })}
          </div>
        </div>

        {/* 4. Gumbi (aktivnosti) */}
        <div className="flex flex-wrap justify-center gap-2">
          {AKTIVNOSTI.map((a) => (
            <Link key={a.ime} href={a.href}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:brightness-125 hover:scale-105"
              style={{ background: a.barva + "25", color: a.barva, border: `1px solid ${a.barva}50` }}
            >
              {a.ime}
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
