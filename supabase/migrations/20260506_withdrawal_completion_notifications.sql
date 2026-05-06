-- ============================================
-- Withdrawal completion status visibility
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_withdrawal_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();

  IF NEW.statut IN ('completed', 'failed', 'cancelled')
     AND OLD.statut IS DISTINCT FROM NEW.statut
     AND NEW.processed_at IS NULL THEN
    NEW.processed_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_status_update ON public.withdrawals;

CREATE TRIGGER trg_withdrawal_status_update
  BEFORE UPDATE OF statut ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_status_update();

CREATE OR REPLACE FUNCTION public.notify_withdrawal_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.statut = 'completed' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO public.notifications (user_id, titre, message)
    VALUES (
      NEW.user_id,
      'Retrait effectué',
      'Votre retrait de ' || NEW.net || ' ' || NEW.devise || ' a été traité avec succès.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_withdrawal_completed ON public.withdrawals;

CREATE TRIGGER trg_notify_withdrawal_completed
  AFTER UPDATE OF statut ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_withdrawal_completed();
