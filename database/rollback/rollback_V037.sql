-- ============================================================================
-- Rollback: rollback_V037.sql
-- Description: Reverses V037__add_noshow_risk_columns.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_appointments_risk_calculated;
DROP INDEX IF EXISTS idx_appointments_risk_score;
DROP INDEX IF EXISTS idx_appointments_risk_category;

ALTER TABLE appointments DROP COLUMN IF EXISTS risk_factors;
ALTER TABLE appointments DROP COLUMN IF EXISTS risk_calculated_at;
ALTER TABLE appointments DROP COLUMN IF EXISTS risk_category;
ALTER TABLE appointments DROP COLUMN IF EXISTS no_show_risk_score;

SELECT 'V037 rollback complete: no-show risk columns removed' AS status;
