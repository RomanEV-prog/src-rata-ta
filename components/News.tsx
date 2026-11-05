"use client";

import Link from "next/link";

const posts = [
  {
    slug: "izpit-vro-2026",
    category: "izobraževanja",
    title: "Preizkus znanja o varnem ravnanju z orožjem 07. 10. 2026",
    excerpt: "Preizkus znanja o varnem ravnanju z orožjem 7. in 8.10.2026 ob 16,00",
    image: "/news/izpit-vro.jpg",
  },
  {
    slug: "razpis-usposabljanja-2026",
    category: "izobraževanja",
    title: "Razpis usposabljanja o varnem ravnanju z orožjem",
    excerpt: "V SD Fenix razpisujemo usposabljanje za varno rokovanje z orožjem.",
    image: "/news/usposabljanje.png",
  },
  {
    slug: "Kolektivni-dopust-2026",
    category: "obvestila",
    title: "Kolektivni dopust 22.07 – 10.08.2026",
    excerpt: "Sporočamo vam, da bo strelišče zaradi kolektivnega letnega dopusta zaprto od 22.07.2026 do 10.08.2026.",
    image: "/news/dopust.png",
  },
];

const categoryColor: Record<string, string> = {
  "izobraževanja": "#3dba8a",
  "obvestila": "#7a8cc9",
};

export default function News() {
  return (
    <section style={{ background: "#0a0c10", borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl font-black text-center text-white mb-14 tracking-wider uppercase">
          NOVICE
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden" style={{ background: "#1a1f2e" }}>
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ background: categoryColor[post.category] ?? "#3dba8a" }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: categoryColor[post.category] ?? "#3dba8a" }}>
                    {post.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-snug">{post.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed flex-1">{post.excerpt}</p>

                <Link
                  href={`/news/post/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Read More
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
  );
}
