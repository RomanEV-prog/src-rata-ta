'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
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

function NewsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const postSlug = searchParams.get('post')

  const [posts, setPosts] = useState<NewsPost[]>([])
  const [filter, setFilter] = useState<string>('vse')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
      .then(n => setPosts(n ?? FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  // Detail pogled
  if (postSlug) {
    const post = posts.find(p => p.slug === postSlug)

    if (loading) {
      return (
        <div className="pt-14 min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}>
          <div className="text-white/30 text-sm">Nalagam...</div>
        </div>
      )
    }

    if (!post) {
      return (
        <div className="pt-14 min-h-screen flex flex-col items-center justify-center" style={{ background: '#0d0f14' }}>
          <p className="text-white/40 text-lg mb-4">Objava ni bila najdena.</p>
          <button onClick={() => router.push('/news-events')} className="text-sm font-semibold hover:underline" style={{ color: '#3dba8a' }}>
            ← Nazaj na novice
          </button>
        </div>
      )
    }

    const color = catColor[post.category] ?? '#3dba8a'
    const imgSrc = post.image_url
      ? (post.image_url.startsWith('http') ? post.image_url : `${BP}${post.image_url}`)
      : null

    return (
      <div className="pt-14" style={{ background: '#0d0f14', minHeight: '100vh' }}>
        {imgSrc && (
          <div className="relative h-72 sm:h-96 overflow-hidden">
            <img src={imgSrc} alt={post.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d0f14 0%, transparent 60%)' }} />
          </div>
        )}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <button
            onClick={() => router.push('/news-events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-8 transition-colors text-white/40 hover:text-white/70"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Novice &amp; dogodki
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase text-white" style={{ background: color }}>
              {post.category}
            </span>
            <span className="text-xs text-white/35">{fmtDate(post.published_at)}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-6">{post.title}</h1>
          {post.excerpt && (
            <p className="text-base text-white/60 leading-relaxed mb-8 pb-8 border-b border-white/10">
              {post.excerpt}
            </p>
          )}
          {post.content ? (
            <div className="text-sm text-white/75 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {post.content}
            </div>
          ) : (
            <p className="text-white/30 text-sm">Vsebina ni na voljo.</p>
          )}
          <div className="mt-12 pt-8 border-t border-white/10">
            <button
              onClick={() => router.push('/news-events')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: color }}
            >
              ← Vse novice
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid pogled
  const categories = ['vse', ...Array.from(new Set(posts.map(p => p.category)))]
  const visible = filter === 'vse' ? posts : posts.filter(p => p.category === filter)

  return (
    <>
      <div className="pt-14" style={{ background: '#0d0f14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-4xl font-black text-white tracking-wider uppercase mb-2">Novice &amp; dogodki</h1>
          <div className="w-16 h-1 rounded-full mb-8" style={{ background: '#3dba8a' }} />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
                style={filter === cat
                  ? { background: catColor[cat] ?? '#3dba8a', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section style={{ background: '#0a0c10', borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {loading && <div className="text-center py-20 text-white/30 text-sm">Nalagam...</div>}
          {!loading && visible.length === 0 && (
            <div className="text-center py-20 text-white/30 text-sm">Ni objav v tej kategoriji.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((post) => {
              const color = catColor[post.category] ?? '#3dba8a'
              const imgSrc = post.image_url
                ? (post.image_url.startsWith('http') ? post.image_url : `${BP}${post.image_url}`)
                : null
              return (
                <article
                  key={post.id}
                  className="rounded-xl overflow-hidden flex flex-col"
                  style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <button
                    onClick={() => post.slug && router.push(`/news-events?post=${post.slug}`)}
                    className="relative h-52 overflow-hidden block w-full text-left flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(79,107,189,0.18), #0f131b)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${BP}/logo.png`} alt="" aria-hidden className="w-16 h-16 object-contain opacity-25" />
                    {imgSrc && (
                      <img src={imgSrc} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                           onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold uppercase text-white" style={{ background: color }}>
                      {post.category}
                    </div>
                  </button>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-xs text-white/35 mb-2">{fmtDate(post.published_at)}</div>
                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">{post.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed flex-1">{post.excerpt}</p>
                    {post.slug && (
                      <button
                        onClick={() => router.push(`/news-events?post=${post.slug}`)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors text-left"
                        style={{ color }}
                      >
                        Preberi več
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

export default function NewsEventsPage() {
  return (
    <Suspense fallback={
      <div className="pt-14 min-h-screen flex items-center justify-center" style={{ background: '#0d0f14' }}>
        <div className="text-white/30 text-sm">Nalagam...</div>
      </div>
    }>
      <NewsContent />
    </Suspense>
  )
}
