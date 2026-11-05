import PageHero from "@/components/PageHero";

const CMS = "https://cms.strelisce-maribor.si/uploads";

const teamMembers = [
  { name: "Jure Razgoršek", role: "Direktor", image: `${CMS}/o_nas_t1_6c3ffa282d.jpg` },
  { name: "Janko Razgoršek", role: "Inštruktor", image: `${CMS}/o_nas_t2_2a1dbf4816.jpg` },
  { name: "Ivan Barbirić", role: "Vodja strelišča", image: `${CMS}/o_nas_mi_d8fa623499.jpg` },
  { name: "Ana Soršak", role: "Administrativni vodja", image: `${CMS}/o_nas_strelec_942a34ee7c.jpeg` },
];

const sections = [
  {
    title: "KDO SMO?",
    text: "Smo civilno strelišče, ki z dovoljenjem Ministrstva za notranje zadeve obratuje že od 25.4.2013. Ponašamo se z osmimi strelnimi mesti – vsako je opremljeno z elektronskim kontrolnikom za pomik tarč na razdaljah med 5 in 25 metrov, poljubno osvetlitvijo, prostorno mizo za opremo strelca, ločena so s pregradnimi stenami, oblazinjenimi z izolacijo zvoka ter opremljena z neprobojnim steklom.",
    image: `${CMS}/o_nas_mi_d8fa623499.jpg`,
  },
  {
    title: "MODERNO STRELIŠČE ZA MODERNE LJUDI",
    text: "Strelišče je moderno zasnovano – zvočno izolirano ter od poslovnega prostora ločeno z neprebojnim steklom, kar poleg varnosti omogoča pogled na dogajanje na strelišču iz našega lokala. Nastavljiv prezračevalni sistem skrbi za dobro počutje strelca tudi ob polni zasedenosti strelišča. Vse tarče so na razdalji 25 metrov dodatno osvetljene po pravilih ISSF.",
    image: `${CMS}/o_nas_2_f7a469bf2f.jpg`,
    reverse: true,
  },
  {
    title: "DELIMO ZNANJE",
    text: "Izvajamo usposabljanja za varno ravnanje z orožjem ter tečaje za pridobitev dovoljenja za nošnjo orožja. Naši inštruktorji imajo bogate izkušnje tako v tekmovalnem streljanju kot v pedagoškem delu.",
    image: `${CMS}/razlaga_9baec33d7f.png`,
  },
  {
    title: "VEČ KOT SAMO STRELIŠČE",
    text: "Poleg streljanja nudimo teambuilding pakete za podjetja, organiziramo tekmovanja in izobraževanja. V baru z neposrednim pogledom na strelišče se po streljanju povežite s sotekmovalci ob prijetni kavi ali pijači.",
    image: `${CMS}/clanstvo_tekmovanje_0d2cf1a941.jpg`,
    reverse: true,
  },
];

export default function ONasPage() {
  return (
    <>
      <PageHero title="O NAS" image={`${CMS}/o_nas_mi_d8fa623499.jpg`} />

      {/* Sekcije */}
      <div style={{ background: "#0d0f14" }}>
        {sections.map((s, i) => (
          <section key={s.title} className="py-16 border-b border-white/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className={`flex flex-col md:flex-row gap-12 items-center ${s.reverse ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-white mb-4 tracking-wider">{s.title}</h2>
                  <p className="text-white/60 leading-relaxed text-sm">{s.text}</p>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden" style={{ maxHeight: 320 }}>
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover" style={{ maxHeight: 320 }} />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Tim */}
      <section className="py-20" style={{ background: "#0a0c10" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-white mb-12 text-center tracking-wider">SPOZNAJTE NAŠ TIM</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {teamMembers.map((m) => (
              <div key={m.name} className="text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-3 border-2" style={{ borderColor: "#3dba8a" }}>
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="font-semibold text-white text-sm">{m.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#3dba8a" }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
