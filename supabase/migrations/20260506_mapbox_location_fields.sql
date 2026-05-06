-- ============================================
-- Mapbox location fields for local commerce
-- ============================================

ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS delivery_place_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_geocoded_address TEXT;

ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS mapbox_place_id TEXT,
  ADD COLUMN IF NOT EXISTS geocoded_address TEXT;

CREATE INDEX IF NOT EXISTS idx_commandes_delivery_coords
  ON public.commandes(delivery_latitude, delivery_longitude)
  WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_boutiques_coords
  ON public.boutiques(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
