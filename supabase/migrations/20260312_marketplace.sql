-- ══════════════════════════════════════════════
-- BINQ MARKETPLACE — Tables
-- ══════════════════════════════════════════════

-- Catégories de boutiques
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icone TEXT DEFAULT '🏪',
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed catégories
INSERT INTO categories (nom, slug, icone, ordre) VALUES
  ('Alimentation', 'alimentation', '🍔', 1),
  ('Mode & Vêtements', 'mode', '👗', 2),
  ('Électronique', 'electronique', '📱', 3),
  ('Beauté & Soins', 'beaute', '💄', 4),
  ('Services', 'services', '🔧', 5),
  ('Artisanat', 'artisanat', '🎨', 6),
  ('Maison & Déco', 'maison', '🏠', 7),
  ('Sport & Loisirs', 'sport', '⚽', 8),
  ('Éducation', 'education', '📚', 9),
  ('Autre', 'autre', '🏪', 10)
ON CONFLICT (slug) DO NOTHING;

-- Boutiques
CREATE TABLE IF NOT EXISTS boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  categorie_id UUID REFERENCES categories(id),
  logo_url TEXT,
  banner_url TEXT,
  telephone TEXT,
  whatsapp TEXT,
  adresse TEXT,
  ville TEXT,
  devise TEXT DEFAULT 'XOF',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  vues INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutiques_user ON boutiques(user_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_categorie ON boutiques(categorie_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_active ON boutiques(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_boutiques_slug ON boutiques(slug);

-- Produits
CREATE TABLE IF NOT EXISTS produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  prix NUMERIC NOT NULL CHECK (prix > 0),
  prix_barre NUMERIC,
  devise TEXT DEFAULT 'XOF',
  image_url TEXT,
  categorie TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INT,
  vues INT DEFAULT 0,
  ventes INT DEFAULT 0,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produits_boutique ON produits(boutique_id);
CREATE INDEX IF NOT EXISTS idx_produits_active ON produits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_produits_prix ON produits(prix);

-- Commandes marketplace
CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acheteur_id UUID REFERENCES auth.users(id),
  boutique_id UUID NOT NULL REFERENCES boutiques(id),
  produit_id UUID NOT NULL REFERENCES produits(id),
  vendeur_id UUID NOT NULL REFERENCES auth.users(id),
  montant NUMERIC NOT NULL,
  devise TEXT DEFAULT 'XOF',
  statut TEXT DEFAULT 'payee' CHECK (statut IN ('payee', 'confirmee', 'livree', 'annulee')),
  methode_paiement TEXT DEFAULT 'binq_wallet',
  reference TEXT UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commandes_acheteur ON commandes(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_vendeur ON commandes(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_boutique ON commandes(boutique_id);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- Boutiques: public read actives, owner CRUD
CREATE POLICY "boutiques_public_read" ON boutiques FOR SELECT USING (is_active = true);
CREATE POLICY "boutiques_owner_all" ON boutiques FOR ALL USING (auth.uid() = user_id);

-- Produits: public read actives, owner via boutique
CREATE POLICY "produits_public_read" ON produits FOR SELECT USING (is_active = true);
CREATE POLICY "produits_owner_all" ON produits FOR ALL
  USING (boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid()));

-- Commandes: acheteur ou vendeur
CREATE POLICY "commandes_acheteur" ON commandes FOR SELECT USING (auth.uid() = acheteur_id);
CREATE POLICY "commandes_vendeur" ON commandes FOR SELECT USING (auth.uid() = vendeur_id);
CREATE POLICY "commandes_insert" ON commandes FOR INSERT WITH CHECK (true);
