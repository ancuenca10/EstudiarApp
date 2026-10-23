-- Notificaciones internas de usuario.
-- Migracion segura: no modifica datos existentes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50) NULL,
  entidad_id UUID NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_leida
  ON notifications(leida);

CREATE INDEX IF NOT EXISTS idx_notifications_fecha
  ON notifications(fecha);

CREATE INDEX IF NOT EXISTS idx_notifications_tipo
  ON notifications(tipo);

CREATE INDEX IF NOT EXISTS idx_notifications_entidad_id
  ON notifications(entidad_id);
