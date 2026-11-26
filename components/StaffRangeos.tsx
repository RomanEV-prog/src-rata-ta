'use client'
import { useState, useEffect, useCallback } from 'react'

// Liga prijave + Novičnik za osebje — kliče rangeos-api (recepcijski PC).
// Rangeos povezava (žeton) se obnovi v sessionStorage; osebje se poveže enkrat.
// Vgrajeno v /admin kot zavihka, da ima osebje vse na enem mestu.

const API = 'https://rangeos-api.adlerhub.eu'
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const DISCIPLINE_CHECKBOX: Record<string, string> = {
  'Pištola/revolver s središčnim vžigom 15m (samo začetniki)': 'checkbox_165v4a',
  'Pištola s središčnim vžigom 25m dvoročno': 'checkbox_175u8y',
  'Revolver s središčnim vžigom 25m enoročno': 'checkbox_189d3t',
  'Pištola/revolver standardna cal. .22 L.R., 25m enoročno': 'checkbox_196v0s',
}

interface LigaReg { id: number; first_name: string; last_name: string; email: string; phone: string | null; date_of_birth: number | null; society: string | null; discipline: string | null; note: string | null; status: string; submitted_at: number }
interface RNews { id: number; title: string; excerpt: string | null; category: string; published_at: number }

const catColor: Record<string, string> = { 'izobraževanja': '#3dba8a', 'obvestila': '#7a8cc9', 'novosti': '#e67e22', 'dogodki': '#c0392b' }
const statusColor: Record<string, string> = { new: '#7a8cc9', contacted: '#e67e22', confirmed: '#3dba8a', rejected: '#c0392b' }
const statusLabel: Record<string, string> = { new: 'Nova', contacted: 'Kontaktiran', confirmed: 'Potrjen → ERP', rejected: 'Zavrnjeno' }
function fmtDate(ms: number) { return new Date(ms).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function StaffRangeos({ section }: { section: 'liga' | 'novicnik' | 'nastavitve' }) {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [msg, setMsg] = useState('')

  const [ligaRegs, setLigaRegs] = useState<LigaReg[]>([])
  const [printingReg, setPrintingReg] = useState(false)

  const [rposts, setRposts] = useState<RNews[]>([])
  const [nlStats, setNlStats] = useState<{ confirmed: number; pending: number; unsubscribed: number; recent: { email: string; status: string; created_at: number }[] } | null>(null)
  const [nlSettings, setNlSettings] = useState<{ from: string; replyTo: string; hasKey: boolean }>({ from: '', replyTo: '', hasKey: false })
  const [nlSel, setNlSel] = useState<number[]>([])
  const [nlSubject, setNlSubject] = useState('')
  const [nlIntro, setNlIntro] = useState('')
  const [nlSending, setNlSending] = useState(false)
  const [nlImporting, setNlImporting] = useState(false)
  const [nlKeyInput, setNlKeyInput] = useState('')
  const [nlSavingSettings, setNlSavingSettings] = useState(false)

  useEffect(() => { try { const t = sessionStorage.getItem('admin_token'); if (t) setToken(t) } catch {} }, [])

  const fetchLiga = useCallback(async (tok: string) => {
    try { const r = await fetch(`${API}/league-registrations`, { headers: { Authorization: `Bearer ${tok}` } }); const b = await r.json(); if (b.ok) setLigaRegs(b.data) } catch {}
  }, [])
  const fetchNewsletter = useCallback(async (tok: string) => {
    try {
      const [s, cfg, news] = await Promise.all([
        fetch(`${API}/newsletter/subscribers`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()),
        fetch(`${API}/newsletter/settings`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()),
        fetch(`${API}/public/news`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()),
      ])
      if (s.ok) setNlStats(s.data)
      if (cfg.ok) setNlSettings(cfg.data)
      if (news.ok) setRposts(news.data)
    } catch {}
  }, [])

  useEffect(() => {
    if (!token) return
    if (section === 'liga') fetchLiga(token)
    else fetchNewsletter(token)
  }, [token, section, fetchLiga, fetchNewsletter])

  async function login() {
    setLoginErr(''); setLoggingIn(true)
    try {
      const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) })
      const b = await r.json()
      if (!b.ok) { setLoginErr(b.message ?? 'Napaka pri prijavi'); return }
      setToken(b.data.token)
      try { sessionStorage.setItem('admin_token', b.data.token) } catch {}
    } catch { setLoginErr('RangeOS ni dosegljiv (je recepcijski računalnik vklopljen?)') }
    finally { setLoggingIn(false) }
  }
  function disconnect() { setToken(null); try { sessionStorage.removeItem('admin_token') } catch {} }

  async function setLigaStatus(id: number, status: string) {
    if (!token) return
    await fetch(`${API}/league-registrations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
    await fetchLiga(token)
  }

  async function printAllPrijavnice(regs: LigaReg[]) {
    if (regs.length === 0) { setMsg('Ni prijav za tisk.'); return }
    setPrintingReg(true); setMsg('')
    try {
      const { PDFDocument } = await import('pdf-lib')
      const res = await fetch(`${BP}/prijavnica-liga-fenix.pdf`)
      if (!res.ok) throw new Error('predloge ni mogoče naložiti')
      const tplBytes = await res.arrayBuffer()
      const merged = await PDFDocument.create()
      for (const reg of regs) {
        const doc = await PDFDocument.load(tplBytes)
        const form = doc.getForm()
        const setText = (name: string, val: string) => { try { form.getTextField(name).setText(val) } catch {} }
        setText('text_10o9i', `${reg.first_name} ${reg.last_name}`.trim())
        setText('text_147w5p', new Date(reg.submitted_at).toLocaleDateString('sl-SI'))
        setText('text_151t6a', reg.society ?? '')
        const cb = DISCIPLINE_CHECKBOX[reg.discipline ?? '']
        if (cb) { try { form.getCheckBox(cb).check() } catch {} }
        form.flatten()
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const bytes = await merged.save()
      const blob = new Blob([bytes.slice().buffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (!w) { setMsg('Brskalnik je blokiral novo okno — dovoli pojavna okna.'); return }
      setMsg(`✓ Pripravljenih ${regs.length} prijavnic — natisni s Ctrl+P.`)
    } catch (e) { setMsg('Napaka pri pripravi PDF: ' + (e instanceof Error ? e.message : 'neznana')) }
    finally { setPrintingReg(false) }
  }

  async function importMembers() {
    if (!token) return
    if (!confirm('Uvoziti aktivne člane iz RangeOS? Vsak dobi EN potrditveni mejl; naročen postane šele, ko potrdi.')) return
    setNlImporting(true); setMsg('')
    try {
      const r = await fetch(`${API}/newsletter/import-members`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka: ' + (b.message ?? 'uvoz ni uspel')); return }
      const d = b.data
      let m = `✓ Poslanih povabil: ${d.invited}. Preostane: ${d.remaining}. Preskočenih: ${d.skippedExisting}. Brez e-pošte: ${d.noEmail}.`
      if (d.remaining > 0) m += ' Ponovi jutri za preostale (dnevna omejitev).'
      setMsg(m)
      await fetchNewsletter(token)
    } catch { setMsg('Napaka pri uvozu') } finally { setNlImporting(false) }
  }

  async function saveNlSettings() {
    if (!token) return
    setNlSavingSettings(true); setMsg('')
    try {
      const body: Record<string, string> = { from: nlSettings.from, replyTo: nlSettings.replyTo }
      if (nlKeyInput.trim()) body.resendKey = nlKeyInput.trim()
      const r = await fetch(`${API}/newsletter/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka pri shranjevanju nastavitev'); return }
      setMsg('Nastavitve novičnika shranjene.'); setNlKeyInput('')
      await fetchNewsletter(token)
    } catch { setMsg('Napaka pri shranjevanju') } finally { setNlSavingSettings(false) }
  }

  async function sendNewsletter() {
    if (!token) return
    if (!nlSubject.trim()) { setMsg('Vnesite zadevo sporočila.'); return }
    if (nlSel.length === 0) { setMsg('Izberite vsaj eno novico.'); return }
    if (!confirm(`Poslati novičnik ${nlStats?.confirmed ?? 0} potrjenim naročnikom?`)) return
    setNlSending(true); setMsg('')
    try {
      const r = await fetch(`${API}/newsletter/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subject: nlSubject.trim(), intro: nlIntro.trim() || undefined, news_ids: nlSel }) })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka: ' + (b.message ?? 'pošiljanje ni uspelo')); return }
      setMsg(`✓ Poslano ${b.data.recipientCount} naročnikom.`)
      setNlSel([]); setNlSubject(''); setNlIntro('')
    } catch { setMsg('Napaka pri pošiljanju') } finally { setNlSending(false) }
  }

  const inp = 'w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }

  // ---- Rangeos povezava (če ni žetona) ----
  if (!token) return (
    <div className="p-6 rounded-2xl max-w-sm" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white font-bold mb-1">Poveži z RangeOS</h3>
      <p className="text-white/40 text-xs mb-4">Liga prijave in novičnik so v RangeOS (recepcijski računalnik). Vpiši se enkrat.</p>
      <div className="space-y-3">
        <input type="email" placeholder="E-mail (RangeOS)" value={email} onChange={e => setEmail(e.target.value)} className={inp} style={inpStyle} />
        <input type="password" placeholder="Geslo (RangeOS)" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} className={inp} style={inpStyle} />
        {loginErr && <p className="text-red-400 text-xs">{loginErr}</p>}
        <button onClick={login} disabled={loggingIn} className="w-full py-2.5 rounded-xl font-semibold text-white text-sm hover:brightness-110 disabled:opacity-50" style={{ background: '#4f6bbd' }}>{loggingIn ? 'Povezujem…' : 'Poveži'}</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={disconnect} className="text-xs text-white/40 hover:text-white underline">Prekini RangeOS povezavo</button>
      </div>
      {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: msg.startsWith('Napaka') ? '#2a1a1a' : '#1a2a1a', color: msg.startsWith('Napaka') ? '#e07a7a' : '#3dba8a' }}>{msg}</div>}

      {/* ---- LIGA ---- */}
      {section === 'liga' && (
        <div className="space-y-3">
          {ligaRegs.length > 0 && (
            <div className="flex justify-end">
              <button onClick={() => printAllPrijavnice(ligaRegs)} disabled={printingReg} className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#3dba8a' }}>{printingReg ? 'Pripravljam…' : `🖨 Natisni vse prijavnice (${ligaRegs.length})`}</button>
            </div>
          )}
          {ligaRegs.length === 0 && <p className="text-white/30 text-sm text-center py-10">Ni prijav</p>}
          {ligaRegs.map(reg => (
            <div key={reg.id} className="p-4 rounded-xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm">{reg.first_name} {reg.last_name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (statusColor[reg.status] ?? '#7a8cc9') + '25', color: statusColor[reg.status] ?? '#7a8cc9' }}>{statusLabel[reg.status] ?? reg.status}</span>
                    <span className="text-xs text-white/30 ml-auto">{fmtDate(reg.submitted_at)}</span>
                  </div>
                  <div className="text-white/50 text-xs space-y-0.5">
                    <div>{reg.email}{reg.phone ? ` · ${reg.phone}` : ''}</div>
                    {reg.society && <div>Društvo: {reg.society}</div>}
                    {reg.discipline && <div>Disciplina: {reg.discipline}</div>}
                    {reg.note && <div className="text-white/30 italic">{reg.note}</div>}
                  </div>
                </div>
                {reg.status !== 'confirmed' && reg.status !== 'rejected' && (
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {reg.status === 'new' && <button onClick={() => setLigaStatus(reg.id, 'contacted')} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">Kontaktiran</button>}
                    <button onClick={() => setLigaStatus(reg.id, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs border font-semibold hover:brightness-110" style={{ borderColor: '#3dba8a50', color: '#3dba8a' }}>✓ Potrdi → ERP</button>
                    <button onClick={() => setLigaStatus(reg.id, 'rejected')} className="px-3 py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:text-red-400">Zavrni</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- NOVIČNIK ---- */}
      {section === 'novicnik' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Potrjeni', val: nlStats?.confirmed ?? 0, color: '#3dba8a' },
              { label: 'Čakajo potrditev', val: nlStats?.pending ?? 0, color: '#e67e22' },
              { label: 'Odjavljeni', val: nlStats?.unsubscribed ?? 0, color: '#7a8cc9' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {!nlSettings.hasKey && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#2a1a1a', color: '#e07a7a', border: '1px solid rgba(224,122,122,0.2)' }}>⚠ Resend API ključ ni nastavljen — pošiljanje ne bo delovalo. Nastavite ga spodaj.</div>}

          <div className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="sm:flex-1">
              <div className="text-white font-semibold text-sm">Uvozi člane iz RangeOS</div>
              <div className="text-white/40 text-xs mt-0.5 leading-relaxed">Vsak aktiven član/osebje dobi eno povabilo (opt-in). Naročen postane po kliku v mejlu. Največ ~90 na zagon.</div>
            </div>
            <button onClick={importMembers} disabled={nlImporting || !nlSettings.hasKey} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110 whitespace-nowrap" style={{ background: '#4f6bbd' }}>{nlImporting ? 'Uvažam…' : 'Uvozi člane'}</button>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.3)' }}>
            <h2 className="text-white font-bold mb-5">Sestavi in pošlji novičnik</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Zadeva sporočila *</label>
                <input value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="Npr. Novosti strelišča — november" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Uvodni odstavek (opcijsko)</label>
                <textarea rows={2} value={nlIntro} onChange={e => setNlIntro(e.target.value)} placeholder="Kratek pozdrav pred novicami…" className={inp + ' resize-none'} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Vključene novice (iz RangeOS) *</label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {rposts.length === 0 && <p className="text-white/30 text-sm py-4">Ni novic v RangeOS.</p>}
                  {rposts.map(p => {
                    const checked = nlSel.includes(p.id)
                    return (
                      <label key={p.id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ background: checked ? 'rgba(79,107,189,0.12)' : '#0f131b', border: `1px solid ${checked ? 'rgba(79,107,189,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                        <input type="checkbox" checked={checked} className="mt-1 w-4 h-4 flex-shrink-0" onChange={e => setNlSel(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (catColor[p.category] ?? '#7a8cc9') + '25', color: catColor[p.category] ?? '#7a8cc9' }}>{p.category}</span>
                            <span className="text-xs text-white/30">{fmtDate(p.published_at)}</span>
                          </div>
                          <div className="text-white text-sm font-semibold mt-1">{p.title}</div>
                          {p.excerpt && <div className="text-white/40 text-xs mt-0.5 truncate">{p.excerpt}</div>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              <button onClick={sendNewsletter} disabled={nlSending || !nlSettings.hasKey || nlSel.length === 0 || !nlSubject.trim()} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#c0392b' }}>{nlSending ? 'Pošiljam…' : `Pošlji članom${nlStats ? ` (${nlStats.confirmed})` : ''}`}</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-3">Zadnji naročniki</h3>
            <div className="space-y-2">
              {(nlStats?.recent ?? []).length === 0 && <p className="text-white/30 text-sm py-4">Še ni naročnikov</p>}
              {(nlStats?.recent ?? []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white/80 truncate">{s.email}</span>
                  <span className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (s.status === 'confirmed' ? '#3dba8a' : s.status === 'pending' ? '#e67e22' : '#7a8cc9') + '25', color: s.status === 'confirmed' ? '#3dba8a' : s.status === 'pending' ? '#e67e22' : '#7a8cc9' }}>{s.status === 'confirmed' ? 'potrjen' : s.status === 'pending' ? 'čaka' : 'odjavljen'}</span>
                    <span className="text-xs text-white/30">{fmtDate(s.created_at)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- NASTAVITVE (samo super admin) ---- */}
      {section === 'nastavitve' && (
        <div className="space-y-6">
          {!nlSettings.hasKey && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#2a1a1a', color: '#e07a7a', border: '1px solid rgba(224,122,122,0.2)' }}>⚠ Resend API ključ ni nastavljen — pošiljanje novičnika ne bo delovalo.</div>}
          <div className="p-6 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-white font-bold mb-1">Nastavitve pošiljanja novičnika</h2>
            <p className="text-white/35 text-xs mb-5">Pošiljatelj, naslov za odgovore in ključ (Resend) za pošiljanje e-pošte.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Pošiljatelj (from)</label>
                <input value={nlSettings.from} onChange={e => setNlSettings(s => ({ ...s, from: e.target.value }))} placeholder="ŠRC Ra-Ta-Ta <novice@adlerhub.eu>" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Odgovor na (reply-to)</label>
                <input value={nlSettings.replyTo} onChange={e => setNlSettings(s => ({ ...s, replyTo: e.target.value }))} placeholder="src.ratata@gmail.com" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Resend API ključ {nlSettings.hasKey && <span style={{ color: '#3dba8a' }}>(nastavljen)</span>}</label>
                <input type="password" value={nlKeyInput} onChange={e => setNlKeyInput(e.target.value)} placeholder={nlSettings.hasKey ? '•••• (prazno = brez spremembe)' : 're_...'} className={inp} style={inpStyle} />
              </div>
            </div>
            <button onClick={saveNlSettings} disabled={nlSavingSettings} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>{nlSavingSettings ? 'Shranjujem…' : 'Shrani nastavitve'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
