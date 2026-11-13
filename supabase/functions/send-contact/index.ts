// Kontaktni obrazec strelisce-maribor.si → mejl na ŠRC (prek Resend).
//
// Klic: POST { ime, priimek, email, telefon, zadeva, sporocilo, website }
// `website` je past za robote (honeypot): človek ga ne vidi in ne izpolni.
// Odgovor na mejl gre naravnost pošiljatelju (reply_to).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PREJEMNIK = 'src.ratata@gmail.com'
const ZADEVE = ['Usposabljanja', 'Teambuildingi', 'Paketi', 'Drugo']

// Pobegni HTML (uporabniški vnos gre v telo mejla).
function esc(v: unknown, max = 500): string {
  return String(v ?? '')
    .slice(0, max)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function odgovor(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return odgovor({ ok: false, message: 'Nepodprta metoda.' }, 405)

  try {
    const b = await req.json()

    // Robot je izpolnil skrito polje → tiho »uspeh«, mejla ne pošljemo.
    if (b?.website) return odgovor({ ok: true })

    const ime = String(b?.ime ?? '').trim()
    const priimek = String(b?.priimek ?? '').trim()
    const email = String(b?.email ?? '').trim()
    const telefon = String(b?.telefon ?? '').trim()
    const sporocilo = String(b?.sporocilo ?? '').trim()
    const zadeva = ZADEVE.includes(b?.zadeva) ? b.zadeva : 'Drugo'

    if (!ime || !priimek || !email) {
      return odgovor({ ok: false, message: 'Ime, priimek in e-pošta so obvezni.' }, 400)
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return odgovor({ ok: false, message: 'Neveljaven e-naslov.' }, 400)
    }
    if (ime.length > 80 || priimek.length > 80 || telefon.length > 40 || sporocilo.length > 4000) {
      return odgovor({ ok: false, message: 'Vnos je predolg.' }, 400)
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY ni nastavljen')

    const cas = new Date().toLocaleString('sl-SI', { timeZone: 'Europe/Ljubljana' })
    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1a2540;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">Novo povpraševanje — ${esc(zadeva)}</h2>
  </div>
  <div style="padding:18px 24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:14px;color:#333;line-height:1.7">
    <p style="margin:0 0 14px">
      <b>Od:</b> ${esc(ime)} ${esc(priimek)}<br>
      <b>E-pošta:</b> ${esc(email)}<br>
      <b>Telefon:</b> ${esc(telefon || '—')}
    </p>
    <div style="padding:12px 14px;background:#f6f7f9;border-radius:6px;white-space:pre-wrap">${esc(sporocilo || '(brez sporočila)', 4000)}</div>
    <p style="margin:14px 0 0;font-size:12px;color:#999">Poslano ${esc(cas)} prek obrazca na strelisce-maribor.si. Odgovor na ta mejl gre pošiljatelju.</p>
  </div>
</div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ŠRC Ra-Ta-Ta Kontakt <kontakt@adlerhub.eu>',
        to: [PREJEMNIK],
        reply_to: email,
        subject: `Povpraševanje (${zadeva}) — ${ime} ${priimek}`.slice(0, 200),
        html,
      }),
    })
    if (!res.ok) throw new Error(`Resend napaka ${res.status}: ${await res.text()}`)

    return odgovor({ ok: true })
  } catch (e) {
    console.error(e)
    return odgovor({ ok: false, message: 'Pošiljanje ni uspelo. Pokličite nas ali pišite na e-pošto.' }, 500)
  }
})
