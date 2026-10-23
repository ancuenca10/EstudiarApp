import { normalizeText, stripHtml } from './importAssistantValidators';

export const normalizeImportText = (html: string): string =>
  normalizeText(
    stripHtml(
      html
        .replace(/<(nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    )
  );

export const extractTitle = (html: string): string => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeText(stripHtml(match[1])) : '';
};

export const extractHeadings = (html: string): string[] => {
  const headings: string[] = [];
  for (const match of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
    const value = normalizeText(stripHtml(match[1]));
    if (value && value.length <= 180) headings.push(value);
  }
  return [...new Set(headings)].slice(0, 40);
};

export const extractMetaDescription = (html: string): string => {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  return match ? normalizeText(match[1]) : '';
};
