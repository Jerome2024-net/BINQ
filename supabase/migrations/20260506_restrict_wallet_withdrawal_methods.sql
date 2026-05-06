-- ============================================
-- Restrict wallet withdrawal methods
-- FedaPay payout target: MTN MoMo / Moov Money first.
-- Orange Money and Wave are disabled for withdrawals.
-- ============================================

UPDATE public.withdrawal_methods
SET is_active = false,
    updated_at = now()
WHERE type IN ('orange_money', 'wave');

ALTER TABLE public.withdrawal_methods
  DROP CONSTRAINT IF EXISTS withdrawal_methods_type_check;

ALTER TABLE public.withdrawal_methods
  ADD CONSTRAINT withdrawal_methods_type_check
  CHECK (type IN ('momo_mtn', 'moov_money', 'bank_transfer'));
