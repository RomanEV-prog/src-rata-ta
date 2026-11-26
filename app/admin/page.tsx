'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import StaffRangeos from '@/components/StaffRangeos'
import AdminWizard from '@/components/AdminWizard'

// Super admin (Roman) vidi zavihek Nastavitve z občutljivimi stvarmi (ključi ipd.).
// Osebje ima enak dostop do novic/lige/novičnika, Nastavitve pa so zanje zaklenjene.
// Naslov super admina ni v kodi (javni repozitorij) — nastavi ga v .env.local.
const SUPER_ADMIN = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? '').trim().toLowerCase()
const WIZARD_SEEN_KEY = 'admin_wizard_seen_v1'

// Admin hub za osebje — zavihki: Novice (Supabase), Prijave na ligo, Novičnik.
// Novice pišejo DIREKTNO v Supabase (vidne tudi ko je strelišče ugasnjeno).
// Liga + novičnik gresta prek rangeos-api (komponenta StaffRangeos, poveže se enkrat).
// Paketi: /admin/paketi. Celotni stari RangeOS admin: /admin/rangeos.

interface NewsRow {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  category: string
  image_url: string | null
  attachment_url: string | null
  attachment_name: string | null
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
const EMPTY: Draft = { title: '', excerpt: '', content: '', category: 'obvestila', image_url: '', attachment_url: '', attachment_name: '', slug: '', is_published: true, published_at: Date.now() }

// Pretvori naslov v URL-prijazen slug (šumniki → ascii). Novica se na strani odpre SAMO prek slug-a.
function slugify(s: string): string {
  return (s || '').toLowerCase()
    .replace(/č/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/ć/g, 'c').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

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
  const [uploading, setUploading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'novice' | 'liga' | 'novicnik' | 'nastavitve'>('novice')
  const [showWizard, setShowWizard] = useState(false)
  // Nastavitev gesla ob povabilu / obnovi (povabljen uporabnik pride prek mejla).
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [settingPass, setSettingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [showChangePass, setShowChangePass] = useState(false)

  const isSuper = SUPER_ADMIN !== '' && (session?.user?.email ?? '').toLowerCase() === SUPER_ADMIN

  useEffect(() => {
    // Ob povabilu/obnovi Supabase doda žeton v naslov (#...type=invite/recovery) → prikaži nastavitev gesla.
    if (typeof window !== 'undefined') {
      const hq = (window.location.hash || '') + ' ' + (window.location.search || '')
      if (/type=(invite|recovery|signup)/.test(hq)) setRecoveryMode(true)
    }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setSession(s)
      if (e === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function setPassword() {
    setPassMsg('')
    if (newPass.length < 8) { setPassMsg('Geslo mora imeti vsaj 8 znakov.'); return }
    if (newPass !== newPass2) { setPassMsg('Gesli se ne ujemata.'); return }
    setSettingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) { setPassMsg('Napaka: ' + (error.message === 'Auth session missing!' ? 'povezava je potekla — prosi Romana za novo povabilo.' : error.message)); setSettingPass(false); return }
    setSettingPass(false)
    const wasChange = showChangePass
    setRecoveryMode(false); setShowChangePass(false); setNewPass(''); setNewPass2(''); setPassMsg('')
    try { window.history.replaceState(null, '', window.location.pathname) } catch {}
    setMsg(wasChange ? 'Geslo spremenjeno.' : 'Geslo nastavljeno! Zdaj si prijavljen.')
  }

  // Čarovnik se osebju (ne super adminu) samodejno pokaže ob prvi prijavi.
  useEffect(() => {
    if (!session) return
    const email = (session.user?.email ?? '').toLowerCase()
    if (email === SUPER_ADMIN) return
    try { if (!localStorage.getItem(WIZARD_SEEN_KEY)) setShowWizard(true) } catch {}
  }, [session])

  function closeWizard() {
    setShowWizard(false)
    try { localStorage.setItem(WIZARD_SEEN_KEY, '1') } catch {}
  }

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    if (!error && data) setPosts(data as NewsRow[])
  }, [])

  useEffect(() => { if (session) fetchPosts() }, [session, fetchPosts])

  async function login() {
    setLoginErr(''); setLoggingIn(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass.trim() })
    if (error) setLoginErr(error.message === 'Invalid login credentials' ? 'Napačen e-mail ali geslo.' : error.message)
    setLoggingIn(false)
  }

  async function logout() { await supabase.auth.signOut(); setPosts([]) }

  // Naloži sliko z računalnika na Supabase Storage → shrani javni URL v image_url.
  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) { setMsg('Napaka: izberi slikovno datoteko (JPG/PNG/WebP).'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('Napaka: slika je prevelika (največ 5 MB).'); return }
    setUploading(true); setMsg('')
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'slika'
    const path = `${Date.now()}-${base}.${ext}`
    const { error } = await supabase.storage.from('news-images').upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) { setMsg('Napaka pri nalaganju slike: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('news-images').getPublicUrl(path)
    setEditing(p => ({ ...p, image_url: data.publicUrl }))
    setUploading(false)
  }

  // Naloži PDF prilogo z računalnika na Supabase Storage → shrani URL + ime v novico.
  async function uploadAttachment(file: File) {
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { setMsg('Napaka: priloga mora biti PDF.'); return }
    if (file.size > 10 * 1024 * 1024) { setMsg('Napaka: PDF je prevelik (največ 10 MB).'); return }
    setUploadingPdf(true); setMsg('')
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50) || 'priloga'
    const path = `pdf/${Date.now()}-${base}.pdf`
    const { error } = await supabase.storage.from('news-images').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: 'application/pdf' })
    if (error) { setMsg('Napaka pri nalaganju priloge: ' + error.message); setUploadingPdf(false); return }
    const { data } = supabase.storage.from('news-images').getPublicUrl(path)
    setEditing(p => ({ ...p, attachment_url: data.publicUrl, attachment_name: file.name }))
    setUploadingPdf(false)
  }

  async function save() {
    if (!editing || !editing.title?.trim()) return
    setSaving(true); setMsg('')
    // Slug je obvezen (stran odpira novico samo prek njega); če je prazen, ga sestavimo iz naslova.
    let slug = editing.slug?.trim() || slugify(editing.title) || `novica-${Date.now().toString(36)}`
    if (posts.some(p => p.slug === slug && p.id !== editing.id)) slug = `${slug}-${Date.now().toString(36)}`
    const row = {
      title: editing.title.trim(),
      excerpt: editing.excerpt?.trim() || null,
      content: editing.content?.trim() || null,
      category: editing.category || 'obvestila',
      image_url: editing.image_url?.trim() || null,
      attachment_url: editing.attachment_url?.trim() || null,
      attachment_name: editing.attachment_name?.trim() || null,
      slug,
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

  // ---- NASTAVITEV GESLA (povabilo / obnova) ----
  if (recoveryMode) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0f14' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-white font-black text-2xl mb-1 text-center">Nastavi geslo</h1>
        <p className="text-white/40 text-xs text-center mb-6">Dobrodošel/-la! Nastavi svoje geslo za dostop do admina.</p>
        <div className="space-y-4">
          <input type="password" placeholder="Novo geslo (vsaj 8 znakov)" value={newPass} onChange={e => setNewPass(e.target.value)} className={inp} style={inpStyle} />
          <input type="password" placeholder="Ponovi geslo" value={newPass2} onChange={e => setNewPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPassword()} className={inp} style={inpStyle} />
          {passMsg && <p className={passMsg.startsWith('Napaka') ? 'text-red-400 text-xs' : 'text-green-400 text-xs'}>{passMsg}</p>}
          <button onClick={setPassword} disabled={settingPass} className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:brightness-110 disabled:opacity-50" style={{ background: '#4f6bbd' }}>{settingPass ? 'Shranjujem…' : 'Nastavi geslo in vstopi'}</button>
          <button onClick={() => { setRecoveryMode(false); try { window.history.replaceState(null, '', window.location.pathname) } catch {} }} className="w-full text-white/30 text-xs hover:text-white/60">Imam že geslo — na prijavo</button>
        </div>
      </div>
    </div>
  )

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
      {showWizard && <AdminWizard onClose={closeWizard} />}
      {showChangePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowChangePass(false)}>
          <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-black text-xl mb-1 text-center">Spremeni geslo</h2>
            <p className="text-white/40 text-xs text-center mb-6">Vnesi novo geslo za svoj račun.</p>
            <div className="space-y-4">
              <input type="password" placeholder="Novo geslo (vsaj 8 znakov)" value={newPass} onChange={e => setNewPass(e.target.value)} className={inp} style={inpStyle} />
              <input type="password" placeholder="Ponovi geslo" value={newPass2} onChange={e => setNewPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPassword()} className={inp} style={inpStyle} />
              {passMsg && <p className={passMsg.startsWith('Napaka') ? 'text-red-400 text-xs' : 'text-green-400 text-xs'}>{passMsg}</p>}
              <button onClick={setPassword} disabled={settingPass} className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:brightness-110 disabled:opacity-50" style={{ background: '#4f6bbd' }}>{settingPass ? 'Shranjujem…' : 'Shrani novo geslo'}</button>
              <button onClick={() => setShowChangePass(false)} className="w-full text-white/30 text-xs hover:text-white/60">Prekliči</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-black text-2xl">Admin</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowWizard(true)} className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">❔ Vodič</button>
            <button onClick={() => { setPassMsg(''); setNewPass(''); setNewPass2(''); setShowChangePass(true) }} className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">🔑 Geslo</button>
            <a href="/admin/paketi" className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">📦 Paketi</a>
            <a href="/admin/cenik" className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">💶 Cenik</a>
            <button onClick={logout} className="px-4 py-2 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">Odjava</button>
          </div>
        </div>

        {/* Zavihki */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {([['novice', 'Novice'], ['liga', 'Prijave na ligo'], ['novicnik', 'Novičnik'], ['nastavitve', '🔒 Nastavitve']] as const).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setEditing(null) }}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: tab === t ? '#4f6bbd' : '#1a1f2e', color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {label}
            </button>
          ))}
          {tab === 'novice' && (
            <button onClick={() => { setEditing({ ...EMPTY }); setMsg('') }} className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-semibold hover:brightness-110" style={{ background: '#4f6bbd' }}>+ Nova novica</button>
          )}
        </div>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: msg.startsWith('Napaka') ? '#2a1a1a' : '#1a2a1a', color: msg.startsWith('Napaka') ? '#e07a7a' : '#3dba8a' }}>{msg}</div>}

        {tab === 'liga' && <StaffRangeos section="liga" />}
        {tab === 'novicnik' && <StaffRangeos section="novicnik" />}

        {tab === 'nastavitve' && (
          <div>
            <div className="mb-6 px-4 py-4 rounded-xl flex items-start gap-3" style={{ background: '#2a2416', border: '1px solid rgba(230,160,40,0.35)' }}>
              <span className="text-xl leading-none">⚠️</span>
              <div className="text-sm leading-relaxed" style={{ color: '#e6b84a' }}>
                <b>Te nastavitve ureja Roman (super admin).</b> Prosim, ne spreminjaj ničesar tukaj — napačna sprememba lahko pokvari pošiljanje novic. Če kaj rabiš, javi Romanu.
              </div>
            </div>
            {isSuper
              ? <StaffRangeos section="nastavitve" />
              : (
                <div className="p-10 rounded-2xl text-center" style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-white font-semibold mb-1">Zaklenjeno</p>
                  <p className="text-white/40 text-sm">Nastavitve lahko spreminja samo Roman. Tvoj račun ima dostop do novic, lige in novičnika.</p>
                </div>
              )}
          </div>
        )}

        {tab === 'novice' && <>
        <p className="text-white/35 text-xs mb-6">Shranjeno v Supabase — vidno na strani tudi, ko je strelišče ugasnjeno.</p>

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
                <label className="text-xs text-white/40 mb-1 block">Slika (opcijsko)</label>
                {editing.image_url ? (
                  <div className="flex items-center gap-3 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editing.image_url} alt="" className="w-20 h-20 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button type="button" onClick={() => setEditing(p => ({ ...p, image_url: '' }))} className="text-xs text-red-400/70 hover:text-red-400 underline">Odstrani sliko</button>
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white cursor-pointer hover:brightness-110" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Nalagam…' : (editing.image_url ? '🔄 Zamenjaj sliko' : '📷 Naloži sliko z računalnika')}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
                </label>
                <p className="text-white/25 text-[11px] mt-1">JPG / PNG / WebP, do 5 MB. Shrani se na strežnik (Supabase Storage).</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Priloga PDF (opcijsko)</label>
                {editing.attachment_url ? (
                  <div className="flex items-center gap-3 mb-2">
                    <a href={editing.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-white/80 underline hover:text-white">
                      📄 {editing.attachment_name || 'priloga.pdf'}
                    </a>
                    <button type="button" onClick={() => setEditing(p => ({ ...p, attachment_url: '', attachment_name: '' }))} className="text-xs text-red-400/70 hover:text-red-400 underline">Odstrani</button>
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white cursor-pointer hover:brightness-110" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', opacity: uploadingPdf ? 0.6 : 1 }}>
                  {uploadingPdf ? 'Nalagam…' : (editing.attachment_url ? '🔄 Zamenjaj PDF' : '📎 Pripni PDF z računalnika')}
                  <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={uploadingPdf} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = '' }} />
                </label>
                <p className="text-white/25 text-[11px] mt-1">PDF, do 10 MB. Na strani se pokaže gumb za prenos.</p>
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
        </>}

      </div>
    </div>
  )
}
