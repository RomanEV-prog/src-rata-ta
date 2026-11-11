-- 002: RLS hardening (PREDLOG — pred nanosom na produkcijo preglej!)
--
-- NAJDBA: politike v 001 uporabljajo `auth.jwt() ->> 'role'`. To je TOP-LEVEL
-- Postgres role claim, ki je vedno 'authenticated'/'anon'/'service_role' — NIKOLI
-- 'admin'. Zato admin politike nikoli ne ujamejo (fail-closed: niso luknja, so pa
-- mrtve — admin dostop prek klienta ne deluje, admin operacije tečejo le prek Edge
-- Functions s service_role, ki RLS obidejo).
--
-- Admin vlogo dejansko nosi `app_metadata.role` (aplikacija to pravilno bere; ni
-- uporabniško spremenljiv). Ta migracija uskladi RLS s tem — da RLS DEJANSKO
-- uveljavlja admin (obramba v globino), ne le UI. Idempotentno (DROP IF EXISTS).
--
-- OPOZORILO: to je sprememba vedenja (admin politike se aktivirajo). Preveri, da
-- se admin stran (/dostop/admin) po nanosu obnaša pravilno.
--
-- NI zajeto tu: tabeli `door_groups` in `door_automation` nista v repo migracijah —
-- njuni RLS politiki preveri ločeno v Supabase dashboardu (potrdi, da NISTA
-- `TO authenticated USING (true)`, sicer bi lahko katerikoli prijavljeni uporabnik
-- krmilil vrata).

-- members
DROP POLICY IF EXISTS "members_select_own" ON members;
CREATE POLICY "members_select_own" ON members FOR SELECT TO authenticated
  USING (id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "members_insert_admin" ON members;
CREATE POLICY "members_insert_admin" ON members FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "members_update_admin" ON members;
CREATE POLICY "members_update_admin" ON members FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- access_permissions
DROP POLICY IF EXISTS "perms_select_own" ON access_permissions;
CREATE POLICY "perms_select_own" ON access_permissions FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "perms_all_admin" ON access_permissions;
CREATE POLICY "perms_all_admin" ON access_permissions FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- door_events
DROP POLICY IF EXISTS "events_select_own" ON door_events;
CREATE POLICY "events_select_own" ON door_events FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- access_requests
DROP POLICY IF EXISTS "requests_all_admin" ON access_requests;
CREATE POLICY "requests_all_admin" ON access_requests FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
