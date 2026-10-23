import { lookup } from 'dns/promises';
import net from 'net';
import { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import {
  analyzeImportAssistantWithAi,
  type AIImportAnalysisResult,
  type AIProgramCandidate,
  type AIUniversityCandidate,
} from '../services/aiImportAssistantService';
import { aiProgramAnalyzer } from '../services/importAssistant/aiProgramAnalyzer';
import { aiUniversityAnalyzer } from '../services/importAssistant/aiUniversityAnalyzer';
import { basicProgramAnalyzer } from '../services/importAssistant/basicProgramAnalyzer';
import { basicUniversityAnalyzer } from '../services/importAssistant/basicUniversityAnalyzer';
import {
  normalizeText as normalizeAssistantText,
  removeUniversityNameFromProgram as cleanProgramUniversityName,
  validateProgramDraft,
  validateUniversityDraft,
} from '../services/importAssistant/importAssistantValidators';
import { scrapePublicUrl } from '../services/importAssistant/scrapePublicUrl';
import { syncDynamicFieldValues, type DynamicFieldInput } from '../utils/dynamicFields';

type ProposalType = 'universidad' | 'programa' | 'beca';
type SourceEngine = 'basic' | 'ai' | 'mixed';

type DuplicateMatch = {
  id: string;
  nombre: string;
  tipo: ProposalType;
};

type ImportProposal = {
  localId?: string;
  tipo: ProposalType;
  nombre: string;
  descripcion?: string | null;
  confidence: number;
  razones: string[];
  fuenteUrl: string;
  fuenteNombre?: string | null;
  camposDetectados: Record<string, unknown>;
  advertencias: string[];
  camposFaltantes?: string[];
  sourceEngine?: SourceEngine;
  posibleDuplicado: boolean;
  duplicados: DuplicateMatch[];
  selected?: boolean;
  discarded?: boolean;
};

type CrawledPage = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: RelevantLink[];
  warnings: string[];
};

type RelevantLink = {
  label: string;
  url: string;
  score: number;
};

type SaveResult = {
  index: number;
  tipo?: ProposalType;
  status: 'created' | 'skipped' | 'failed';
  id?: string;
  reason?: string;
};

type RejectedCandidate = {
  tipo: ProposalType;
  nombre: string;
  confidence: number;
  motivo: string;
  sourceEngine: SourceEngine;
};

const USER_AGENT = 'EstudiarAppImportAssistant/2.0';
const REQUEST_TIMEOUT_MS = 8000;
const TOTAL_ANALYSIS_TIMEOUT_MS = 60000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 80_000;
const MAX_INTERNAL_PAGES = 5;
const MAX_PROPOSALS = 30;
const CONFIDENCE_REVIEW_THRESHOLD = 0.6;

const USEFUL_LINK_RE = /programa|programas|oferta|acad[eé]mica|admisiones|pregrado|posgrado|beca|becas|financiaci[oó]n|matr[ií]cula|carrera|facultad/i;
const IRRELEVANT_LINK_RE = /login|iniciar-sesion|contacto|privacidad|terminos|t[eé]rminos|facebook|instagram|twitter|linkedin|youtube|whatsapp/i;
const FILE_LINK_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpg|jpeg|png|gif|webp|svg|mp4|mp3)(?:$|\?)/i;

const normalizeText = (value: unknown) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').replace(/&nbsp;/gi, ' ').trim()
    : '';

const isUuidValue = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ');

const stripTags = (value: string) => normalizeText(decodeHtmlEntities(value.replace(/<[^>]*>/g, ' ')));

const cleanHtml = (html: string) =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, ' ');

const normalizeName = (value: unknown) =>
  normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

const removeUniversityNameFromProgram = (programName: string, universityName: string) => {
  let cleaned = normalizeText(programName);
  const university = normalizeText(universityName);
  if (!cleaned || !university) return cleaned;

  const universityPattern = university
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');

  cleaned = cleaned
    .replace(new RegExp(`\\b${universityPattern}\\b`, 'ig'), ' ')
    .replace(/\b(Universidad|Corporacion Universitaria|Fundacion Universitaria|Institucion Universitaria)\b\s*(de|del|la)?\s*/ig, ' ')
    .replace(/\s+[-|:]\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

const isLikelyUniversityName = (value: unknown) => {
  const text = normalizeText(value);
  if (text.length < 4 || text.length > 180) return false;
  if (/programa|carrera|pregrado|posgrado|especializaci[oó]n|maestr[ií]a|doctorado|diplomado|curso|facultad/i.test(text)) {
    return false;
  }
  return /\b(universidad|corporaci[oó]n universitaria|fundaci[oó]n universitaria|instituci[oó]n universitaria|polit[eé]cnico|escuela)\b/i.test(text);
};

const isLikelyProgramName = (value: unknown, universityName = '') => {
  const text = removeUniversityNameFromProgram(normalizeText(value), universityName);
  if (text.length < 5 || text.length > 180) return false;
  if (isLikelyUniversityName(text)) return false;
  if (/^(inicio|home|contacto|noticias|eventos|admisiones|inscripciones|facultades|programas|oferta acad[eé]mica|pregrado|posgrado)$/i.test(text)) {
    return false;
  }
  return (
    /^(programa\s+de\s+|carrera\s+de\s+|pregrado\s+en\s+|especializaci[oó]n\s+en\s+|maestr[ií]a\s+en\s+|doctorado\s+en\s+|tecnolog[ií]a\s+en\s+|t[eé]cnico\s+en\s+)?[A-ZÁÉÍÓÚÑa-záéíóúñ]/.test(text) &&
    (
      /\b(administraci[oó]n|arquitectura|contadur[ií]a|derecho|dise[nñ]o|econom[ií]a|educaci[oó]n|enfermer[ií]a|ingenier[ií]a|licenciatura|medicina|psicolog[ií]a|tecnolog[ií]a|t[eé]cnica|especializaci[oó]n|maestr[ií]a|doctorado)\b/i.test(text) ||
      /^(programa|carrera|pregrado|especializaci[oó]n|maestr[ií]a|doctorado|tecnolog[ií]a|t[eé]cnico)\b/i.test(text)
    )
  );
};

const dedupeByNormalizedName = <T extends { nombre: string }>(items: T[]) => {
  const unique = new Map<string, T>();
  let removed = 0;
  for (const item of items) {
    const key = normalizeName(item.nombre);
    if (!key) continue;
    if (unique.has(key)) {
      removed += 1;
      continue;
    }
    unique.set(key, item);
  }
  return { items: Array.from(unique.values()), removed };
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getMetaContent = (html: string, key: string, attribute: 'name' | 'property') => {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(pattern);
  return match ? normalizeText(decodeHtmlEntities(match[1])) : '';
};

const getTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
};

const getHeadings = (html: string) => {
  const headings: string[] = [];
  for (const match of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
    const text = stripTags(match[1]);
    if (text && text.length <= 180) headings.push(text);
  }
  return [...new Set(headings)].slice(0, 40);
};

const getMainText = (html: string) =>
  stripTags(cleanHtml(html)).slice(0, MAX_TEXT_CHARS);

const parseDateOrNull = (value: unknown) => {
  const text = normalizeText(value);
  return text || null;
};

const normalizeUrl = (rawUrl: string) => {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new AppError('url invalida', 400);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError('Solo se permiten URLs http o https', 400);
  }

  url.hash = '';
  return url;
};

const isPrivateIpv4 = (ip: string) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};

const isBlockedHostLiteral = (hostname: string) => {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
};

const isBlockedIp = (ip: string) => {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return false;
};

const assertSafeUrl = async (url: URL) => {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError('Solo se permiten URLs http o https', 400);
  }
  if (isBlockedHostLiteral(url.hostname)) {
    throw new AppError('URL bloqueada por politica de seguridad', 400);
  }
  if (net.isIP(url.hostname) && isBlockedIp(url.hostname)) {
    throw new AppError('URL bloqueada por politica de seguridad', 400);
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new AppError('No se pudo resolver el dominio de la URL indicada', 400);
  }

  if (addresses.some((address) => isBlockedIp(address.address))) {
    throw new AppError('URL bloqueada por politica de seguridad', 400);
  }
};

const readLimitedText = async (response: globalThis.Response) => {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new AppError('La pagina excede el tamano maximo permitido', 400);
  }

  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      throw new AppError('La pagina excede el tamano maximo permitido', 400);
    }
    chunks.push(value);
  }

  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
};

const isHtmlResponse = (contentType: string, html: string) => {
  if (/text\/html|application\/xhtml\+xml/i.test(contentType)) return true;
  return /<!doctype html|<html[\s>]/i.test(html.slice(0, 800));
};

const fetchWithFriendlyErrors = async (url: URL, signal: AbortSignal) => {
  try {
    return await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'manual',
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('La URL tardo demasiado en responder. Intenta nuevamente o usa una pagina mas especifica.', 408);
    }

    const message = error instanceof Error ? error.message : '';
    throw new AppError(
      message ? `No se pudo conectar con la URL indicada: ${message}` : 'No se pudo conectar con la URL indicada',
      400
    );
  }
};

const fetchHtmlPage = async (inputUrl: URL) => {
  let currentUrl = inputUrl;
  const visited = new Set<string>();

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchWithFriendlyErrors(currentUrl, controller.signal);

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new AppError('Redireccion invalida', 400);
        const nextUrl = normalizeUrl(new URL(location, currentUrl).toString());
        if (visited.has(nextUrl.toString())) throw new AppError('Redireccion circular bloqueada', 400);
        visited.add(nextUrl.toString());
        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        throw new AppError(`No se pudo descargar la URL indicada (${response.status})`, 400);
      }

      const contentType = response.headers.get('content-type') || '';
      const html = await readLimitedText(response);
      if (!isHtmlResponse(contentType, html)) {
        throw new AppError('La URL no devolvio una pagina HTML analizable', 400);
      }

      return {
        finalUrl: currentUrl,
        html,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError('Redirecciones excesivas bloqueadas', 400);
};

const extractLinks = (html: string, baseUrl: URL): RelevantLink[] => {
  const links = new Map<string, RelevantLink>();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = normalizeText(match[1]);
    const label = stripTags(match[2]).slice(0, 140);
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript|data|file|ftp):/i.test(href)) continue;

    let resolved: URL;
    try {
      resolved = new URL(href, baseUrl);
      resolved.hash = '';
    } catch {
      continue;
    }

    if (!['http:', 'https:'].includes(resolved.protocol)) continue;
    if (resolved.hostname !== baseUrl.hostname) continue;
    if (FILE_LINK_RE.test(resolved.pathname)) continue;

    const haystack = `${label} ${resolved.pathname}`;
    if (IRRELEVANT_LINK_RE.test(haystack)) continue;

    let score = 0;
    if (USEFUL_LINK_RE.test(haystack)) score += 3;
    if (/programa|pregrado|posgrado|oferta/i.test(haystack)) score += 2;
    if (/beca|financiaci/i.test(haystack)) score += 2;
    if (score === 0) continue;

    const key = resolved.toString();
    const existing = links.get(key);
    if (!existing || existing.score < score) {
      links.set(key, { label: label || resolved.pathname, url: key, score });
    }
  }

  return Array.from(links.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INTERNAL_PAGES);
};

const parsePage = (url: URL, html: string): CrawledPage => {
  const cleaned = cleanHtml(html);
  const title = getTitle(cleaned);
  const description =
    getMetaContent(cleaned, 'description', 'name') ||
    getMetaContent(cleaned, 'og:description', 'property') ||
    '';

  return {
    url: url.toString(),
    title,
    description,
    headings: getHeadings(cleaned),
    text: getMainText(cleaned),
    links: extractLinks(cleaned, url),
    warnings: [],
  };
};

const inferUniversityName = (page: CrawledPage) => {
  const institutionalMatches = Array.from(
    page.text.matchAll(/\b(Universidad|Corporaci[oó]n Universitaria|Fundaci[oó]n Universitaria|Instituci[oó]n Universitaria|Polit[eé]cnico|Escuela)\s+[^.|,;:\n]{3,120}/gi)
  )
    .map((match) => normalizeText(match[0]).replace(/\s+(Inicio|Menu|Men[uú]|Oferta|Programas).*$/i, ''))
    .filter((item) => isLikelyUniversityName(item));

  const candidates = [
    page.title,
    ...page.headings,
    ...institutionalMatches,
  ]
    .map((item) => normalizeText(item).split(/\s[-|:]\s/)[0])
    .filter(Boolean);

  return candidates.find(isLikelyUniversityName) || candidates[0] || '';
};

const inferCity = (text: string) => {
  const match = text.match(/\b(Neiva|Pitalito|Garz[oó]n|La Plata|Bogot[aá]|Medell[ií]n|Cali|Barranquilla|Colombia)\b/i);
  return match ? normalizeText(match[0]) : '';
};

const extractPrice = (text: string) => {
  const match = text.match(/(?:\$|COP\s*)\s?[\d.,]+(?:\s?(?:COP|pesos))?/i);
  if (!match) return null;
  const numeric = Number(match[0].replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

const looksLikeProgramName = (value: string) => {
  const text = normalizeText(value);
  if (text.length < 5 || text.length > 140) return false;
  if (/^(inicio|home|contacto|noticias|eventos|admisiones|inscripciones|facultades|programas|oferta acad[eé]mica)$/i.test(text)) return false;
  return (
    /^(programa\s+de\s+)?(administraci[oó]n|arquitectura|contadur[ií]a|derecho|dise[nñ]o|econom[ií]a|educaci[oó]n|enfermer[ií]a|ingenier[ií]a|licenciatura|medicina|psicolog[ií]a|tecnolog[ií]a|t[eé]cnica|especializaci[oó]n|maestr[ií]a|doctorado)\b/i.test(text) ||
    /\b(pregrado|posgrado|especializaci[oó]n|maestr[ií]a|doctorado|tecnolog[ií]a|t[eé]cnica profesional|profesional)\b/i.test(text)
  );
};

const inferProgramDetails = (text: string, sourceUrl: string) => {
  const normalized = normalizeText(text);
  const parts = normalized
    .split(/\s(?:\||•|·|-|–|—)\s|(?<=\.)\s+/)
    .map(normalizeText)
    .filter(Boolean);
  const nombre = parts.find(looksLikeProgramName) || (looksLikeProgramName(normalized) ? normalized : '');
  if (!nombre) return null;

  const modalidad = normalized.match(/\b(presencial|virtual|a distancia|h[ií]brida|h[ií]brido|semipresencial|dual)\b/i)?.[0] || '';
  const duracion = normalized.match(/\b\d{1,2}\s?(?:semestres?|trimestres?|cuatrimestres?|a[nñ]os?|meses)\b/i)?.[0] || '';
  const nivel = normalized.match(/\b(pregrado|posgrado|especializaci[oó]n|maestr[ií]a|doctorado|tecnolog[ií]a|t[eé]cnica profesional|profesional)\b/i)?.[0] || '';
  const descripcion = parts.find((part) => part !== nombre && part.length >= 45 && part.length <= 320) || '';

  const razones = ['Nombre de programa detectado en contenido academico'];
  if (modalidad) razones.push('Modalidad detectada');
  if (duracion) razones.push('Duracion detectada');
  if (nivel) razones.push('Nivel academico detectado');
  if (descripcion) razones.push('Descripcion asociada detectada');

  const missing = [];
  if (!descripcion) missing.push('descripcion');
  if (!modalidad) missing.push('modalidad');
  if (!duracion) missing.push('duracion');

  return {
    tipo: 'programa' as const,
    nombre: nombre.slice(0, 140),
    descripcion,
    confidence: calculateConfidence([nombre, descripcion, modalidad, duracion, nivel].filter(Boolean).length, 5, missing),
    razones,
    fuenteUrl: sourceUrl,
    fuenteNombre: '',
    camposDetectados: {
      nombre: nombre.slice(0, 140),
      descripcion,
      modalidad,
      duracion,
      nivel,
      precio: extractPrice(normalized),
    },
    advertencias: missing.length ? [`Faltan datos por verificar: ${missing.join(', ')}`] : [],
    camposFaltantes: missing,
    sourceEngine: 'basic' as const,
    posibleDuplicado: false,
    duplicados: [],
  };
};

const extractProgramProposals = (page: CrawledPage): ImportProposal[] => {
  const snippets = [
    ...page.headings,
    ...Array.from(page.text.matchAll(/(?:.{0,80}(?:programa|pregrado|posgrado|ingenier[ií]a|maestr[ií]a|tecnolog[ií]a).{0,240})/gi)).map((match) => match[0]),
  ];

  const unique = new Map<string, ImportProposal>();
  for (const snippet of snippets) {
    const proposal = inferProgramDetails(snippet, page.url);
    if (!proposal) continue;
    const key = normalizeName(proposal.nombre);
    if (!key || unique.has(key)) continue;
    unique.set(key, proposal);
  }
  return Array.from(unique.values());
};

const extractBecaProposals = (page: CrawledPage): ImportProposal[] => {
  if (!/\bbeca|financiaci[oó]n|subsidio|descuento|cr[eé]dito educativo/i.test(page.text)) return [];
  const snippets = Array.from(page.text.matchAll(/.{0,90}(?:beca|financiaci[oó]n|subsidio|descuento|cr[eé]dito educativo).{0,260}/gi)).map((match) => normalizeText(match[0]));

  return snippets.slice(0, 5).map((snippet) => ({
    tipo: 'beca',
    nombre: snippet.match(/(?:beca|financiaci[oó]n|subsidio|descuento|cr[eé]dito educativo)[^.,;]{0,90}/i)?.[0]?.slice(0, 140) || 'Beca detectada',
    descripcion: snippet,
    confidence: calculateConfidence(2, 5, ['universidadId']),
    razones: ['Se detectaron palabras asociadas a becas o financiacion'],
    fuenteUrl: page.url,
    fuenteNombre: '',
    camposDetectados: {
      nombre: snippet.match(/(?:beca|financiaci[oó]n|subsidio|descuento|cr[eé]dito educativo)[^.,;]{0,90}/i)?.[0] || '',
      descripcion: snippet,
      enlace: page.url,
    },
    advertencias: ['Propuesta de beca preliminar; requiere revision manual'],
    camposFaltantes: ['universidadId'],
    sourceEngine: 'basic' as const,
    posibleDuplicado: false,
    duplicados: [],
  }));
};

const calculateConfidence = (signals: number, maxSignals: number, missing: string[]) => {
  const base = Math.min(0.9, Math.max(0.15, signals / maxSignals));
  const penalty = Math.min(0.35, missing.length * 0.08);
  return Number(Math.max(0.05, base - penalty).toFixed(2));
};

const buildUniversityProposal = (page: CrawledPage): ImportProposal => {
  const nombre = inferUniversityName(page);
  const descripcion = page.description || page.text.slice(0, 500);
  const ciudad = inferCity(page.text);
  const missing = [];
  if (!nombre) missing.push('nombre');
  if (!descripcion) missing.push('descripcion');
  if (!ciudad) missing.push('ciudad');

  return {
    tipo: 'universidad',
    nombre,
    descripcion,
    confidence: calculateConfidence([nombre, descripcion, ciudad].filter(Boolean).length, 4, missing),
    razones: [
      nombre ? 'Nombre detectado en title/h1' : '',
      descripcion ? 'Descripcion detectada en metadata o texto principal' : '',
      ciudad ? 'Ciudad detectada en contenido' : '',
    ].filter(Boolean),
    fuenteUrl: page.url,
    fuenteNombre: nombre || new URL(page.url).hostname,
    camposDetectados: {
      nombre,
      descripcion,
      ciudad,
      sitioWeb: new URL(page.url).origin,
    },
    advertencias: missing.length ? [`Faltan datos por verificar: ${missing.join(', ')}`] : [],
    camposFaltantes: missing,
    sourceEngine: 'basic' as const,
    posibleDuplicado: false,
    duplicados: [],
  };
};

const findUniversityDuplicates = async (nombre: string): Promise<DuplicateMatch[]> => {
  const normalized = normalizeName(nombre);
  if (!normalized) return [];
  const result = await query(
    `SELECT id, nombre
     FROM universidades
     WHERE LOWER(REGEXP_REPLACE(TRIM(nombre), '\\s+', ' ', 'g')) = $1
        OR LOWER(nombre) ILIKE $2
     LIMIT 5`,
    [normalized, `%${nombre}%`]
  );
  return result.rows.map((row) => ({ id: row.id, nombre: row.nombre, tipo: 'universidad' as const }));
};

const findProgramDuplicates = async (nombre: string, universidadId?: string | null): Promise<DuplicateMatch[]> => {
  const normalized = normalizeName(nombre);
  if (!normalized) return [];
  const params: unknown[] = [normalized];
  let universityClause = '';
  if (universidadId) {
    params.push(universidadId);
    universityClause = `AND universidad_id = $2`;
  }
  const result = await query(
    `SELECT id, nombre
     FROM programas
     WHERE LOWER(REGEXP_REPLACE(TRIM(nombre), '\\s+', ' ', 'g')) = $1
       ${universityClause}
     LIMIT 5`,
    params
  );
  return result.rows.map((row) => ({ id: row.id, nombre: row.nombre, tipo: 'programa' as const }));
};

const findBecaDuplicates = async (nombre: string, universidadId?: string | null): Promise<DuplicateMatch[]> => {
  try {
    const normalized = normalizeName(nombre);
    if (!normalized) return [];
    const params: unknown[] = [normalized];
    let universityClause = '';
    if (universidadId) {
      params.push(universidadId);
      universityClause = `AND universidad_id = $2`;
    }
    const result = await query(
      `SELECT id, nombre
       FROM becas
       WHERE LOWER(REGEXP_REPLACE(TRIM(nombre), '\\s+', ' ', 'g')) = $1
         ${universityClause}
       LIMIT 5`,
      params
    );
    return result.rows.map((row) => ({ id: row.id, nombre: row.nombre, tipo: 'beca' as const }));
  } catch {
    return [];
  }
};

const attachDuplicates = async (proposal: ImportProposal) => {
  let duplicados: DuplicateMatch[] = [];
  if (proposal.tipo === 'universidad') duplicados = await findUniversityDuplicates(proposal.nombre);
  if (proposal.tipo === 'programa') {
    duplicados = await findProgramDuplicates(
      proposal.nombre,
      typeof proposal.camposDetectados.universidadId === 'string' ? proposal.camposDetectados.universidadId : null
    );
  }
  if (proposal.tipo === 'beca') {
    duplicados = await findBecaDuplicates(
      proposal.nombre,
      typeof proposal.camposDetectados.universidadId === 'string' ? proposal.camposDetectados.universidadId : null
    );
  }

  return {
    ...proposal,
    posibleDuplicado: duplicados.length > 0,
    duplicados,
    advertencias: duplicados.length
      ? [...proposal.advertencias, 'Posible duplicado detectado']
      : proposal.advertencias,
  };
};

const getActiveDynamicFields = async (module: ProposalType) => {
  if (!['universidad', 'programa', 'beca'].includes(module)) return [];
  const result = await query(
    `SELECT id, nombre_interno, etiqueta, requerido, tipo
     FROM form_fields
     WHERE modulo = $1 AND activo = true
     ORDER BY orden ASC, created_at ASC`,
    [module]
  );
  return result.rows;
};

const suggestDynamicFields = async (proposal: ImportProposal) => {
  const fields = await getActiveDynamicFields(proposal.tipo);
  const haystack = `${proposal.nombre} ${proposal.descripcion || ''} ${Object.values(proposal.camposDetectados).join(' ')}`;
  const dynamicFields: DynamicFieldInput[] = [];
  const requiredMissing: string[] = [];

  for (const field of fields) {
    const key = String(field.nombre_interno || '');
    const explicit = proposal.camposDetectados[key];
    if (explicit !== undefined && explicit !== null && explicit !== '') {
      dynamicFields.push({ fieldId: field.id, value: explicit });
      continue;
    }
    if (/modalidad/i.test(key) && proposal.camposDetectados.modalidad) {
      dynamicFields.push({ fieldId: field.id, value: proposal.camposDetectados.modalidad });
      continue;
    }
    if (/duracion/i.test(key) && proposal.camposDetectados.duracion) {
      dynamicFields.push({ fieldId: field.id, value: proposal.camposDetectados.duracion });
      continue;
    }
    if (/nivel/i.test(key) && proposal.camposDetectados.nivel) {
      dynamicFields.push({ fieldId: field.id, value: proposal.camposDetectados.nivel });
      continue;
    }
    if (field.requerido && !new RegExp(key.replace(/_/g, ' '), 'i').test(haystack)) {
      requiredMissing.push(field.etiqueta);
    }
  }

  return {
    ...proposal,
    camposDetectados: {
      ...proposal.camposDetectados,
      dynamicFields,
    },
    advertencias: requiredMissing.length
      ? [...proposal.advertencias, `Campos dinamicos requeridos por completar: ${requiredMissing.join(', ')}`]
      : proposal.advertencias,
  };
};

const uniqTexts = (...groups: Array<string[] | undefined>) => {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const group of groups) {
    for (const item of group || []) {
      const text = normalizeText(item);
      const key = text.toLowerCase();
      if (!text || seen.has(key)) continue;
      seen.add(key);
      items.push(text);
    }
  }
  return items;
};

const mergeFieldValues = (left: Record<string, unknown>, right: Record<string, unknown>) => {
  const merged = { ...left };
  for (const [key, value] of Object.entries(right)) {
    if (value === null || value === undefined || value === '') continue;
    if (merged[key] === null || merged[key] === undefined || merged[key] === '') {
      merged[key] = value;
    }
  }
  return merged;
};

const universityCandidateToProposal = (
  university: AIUniversityCandidate,
  fallbackUrl: string,
  fallbackDescription = '',
): ImportProposal => ({
  tipo: 'universidad',
  nombre: university.nombre,
  descripcion: fallbackDescription,
  confidence: university.confidence,
  razones: ['Universidad principal detectada por IA'],
  fuenteUrl: university.sitioWeb || fallbackUrl,
  fuenteNombre: university.nombre,
  camposDetectados: {
    nombre: university.nombre,
    descripcion: fallbackDescription,
    ciudad: university.ciudad || '',
    departamento: university.departamento || '',
    pais: university.pais || 'Colombia',
    sitioWeb: university.sitioWeb || fallbackUrl,
  },
  advertencias: [],
  camposFaltantes: [
    ...(!university.ciudad ? ['ciudad'] : []),
    ...(!university.departamento ? ['departamento'] : []),
  ],
  sourceEngine: 'ai',
  posibleDuplicado: false,
  duplicados: [],
});

const programCandidateToProposal = (
  program: AIProgramCandidate,
  universityName: string,
  fallbackUrl: string,
): ImportProposal => {
  const nombre = removeUniversityNameFromProgram(program.nombre, universityName);
  const descripcion = [
    program.tituloOtorgado ? `Titulo otorgado: ${program.tituloOtorgado}` : '',
    program.facultad ? `Facultad: ${program.facultad}` : '',
    program.nivel ? `Nivel: ${program.nivel}` : '',
  ].filter(Boolean).join('. ');

  return {
    tipo: 'programa',
    nombre,
    descripcion,
    confidence: program.confidence,
    razones: ['Programa academico detectado por IA'],
    fuenteUrl: fallbackUrl,
    fuenteNombre: universityName,
    camposDetectados: {
      nombre,
      descripcion,
      modalidad: program.modalidad === 'no_especificada' ? '' : program.modalidad,
      duracion: program.duracion || '',
      nivel: program.nivel,
      tituloOtorgado: program.tituloOtorgado || '',
      facultad: program.facultad || '',
      precio: null,
    },
    advertencias: program.modalidad === 'no_especificada' ? ['Modalidad no especificada'] : [],
    camposFaltantes: [
      ...(!program.duracion ? ['duracion'] : []),
      ...(program.modalidad === 'no_especificada' ? ['modalidad'] : []),
    ],
    sourceEngine: 'ai',
    posibleDuplicado: false,
    duplicados: [],
  };
};

const validateAIImportResult = (
  analysis: AIImportAnalysisResult,
  fallbackUrl: string,
  fallbackDescription: string,
) => {
  const rejectedCandidates: RejectedCandidate[] = [];
  const warnings = [...analysis.warnings];
  const rawUniversity = analysis.universidad;
  const universityName = normalizeText(rawUniversity?.nombre);

  let universityProposal: ImportProposal | null = null;
  if (!universityName) {
    warnings.push('IA no identifico una universidad principal confiable');
  } else if (rawUniversity.confidence < 0.6) {
    rejectedCandidates.push({
      tipo: 'universidad',
      nombre: universityName,
      confidence: rawUniversity.confidence,
      motivo: 'Confianza menor a 0.60',
      sourceEngine: 'ai',
    });
  } else if (!isLikelyUniversityName(universityName)) {
    rejectedCandidates.push({
      tipo: 'universidad',
      nombre: universityName,
      confidence: rawUniversity.confidence,
      motivo: 'El nombre no parece una institucion universitaria',
      sourceEngine: 'ai',
    });
  } else {
    universityProposal = universityCandidateToProposal(rawUniversity, fallbackUrl, fallbackDescription);
  }

  const programCandidates = analysis.programas.map((program) => ({
    ...program,
    nombre: removeUniversityNameFromProgram(program.nombre, universityName),
  }));
  const deduped = dedupeByNormalizedName(programCandidates);
  for (let i = 0; i < deduped.removed; i += 1) {
    rejectedCandidates.push({
      tipo: 'programa',
      nombre: 'Programa duplicado',
      confidence: 0,
      motivo: 'Duplicado eliminado por nombre normalizado',
      sourceEngine: 'ai',
    });
  }

  const programProposals: ImportProposal[] = [];
  for (const program of deduped.items) {
    if (program.confidence < 0.6) {
      rejectedCandidates.push({
        tipo: 'programa',
        nombre: program.nombre,
        confidence: program.confidence,
        motivo: 'Confianza menor a 0.60',
        sourceEngine: 'ai',
      });
      continue;
    }
    if (!isLikelyProgramName(program.nombre, universityName)) {
      rejectedCandidates.push({
        tipo: 'programa',
        nombre: program.nombre,
        confidence: program.confidence,
        motivo: 'El nombre no parece un programa academico',
        sourceEngine: 'ai',
      });
      continue;
    }
    programProposals.push(programCandidateToProposal(program, universityName, fallbackUrl));
  }

  return {
    universityProposal,
    programProposals,
    rejectedCandidates,
    warnings,
    dedupedPrograms: deduped.removed,
  };
};

const mergeImportProposal = (existing: ImportProposal, incoming: ImportProposal): ImportProposal => {
  const sourceEngine: SourceEngine = existing.sourceEngine === incoming.sourceEngine
    ? existing.sourceEngine || 'basic'
    : 'mixed';

  return {
    ...existing,
    descripcion: normalizeText(existing.descripcion) || incoming.descripcion || null,
    confidence: Math.max(existing.confidence || 0, incoming.confidence || 0),
    razones: uniqTexts(existing.razones, incoming.razones),
    advertencias: uniqTexts(existing.advertencias, incoming.advertencias),
    camposFaltantes: uniqTexts(existing.camposFaltantes, incoming.camposFaltantes),
    camposDetectados: mergeFieldValues(existing.camposDetectados, incoming.camposDetectados),
    fuenteUrl: existing.fuenteUrl || incoming.fuenteUrl,
    fuenteNombre: existing.fuenteNombre || incoming.fuenteNombre,
    sourceEngine,
  };
};

const mergeProposals = (basic: ImportProposal[], ai: ImportProposal[]) => {
  const merged = new Map<string, ImportProposal>();
  for (const proposal of [...basic, ...ai]) {
    const key = `${proposal.tipo}:${normalizeName(proposal.nombre)}`;
    if (!key || key.endsWith(':')) continue;
    const existing = merged.get(key);
    merged.set(key, existing ? mergeImportProposal(existing, proposal) : proposal);
  }
  return Array.from(merged.values());
};

const prepareSeparatedProposals = (proposals: ImportProposal[]) => {
  const rejectedCandidates: RejectedCandidate[] = [];
  const universities = proposals
    .filter((proposal) => proposal.tipo === 'universidad')
    .sort((a, b) => b.confidence - a.confidence);
  const selectedUniversity = universities.find((proposal) =>
    proposal.confidence >= 0.6 && isLikelyUniversityName(proposal.nombre)
  ) || null;

  for (const university of universities) {
    if (selectedUniversity && university === selectedUniversity) continue;
    rejectedCandidates.push({
      tipo: 'universidad',
      nombre: university.nombre,
      confidence: university.confidence,
      motivo: university.confidence < 0.6
        ? 'Confianza menor a 0.60'
        : 'Se descarta para mantener una sola universidad principal',
      sourceEngine: university.sourceEngine || 'basic',
    });
  }

  const universityName = selectedUniversity?.nombre || '';
  const programCandidates = proposals
    .filter((proposal) => proposal.tipo === 'programa')
    .map((proposal) => ({
      ...proposal,
      nombre: removeUniversityNameFromProgram(proposal.nombre, universityName),
      camposDetectados: {
        ...proposal.camposDetectados,
        nombre: removeUniversityNameFromProgram(proposal.nombre, universityName),
      },
    }));
  const dedupedPrograms = dedupeByNormalizedName(programCandidates);
  const programs: ImportProposal[] = [];

  for (const program of dedupedPrograms.items) {
    if (program.confidence < 0.6) {
      rejectedCandidates.push({
        tipo: 'programa',
        nombre: program.nombre,
        confidence: program.confidence,
        motivo: 'Confianza menor a 0.60',
        sourceEngine: program.sourceEngine || 'basic',
      });
      continue;
    }
    if (!isLikelyProgramName(program.nombre, universityName)) {
      rejectedCandidates.push({
        tipo: 'programa',
        nombre: program.nombre,
        confidence: program.confidence,
        motivo: 'El nombre no parece un programa academico',
        sourceEngine: program.sourceEngine || 'basic',
      });
      continue;
    }
    programs.push(program);
  }

  for (let i = 0; i < dedupedPrograms.removed; i += 1) {
    rejectedCandidates.push({
      tipo: 'programa',
      nombre: 'Programa duplicado',
      confidence: 0,
      motivo: 'Duplicado eliminado por nombre normalizado',
      sourceEngine: 'mixed',
    });
  }

  const otherProposals = proposals.filter((proposal) => proposal.tipo !== 'universidad' && proposal.tipo !== 'programa');
  return {
    proposals: [
      ...(selectedUniversity ? [selectedUniversity] : []),
      ...programs,
      ...otherProposals,
    ],
    universidadDetectada: selectedUniversity,
    programasDetectados: programs,
    rejectedCandidates,
    duplicateProgramsRemoved: dedupedPrograms.removed,
  };
};

const buildAiTextPayload = (pages: CrawledPage[]) =>
  pages
    .map((page) => [
      `URL: ${page.url}`,
      page.title ? `Titulo: ${page.title}` : '',
      page.description ? `Descripcion: ${page.description}` : '',
      page.headings.length ? `Titulos internos: ${page.headings.join(' | ')}` : '',
      page.text,
    ].filter(Boolean).join('\n'))
    .join('\n\n---\n\n');

const analyzeUrl = async (rawUrl: string, useAI = false) => {
  const start = Date.now();
  const rootUrl = normalizeUrl(rawUrl);
  const warnings: string[] = [];
  const crawledUrls: string[] = [];

  const { finalUrl, html } = await fetchHtmlPage(rootUrl);
  const rootPage = parsePage(finalUrl, html);
  crawledUrls.push(rootPage.url);

  const pages: CrawledPage[] = [rootPage];
  const linksToCrawl = rootPage.links
    .slice(0, MAX_INTERNAL_PAGES)
    .filter((link, index, list) => list.findIndex((item) => item.url === link.url) === index);

  const crawledPages = await Promise.all(
    linksToCrawl.map(async (link) => {
      try {
        const pageUrl = normalizeUrl(link.url);
        if (pageUrl.hostname !== finalUrl.hostname) return null;
        if (crawledUrls.includes(pageUrl.toString())) return null;
        const fetched = await fetchHtmlPage(pageUrl);
        return {
          page: parsePage(fetched.finalUrl, fetched.html),
          url: fetched.finalUrl.toString(),
        };
      } catch (error) {
        warnings.push(error instanceof Error ? `No se pudo rastrear ${link.url}: ${error.message}` : `No se pudo rastrear ${link.url}`);
        return null;
      }
    })
  );

  for (const crawled of crawledPages) {
    if (!crawled || crawledUrls.includes(crawled.url)) continue;
    pages.push(crawled.page);
    crawledUrls.push(crawled.url);
  }

  let proposals: ImportProposal[] = [
    buildUniversityProposal(rootPage),
    ...pages.flatMap(extractProgramProposals),
    ...pages.flatMap(extractBecaProposals),
  ].filter((proposal) => proposal.nombre);

  const unique = new Map<string, ImportProposal>();
  for (const proposal of proposals) {
    const key = `${proposal.tipo}:${normalizeName(proposal.nombre)}`;
    if (!unique.has(key)) unique.set(key, proposal);
  }
  proposals = Array.from(unique.values()).slice(0, MAX_PROPOSALS);

  let summary = rootPage.description || rootPage.text.slice(0, 500);
  let analysisMode: SourceEngine = 'basic';
  let rejectedCandidates: RejectedCandidate[] = [];
  let duplicateProgramsRemoved = 0;

  if (useAI) {
    const aiStartedAt = Date.now();
    const aiResult = await analyzeImportAssistantWithAi({
      sourceUrl: finalUrl.toString(),
      text: buildAiTextPayload(pages),
      links: pages.flatMap((page) => page.links.map((link) => ({ label: link.label, url: link.url }))),
    });

    if (aiResult.ok) {
      const validatedAi = validateAIImportResult(aiResult.data, finalUrl.toString(), summary);
      warnings.push(...validatedAi.warnings);
      rejectedCandidates.push(...validatedAi.rejectedCandidates);
      duplicateProgramsRemoved += validatedAi.dedupedPrograms;
      const aiProposals = [
        ...(validatedAi.universityProposal ? [validatedAi.universityProposal] : []),
        ...validatedAi.programProposals,
      ];
      proposals = mergeProposals(proposals, aiProposals).slice(0, MAX_PROPOSALS);
      analysisMode = proposals.some((proposal) => proposal.sourceEngine === 'mixed')
        ? 'mixed'
        : aiProposals.length && proposals.length === aiProposals.length
          ? 'ai'
          : aiProposals.length
            ? 'mixed'
            : 'basic';

      console.info('[import-assistant] ai-analysis', {
        mode: analysisMode,
        sentChars: aiResult.sentChars,
        university: validatedAi.universityProposal?.nombre || null,
        programs: validatedAi.programProposals.length,
        rejected: validatedAi.rejectedCandidates.length,
        elapsedMs: Date.now() - aiStartedAt,
      });
    } else {
      warnings.push(aiResult.reason);
      console.warn('[import-assistant] ai-analysis-fallback', {
        sentChars: aiResult.sentChars,
        error: aiResult.error,
        elapsedMs: Date.now() - aiStartedAt,
      });
    }
  }

  const separated = prepareSeparatedProposals(proposals);
  proposals = separated.proposals;
  rejectedCandidates = [...rejectedCandidates, ...separated.rejectedCandidates];
  duplicateProgramsRemoved += separated.duplicateProgramsRemoved;

  proposals = await Promise.all(proposals.map((proposal) => attachDuplicates(proposal).then(suggestDynamicFields)));
  const universidadDetectada = proposals.find((proposal) => proposal.tipo === 'universidad') || null;
  const programasDetectados = proposals.filter((proposal) => proposal.tipo === 'programa');

  console.info('[import-assistant] analysis', {
    url: rootUrl.toString(),
    mode: analysisMode,
    university: universidadDetectada?.nombre || null,
    crawled: crawledUrls.length,
    programs: programasDetectados.length,
    duplicatesRemoved: duplicateProgramsRemoved,
    rejected: rejectedCandidates.length,
    warnings: warnings.length,
    warningSample: warnings.slice(0, 3),
    elapsedMs: Date.now() - start,
  });

  return {
    source: {
      requestedUrl: rootUrl.toString(),
      finalUrl: finalUrl.toString(),
      title: rootPage.title,
      description: rootPage.description,
      fuenteNombre: inferUniversityName(rootPage) || finalUrl.hostname,
    },
    crawledUrls,
    summary,
    analysisMode,
    warnings,
    universidadDetectada,
    programasDetectados,
    rejectedCandidates,
    proposals,
    legacy: {
      universidad: {
        nombre: universidadDetectada?.camposDetectados.nombre || '',
        descripcion: universidadDetectada?.camposDetectados.descripcion || '',
        ciudad: universidadDetectada?.camposDetectados.ciudad || '',
        sitio_web: finalUrl.origin,
      },
      programas: programasDetectados
        .map((proposal) => ({
          ...proposal.camposDetectados,
          fuente_url: proposal.fuenteUrl,
          evidencia: proposal.razones,
        })),
      fuentes: proposals.map((proposal) => ({
        field: proposal.tipo,
        label: proposal.nombre,
        url: proposal.fuenteUrl,
        evidence: proposal.razones.join(', '),
      })),
    },
  };
};

export const analyzeImportAssistantUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUrl = normalizeAssistantText(req.body.url);
    if (!rawUrl) throw new AppError('url es obligatoria', 400);

    const useAI = req.body.useAI === true;
    const page = await scrapePublicUrl(rawUrl);
    const basic = basicUniversityAnalyzer(page);
    let university = basic.university;
    let analysisMode: 'ai' | 'basic' = 'basic';
    const warnings = [...page.warnings, ...basic.warnings];
    const rejected: unknown[] = [...basic.rejected];

    if (useAI) {
      const aiResult = await aiUniversityAnalyzer(page);
      if (aiResult.ok) {
        university = aiResult.university;
        analysisMode = 'ai';
        warnings.push(...aiResult.warnings);
        rejected.push(...aiResult.rejected);
      } else {
        warnings.push(aiResult.reason);
      }
    }

    const validation = validateUniversityDraft(university);
    warnings.push(...validation.warnings);
    rejected.push(...validation.rejected);

    if (university.confidence < CONFIDENCE_REVIEW_THRESHOLD) {
      warnings.push('Confianza baja: revisa y confirma manualmente antes de guardar.');
    }

    console.info('[ImportAssistant][University] URL analizada', {
      url: page.finalUrl,
      nombre: university.nombre,
      confidence: university.confidence,
      rejected: rejected.length,
      warnings: warnings.slice(0, 4),
    });

    return res.json({
      success: true,
      data: {
        type: 'university',
        sourceUrl: page.finalUrl,
        analysisMode,
        university,
        warnings: [...new Set(warnings.filter(Boolean))],
        rejected,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.warn('[ImportAssistant][University] fallo', { message });
    return next(error);
  }
};

export const analyzeImportAssistantProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUrl = normalizeAssistantText(req.body.url);
    const universityId = normalizeAssistantText(req.body.universityId || req.body.universidadId);
    let universityName = normalizeAssistantText(req.body.universityName || req.body.universidadNombre);
    if (!rawUrl) throw new AppError('url es obligatoria', 400);
    if (!universityId || !isUuidValue(universityId)) throw new AppError('universityId valido es obligatorio', 400);

    if (!universityName) {
      const universityResult = await query('SELECT nombre FROM universidades WHERE id = $1 LIMIT 1', [universityId]);
      universityName = normalizeAssistantText(universityResult.rows[0]?.nombre);
      if (!universityName) throw new AppError('Universidad seleccionada no encontrada', 404);
    }

    const useAI = req.body.useAI === true;
    const page = await scrapePublicUrl(rawUrl);
    const basic = basicProgramAnalyzer(page, universityName);
    let program = basic.program;
    let analysisMode: 'ai' | 'basic' = 'basic';
    const warnings = [...page.warnings, ...basic.warnings];
    const rejected: unknown[] = [...basic.rejected];

    if (useAI) {
      const aiResult = await aiProgramAnalyzer(page, universityName);
      if (aiResult.ok) {
        program = aiResult.program;
        analysisMode = 'ai';
        warnings.push(...aiResult.warnings);
        rejected.push(...aiResult.rejected);
      } else {
        warnings.push(aiResult.reason);
      }
    }

    program = {
      ...program,
      nombre: program.nombre ? cleanProgramUniversityName(program.nombre, universityName) || null : null,
    };

    const validation = validateProgramDraft(program, universityName);
    warnings.push(...validation.warnings);
    rejected.push(...validation.rejected);

    const duplicateResult = program.nombre
      ? await findProgramDuplicates(program.nombre, universityId)
      : [];
    if (duplicateResult.length > 0) {
      warnings.push(`Posible duplicado: ${duplicateResult.map((item) => item.nombre).join(', ')}`);
      rejected.push({
        field: 'nombre',
        value: program.nombre,
        reason: 'Ya existe un programa con nombre similar para la universidad seleccionada',
      });
    }

    if (program.confidence < CONFIDENCE_REVIEW_THRESHOLD) {
      warnings.push('Confianza baja: revisa y confirma manualmente antes de guardar.');
    }

    console.info('[ImportAssistant][Program] URL analizada', {
      url: page.finalUrl,
      universidad: universityName,
      programa: program.nombre,
      confidence: program.confidence,
      rejected: rejected.length,
      warnings: warnings.slice(0, 4),
    });

    return res.json({
      success: true,
      data: {
        type: 'program',
        sourceUrl: page.finalUrl,
        universityId,
        universityName,
        analysisMode,
        program,
        warnings: [...new Set(warnings.filter(Boolean))],
        rejected,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.warn('[ImportAssistant][Program] fallo', { message });
    return next(error);
  }
};

export const analyzeImportAssistantUrl = async (req: Request, res: Response, next: NextFunction) => {
  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    const rawUrl = normalizeText(req.body.url);
    if (!rawUrl) throw new AppError('url es obligatoria', 400);
    const useAI = req.body.useAI === true;

    const analysis = await Promise.race([
      analyzeUrl(rawUrl, useAI),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new AppError('El analisis excedio el tiempo maximo permitido', 408)),
          TOTAL_ANALYSIS_TIMEOUT_MS
        );
      }),
    ]);

    return res.json({
      success: true,
      data: {
        ...analysis.legacy,
        source: analysis.source,
        crawledUrls: analysis.crawledUrls,
        summary: analysis.summary,
        analysisMode: analysis.analysisMode,
        warnings: analysis.warnings,
        universidadDetectada: analysis.universidadDetectada,
        programasDetectados: analysis.programasDetectados,
        rejectedCandidates: analysis.rejectedCandidates,
        proposals: analysis.proposals,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.warn('[import-assistant] blocked-or-failed', { message });
    return next(error);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);

const validateProposalForSave = async (proposal: ImportProposal) => {
  if (!['universidad', 'programa', 'beca'].includes(proposal.tipo)) {
    throw new AppError('Tipo de propuesta invalido', 400);
  }
  if (!normalizeText(proposal.nombre)) throw new AppError('nombre es obligatorio', 400);
  if (!normalizeText(proposal.fuenteUrl)) throw new AppError('fuenteUrl es obligatorio', 400);
  await assertSafeUrl(normalizeUrl(proposal.fuenteUrl));

  const duplicates = proposal.tipo === 'universidad'
    ? await findUniversityDuplicates(proposal.nombre)
    : proposal.tipo === 'programa'
      ? await findProgramDuplicates(proposal.nombre, normalizeText(proposal.camposDetectados.universidadId))
      : await findBecaDuplicates(proposal.nombre, normalizeText(proposal.camposDetectados.universidadId));

  if (duplicates.length > 0) {
    throw new AppError(`Posible duplicado: ${duplicates.map((item) => item.nombre).join(', ')}`, 409);
  }
};

const insertUniversityProposal = async (client: PoolClient, proposal: ImportProposal, userId: string) => {
  const nombre = normalizeText(proposal.camposDetectados.nombre) || proposal.nombre;
  const descripcion = normalizeText(proposal.camposDetectados.descripcion ?? proposal.descripcion);
  const ciudad = normalizeText(proposal.camposDetectados.ciudad);
  if (!nombre || !descripcion || !ciudad) throw new AppError('Universidad requiere nombre, descripcion y ciudad', 400);

  const result = await client.query(
    `INSERT INTO universidades (nombre, descripcion, ciudad, user_id, estado, fuente_url, fuente_nombre, fecha_importacion)
     VALUES ($1, $2, $3, $4, 'pendiente', $5, $6, NOW())
     RETURNING id`,
    [nombre, descripcion, ciudad, userId, proposal.fuenteUrl, proposal.fuenteNombre || proposal.nombre]
  );

  const dynamicFields = Array.isArray(proposal.camposDetectados.dynamicFields)
    ? proposal.camposDetectados.dynamicFields as DynamicFieldInput[]
    : [];
  if (dynamicFields.length) {
    await syncDynamicFieldValues(client, 'universidad', result.rows[0].id, dynamicFields, 'admin');
  }

  return result.rows[0].id as string;
};

const insertProgramProposal = async (client: PoolClient, proposal: ImportProposal, userId: string) => {
  const universidadId = normalizeText(proposal.camposDetectados.universidadId);
  if (!universidadId || !isUuid(universidadId)) throw new AppError('Programa requiere universidadId valido', 400);

  const nombre = normalizeText(proposal.camposDetectados.nombre) || proposal.nombre;
  const descripcion = normalizeText(proposal.camposDetectados.descripcion ?? proposal.descripcion);
  const modalidad = normalizeText(proposal.camposDetectados.modalidad);
  const duracion = normalizeText(proposal.camposDetectados.duracion);
  const precio = Number(proposal.camposDetectados.precio || 0);
  if (!nombre || !descripcion || !modalidad || !duracion) {
    throw new AppError('Programa requiere nombre, descripcion, modalidad y duracion', 400);
  }
  if (!Number.isFinite(precio) || precio < 0) throw new AppError('precio invalido', 400);

  const result = await client.query(
    `INSERT INTO programas (
       nombre, descripcion, precio, modalidad, duracion, universidad_id, creado_por,
       estado, fuente_url, fuente_nombre, fecha_importacion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8, $9, NOW())
     RETURNING id, estado`,
    [nombre, descripcion, precio, modalidad, duracion, universidadId, userId, proposal.fuenteUrl, proposal.fuenteNombre || proposal.nombre]
  );

  await client.query(
    `INSERT INTO program_moderation_history (
       programa_id, estado_anterior, estado_nuevo, motivo, moderado_por, actor_rol, accion
     )
     VALUES ($1, NULL, 'pendiente', NULL, $2, 'IMPORT_ASSISTANT', 'creado')`,
    [result.rows[0].id, userId]
  );

  const dynamicFields = Array.isArray(proposal.camposDetectados.dynamicFields)
    ? proposal.camposDetectados.dynamicFields as DynamicFieldInput[]
    : [];
  if (dynamicFields.length) {
    await syncDynamicFieldValues(client, 'programa', result.rows[0].id, dynamicFields, 'admin');
  }

  return result.rows[0].id as string;
};

const insertBecaProposal = async (client: PoolClient, proposal: ImportProposal, userId: string) => {
  const nombre = normalizeText(proposal.camposDetectados.nombre) || proposal.nombre;
  const descripcion = normalizeText(proposal.camposDetectados.descripcion ?? proposal.descripcion);
  if (!nombre || !descripcion) throw new AppError('Beca requiere nombre y descripcion', 400);

  const universidadId = normalizeText(proposal.camposDetectados.universidadId) || null;
  if (universidadId && !isUuid(universidadId)) throw new AppError('universidadId invalido', 400);

  const result = await client.query(
    `INSERT INTO becas (
       universidad_id, nombre, descripcion, requisitos, beneficios, porcentaje_cobertura,
       monto, moneda, fecha_inicio, fecha_cierre, enlace, estado, creado_por,
       fuente_url, fuente_nombre, fecha_importacion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'COP'), $9, $10, $11, 'pendiente', $12, $13, $14, NOW())
     RETURNING id`,
    [
      universidadId,
      nombre,
      descripcion,
      normalizeText(proposal.camposDetectados.requisitos) || null,
      normalizeText(proposal.camposDetectados.beneficios) || null,
      proposal.camposDetectados.porcentajeCobertura || null,
      proposal.camposDetectados.monto || null,
      normalizeText(proposal.camposDetectados.moneda) || 'COP',
      parseDateOrNull(proposal.camposDetectados.fechaInicio),
      parseDateOrNull(proposal.camposDetectados.fechaCierre),
      normalizeText(proposal.camposDetectados.enlace) || proposal.fuenteUrl,
      userId,
      proposal.fuenteUrl,
      proposal.fuenteNombre || proposal.nombre,
    ]
  );

  await client.query(
    `INSERT INTO beca_moderation_history (
       beca_id, estado_anterior, estado_nuevo, motivo, moderado_por, actor_rol, accion
     )
     VALUES ($1, NULL, 'pendiente', NULL, $2, 'IMPORT_ASSISTANT', 'creado')`,
    [result.rows[0].id, userId]
  );

  return result.rows[0].id as string;
};

const saveOneProposal = async (proposal: ImportProposal, index: number, userId: string): Promise<SaveResult> => {
  if (proposal.discarded || proposal.selected === false) {
    return { index, tipo: proposal.tipo, status: 'skipped', reason: 'Propuesta descartada' };
  }

  const client = await pool.connect();
  try {
    await validateProposalForSave(proposal);
    await client.query('BEGIN');
    const id = proposal.tipo === 'universidad'
      ? await insertUniversityProposal(client, proposal, userId)
      : proposal.tipo === 'programa'
        ? await insertProgramProposal(client, proposal, userId)
        : await insertBecaProposal(client, proposal, userId);
    await client.query('COMMIT');
    return { index, tipo: proposal.tipo, status: 'created', id };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    return {
      index,
      tipo: proposal.tipo,
      status: 'failed',
      reason: error instanceof Error ? error.message : 'No se pudo guardar la propuesta',
    };
  } finally {
    client.release();
  }
};

export const saveImportAssistantProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const proposals = Array.isArray(req.body.proposals) ? req.body.proposals as ImportProposal[] : [];
    if (!proposals.length) throw new AppError('proposals es obligatorio', 400);
    if (proposals.length > MAX_PROPOSALS) throw new AppError('Demasiadas propuestas en un lote', 400);

    const results: SaveResult[] = [];
    for (const [index, proposal] of proposals.entries()) {
      results.push(await saveOneProposal(proposal, index, req.user.id));
    }

    return res.json({
      success: true,
      data: results,
      results,
    });
  } catch (error) {
    return next(error);
  }
};
