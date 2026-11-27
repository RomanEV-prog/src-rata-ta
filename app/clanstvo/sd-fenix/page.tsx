'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const BP          = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const API         = 'https://rangeos-api.adlerhub.eu'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Panoge lige. `key` gre v RangeOS (forms[].discipline), `label` je besedilo na strani
 * in hkrati ključ potrditvenega polja v PDF prijavnici (Edge funkcija send-registration).
 */
const PANOGE = [
  { key: 'zacetniki_15m', label: 'Pištola/revolver s središčnim vžigom 15m (samo začetniki)', revolver: false },
  { key: 'pistola_25m',   label: 'Pištola s središčnim vžigom 25m dvoročno', revolver: false },
  { key: 'revolver_25m',  label: 'Revolver s središčnim vžigom 25m enoročno', revolver: true },
  { key: 'standardna_22', label: 'Pištola/revolver standardna cal. .22 L.R., 25m enoročno', revolver: false },
] as const

const VRSTE_LISTIN = ['Orožni list', 'Dovoljenje za posest orožja', 'Orožni posestni list', 'Dovoljenje za zbiranje orožja', 'Evropska orožna prepustnica']
const STRELIVA = ['9x19', '.38 Special', '.357 Magnum', '.22 LR', '.45 ACP', '.40 S&W']

// Lastnik orožja ali streliva. Vrednosti razume RangeOS: »lastno« = strelčevo,
// SD FENIX / ŠRC RA-TA-TA = klubsko (orožje dodeli strelišče), drugo = ime lastnika.
const LASTNIKI = [
  { v: 'lastno', t: 'Lastno' },
  { v: 'SD FENIX', t: 'SD Fenix (klubsko)' },
  { v: 'ŠRC RA-TA-TA', t: 'ŠRC Ra-Ta-Ta (izposojeno)' },
  { v: 'druga', t: 'Druga oseba' },
]

interface Obrazec {
  discipline: string
  targets: string
  weapon_kind: string
  weapon_owner_sel: string
  weapon_owner_name: string
  weapon_model: string
  weapon_serial: string
  permit_type: string
  permit_no: string
  permit_issuer: string
  ammo_type: string
  ammo_owner_sel: string
  ammo_owner_name: string
}

const prazenObrazec = (discipline = ''): Obrazec => ({
  discipline, targets: '1', weapon_kind: discipline === 'revolver_25m' ? 'revolver' : 'pištola',
  weapon_owner_sel: '', weapon_owner_name: '', weapon_model: '', weapon_serial: '',
  permit_type: '', permit_no: '', permit_issuer: '',
  ammo_type: '', ammo_owner_sel: '', ammo_owner_name: '',
})

const lastnikIz = (sel: string, ime: string) => (sel === 'druga' ? ime.trim() : sel)
const jeKlubsko = (sel: string) => sel === 'SD FENIX' || sel === 'ŠRC RA-TA-TA'
const panogaIme = (key: string) => PANOGE.find(p => p.key === key)?.label ?? key

function isoToMs(iso: string): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return isNaN(ms) ? null : ms
}

/** Ista pravila kot `manjkaVSpletniPrijavi` v RangeOS — strelec vidi manjkajoče že pred oddajo. */
function manjka(form: { phone: string; address_street: string; address_post: string; address_country: string }, obrazci: Obrazec[]): string[] {
  const m: string[] = []
  const z = (v: string, ime: string) => { if (!v.trim()) m.push(ime) }
  z(form.phone, 'telefon')
  z(form.address_street, 'ulica in hišna številka')
  z(form.address_post, 'pošta')
  z(form.address_country, 'država')
  if (obrazci.length === 0) m.push('vsaj ena panoga')
  obrazci.forEach((o, i) => {
    const kje = ` (${o.discipline ? panogaIme(o.discipline) : `panoga ${i + 1}`})`
    if (!o.discipline) m.push(`panoga ${i + 1}`)
    const t = Number(o.targets)
    if (!Number.isInteger(t) || t < 1 || t > 20) m.push('število tarč 1–20' + kje)
    z(o.weapon_kind, 'vrsta orožja' + kje)
    z(lastnikIz(o.weapon_owner_sel, o.weapon_owner_name), 'lastnik orožja' + kje)
    z(o.ammo_type, 'strelivo' + kje)
    z(lastnikIz(o.ammo_owner_sel, o.ammo_owner_name), 'lastnik streliva' + kje)
    if (o.weapon_owner_sel && !jeKlubsko(o.weapon_owner_sel)) {
      z(o.weapon_model, 'znamka in model orožja' + kje)
      z(o.weapon_serial, 'tovarniška številka orožja' + kje)
    }
    if (o.weapon_owner_sel === 'lastno') {
      z(o.permit_type, 'vrsta orožne listine' + kje)
      z(o.permit_no, 'številka orožne listine' + kje)
      z(o.permit_issuer, 'izdajatelj orožne listine' + kje)
    }
  })
  return m
}

export default function SdFenixPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', society: '', note: '', preferred_time: '',
    address_street: '', address_post: '', address_country: 'Slovenija',
  })
  const [obrazci, setObrazci] = useState<Obrazec[]>([prazenObrazec()])
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [manjkajoce, setManjkajoce] = useState<string[]>([])
  const [pravilaPrebrana, setPravilaPrebrana] = useState(false)
  const [pravilaOdklenjeno, setPravilaOdklenjeno] = useState(false)
  const [countdown, setCountdown] = useState(20)

  useEffect(() => {
    if (pravilaOdklenjeno) return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          setPravilaOdklenjeno(true)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pravilaOdklenjeno])

  const inp = 'w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }
  const lbl = 'text-xs text-white/40 mb-1 block'
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const setO = (i: number, k: keyof Obrazec, v: string) =>
    setObrazci(p => p.map((o, j) => {
      if (j !== i) return o
      const n = { ...o, [k]: v }
      if (k === 'discipline' && v === 'revolver_25m') n.weapon_kind = 'revolver'
      return n
    }))
  const prostePanoge = (i: number) => PANOGE.filter(p => p.key === obrazci[i].discipline || !obrazci.some(o => o.discipline === p.key))

  async function oddaj() {
    setErr(''); setManjkajoce([])
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setErr('Ime, priimek in e-mail so obvezni.'); return
    }
    const m = manjka(form, obrazci)
    if (m.length) {
      setErr('Prijavnica ni popolna. Izpolnite še:'); setManjkajoce(m); return
    }
    if (!pravilaPrebrana) {
      setErr('Pred oddajo prijavnice morate potrditi, da ste prebrali pravila lige.'); return
    }

    const forms = obrazci.map(o => ({
      discipline: o.discipline,
      targets: Number(o.targets),
      weapon_kind: o.weapon_kind,
      weapon_owner: lastnikIz(o.weapon_owner_sel, o.weapon_owner_name),
      weapon_model: jeKlubsko(o.weapon_owner_sel) ? '' : o.weapon_model.trim(),
      weapon_serial: jeKlubsko(o.weapon_owner_sel) ? '' : o.weapon_serial.trim(),
      permit_type: o.weapon_owner_sel === 'lastno' ? o.permit_type : '',
      permit_no: o.weapon_owner_sel === 'lastno' ? o.permit_no.trim() : '',
      permit_issuer: o.weapon_owner_sel === 'lastno' ? o.permit_issuer.trim() : '',
      ammo_type: o.ammo_type.trim(),
      ammo_owner: lastnikIz(o.ammo_owner_sel, o.ammo_owner_name),
    }))
    const tarcSkupaj = forms.reduce((s, f) => s + f.targets, 0)
    const disciplineBesedilo = forms.map(f => panogaIme(f.discipline)).join(', ')

    setSending(true)
    try {
      // 1. Shrani v RangeOS. Nedosegljiv strežnik (PC na strelišču ugasnjen) ne ustavi
      //    oddaje — prijavnica gre še po mejlu. Nepopolno prijavnico RangeOS zavrne (400).
      try {
        const r = await fetch(`${API}/public/league-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            discipline: disciplineBesedilo,
            // starejši RangeOS (pred 0.8.51) obrazcev ne bere — tarče ostanejo vidne v opombi
            note: [`Rezervacija tarč: ${tarcSkupaj}`, form.note.trim()].filter(Boolean).join(' | '),
            date_of_birth: isoToMs(form.date_of_birth),
            forms,
          }),
        })
        const b = await r.json().catch(() => ({ ok: r.ok }))
        if (r.status === 400 && b && b.ok === false) {
          setErr(b.message || 'Prijavnica ni popolna.')
          if (Array.isArray(b.missing)) setManjkajoce(b.missing)
          return
        }
        if (!b.ok) console.warn('rangeos-api:', b.message)
      } catch (e) { console.warn('rangeos-api nedosegljiv:', e) }

      // 2. Izpolnjena prijavnica PDF po mejlu (Supabase Edge Function). PDF ima prostor
      //    za eno orožje — vanj gre prva panoga, vse panoge so v opombi mejla.
      if (SUPABASE_URL) {
        const p = forms[0]
        const povzetek = forms.map(f => [
          panogaIme(f.discipline), `${f.targets} tarč`,
          [f.weapon_kind, f.weapon_model, f.weapon_serial && `št. ${f.weapon_serial}`].filter(Boolean).join(' '),
          `orožje: ${f.weapon_owner}`, f.permit_no && `${f.permit_type} ${f.permit_no}, ${f.permit_issuer}`,
          `strelivo ${f.ammo_type} (${f.ammo_owner})`,
        ].filter(Boolean).join('; ')).join(' || ')
        const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/send-registration`, {
          method: 'POST',
          // Funkcija zahteva veljaven JWT (javni anon ključ zadošča).
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
          },
          body: JSON.stringify({
            first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone,
            date_of_birth: form.date_of_birth, society: form.society,
            discipline: panogaIme(p.discipline),
            targets_qty: String(tarcSkupaj),
            note: [form.preferred_time && `Želena ura: ${form.preferred_time}`, `Panoge: ${povzetek}`, form.note.trim()].filter(Boolean).join(' | '),
            address: form.address_street,
            city: [form.address_post, form.address_country].filter(Boolean).join(', '),
            weapon_permit: [p.permit_type, p.permit_no].filter(Boolean).join(' '),
            permit_issuer: p.permit_issuer,
            weapon_type: p.weapon_kind,
            weapon_serial: [p.weapon_model, p.weapon_serial].filter(Boolean).join(', '),
            weapon_owner: p.weapon_owner === 'lastno' ? `${form.first_name} ${form.last_name}` : p.weapon_owner,
            ammo_qty: String(5 + 10 * p.targets),
            ammo_owner: p.ammo_owner === 'lastno' ? `${form.first_name} ${form.last_name}` : `${p.ammo_owner} (${p.ammo_type})`,
          }),
        })
        const fnBody = await fnRes.json().catch(() => ({ ok: false }))
        // Prej je stran pokazala »Prijava prejeta!« tudi, če mejl s prijavnico
        // ni odšel. Zdaj napako pokažemo, da prijava ne izgine neopaženo.
        if (!fnRes.ok || !fnBody.ok) {
          console.warn('send-registration:', fnBody.message)
          setErr('Prijavnice ni bilo mogoče poslati. Poskusite znova ali nas pokličite na 041 207 997.')
          return
        }
      }

      setDone(true)
    } catch (e) {
      console.error(e)
      setErr('Napaka pri pošiljanju. Pokliči nas.')
    } finally { setSending(false) }
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
            <h2 className="text-white font-black text-xl mb-1">Prijava na ligo</h2>
            <p className="text-xs text-white/40 mb-6">Polja z * so obvezna.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={lbl}>Ime *</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Priimek *</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>E-mail *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Telefon *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Datum rojstva</label>
                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Društvo</label>
                <input value={form.society} onChange={e => set('society', e.target.value)}
                       placeholder="npr. SD Fenix, brez društva…" className={inp} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Ulica in hišna številka *</label>
                <input value={form.address_street} onChange={e => set('address_street', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Poštna številka in pošta *</label>
                <input value={form.address_post} onChange={e => set('address_post', e.target.value)} placeholder="npr. 2000 Maribor" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={lbl}>Država *</label>
                <input value={form.address_country} onChange={e => set('address_country', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Želena ura streljanja na večer lige</label>
                <input type="time" value={form.preferred_time} onChange={e => set('preferred_time', e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>

            {/* Panoge — vsaka s svojim orožjem, strelivom in listino */}
            {obrazci.map((o, i) => {
              const klubsko = jeKlubsko(o.weapon_owner_sel)
              const lastno = o.weapon_owner_sel === 'lastno'
              return (
                <div key={i} className="mb-4 p-4 rounded-xl" style={{ background: '#0f131c', border: '1px solid rgba(122,140,201,0.25)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#7a8cc9' }}>Panoga {i + 1}</span>
                    {obrazci.length > 1 && (
                      <button type="button" onClick={() => setObrazci(p => p.filter((_, j) => j !== i))}
                              className="text-xs text-white/40 hover:text-red-300">Odstrani</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={lbl}>Disciplina *</label>
                      <select value={o.discipline} onChange={e => setO(i, 'discipline', e.target.value)} className={inp} style={inpStyle}>
                        <option value="">— izberi —</option>
                        {prostePanoge(i).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Število tarč na večer *</label>
                      <input type="number" inputMode="numeric" min={1} max={20} step={1} value={o.targets}
                             onChange={e => setO(i, 'targets', e.target.value)} className={inp} style={inpStyle} />
                      <span className="text-[11px] text-white/30 mt-1 block">Strelivo: 5 poskusnih + 10 na tarčo = {5 + 10 * (Number(o.targets) || 0)} nabojev</span>
                    </div>
                    <div>
                      <label className={lbl}>Vrsta orožja *</label>
                      <select value={o.weapon_kind} onChange={e => setO(i, 'weapon_kind', e.target.value)} className={inp} style={inpStyle}>
                        <option value="pištola">Pištola</option>
                        <option value="revolver">Revolver</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Lastnik orožja *</label>
                      <select value={o.weapon_owner_sel} onChange={e => setO(i, 'weapon_owner_sel', e.target.value)} className={inp} style={inpStyle}>
                        <option value="">— izberi —</option>
                        {LASTNIKI.map(l => <option key={l.v} value={l.v}>{l.t}</option>)}
                      </select>
                    </div>
                    {o.weapon_owner_sel === 'druga' ? (
                      <div>
                        <label className={lbl}>Ime in priimek lastnika orožja *</label>
                        <input value={o.weapon_owner_name} onChange={e => setO(i, 'weapon_owner_name', e.target.value)} className={inp} style={inpStyle} />
                      </div>
                    ) : <div className="hidden sm:block" />}
                    {o.weapon_owner_sel && !klubsko && (<>
                      <div>
                        <label className={lbl}>Znamka in model orožja *</label>
                        <input value={o.weapon_model} onChange={e => setO(i, 'weapon_model', e.target.value)} placeholder="npr. CZ Shadow 2" className={inp} style={inpStyle} />
                      </div>
                      <div>
                        <label className={lbl}>Tovarniška številka *</label>
                        <input value={o.weapon_serial} onChange={e => setO(i, 'weapon_serial', e.target.value)} className={inp} style={inpStyle} />
                      </div>
                    </>)}
                    {klubsko && (
                      <p className="sm:col-span-2 text-xs text-white/40">Klubsko orožje dodeli strelišče na večer lige.</p>
                    )}
                    {lastno && (<>
                      <div className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-widest uppercase text-white/50">Orožna listina za to orožje</div>
                      <div>
                        <label className={lbl}>Vrsta listine *</label>
                        <select value={o.permit_type} onChange={e => setO(i, 'permit_type', e.target.value)} className={inp} style={inpStyle}>
                          <option value="">— izberi —</option>
                          {VRSTE_LISTIN.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Številka listine *</label>
                        <input value={o.permit_no} onChange={e => setO(i, 'permit_no', e.target.value)} className={inp} style={inpStyle} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={lbl}>Izdajatelj listine *</label>
                        <input value={o.permit_issuer} onChange={e => setO(i, 'permit_issuer', e.target.value)} placeholder="npr. UE Maribor" className={inp} style={inpStyle} />
                      </div>
                    </>)}
                    <div>
                      <label className={lbl}>Strelivo (kaliber) *</label>
                      <input list="streliva" value={o.ammo_type} onChange={e => setO(i, 'ammo_type', e.target.value)} placeholder="npr. 9x19" className={inp} style={inpStyle} />
                    </div>
                    <div>
                      <label className={lbl}>Lastnik streliva *</label>
                      <select value={o.ammo_owner_sel} onChange={e => setO(i, 'ammo_owner_sel', e.target.value)} className={inp} style={inpStyle}>
                        <option value="">— izberi —</option>
                        {LASTNIKI.map(l => <option key={l.v} value={l.v}>{l.v === 'ŠRC RA-TA-TA' ? 'ŠRC Ra-Ta-Ta (kupljeno na strelišču)' : l.t}</option>)}
                      </select>
                    </div>
                    {o.ammo_owner_sel === 'druga' && (
                      <div className="sm:col-span-2">
                        <label className={lbl}>Ime in priimek lastnika streliva *</label>
                        <input value={o.ammo_owner_name} onChange={e => setO(i, 'ammo_owner_name', e.target.value)} className={inp} style={inpStyle} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <datalist id="streliva">{STRELIVA.map(s => <option key={s} value={s} />)}</datalist>
            {obrazci.length < PANOGE.length && (
              <button type="button" onClick={() => setObrazci(p => [...p, prazenObrazec()])}
                      className="mb-5 w-full py-2.5 rounded-xl text-sm font-semibold hover:brightness-125 transition-all"
                      style={{ color: '#7a8cc9', border: '1px dashed rgba(122,140,201,0.4)' }}>
                + Dodaj še eno panogo
              </button>
            )}

            <div className="mb-5">
              <label className={lbl}>Opomba</label>
              <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)}
                        className={inp + ' resize-none'} style={inpStyle} />
            </div>

            {/* Pravila + countdown + checkbox */}
            <div className="mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Naslov */}
              <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0d0f14' }}>
                <span className="text-xs font-semibold text-white/70">Pravila Zimske lige Fenix 2026/2027</span>
                <a href={`${BP}/pravila-zimske-lige-fenix.pdf`} download
                   className="text-xs font-semibold transition-all hover:brightness-125 flex items-center gap-1"
                   style={{ color: '#7a8cc9' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 20h16" />
                  </svg>
                  Prenesi
                </a>
              </div>
              {/* Vgrajeni PDF */}
              <iframe
                src={`${BP}/pravila-zimske-lige-fenix.pdf`}
                className="w-full"
                style={{ height: 420, background: '#1a1f2e' }}
                title="Pravila Zimske lige Fenix 2026/2027"
              />
              {/* Countdown + checkbox */}
              <div className="px-4 py-4" style={{ background: '#0d0f14' }}>
                {!pravilaOdklenjeno ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                         style={{ background: 'rgba(122,140,201,0.15)', color: '#7a8cc9', border: '2px solid #7a8cc9' }}>
                      {countdown}
                    </div>
                    <span className="text-xs text-white/50 leading-relaxed">
                      Prelistaj pravila — potrditev se odklene čez <span style={{ color: '#7a8cc9' }}>{countdown}s</span>
                    </span>
                  </div>
                ) : (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={pravilaPrebrana}
                      onChange={e => setPravilaPrebrana(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded accent-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-white/70 group-hover:text-white transition-colors leading-relaxed">
                      Prebral/a sem pravila Zimske lige Fenix 2026/2027 in se z njimi strinjam.
                    </span>
                  </label>
                )}
              </div>
            </div>

            {err && (
              <div className="text-red-400 text-xs mb-4">
                <p>{err}</p>
                {manjkajoce.length > 0 && (
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">{manjkajoce.map(x => <li key={x}>{x}</li>)}</ul>
                )}
              </div>
            )}

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
