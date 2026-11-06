const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const PARTNERJI = [
  {
    ime: "ŠRC Ra-Ta-Ta",
    opis: "Strelišče · rezervacije · paketi · tekmovanja",
    barva: "#4f6bbd",
    logo: `${BP}/logo.png`,
    logoBg: "transparent",
    url: null,
    domace: true,
  },
  {
    ime: "SD Fenix",
    opis: "Strelsko društvo · treningi · tekmovalci",
    barva: "#e67e22",
    logo: `${BP}/logos/fenix.jpg`,
    logoBg: "#fff",
    url: null,
    domace: true,
  },
  {
    ime: "Jiujitsu Ambition",
    opis: "Borilne veščine · BJJ · Est. 2018",
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

export default function Sostanovalci() {
  return (
    <section className="py-16" style={{ background: "#0d0f14" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-white font-black text-2xl tracking-wider mb-2">
          Kdo smo v objektu?
        </h2>
        <p className="text-center text-white/35 text-sm mb-10">
          Ulica heroja Šaranovića 36, Maribor
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTNERJI.map((p) => {
            const inner = (
              <div
                className="flex items-center gap-5 p-5 rounded-2xl transition-all duration-200 border hover:scale-[1.02]"
                style={{
                  background: p.barva + "12",
                  borderColor: p.barva + "40",
                }}
              >
                {/* Logo */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: p.logoBg }}
                >
                  {p.logo ? (
                    <img
                      src={p.logo}
                      alt={p.ime}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-3xl">{(p as { ikona?: string }).ikona}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-base leading-tight">{p.ime}</div>
                  <div className="text-white/50 text-xs mt-1 leading-snug">{p.opis}</div>
                  {p.domace ? (
                    <span
                      className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: p.barva + "30", color: p.barva }}
                    >
                      Tukaj ste
                    </span>
                  ) : (
                    <span className="inline-block mt-2 text-xs font-medium" style={{ color: p.barva }}>
                      Obišči spletno stran →
                    </span>
                  )}
                </div>
              </div>
            )

            if (p.url) {
              return (
                <a key={p.ime} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                  {inner}
                </a>
              )
            }
            return <div key={p.ime}>{inner}</div>
          })}
        </div>
      </div>
    </section>
  )
}
