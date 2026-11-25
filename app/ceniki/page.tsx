import PageHero from "@/components/PageHero";
import PackagesPriceList from "@/components/PackagesPriceList";
import PriceList from "@/components/PriceList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ceniki",
  description: "Cenik paketov streljanja, najema strelnih linij, inštruktorja in usposabljanj na strelišču ŠRC Ra-Ta-Ta Maribor.",
};

const CMS = "https://cms.strelisce-maribor.si/uploads";

export default function CenikiPage() {
  return (
    <>
      <PageHero title="CENIKI" image={`${CMS}/streljanje_paket_1_d3d05c1560.png`} />

      <section className="py-20" style={{ background: "#0d0f14" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Paketi — isti vir kot /paketi (Supabase), zato vedno usklajeno */}
          <div className="mb-14">
            <h2 className="text-xl font-black text-white mb-6 tracking-wider">Paketi streljanja</h2>
            <PackagesPriceList />
          </div>

          {/* Ostali razdelki — Supabase `price_items`, ureja se v /admin/cenik */}
          <PriceList />

          <p className="text-xs text-white/30 text-center">
            Cene so informativne in se lahko spremenijo. Za aktualne cene nas kontaktirajte.
          </p>
        </div>
      </section>
    </>
  );
}
