-- ═══════════════════════════════════════════
-- BINQ ACCESS — Mode Pointeuse (self-service)
-- ═══════════════════════════════════════════

-- 1. Ajouter mode + code QR espace sur access_spaces
ALTER TABLE access_spaces
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'controle' CHECK (mode IN ('controle', 'pointeuse')),
  ADD COLUMN IF NOT EXISTS space_code TEXT UNIQUE;

-- 2. Ajouter PIN sur access_members
ALTER TABLE access_members
  ADD COLUMN IF NOT EXISTS pin TEXT;

-- 3. Index sur space_code et pin
CREATE INDEX IF NOT EXISTS idx_access_spaces_code ON access_spaces(space_code);
CREATE INDEX IF NOT EXISTS idx_access_members_pin ON access_members(pin);
