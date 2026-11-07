'use client'
import Link from 'next/link'

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0d0f14', paddingTop: '5rem' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <img src={`${BP}/logo.png`} alt="ŠRC Ra-Ta-Ta" className="w-20 h-20 mx-auto mb-6 rounded-xl object-contain" />

        <h1 className="text-xl font-black text-white mb-2 tracking-wide">Prijava za člane</h1>
        <p className="text-sm text-white/45 mb-8 leading-relaxed">
          Rezervacije, tarče in statistika so dostopni prek mobilne aplikacije RangeOS.
        </p>

        {/* Play Store */}
        <a
          href="https://play.google.com/store/apps/details?id=com.rangeos.rangeos_mobile"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl mb-3 transition-all hover:brightness-110"
          style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M3.18 23.69c.33.19.72.19 1.05.01l13.37-7.72-2.9-2.9L3.18 23.69z" fill="#EA4335"/>
            <path d="M20.82 10.3l-3.22-1.86-3.22 3.22 3.22 3.22 3.23-1.86c.92-.53.92-1.86-.01-2.72z" fill="#FBBC04"/>
            <path d="M3.18.31C2.84.5 2.63.86 2.63 1.28v21.44l11.52-11.52L3.18.31z" fill="#4285F4"/>
            <path d="M4.23 23.7l11.57-6.68-2.9-2.9L4.23 23.7z" fill="#34A853"/>
            <path d="M14.73 2.26 3.18.31l11.52 11.52 2.9-2.9-2.87-6.67z" fill="#34A853" opacity=".5"/>
          </svg>
          <div className="text-left">
            <div className="text-xs text-white/40 leading-none mb-0.5">Prenesi na</div>
            <div className="text-sm font-bold text-white">Google Play</div>
          </div>
        </a>

        <div
          className="rounded-xl p-4 mt-2 mb-2"
          style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.2)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(230,126,34,0.9)' }}>
            Aplikacija je trenutno v zaprtem testiranju. Za dostop pišite na{' '}
            <a href="mailto:info@strelisce-maribor.si" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
              info@strelisce-maribor.si
            </a>
          </p>
        </div>

        <div
          className="rounded-xl p-4 mt-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-white/35 leading-relaxed">
            Nimate računa? Za dostop potrebujete veljavno članstvo.{' '}
            <Link href="/clanstvo" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
              Več o članstvu
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-white/20">
        <Link href="/" className="hover:text-white/40 transition-colors">← Nazaj na domačo stran</Link>
      </p>
    </div>
  )
}
