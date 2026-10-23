CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NULL,
  updated_by UUID NULL REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, is_secret, description)
VALUES
  ('openai_api_key', NULL, TRUE, 'OpenAI API key used by the import assistant AI analysis'),
  ('openai_model', 'gpt-4.1-mini', FALSE, 'OpenAI model used by the import assistant AI analysis')
ON CONFLICT (key) DO NOTHING;
