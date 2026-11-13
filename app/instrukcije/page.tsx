import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inštrukcije streljanja",
  description: "Individualne inštrukcije streljanja za začetnike, napredne in tekmovalce.",
};

const CMS = "https://cms.strelisce-maribor.si/uploads";

const levels = [
  {
    title: "Začetnik",
    desc: "Za tiste, ki se prvič srečajo z orožjem. Naučite se osnov varnega ravnanja, pravilne drže in sproščenega proženja.",
    duration: "1,5 ure",
    price: "65 €",
  },
  {
    title: "Napredni",
    desc: "Za strelce z že pridobljenim osnovnim znanjem. Izpopolnite tehniko, natančnost in hitrost.",
    duration: "2 uri",
    price: "85 €",
  },
  {
    title: "Tekmovalni",
    desc: "Specializirane inštrukcije za tekmovalne strelce – prilagojeno posameznemu tekmovalnemu programu.",
    duration: "Po dogovoru",
    price: "Po dogovoru",
  },
];

export default function InstrukcijeStreljanja() {
  return (
    <>
      <PageHero title="INŠTRUKCIJE STRELJANJA" image={`${CMS}/o_nas_strelec_942a34ee7c.jpeg`} />

      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-4 tracking-wider">UČITE SE OD NAJBOLJŠIH</h2>
          <p className="text-white/60 leading-relaxed max-w-2xl mx-auto">
            Naši certificirani inštruktorji z bogatimi izkušnjami iz tekmovalnega streljanja vam pomagajo razviti pravilno tehniko – ne glede na vaš nivo.
          </p>
        </div>
      </section>

      <section className="py-14" style={{ background: "#0a0c10" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levels.map((l) => (
              <div key={l.title} className="rounded-xl p-6 flex flex-col" style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-lg font-black text-white mb-3">{l.title}</div>
                <p className="text-sm text-white/60 leading-relaxed flex-1">{l.desc}</p>
                <div className="mt-5 pt-4 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Trajanje</span>
                    <span className="text-white/80">{l.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-white/40">Cena</span>
                    <span style={{ color: "#3dba8a" }}>{l.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/kontakt" className="inline-block px-8 py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110" style={{ background: "#7a8cc9" }}>
              Rezerviraj termin
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
