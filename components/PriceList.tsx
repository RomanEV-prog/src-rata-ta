'use client'
import { useState, useEffect } from 'react'
import { fetchPriceItems, groupBySection, fmtAmount, type PriceItem } from '@/lib/prices'

/** Razdelki cenika (strelišče, usposabljanja …) iz Supabase `price_items`; ureja se v /admin/cenik. */
export default function PriceList() {
  // Brez začetnih vrednosti: v ceniku ne sme niti za hip stati zastarela cena.
  const [items, setItems] = useState<PriceItem[] | null>(null)

  useEffect(() => { fetchPriceItems().then(setItems) }, [])

  if (items === null) return <p className="text-sm text-white/40">Nalaganje cenika …</p>

  return (
    <>
      {groupBySection(items).map((g) => (
        <div key={g.section} className="mb-14">
          <h2 className="text-xl font-black text-white mb-6 tracking-wider">{g.section}</h2>
          <div className="space-y-3">
            {g.items.map((it) => (
              <div
                key={it.id}
                className="rounded-xl p-6 flex justify-between items-center"
                style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div>
                  <div className="font-semibold text-white text-sm">{it.title}</div>
                  {it.subtitle && <div className="text-xs text-white/45 mt-0.5">{it.subtitle}</div>}
                </div>
                <div className="text-right ml-6 shrink-0">
                  <span className="text-3xl font-black text-white">{fmtAmount(it.price)}</span>
                  {it.unit && <span className="text-xs text-white/40 ml-1">{it.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
