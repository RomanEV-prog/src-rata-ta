"use client";

import { useState, useEffect } from "react";

const API = "https://rangeos-api.adlerhub.eu";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const DNEVI =["PONEDELJEK", "TOREK", "SREDA", "ČETRTEK", "PETEK", "SOBOTA", "NEDELJA"];
const FALLBACK_HOURS = [
  { day: "PONEDELJEK", time: "ZAPRTO" },
  { day: "TOREK", time: "10:00–13:00 in 15:00–20:00" },
  { day: "SREDA – PETEK", time: "15:00–20:00" },
  { day: "SOBOTA", time: "13:30–20:00" },
  { day: "NEDELJA IN PRAZNIKI", time: "ZAPRTO" },
];

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
interface RangeDay { weekday: number; isOpen: boolean; openMin: number; closeMin: number; open2Min: number | null; close2Min: number | null; }
function apiToRows(days: RangeDay[]): { day: string; time: string }[] {
  const rows: { day: string; time: string }[] = [];
  let i = 0;
  while (i < days.length) {
    const d = days[i];
    const time = !d.isOpen ? "ZAPRTO" : d.open2Min != null ? `${hhmm(d.openMin)}–${hhmm(d.closeMin)} in ${hhmm(d.open2Min)}–${hhmm(d.close2Min!)}` : `${hhmm(d.openMin)}–${hhmm(d.closeMin)}`;
    let j = i + 1;
    while (j < days.length) {
      const n = days[j];
      const nt = !n.isOpen ? "ZAPRTO" : n.open2Min != null ? `${hhmm(n.openMin)}–${hhmm(n.closeMin)} in ${hhmm(n.open2Min)}–${hhmm(n.close2Min!)}` : `${hhmm(n.openMin)}–${hhmm(n.closeMin)}`;
      if (nt !== time) break;
      j++;
    }
    const dayLabel = j - i > 1 ? `${DNEVI[d.weekday]} – ${DNEVI[days[j - 1].weekday]}` : DNEVI[d.weekday];
    rows.push({ day: dayLabel, time });
    i = j;
  }
  return rows;
}

export default function KontaktPage() {
  // `website` je past za robote (skrito polje) — človek ga ne izpolni.
  const [form, setForm] = useState({ ime: "", priimek: "", email: "", telefon: "", zadeva: "Paketi", sporocilo: "", website: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [hours, setHours] = useState(FALLBACK_HOURS);

  useEffect(() => {
    fetch(`${API}/public/hours`)
      .then((r) => r.json())
      .then((body) => { if (body.ok && Array.isArray(body.data) && body.data.length > 0) setHours(apiToRows(body.data)); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({ ok: false }));
      if (res.ok && body.ok) setSent(true);
      else setErr(body.message || "Pošiljanje ni uspelo. Pokličite nas na 041 207 997.");
    } catch {
      setErr("Pošiljanje ni uspelo. Preverite povezavo ali nas pokličite na 041 207 997.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Map placeholder + hero */}
      <div className="relative pt-14">
        {/* Brez vgrajenega zemljevida (CSP strani ne dovoli tujih okvirjev) — povezava na navigacijo. */}
        <div className="w-full py-14 px-4 flex flex-col items-center justify-center gap-4 text-center" style={{ background: "#131720", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-white font-semibold">Ulica heroja Šaranovića 36, 2000 Maribor</div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Ulica+heroja+%C5%A0aranovi%C4%87a+36%2C+2000+Maribor"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "#4f6bbd" }}
          >
            Odpri v Google Zemljevidih →
          </a>
        </div>
      </div>

      <section className="py-20" style={{ background: "#0d0f14" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14">

            {/* Forma */}
            <div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-wider">Kontaktiraj nas!</h1>
              <p className="text-white/50 text-sm mb-8">Z veseljem vam bomo svetovali in pomagali!</p>

              {sent ? (
                <div className="rounded-xl p-8 text-center" style={{ background: "#131720" }}>
                  <div className="text-4xl mb-4">✓</div>
                  <div className="text-white font-semibold">Sporočilo poslano!</div>
                  <div className="text-white/50 text-sm mt-2">Javili se vam bomo v najkrajšem možnem času.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Ime *</label>
                      <input
                        required
                        value={form.ime}
                        onChange={e => setForm(f => ({ ...f, ime: e.target.value }))}
                        className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-teal-400"
                        style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Priimek *</label>
                      <input
                        required
                        value={form.priimek}
                        onChange={e => setForm(f => ({ ...f, priimek: e.target.value }))}
                        className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1"
                        style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">E-mail *</label>
                    <input
                      required type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Telefon *</label>
                    <input
                      required type="tel"
                      value={form.telefon}
                      onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Zadeva</label>
                    <select
                      value={form.zadeva}
                      onChange={e => setForm(f => ({ ...f, zadeva: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <option>Usposabljanja</option>
                      <option>Teambuildingi</option>
                      <option>Paketi</option>
                      <option>Drugo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Sporočilo</label>
                    <textarea
                      rows={4}
                      value={form.sporocilo}
                      onChange={e => setForm(f => ({ ...f, sporocilo: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none resize-none"
                      style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  {/* Past za robote: skrito pred ljudmi in bralniki zaslona */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                  />
                  {err && <p className="text-sm" style={{ color: "#e07a7a" }}>{err}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: "#7a8cc9" }}
                  >
                    {sending ? "Pošiljam…" : "Pošlji"}
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="space-y-10">
              <div>
                <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-5">Delovni čas</h3>
                <div className="space-y-2.5">
                  {hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-white/55">{day}</span>
                      <span className={`font-semibold ${time === "ZAPRTO" ? "text-white/25" : "text-white/90"}`}>{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-5">Kontakti</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-white/40">Ivan </span><a href="tel:041207997" className="text-white/80 hover:text-white">041 207 997</a></div>
                  <div><span className="text-white/40">ŠRC </span><a href="mailto:src.ratata@gmail.com" className="text-white/80 hover:text-white">src.ratata@gmail.com</a></div>
                  <div><span className="text-white/40">Fenix </span><a href="mailto:feniks.sd01@gmail.com" className="text-white/80 hover:text-white">feniks.sd01@gmail.com</a></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-3">Naslov</h3>
                <p className="text-sm text-white/60">Ulica heroja Šaranovića 36<br />2000 Maribor</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
