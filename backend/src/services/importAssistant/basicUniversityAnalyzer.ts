import type { ScrapedPage } from './scrapePublicUrl';
import { isLikelyUniversityName, normalizeText } from './importAssistantValidators';

export type UniversityDraft = {
  nombre: string | null;
  descripcion: string | null;
  pais: string;
  departamento: string | null;
  ciudad: string | null;
  sitioWeb: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  naturaleza: 'publica' | 'privada' | 'mixta' | 'no_especificada';
  confidence: number;
  reasons: string[];
};

const inferCity = (text: string) => {
  const match = text.match(/\b(Neiva|Pitalito|Garz[oó]n|La Plata|Bogot[aá]|Medell[ií]n|Cali|Barranquilla|Bogot[aá]|Colombia)\b/i);
  return match?.[0] || null;
};

export const basicUniversityAnalyzer = (page: ScrapedPage): { university: UniversityDraft; warnings: string[]; rejected: unknown[] } => {
  const candidates = [
    page.title,
    ...page.headings,
    ...Array.from(page.text.matchAll(/\b(Universidad|Corporaci[oó]n Universitaria|Fundaci[oó]n Universitaria|Instituci[oó]n Universitaria|Polit[eé]cnico|Escuela)\s+[^.|,;:\n]{3,120}/gi)).map((m) => m[0]),
  ]
    .map((item) => normalizeText(item).split(/\s[-|:]\s/)[0])
    .filter(Boolean);

  const nombre = candidates.find(isLikelyUniversityName) || null;
  const email = page.text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const telefono = page.text.match(/(?:\+57\s?)?(?:\(?60\d\)?\s?)?\d{3}[\s.-]?\d{4}/)?.[0] || null;
  const naturaleza = /\bp[uú]blica\b/i.test(page.text)
    ? 'publica'
    : /\bprivada\b/i.test(page.text)
      ? 'privada'
      : 'no_especificada';
  const reasons = [
    nombre ? 'Nombre institucional detectado en title, encabezados o texto institucional' : '',
    page.description ? 'Descripcion detectada en metadata' : '',
  ].filter(Boolean);

  return {
    university: {
      nombre,
      descripcion: page.description || page.text.slice(0, 500) || null,
      pais: 'Colombia',
      departamento: /Huila/i.test(page.text) ? 'Huila' : null,
      ciudad: inferCity(page.text),
      sitioWeb: new URL(page.finalUrl).origin,
      direccion: null,
      telefono,
      email,
      naturaleza,
      confidence: nombre ? 0.72 : 0.35,
      reasons,
    },
    warnings: nombre ? [] : ['No se detecto un nombre institucional confiable.'],
    rejected: [],
  };
};
