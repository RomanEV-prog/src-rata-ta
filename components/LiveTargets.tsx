'use client'
import { useState, useEffect } from 'react'

const API = 'https://rangeos-api.adlerhub.eu'
const REFRESH_MS = 30_000

interface Shot {
  id: number
  taken_at: number
  lane_name: string
  initials: string
  score: number | null
  shots_count: number | null
}

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })
}

export default function LiveTargets() {
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)

  async function load() {
    try {
      const [cfg, shots] = await Promise.all([
        fetch(`${API}/public/config`).then(r => r.json()),
        fetch(`${API}/public/recent-shots?limit=12`).then(r => r.json()),
      ])
      if (cfg.ok) setEnabled(cfg.data.liveTargetsEnabled)
      if (shots.ok && shots.data?.length > 0) setShots(shots.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  if (!loading && (!enabled || shots.length === 0)) return null

  return (
    <section style={{ background: '#080a0e', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e74c3c' }} />
          <h2 className="text-4xl font-black text-center text-white tracking-wider uppercase">
            LIVE TARČE
          </h2>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e74c3c' }} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse"
                   style={{ background: '#131720', aspectRatio: '1' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shots.map((shot) => (
              <div key={shot.id} className="rounded-xl overflow-hidden relative group"
                   style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative" style={{ aspectRatio: '1' }}>
                  <img
                    src={`${API}/public/shots/${shot.id}.jpg`}
                    alt={`Tarča — ${shot.lane_name}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {/* Overlay z info */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3"
                       style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }}>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-white font-black text-lg leading-none">{shot.initials}</div>
                        <div className="text-white/50 text-xs">{shot.lane_name}</div>
                      </div>
                      <div className="text-right">
                        {shot.score != null && (
                          <div className="text-yellow-400 font-bold text-sm">{shot.score} pt</div>
                        )}
                        <div className="text-white/40 text-xs">{fmtTime(shot.taken_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-8">
          Posodobitev vsakih 30 s · Inicialke strelcev za zasebnost
        </p>
      </div>
    </section>
  )
}
