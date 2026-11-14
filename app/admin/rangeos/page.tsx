'use client'
import { useState, useEffect, useCallback } from 'react'

const API = 'https://rangeos-api.adlerhub.eu'
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Imena polj v predlogi prijavnice (public/prijavnica-liga-fenix.pdf) — isto kot
// Supabase funkcija send-registration, da je tiskana prijavnica enaka poslani.
const DISCIPLINE_CHECKBOX: Record<string, string> = {
  'Pištola/revolver s središčnim vžigom 15m (samo začetniki)': 'checkbox_165v4a',
  'Pištola s središčnim vžigom 25m dvoročno':                  'checkbox_175u8y',
  'Revolver s središčnim vžigom 25m enoročno':                 'checkbox_189d3t',
  'Pištola/revolver standardna cal. .22 L.R., 25m enoročno':  'checkbox_196v0s',
}

interface NewsPost { id: number; title: string; excerpt: string | null; content: string | null; category: string; image_url: string | null; slug: string | null; is_published: number; published_at: number }
interface LigaReg { id: number; first_name: string; last_name: string; email: string; phone: string | null; date_of_birth: number | null; society: string | null; discipline: string | null; note: string | null; status: string; submitted_at: number }
const KATEGORIJE = ['obvestila', 'izobraževanja', 'novosti', 'dogodki']
const catColor: Record<string, string> = { 'izobraževanja': '#3dba8a', 'obvestila': '#7a8cc9', 'novosti': '#e67e22', 'dogodki': '#c0392b' }
const statusColor: Record<string, string> = { new: '#7a8cc9', contacted: '#e67e22', confirmed: '#3dba8a', rejected: '#c0392b' }
const statusLabel: Record<string, string> = { new: 'Nova', contacted: 'Kontaktiran', confirmed: 'Potrjen → ERP', rejected: 'Zavrnjeno' }

function fmtDate(ms: number) { return new Date(ms).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' }) }

function isoToMs(iso: string) { return new Date(iso).getTime() }
function msToIso(ms: number) { return new Date(ms).toISOString().slice(0, 16) }

const EMPTY = { title: '', excerpt: '', content: '', category: 'obvestila', image_url: '', slug: '', is_published: 1, published_at: Date.now() }

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [editing, setEditing] = useState<Partial<NewsPost> | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [liveTargets, setLiveTargets] = useState(true)
  const [togglingLive, setTogglingLive] = useState(false)
  const [tab, setTab] = useState<'novice' | 'liga' | 'novicnik'>('novice')
  const [ligaRegs, setLigaRegs] = useState<LigaReg[]>([])
  // Novičnik
  const [nlStats, setNlStats] = useState<{ confirmed: number; pending: number; unsubscribed: number; recent: { email: string; status: string; created_at: number }[] } | null>(null)
  const [nlSettings, setNlSettings] = useState<{ from: string; replyTo: string; hasKey: boolean }>({ from: '', replyTo: '', hasKey: false })
  const [nlSel, setNlSel] = useState<number[]>([])
  const [nlSubject, setNlSubject] = useState('')
  const [nlIntro, setNlIntro] = useState('')
  const [nlSending, setNlSending] = useState(false)
  const [nlKeyInput, setNlKeyInput] = useState('')
  const [nlSavingSettings, setNlSavingSettings] = useState(false)
  const [nlImporting, setNlImporting] = useState(false)
  const [printingReg, setPrintingReg] = useState(false)
  // Supabase sinhronizacija novic
  const [syncSettings, setSyncSettings] = useState<{ url: string; hasKey: boolean }>({ url: '', hasKey: false })
  const [syncKeyInput, setSyncKeyInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [savingSync, setSavingSync] = useState(false)

  // Obnovi JWT iz sessionStorage
  useEffect(() => {
    try { const t = sessionStorage.getItem('admin_token'); if (t) setToken(t) } catch {}
  }, [])

  const fetchNews = useCallback(async (tok: string) => {
    const r = await fetch(`${API}/public/news`, { headers: { Authorization: `Bearer ${tok}` } })
    const b = await r.json()
    if (b.ok) setPosts(b.data)
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch(`${API}/public/config`)
      const b = await r.json()
      if (b.ok) setLiveTargets(b.data.liveTargetsEnabled)
    } catch {}
  }, [])

  const fetchLiga = useCallback(async (tok: string) => {
    try {
      const r = await fetch(`${API}/league-registrations`, { headers: { Authorization: `Bearer ${tok}` } })
      const b = await r.json()
      if (b.ok) setLigaRegs(b.data)
    } catch {}
  }, [])

  const fetchNewsletter = useCallback(async (tok: string) => {
    try {
      const [s, cfg] = await Promise.all([
        fetch(`${API}/newsletter/subscribers`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()),
        fetch(`${API}/newsletter/settings`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()),
      ])
      if (s.ok) setNlStats(s.data)
      if (cfg.ok) setNlSettings(cfg.data)
    } catch {}
  }, [])

  const fetchSync = useCallback(async (tok: string) => {
    try {
      const r = await fetch(`${API}/news/sync-settings`, { headers: { Authorization: `Bearer ${tok}` } })
      const b = await r.json()
      if (b.ok) setSyncSettings(b.data)
    } catch {}
  }, [])

  useEffect(() => { if (token) { fetchNews(token); fetchConfig(); fetchLiga(token); fetchNewsletter(token); fetchSync(token) } }, [token, fetchNews, fetchConfig, fetchLiga, fetchNewsletter, fetchSync])

  async function saveSyncSettings() {
    if (!token) return
    setSavingSync(true); setMsg('')
    try {
      const body: Record<string, string> = {}
      if (syncKeyInput.trim()) body.serviceKey = syncKeyInput.trim()
      const r = await fetch(`${API}/news/sync-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka pri shranjevanju ključa'); return }
      setMsg('Supabase ključ shranjen.'); setSyncKeyInput('')
      await fetchSync(token)
    } catch { setMsg('Napaka pri shranjevanju') } finally { setSavingSync(false) }
  }

  async function syncNewsNow() {
    if (!token) return
    setSyncing(true); setMsg('')
    try {
      const r = await fetch(`${API}/news/sync`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka pri sinhronizaciji: ' + (b.message ?? '')); return }
      setMsg(`✓ Sinhronizirano ${b.data.synced} novic v Supabase.`)
    } catch { setMsg('Napaka pri sinhronizaciji') } finally { setSyncing(false) }
  }

  async function sendNewsletter() {
    if (!token) return
    if (!nlSubject.trim()) { setMsg('Vnesite zadevo sporočila.'); return }
    if (nlSel.length === 0) { setMsg('Izberite vsaj eno novico.'); return }
    const recipients = nlStats?.confirmed ?? 0
    if (!confirm(`Poslati novičnik ${recipients} potrjenim naročnikom?`)) return
    setNlSending(true); setMsg('')
    try {
      const r = await fetch(`${API}/newsletter/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: nlSubject.trim(), intro: nlIntro.trim() || undefined, news_ids: nlSel }),
      })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka: ' + (b.message ?? 'pošiljanje ni uspelo')); return }
      setMsg(`✓ Poslano ${b.data.recipientCount} naročnikom.`)
      setNlSel([]); setNlSubject(''); setNlIntro('')
    } catch { setMsg('Napaka pri pošiljanju') }
    finally { setNlSending(false) }
  }

  // Natisni vse prejete prijavnice na ligo: izpolni PDF predlogo za vsako prijavo
  // (ista polja kot poslani mejl) in jih združi v en PDF za tisk.
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
      if (!w) { setMsg('Brskalnik je blokiral novo okno — dovoli pojavna okna za to stran.'); return }
      setMsg(`✓ Pripravljenih ${regs.length} prijavnic — v odprtem zavihku natisni s Ctrl+P.`)
    } catch (e) {
      setMsg('Napaka pri pripravi PDF: ' + (e instanceof Error ? e.message : 'neznana'))
    } finally { setPrintingReg(false) }
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
      let m = `✓ Poslanih povabil: ${d.invited}. Preostane za uvoz: ${d.remaining}. Preskočenih (že vpisani): ${d.skippedExisting}. Brez e-pošte: ${d.noEmail}.`
      if (d.remaining > 0) m += d.stopped ? ` Ustavljeno: ${d.stopped}` : ' Ponovi jutri za preostale (dnevna omejitev pošiljanja).'
      setMsg(m)
      await fetchNewsletter(token)
    } catch { setMsg('Napaka pri uvozu') }
    finally { setNlImporting(false) }
  }

  async function saveNlSettings() {
    if (!token) return
    setNlSavingSettings(true); setMsg('')
    try {
      const body: Record<string, string> = { from: nlSettings.from, replyTo: nlSettings.replyTo }
      if (nlKeyInput.trim()) body.resendKey = nlKeyInput.trim()
      const r = await fetch(`${API}/newsletter/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka pri shranjevanju nastavitev'); return }
      setMsg('Nastavitve novičnika shranjene.')
      setNlKeyInput('')
      await fetchNewsletter(token)
    } catch { setMsg('Napaka pri shranjevanju') }
    finally { setNlSavingSettings(false) }
  }

  async function setLigaStatus(tok: string, id: number, status: string) {
    await fetch(`${API}/league-registrations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ status }) })
    await fetchLiga(tok)
  }

  async function toggleLiveTargets(tok: string, val: boolean) {
    setTogglingLive(true)
    try {
      await fetch(`${API}/public/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ liveTargetsEnabled: val }) })
      setLiveTargets(val)
    } catch {}
    setTogglingLive(false)
  }

  async function login() {
    setLoginErr('')
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) })
    const b = await r.json()
    if (!b.ok) { setLoginErr(b.message ?? 'Napaka pri prijavi'); return }
    const tok = b.data.token
    setToken(tok)
    try { sessionStorage.setItem('admin_token', tok) } catch {}
  }

  function logout() {
    setToken(null)
    try { sessionStorage.removeItem('admin_token') } catch {}
  }

  async function save() {
    if (!token || !editing) return
    setSaving(true); setMsg('')
    const body = {
      ...editing,
      published_at: editing.published_at ?? Date.now(),
      is_published: editing.is_published ?? 1,
    }
    try {
      const isNew = !editing.id
      const url = isNew ? `${API}/news` : `${API}/news/${editing.id}`
      const r = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const b = await r.json()
      if (!b.ok) { setMsg('Napaka: ' + (b.message ?? 'unknown')); return }
      setMsg(isNew ? 'Novica dodana!' : 'Shranjeno!')
      setEditing(null)
      await fetchNews(token)
    } catch { setMsg('Napaka pri shranjevanju') }
    finally { setSaving(false) }
  }

  async function del(id: number) {
    if (!token || !confirm('Zbriši novico?')) return
    await fetch(`${API}/news/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    await fetchNews(token)
  }

  async function togglePublish(post: NewsPost) {
    if (!token) return
    await fetch(`${API}/news/${post.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ is_published: post.is_published ? 0 : 1 }) })
    await fetchNews(token)
  }

  const inp = 'w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }

  // ---- PRIJAVA ----
  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-white font-black text-2xl mb-6 text-center">Admin prijava</h1>
        <div className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={inp} style={inpStyle} />
          <input type="password" placeholder="Geslo" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} className={inp} style={inpStyle} />
          {loginErr && <p className="text-red-400 text-xs">{loginErr}</p>}
          <button onClick={login} className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:brightness-110" style={{ background: '#4f6bbd' }}>Prijava</button>
        </div>
      </div>
    </div>
  )

  // ---- ADMIN DASHBOARD ----
  return (
    <div className="min-h-screen" style={{ background: '#0d0f14' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-black text-2xl">Admin</h1>
          <button onClick={logout} className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">Odjava</button>
        </div>

        {/* Zavihki */}
        <div className="flex gap-2 mb-6">
          {(['novice', 'liga', 'novicnik'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: tab === t ? '#4f6bbd' : '#1a1f2e', color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {t === 'novice'
                ? 'Novice'
                : t === 'liga'
                ? `Prijave na ligo${ligaRegs.filter(r => r.status === 'new').length > 0 ? ` (${ligaRegs.filter(r => r.status === 'new').length})` : ''}`
                : `Novičnik${nlStats ? ` (${nlStats.confirmed})` : ''}`}
            </button>
          ))}
          {tab === 'novice' && (
            <button onClick={() => { setEditing({ ...EMPTY }); setMsg('') }}
              className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-semibold hover:brightness-110" style={{ background: '#4f6bbd' }}>
              + Nova novica
            </button>
          )}
        </div>

        {/* Nastavitve */}
        <div className="mb-6 px-5 py-4 rounded-xl flex items-center justify-between" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="text-white font-semibold text-sm">Live tarče na spletni strani</div>
            <div className="text-white/40 text-xs mt-0.5">Prikaže zadnje posnetke tarč z inicialkami strelcev</div>
          </div>
          <button
            onClick={() => token && toggleLiveTargets(token, !liveTargets)}
            disabled={togglingLive}
            className="relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50"
            style={{ background: liveTargets ? '#3dba8a' : '#2a2f3d' }}
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style={{ transform: liveTargets ? 'translateX(24px)' : 'translateX(0)' }} />
          </button>
        </div>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#1a2a1a', color: '#3dba8a' }}>{msg}</div>}

        {/* Forma za dodaj/uredi */}
        {editing && (
          <div className="mb-8 p-6 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.3)' }}>
            <h2 className="text-white font-bold mb-5">{editing.id ? 'Uredi novico' : 'Nova novica'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Naslov *</label>
                <input value={editing.title ?? ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} className={inp} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Kratek opis</label>
                <textarea rows={2} value={editing.excerpt ?? ''} onChange={e => setEditing(p => ({ ...p, excerpt: e.target.value }))} className={inp + ' resize-none'} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Vsebina</label>
                <textarea rows={5} value={editing.content ?? ''} onChange={e => setEditing(p => ({ ...p, content: e.target.value }))} className={inp + ' resize-none'} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Kategorija</label>
                <select value={editing.category ?? 'obvestila'} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} className={inp} style={inpStyle}>
                  {KATEGORIJE.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Datum objave</label>
                <input type="datetime-local" value={msToIso(editing.published_at ?? Date.now())} onChange={e => setEditing(p => ({ ...p, published_at: isoToMs(e.target.value) }))} className={inp} style={inpStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">URL slike (opcijsko)</label>
                <input value={editing.image_url ?? ''} onChange={e => setEditing(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Slug (opcijsko)</label>
                <input value={editing.slug ?? ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value }))} placeholder="moj-prispevek" className={inp} style={inpStyle} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" id="pub" checked={!!editing.is_published} onChange={e => setEditing(p => ({ ...p, is_published: e.target.checked ? 1 : 0 }))} className="w-4 h-4 rounded" />
                <label htmlFor="pub" className="text-sm text-white/70">Objaviti takoj</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving || !editing.title}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>
                {saving ? 'Shranjujem…' : (editing.id ? 'Shrani' : 'Objavi')}
              </button>
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl text-white/50 text-sm border border-white/10 hover:text-white">Prekliči</button>
            </div>
          </div>
        )}

        {/* Zavihek: Prijave na ligo */}
        {tab === 'liga' && (
          <div className="space-y-3">
            {ligaRegs.length > 0 && (
              <div className="flex justify-end">
                <button onClick={() => printAllPrijavnice(ligaRegs)} disabled={printingReg}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#3dba8a' }}>
                  {printingReg ? 'Pripravljam…' : `🖨 Natisni vse prijavnice (${ligaRegs.length})`}
                </button>
              </div>
            )}
            {ligaRegs.length === 0 && <p className="text-white/30 text-sm text-center py-10">Ni prijav</p>}
            {ligaRegs.map(reg => (
              <div key={reg.id} className="p-4 rounded-xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold text-sm">{reg.first_name} {reg.last_name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: (statusColor[reg.status] ?? '#7a8cc9') + '25', color: statusColor[reg.status] ?? '#7a8cc9' }}>
                        {statusLabel[reg.status] ?? reg.status}
                      </span>
                      <span className="text-xs text-white/30 ml-auto">{fmtDate(reg.submitted_at)}</span>
                    </div>
                    <div className="text-white/50 text-xs space-y-0.5">
                      <div>{reg.email}{reg.phone ? ` · ${reg.phone}` : ''}</div>
                      {reg.society && <div>Društvo: {reg.society}</div>}
                      {reg.discipline && <div>Disciplina: {reg.discipline}</div>}
                      {reg.note && <div className="text-white/30 italic">{reg.note}</div>}
                    </div>
                  </div>
                  {token && reg.status !== 'confirmed' && reg.status !== 'rejected' && (
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      {reg.status === 'new' && (
                        <button onClick={() => setLigaStatus(token, reg.id, 'contacted')}
                          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">
                          Kontaktiran
                        </button>
                      )}
                      <button onClick={() => setLigaStatus(token, reg.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-lg text-xs border font-semibold hover:brightness-110"
                        style={{ borderColor: '#3dba8a50', color: '#3dba8a' }}>
                        ✓ Potrdi → ERP
                      </button>
                      <button onClick={() => setLigaStatus(token, reg.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:text-red-400">
                        Zavrni
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zavihek: Novičnik */}
        {tab === 'novicnik' && (
          <div className="space-y-6">
            {/* Statistika */}
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

            {!nlSettings.hasKey && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#2a1a1a', color: '#e07a7a', border: '1px solid rgba(224,122,122,0.2)' }}>
                ⚠ Resend API ključ ni nastavljen — pošiljanje ne bo delovalo. Nastavite ga spodaj.
              </div>
            )}

            {/* Uvoz članov iz RangeOS */}
            <div className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="sm:flex-1">
                <div className="text-white font-semibold text-sm">Uvozi člane iz RangeOS</div>
                <div className="text-white/40 text-xs mt-0.5 leading-relaxed">Vsak aktiven član/osebje dobi eno povabilo za potrditev (opt-in). Naročen postane šele po kliku v mejlu. Že vpisane in odjavljene preskoči. Največ ~90 na zagon (dnevna omejitev) — če ostane, ponovi naslednji dan.</div>
              </div>
              <button onClick={importMembers} disabled={nlImporting || !nlSettings.hasKey}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110 whitespace-nowrap" style={{ background: '#4f6bbd' }}>
                {nlImporting ? 'Uvažam…' : 'Uvozi člane'}
              </button>
            </div>

            {/* Sestavi in pošlji */}
            <div className="p-6 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.3)' }}>
              <h2 className="text-white font-bold mb-5">Sestavi in pošlji novičnik</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Zadeva sporočila *</label>
                  <input value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="Npr. Novosti strelišča — november"
                    className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Uvodni odstavek (opcijsko)</label>
                  <textarea rows={2} value={nlIntro} onChange={e => setNlIntro(e.target.value)} placeholder="Kratek pozdrav pred novicami…"
                    className={inp + ' resize-none'} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Vključene novice (samo objavljene) *</label>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {posts.length === 0 && (
                      <p className="text-white/30 text-sm py-4">Ni objavljenih novic. Najprej dodajte in objavite novico.</p>
                    )}
                    {posts.map(p => {
                      const checked = nlSel.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ background: checked ? 'rgba(79,107,189,0.12)' : '#0f131b', border: `1px solid ${checked ? 'rgba(79,107,189,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                          <input type="checkbox" checked={checked} className="mt-1 w-4 h-4 flex-shrink-0"
                            onChange={e => setNlSel(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))} />
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
                <button onClick={sendNewsletter} disabled={nlSending || !nlSettings.hasKey || nlSel.length === 0 || !nlSubject.trim()}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#c0392b' }}>
                  {nlSending ? 'Pošiljam…' : `Pošlji članom${nlStats ? ` (${nlStats.confirmed})` : ''}`}
                </button>
              </div>
            </div>

            {/* Nastavitve pošiljanja */}
            <div className="p-6 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-white font-bold mb-5">Nastavitve pošiljanja</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 mb-1 block">Pošiljatelj (from)</label>
                  <input value={nlSettings.from} onChange={e => setNlSettings(s => ({ ...s, from: e.target.value }))}
                    placeholder="ŠRC Ra-Ta-Ta <novice@adlerhub.eu>" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Odgovor na (reply-to)</label>
                  <input value={nlSettings.replyTo} onChange={e => setNlSettings(s => ({ ...s, replyTo: e.target.value }))}
                    placeholder="src.ratata@gmail.com" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Resend API ključ {nlSettings.hasKey && <span style={{ color: '#3dba8a' }}>(nastavljen)</span>}</label>
                  <input type="password" value={nlKeyInput} onChange={e => setNlKeyInput(e.target.value)}
                    placeholder={nlSettings.hasKey ? '•••••••• (pustite prazno = brez spremembe)' : 're_...'} className={inp} style={inpStyle} />
                </div>
              </div>
              <button onClick={saveNlSettings} disabled={nlSavingSettings}
                className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>
                {nlSavingSettings ? 'Shranjujem…' : 'Shrani nastavitve'}
              </button>
            </div>

            {/* Zadnji naročniki */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-3">Zadnji naročniki</h3>
              <div className="space-y-2">
                {(nlStats?.recent ?? []).length === 0 && <p className="text-white/30 text-sm py-4">Še ni naročnikov</p>}
                {(nlStats?.recent ?? []).map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-white/80 truncate">{s.email}</span>
                    <span className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (statusColor[s.status === 'confirmed' ? 'confirmed' : s.status === 'pending' ? 'contacted' : 'new']) + '25', color: s.status === 'confirmed' ? '#3dba8a' : s.status === 'pending' ? '#e67e22' : '#7a8cc9' }}>
                        {s.status === 'confirmed' ? 'potrjen' : s.status === 'pending' ? 'čaka' : 'odjavljen'}
                      </span>
                      <span className="text-xs text-white/30">{fmtDate(s.created_at)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zavihek: Novice */}
        {tab === 'novice' && <>

        {/* Supabase sinhronizacija novic */}
        <div className="mb-6 p-5 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-white font-semibold text-sm">Supabase sinhronizacija novic</div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: syncSettings.hasKey ? 'rgba(61,186,138,0.2)' : 'rgba(224,122,122,0.2)', color: syncSettings.hasKey ? '#3dba8a' : '#e07a7a' }}>
              {syncSettings.hasKey ? 'nastavljeno' : 'ni ključa'}
            </span>
          </div>
          <div className="text-white/40 text-xs mb-3 leading-relaxed">
            Novice se samodejno sinhronizirajo v Supabase, da so na strani vidne tudi, ko je ta računalnik ugasnjen.
            Vnesi service_role ključ (Supabase → Settings → API).
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="password" value={syncKeyInput} onChange={e => setSyncKeyInput(e.target.value)}
              placeholder={syncSettings.hasKey ? '•••• (pusti prazno = brez spremembe)' : 'service_role ključ'} className={inp} style={inpStyle} />
            <button onClick={saveSyncSettings} disabled={savingSync}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110 whitespace-nowrap" style={{ background: '#4f6bbd' }}>
              {savingSync ? 'Shranjujem…' : 'Shrani ključ'}
            </button>
            <button onClick={syncNewsNow} disabled={syncing || !syncSettings.hasKey}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110 whitespace-nowrap" style={{ background: '#3dba8a' }}>
              {syncing ? 'Sinhroniziram…' : 'Sinhroniziraj zdaj'}
            </button>
          </div>
        </div>


        {/* Seznam novic */}
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (catColor[post.category] ?? '#7a8cc9') + '25', color: catColor[post.category] ?? '#7a8cc9' }}>
                    {post.category}
                  </span>
                  {!post.is_published && <span className="text-xs text-white/30 italic">skrita</span>}
                  <span className="text-xs text-white/30 ml-auto">{fmtDate(post.published_at)}</span>
                </div>
                <div className="text-white font-semibold text-sm">{post.title}</div>
                {post.excerpt && <div className="text-white/40 text-xs mt-0.5 truncate">{post.excerpt}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(post)} title={post.is_published ? 'Skrij' : 'Objavi'}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">
                  {post.is_published ? '👁 Skrij' : '📤 Objavi'}
                </button>
                <button onClick={() => { setEditing({ ...post }); setMsg('') }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">
                  ✏️ Uredi
                </button>
                <button onClick={() => del(post.id)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:text-red-400">
                  🗑
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-white/30 text-sm text-center py-10">Ni novic</p>}
        </div>
        </>}

      </div>
    </div>
  )
}
