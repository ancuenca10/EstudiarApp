import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

const OPENAI_API_KEY = 'openai_api_key';
const OPENAI_MODEL = 'openai_model';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const maskSecret = (value: string) => {
  if (!value) return null;
  if (value.length <= 12) return `${value.slice(0, 4)}...`;
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
};

const assertSettingsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NULL,
      is_secret BOOLEAN NOT NULL DEFAULT FALSE,
      description TEXT NULL,
      updated_by UUID NULL REFERENCES users(id),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
};

const getSettingValue = async (key: string) => {
  await assertSettingsTable();
  const result = await query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
  return normalizeText(result.rows[0]?.value);
};

const upsertSetting = async (
  key: string,
  value: string | null,
  isSecret: boolean,
  description: string,
  userId: string
) => {
  await assertSettingsTable();
  await query(
    `INSERT INTO system_settings (key, value, is_secret, description, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       is_secret = EXCLUDED.is_secret,
       description = EXCLUDED.description,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [key, value, isSecret, description, userId]
  );
};

export const getOpenAiSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbApiKey = await getSettingValue(OPENAI_API_KEY);
    const dbModel = await getSettingValue(OPENAI_MODEL);
    const activeApiKey = dbApiKey || env.openAiApiKey;
    const activeModel = dbModel || env.openAiModel || DEFAULT_OPENAI_MODEL;

    return res.json({
      success: true,
      data: {
        configured: Boolean(activeApiKey),
        storedInDatabase: Boolean(dbApiKey),
        usingEnvFallback: !dbApiKey && Boolean(env.openAiApiKey),
        maskedApiKey: maskSecret(activeApiKey),
        model: activeModel,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOpenAiSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const apiKey = normalizeText(req.body.apiKey);
    const model = normalizeText(req.body.model) || DEFAULT_OPENAI_MODEL;
    const clearApiKey = req.body.clearApiKey === true;

    if (apiKey && (apiKey.length < 20 || !/^sk-/.test(apiKey))) {
      throw new AppError('OPENAI_API_KEY no parece valida', 400);
    }
    if (!/^[a-zA-Z0-9._:-]{3,80}$/.test(model)) {
      throw new AppError('Modelo OpenAI invalido', 400);
    }

    if (apiKey || clearApiKey) {
      await upsertSetting(
        OPENAI_API_KEY,
        clearApiKey ? null : apiKey,
        true,
        'OpenAI API key used by the import assistant AI analysis',
        req.user.id
      );
    }

    await upsertSetting(
      OPENAI_MODEL,
      model,
      false,
      'OpenAI model used by the import assistant AI analysis',
      req.user.id
    );

    return getOpenAiSettings(req, res, next);
  } catch (error) {
    return next(error);
  }
};
