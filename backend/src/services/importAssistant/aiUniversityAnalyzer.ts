import type { ScrapedPage } from './scrapePublicUrl';
import type { UniversityDraft } from './basicUniversityAnalyzer';
import { getOpenAiRuntimeConfig } from './openAiRuntimeConfig';
import { normalizeText } from './importAssistantValidators';
import { openAiFailureReason, openAiUnavailableReason } from './openAiErrorDetails';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const AI_TIMEOUT_MS = 18000;

const SYSTEM_PROMPT = [
  'Tu unica tarea es extraer datos institucionales de una universidad.',
  'No extraigas programas academicos.',
  'No uses nombres de carreras, facultades, breadcrumbs o textos de programa como nombre de universidad.',
  'Prioriza dominio, logo alt, title, h1 institucional, metadata, footer y paginas acerca de.',
  'Ignora textos como Perfil profesional, Plan de estudios, Campo laboral, Inscripciones y Presentacion.',
  'No inventes datos. Si no hay evidencia clara, usa null o no_especificada.',
  'Devuelve solo JSON estricto.',
].join(' ');

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['university', 'warnings', 'rejected'],
  properties: {
    university: {
      type: 'object',
      additionalProperties: false,
      required: ['nombre', 'descripcion', 'pais', 'departamento', 'ciudad', 'sitioWeb', 'direccion', 'telefono', 'email', 'naturaleza', 'confidence', 'reasons'],
      properties: {
        nombre: { type: ['string', 'null'] },
        descripcion: { type: ['string', 'null'] },
        pais: { type: 'string' },
        departamento: { type: ['string', 'null'] },
        ciudad: { type: ['string', 'null'] },
        sitioWeb: { type: ['string', 'null'] },
        direccion: { type: ['string', 'null'] },
        telefono: { type: ['string', 'null'] },
        email: { type: ['string', 'null'] },
        naturaleza: { type: 'string', enum: ['publica', 'privada', 'mixta', 'no_especificada'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasons: { type: 'array', items: { type: 'string' } },
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
};

const extractOutputText = (payload: unknown) => {
  const data = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) for (const content of item.content || []) if (typeof content.text === 'string') return content.text;
  return '';
};

export const aiUniversityAnalyzer = async (
  page: ScrapedPage
): Promise<{ ok: true; university: UniversityDraft; warnings: string[]; rejected: unknown[] } | { ok: false; reason: string }> => {
  const config = await getOpenAiRuntimeConfig();
  if (!config.apiKey) return { ok: false, reason: 'IA no configurada; se uso analisis basico.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
          { role: 'user', content: [{ type: 'input_text', text: `URL: ${page.finalUrl}\nTitle: ${page.title}\nMeta: ${page.description}\nHeadings: ${page.headings.join(' | ')}\nTexto:\n${page.text.slice(0, 25000)}` }] },
        ],
        text: { format: { type: 'json_schema', name: 'university_import_analysis', strict: true, schema } },
        max_output_tokens: 2500,
        store: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: await openAiUnavailableReason(response) };
    const parsed = JSON.parse(extractOutputText(await response.json())) as { university: UniversityDraft; warnings: string[]; rejected: unknown[] };
    return {
      ok: true,
      university: {
        ...parsed.university,
        pais: normalizeText(parsed.university.pais) || 'Colombia',
        confidence: Math.max(0, Math.min(1, Number(parsed.university.confidence || 0))),
        reasons: Array.isArray(parsed.university.reasons) ? parsed.university.reasons : [],
      },
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
    };
  } catch (error) {
    return { ok: false, reason: openAiFailureReason(error) };
  } finally {
    clearTimeout(timeout);
  }
};
