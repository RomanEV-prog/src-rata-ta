'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Admin novic — piše DIREKTNO v Supabase (neodvisno od recepcijskega PC/RangeOS).
// Novice so tako vidne na strani in urejljive tudi, ko je strelišče ugasnjeno.
// Prijave na ligo + novičnik so na /admin/rangeos (RangeOS, potrebuje PC).

interface NewsRow {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  category: string
  image_url: string | null
  slug: string | null
  is_published: boolean
  published_at: number
  updated_at: number | null
}

const KATEGORIJE = ['obvestila', 'izobraževanja', 'novosti', 'dogodki']
const catColor: Record<string, string> = { 'izobraževanja': '#3dba8a', 'obvestila': '#7a8cc9', 'novosti': '#e67e22', 'dogodki': '#c0392b' }

function fmtDate(ms: number) { return new Date(ms).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' }) }
function isoToMs(iso: string) { return new Date(iso).getTime() }
function msToIso(ms: number) { const d = new Date(ms); const off = d.getTimezoneOffset() * 60000; return new Date(ms - off).toISOString().slice(0, 16) }

type Draft = Partial<NewsRow>
const EMPTY: Draft = { title: '', excerpt: '', content: '', category: 'obvestila', image_url: '', slug: '', is_published: true, published_at: Date.now() }

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [posts, setPosts] = useState<NewsRow[]>([])
  const [editing, setEditing] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    if (!error && data) setPosts(data as NewsRow[])
  }, [])

  useEffect(() => { if (session) fetchPosts() }, [session, fetchPosts])

  async function login() {
    setLoginErr(''); setLoggingIn(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (error) setLoginErr(error.message === 'Invalid login credentials' ? 'Napačen e-mail ali geslo.' : error.message)
    setLoggingIn(false)
  }

  async function logout() { await supabase.auth.signOut(); setPosts([]) }

  async function save() {
    if (!editing || !editing.title?.trim()) return
    setSaving(true); setMsg('')
    const row = {
      title: editing.title.trim(),
      excerpt: editing.excerpt?.trim() || null,
      content: editing.content?.trim() || null,
      category: editing.category || 'obvestila',
      image_url: editing.image_url?.trim() || null,
      slug: editing.slug?.trim() || null,
      is_published: editing.is_published ?? true,
      published_at: editing.published_at ?? Date.now(),
      updated_at: Date.now(),
    }
    const res = editing.id
      ? await supabase.from('news').update(row).eq('id', editing.id)
      : await supabase.from('news').insert(row)
    if (res.error) { setMsg('Napaka: ' + res.error.message) }
    else { setMsg(editing.id ? 'Shranjeno!' : 'Novica dodana!'); setEditing(null); await fetchPosts() }
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('Zbriši novico? Tega ni mogoče razveljaviti.')) return
    const { error } = await supabase.from('news').delete().eq('id', id)
    if (error) setMsg('Napaka pri brisanju: ' + error.message)
    else await fetchPosts()
  }

  async function togglePublish(post: NewsRow) {
    const { error } = await supabase.from('news').update({ is_published: !post.is_published, updated_at: Date.now() }).eq('id', post.id)
    if (error) setMsg('Napaka: ' + error.message)
    else await fetchPosts()
  }

  const inp = 'w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }

  // ---- PRIJAVA ----
  if (!authReady) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}><div className="text-white/40 text-sm">Nalagam…</div></div>

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0f14' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-white font-black text-2xl mb-1 text-center">Admin — novice</h1>
        <p className="text-white/40 text-xs text-center mb-6">Prijava za urejanje novic</p>
        <div className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={inp} style={inpStyle} />
          <input type="password" placeholder="Geslo" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} className={inp} style={inpStyle} />
          {loginErr && <p className="text-red-400 text-xs">{loginErr}</p>}
          <button onClick={login} disabled={loggingIn} className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:brightness-110 disabled:opacity-50" style={{ background: '#4f6bbd' }}>{loggingIn ? 'Prijavljam…' : 'Prijava'}</button>
        </div>
      </div>
    </div>
  )

  // ---- ADMIN ----
  return (
    <div className="min-h-screen" style={{ background: '#0d0f14' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white font-black text-2xl">Novice</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing({ ...EMPTY }); setMsg('') }} className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:brightness-110" style={{ background: '#4f6bbd' }}>+ Nova novica</button>
            <button onClick={logout} className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">Odjava</button>
          </div>
        </div>
        <p className="text-white/35 text-xs mb-6">Shranjeno v Supabase — vidno na strani tudi, ko je strelišče ugasnjeno. Prijave na ligo in novičnik: <a href="/admin/rangeos" className="underline hover:text-white/60">/admin/rangeos</a> (potrebuje RangeOS).</p>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: msg.startsWith('Napaka') ? '#2a1a1a' : '#1a2a1a', color: msg.startsWith('Napaka') ? '#e07a7a' : '#3dba8a' }}>{msg}</div>}

        {/* Forma */}
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
                <input type="checkbox" id="pub" checked={editing.is_published ?? true} onChange={e => setEditing(p => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="pub" className="text-sm text-white/70">Objaviti (vidno na strani)</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving || !editing.title?.trim()} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>{saving ? 'Shranjujem…' : (editing.id ? 'Shrani' : 'Objavi')}</button>
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl text-white/50 text-sm border border-white/10 hover:text-white">Prekliči</button>
            </div>
          </div>
        )}

        {/* Seznam */}
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (catColor[post.category] ?? '#7a8cc9') + '25', color: catColor[post.category] ?? '#7a8cc9' }}>{post.category}</span>
                  {!post.is_published && <span className="text-xs text-white/30 italic">skrita</span>}
                  <span className="text-xs text-white/30 ml-auto">{fmtDate(post.published_at)}</span>
                </div>
                <div className="text-white font-semibold text-sm">{post.title}</div>
                {post.excerpt && <div className="text-white/40 text-xs mt-0.5 truncate">{post.excerpt}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(post)} title={post.is_published ? 'Skrij' : 'Objavi'} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">{post.is_published ? '👁 Skrij' : '📤 Objavi'}</button>
                <button onClick={() => { setEditing({ ...post }); setMsg('') }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white">✏️ Uredi</button>
                <button onClick={() => del(post.id)} className="px-3 py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:text-red-400">🗑</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-white/30 text-sm text-center py-10">Ni novic — klikni “+ Nova novica”.</p>}
        </div>

      </div>
    </div>
  )
}
