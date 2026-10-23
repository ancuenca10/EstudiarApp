CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  referencia_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  contenido TEXT NOT NULL,
  pros TEXT NOT NULL DEFAULT '',
  contras TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  respuesta_universidad TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_tipo_check CHECK (tipo IN ('programa', 'universidad')),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_estado_check CHECK (estado IN ('pendiente', 'aprobada', 'rechazada'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_estado ON reviews(estado);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_referencia ON reviews(tipo, referencia_id);
