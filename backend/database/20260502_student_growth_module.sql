CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_activity_action') THEN
    CREATE TYPE student_activity_action AS ENUM (
      'view_program',
      'view_university',
      'favorite',
      'compare',
      'search',
      'click_contact'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_alert_type') THEN
    CREATE TYPE student_alert_type AS ENUM (
      'new_program',
      'price_change',
      'recommendation'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_subscription_provider') THEN
    CREATE TYPE student_subscription_provider AS ENUM (
      'stripe',
      'wompi',
      'manual'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS student_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action student_activity_action NOT NULL,
  ref_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_activity_logs_user_id ON student_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_action ON student_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_ref_id ON student_activity_logs(ref_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_created_at ON student_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_user_action_created_at
  ON student_activity_logs(user_id, action, created_at DESC);

CREATE TABLE IF NOT EXISTS student_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo student_alert_type NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ref_id UUID,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_alerts_user_id ON student_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_alerts_tipo ON student_alerts(tipo);
CREATE INDEX IF NOT EXISTS idx_student_alerts_ref_id ON student_alerts(ref_id);
CREATE INDEX IF NOT EXISTS idx_student_alerts_leido ON student_alerts(leido);
CREATE INDEX IF NOT EXISTS idx_student_alerts_created_at ON student_alerts(created_at DESC);

CREATE TABLE IF NOT EXISTS student_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan student_plan NOT NULL,
  status student_subscription_status NOT NULL DEFAULT 'inactive',
  provider student_subscription_provider NOT NULL DEFAULT 'manual',
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_subscriptions_user_id ON student_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_plan ON student_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_status ON student_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_provider_external_id
  ON student_subscriptions(provider, external_id);
