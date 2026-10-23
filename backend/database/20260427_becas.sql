-- Modulo de becas con moderacion y trazabilidad.
-- Seguro para ejecutar varias veces: usa IF NOT EXISTS y columnas nullable.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS becas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universidad_id UUID NULL REFERENCES universidades(id) ON DELETE SET NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  requisitos TEXT NULL,
  beneficios TEXT NULL,
  porcentaje_cobertura NUMERIC(5,2) NULL,
  monto NUMERIC(14,2) NULL,
  moneda VARCHAR(10) DEFAULT 'COP',
  fecha_inicio DATE NULL,
  fecha_cierre DATE NULL,
  enlace TEXT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  rechazo_motivo TEXT NULL,
  creado_por UUID NULL REFERENCES users(id),
  actualizado_por UUID NULL REFERENCES users(id),
  aprobado_por UUID NULL REFERENCES users(id),
  rechazado_por UUID NULL REFERENCES users(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP NULL,
  fecha_aprobacion TIMESTAMP NULL,
  fecha_rechazo TIMESTAMP NULL,
  fuente_url TEXT NULL,
  fuente_nombre TEXT NULL,
  fecha_importacion TIMESTAMP NULL,
  CONSTRAINT becas_estado_check CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  CONSTRAINT becas_porcentaje_check CHECK (porcentaje_cobertura IS NULL OR (porcentaje_cobertura >= 0 AND porcentaje_cobertura <= 100)),
  CONSTRAINT becas_monto_check CHECK (monto IS NULL OR monto >= 0),
  CONSTRAINT becas_fechas_check CHECK (fecha_inicio IS NULL OR fecha_cierre IS NULL OR fecha_cierre >= fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_becas_universidad_id ON becas(universidad_id);
CREATE INDEX IF NOT EXISTS idx_becas_estado ON becas(estado);
CREATE INDEX IF NOT EXISTS idx_becas_fecha_cierre ON becas(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_becas_creado_por ON becas(creado_por);
CREATE INDEX IF NOT EXISTS idx_becas_nombre_lower ON becas(LOWER(nombre));

CREATE TABLE IF NOT EXISTS beca_moderation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beca_id UUID NOT NULL REFERENCES becas(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50) NULL,
  estado_nuevo VARCHAR(50) NOT NULL,
  motivo TEXT NULL,
  moderado_por UUID NULL REFERENCES users(id),
  actor_rol VARCHAR(50) NULL,
  accion VARCHAR(50) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beca_history_beca_id ON beca_moderation_history(beca_id);
CREATE INDEX IF NOT EXISTS idx_beca_history_fecha ON beca_moderation_history(fecha);
CREATE INDEX IF NOT EXISTS idx_beca_history_moderado_por ON beca_moderation_history(moderado_por);
