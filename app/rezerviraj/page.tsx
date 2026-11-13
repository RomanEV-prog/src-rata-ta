'use client'
import { useState, useEffect, useCallback } from 'react'

const API = 'https://rangeos-api.adlerhub.eu'
const DNEVI_KRATKO = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob']
const MESECI = ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'avgust', 'september', 'oktober', 'november', 'december']

interface RangeDay { weekday: number; isOpen: boolean; openMin: number; closeMin: number; open2Min: number | null; close2Min: number | null }
interface Lane { id: number; name: string; color: string | null; bookings: { startsAt: number; endsAt: number }[] }

function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateLabel(d: Date) {
  return `${DNEVI_KRATKO[d.getDay()]}, ${d.getDate()}. ${MESECI[d.getMonth()]} ${d.getFullYear()}`
}

// Preverja ali termin pade v delovni čas
function fits(day: RangeDay | undefined, startMin: number, durationMin: number) {
  if (!day || !day.isOpen) return false
  const end = startMin + durationMin
  if (startMin >= day.openMin && end <= day.closeMin) return true
  if (day.open2Min != null && day.close2Min != null) {
    return startMin >= day.open2Min && end <= day.close2Min
  }
  return false
}

// Preverja ali je slot zaseden
function isBooked(lane: Lane, startMin: number, durationMin: number, baseDate: Date) {
  const startMs = new Date(baseDate).setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
  const endMs = startMs + durationMin * 60_000
  return lane.bookings.some(b => b.startsAt < endMs && b.endsAt > startMs)
}

export default function RezervacijaPage() {
  const [step, setStep] = useState<'datum' | 'cas' | 'proga' | 'trajanje' | 'povzetek' | 'done'>('datum')
  const [hours, setHours] = useState<RangeDay[]>([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStartMin, setSelectedStartMin] = useState<number | null>(null)
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null)
  const [duration, setDuration] = useState(60)
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const [loadingLanes, setLoadingLanes] = useState(false)

  useEffect(() => {
    fetch(`${API}/public/hours`).then(r => r.json()).then(b => { if (b.ok) setHours(b.data) }).catch(() => {})
  }, [])

  const loadLanes = useCallback((d: Date) => {
    setLoadingLanes(true)
    setLanes([])
    fetch(`${API}/public/availability?date=${isoDate(d)}`)
      .then(r => r.json())
      .then(b => { if (b.ok) setLanes(b.data) })
      .catch(() => {})
      .finally(() => setLoadingLanes(false))
  }, [])

  // Delovni čas za dan v tednu (0=ned..6=sob → naš 0=pon..6=ned)
  function dayHours(d: Date): RangeDay | undefined {
    const wd = (d.getDay() + 6) % 7 // JS ned=0 → naš pon=0
    return hours.find(h => h.weekday === wd)
  }

  function isDateOpen(d: Date) {
    const dh = dayHours(d)
    return dh?.isOpen ?? true
  }

  // Generiraj ure za izbran dan v korakih 30 min
  function availableSlots(d: Date) {
    const dh = dayHours(d)
    if (!dh || !dh.isOpen) return []
    const slots: number[] = []
    for (let m = dh.openMin; m + 30 <= dh.closeMin; m += 30) slots.push(m)
    if (dh.open2Min != null && dh.close2Min != null) {
      for (let m = dh.open2Min; m + 30 <= dh.close2Min; m += 30) slots.push(m)
    }
    return slots
  }

  // Kalendarček
  function renderCalendar() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today); maxDate.setDate(today.getDate() + 31)
    const year = calMonth.getFullYear(), month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7 // pon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(startOffset).fill(null)
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i))
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">‹</button>
          <span className="text-white font-semibold capitalize">{MESECI[month]} {year}</span>
          <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Po', 'To', 'Sr', 'Č', 'Pe', 'So', 'Ne'].map(d => (
            <div key={d} className="text-center text-xs text-white/30 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const past = d < today
            const tooFar = d > maxDate
            const closed = !isDateOpen(d)
            const disabled = past || tooFar || closed
            const sel = selectedDate && isoDate(d) === isoDate(selectedDate)
            return (
              <button key={i} disabled={disabled}
                onClick={() => { setSelectedDate(d); loadLanes(d); setSelectedStartMin(null); setSelectedLane(null) }}
                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                  sel ? 'bg-blue-500 text-white' :
                  disabled ? 'text-white/15 cursor-not-allowed' :
                  'text-white/80 hover:bg-white/10'
                }`}
              >{d.getDate()}</button>
            )
          })}
        </div>
      </div>
    )
  }

  const card = 'rounded-2xl p-6' + ' ' + 'border border-white/8'
  const cardBg = { background: '#131720' }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0d0f14' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Naslov */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-wider mb-2">Rezervacija proge</h1>
          <p className="text-white/40 text-sm">Strelišče RA-TA-TA Maribor</p>
        </div>

        {/* Koraki */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['datum', 'cas', 'proga', 'trajanje'] as const).map((s, i) => {
            const labels = ['Datum', 'Čas', 'Proga', 'Trajanje']
            const steps = ['datum', 'cas', 'proga', 'trajanje', 'povzetek']
            const idx = steps.indexOf(step)
            const done = idx > i
            const active = idx === i
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'bg-blue-500 text-white' : active ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500' : 'bg-white/5 text-white/20'
                }`}>{done ? '✓' : i + 1}</div>
                <span className={`text-xs hidden sm:block ${active ? 'text-white/70' : 'text-white/25'}`}>{labels[i]}</span>
                {i < 3 && <div className="w-6 h-px bg-white/10" />}
              </div>
            )
          })}
        </div>

        {/* KORAK 1: Datum */}
        {step === 'datum' && (
          <div className={card} style={cardBg}>
            <h2 className="text-white font-semibold mb-6">Izberi datum</h2>
            {renderCalendar()}
            <div className="mt-6">
              <button disabled={!selectedDate}
                onClick={() => setStep('cas')}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: '#4f6bbd' }}
              >Naprej →</button>
            </div>
          </div>
        )}

        {/* KORAK 2: Čas */}
        {step === 'cas' && selectedDate && (
          <div className={card} style={cardBg}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('datum')} className="text-white/40 hover:text-white transition-colors">←</button>
              <h2 className="text-white font-semibold">{dateLabel(selectedDate)}</h2>
            </div>
            {(() => {
              const slots = availableSlots(selectedDate)
              const dh = dayHours(selectedDate)
              return (
                <>
                  {dh && (
                    <p className="text-white/40 text-xs mb-4">
                      Odprto: {hhmm(dh.openMin)}–{hhmm(dh.closeMin)}
                      {dh.open2Min != null ? ` in ${hhmm(dh.open2Min)}–${hhmm(dh.close2Min!)}` : ''}
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(m => (
                      <button key={m}
                        onClick={() => setSelectedStartMin(m)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedStartMin === m ? 'bg-blue-500 text-white' : 'text-white/70 hover:bg-white/10 border border-white/8'
                        }`}
                      >{hhmm(m)}</button>
                    ))}
                    {slots.length === 0 && <p className="col-span-4 text-white/30 text-sm text-center py-4">Ni razpoložljivih terminov</p>}
                  </div>
                  <div className="mt-6">
                    <button disabled={selectedStartMin === null}
                      onClick={() => setStep('proga')}
                      className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                      style={{ background: '#4f6bbd' }}
                    >Naprej →</button>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* KORAK 3: Proga */}
        {step === 'proga' && selectedDate && selectedStartMin !== null && (
          <div className={card} style={cardBg}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('cas')} className="text-white/40 hover:text-white transition-colors">←</button>
              <h2 className="text-white font-semibold">{dateLabel(selectedDate)} ob {hhmm(selectedStartMin)}</h2>
            </div>
            {loadingLanes ? (
              <p className="text-white/30 text-sm text-center py-6">Nalagam razpoložljivost…</p>
            ) : (
              <>
                <div className="space-y-2">
                  {lanes.map(lane => {
                    const busy = isBooked(lane, selectedStartMin, duration, selectedDate)
                    const sel = selectedLane?.id === lane.id
                    return (
                      <button key={lane.id} disabled={busy}
                        onClick={() => setSelectedLane(lane)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border ${
                          sel ? 'border-blue-500 bg-blue-500/10' :
                          busy ? 'border-white/5 opacity-30 cursor-not-allowed' :
                          'border-white/8 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: lane.color ?? '#4f6bbd' }} />
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{lane.name}</div>
                          <div className={`text-xs mt-0.5 ${busy ? 'text-red-400/70' : 'text-green-400/70'}`}>
                            {busy ? 'Zasedeno' : 'Prosto'}
                          </div>
                        </div>
                        {sel && <div className="text-blue-400 text-lg">✓</div>}
                      </button>
                    )
                  })}
                  {lanes.length === 0 && <p className="text-white/30 text-sm text-center py-4">Ni razpoložljivih prog</p>}
                </div>
                <div className="mt-6">
                  <button disabled={!selectedLane}
                    onClick={() => setStep('trajanje')}
                    className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: '#4f6bbd' }}
                  >Naprej →</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* KORAK 4: Trajanje */}
        {step === 'trajanje' && selectedDate && selectedStartMin !== null && selectedLane && (
          <div className={card} style={cardBg}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('proga')} className="text-white/40 hover:text-white transition-colors">←</button>
              <h2 className="text-white font-semibold">Trajanje streljanja</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[30, 60, 90, 120, 150, 180].map(d => {
                const dh = dayHours(selectedDate)
                const ok = fits(dh, selectedStartMin, d)
                return (
                  <button key={d} disabled={!ok}
                    onClick={() => setDuration(d)}
                    className={`py-4 rounded-xl text-sm font-medium transition-all border ${
                      duration === d && ok ? 'border-blue-500 bg-blue-500/10 text-white' :
                      !ok ? 'border-white/5 opacity-25 cursor-not-allowed text-white/50' :
                      'border-white/8 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg font-bold">{d}</div>
                    <div className="text-xs opacity-60">min</div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStep('povzetek')}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:brightness-110"
              style={{ background: '#4f6bbd' }}
            >Naprej →</button>
          </div>
        )}

        {/* KORAK 5: Povzetek */}
        {step === 'povzetek' && selectedDate && selectedStartMin !== null && selectedLane && (
          <div className={card} style={cardBg}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('trajanje')} className="text-white/40 hover:text-white transition-colors">←</button>
              <h2 className="text-white font-semibold">Povzetek rezervacije</h2>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Datum</span>
                <span className="text-white font-medium">{dateLabel(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Čas</span>
                <span className="text-white font-medium">{hhmm(selectedStartMin)} – {hhmm(selectedStartMin + duration)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Trajanje</span>
                <span className="text-white font-medium">{duration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Proga</span>
                <span className="text-white font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: selectedLane.color ?? '#4f6bbd' }} />
                  {selectedLane.name}
                </span>
              </div>
            </div>
            {/* Prijava potrebna */}
            <div className="rounded-xl p-5 mb-5 border border-blue-500/20 text-center" style={{ background: '#0f1829' }}>
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-white font-semibold text-sm mb-1">Za potrditev se prijavi</div>
              <div className="text-white/40 text-xs">Spletna prijava je v pripravi. Medtem rezerviraj prek mobilne aplikacije ali nas pokliči.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href="tel:041207997"
                className="py-3 rounded-xl font-semibold text-white text-sm text-center transition-all hover:brightness-110 border border-white/15"
                style={{ background: '#1a1f2e' }}
              >📞 Pokliči</a>
              <a href="https://play.google.com/store/apps/details?id=com.rangeos.rangeos_mobile"
                target="_blank" rel="noopener noreferrer"
                className="py-3 rounded-xl font-semibold text-white text-sm text-center transition-all hover:brightness-110"
                style={{ background: '#4f6bbd' }}
              >📱 Mobilna app</a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
