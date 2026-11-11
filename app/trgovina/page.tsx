import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trgovina — kmalu | ŠRC Ra-Ta-Ta",
  description: "Spletna trgovina ŠRC Ra-Ta-Ta je v pripravi. Kmalu na voljo.",
};

export default function TrgovinaPage() {
  return (
    <section
      className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 pt-24 pb-24"
      style={{ background: "#0d0f14" }}
    >
      <div className="max-w-xl text-center">
        {/* Ikona tarče */}
        <div className="flex justify-center mb-8">
          <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#3dba8a" strokeWidth="1.5" opacity="0.5" />
            <circle cx="12" cy="12" r="6" stroke="#7a8cc9" strokeWidth="1.5" opacity="0.6" />
            <circle cx="12" cy="12" r="2.5" fill="#e05c5c" />
          </svg>
        </div>

        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
          style={{ color: "#3dba8a" }}
        >
          Spletna trgovina
        </p>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-5 tracking-wide">
          Zavihek je v obdelavi
        </h1>
        <p className="text-white/60 leading-relaxed text-base sm:text-lg mb-10">
          Pridno delamo na spletni trgovini ŠRC Ra-Ta-Ta. Kmalu boste lahko tukaj
          naročili opremo in izdelke. Hvala za potrpljenje!
        </p>

        <Link
          href="/"
          className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#e05c5c" }}
        >
          Nazaj na domačo stran
        </Link>
      </div>
    </section>
  );
}
