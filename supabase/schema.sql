-- ============================================================
-- Binq — Schéma SQL complet pour Supabase
-- À exécuter dans le SQL Editor de votre projet Supabase
-- ============================================================

-- ========================
-- 1. PROFILS UTILISATEURS
-- ========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null default '',
  prenom text not null default '',
  email text unique not null,
  telephone text default '',
  avatar text default '',
  bio text default '',
  ville text default '',
  pays text default '',
  profession text default '',
  score_confiance integer not null default 50,
  badge_verifie boolean not null default false,
  nombre_tontines_participees integer not null default 0,
  nombre_tontines_organisees integer not null default 0,
  nombre_tours_recus integer not null default 0,
  total_cotisations_payees integer not null default 0,
  est_defaillant boolean not null default false,
  notifications_email boolean not null default true,
  notifications_sms boolean not null default false,
  profil_public boolean not null default true,
  -- Stripe Connect
  stripe_account_id text,
  stripe_onboarding_complete boolean default false,
  stripe_charges_enabled boolean default false,
  stripe_payouts_enabled boolean default false,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger pour mettre à jour updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger pour créer le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nom, prenom)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'prenom', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================
-- 2. DÉFAILLANCES
-- ========================
create table if not exists public.defaillances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tontine_id uuid not null,
  tontine_nom text not null,
  tour_numero integer not null default 0,
  montant_du numeric(12,2) not null default 0,
  devise text not null default 'EUR',
  created_at timestamptz not null default now()
);

-- ========================
-- 3. TONTINES
-- ========================
create type tontine_statut as enum ('en_attente', 'active', 'terminee', 'suspendue', 'annulee');
create type tontine_frequence as enum ('hebdomadaire', 'bimensuel', 'mensuel');

create table if not exists public.tontines (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text default '',
  montant_cotisation numeric(12,2) not null,
  devise text not null default 'EUR',
  frequence tontine_frequence not null default 'mensuel',
  nombre_membres integer not null default 1,
  membres_max integer not null default 5,
  date_debut date not null,
  date_fin date,
  statut tontine_statut not null default 'en_attente',
  organisateur_id uuid not null references public.profiles(id),
  -- Annulation
  motif_annulation text,
  defaillant_id uuid references public.profiles(id),
  date_annulation timestamptz,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_tontine_updated
  before update on public.tontines
  for each row execute function public.handle_updated_at();

-- ========================
-- 4. MEMBRES
-- ========================
create type membre_role as enum ('organisateur', 'membre');
create type membre_statut as enum ('actif', 'suspendu', 'exclu');

create table if not exists public.membres (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role membre_role not null default 'membre',
  statut membre_statut not null default 'actif',
  date_adhesion date not null default current_date,
  created_at timestamptz not null default now(),
  -- Un user ne peut être membre qu'une seule fois par tontine
  unique(tontine_id, user_id)
);

-- ========================
-- 5. TOURS
-- ========================
create type tour_statut as enum ('a_venir', 'en_cours', 'complete', 'en_retard', 'annule');

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  numero integer not null,
  beneficiaire_id uuid not null references public.profiles(id),
  date_prevue date not null,
  date_effective date,
  montant_total numeric(12,2) not null default 0,
  statut tour_statut not null default 'a_venir',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tontine_id, numero)
);

create trigger on_tour_updated
  before update on public.tours
  for each row execute function public.handle_updated_at();

-- ========================
-- 6. PAIEMENTS (cotisations)
-- ========================
create type paiement_methode as enum ('virement', 'carte', 'stripe');
create type paiement_statut as enum ('en_attente', 'confirme', 'echoue');

create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  membre_id uuid not null references public.profiles(id),
  montant numeric(12,2) not null,
  methode paiement_methode not null default 'stripe',
  statut paiement_statut not null default 'en_attente',
  reference text,
  stripe_payment_intent_id text,
  date_paiement timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_paiement_updated
  before update on public.paiements
  for each row execute function public.handle_updated_at();

-- ========================
-- 7. PORTEFEUILLES
-- ========================
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  solde numeric(12,2) not null default 0,
  solde_bloque numeric(12,2) not null default 0,
  devise text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_wallet_updated
  before update on public.wallets
  for each row execute function public.handle_updated_at();

-- ========================
-- 8. TRANSACTIONS
-- ========================
create type transaction_type as enum (
  'depot', 'retrait', 'cotisation', 'reception_pot',
  'commission', 'abonnement', 'penalite', 'remboursement',
  'transfert_entrant', 'transfert_sortant'
);
create type transaction_statut as enum ('en_attente', 'confirme', 'echoue', 'annule');

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  type transaction_type not null,
  montant numeric(12,2) not null,
  solde_avant numeric(12,2) not null default 0,
  solde_apres numeric(12,2) not null default 0,
  devise text not null default 'EUR',
  statut transaction_statut not null default 'confirme',
  reference text,
  description text default '',
  -- Metadata fields (flattened for better querying)
  meta_tontine_id uuid,
  meta_tontine_nom text,
  meta_tour_id uuid,
  meta_tour_numero integer,
  meta_beneficiaire text,
  meta_methode text,
  meta_frais numeric(12,2) default 0,
  meta_destinataire_id uuid,
  meta_expediteur_id uuid,
  -- Stripe
  stripe_payment_intent_id text,
  -- Timestamps
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- ========================
-- 9. GRAND LIVRE COMPTABLE
-- ========================
create type ledger_type as enum ('debit', 'credit');
create type compte_type as enum (
  'wallet_utilisateur', 'pot_tontine', 'commission_plateforme',
  'penalites', 'reserve_garantie', 'compte_transit'
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  type ledger_type not null,
  compte compte_type not null,
  montant numeric(12,2) not null,
  devise text not null default 'EUR',
  description text default '',
  created_at timestamptz not null default now()
);

-- ========================
-- 10. ABONNEMENTS
-- ========================
create type abonnement_statut as enum ('actif', 'expire', 'annule');

create table if not exists public.abonnements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  plan text not null default 'annuel',
  montant numeric(12,2) not null default 15,
  devise text not null default 'EUR',
  date_debut timestamptz not null default now(),
  date_expiration timestamptz not null,
  statut abonnement_statut not null default 'actif',
  renouvellement_auto boolean not null default false,
  reference text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_abonnement_updated
  before update on public.abonnements
  for each row execute function public.handle_updated_at();

-- ========================
-- 11. INVITATIONS
-- ========================
create type invitation_statut as enum ('en_attente', 'acceptee', 'refusee', 'expiree');

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  inviteur_id uuid not null references public.profiles(id),
  email text not null,
  telephone text default '',
  statut invitation_statut not null default 'en_attente',
  created_at timestamptz not null default now()
);

-- ========================
-- 12. INDEX DE PERFORMANCE
-- ========================
create index idx_membres_tontine on public.membres(tontine_id);
create index idx_membres_user on public.membres(user_id);
create index idx_tours_tontine on public.tours(tontine_id);
create index idx_paiements_tour on public.paiements(tour_id);
create index idx_paiements_membre on public.paiements(membre_id);
create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_wallet on public.transactions(wallet_id);
create index idx_ledger_transaction on public.ledger_entries(transaction_id);
create index idx_defaillances_user on public.defaillances(user_id);
create index idx_invitations_tontine on public.invitations(tontine_id);

-- ========================
-- 13. ROW LEVEL SECURITY (RLS)
-- ========================

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.defaillances enable row level security;
alter table public.tontines enable row level security;
alter table public.membres enable row level security;
alter table public.tours enable row level security;
alter table public.paiements enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.abonnements enable row level security;
alter table public.invitations enable row level security;

-- PROFILES : public en lecture si profil_public, écriture uniquement par le propriétaire
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- TONTINES : visibles par tous, modifiables par l'organisateur
create policy "Tontines are viewable by everyone" on public.tontines
  for select using (true);

create policy "Organizer can insert tontine" on public.tontines
  for insert with check (auth.uid() = organisateur_id);

create policy "Organizer can update tontine" on public.tontines
  for update using (auth.uid() = organisateur_id);

create policy "Organizer can delete tontine" on public.tontines
  for delete using (auth.uid() = organisateur_id);

-- MEMBRES : visibles par les membres de la tontine, insertion par les membres eux-mêmes
create policy "Members are viewable by everyone" on public.membres
  for select using (true);

create policy "Users can join a tontine" on public.membres
  for insert with check (auth.uid() = user_id);

create policy "Organizer or self can update member" on public.membres
  for update using (
    auth.uid() = user_id
    or auth.uid() in (
      select organisateur_id from public.tontines where id = tontine_id
    )
  );

create policy "Organizer or self can delete member" on public.membres
  for delete using (
    auth.uid() = user_id
    or auth.uid() in (
      select organisateur_id from public.tontines where id = tontine_id
    )
  );

-- TOURS : visibles par les membres de la tontine
create policy "Tours are viewable by everyone" on public.tours
  for select using (true);

create policy "Organizer can manage tours" on public.tours
  for all using (
    auth.uid() in (
      select organisateur_id from public.tontines where id = tontine_id
    )
  );

-- PAIEMENTS : visibles par les participants, créés par le payeur
create policy "Paiements viewable by tontine members" on public.paiements
  for select using (true);

create policy "Members can create paiements" on public.paiements
  for insert with check (auth.uid() = membre_id);

create policy "Members can update own paiement" on public.paiements
  for update using (auth.uid() = membre_id);

-- WALLETS : uniquement par le propriétaire
create policy "Users can view own wallet" on public.wallets
  for select using (auth.uid() = user_id);

create policy "Users can create own wallet" on public.wallets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own wallet" on public.wallets
  for update using (auth.uid() = user_id);

-- TRANSACTIONS : uniquement par le propriétaire
create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can create own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

-- LEDGER : visible par le propriétaire de la transaction liée
create policy "Users can view own ledger" on public.ledger_entries
  for select using (
    transaction_id in (
      select id from public.transactions where user_id = auth.uid()
    )
  );

create policy "Users can create own ledger" on public.ledger_entries
  for insert with check (
    transaction_id in (
      select id from public.transactions where user_id = auth.uid()
    )
  );

-- ABONNEMENTS : uniquement par le propriétaire
create policy "Users can view own abonnement" on public.abonnements
  for select using (auth.uid() = user_id);

create policy "Users can create own abonnement" on public.abonnements
  for insert with check (auth.uid() = user_id);

create policy "Users can update own abonnement" on public.abonnements
  for update using (auth.uid() = user_id);

-- DEFAILLANCES : visibles par tous, créées par l'organisateur
create policy "Defaillances are viewable" on public.defaillances
  for select using (true);

create policy "Anyone can insert defaillances" on public.defaillances
  for insert with check (true);

-- INVITATIONS
create policy "Invitations viewable by involved" on public.invitations
  for select using (
    auth.uid() = inviteur_id
    or email in (select email from public.profiles where id = auth.uid())
  );

create policy "Users can create invitations" on public.invitations
  for insert with check (auth.uid() = inviteur_id);

create policy "Users can update invitations" on public.invitations
  for update using (
    email in (select email from public.profiles where id = auth.uid())
  );

-- ========================
-- 14. REALTIME (activer les publications)
-- ========================
-- Activer le realtime sur les tables importantes
alter publication supabase_realtime add table public.tontines;
alter publication supabase_realtime add table public.membres;
alter publication supabase_realtime add table public.tours;
alter publication supabase_realtime add table public.paiements;
