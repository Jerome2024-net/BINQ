-- Table pour stocker les commandes de tickets en attente de paiement CinetPay
-- Permet au webhook de créer les tickets même si le client ferme son navigateur

CREATE TABLE IF NOT EXISTS pending_ticket_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  order_data JSONB NOT NULL,
  encoded TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_tx ON pending_ticket_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_ticket_orders(status);

-- Auto-expirer les commandes après 1 heure (optionnel, nettoyage)
-- Les commandes expirées ne bloquent rien grâce à l'idempotence
