import { env } from '../../config/env';
import { query } from '../../config/db';

export const getOpenAiRuntimeConfig = async () => {
  try {
    const result = await query(
      `SELECT key, value
       FROM system_settings
       WHERE key IN ('openai_api_key', 'openai_model')`
    );
    const settings = new Map<string, string>();
    for (const row of result.rows) {
      if (typeof row.value === 'string' && row.value.trim()) {
        settings.set(row.key, row.value.trim());
      }
    }
    return {
      apiKey: settings.get('openai_api_key') || env.openAiApiKey,
      model: settings.get('openai_model') || env.openAiModel,
    };
  } catch {
    return { apiKey: env.openAiApiKey, model: env.openAiModel };
  }
};
