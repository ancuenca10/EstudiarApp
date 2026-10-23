# QA Import Assistant AI

Objetivo: validar que la IA actua como copiloto de analisis y nunca como publicador automatico.

## Casos

1. Analyze con `useAI=false` usa modo `basic` y devuelve propuestas sin llamar a OpenAI.
2. Analyze con `useAI=true` y `OPENAI_API_KEY` configurada usa IA o modo `mixed`.
3. Analyze con `useAI=true` sin `OPENAI_API_KEY` usa `basic` y advierte que la IA no esta configurada.
4. Las propuestas IA incluyen `confidence`, `razones`, `advertencias`, `camposFaltantes`, `fuenteUrl` y `sourceEngine`.
5. Si OpenAI falla, el endpoint responde con analisis basico y una advertencia, sin caer en 500.
6. `POST /api/import-assistant/analyze` no crea universidades, programas ni becas.
7. En frontend, las propuestas pueden editarse, descartarse y seleccionarse antes de guardar.
8. `POST /api/import-assistant/save` revalida tipo, nombre, fuente, duplicados y campos minimos en backend.
9. Un usuario `USER` no puede usar los endpoints del asistente.
10. Un usuario `UNIVERSITY` no puede usar los endpoints del asistente admin.
11. Una URL privada, localhost o IP interna se bloquea antes de cualquier llamada IA.
12. Los duplicados potenciales se muestran como advertencia y no bloquean el analisis.
13. `npm run build` en backend pasa correctamente.
14. `npm run build` y `npm run build-only` en frontend pasan correctamente.

## Notas de seguridad

- La API key solo se lee desde backend mediante variables de entorno.
- El texto enviado a IA esta limitado y proviene de HTML limpio, no de HTML completo.
- El guardado sigue siendo manual y cada item reporta `created`, `skipped` o `failed`.
