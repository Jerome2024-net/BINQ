-- ============================================
-- BILLETTERIE BINQ — Événements & Billets
-- ============================================

-- ═══ Table: events (événements) ═══
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  heure_debut TIME,
  date_fin DATE,
  heure_fin TIME,
  lieu TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  total_vendu INTEGER NOT NULL DEFAULT 0,
  revenus NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_boutique ON events(boutique_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_debut);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published, is_active);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view published events" ON events
  FOR SELECT USING (is_published = true AND is_active = true);

CREATE POLICY "Service role full access events" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- ═══ Table: ticket_types (types de billets) ═══
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  prix NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  quantite_total INTEGER NOT NULL DEFAULT 100,
  quantite_vendue INTEGER NOT NULL DEFAULT 0,
  max_par_personne INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);

ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ticket types" ON ticket_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access ticket_types" ON ticket_types
  FOR ALL USING (true) WITH CHECK (true);

-- ═══ Table: tickets (billets achetés) ═══
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID REFERENCES auth.users(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  reference TEXT NOT NULL UNIQUE,
  quantite INTEGER NOT NULL DEFAULT 1,
  montant_total NUMERIC(12,2) NOT NULL,
  devise TEXT NOT NULL DEFAULT 'XOF',
  statut TEXT NOT NULL DEFAULT 'valid' CHECK (statut IN ('valid', 'used', 'cancelled', 'expired')),
  scanned_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_reference ON tickets(reference);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_statut ON tickets(statut);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access tickets" ON tickets
  FOR ALL USING (true) WITH CHECK (true);
