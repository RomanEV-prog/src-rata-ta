# strelisce-maribor.si — spletna stran ŠRC Ra-Ta-Ta

Next.js (statični izvoz, `output: "export"`) + Tailwind. Brez lastnega strežnika:
dinamični deli tečejo prek dveh zalednih sistemov.

| Del | Kje teče | Za kaj |
|---|---|---|
| RangeOS API | recepcijski PC, `rangeos-api.adlerhub.eu` | delovni čas, novice (vir), admin, rezervacije, live tarče, novičnik |
| Supabase | `vlzyrcdrvvhxvdvuxgki.supabase.co` | novice (kopija za branje 24/7), vrata (`/dostop`), edge funkcije |

Edge funkcije (`supabase/functions/`): `send-contact` (kontaktni obrazec),
`send-registration` (prijavnica na ligo → Fenix), `tedee-pull-spring` in
`door-watchdog` (vrata), `admin-add-member`.

## Razvoj

```bash
npm install
npm run dev        # http://localhost:3000
npx tsc --noEmit   # tipkanje
```

`.env.local` potrebuje `NEXT_PUBLIC_SUPABASE_URL` in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Objava — dva ločena cilja

1. **Živa stran (Neoserv cPanel, `/home/funpark/strelisce_new`)** — ROČNO.
   `git push` žive strani NE posodobi.

   ```bash
   mv .env.production .env.production.bak   # sicer slike kažejo na /src-rata-ta/…
   npm run build
   mv .env.production.bak .env.production
   tar czf site.tar.gz -C out --exclude='./.htaccess' .
   ```

   Tarball naloži v docroot in razpakiraj (File Manager → Extract). `.htaccess`
   na strežniku ostane (cache pravila, varnostne glave) — ni v tarballu.
   Tarball po razpakiranju odstrani iz javne mape.

2. **GitHub Pages zrcalo** (`romanev-prog.github.io/src-rata-ta`) — samodejno ob
   `git push` na `main` (`.github/workflows/deploy.yml`, basePath `/src-rata-ta`).
   Z zrcala edge funkcija bere predlogo prijavnice (PDF).

3. **Edge funkcije** — Supabase dashboard → Edge Functions → Code → Deploy
   (CLI na Windows ne deluje).

## Pasti

- Stran teče na `www.` — RangeOS CORS mora dovoliti `www.strelisce-maribor.si`.
- CSP na strežniku ne dovoli tujih okvirjev (zato ni vgrajenega zemljevida) in
  omejuje `connect-src` na Supabase in RangeOS API.
- `manifest.json` in `sw.js` uporabljata relativne poti, da `/dostop` deluje na
  obeh domenah.
- Skrivnosti (Resend, Tedee, `WATCHDOG_SECRET`) so v Supabase Secrets oziroma
  GitHub Secrets — nikoli v kodi, repozitorij je javen.
