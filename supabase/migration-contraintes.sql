-- ============================================================
-- Binq — Migration : Système de contraintes financières
-- Tables : penalites, cautions, notifications
-- Colonnes ajoutées : profiles.score_fiabilite, profiles.niveau_fiabilite
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- ========================
-- 1. Colonnes score de fiabilité sur profiles
-- ========================
alter table public.profiles
  add column if not exists score_fiabilite integer not null default 100,
  add column if not exists niveau_fiabilite text not null default 'excellent',
  add column if not exists stripe_customer_id text;

-- ========================
-- 2. Table PENALITES
-- ========================
create table if not exists public.penalites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  montant numeric(12,2) not null default 8,
  raison text not null default '',
  statut text not null default 'appliquee', -- appliquee, payee, annulee
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_penalite_updated
  before update on public.penalites
  for each row execute function public.handle_updated_at();

create index idx_penalites_user on public.penalites(user_id);
create index idx_penalites_tontine on public.penalites(tontine_id);

-- ========================
-- 3. Table CAUTIONS
-- ========================
create table if not exists public.cautions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  montant numeric(12,2) not null,
  statut text not null default 'bloquee', -- bloquee, restituee, saisie
  date_liberation timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tontine_id)
);

create trigger on_caution_updated
  before update on public.cautions
  for each row execute function public.handle_updated_at();

create index idx_cautions_user on public.cautions(user_id);
create index idx_cautions_tontine on public.cautions(tontine_id);

-- ========================
-- 4. Table NOTIFICATIONS (in-app)
-- ========================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  titre text not null default '',
  message text not null default '',
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_lu on public.notifications(user_id, lu);

-- ========================
-- 5. RLS — Penalites
-- ========================
alter table public.penalites enable row level security;

create policy "Users can view own penalites" on public.penalites
  for select using (auth.uid() = user_id);

-- Service role peut tout faire (via SUPABASE_SERVICE_ROLE_KEY)
-- Les pénalités sont créées par le système (cron), pas par les users

-- ========================
-- 6. RLS — Cautions
-- ========================
alter table public.cautions enable row level security;

create policy "Users can view own cautions" on public.cautions
  for select using (auth.uid() = user_id);

-- ========================
-- 7. RLS — Notifications
-- ========================
alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ========================
-- 8. Realtime
-- ========================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.penalites;
alter publication supabase_realtime add table public.cautions;
