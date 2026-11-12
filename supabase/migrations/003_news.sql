-- 003: Novice v Supabase (vedno-dostopna shramba za spletno stran)
--
-- Novice se še vedno PIŠEJO v RangeOS (recepcijski PC). RangeOS jih ob vsaki
-- spremembi sinhronizira sem prek service_role ključa (POST/DELETE /rest/v1/news).
-- Spletna stran bere novice OD TU (24/7), zato ostanejo vidne tudi, ko je
-- recepcijski PC ugasnjen.
--
-- id je ISTI kot RangeOS news.id (sinhronizacija upsert-a po id).
-- Idempotentno (IF NOT EXISTS / DROP POLICY IF EXISTS).

create table if not exists public.news (
  id            bigint primary key,            -- = RangeOS news.id
  title         text not null,
  excerpt       text,
  content       text,
  category      text not null default 'obvestila',
  image_url     text,
  slug          text,
  is_published  boolean not null default true,
  published_at  bigint not null,               -- unix ms (kot v RangeOS)
  updated_at    bigint
);

create index if not exists idx_news_published on public.news (published_at desc);

alter table public.news enable row level security;

-- Javno branje SAMO objavljenih novic (anon = spletna stran brez prijave).
drop policy if exists "news_public_read" on public.news;
create policy "news_public_read" on public.news
  for select to anon, authenticated
  using (is_published = true);

-- Pisanje (insert/update/delete) NIMA politik za anon/authenticated → prepovedano.
-- RangeOS piše prek service_role, ki RLS obide (sinhronizacija).

grant select on public.news to anon, authenticated;
