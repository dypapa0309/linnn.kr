-- ═══════════════════════════════════════════════════════════════════════════
-- 링커 (linnn.kr) — Initial Schema Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type plan_type as enum ('anonymous', 'free', 'pro');
create type link_mode as enum ('quick', 'recommend', 'custom');
create type created_by_type as enum ('anonymous', 'user');
create type actor_type as enum ('anonymous', 'user', 'system');
create type audit_status as enum ('success', 'blocked', 'rate_limited', 'captcha_required');
create type audit_reason as enum (
  'daily_quota_exceeded',
  'rate_limit_burst',
  'abuse_score_elevated',
  'slug_check_limit',
  'captcha_required',
  'ok'
);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with plan info.

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  plan        plan_type not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── links ────────────────────────────────────────────────────────────────────

create table links (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete set null,
  original_url     text not null,
  slug             text not null,
  mode             link_mode not null default 'quick',
  is_active        boolean not null default true,
  expires_at       timestamptz,
  click_count      bigint not null default 0,
  created_by_type  created_by_type not null default 'user',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index links_slug_idx on links(slug);
create index links_user_id_idx on links(user_id);
create index links_created_at_idx on links(created_at desc);
create index links_user_created_at_idx on links(user_id, created_at desc) where user_id is not null;

-- ─── link_click_events ────────────────────────────────────────────────────────

create table link_click_events (
  id           uuid primary key default gen_random_uuid(),
  link_id      uuid not null references links(id) on delete cascade,
  clicked_at   timestamptz not null default now(),
  referrer     text,
  country_code char(2)
);

create index link_click_events_link_id_idx on link_click_events(link_id);
create index link_click_events_clicked_at_idx on link_click_events(clicked_at desc);

-- ─── anon_usage ───────────────────────────────────────────────────────────────

create table anon_usage (
  id                 uuid primary key default gen_random_uuid(),
  anon_token_hash    text not null,
  local_id_hash      text,
  fingerprint_hash   text,
  ip_hash            text,
  day_bucket         date not null,
  create_count       int not null default 0,
  slug_check_count   int not null default 0,
  abuse_score        int not null default 0,
  last_seen_at       timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (anon_token_hash, day_bucket)
);

create index anon_usage_token_day_idx on anon_usage(anon_token_hash, day_bucket);
create index anon_usage_day_bucket_idx on anon_usage(day_bucket);
-- Cleanup old rows easily
create index anon_usage_created_at_idx on anon_usage(created_at);

-- ─── audit_events ─────────────────────────────────────────────────────────────

create table audit_events (
  id                 uuid primary key default gen_random_uuid(),
  actor_type         actor_type not null,
  actor_id           uuid,
  anon_token_hash    text,
  fingerprint_hash   text,
  ip_hash            text,
  event_type         text not null,
  status             audit_status not null,
  reason_code        audit_reason,
  metadata           jsonb,
  created_at         timestamptz not null default now()
);

create index audit_events_anon_token_idx on audit_events(anon_token_hash) where anon_token_hash is not null;
create index audit_events_actor_id_idx on audit_events(actor_id) where actor_id is not null;
create index audit_events_created_at_idx on audit_events(created_at desc);
create index audit_events_event_type_idx on audit_events(event_type, created_at desc);

-- ─── reserved_slugs ───────────────────────────────────────────────────────────

create table reserved_slugs (
  slug        text primary key,
  reason      text not null default 'reserved',
  created_at  timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table links enable row level security;
alter table link_click_events enable row level security;
alter table anon_usage enable row level security;
alter table audit_events enable row level security;
alter table reserved_slugs enable row level security;

-- profiles: users can read/update their own
create policy "profiles: own read" on profiles for select using (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id);

-- links: users manage their own links
create policy "links: own read" on links for select using (auth.uid() = user_id);
create policy "links: own insert" on links for insert with check (auth.uid() = user_id);
create policy "links: own update" on links for update using (auth.uid() = user_id);
create policy "links: own delete" on links for delete using (auth.uid() = user_id);

-- Public read for redirect (slug lookup) — no RLS bypass needed, use service client for redirects
-- link_click_events: insert-only for service role
-- anon_usage: service role only
-- audit_events: service role only
-- reserved_slugs: public read
create policy "reserved_slugs: public read" on reserved_slugs for select using (true);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger set_links_updated_at before update on links
  for each row execute function set_updated_at();

create trigger set_anon_usage_updated_at before update on anon_usage
  for each row execute function set_updated_at();
