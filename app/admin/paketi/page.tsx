'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Admin paketov — ureja cene, slike in opise paketov (Supabase tabela `packages`).
// Stran /paketi bere iste podatke. Prijava je skupna z /admin (Supabase Auth).

interface PackageRow {
  id: number
  name: string
  price: number | null
  includes: string[] | null
  image_url: string | null
  featured: boolean
  is_active: boolean
  sort_order: number
}

function fmtPrice(p: number | null) { return p == null ? '' : p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' }

export default function PaketiAdmin() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [rows, setRows] = useState<PackageRow[]>([])
  const [selId, setSelId] = useState<number | null>(null)
  const [draft, setDraft] = useState<PackageRow | null>(null)
  const [includesText, setIncludesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase.from('packages').select('*').order('sort_order', { ascending: true })
    if (!error && data) setRows(data as PackageRow[])
  }, [])

  useEffect(() => { if (session) fetchRows() }, [session, fetchRows])

  function select(id: number) {
    const r = rows.find(x => x.id === id) || null
    setSelId(id)
    setDraft(r ? { ...r } : null)
    setIncludesText(r?.includes ? r.includes.join('\n') : '')
    setMsg('')
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) { setMsg('Napaka: izberi slikovno datoteko.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('Napaka: slika je prevelika (največ 5 MB).'); return }
    setUploading(true); setMsg('')
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'paket'
    const path = `paketi/${Date.now()}-${base}.${ext}`
    const { error } = await supabase.storage.from('news-images').upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) { setMsg('Napaka pri nalaganju slike: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('news-images').getPublicUrl(path)
    setDraft(p => p ? { ...p, image_url: data.publicUrl } : p)
    setUploading(false)
  }

  async function save() {
    if (!draft) return
    setSaving(true); setMsg('')
    const includes = includesText.split('\n').map(s => s.trim()).filter(Boolean)
    const row = {
      price: draft.price,
      includes: includes.length ? includes : null,
      image_url: draft.image_url?.trim() || null,
      featured: draft.featured,
      is_active: draft.is_active,
      updated_at: Date.now(),
    }
    const { error } = await supabase.from('packages').update(row).eq('id', draft.id)
    if (error) setMsg('Napaka: ' + error.message)
    else { setMsg('Shranjeno!'); await fetchRows() }
    setSaving(false)
  }

  const inp = 'w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }

  if (!authReady) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}><div className="text-white/40 text-sm">Nalagam…</div></div>

  if (!session) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: '#0d0f14' }}>
      <p className="text-white/60 mb-4">Za urejanje paketov se prijavi v admin.</p>
      <a href="/admin" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#4f6bbd' }}>Na prijavo (/admin)</a>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0d0f14' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white font-black text-2xl">Paketi</h1>
          <a href="/admin" className="text-white/50 text-sm hover:text-white underline">← Novice</a>
        </div>
        <p className="text-white/35 text-xs mb-6">Uredi ceno, sliko in »Vključuje«. Prikaže se na strani <a href="/paketi" className="underline hover:text-white/60">/paketi</a>.</p>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: msg.startsWith('Napaka') ? '#2a1a1a' : '#1a2a1a', color: msg.startsWith('Napaka') ? '#e07a7a' : '#3dba8a' }}>{msg}</div>}

        <div className="mb-6">
          <label className="text-xs text-white/40 mb-1 block">Izberi paket</label>
          <select value={selId ?? ''} onChange={e => select(Number(e.target.value))} className={inp} style={inpStyle}>
            <option value="" disabled>— izberi paket —</option>
            {rows.map(r => <option key={r.id} value={r.id}>{r.name} ({fmtPrice(r.price)}){r.is_active ? '' : ' — skrit'}</option>)}
          </select>
        </div>

        {draft && (
          <div className="p-6 rounded-2xl space-y-4" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.3)' }}>
            <h2 className="text-white font-bold">{draft.name}</h2>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Cena (€)</label>
              <input type="number" step="0.5" value={draft.price ?? ''} onChange={e => setDraft(p => p ? { ...p, price: e.target.value === '' ? null : Number(e.target.value) } : p)} className={inp} style={inpStyle} />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Vključuje (vsaka postavka v svojo vrstico)</label>
              <textarea rows={5} value={includesText} onChange={e => setIncludesText(e.target.value)} placeholder={'Pištola Glock, 10 nabojev\nRevolver Uberti, 6 nabojev'} className={inp + ' resize-none'} style={inpStyle} />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Slika</label>
              {draft.image_url ? (
                <div className="flex items-center gap-3 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.image_url} alt="" className="w-24 h-20 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button type="button" onClick={() => setDraft(p => p ? { ...p, image_url: '' } : p)} className="text-xs text-red-400/70 hover:text-red-400 underline">Odstrani sliko</button>
                </div>
              ) : null}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white cursor-pointer hover:brightness-110" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Nalagam…' : (draft.image_url ? '🔄 Zamenjaj sliko' : '📷 Naloži sliko z računalnika')}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
              </label>
              <p className="text-white/25 text-[11px] mt-1">JPG / PNG / WebP, do 5 MB. Shrani se na strežnik.</p>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={draft.featured} onChange={e => setDraft(p => p ? { ...p, featured: e.target.checked } : p)} className="w-4 h-4" />
                Izpostavljen (zelen okvir)
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={draft.is_active} onChange={e => setDraft(p => p ? { ...p, is_active: e.target.checked } : p)} className="w-4 h-4" />
                Prikazan na strani
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
            </div>
          </div>
        )}

        {/* Pregled vseh paketov — kateri so aktivni na strani */}
        <div className="mt-10">
          <h2 className="text-white font-bold text-sm mb-1">Vsi paketi</h2>
          <p className="text-white/35 text-xs mb-4">Zeleno = prikazan na strani · klikni za urejanje. Vrstni red = kot na strani.</p>
          <div className="space-y-2">
            {rows.map(r => (
              <button key={r.id} onClick={() => select(r.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:brightness-110"
                style={{ background: '#131720', border: `1px solid ${r.id === selId ? 'rgba(79,107,189,0.6)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="w-14 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(79,107,189,0.18), #0f131b)' }}>
                  {r.image_url
                    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white/20 text-xl">🎯</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">{r.name}</span>
                    {r.featured && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#3dba8a25', color: '#3dba8a' }}>izpostavljen</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/60 text-xs">{fmtPrice(r.price)}</span>
                    <span className="text-white/25 text-xs">·</span>
                    <span className="text-xs" style={{ color: r.includes && r.includes.length ? '#3dba8a' : '#e67e22' }}>{r.includes && r.includes.length ? `${r.includes.length} postavk` : 'brez opisa'}</span>
                    <span className="text-white/25 text-xs">·</span>
                    <span className="text-xs" style={{ color: r.image_url ? '#3dba8a' : '#e67e22' }}>{r.image_url ? 'slika ✓' : 'brez slike'}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: (r.is_active ? '#3dba8a' : '#7a8cc9') + '25', color: r.is_active ? '#3dba8a' : '#7a8cc9' }}>
                  {r.is_active ? 'na strani' : 'skrit'}
                </span>
              </button>
            ))}
            {rows.length === 0 && <p className="text-white/30 text-sm text-center py-6">Nalagam pakete…</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
