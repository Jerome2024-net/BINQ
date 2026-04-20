-- ══════════════════════════════════════════════
-- BINQ — Menus restauration & Réservations
-- ══════════════════════════════════════════════

-- Menus (un par boutique, peut en avoir plusieurs : déjeuner, dîner, brunch…)
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Menu principal',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_boutique ON menus(boutique_id);

-- Sections du menu (Entrées, Plats, Desserts, Boissons…)
CREATE TABLE IF NOT EXISTS menu_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  ordre INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_sections_menu ON menu_sections(menu_id);

-- Items du menu (chaque plat / boisson)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  prix NUMERIC NOT NULL CHECK (prix >= 0),
  devise TEXT DEFAULT 'XOF',
  image_url TEXT,
  allergenes TEXT,          -- ex: "gluten, lait, noix"
  is_vegetarien BOOLEAN DEFAULT false,
  is_disponible BOOLEAN DEFAULT true,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_section ON menu_items(section_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_boutique ON menu_items(boutique_id);

-- Réservations de table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  client_nom TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  client_email TEXT,
  client_user_id UUID REFERENCES auth.users(id),
  nombre_personnes INT NOT NULL DEFAULT 1 CHECK (nombre_personnes > 0),
  date_reservation DATE NOT NULL,
  heure_reservation TIME NOT NULL,
  notes TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_boutique ON reservations(boutique_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date_reservation);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);

-- Ajouter 'menu' comme type QR supporté (seulement si qr_codes existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_codes') THEN
    ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_type_check;
    ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check
      CHECK (type IN ('boutique', 'produit', 'paiement', 'vendeur', 'commande', 'menu'));
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'menu_id') THEN
      ALTER TABLE qr_codes ADD COLUMN menu_id UUID REFERENCES menus(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_qr_menu ON qr_codes(menu_id) WHERE menu_id IS NOT NULL;
  END IF;
END $$;

-- ══════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Menus: lecture publique (actifs), CRUD proprio
CREATE POLICY "menus_public_read" ON menus FOR SELECT USING (is_active = true);
CREATE POLICY "menus_owner_all" ON menus FOR ALL
  USING (boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid()));

-- Sections: lecture publique (actives), CRUD proprio
CREATE POLICY "menu_sections_public_read" ON menu_sections FOR SELECT USING (is_active = true);
CREATE POLICY "menu_sections_owner_all" ON menu_sections FOR ALL
  USING (menu_id IN (SELECT id FROM menus WHERE boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid())));

-- Items: lecture publique (disponibles), CRUD proprio
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (is_disponible = true);
CREATE POLICY "menu_items_owner_all" ON menu_items FOR ALL
  USING (boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid()));

-- Réservations: insert public, select propriétaire + client
CREATE POLICY "reservations_insert_public" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_owner_read" ON reservations FOR SELECT
  USING (boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid()));
CREATE POLICY "reservations_client_read" ON reservations FOR SELECT
  USING (client_user_id = auth.uid());
CREATE POLICY "reservations_owner_update" ON reservations FOR UPDATE
  USING (boutique_id IN (SELECT id FROM boutiques WHERE user_id = auth.uid()));
