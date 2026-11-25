'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchPackages, fmtPrice, type PackageRow } from '@/lib/packages'

/**
 * Cene paketov na strani Ceniki. Bere isti vir kot drsnik na /paketi
 * (Supabase `packages` prek fetchPackages), zato sta strani vedno usklajeni —
 * sprememba v /admin/paketi se pozna na obeh.
 */
export default function PackagesPriceList() {
  // Brez začetnih vrednosti: v ceniku ne sme niti za hip stati zastarela cena.
  const [packages, setPackages] = useState<PackageRow[] | null>(null)

  useEffect(() => { fetchPackages().then(setPackages) }, [])

  if (packages === null) {
    return <p className="text-sm text-white/40">Nalaganje cen paketov …</p>
  }

  return (
    <>
      <div className="space-y-3">
        {packages.map((p) => (
          <div
            key={p.id}
            className="rounded-xl p-6 flex justify-between items-center"
            style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="font-semibold text-white text-sm">{p.name}</div>
            <div className="text-right ml-6 shrink-0">
              <span className="text-3xl font-black text-white">{fmtPrice(p.price).replace(' €', '')}</span>
              <span className="text-xs text-white/40 ml-1">€</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm mt-4">
        <Link href="/paketi" className="text-blue-400 hover:underline">
          Kaj vključuje posamezen paket →
        </Link>
      </p>
    </>
  )
}
