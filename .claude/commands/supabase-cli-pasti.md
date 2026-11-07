# Supabase CLI — pasti pri SQL migracijah in deploy

Iz seje 2026-11-07 (src-rata-ta /dostop PWA, door_groups tabela).
Uporabi ob vsakem delu s Supabase CLI na Windows: `db query`, `functions deploy`.

## Zakaj / arhitektura

Supabase CLI `db query` in `functions deploy` tečeta prek PowerShell.
PowerShell manglа določene znake pri inline argumentih, kar povzroči
nerazumljive SQL napake ali zavrnitev deploya.

## Konkretni recepti

### SQL migracija prek datoteke (ne inline)

**NE deluje** — PowerShell pomangla `$$` v DO bloku:
```powershell
# NAPAKA: "syntax error at or near \"\\\"" 
& supabase.exe db query --remote=vlzyrcdrvvhxvdvuxgki --yes "DO \$\$ BEGIN ... END \$\$"
```

**Pravilno** — zapiši SQL v datoteko, podaj `--file`:
```powershell
# 1. Zapiši SQL v scratchpad (UTF-8)
$sql | Out-File -Encoding UTF8 "C:\...\migration.sql"

# 2. Poženi prek --file
& "C:\Users\adler\AppData\Local\supabase-cli\supabase.exe" `
    db query --remote=vlzyrcdrvvhxvdvuxgki --yes --file "C:\...\migration.sql"
```

Enako velja za Write orodje (`Write` napiše pravilno) + `--file`.

### Pravilni zastavici (od CLI v2)

| Zastarelo | Pravilno |
|-----------|----------|
| `--project-ref vlzyrcdrvvhxvdvuxgki` | `--remote=vlzyrcdrvvhxvdvuxgki` |
| (brez zastavice v agent mode) | `--yes` |

CLI v2 javi opozorilo za `--project-ref`, v v4 bo odstranjeno.

### Deploy edge funkcije

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
& "C:\Users\adler\AppData\Local\supabase-cli\supabase.exe" `
    functions deploy tedee-pull-spring --remote=vlzyrcdrvvhxvdvuxgki --yes
```

Docker ne sme teči (Windows) — CLI go bundler deluje brez njega.

## E2E verifikacija

Po migraciji:
```powershell
# Preveri, da tabela obstaja
$checkSql = "SELECT table_name FROM information_schema.tables WHERE table_name = 'door_groups';"
$checkSql | Out-File -Encoding UTF8 "C:\Temp\check.sql"
& supabase.exe db query --remote=vlzyrcdrvvhxvdvuxgki --yes --file "C:\Temp\check.sql"
# Pričakovano: vrstica z door_groups
```

## Gotchas

**`CREATE POLICY IF NOT EXISTS` ne obstaja v PostgreSQL.**
PostgreSQL ne podpira te sintakse (za razliko od `CREATE TABLE IF NOT EXISTS`).
Simptom: `syntax error at or near "NOT" LINE N: CREATE POLICY IF NOT EXISTS`.
Rešitev: ali navaden `CREATE POLICY` (brez IF NOT EXISTS), ali obdaj z
`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE ...) THEN CREATE POLICY ... END IF; END $$`
— in to shrani v datoteko, ne inline.

**`DO $$ BEGIN...END $$` inline prek PowerShell → supabase CLI se pokvari.**
PowerShell razreši `$$` in `\$\$` drugače glede na kontekst (here-string vs. navaden niz).
CLI potem dobi pohabljen SQL in javi `syntax error at or near "\\"`.
Rešitev: vedno piši SQL v datoteko in podaj `--file`.

**Agent mode brez `--yes` → zavrnitev brez sprememb.**
CLI v agent mode ne more interaktivno vprašati za potrditev.
Simptom: `HostedMutationConsentRequiredError: This run can't ask because it is running in agent mode. Nothing was changed.`
Rešitev: vedno dodaj `--yes`.

**Supabase access token mora biti nastavljen pred klicem.**
`$env:SUPABASE_ACCESS_TOKEN = "sbp_..."` mora biti v isti PowerShell seji (ali `--token` zastavica).
