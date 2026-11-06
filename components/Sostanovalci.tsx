const PARTNERJI = [
  {
    ime: "Razgoršek Nepremičnine",
    opis: "Nepremičninsko posredništvo",
    logo: null,
    barva: "#c0392b",
    ikona: "🏠",
    url: "https://www.razgorsek.si",
  },
  {
    ime: "SD Fenix",
    opis: "Strelsko društvo",
    logo: null,
    barva: "#e67e22",
    ikona: "🦅",
    url: null, // isto mesto — ni zunanjega linka
    isti: true,
  },
  {
    ime: "Jiujitsu Ambition",
    opis: "Borilne veščine · Maribor · Est. 2018",
    logo: null,
    barva: "#8e44ad",
    ikona: "🥋",
    url: "https://mmaribor.si",
  },
  {
    ime: "Roman's Cakes",
    opis: "Brez glutena · Vegansko",
    logo: null,
    barva: "#2c3e50",
    ikona: "🎂",
    url: "https://www.romancakes.com",
  },
]

export default function Sostanovalci() {
  return (
    <section className="py-20" style={{ background: "#0a0c10" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold tracking-widest text-white/25 uppercase text-center mb-10">
          V istem objektu
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PARTNERJI.map((p) => {
            const inner = (
              <div
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-200 border border-white/5 hover:border-white/15 hover:bg-white/4"
                style={{ background: "#0f1218" }}
              >
                {/* Ikona / logo */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: p.barva + "22", border: `1px solid ${p.barva}44` }}
                >
                  {p.logo ? (
                    <img src={p.logo} alt={p.ime} className="w-10 h-10 object-contain" />
                  ) : (
                    <span>{p.ikona}</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-white/85 font-semibold text-sm leading-tight">{p.ime}</div>
                  <div className="text-white/35 text-xs mt-1 leading-snug">{p.opis}</div>
                </div>
                {p.url && (
                  <span className="text-xs font-medium transition-colors" style={{ color: p.barva }}>
                    Obišči →
                  </span>
                )}
                {p.isti && (
                  <span className="text-xs text-white/20">isto mesto</span>
                )}
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
