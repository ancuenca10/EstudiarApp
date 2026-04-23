CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS programas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC NOT NULL,
  modalidad TEXT NOT NULL,
  duracion TEXT NOT NULL,
  universidad_id UUID NOT NULL REFERENCES universidades(id) ON DELETE RESTRICT,
  creado_por UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  aprobado_por UUID REFERENCES users(id) ON DELETE SET NULL,
  fecha_aprobacion TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT programas_estado_check CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  CONSTRAINT programas_precio_check CHECK (precio >= 0)
);

CREATE INDEX IF NOT EXISTS idx_programas_estado ON programas(estado);
CREATE INDEX IF NOT EXISTS idx_programas_universidad_id ON programas(universidad_id);
CREATE INDEX IF NOT EXISTS idx_programas_creado_por ON programas(creado_por);
