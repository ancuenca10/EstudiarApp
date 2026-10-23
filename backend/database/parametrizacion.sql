CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo TEXT NOT NULL,
  nombre_interno TEXT NOT NULL,
  etiqueta TEXT NOT NULL,
  tipo TEXT NOT NULL,
  requerido BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  placeholder TEXT,
  opciones JSONB,
  ayuda TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT form_fields_modulo_check CHECK (modulo IN ('universidad', 'programa')),
  CONSTRAINT form_fields_tipo_check CHECK (tipo IN ('text', 'textarea', 'number', 'select', 'checkbox', 'date')),
  CONSTRAINT form_fields_nombre_unique UNIQUE (modulo, nombre_interno)
);

CREATE TABLE IF NOT EXISTS university_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  universidad_id UUID NOT NULL REFERENCES universidades(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT university_field_values_unique UNIQUE (universidad_id, field_id)
);

CREATE TABLE IF NOT EXISTS program_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programa_id UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT program_field_values_unique UNIQUE (programa_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_modulo ON form_fields(modulo);
CREATE INDEX IF NOT EXISTS idx_form_fields_activo ON form_fields(activo);
CREATE INDEX IF NOT EXISTS idx_form_fields_orden ON form_fields(modulo, orden);
CREATE INDEX IF NOT EXISTS idx_university_field_values_universidad ON university_field_values(universidad_id);
CREATE INDEX IF NOT EXISTS idx_program_field_values_programa ON program_field_values(programa_id);
