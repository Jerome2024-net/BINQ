-- Ajouter les colonnes logo_url et cover_url si elles n'existent pas
ALTER TABLE events ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_url TEXT;
