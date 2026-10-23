import { env } from '../config/env';
import { query } from '../config/db';

export type AIUniversityCandidate = {
  nombre: string;
  sitioWeb: string | null;
  ciudad: string | null;
  departamento: string | null;
  pais: string;
  confidence: number;
};

export type AIProgramCandidate = {
  nombre: string;
  nivel: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico' | 'diplomado' | 'curso' | 'otro';
  modalidad: 'presencial' | 'virtual' | 'distancia' | 'hibrida' | 'no_especificada';
  duracion: string | null;
  tituloOtorgado: string | null;
  facultad: string | null;
  confidence: number;
};

export type AIImportAnalysisResult = {
  universidad: AIUniversityCandidate;
  programas: AIProgramCandidate[];
  warnings: string[];
};

type AnalyzeInput = {
  sourceUrl: string;
  text: string;
  links: Array<{ label: string; url: string }>;
};

type AnalyzeResult =
  | { ok: true; data: AIImportAnalysisResult; sentChars: number }
  | { ok: false; reason: string; sentChars: number; error?: string };

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MAX_AI_TEXT_CHARS = 25_000;
const MAX_AI_LINKS = 25;
const MAX_AI_PROGRAMS = 20;
const AI_TIMEOUT_MS = 18_000;
const OPENAI_API_KEY_SETTING = 'openai_api_key';
const OPENAI_MODEL_SETTING = 'openai_model';

export const AI_IMPORT_ASSISTANT_SYSTEM_PROMPT = [
  'Actuas como asistente de extraccion para una plataforma educativa colombiana.',
  'Tu tarea es separar claramente la institucion principal de su oferta academica.',
  'Devuelve exactamente una universidad principal y una lista independiente de programas academicos.',
  'La universidad se identifica priorizando dominio, encabezados institucionales, metadata, footer y nombres legales.',
  'Patrones institucionales: Universidad, Corporacion Universitaria, Fundacion Universitaria, Institucion Universitaria, Politecnico, Escuela.',
  'Los programas se identifican priorizando secciones de oferta academica, facultades, carreras, pregrados y posgrados.',
  'Patrones de programa: Programa de, Carrera de, Pregrado en, Especializacion en, Maestria en, Doctorado en, Tecnologia en, Tecnico en.',
  'No tomes slogans, breadcrumbs, menus, banners, nombres de facultad, botones o categorias genericas como programas.',
  'El nombre de un programa no debe incluir el nombre de la universidad ni prefijos institucionales.',
  'No inventes datos. Si un dato no aparece claramente, usa null o no_especificada segun el campo.',
  'El pais por defecto es Colombia salvo evidencia clara de otro pais.',
  'Usa confidence de 0 a 1 de forma conservadora. Alta solo con evidencia fuerte.',
  'No publiques, no apruebes y no sugieras creacion automatica de registros.',
  'Devuelve JSON estricto segun el schema, sin HTML, Markdown ni texto fuera del JSON.',
].join(' ');

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['universidad', 'programas', 'warnings'],
  properties: {
    universidad: {
      type: 'object',
      additionalProperties: false,
      required: ['nombre', 'sitioWeb', 'ciudad', 'departamento', 'pais', 'confidence'],
      properties: {
        nombre: { type: 'string' },
        sitioWeb: { type: ['string', 'null'] },
        ciudad: { type: ['string', 'null'] },
        departamento: { type: ['string', 'null'] },
        pais: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
    programas: {
      type: 'array',
      maxItems: MAX_AI_PROGRAMS,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'nombre',
          'nivel',
          'modalidad',
          'duracion',
          'tituloOtorgado',
          'facultad',
          'confidence',
        ],
        properties: {
          nombre: { type: 'string' },
          nivel: {
            type: 'string',
            enum: ['pregrado', 'posgrado', 'tecnico', 'tecnologico', 'diplomado', 'curso', 'otro'],
          },
          modalidad: {
            type: 'string',
            enum: ['presencial', 'virtual', 'distancia', 'hibrida', 'no_especificada'],
          },
          duracion: { type: ['string', 'null'] },
          tituloOtorgado: { type: ['string', 'null'] },
          facultad: { type: ['string', 'null'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const clampConfidence = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, Number(numeric.toFixed(2))));
};

const extractOutputText = (payload: unknown) => {
  const data = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') return content.text;
    }
  }
  return '';
};

const getOpenAiRuntimeConfig = async () => {
  try {
    const result = await query(
      `SELECT key, value
       FROM system_settings
       WHERE key IN ($1, $2)`,
      [OPENAI_API_KEY_SETTING, OPENAI_MODEL_SETTING]
    );
    const settings = new Map<string, string>();
    for (const row of result.rows) {
      if (typeof row.value === 'string' && row.value.trim()) {
        settings.set(row.key, row.value.trim());
      }
    }
    return {
      apiKey: settings.get(OPENAI_API_KEY_SETTING) || env.openAiApiKey,
      model: settings.get(OPENAI_MODEL_SETTING) || env.openAiModel,
    };
  } catch {
    return {
      apiKey: env.openAiApiKey,
      model: env.openAiModel,
    };
  }
};

const sanitizeAnalysis = (analysis: AIImportAnalysisResult, sourceUrl: string): AIImportAnalysisResult => ({
  universidad: {
    nombre: normalizeText(analysis.universidad?.nombre).slice(0, 180),
    sitioWeb: normalizeText(analysis.universidad?.sitioWeb) || sourceUrl || null,
    ciudad: normalizeText(analysis.universidad?.ciudad) || null,
    departamento: normalizeText(analysis.universidad?.departamento) || null,
    pais: normalizeText(analysis.universidad?.pais) || 'Colombia',
    confidence: clampConfidence(analysis.universidad?.confidence),
  },
  programas: (Array.isArray(analysis.programas) ? analysis.programas : [])
    .map((program) => ({
      nombre: normalizeText(program.nombre).slice(0, 180),
      nivel: program.nivel,
      modalidad: program.modalidad,
      duracion: normalizeText(program.duracion) || null,
      tituloOtorgado: normalizeText(program.tituloOtorgado) || null,
      facultad: normalizeText(program.facultad) || null,
      confidence: clampConfidence(program.confidence),
    }))
    .filter((program) => program.nombre)
    .slice(0, MAX_AI_PROGRAMS),
  warnings: Array.isArray(analysis.warnings)
    ? analysis.warnings.map(normalizeText).filter(Boolean).slice(0, 12)
    : [],
});

export const analyzeImportAssistantWithAi = async (input: AnalyzeInput): Promise<AnalyzeResult> => {
  const cleanText = normalizeText(input.text).slice(0, MAX_AI_TEXT_CHARS);
  const openAiConfig = await getOpenAiRuntimeConfig();
  if (!openAiConfig.apiKey) {
    return { ok: false, reason: 'IA no configurada; se uso analisis basico.', sentChars: cleanText.length };
  }
  if (!cleanText) {
    return { ok: false, reason: 'Texto insuficiente para analisis IA; se uso analisis basico.', sentChars: 0 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const links = input.links
    .slice(0, MAX_AI_LINKS)
    .map((link) => `- ${normalizeText(link.label).slice(0, 120)}: ${link.url}`)
    .join('\n');

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAiConfig.model,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: AI_IMPORT_ASSISTANT_SYSTEM_PROMPT }],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `URL fuente: ${input.sourceUrl}`,
                  links ? `Enlaces internos priorizados:\n${links}` : 'Enlaces internos priorizados: ninguno',
                  'Texto limpio estructurado por pagina:',
                  cleanText,
                ].join('\n\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'import_assistant_university_programs',
            strict: true,
            schema: responseSchema,
          },
        },
        max_output_tokens: 4500,
        store: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return {
        ok: false,
        reason: 'IA no disponible; se uso analisis basico.',
        sentChars: cleanText.length,
        error: detail.slice(0, 300),
      };
    }

    const payload = await response.json() as unknown;
    const outputText = extractOutputText(payload);
    if (!outputText) {
      return { ok: false, reason: 'IA no devolvio JSON util; se uso analisis basico.', sentChars: cleanText.length };
    }

    const parsed = JSON.parse(outputText) as AIImportAnalysisResult;
    return {
      ok: true,
      data: sanitizeAnalysis(parsed, input.sourceUrl),
      sentChars: cleanText.length,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'IA fallo durante el analisis; se uso analisis basico.',
      sentChars: cleanText.length,
      error: error instanceof Error ? error.message : 'unknown',
    };
  } finally {
    clearTimeout(timeout);
  }
};
