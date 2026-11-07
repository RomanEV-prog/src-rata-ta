'use client'
import Link from 'next/link'
import PageHero from '@/components/PageHero'

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const UGODNOSTI = [
  { icon: '🎯', naslov: 'Prednostna rezervacija', opis: 'Člani imajo prednost pri rezervaciji prog in prejmejo obvestila o prostih terminih.' },
  { icon: '💶', naslov: 'Ugodnejši ceniki', opis: 'Članska cena strelišča je nižja od Walk-in cene. Več streljaš, več prihraniš.' },
  { icon: '📱', naslov: 'Aplikacija RangeOS', opis: 'Rezerviraj progo, poglej posnetek tarče in svojo statistiko kar iz telefona.' },
  { icon: '🏆', naslov: 'Tekmovalna liga', opis: 'Nastopaj v ligaških tekmovanjih SD Fenix in se poteguješ za uvrstitev na lestvici.' },
  { icon: '📚', naslov: 'Usposabljanja', opis: 'Dostop do internih usposabljanj in predavanj o varnem ravnanju z orožjem.' },
  { icon: '🤝', naslov: 'Skupnost', opis: 'Postaneš del skupnosti strelcev, ki skrbi za varno in spoštljivo okolje na strelišču.' },
]

export default function ClanstvoPage() {
  return (
    <>
      <PageHero title="Članstvo" image={`${BP}/logos/fenix.jpg`} />

      <section style={{ background: '#0a0c10' }} className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Uvod */}
          <div className="max-w-2xl mb-16">
            <h2 className="text-2xl font-black text-white mb-4 tracking-wide">Zakaj postati član?</h2>
            <p className="text-white/60 leading-relaxed">
              Članstvo v SD Fenix ti odpre vrata do rednega streljaštva, tekmovanj in skupnosti izkušenih strelcev.
              Kot član ŠRC Ra-Ta-Ta imaš dostop do vseh prog, ugodnejših cen in mobilne aplikacije za rezervacije.
            </p>
          </div>

          {/* Ugodnosti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            {UGODNOSTI.map(u => (
              <div
                key={u.naslov}
                className="rounded-xl p-6"
                style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-3xl mb-3">{u.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2">{u.naslov}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{u.opis}</p>
              </div>
            ))}
          </div>

          {/* SD Fenix CTA */}
          <div
            className="rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8"
            style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <img
              src={`${BP}/logos/fenix.jpg`}
              alt="SD Fenix"
              className="w-24 h-24 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#fff', padding: '6px' }}
            />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-black text-white mb-2">Tekmovalna liga — SD Fenix</h3>
              <p className="text-sm text-white/55 leading-relaxed mb-5">
                SD Fenix organizira ligaška tekmovanja za vse discipline: pištola, puška, zračno orožje.
                Prijava je preprosta — izpolni obrazec in naša ekipa te bo kontaktirala.
              </p>
              <Link
                href="/clanstvo/sd-fenix"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: '#3dba8a' }}
              >
                Prijava na ligo SD Fenix
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Kontakt */}
          <div className="mt-16 text-center">
            <p className="text-white/40 text-sm mb-3">Imaš vprašanje o članstvu?</p>
            <Link
              href="/kontakt"
              className="text-sm font-semibold hover:underline"
              style={{ color: '#7a8cc9' }}
            >
              Pišite nam →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
