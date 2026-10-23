# QA - Asistente de Carga

## Alcance

El asistente analiza HTML publico, genera propuestas revisables y no publica automaticamente. El guardado se procesa por lote y devuelve resultado por item.

## Casos

1. **URL valida de universidad**
   - Enviar `POST /api/import-assistant/analyze` con una URL publica HTML.
   - Esperado: respuesta con `source`, `crawledUrls`, `summary` y `proposals`.

2. **localhost bloqueado**
   - Analizar `http://localhost:3000`.
   - Esperado: error 400 por politica de seguridad.

3. **IP privada bloqueada**
   - Analizar `http://192.168.1.1` o `http://10.0.0.1`.
   - Esperado: error 400 por politica de seguridad.

4. **Contenido no HTML rechazado**
   - Analizar una URL directa a PDF/imagen.
   - Esperado: error indicando que no es HTML analizable.

5. **Redirecciones excesivas**
   - Probar una URL con cadena larga o circular de redirects.
   - Esperado: bloqueo antes de seguir indefinidamente.

6. **Enlaces duplicados ignorados**
   - Analizar una pagina con enlaces repetidos a programas.
   - Esperado: `crawledUrls` sin duplicados.

7. **Enlaces externos ignorados en crawling**
   - Analizar pagina con redes sociales y dominios externos.
   - Esperado: no aparecen como paginas rastreadas internas.

8. **Propuestas con confidence**
   - Revisar cada item de `proposals`.
   - Esperado: `confidence` numerico entre 0 y 1, `razones` y `advertencias`.

9. **Duplicados potenciales**
   - Analizar o guardar propuesta con nombre ya existente.
   - Esperado: `posibleDuplicado=true` en analisis o item `failed`/409 en guardado.

10. **Trazabilidad de fuente**
    - Guardar propuesta valida.
    - Esperado: registro creado con `fuente_url`, `fuente_nombre`, `fecha_importacion`.

11. **USER no accede**
    - Enviar analyze/save con token USER.
    - Esperado: 403.

12. **UNIVERSITY no accede**
    - Enviar analyze/save con token UNIVERSITY.
    - Esperado: 403.

13. **ADMIN analiza**
    - Enviar analyze con token ADMIN.
    - Esperado: 200.

14. **ASESOR analiza**
    - Enviar analyze con token ASESOR.
    - Esperado: 200.

15. **SUPERADMIN analiza**
    - Enviar analyze con token SUPERADMIN.
    - Esperado: 200.

16. **Fallo parcial de lote**
    - Guardar lote con una propuesta valida y otra incompleta.
    - Esperado: respuesta con un item `created` y otro `failed`, sin 500.

17. **Builds**
    - Backend: `npm run build`
    - Frontend: `npm run build` y `npm run build-only`
    - Esperado: todos pasan.

## Utilidades Puras a Revisar Manualmente

- Normalizacion y bloqueo de URL: `normalizeUrl`, `assertSafeUrl`.
- Bloqueo de IP privada: `isPrivateIpv4`, `isBlockedIp`.
- Extraccion de enlaces internos: `extractLinks`.
- Normalizacion de nombres: `normalizeName`.
- Scoring: `calculateConfidence`.
