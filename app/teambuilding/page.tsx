import PageHero from "@/components/PageHero";
import Link from "next/link";

const CMS = "https://cms.strelisce-maribor.si/uploads";

const activities = [
  { title: "Lasermaxx streljanje", desc: "Laser tag – zabavno tekmovanje za celotno ekipo brez nevarnosti", image: `${CMS}/medium_teambuilding_laserski_cfcbee4160.png` },
  { title: "NERF streljanje", desc: "Hitro in dinamično – idealno za ekipne igre", image: `${CMS}/medium_teambuilding_jopici_9e011129c7.jpeg` },
  { title: "XXL namizni nogomet", desc: "Velikansko igrišče za pravo ekipno vzdušje", image: `${CMS}/medium_teambuilding_xxl_b64ec751a2.png` },
  { title: "Streljanje z orožjem", desc: "Preizkusite se s pravim orožjem pod nadzorom inštruktorja", image: `${CMS}/medium_teambuilding_streljanje_99b197ed70.png` },
  { title: "Biljard", desc: "Za sproščen del dneva po intenzivnih aktivnostih", image: `${CMS}/medium_teambuilding_biljard_8c0af9aed6.jpg` },
  { title: "Kafana & pogostitev", desc: "Prijetno vzdušje in catering za zaključek dneva", image: `${CMS}/medium_teambuilding_kafana_37405f8d3c.jpeg` },
];

const clients = [
  { name: "Comtrade Gaming", logo: `${CMS}/thumbnail_comtrade_gaming_e5e2287c83.png` },
  { name: "Polak", logo: `${CMS}/thumbnail_POLAK_1d34d4a82d.png` },
  { name: "Halder Slovenija", logo: `${CMS}/thumbnail_Halder_Slovenija_d72529c650.jpg` },
  { name: "SIPRA", logo: `${CMS}/thumbnail_SIPRA_4b04e4a0f2.png` },
  { name: "Instalacije Reisman", logo: `${CMS}/thumbnail_Instalacije_Reisman_24f3b435a6.png` },
  { name: "nChain", logo: `${CMS}/nchain_0989b60fc3.png` },
  { name: "Realtronik", logo: `${CMS}/thumbnail_realtronik_logo_black_orange_1_d2dac602bf.png` },
  { name: "VTI", logo: `${CMS}/thumbnail_LOGO_VTI_1_af0bb78394.png` },
  { name: "Agiledrop", logo: `${CMS}/thumbnail_agiledrop_logo_4_36e663984d.png` },
  { name: "Meltal", logo: `${CMS}/thumbnail_MELTAL_976bb2addc.png` },
  { name: "Bragg", logo: `${CMS}/bragg_329ee42990.png` },
];

export default function TeambuildingPage() {
  return (
    <>
      <PageHero title="TEAMBUILDINGI" image={`${CMS}/large_teambuilding_top_c209909a44.png`} />

      {/* Uvod */}
      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-5 tracking-wider">PESTRA PONUDBA ZA VSAKO EKIPO!</h2>
          <p className="text-white/60 leading-relaxed text-sm">
            Gradnja ekip je izziv, ki ga v našem centru rešujemo z zelo raznolikimi športnimi aktivnostmi. Zavedamo se, da dobro organiziran teambuilding odločilno vpliva na odnose znotraj podjetja in pripomore k boljši storilnosti ter dobremu počutju zaposlenih.
          </p>
        </div>
      </section>

      {/* Aktivnosti */}
      <section className="py-16" style={{ background: "#0a0c10" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <div key={act.title} className="rounded-xl overflow-hidden" style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="h-48 overflow-hidden">
                  <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white mb-2">{act.title}</h3>
                  <p className="text-sm text-white/55">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Podjetja */}
      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-black text-white mb-10 text-center tracking-wider">Podjetja, ki nam zaupajo</h2>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {clients.map((c) => (
              <div key={c.name} className="rounded-lg p-3 flex items-center justify-center" style={{ background: "#131720", width: 100, height: 60 }}>
                <img src={c.logo} alt={c.name} className="max-h-9 max-w-full object-contain filter brightness-75 hover:brightness-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#131720" }}>
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-black text-white mb-3">Zainteresirani? Imate še kakšno vprašanje?</h2>
          <p className="text-white/55 text-sm mb-8">Kontaktirajte nas in z veseljem vam pomagamo sestaviti popoln teambuilding!</p>
          <Link href="/kontakt" className="inline-block px-8 py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110" style={{ background: "#3dba8a" }}>
            Kontaktiraj nas
          </Link>
        </div>
      </section>
    </>
  );
}
