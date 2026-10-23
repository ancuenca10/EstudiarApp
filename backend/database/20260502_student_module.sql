CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'STUDENT'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'STUDENT';
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_plan') THEN
    CREATE TYPE student_plan AS ENUM ('free', 'basic', 'plus');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_subscription_status') THEN
    CREATE TYPE student_subscription_status AS ENUM ('active', 'inactive', 'past_due', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_reference_type') THEN
    CREATE TYPE student_reference_type AS ENUM ('programa', 'universidad');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_modalidad') THEN
    CREATE TYPE student_modalidad AS ENUM ('presencial', 'virtual', 'distancia', 'hibrida');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_nivel') THEN
    CREATE TYPE student_nivel AS ENUM ('pregrado', 'posgrado', 'tecnico', 'tecnologico');
  END IF;
END
$$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tipo_usuario TEXT,
  ADD COLUMN IF NOT EXISTS plan student_plan NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS estado_suscripcion student_subscription_status NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS fecha_inicio_plan TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_fin_plan TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferencias_completadas BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_tipo_usuario_check;

ALTER TABLE users
  ADD CONSTRAINT users_tipo_usuario_check
  CHECK (tipo_usuario IS NULL OR tipo_usuario IN ('student', 'university', 'admin', 'asesor'));

CREATE INDEX IF NOT EXISTS idx_users_tipo_usuario ON users(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  intereses TEXT[] NOT NULL DEFAULT '{}',
  areas_interes TEXT[] NOT NULL DEFAULT '{}',
  ciudades_preferidas TEXT[] NOT NULL DEFAULT '{}',
  presupuesto_max NUMERIC,
  modalidad_preferida student_modalidad,
  nivel_interes student_nivel,
  pais_interes TEXT NOT NULL DEFAULT 'Colombia',
  idioma_preferido TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_profiles_presupuesto_check CHECK (presupuesto_max IS NULL OR presupuesto_max >= 0)
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);

CREATE TABLE IF NOT EXISTS student_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo student_reference_type NOT NULL,
  ref_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tipo, ref_id)
);

CREATE INDEX IF NOT EXISTS idx_student_favorites_user_id ON student_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_student_favorites_ref_id ON student_favorites(ref_id);
CREATE INDEX IF NOT EXISTS idx_student_favorites_tipo ON student_favorites(tipo);

CREATE TABLE IF NOT EXISTS student_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo student_reference_type NOT NULL,
  ref_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tipo, ref_id)
);

CREATE INDEX IF NOT EXISTS idx_student_comparisons_user_id ON student_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_student_comparisons_ref_id ON student_comparisons(ref_id);
CREATE INDEX IF NOT EXISTS idx_student_comparisons_tipo ON student_comparisons(tipo);
