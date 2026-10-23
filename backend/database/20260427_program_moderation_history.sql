-- Historial de moderacion de programas.
-- Migracion segura: crea la tabla y sus indices sin modificar datos existentes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS program_moderation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50) NULL,
  estado_nuevo VARCHAR(50) NOT NULL,
  motivo TEXT NULL,
  moderado_por UUID NULL REFERENCES users(id),
  actor_rol VARCHAR(50) NULL,
  accion VARCHAR(50) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_moderation_history_programa_id
  ON program_moderation_history(programa_id);

CREATE INDEX IF NOT EXISTS idx_program_moderation_history_fecha
  ON program_moderation_history(fecha);

CREATE INDEX IF NOT EXISTS idx_program_moderation_history_moderado_por
  ON program_moderation_history(moderado_por);
