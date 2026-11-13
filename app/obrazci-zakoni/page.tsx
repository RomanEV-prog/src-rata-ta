import type { Metadata } from "next";
import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Obrazci in zakonodaja | ŠRC Ra-Ta-Ta",
  description: "Prijavnica in pravila Zimske lige Fenix, izjava o zasebnosti ter zakonodaja o orožju.",
};

const OBRAZCI = [
  {
    naslov: "Prijavnica na Zimsko ligo Fenix",
    opis: "Uradna prijavnica SD Fenix (PDF). Prijavo lahko oddate tudi prek spleta.",
    href: `${BP}/prijavnica-liga-fenix.pdf`,
    gumb: "Prenesi PDF",
    zunanja: false,
  },
  {
    naslov: "Pravila Zimske lige Fenix 2026/2027",
    opis: "Pravila tekmovanja, discipline in točkovanje (PDF).",
    href: `${BP}/pravila-zimske-lige-fenix.pdf`,
    gumb: "Prenesi PDF",
    zunanja: false,
  },
  {
    naslov: "Izjava o zasebnosti",
    opis: "Kako ŠRC Ra-Ta-Ta ravna z osebnimi podatki (PDF).",
    href: "https://funpark.si/IZJAVA%20O%20ZASEBNOSTI%20%C5%A0RC%20Ra-ta-ta.pdf",
    gumb: "Odpri",
    zunanja: true,
  },
];

const ZAKONODAJA = [
  {
    naslov: "Zakon o orožju (ZOro-1)",
    opis: "Veljavno besedilo zakona v Pravno-informacijskem sistemu RS.",
    href: "https://pisrs.si/pregledPredpisa?id=ZAKO1592",
  },
];

export default function ObrazciZakoniPage() {
  return (
    <section className="pt-28 pb-20" style={{ background: "#0d0f14", minHeight: "70vh" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wider uppercase mb-2">
          Obrazci in zakonodaja
        </h1>
        <div className="w-16 h-1 rounded-full mb-10" style={{ background: "#3dba8a" }} />

        <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Obrazci</h2>
        <div className="space-y-3 mb-12">
          {OBRAZCI.map((o) => (
            <div
              key={o.naslov}
              className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{o.naslov}</div>
                <div className="text-white/45 text-xs mt-1 leading-relaxed">{o.opis}</div>
              </div>
              <a
                href={o.href}
                {...(o.zunanja ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white text-center whitespace-nowrap transition-all hover:brightness-110"
                style={{ background: "#4f6bbd" }}
              >
                {o.gumb}
              </a>
            </div>
          ))}
        </div>

        <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Zakonodaja</h2>
        <div className="space-y-3 mb-12">
          {ZAKONODAJA.map((z) => (
            <a
              key={z.naslov}
              href={z.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl p-5 transition-colors hover:bg-white/5"
              style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-white font-semibold text-sm">{z.naslov} →</div>
              <div className="text-white/45 text-xs mt-1 leading-relaxed">{z.opis}</div>
            </a>
          ))}
        </div>

        <p className="text-sm text-white/40">
          Potrebujete drug obrazec ali imate vprašanje?{" "}
          <Link href="/kontakt" className="font-semibold hover:underline" style={{ color: "#7a8cc9" }}>
            Pišite nam
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
