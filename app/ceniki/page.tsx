import PageHero from "@/components/PageHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ceniki",
  description: "Cenik najema strelnih linij, inštruktorja in usposabljanj na strelišču ŠRC Ra-Ta-Ta Maribor.",
};

const CMS = "https://cms.strelisce-maribor.si/uploads";

const strelisceItems = [
  { title: "Prisotnost inštruktorja", subtitle: "Prisotnost inštruktorja ob streljanju", price: "37", unit: "/osebo" },
  { title: "Najem strelne linije", subtitle: "Najem ene strelne linije", price: "43", unit: "/uro" },
  { title: "Najem strelišča (8 linij)", subtitle: "Najem vseh osmih strelnih linij", price: "149", unit: "/uro" },
  { title: "Najem strelišča (8 linij)", subtitle: "Najem vseh osmih strelnih linij za 4 ure", price: "447", unit: "/4h" },
];

const usposabljanjeItems = [
  { title: "Osnovno usposabljanje", subtitle: "Usposabljanje za varno ravnanje z orožjem", price: "195", unit: "/osebo" },
  { title: "Preizkus znanja", subtitle: "Pisni in praktični preizkus", price: "50", unit: "/osebo" },
  { title: "Individualne inštrukcije", subtitle: "Ena ura z osebnim inštruktorjem", price: "65", unit: "/uro" },
];

function PriceCard({ title, subtitle, price, unit }: { title: string; subtitle: string; price: string; unit: string }) {
  return (
    <div className="rounded-xl p-6 flex justify-between items-center" style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div>
        <div className="font-semibold text-white text-sm">{title}</div>
        <div className="text-xs text-white/45 mt-0.5">{subtitle}</div>
      </div>
      <div className="text-right ml-6 shrink-0">
        <span className="text-3xl font-black text-white">{price}</span>
        <span className="text-xs text-white/40 ml-1">{unit}</span>
      </div>
    </div>
  );
}

export default function CenikiPage() {
  return (
    <>
      <PageHero title="CENIKI" image={`${CMS}/streljanje_paket_1_d3d05c1560.png`} />

      <section className="py-20" style={{ background: "#0d0f14" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Strelišče */}
          <div className="mb-14">
            <h2 className="text-xl font-black text-white mb-6 tracking-wider">Strelišče</h2>
            <div className="space-y-3">
              {strelisceItems.map((item) => (
                <PriceCard key={item.title + item.price} {...item} />
              ))}
            </div>
          </div>

          {/* Usposabljanja */}
          <div>
            <h2 className="text-xl font-black text-white mb-6 tracking-wider">Usposabljanja</h2>
            <div className="space-y-3">
              {usposabljanjeItems.map((item) => (
                <PriceCard key={item.title + item.price} {...item} />
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30 mt-10 text-center">
            Cene so informativne in se lahko spremenijo. Za aktualne cene nas kontaktirajte.
          </p>
        </div>
      </section>
    </>
  );
}
