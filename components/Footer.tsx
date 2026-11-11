'use client'
import Link from "next/link";
import { useEffect, useState } from "react";
import NewsletterSignup from "@/components/NewsletterSignup";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const API = "https://rangeos-api.adlerhub.eu";

const DNEVI = ["PONEDELJEK", "TOREK", "SREDA", "ČETRTEK", "PETEK", "SOBOTA", "NEDELJA"];

// Fallback ko API ni dosegljiv
const FALLBACK = [
  { day: "PONEDELJEK", time: "ZAPRTO" },
  { day: "TOREK", time: "10:00–13:00 in 15:00–20:00" },
  { day: "SREDA – PETEK", time: "15:00–20:00" },
  { day: "SOBOTA", time: "13:30–20:00" },
  { day: "NEDELJA IN PRAZNIKI", time: "ZAPRTO" },
];

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

interface RangeDay {
  weekday: number;
  isOpen: boolean;
  openMin: number;
  closeMin: number;
  open2Min: number | null;
  close2Min: number | null;
}

function apiToRows(days: RangeDay[]): { day: string; time: string }[] {
  // Združi consecutive dneve z enakim urnikom (npr. Sreda–Petek)
  const rows: { day: string; time: string }[] = [];
  let i = 0;
  while (i < days.length) {
    const d = days[i];
    const time = !d.isOpen
      ? "ZAPRTO"
      : d.open2Min != null
      ? `${hhmm(d.openMin)}–${hhmm(d.closeMin)} in ${hhmm(d.open2Min)}–${hhmm(d.close2Min!)}`
      : `${hhmm(d.openMin)}–${hhmm(d.closeMin)}`;

    // Preveri ali naslednji dnevi imajo enak urnik
    let j = i + 1;
    while (j < days.length) {
      const n = days[j];
      const nt = !n.isOpen
        ? "ZAPRTO"
        : n.open2Min != null
        ? `${hhmm(n.openMin)}–${hhmm(n.closeMin)} in ${hhmm(n.open2Min)}–${hhmm(n.close2Min!)}`
        : `${hhmm(n.openMin)}–${hhmm(n.closeMin)}`;
      if (nt !== time) break;
      j++;
    }

    const dayLabel =
      j - i > 1
        ? `${DNEVI[d.weekday]} – ${DNEVI[days[j - 1].weekday]}`
        : DNEVI[d.weekday];

    rows.push({ day: dayLabel, time });
    i = j;
  }
  return rows;
}

export default function Footer() {
  const [hours, setHours] = useState(FALLBACK);

  useEffect(() => {
    fetch(`${API}/public/hours`)
      .then((r) => r.json())
      .then((body) => {
        if (body.ok && Array.isArray(body.data) && body.data.length > 0) {
          setHours(apiToRows(body.data));
        }
      })
      .catch(() => {/* ostane fallback */});
  }, []);

  return (
    <footer style={{ background: "#0a0c10", borderTop: "1px solid rgba(255,255,255,0.07)" }} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Prijava na novice */}
        <div className="mb-12 pb-12 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:flex-1">
            <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-2">Novice & obvestila</h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-md">
              Prijavite se in prejmite obvestilo ob novih dogodkih, izobraževanjih in novostih strelišča.
            </p>
          </div>
          <div className="md:flex-1 md:max-w-md w-full">
            <NewsletterSignup />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Delovni čas */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-5">Delovni čas</h3>
            <div className="space-y-2.5">
              {hours.map(({ day, time }) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-white/60 font-medium">{day}</span>
                  <span className={`font-semibold ${time === "ZAPRTO" ? "text-white/30" : "text-white/90"}`}>{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logo + social */}
          <div className="flex flex-col items-center gap-5">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BP}/logo.png`} alt="ŠRC Ra-Ta-Ta" width={48} height={48} className="object-contain" />
            </Link>
            <div className="flex gap-5">
              <Link href="https://www.facebook.com/src.ratata" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="https://www.instagram.com/src.ratata/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                  <circle cx="12" cy="12" r="4" strokeWidth={2} />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </Link>
              <Link href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0a0c10" />
                </svg>
              </Link>
            </div>
            <div className="flex gap-5 text-xs text-white/40 mt-2">
              <Link href="/obrazci-zakoni" className="hover:text-white/70 transition-colors">Obrazci in zakonodaja</Link>
              <Link href="https://funpark.si/IZJAVA%20O%20ZASEBNOSTI%20%C5%A0RC%20Ra-ta-ta.pdf" className="hover:text-white/70 transition-colors">Izjava o zasebnosti</Link>
              <Link href="/kontakt" className="hover:text-white/70 transition-colors">Kontakt</Link>
            </div>
          </div>

          {/* Kontakti */}
          <div className="md:text-right">
            <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-5">Kontakti</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/50">Ivan </span>
                <Link href="tel:041207997" className="text-white/90 hover:text-white transition-colors">041 207 997</Link>
              </div>
              <div>
                <span className="text-white/50">ŠRC </span>
                <Link href="mailto:src.ratata@gmail.com" className="text-white/90 hover:text-white transition-colors">src.ratata@gmail.com</Link>
              </div>
              <div>
                <span className="text-white/50">Fenix </span>
                <Link href="mailto:feniks.sd01@gmail.com" className="text-white/90 hover:text-white transition-colors">feniks.sd01@gmail.com</Link>
              </div>
              <div className="text-white/40 text-xs mt-4">
                Ulica heroja Šaranovića 36<br />2000 Maribor
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-white/25">
          © 2024 ŠRC Ra-Ta-Ta. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
