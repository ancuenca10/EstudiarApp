export type ValidationResult = {
  valid: boolean;
  warnings: string[];
  rejected: Array<{ field: string; value: unknown; reason: string }>;
};

export const normalizeText = (text: unknown): string =>
  typeof text === 'string'
    ? text.replace(/\s+/g, ' ').replace(/&nbsp;/gi, ' ').trim()
    : '';

export const stripHtml = (text: string): string =>
  normalizeText(
    text
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  );

export const normalizeName = (value: unknown): string =>
  normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

export const removeUniversityNameFromProgram = (programName: string, universityName: string): string => {
  let cleaned = normalizeText(programName);
  const university = normalizeText(universityName);
  if (!cleaned || !university) return cleaned;

  const normalizedUniversity = university
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');

  cleaned = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(new RegExp(`\\b${normalizedUniversity}\\b`, 'ig'), ' ')
    .replace(/\b(Universidad|Corporacion Universitaria|Fundacion Universitaria|Institucion Universitaria)\b\s*/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || normalizeText(programName);
};

export const isLikelyUniversityName = (value: string): boolean => {
  const text = normalizeText(value);
  if (text.length < 4 || text.length > 180) return false;
  if (/programa|carrera|pregrado|posgrado|perfil profesional|plan de estudios|campo laboral/i.test(text)) {
    return false;
  }
  return /\b(universidad|corporaci[oó]n universitaria|fundaci[oó]n universitaria|instituci[oó]n universitaria|polit[eé]cnico|escuela)\b/i.test(text);
};

const INVALID_PROGRAM_NAMES = [
  'perfil profesional',
  'campo laboral',
  'plan de estudios',
  'presentacion',
  'presentación',
  'inscripciones',
  'requisitos',
  'malla curricular',
  'oferta academica',
  'oferta académica',
  'acerca del programa',
  'por que estudiar',
  'por qué estudiar',
  'inicio',
  'programas',
  'pregrado',
  'posgrado',
];

export const isInvalidProgramName = (value: string): boolean => {
  const normalized = normalizeName(value);
  return INVALID_PROGRAM_NAMES.some((item) => normalized === normalizeName(item));
};

export const isLikelyProgramName = (value: string): boolean => {
  const text = normalizeText(value);
  if (text.length < 5 || text.length > 180) return false;
  if (isInvalidProgramName(text) || isLikelyUniversityName(text)) return false;
  return (
    /\b(ingenier[ií]a|licenciatura|administraci[oó]n|contadur[ií]a|derecho|medicina|enfermer[ií]a|psicolog[ií]a|matem[aá]tica|comunicaci[oó]n|econom[ií]a|arquitectura|especializaci[oó]n|maestr[ií]a|doctorado|tecnolog[ií]a|t[eé]cnico)\b/i.test(text) ||
    /^(programa|carrera|pregrado|especializaci[oó]n|maestr[ií]a|doctorado|tecnolog[ií]a|t[eé]cnico)\s+(de|en)\s+/i.test(text)
  );
};

export const extractSnies = (text: string): string | null => {
  const match = normalizeText(text).match(/\bSNIES\s*[:#-]?\s*(\d{3,8})\b/i);
  return match?.[1] || null;
};

export const extractCredits = (text: string): number | null => {
  const match = normalizeText(text).match(/\b(\d{1,3})\s*cr[eé]ditos?\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

export const extractDuration = (text: string): string | null => {
  const match = normalizeText(text).match(/\b\d{1,2}\s*(semestres?|trimestres?|cuatrimestres?|a[nñ]os?|meses)\b/i);
  return match?.[0] || null;
};

export const validateUniversityDraft = (draft: { nombre?: string | null; confidence?: number }): ValidationResult => {
  const rejected: ValidationResult['rejected'] = [];
  const warnings: string[] = [];
  const nombre = normalizeText(draft.nombre);
  if (!nombre) rejected.push({ field: 'nombre', value: draft.nombre, reason: 'Nombre institucional ausente' });
  else if (!isLikelyUniversityName(nombre)) rejected.push({ field: 'nombre', value: nombre, reason: 'No parece una universidad' });
  if ((draft.confidence || 0) < 0.6) warnings.push('Confianza menor a 0.60; requiere confirmacion manual.');
  return { valid: rejected.length === 0, warnings, rejected };
};

export const validateProgramDraft = (
  draft: { nombre?: string | null; confidence?: number },
  universityName: string
): ValidationResult => {
  const rejected: ValidationResult['rejected'] = [];
  const warnings: string[] = [];
  const nombre = removeUniversityNameFromProgram(normalizeText(draft.nombre), universityName);
  if (!nombre) rejected.push({ field: 'nombre', value: draft.nombre, reason: 'Nombre de programa ausente' });
  else if (!isLikelyProgramName(nombre)) rejected.push({ field: 'nombre', value: nombre, reason: 'No parece un programa academico' });
  if ((draft.confidence || 0) < 0.6) warnings.push('Confianza menor a 0.60; requiere confirmacion manual.');
  return { valid: rejected.length === 0, warnings, rejected };
};
