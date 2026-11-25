'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { groupBySection, fmtAmount, type PriceItem } from '@/lib/prices'

// Admin cenika — ureja postavke strani /ceniki (Supabase tabela `price_items`).
// Cene paketov streljanja so posebej v /admin/paketi. Prijava je skupna z /admin.

type Draft = Omit<PriceItem, 'id'> & { id: number | null }

const EMPTY: Draft = { id: null, section: '', title: '', subtitle: '', price: null, unit: '', sort_order: 0, is_active: true }

export default function CenikAdmin() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [rows, setRows] = useState<PriceItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase.from('price_items').select('*').order('sort_order', { ascending: true })
    if (error) setMsg('Napaka pri branju cenika: ' + error.message)
    else if (data) setRows(data as PriceItem[])
    setLoaded(true)
  }, [])

  useEffect(() => { if (session) fetchRows() }, [session, fetchRows])

  function edit(r: PriceItem) { setDraft({ ...r, subtitle: r.subtitle ?? '', unit: r.unit ?? '' }); setMsg('') }

  /** Nova postavka: na konec izbranega razdelka (ali na konec cenika). */
  function addNew(section: string) {
    const inSection = rows.filter(r => r.section === section)
    const base = inSection.length ? inSection : rows
    const last = base.length ? Math.max(...base.map(r => r.sort_order)) : 0
    setDraft({ ...EMPTY, section, sort_order: last + 10 })
    setMsg('')
  }

  async function save() {
    if (!draft) return
    const section = draft.section.trim(), title = draft.title.trim()
    if (!section || !title) { setMsg('Napaka: razdelek in naziv sta obvezna.'); return }
    setSaving(true); setMsg('')
    const row = {
      section, title,
      subtitle: draft.subtitle?.trim() || null,
      price: draft.price,
      unit: draft.unit?.trim() || null,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
      updated_at: Date.now(),
    }
    const { error } = draft.id == null
      ? await supabase.from('price_items').insert(row)
      : await supabase.from('price_items').update(row).eq('id', draft.id)
    if (error) setMsg('Napaka: ' + error.message)
    else { setMsg('Shranjeno!'); setDraft(null); await fetchRows() }
    setSaving(false)
  }

  async function remove() {
    if (!draft || draft.id == null) return
    if (!window.confirm(`Izbrišem postavko »${draft.title}«? Tega ni mogoče razveljaviti.`)) return
    setSaving(true); setMsg('')
    const { error } = await supabase.from('price_items').delete().eq('id', draft.id)
    if (error) setMsg('Napaka: ' + error.message)
    else { setMsg('Izbrisano.'); setDraft(null); await fetchRows() }
    setSaving(false)
  }

  const inp = 'w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-400'
  const inpStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }

  if (!authReady) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}><div className="text-white/40 text-sm">Nalagam…</div></div>

  if (!session) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: '#0d0f14' }}>
      <p className="text-white/60 mb-4">Za urejanje cenika se prijavi v admin.</p>
      <a href="/admin" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#4f6bbd' }}>Na prijavo (/admin)</a>
    </div>
  )

  const groups = groupBySection(rows)
  const sections = groups.map(g => g.section)

  return (
    <div className="min-h-screen" style={{ background: '#0d0f14' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white font-black text-2xl">Cenik</h1>
          <a href="/admin" className="text-white/50 text-sm hover:text-white underline">← Admin</a>
        </div>
        <p className="text-white/35 text-xs mb-6">
          Postavke strani <a href="/ceniki" className="underline hover:text-white/60">/ceniki</a>. Sprememba je na strani vidna takoj.
          Cene paketov streljanja urejaš v <a href="/admin/paketi" className="underline hover:text-white/60">📦 Paketi</a> — na ceniku se prikažejo samodejno.
        </p>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: msg.startsWith('Napaka') ? '#2a1a1a' : '#1a2a1a', color: msg.startsWith('Napaka') ? '#e07a7a' : '#3dba8a' }}>{msg}</div>}

        {draft && (
          <div className="p-6 rounded-2xl space-y-4 mb-10" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.3)' }}>
            <h2 className="text-white font-bold">{draft.id == null ? 'Nova postavka' : 'Uredi postavko'}</h2>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Razdelek (naslov skupine na strani)</label>
              <input list="cenik-razdelki" value={draft.section} onChange={e => setDraft(p => p ? { ...p, section: e.target.value } : p)} placeholder="npr. Strelišče" className={inp} style={inpStyle} />
              <datalist id="cenik-razdelki">{sections.map(s => <option key={s} value={s} />)}</datalist>
              <p className="text-white/25 text-[11px] mt-1">Izberi obstoječega ali vpiši novega — nov razdelek nastane sam.</p>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Naziv</label>
              <input value={draft.title} onChange={e => setDraft(p => p ? { ...p, title: e.target.value } : p)} placeholder="npr. Najem strelne linije" className={inp} style={inpStyle} />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Opis (manjša vrstica pod nazivom, neobvezno)</label>
              <input value={draft.subtitle ?? ''} onChange={e => setDraft(p => p ? { ...p, subtitle: e.target.value } : p)} className={inp} style={inpStyle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Cena (€)</label>
                <input type="number" step="0.5" value={draft.price ?? ''} onChange={e => setDraft(p => p ? { ...p, price: e.target.value === '' ? null : Number(e.target.value) } : p)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Enota (neobvezno)</label>
                <input value={draft.unit ?? ''} onChange={e => setDraft(p => p ? { ...p, unit: e.target.value } : p)} placeholder="/osebo, /uro, /4h" className={inp} style={inpStyle} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Vrstni red (manjša številka = višje)</label>
                <input type="number" step="1" value={draft.sort_order} onChange={e => setDraft(p => p ? { ...p, sort_order: Number(e.target.value) || 0 } : p)} className={inp} style={inpStyle} />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70 pb-2.5">
                <input type="checkbox" checked={draft.is_active} onChange={e => setDraft(p => p ? { ...p, is_active: e.target.checked } : p)} className="w-4 h-4" />
                Prikazano na strani
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110" style={{ background: '#4f6bbd' }}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
              <button onClick={() => { setDraft(null); setMsg('') }} disabled={saving} className="px-4 py-2.5 rounded-xl text-white/50 text-sm hover:text-white border border-white/10">Prekliči</button>
              {draft.id != null && <button onClick={remove} disabled={saving} className="ml-auto text-xs text-red-400/70 hover:text-red-400 underline">Izbriši postavko</button>}
            </div>
          </div>
        )}

        {groups.map(g => (
          <div key={g.section} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-sm">{g.section}</h2>
              <button onClick={() => addNew(g.section)} className="text-xs text-blue-400 hover:underline">+ Dodaj postavko</button>
            </div>
            <div className="space-y-2">
              {g.items.map(r => (
                <button key={r.id} onClick={() => edit(r)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:brightness-110"
                  style={{ background: '#131720', border: `1px solid ${draft?.id === r.id ? 'rgba(79,107,189,0.6)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{r.title}</div>
                    {r.subtitle && <div className="text-white/40 text-xs truncate mt-0.5">{r.subtitle}</div>}
                  </div>
                  <span className="text-white font-bold text-sm flex-shrink-0">{fmtAmount(r.price)} € <span className="text-white/40 font-normal text-xs">{r.unit}</span></span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: (r.is_active ? '#3dba8a' : '#7a8cc9') + '25', color: r.is_active ? '#3dba8a' : '#7a8cc9' }}>
                    {r.is_active ? 'na strani' : 'skrito'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {loaded && rows.length === 0 && <p className="text-white/30 text-sm text-center py-6">Cenik je prazen.</p>}
        {!loaded && <p className="text-white/30 text-sm text-center py-6">Nalagam cenik…</p>}

        <button onClick={() => addNew('')} className="mt-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:brightness-110" style={{ background: '#4f6bbd' }}>+ Nova postavka / nov razdelek</button>
      </div>
    </div>
  )
}
