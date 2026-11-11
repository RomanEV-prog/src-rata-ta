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
    const { first_name, last_name, email, phone, date_of_birth, society, discipline, note } = body

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
    setText('text_10o9i',  `${first_name} ${last_name}`)
    setText('text_147w5p', today)
    setText('text_151t6a', society ?? '')

    // Označi panogo
    const cbName = DISCIPLINE_CHECKBOX[discipline ?? '']
    if (cbName) {
      try { form.getCheckBox(cbName).check() } catch {}
    }

    const filledBytes  = await pdfDoc.save()
    const filledBase64 = btoa(String.fromCharCode(...new Uint8Array(filledBytes)))

    // 3. Sestavi HTML email
    const htmlEmail = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1a2540;padding:24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">SD Fenix — Nova prijava na ligo</h2>
    <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">Izpolnjena prijavnica je priložena temu emailu.</p>
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none">
    ${tableRow('Ime in priimek', `${first_name} ${last_name}`)}
    ${tableRow('E-mail', email)}
    ${tableRow('Telefon', phone || '—')}
    ${tableRow('Datum rojstva', date_of_birth || '—')}
    ${tableRow('Društvo', society || '—')}
    ${tableRow('Disciplina', discipline || '—')}
    ${tableRow('Opomba', note || '—')}
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;color:#333;border-bottom:1px solid #ddd">Pravila prebrana</td>
      <td style="padding:8px 12px;color:#1a7a40;font-weight:700;border-bottom:1px solid #ddd">✅ Da — potrjeno ob oddaji spletnega obrazca</td>
    </tr>
  </table>
  <div style="background:#f9f9f9;padding:14px 16px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:12px;color:#888">
    Oddano: ${today} · Vir: strelisce-maribor.si spletni obrazec
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
        to:      ['src.ratata@gmail.com'],
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

function tableRow(label: string, val: string) {
  // label je statičen (zaupan), val je uporabniški vnos → pobegni.
  return `<tr>
    <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;color:#333;width:160px;border-bottom:1px solid #ddd">${label}</td>
    <td style="padding:8px 12px;color:#222;border-bottom:1px solid #ddd">${esc(val)}</td>
  </tr>`
}
