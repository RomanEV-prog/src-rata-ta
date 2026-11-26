'use client'
import { useState, useEffect, useRef } from 'react'
import { fetchPackages, fmtPrice, FALLBACK_PACKAGES, type PackageRow } from '@/lib/packages'

export default function PackagesSlider() {
  const [packages, setPackages] = useState<PackageRow[]>(FALLBACK_PACKAGES)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchPackages().then(setPackages) }, [])

  function scrollBy(dir: number) {
    const el = scroller.current
    if (!el) return
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Puščici */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Prejšnji"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-11 h-11 rounded-full items-center justify-center text-white transition hover:brightness-125"
        style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Naslednji"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-11 h-11 rounded-full items-center justify-center text-white transition hover:brightness-125"
        style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Drsnik */}
      <div
        ref={scroller}
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            data-card
            className={`snap-start flex-shrink-0 w-[260px] sm:w-[280px] rounded-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1`}
            style={{
              background: '#131720',
              border: pkg.featured ? '2px solid #3dba8a' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: pkg.featured ? '0 0 20px rgba(61,186,138,0.15)' : undefined,
            }}
          >
            <div className="h-44 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(79,107,189,0.18), #0f131b)' }}>
              {pkg.image_url
                ? <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <span className="text-white/20 text-5xl font-black">🎯</span>}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                {pkg.featured && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: '#3dba8a25', color: '#3dba8a' }}>Priljubljen</span>}
              </div>
              {pkg.includes && pkg.includes.length > 0 ? (
                <>
                  <div className="text-xs text-white/50 mb-1">Vključuje:</div>
                  <ul className="space-y-1 flex-1">
                    {pkg.includes.map((item, i) => (
                      <li key={i} className="text-xs text-white/70">• {item}</li>
                    ))}
                  </ul>
                </>
              ) : <div className="flex-1" />}
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-white/60 text-xs">Cena: </span>
                <span className="text-white font-bold text-lg">{fmtPrice(pkg.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
