-- Trazabilidad para registros creados desde asistentes/importaciones.
-- Seguro para ejecutar varias veces: solo agrega columnas si no existen.
ALTER TABLE universidades
  ADD COLUMN IF NOT EXISTS fuente_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS fuente_nombre TEXT NULL,
  ADD COLUMN IF NOT EXISTS fecha_importacion TIMESTAMP NULL;

ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS fuente_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS fuente_nombre TEXT NULL,
  ADD COLUMN IF NOT EXISTS fecha_importacion TIMESTAMP NULL;

-- DIAGNOSTICO OBLIGATORIO ANTES DE INDICE UNICO
-- 1. Ejecutar primero este SELECT.
-- 2. Si retorna filas, hay duplicados y NO se debe activar el indice unico.
-- 3. Limpiar o fusionar datos duplicados manualmente.
-- 4. Solo si no retorna filas, activar el indice unico comentado al final.
SELECT
  LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g')) AS nombre_normalizado,
  COUNT(*) AS total,
  ARRAY_AGG(id ORDER BY creado_en) AS universidad_ids
FROM universidades
GROUP BY LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g'))
HAVING COUNT(*) > 1;

-- INDICE UNICO OPCIONAL
-- Mantener comentado mientras existan duplicados. Activar solo despues de que
-- el diagnostico anterior retorne 0 filas.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_universidades_nombre_normalizado_unique
--   ON universidades (LOWER(REGEXP_REPLACE(TRIM(nombre), '\s+', ' ', 'g')));
