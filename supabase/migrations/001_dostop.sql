-- ŠRC: sistem za upravljanje dostopov in odpiranje vrat

-- Klubi
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Člani (id = Supabase auth.users.id)
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id),
  full_name text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Dovoljenja dostopa po članu
CREATE TABLE IF NOT EXISTS access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Dnevnik odpiranj vrat
CREATE TABLE IF NOT EXISTS door_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id),
  requested_at timestamptz DEFAULT now(),
  lock_state text,       -- 'unlocked' | 'locked' | 'unknown'
  result text NOT NULL,  -- 'success' | 'denied_locked' | 'denied_no_permission' | 'error'
  error_message text
);

-- Zahteve za dodajanje/odvzem dostopa
CREATE TABLE IF NOT EXISTS access_requests (
  id text PRIMARY KEY DEFAULT 'SRC-' || LPAD(nextval('access_requests_seq')::text, 6, '0'),
  club_id uuid REFERENCES clubs(id),
  request_type text NOT NULL CHECK (request_type IN ('add', 'remove')),
  full_name text NOT NULL,
  email text NOT NULL,
  desired_date date,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'done', 'rejected')),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS access_requests_seq START 1;

-- RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE door_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Clubs: vsi prijavlejni vidijo
CREATE POLICY "clubs_select" ON clubs FOR SELECT TO authenticated USING (true);

-- Members: vidi samo sebe, admin vse
CREATE POLICY "members_select_own" ON members FOR SELECT TO authenticated
  USING (id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "members_insert_admin" ON members FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "members_update_admin" ON members FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Access permissions: vidi samo svoje (ali admin)
CREATE POLICY "perms_select_own" ON access_permissions FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "perms_all_admin" ON access_permissions FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Door events: vidi samo svoje (ali admin)
CREATE POLICY "events_select_own" ON door_events FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

-- Service role piše door_events (prek Edge Function)
CREATE POLICY "events_insert_service" ON door_events FOR INSERT TO service_role USING (true);

-- Access requests: admin vse
CREATE POLICY "requests_all_admin" ON access_requests FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');
