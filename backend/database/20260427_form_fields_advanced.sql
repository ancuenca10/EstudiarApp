-- ==============================================================================
-- Migración: 20260427_form_fields_advanced.sql
-- Objetivo: Ampliar form_fields con campos avanzados para parametrización
-- ==============================================================================
-- IMPORTANTE: Esta migración usa ADD COLUMN IF NOT EXISTS para no romper
-- datos existentes. Se ejecuta de forma segura en bases con datos.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. Agregar columna module si no existe (normalizar de modulo)
-- ==============================================================================
DO $$
BEGIN
    -- Verificar si existe la columna modulo (nombre actual)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'modulo'
    ) THEN
        -- Si no existe modulo, crear la tabla desde cero con la nueva estructura
        RAISE NOTICE 'La tabla form_fields no tiene columna modulo. Verificar estructura.';
    ELSE
        -- La columna modulo ya existe, asegurarnos que tiene los valores correctos
        UPDATE form_fields SET modulo = LOWER(TRIM(modulo));
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al verificar columna modulo: %', SQLERRM;
END $$;

-- ==============================================================================
-- 2. Agregar módulo 'beca' al CHECK constraint si es posible
-- ==============================================================================
-- Primero verificamos si el constraint existe y lo recreamos
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'form_fields_modulo_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Eliminar constraint existente y crear nuevo con 'beca'
        ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_modulo_check;
        ALTER TABLE form_fields ADD CONSTRAINT form_fields_modulo_check 
            CHECK (modulo IN ('universidad', 'programa', 'beca'));
        RAISE NOTICE 'Constraint modulo actualizado para incluir beca';
    END IF;
END $$;

-- ==============================================================================
-- 3. Agregar tipos de campo adicionales al CHECK constraint
-- ==============================================================================
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'form_fields_tipo_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_tipo_check;
        ALTER TABLE form_fields ADD CONSTRAINT form_fields_tipo_check 
            CHECK (tipo IN (
                'text', 'textarea', 'number', 'select', 'multi_select', 
                'checkbox', 'date', 'url', 'email', 'phone', 
                'currency', 'percentage'
            ));
        RAISE NOTICE 'Constraint tipo actualizado con nuevos tipos';
    END IF;
END $$;

-- ==============================================================================
-- 4. Agregar columnas nuevas si no existen
-- ==============================================================================

-- options: ya existe como JSONB, pero normalizamos estructura
-- validation_rules: JSONB para validaciones dinámicas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'validation_rules'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS validation_rules JSONB NULL;
        RAISE NOTICE 'Columna validation_rules agregada';
    END IF;
END $$;

-- default_value: valor por defecto para nuevos registros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'default_value'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS default_value TEXT NULL;
        RAISE NOTICE 'Columna default_value agregada';
    END IF;
END $$;

-- visible_in_card: mostrar en tarjetas de lista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'visible_in_card'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS visible_in_card BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Columna visible_in_card agregada';
    END IF;
END $$;

-- visible_in_detail: mostrar en vista de detalle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'visible_in_detail'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS visible_in_detail BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Columna visible_in_detail agregada';
    END IF;
END $$;

-- searchable: incluir en búsqueda global
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'searchable'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS searchable BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Columna searchable agregada';
    END IF;
END $$;

-- filterable: usar como filtro en frontend
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'filterable'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS filterable BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Columna filterable agregada';
    END IF;
END $$;

-- editable_by_university: si UNIVERSITY puede editar este campo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'editable_by_university'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS editable_by_university BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Columna editable_by_university agregada';
    END IF;
END $$;

-- editable_by_admin: si ADMIN puede editar este campo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'editable_by_admin'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS editable_by_admin BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Columna editable_by_admin agregada';
    END IF;
END $$;

-- created_by: UUID del usuario que creó el campo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS created_by UUID NULL;
        RAISE NOTICE 'Columna created_by agregada';
    END IF;
END $$;

-- updated_by: UUID del usuario que actualizó el campo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_fields' AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
        RAISE NOTICE 'Columna updated_by agregada';
    END IF;
END $$;

-- ==============================================================================
-- 5. Crear tabla beca_field_values si no existe
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'beca_field_values'
    ) THEN
        CREATE TABLE IF NOT EXISTS beca_field_values (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            beca_id UUID NOT NULL,
            field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
            valor TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT beca_field_values_unique UNIQUE (beca_id, field_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_beca_field_values_beca ON beca_field_values(beca_id);
        CREATE INDEX IF NOT EXISTS idx_beca_field_values_field ON beca_field_values(field_id);
        
        RAISE NOTICE 'Tabla beca_field_values creada';
    ELSE
        RAISE NOTICE 'Tabla beca_field_values ya existe';
    END IF;
END $$;

-- ==============================================================================
-- 5.1. Preparar value_json para valores complejos sin perder valor legacy
-- ==============================================================================
ALTER TABLE university_field_values ADD COLUMN IF NOT EXISTS value_json JSONB NULL;
ALTER TABLE program_field_values ADD COLUMN IF NOT EXISTS value_json JSONB NULL;
ALTER TABLE beca_field_values ADD COLUMN IF NOT EXISTS value_json JSONB NULL;

CREATE INDEX IF NOT EXISTS idx_university_field_values_field ON university_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_program_field_values_field ON program_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_beca_field_values_field ON beca_field_values(field_id);

-- ==============================================================================
-- 5.2. Auditoria de usuarios creadores/editores sin forzar datos existentes
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
    ) THEN
        ALTER TABLE form_fields
            ADD CONSTRAINT form_fields_created_by_fk
            FOREIGN KEY (created_by) REFERENCES users(id) NOT VALID;
        ALTER TABLE form_fields
            ADD CONSTRAINT form_fields_updated_by_fk
            FOREIGN KEY (updated_by) REFERENCES users(id) NOT VALID;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'FKs created_by/updated_by ya existen';
    WHEN OTHERS THEN
        RAISE WARNING 'No se pudieron crear FKs de auditoria: %', SQLERRM;
END $$;

-- ==============================================================================
-- 6. Agregar índices para nuevas columnas
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_form_fields_visible_card ON form_fields(modulo, visible_in_card) WHERE visible_in_card = true;
CREATE INDEX IF NOT EXISTS idx_form_fields_searchable ON form_fields(modulo, searchable) WHERE searchable = true;
CREATE INDEX IF NOT EXISTS idx_form_fields_filterable ON form_fields(modulo, filterable) WHERE filterable = true;

-- ==============================================================================
-- 7. Normalizar opciones de select existentes
-- ==============================================================================
-- Las opciones actuales son arrays de strings, las convertimos a objetos {label, value}
DO $$
DECLARE
    row_record RECORD;
BEGIN
    FOR row_record IN 
        SELECT id, opciones 
        FROM form_fields 
        WHERE tipo = 'select' 
          AND opciones IS NOT NULL 
          AND jsonb_typeof(opciones) = 'array'
    LOOP
        -- Verificar si las opciones son strings simples u objetos
        IF jsonb_typeof(row_record.opciones->0) = 'string' THEN
            -- Convertir array de strings a array de objetos {label, value}
            UPDATE form_fields 
            SET opciones = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'label', elem::text,
                        'value', LOWER(REPLACE(elem::text, ' ', '_'))
                    )
                )
                FROM jsonb_array_elements_text(row_record.opciones) AS elem
            )
            WHERE id = row_record.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Opciones de select normalizadas a formato {label, value}';
END $$;

COMMIT;

-- Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_fields' 
ORDER BY ordinal_position;
