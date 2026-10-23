import { lookup } from 'dns/promises';
import net from 'net';
import { AppError } from '../../middleware/errorHandler';
import { extractHeadings, extractMetaDescription, extractTitle, normalizeImportText } from './normalizeImportText';
import { normalizeText } from './importAssistantValidators';

export type ScrapedPage = {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: Array<{ label: string; url: string }>;
  warnings: string[];
};

const USER_AGENT = 'EstudiarAppImportAssistant/3.0';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1_500_000;

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
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
};

const isBlockedIp = (ip: string) => {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) return ip === '::1' || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd') || ip.toLowerCase().startsWith('fe80:');
  return false;
};

const assertSafeUrl = async (url: URL) => {
  const host = url.hostname.toLowerCase();
  if (['localhost', '0.0.0.0', '127.0.0.1', '::1', '[::1]'].includes(host)) {
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
  if (contentLength > MAX_HTML_BYTES) throw new AppError('La pagina excede el tamano maximo permitido', 400);
  const text = await response.text();
  if (Buffer.byteLength(text) > MAX_HTML_BYTES) throw new AppError('La pagina excede el tamano maximo permitido', 400);
  return text;
};

const isHtmlResponse = (contentType: string, html: string) => {
  if (/text\/html|application\/xhtml\+xml/i.test(contentType)) return true;
  return /<!doctype html|<html[\s>]/i.test(html.slice(0, 800));
};

const fetchWithFriendlyErrors = async (url: URL, signal: AbortSignal) => {
  try {
    return await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
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

const extractLinks = (html: string, baseUrl: URL) => {
  const links = new Map<string, { label: string; url: string }>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = normalizeText(match[1]);
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript|data|file|ftp):/i.test(href)) continue;
    try {
      const url = new URL(href, baseUrl);
      url.hash = '';
      if (url.hostname !== baseUrl.hostname) continue;
      const label = normalizeImportText(match[2]).slice(0, 140) || url.pathname;
      links.set(url.toString(), { label, url: url.toString() });
    } catch {
      continue;
    }
  }
  return Array.from(links.values()).slice(0, 25);
};

export const scrapePublicUrl = async (rawUrl: string): Promise<ScrapedPage> => {
  const requestedUrl = normalizeUrl(rawUrl);
  let currentUrl = requestedUrl;
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
      if (!response.ok) throw new AppError(`No se pudo descargar la URL indicada (${response.status})`, 400);
      const contentType = response.headers.get('content-type') || '';
      const html = await readLimitedText(response);
      if (!isHtmlResponse(contentType, html)) {
        throw new AppError('La URL no devolvio una pagina HTML analizable', 400);
      }

      return {
        requestedUrl: requestedUrl.toString(),
        finalUrl: currentUrl.toString(),
        title: extractTitle(html),
        description: extractMetaDescription(html),
        headings: extractHeadings(html),
        text: normalizeImportText(html).slice(0, 80_000),
        links: extractLinks(html, currentUrl),
        warnings: [],
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError('Redirecciones excesivas bloqueadas', 400);
};
