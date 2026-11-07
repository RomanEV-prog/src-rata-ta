'use client'
import { useState, useEffect, useCallback } from 'react'

const API = 'https://rangeos-api.adlerhub.eu'

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
  const [tab, setTab] = useState<'novice' | 'liga'>('novice')
  const [ligaRegs, setLigaRegs] = useState<LigaReg[]>([])

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

  useEffect(() => { if (token) { fetchNews(token); fetchConfig(); fetchLiga(token) } }, [token, fetchNews, fetchConfig, fetchLiga])

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
          {(['novice', 'liga'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: tab === t ? '#4f6bbd' : '#1a1f2e', color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {t === 'novice' ? 'Novice' : `Prijave na ligo${ligaRegs.filter(r => r.status === 'new').length > 0 ? ` (${ligaRegs.filter(r => r.status === 'new').length})` : ''}`}
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

        {/* Zavihek: Novice */}
        {tab === 'novice' && <>

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
