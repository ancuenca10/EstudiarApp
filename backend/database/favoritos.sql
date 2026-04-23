CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  referencia_id UUID NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT favoritos_tipo_check CHECK (tipo IN ('programa', 'universidad')),
  CONSTRAINT favoritos_unico_por_usuario UNIQUE (user_id, tipo, referencia_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_user_id ON favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_tipo_referencia ON favoritos(tipo, referencia_id);
