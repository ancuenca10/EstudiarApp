-- Feedback de rechazo para programas.
-- Campos NULL por defecto para no afectar registros existentes.
ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS rechazo_motivo TEXT NULL,
  ADD COLUMN IF NOT EXISTS rechazado_por UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP NULL;
