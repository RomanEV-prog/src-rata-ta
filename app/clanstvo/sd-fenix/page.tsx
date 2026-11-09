'use client'
import { useState } from 'react'
import Link from 'next/link'

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const API = 'https://rangeos-api.adlerhub.eu'

const DISCIPLINE = [
  'Pištola standardna',
  'Pištola brzostrelnost',
  'Pištola Service',
  'Puška standardna',
  'Puška 10m',
  'Revolverist',
  'Drugo',
]

function isoToMs(iso: string): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return isNaN(ms) ? null : ms
}

export default function SdFenixPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', society: '', discipline: '', note: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [pravilaPrebrana, setPravilaPrebrana] = useState(false)

  const inp = 'w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function oddaj() {
    setErr('')
    if (!form.first_name || !form.last_name || !form.email) {
      setErr('Ime, priimek in e-mail so obvezni.'); return
    }
    if (!pravilaPrebrana) {
      setErr('Pred oddajo prijavnice morate potrditi, da ste prebrali pravila lige.'); return
    }
    setSending(true)
    try {
      const r = await fetch(`${API}/public/league-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date_of_birth: isoToMs(form.date_of_birth),
        }),
      })
      const b = await r.json()
      if (!b.ok) { setErr(b.message ?? 'Napaka'); return }
      setDone(true)
    } catch { setErr('Strežnik ni dosegljiv. Pokliči nas.') }
    finally { setSending(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d0f14' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">

        {/* Glava */}
        <div className="flex items-center gap-4 mb-10">
          <img src={`${BP}/logos/fenix.jpg`} alt="SD Fenix"
               className="w-20 h-20 rounded-2xl object-contain"
               style={{ background: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">SD Fenix</h1>
            <p className="text-white/50 mt-1">Strelsko društvo · Maribor</p>
          </div>
        </div>

        {/* Info */}
        <div className="mb-12 p-6 rounded-2xl space-y-3 text-white/70 text-sm leading-relaxed"
             style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p>
            SD Fenix je strelsko društvo, ki deluje v okviru ŠRC Ra-Ta-Ta. Organiziramo
            strelske lige, tekmovanja in usposabljanja za varno ravnanje z orožjem.
          </p>
          <p>
            Spodaj se lahko prijaviš na strelsko ligo ali nam pustiš svoje podatke in
            te kontaktiramo z vsemi informacijami.
          </p>
        </div>

        {/* PDF dokumenti */}
        <div className="mb-8 flex flex-wrap gap-3">
          <a
            href={`${BP}/prijavnica-liga-fenix.pdf`}
            download="PRIJAVNICA LIGA FENIX.pdf"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: '#3dba8a' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Prenesi prijavnico (PDF)
          </a>
          <a
            href={`${BP}/pravila-zimske-lige-fenix.pdf`}
            download="Pravila Zimske lige Fenix 2026-2027.pdf"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: '#7a8cc9' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Pravila Zimske lige (PDF)
          </a>
        </div>

        {/* Forma */}
        {done ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-6">✅</div>
            <h2 className="text-white font-black text-2xl mb-3">Prijava prejeta!</h2>
            <p className="text-white/50 mb-8">Kontaktirali te bomo v kratkem.</p>
            <Link href="/" className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ background: '#4f6bbd' }}>
              Nazaj na domačo stran
            </Link>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.25)' }}>
            <h2 className="text-white font-black text-xl mb-6">Prijava na ligo</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Ime *</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Priimek *</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">E-mail *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Datum rojstva</label>
                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Društvo</label>
                <input value={form.society} onChange={e => set('society', e.target.value)}
                       placeholder="npr. SD Fenix, brez društva…" className={inp} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Disciplina</label>
                <select value={form.discipline} onChange={e => set('discipline', e.target.value)} className={inp} style={inpStyle}>
                  <option value="">— izberi —</option>
                  {DISCIPLINE.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Opomba</label>
                <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)}
                          className={inp + ' resize-none'} style={inpStyle} />
              </div>
            </div>

            {/* Pravila + checkbox */}
            <div className="mb-5 p-4 rounded-xl" style={{ background: '#0d0f14', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#7a8cc9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-white/70 text-xs leading-relaxed mb-2">
                    Pred oddajo prijavnice si preberite pravila Zimske lige Fenix 2026/2027.
                  </p>
                  <a
                    href={`${BP}/pravila-zimske-lige-fenix.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all hover:brightness-125"
                    style={{ color: '#7a8cc9' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Odpri pravila (PDF)
                  </a>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={pravilaPrebrana}
                  onChange={e => setPravilaPrebrana(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded accent-blue-500 cursor-pointer"
                />
                <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                  Prebral/a sem pravila Zimske lige Fenix 2026/2027 in se z njimi strinjam.
                </span>
              </label>
            </div>

            {err && <p className="text-red-400 text-xs mb-4">{err}</p>}

            <button onClick={oddaj} disabled={sending || !pravilaPrebrana}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 hover:brightness-110 transition-all"
                    style={{ background: '#4f6bbd' }}>
              {sending ? 'Pošiljam…' : 'Pošlji prijavo'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
