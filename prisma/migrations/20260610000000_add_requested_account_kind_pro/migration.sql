-- 20260610000000_add_requested_account_kind_pro
-- Ajoute requestedAccountKind sur ProAccount pour stocker le type de compte officiel demandé.
-- Additive uniquement — risque zéro.

ALTER TABLE "ProAccount" ADD COLUMN IF NOT EXISTS "requestedAccountKind" "AccountKind";
