import type { ScrapedPage } from './scrapePublicUrl';
import {
  extractCredits,
  extractDuration,
  extractSnies,
  isInvalidProgramName,
  isLikelyProgramName,
  normalizeText,
  removeUniversityNameFromProgram,
} from './importAssistantValidators';

export type ProgramDraft = {
  nombre: string | null;
  nivel: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico' | 'especializacion' | 'maestria' | 'doctorado' | 'diplomado' | 'curso' | 'otro';
  modalidad: 'presencial' | 'virtual' | 'distancia' | 'hibrida' | 'no_especificada';
  ciudad: string | null;
  departamento: string | null;
  duracion: string | null;
  creditos: number | null;
  tituloOtorgado: string | null;
  facultad: string | null;
  descripcion: string | null;
  perfilProfesional: string | null;
  campoLaboral: string | null;
  requisitos: string | null;
  costo: string | null;
  snies: string | null;
  registroCalificado: string | null;
  acreditacion: string | null;
  confidence: number;
  reasons: string[];
};

const inferLevel = (text: string): ProgramDraft['nivel'] => {
  if (/doctorado/i.test(text)) return 'doctorado';
  if (/maestr[ií]a/i.test(text)) return 'maestria';
  if (/especializaci[oó]n/i.test(text)) return 'especializacion';
  if (/tecnolog[ií]a/i.test(text)) return 'tecnologico';
  if (/t[eé]cnico/i.test(text)) return 'tecnico';
  if (/diplomado/i.test(text)) return 'diplomado';
  if (/curso/i.test(text)) return 'curso';
  if (/pregrado|profesional/i.test(text)) return 'pregrado';
  if (/posgrado/i.test(text)) return 'posgrado';
  return 'otro';
};

const inferModality = (text: string): ProgramDraft['modalidad'] => {
  if (/h[ií]brida|h[ií]brido/i.test(text)) return 'hibrida';
  if (/virtual/i.test(text)) return 'virtual';
  if (/distancia/i.test(text)) return 'distancia';
  if (/presencial/i.test(text)) return 'presencial';
  return 'no_especificada';
};

const extractSection = (text: string, title: string) => {
  const pattern = new RegExp(`${title}\\s+(.{30,800}?)(Perfil profesional|Campo laboral|Plan de estudios|Requisitos|SNIES|$)`, 'i');
  return normalizeText(text.match(pattern)?.[1]) || null;
};

export const basicProgramAnalyzer = (
  page: ScrapedPage,
  universityName: string
): { program: ProgramDraft; warnings: string[]; rejected: unknown[] } => {
  const candidates = [page.headings[0], page.title, ...page.headings]
    .map((item) => removeUniversityNameFromProgram(normalizeText(item).split(/\s[-|:]\s/)[0], universityName))
    .filter((item) => item && !isInvalidProgramName(item));
  const nombre = candidates.find(isLikelyProgramName) || null;
  const modalidad = inferModality(page.text);
  const nivel = inferLevel(`${nombre || ''} ${page.text}`);
  const duracion = extractDuration(page.text);
  const creditos = extractCredits(page.text);
  const snies = extractSnies(page.text);
  const costo = page.text.match(/(?:\$|COP\s*)\s?[\d.,]+(?:\s?(?:COP|pesos))?/i)?.[0] || null;
  const reasons = [
    nombre ? 'Nombre detectado en h1, title o encabezado principal' : '',
    modalidad !== 'no_especificada' ? 'Modalidad detectada' : '',
    duracion ? 'Duracion detectada' : '',
    snies ? 'SNIES detectado' : '',
  ].filter(Boolean);

  return {
    program: {
      nombre,
      nivel,
      modalidad,
      ciudad: null,
      departamento: /Huila/i.test(page.text) ? 'Huila' : null,
      duracion,
      creditos,
      tituloOtorgado: page.text.match(/t[ií]tulo otorgado\s*:?\s*([^.|;\n]{4,120})/i)?.[1] || null,
      facultad: page.text.match(/facultad\s+(?:de\s+)?([^.|;\n]{4,120})/i)?.[1] || null,
      descripcion: page.description || page.text.slice(0, 500) || null,
      perfilProfesional: extractSection(page.text, 'Perfil profesional'),
      campoLaboral: extractSection(page.text, 'Campo laboral'),
      requisitos: extractSection(page.text, 'Requisitos'),
      costo,
      snies,
      registroCalificado: page.text.match(/registro calificado\s*:?\s*([^.|;\n]{4,180})/i)?.[1] || null,
      acreditacion: page.text.match(/acreditaci[oó]n\s*:?\s*([^.|;\n]{4,180})/i)?.[1] || null,
      confidence: nombre ? 0.7 : 0.3,
      reasons,
    },
    warnings: nombre ? [] : ['No se detecto un nombre de programa confiable.'],
    rejected: [],
  };
};
