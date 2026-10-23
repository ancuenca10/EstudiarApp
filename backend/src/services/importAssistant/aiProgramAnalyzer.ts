import type { ScrapedPage } from './scrapePublicUrl';
import type { ProgramDraft } from './basicProgramAnalyzer';
import { getOpenAiRuntimeConfig } from './openAiRuntimeConfig';
import { normalizeText, removeUniversityNameFromProgram } from './importAssistantValidators';
import { openAiFailureReason, openAiUnavailableReason } from './openAiErrorDetails';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const AI_TIMEOUT_MS = 18000;

const SYSTEM_PROMPT = [
  'Tu unica tarea es extraer datos de un programa academico especifico.',
  'No extraigas datos institucionales salvo como contexto.',
  'No uses secciones como Perfil profesional, Plan de estudios, Campo laboral, Presentacion, Inscripciones o Requisitos como nombre del programa.',
  'El nombre del programa debe salir de h1, title, metadata o encabezado principal.',
  'Si recibes universityName, usalo solo como contexto y nunca como nombre de programa.',
  'Si no encuentras un nombre confiable, devuelve nombre null y agrega warning.',
  'No devuelvas listas de programas. Esta URL representa un programa principal.',
  'Devuelve solo JSON estricto.',
].join(' ');

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['program', 'warnings', 'rejected'],
  properties: {
    program: {
      type: 'object',
      additionalProperties: false,
      required: ['nombre', 'nivel', 'modalidad', 'ciudad', 'departamento', 'duracion', 'creditos', 'tituloOtorgado', 'facultad', 'descripcion', 'perfilProfesional', 'campoLaboral', 'requisitos', 'costo', 'snies', 'registroCalificado', 'acreditacion', 'confidence', 'reasons'],
      properties: {
        nombre: { type: ['string', 'null'] },
        nivel: { type: 'string', enum: ['pregrado', 'posgrado', 'tecnico', 'tecnologico', 'especializacion', 'maestria', 'doctorado', 'diplomado', 'curso', 'otro'] },
        modalidad: { type: 'string', enum: ['presencial', 'virtual', 'distancia', 'hibrida', 'no_especificada'] },
        ciudad: { type: ['string', 'null'] },
        departamento: { type: ['string', 'null'] },
        duracion: { type: ['string', 'null'] },
        creditos: { type: ['number', 'null'] },
        tituloOtorgado: { type: ['string', 'null'] },
        facultad: { type: ['string', 'null'] },
        descripcion: { type: ['string', 'null'] },
        perfilProfesional: { type: ['string', 'null'] },
        campoLaboral: { type: ['string', 'null'] },
        requisitos: { type: ['string', 'null'] },
        costo: { type: ['string', 'null'] },
        snies: { type: ['string', 'null'] },
        registroCalificado: { type: ['string', 'null'] },
        acreditacion: { type: ['string', 'null'] },
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

export const aiProgramAnalyzer = async (
  page: ScrapedPage,
  universityName: string
): Promise<{ ok: true; program: ProgramDraft; warnings: string[]; rejected: unknown[] } | { ok: false; reason: string }> => {
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
          { role: 'user', content: [{ type: 'input_text', text: `Universidad seleccionada: ${universityName}\nURL: ${page.finalUrl}\nTitle: ${page.title}\nMeta: ${page.description}\nHeadings: ${page.headings.join(' | ')}\nTexto:\n${page.text.slice(0, 25000)}` }] },
        ],
        text: { format: { type: 'json_schema', name: 'program_import_analysis', strict: true, schema } },
        max_output_tokens: 3500,
        store: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: await openAiUnavailableReason(response) };
    const parsed = JSON.parse(extractOutputText(await response.json())) as { program: ProgramDraft; warnings: string[]; rejected: unknown[] };
    return {
      ok: true,
      program: {
        ...parsed.program,
        nombre: parsed.program.nombre ? removeUniversityNameFromProgram(parsed.program.nombre, universityName) : null,
        confidence: Math.max(0, Math.min(1, Number(parsed.program.confidence || 0))),
        reasons: Array.isArray(parsed.program.reasons) ? parsed.program.reasons : [],
        descripcion: normalizeText(parsed.program.descripcion) || null,
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
