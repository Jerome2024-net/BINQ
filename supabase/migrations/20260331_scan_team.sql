-- ═══════════════════════════════════════════
-- BINQ — Équipe de scan (multi-contrôleurs)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scan_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'scanner' CHECK (role IN ('scanner', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_scan_team_event ON scan_team(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_team_user ON scan_team(user_id);

-- RLS
ALTER TABLE scan_team ENABLE ROW LEVEL SECURITY;

-- L'organisateur peut tout gérer sur ses événements
CREATE POLICY "scan_team_owner" ON scan_team
  FOR ALL USING (
    added_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE events.id = scan_team.event_id AND events.user_id = auth.uid()
    )
  );

-- Les membres de l'équipe peuvent voir leur propre accès
CREATE POLICY "scan_team_member_read" ON scan_team
  FOR SELECT USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "scan_team_service" ON scan_team
  FOR ALL USING (true) WITH CHECK (true);
