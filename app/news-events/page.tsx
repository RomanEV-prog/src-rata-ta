import Link from "next/link";

const CMS = "https://cms.strelisce-maribor.si/uploads";

const posts = [
  {
    slug: "izpit-vro-2026",
    category: "izobraževanja",
    title: "Preizkus znanja o varnem ravnanju z orožjem 07. 10. 2026",
    excerpt: "Preizkus znanja o varnem ravnanju z orožjem 7. in 8.10.2026 ob 16,00",
    image: "/news/izpit-vro.jpg",
    date: "07. 10. 2026",
  },
  {
    slug: "razpis-usposabljanja-2026",
    category: "izobraževanja",
    title: "Razpis usposabljanja o varnem ravnanju z orožjem",
    excerpt: "V SD Fenix razpisujemo usposabljanje za varno rokovanje z orožjem.",
    image: "/news/usposabljanje.png",
    date: "15. 09. 2026",
  },
  {
    slug: "Kolektivni-dopust-2026",
    category: "obvestila",
    title: "Kolektivni dopust 22.07 – 10.08.2026",
    excerpt: "Sporočamo vam, da bo strelišče zaprto od 22.07.2026 do 10.08.2026.",
    image: "/news/dopust.png",
    date: "10. 07. 2026",
  },
];

const categoryColor: Record<string, string> = {
  "izobraževanja": "#3dba8a",
  "obvestila": "#7a8cc9",
  "tekmovanja": "#e05c5c",
};

export default function NewsEventsPage() {
  return (
    <>
      {/* Page header */}
      <div className="pt-14" style={{ background: "#0d0f14" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-4xl font-black text-white tracking-wider uppercase mb-2">Novice & dogodki</h1>
          <div className="w-16 h-1 rounded-full" style={{ background: "#3dba8a" }} />
        </div>
      </div>

      <section style={{ background: "#0a0c10", borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="relative h-52 overflow-hidden" style={{ background: "#1a1f2e" }}>
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold uppercase text-white"
                    style={{ background: categoryColor[post.category] ?? "#3dba8a" }}
                  >
                    {post.category}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs text-white/35 mb-2">{post.date}</div>
                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">{post.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed flex-1">{post.excerpt}</p>
                  <Link
                    href={`/news/post/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Preberi več
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
