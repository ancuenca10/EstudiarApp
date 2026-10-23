-- Auditoria segura para programas.
-- No cambia nulabilidad ni borra datos existentes.
ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS creado_por UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprobado_por UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS actualizado_por UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_programas_actualizado_por ON programas(actualizado_por);
