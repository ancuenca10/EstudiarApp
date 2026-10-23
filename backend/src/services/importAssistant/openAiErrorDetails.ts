const safeErrorText = (value: string) =>
  value
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);

export const openAiUnavailableReason = async (response: Response) => {
  const detail = safeErrorText(await response.text().catch(() => ''));

  if (response.status === 401) {
    return `IA no disponible (401): revisa la OPENAI_API_KEY. Se uso analisis basico.`;
  }

  if (response.status === 403) {
    return `IA no disponible (403): la API key no tiene permisos para este modelo o proyecto. Se uso analisis basico.`;
  }

  if (response.status === 404) {
    return `IA no disponible (404): revisa el modelo configurado. Se uso analisis basico.`;
  }

  if (response.status === 429) {
    return `IA no disponible (429): limite de uso, cuota o rate limit alcanzado. Se uso analisis basico.`;
  }

  if (response.status >= 500) {
    return `IA no disponible (${response.status}): OpenAI respondio con error temporal. Se uso analisis basico.`;
  }

  return `IA no disponible (${response.status})${detail ? `: ${detail}` : ''}. Se uso analisis basico.`;
};

export const openAiFailureReason = (error: unknown) => {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'IA no respondio a tiempo: timeout del analisis. Se uso analisis basico.';
  }

  const message = error instanceof Error ? safeErrorText(error.message) : '';
  return `IA fallo durante el analisis${message ? `: ${message}` : ''}. Se uso analisis basico.`;
};
