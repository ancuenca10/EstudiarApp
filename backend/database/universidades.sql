CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS universidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT universidades_estado_check CHECK (estado IN ('pendiente', 'aprobado'))
);

CREATE INDEX IF NOT EXISTS idx_universidades_estado ON universidades(estado);
CREATE INDEX IF NOT EXISTS idx_universidades_user_id ON universidades(user_id);
CREATE INDEX IF NOT EXISTS idx_universidades_ciudad ON universidades(ciudad);
