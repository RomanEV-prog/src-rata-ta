import PageHero from "@/components/PageHero";
import Link from "next/link";

const CMS = "https://cms.strelisce-maribor.si/uploads";

const courses = [
  {
    title: "Usposabljanje za varno ravnanje z orožjem",
    desc: "Dvodni tečaj za pridobitev potrdila o varnem ravnanju z orožjem. Pogoj za pridobitev dovoljenja za nošnjo orožja.",
    duration: "2 dni",
    price: "195 €/osebo",
    highlight: true,
  },
  {
    title: "Preizkus znanja VRO",
    desc: "Pisni in praktični preizkus znanja o varnem ravnanju z orožjem.",
    duration: "2–3 ure",
    price: "50 €/osebo",
    highlight: false,
  },
];

export default function UsposabljanjaPage() {
  return (
    <>
      <PageHero title="IZOBRAŽEVANJA" image={`${CMS}/large_unnamed_1_9dcf6fba48.jpg`} />

      <section className="py-16" style={{ background: "#0d0f14" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-2xl font-black text-white mb-4 tracking-wider">ZAKONSKO USPOSABLJANJE</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              V skladu z zakonodajo izvajamo usposabljanja za varno ravnanje z orožjem, ki so pogoj za pridobitev dovoljenja za nošnjo orožja v Republiki Sloveniji.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            {courses.map((c) => (
              <div
                key={c.title}
                className="rounded-xl p-7 flex flex-col"
                style={{
                  background: c.highlight ? "rgba(61,186,138,0.08)" : "#131720",
                  border: `1px solid ${c.highlight ? "rgba(61,186,138,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <h3 className="font-bold text-white mb-3">{c.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed flex-1">{c.desc}</p>
                <div className="mt-5 pt-4 border-t border-white/10 flex justify-between text-sm">
                  <span className="text-white/45">{c.duration}</span>
                  <span className="font-bold" style={{ color: "#3dba8a" }}>{c.price}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-6" style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-bold text-white mb-3">Prihajajoči termini</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-white/70">21.02.2026 – 22.02.2026</span>
                <span style={{ color: "#3dba8a" }}>08:30 – 16:00</span>
              </div>
            </div>
            <div className="mt-5">
              <Link href="/kontakt" className="inline-block px-6 py-2.5 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110" style={{ background: "#7a8cc9" }}>
                Prijava na usposabljanje
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
