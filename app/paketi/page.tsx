import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paketi streljanja",
  description: "Strelski paketi s pravim orožjem pod vodstvom inštruktorja — Revolver, Pištola/puška, Tactical in Elite. Strelišče Maribor.",
};

const CMS = "https://cms.strelisce-maribor.si/uploads";

const packages = [
  {
    name: "Revolver",
    image: `${CMS}/revolver_c34f915501.jpeg`,
    includes: ["Revolver Alfa Proj, 6 nabojev", "Revolver Uberti, 6 nabojev"],
    price: "74.5 €",
    featured: false,
  },
  {
    name: "Pištola / puška",
    image: `${CMS}/PISTOLA_PUSKA_c8c2aa5b5e.png`,
    includes: [
      "Pištola Heckler & Koch, 10 nabojev",
      "Pištola Glock, 10 nabojev",
      "Šibrenica Huglu Atrox Tactical Plus, 2 naboja",
      "Puška Winchester WILDCAT STRATA, 10 nabojev",
    ],
    price: "104.5 €",
    featured: true,
  },
  {
    name: "Tactical",
    image: `${CMS}/TACTICAL_dc15b8a69e.png`,
    includes: [
      "Pištola Heckler & Koch, 15 nabojev",
      "Pištola Glock, 15 nabojev",
      "Puška PA VA-15 (AR-15), 20 nabojev",
    ],
    price: "119.5 €",
    featured: false,
  },
  {
    name: "Elite",
    image: `${CMS}/elite_3c90f03e92.png`,
    includes: [
      "Pištola Heckler & Koch, 20 nabojev",
      "Pištola Glock, 20 nabojev",
      "Puška PA VA-15 (AR-15), 30 nabojev",
      "Puška Winchester WILDCAT STRATA, 20 nabojev",
    ],
    price: "169.5 €",
    featured: false,
  },
];

const steps = [
  {
    num: "1",
    text: "Ob prihodu na strelišče podpišete izjavo, s katero pisno zagotovite, da ste opravilno sposobni in niste pod vplivom substanc.",
    image: `${CMS}/podpis_83ae0319c6.jpeg`,
  },
  {
    num: "2",
    text: "Preden vstopimo na strelišče, vam vodja streljanja obrazloži osnove varnega rokovanja z orožjem: - delovanje orožja izbranega paketa, - elemente strelskega položaja – prijem orožja, strelski položaj, merjenje, proženje.",
    image: `${CMS}/varne_osnove_5870d8e7e2.png`,
  },
  {
    num: "3",
    text: "Po namestitvi zaščitne opreme se z inštruktorjem odpravite na strelišče, kjer se preizkusite v streljanju s pravim orožjem.",
    image: `${CMS}/streljanje_paket_1_d3d05c1560.png`,
  },
];

export default function PaketiPage() {
  return (
    <>
      <PageHero title="PAKETI" image={`${CMS}/streljanje_paket_1_d3d05c1560.png`} />

      {/* Uvod */}
      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-4 tracking-wider">
            KAJ JE PAKET STRELJANJA IN KDO SE GA LAHKO UDELEŽI?
          </h2>
          <p className="text-white/60 leading-relaxed">
            Strelski paket je časovno omejena aktivnost s pravim orožjem, ki se je lahko udeleži vsaka polnoletna oseba. V ceno vseh paketov je vključen vodnik.
          </p>
        </div>
      </section>

      {/* Koraki */}
      <section className="py-16" style={{ background: "#0a0c10" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="space-y-20">
            {steps.map((step, i) => (
              <div key={step.num} className={`flex flex-col md:flex-row gap-10 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <div className="text-6xl font-black mb-4" style={{ color: "#3dba8a" }}>{step.num}.</div>
                  <p className="text-white/70 leading-relaxed text-sm">{step.text}</p>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden" style={{ maxHeight: 300 }}>
                  <img src={step.image} alt={`Korak ${step.num}`} className="w-full h-full object-cover" style={{ maxHeight: 300 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14" style={{ background: "#131720" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white mb-3">Pripravljeni na novo nepozabno izkušnjo?</h2>
            <p className="text-white/60 mb-6 text-sm">Mi vas že nestrpno pričakujemo! Kontaktirajte nas in se dogovorite za termin!</p>
            <Link
              href="/kontakt"
              className="inline-block px-7 py-3 rounded-lg text-white font-semibold text-sm"
              style={{ background: "#7a8cc9" }}
            >
              Kontaktiraj nas!
            </Link>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden">
            <img src={`${CMS}/pistola_85ea446098.jpg`} alt="Streljanje" className="w-full object-cover" style={{ maxHeight: 260 }} />
          </div>
        </div>
      </section>

      {/* Paketi */}
      <section className="py-20" style={{ background: "#0d0f14" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white mb-12 text-center tracking-wider">PAKETI V PONUDBI:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 ${pkg.featured ? "ring-2" : ""}`}
                style={{
                  background: "#131720",
                  border: pkg.featured ? "2px solid #3dba8a" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: pkg.featured ? "0 0 20px rgba(61,186,138,0.15)" : undefined,
                }}
              >
                <div className="h-44 overflow-hidden">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-white mb-3">{pkg.name}</h3>
                  <div className="text-xs text-white/50 mb-1">Vključuje:</div>
                  <ul className="space-y-1 flex-1">
                    {pkg.includes.map((item) => (
                      <li key={item} className="text-xs text-white/70">• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-white/60 text-xs">Cena: </span>
                    <span className="text-white font-bold text-lg">{pkg.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
