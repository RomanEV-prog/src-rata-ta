'use client'
import { useState } from 'react'

const API = 'https://rangeos-api.adlerhub.eu'
const PRIVACY = 'https://funpark.si/IZJAVA%20O%20ZASEBNOSTI%20%C5%A0RC%20Ra-ta-ta.pdf'

type State = 'idle' | 'sending' | 'done' | 'error'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setMsg('Za prijavo potrdite soglasje.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('Vnesite veljaven e-naslov.'); return }
    setState('sending'); setMsg('')
    try {
      const r = await fetch(`${API}/public/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const b = await r.json().catch(() => ({ ok: false }))
      if (r.ok && b.ok) {
        setState('done')
        setMsg('Skoraj končano! Poslali smo vam potrditveni mejl — kliknite povezavo v njem.')
      } else {
        setState('error')
        setMsg(b.message || 'Prijava ni uspela. Poskusite kasneje.')
      }
    } catch {
      setState('error')
      setMsg('Prijava ni uspela. Preverite povezavo in poskusite znova.')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl px-5 py-4 text-sm" style={{ background: 'rgba(61,186,138,0.1)', border: '1px solid rgba(61,186,138,0.3)', color: '#3dba8a' }}>
        ✓ {msg}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vas@email.si"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-red-400"
          style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.12)' }}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 whitespace-nowrap"
          style={{ background: '#c0392b' }}
        >
          {state === 'sending' ? 'Pošiljam…' : 'Prijava na novice'}
        </button>
      </div>
      <label className="flex items-start gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 flex-shrink-0"
        />
        <span className="text-xs text-white/40 leading-relaxed">
          Strinjam se, da ŠRC Ra-Ta-Ta uporabi moj e-naslov za pošiljanje novic in obvestil.
          Odjava je mogoča v vsakem sporočilu. Več v{' '}
          <a href={PRIVACY} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">izjavi o zasebnosti</a>.
        </span>
      </label>
      {msg && (
        <p className="text-xs mt-2" style={{ color: state === 'error' ? '#e07a7a' : 'rgba(255,255,255,0.5)' }}>{msg}</p>
      )}
    </form>
  )
}
