'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchNews, type NewsPost } from '@/lib/news'

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const FALLBACK: NewsPost[] = [
  { id: 1, title: 'Preizkus znanja o varnem ravnanju z orožjem 07. 10. 2026', excerpt: 'Preizkus znanja o varnem ravnanju z orožjem 7. in 8.10.2026 ob 16,00', content: null, category: 'izobraževanja', image_url: `${BP}/news/izpit-vro.jpg`, slug: 'izpit-vro-2026', published_at: 1759824000000 },
  { id: 2, title: 'Razpis usposabljanja o varnem ravnanju z orožjem', excerpt: 'V SD Fenix razpisujemo usposabljanje za varno rokovanje z orožjem.', content: null, category: 'izobraževanja', image_url: `${BP}/news/usposabljanje.png`, slug: 'razpis-usposabljanja-2026', published_at: 1759737600000 },
  { id: 3, title: 'Kolektivni dopust 22.07 – 10.08.2026', excerpt: 'Strelišče bo zaprto od 22.07.2026 do 10.08.2026 zaradi kolektivnega dopusta.', content: null, category: 'obvestila', image_url: `${BP}/news/dopust.png`, slug: 'kolektivni-dopust-2026', published_at: 1753142400000 },
]

const catColor: Record<string, string> = {
  'izobraževanja': '#3dba8a',
  'obvestila': '#7a8cc9',
  'novosti': '#e67e22',
  'dogodki': '#c0392b',
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Vizual novice: enotno ozadje z logotipom ŠRC — VEDNO ENAKO za vse novice.
// Če ima novica svojo sliko, jo pokaže čez; sicer ostane enotni logotip (brez utripanja).
function NewsVisual({ post }: { post: NewsPost }) {
  const src = post.image_url
    ? (post.image_url.startsWith('http') ? post.image_url : `${BP}${post.image_url}`)
    : null
  return (
    <div className="relative h-44 overflow-hidden flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, rgba(79,107,189,0.18), #0f131b)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BP}/logo.png`} alt="" aria-hidden className="w-16 h-16 object-contain opacity-25" />
      {src && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={post.title} className="absolute inset-0 w-full h-full object-cover"
             onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      )}
    </div>
  )
}

export default function News() {
  const [posts, setPosts] = useState<NewsPost[] | null>(null)

  useEffect(() => {
    fetchNews().then(n => setPosts(n ?? FALLBACK))
  }, [])

  return (
    <section style={{ background: '#0a0c10', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl font-black text-center text-white mb-14 tracking-wider uppercase">
          NOVICE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts === null
            ? [0, 1, 2].map(i => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse"
                     style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="h-44" style={{ background: '#1a1f2e' }} />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 rounded" style={{ background: '#1a1f2e' }} />
                    <div className="h-4 w-3/4 rounded" style={{ background: '#1a1f2e' }} />
                  </div>
                </div>
              ))
            : posts.map((post) => {
                const color = catColor[post.category] ?? '#3dba8a'
                return (
                  <Link key={post.id}
                        href={post.slug ? `/news-events?post=${encodeURIComponent(post.slug)}` : '/news-events'}
                        className="rounded-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
                        style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <NewsVisual post={post} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{post.category}</span>
                        <span className="ml-auto text-xs text-white/30">{fmtDate(post.published_at)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 leading-snug">{post.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed flex-1">{post.excerpt}</p>
                    </div>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}
