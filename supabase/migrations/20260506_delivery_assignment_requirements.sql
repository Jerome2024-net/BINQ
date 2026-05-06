-- Marquer les utilisateurs pouvant recevoir des livraisons et tracer l'assignation livreur.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_livreur BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS livreur_assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_is_livreur ON public.profiles(is_livreur) WHERE is_livreur = true;
CREATE INDEX IF NOT EXISTS idx_commandes_livreur_assigned_at ON public.commandes(livreur_assigned_at) WHERE livreur_assigned_at IS NOT NULL;

DROP POLICY IF EXISTS "commandes_livreur" ON public.commandes;
CREATE POLICY "commandes_livreur" ON public.commandes
  FOR SELECT USING (auth.uid() = livreur_id);
