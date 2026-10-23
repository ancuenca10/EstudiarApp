CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_application_status') THEN
    CREATE TYPE student_application_status AS ENUM (
      'iniciado',
      'investigando',
      'preparando_documentos',
      'aplicado',
      'en_revision',
      'admitido',
      'rechazado',
      'cancelado'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS student_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universidades(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  estado student_application_status NOT NULL DEFAULT 'iniciado',
  notas TEXT,
  asesor_asignado UUID REFERENCES users(id) ON DELETE SET NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_limite TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_applications_active_program
  ON student_applications(user_id, program_id)
  WHERE estado NOT IN ('rechazado', 'cancelado');
CREATE INDEX IF NOT EXISTS idx_student_applications_user_id ON student_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_university_id ON student_applications(university_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_program_id ON student_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_estado ON student_applications(estado);

CREATE TABLE IF NOT EXISTS application_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES student_applications(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  completado BOOLEAN NOT NULL DEFAULT FALSE,
  archivo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_requirements_application_id
  ON application_requirements(application_id);
CREATE INDEX IF NOT EXISTS idx_application_requirements_completado
  ON application_requirements(completado);

CREATE TABLE IF NOT EXISTS application_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES student_applications(id) ON DELETE CASCADE,
  estado student_application_status NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_timeline_application_id
  ON application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_timeline_created_at
  ON application_timeline(created_at DESC);
