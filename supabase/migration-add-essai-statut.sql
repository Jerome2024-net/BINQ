-- =============================================
-- MIGRATION: Ajouter 'essai' à l'enum abonnement_statut
-- À exécuter dans Supabase SQL Editor (https://supabase.com/dashboard)
-- =============================================

-- Ajouter la valeur 'essai' à l'enum abonnement_statut
ALTER TYPE abonnement_statut ADD VALUE IF NOT EXISTS 'essai';
