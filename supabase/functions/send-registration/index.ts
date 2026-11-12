import { PDFDocument } from 'npm:pdf-lib@1.17.1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

const DISCIPLINE_CHECKBOX: Record<string, string> = {
  'Pištola/revolver s središčnim vžigom 15m (samo začetniki)': 'checkbox_165v4a',
  'Pištola s središčnim vžigom 25m dvoročno':                  'checkbox_175u8y',
  'Revolver s središčnim vžigom 25m enoročno':                 'checkbox_189d3t',
  'Pištola/revolver standardna cal. .22 L.R., 25m enoročno':  'checkbox_196v0s',
}

// Pobegni HTML (prepreči injection uporabniškega vnosa v e-poštni HTML)
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .slice(0, 500)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body = await req.json()
    const {
      first_name, last_name, email, phone, date_of_birth, society, discipline, note,
      address, city, weapon_permit, permit_issuer,
      weapon_type, weapon_serial, weapon_owner, ammo_qty, ammo_owner,
    } = body

    // Osnovna validacija vnosa (prepreči zlorabo/spam)
    if (!first_name || !last_name || !email) {
      return new Response(JSON.stringify({ ok: false, message: 'Manjkajo obvezna polja.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }
    const emailStr = String(email)
    if (emailStr.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return new Response(JSON.stringify({ ok: false, message: 'Neveljaven e-naslov.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // 1. Naloži prijavnica PDF predlogo
    const pdfRes = await fetch('https://romanev-prog.github.io/src-rata-ta/prijavnica-liga-fenix.pdf')
    if (!pdfRes.ok) throw new Error('Ne morem naložiti PDF predloge')
    const pdfBytes = await pdfRes.arrayBuffer()

    // 2. Izpolni PDF polja
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form  = pdfDoc.getForm()

    const setText = (name: string, val: string) => {
      try { form.getTextField(name).setText(val) } catch {}
    }

    const today = new Date().toLocaleDateString('sl-SI')
    setText('text_10o9i',  `${first_name} ${last_name}`)   // Ime in priimek
    setText('text_147w5p', today)                          // Datum
    setText('text_151t6a', society ?? '')                  // Društvo
    setText('text_28a5b',  address ?? '')                  // Naslov (ulica in hišna št.)
    setText('text_39i3r',  city ?? '')                     // Kraj (pošta, država)
    setText('text_40p2h',  weapon_permit ?? '')            // Vrsta in št. orožne listine
    setText('text_56w5y',  permit_issuer ?? '')            // Ime izdajatelja listine

    // Orožje + strelivo — v pravi stolpec glede na tip (pištola/revolver)
    const jePistola = (weapon_type ?? 'pištola') !== 'revolver'
    setText(jePistola ? 'text_69u0x' : 'text_73e9g', weapon_serial ?? '')  // Tovarniška št.
    setText(jePistola ? 'text_81n1p' : 'text_96q6k', weapon_owner ?? '')   // Lastništvo orožja
    setText(jePistola ? 'text_105o7i' : 'text_110a7y', ammo_qty ?? '')     // Količina streliva
    setText(jePistola ? 'text_128s7t' : 'text_134o4c', ammo_owner ?? '')   // Lastništvo streliva

    // Označi panogo
    const cbName = DISCIPLINE_CHECKBOX[discipline ?? '']
    if (cbName) {
      try { form.getCheckBox(cbName).check() } catch {}
    }

    const filledBytes  = await pdfDoc.save()
    const filledBase64 = btoa(String.fromCharCode(...new Uint8Array(filledBytes)))

    // 3. Sestavi KRATKO telo — glavni dokument je priložena izpolnjena prijavnica.
    //    V telo gredo le podatki, ki jih na prijavnici NI (e-pošta, telefon …),
    //    da ni podvojevanja obrazca. Na mejl se odgovori neposredno prijavitelju
    //    (reply_to = njegova e-pošta).
    const htmlEmail = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1a2540;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">Nova prijava na Zimsko ligo Fenix</h2>
  </div>
  <div style="padding:18px 24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:14px;color:#333;line-height:1.7">
    <p style="margin:0 0 14px">Izpolnjena <b>prijavnica</b> je priložena temu sporočilu (PDF).</p>
    <p style="margin:0;color:#555;font-size:13px">
      <b>Prijavitelj:</b> ${esc(first_name)} ${esc(last_name)}<br>
      <b>E-pošta:</b> ${esc(email)}<br>
      <b>Telefon:</b> ${esc(phone || '—')}<br>
      <b>Datum rojstva:</b> ${esc(date_of_birth || '—')}${note ? `<br><b>Opomba:</b> ${esc(note)}` : ''}
    </p>
    <p style="margin:14px 0 0;font-size:12px;color:#999">Oddano: ${today} · strelisce-maribor.si · pravila potrjena ob oddaji</p>
  </div>
</div>`

    // 4. Pošlji prek Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY ni nastavljen')

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'SD Fenix Prijave <prijave@adlerhub.eu>',
        to:      ['feniks.sd01@gmail.com'],
        reply_to: email,
        subject: `Nova prijava na SD Fenix ligo — ${first_name} ${last_name}`,
        html:    htmlEmail,
        attachments: [{
          filename: `prijavnica-${first_name}-${last_name}.pdf`,
          content:  filledBase64,
        }],
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error(`Resend napaka: ${err}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ ok: false, message: String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

