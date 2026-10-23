-- Indice unico para evitar universidades duplicadas por nombre normalizado.
-- Ejecutar solo despues de confirmar que el diagnostico de duplicados retorna 0 filas:
--
-- SELECT LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g')) AS nombre_normalizado,
--        COUNT(*) AS total
-- FROM universidades
-- GROUP BY LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g'))
-- HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_universidades_nombre_normalizado_unique
  ON universidades (LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g')));
