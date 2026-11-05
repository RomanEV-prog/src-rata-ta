import PageHero from "@/components/PageHero";
import Link from "next/link";

const CMS = "https://cms.strelisce-maribor.si/uploads";

const ugodnosti = [
  "Brezplačno in neomejeno koriščenje strelišča 6 dni v tednu",
  "Brezplačna izposoja društvenega orožja",
  "Popust pri najemu strelskega inštruktorja",
  "Popust pri najemu sefa za hrambo orožja",
  "Brezplačna izposoja zaščitne strelske opreme",
  "Popust pri pristopnini ob včlanitvi družinskega člana",
  "Prednost pri prijavi na tečaje in popust na aktivnosti v FUNPARK-u",
  "Možnost nastopanja na tekmovanjih pod imenom SD Fenix",
  "Kriti prijavnini na tekmovanjih + nagrade za uvrstitev v top 3",
  "Redni družabni dogodki za člane",
];

const drustvo = [
  { label: "Ime društva", value: "Strelsko društvo Fenix" },
  { label: "Sedež", value: "Ulica heroja Šaranovića 36, 2000 Maribor" },
  { label: "Kontakt", value: "feniks.sd01@gmail.com" },
  { label: "Dejavnost", value: "Tekmovalno in rekreacijsko streljanje" },
];

const gallery = [
  `${CMS}/clanstvo_tekmovanje_0d2cf1a941.jpg`,
  `${CMS}/clani_nazdravijo_16cba953fe.jpeg`,
  `${CMS}/clanstvo_medalje_3740899ce7.jpeg`,
  `${CMS}/clanstvo_s_9cdc397b4b.jpg`,
  `${CMS}/clanstvo_pokal_f98ac29ad6.png`,
];

export default function ClanstvoPage() {
  return (
    <>
      <PageHero title="ČLANSTVO" image={`${CMS}/clanstvo_tekmovanje_0d2cf1a941.jpg`} />

      {/* Uvod */}
      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-white/65 leading-relaxed text-center max-w-2xl mx-auto">
            V našem strelskem društvu stremimo k povezanosti med člani in zaposlenimi ter se trudimo graditi skupnost, ki ostaja povezana tudi izven strelišča.
          </p>
        </div>
      </section>

      {/* Ugodnosti */}
      <section className="py-16" style={{ background: "#0a0c10" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-black text-white mb-7 tracking-wider">Ugodnosti članstva</h2>
              <ul className="space-y-3">
                {ugodnosti.map((u) => (
                  <li key={u} className="flex gap-3 text-sm text-white/70">
                    <span className="mt-0.5 shrink-0 text-lg leading-none" style={{ color: "#3dba8a" }}>✓</span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img src={`${CMS}/tarca_crop_2331f6e603.png`} alt="Tarča" className="rounded-xl w-full object-cover" style={{ maxHeight: 400 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Galerija */}
      <section className="py-14" style={{ background: "#0d0f14" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {gallery.map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden aspect-square">
                <img src={img} alt={`Galerija ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Podatki o društvu */}
      <section className="py-14" style={{ background: "#0a0c10" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-black text-white mb-6 tracking-wider">Podatki o društvu</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {drustvo.map(({ label, value }, i) => (
              <div key={label} className={`flex justify-between px-5 py-3.5 text-sm ${i % 2 === 0 ? "" : ""}`} style={{ background: i % 2 === 0 ? "#131720" : "#0f1319" }}>
                <span className="text-white/45">{label}</span>
                <span className="text-white/85 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#131720" }}>
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-black text-white mb-3">Smo vas prepričali?</h2>
          <p className="text-white/50 text-sm mb-8">Za včlanitev ali dodatne informacije nas kontaktirajte!</p>
          <Link href="/kontakt" className="inline-block px-8 py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110" style={{ background: "#3dba8a" }}>
            Kontaktiraj nas
          </Link>
        </div>
      </section>
    </>
  );
}
