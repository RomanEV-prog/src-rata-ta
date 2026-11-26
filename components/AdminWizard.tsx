'use client'
import { useState } from 'react'

// Čarovnik (vodič) za osebje — pokaže, kaj se kje dela v adminu.
// Odpre se samodejno ob prvi prijavi osebja; kadarkoli se znova odpre z gumbom "Vodič".

interface Step { icon: string; title: string; body: React.ReactNode }

const STEPS: Step[] = [
  {
    icon: '👋',
    title: 'Dobrodošel/-la v adminu',
    body: <>Tu urejaš <b>novice</b>, <b>prijave na ligo</b> in <b>novičnik</b> strelišča. Ta kratek vodič ti pokaže, kaj se kje dela. Lahko ga kadarkoli znova odpreš z gumbom <b>❔ Vodič</b> zgoraj.</>,
  },
  {
    icon: '📰',
    title: 'Novice',
    body: <>Zavihek <b>Novice</b> → gumb <b>“+ Nova novica”</b>. Vpiši naslov, kratek opis in vsebino, izberi kategorijo in datum. Lahko dodaš <b>sliko</b> (do 5 MB) in <b>PDF prilogo</b> (do 10 MB, npr. rezultati). Shrani z <b>“Objavi”</b>. Novica se takoj pokaže na spletni strani — tudi, ko je strelišče ugasnjeno.</>,
  },
  {
    icon: '🏆',
    title: 'Prijave na ligo',
    body: <>Zavihek <b>Prijave na ligo</b> pokaže vse spletne prijave. Vsako lahko označiš <b>Kontaktiran</b>, <b>Potrdi → ERP</b> (gre v RangeOS) ali <b>Zavrni</b>. Z gumbom <b>“Natisni vse prijavnice”</b> dobiš izpolnjene PDF-je za tisk. Za to moraš biti povezan z RangeOS (recepcijski računalnik vklopljen).</>,
  },
  {
    icon: '✉️',
    title: 'Novičnik',
    body: <>Zavihek <b>Novičnik</b>: vidiš število naročnikov, lahko <b>uvoziš člane</b> (vsak dobi eno povabilo — naročen postane po kliku v mejlu) in <b>sestaviš ter pošlješ novičnik</b> (izbereš novice, vpišeš zadevo in pošlješ potrjenim naročnikom).</>,
  },
  {
    icon: '📦',
    title: 'Paketi',
    body: <>Gumb <b>“📦 Paketi”</b> zgoraj desno odpre urejanje paketov streljanja — cena, slika in “Vključuje”. Spremembe se takoj poznajo na strani <b>/paketi</b>.</>,
  },
  {
    icon: '🔒',
    title: 'Nastavitve — pusti pri miru',
    body: <>Zavihek <b>Nastavitve</b> ureja <b>Roman</b> (super admin). Tam so občutljive stvari (API ključ za pošiljanje, pošiljatelj). <b>Prosim, ne spreminjaj ničesar tam</b> — lahko pokvari pošiljanje novic. Če kaj rabiš, javi Romanu.</>,
  },
  {
    icon: '✅',
    title: 'To je to!',
    body: <>Zdaj poznaš osnove. Če se kje zatakne, vprašaj Romana. Vodič lahko kadarkoli znova odpreš z gumbom <b>❔ Vodič</b>.</>,
  },
]

export default function AdminWizard({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#131720', border: '1px solid rgba(79,107,189,0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div className="text-4xl">{step.icon}</div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-sm">Zapri ✕</button>
        </div>
        <div className="px-6 pb-6">
          <h2 className="text-white font-black text-xl mb-2">{step.title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{step.body}</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#0f131b', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">
            {STEPS.map((_, n) => (
              <span key={n} className="w-2 h-2 rounded-full" style={{ background: n === i ? '#4f6bbd' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/10">Nazaj</button>}
            {last
              ? <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:brightness-110" style={{ background: '#3dba8a' }}>Končaj</button>
              : <button onClick={() => setI(i + 1)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:brightness-110" style={{ background: '#4f6bbd' }}>Naprej</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
