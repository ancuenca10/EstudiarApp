# QA - Parametrización de Formularios Dinámicos

## Casos de Prueba

### 1. SUPERADMIN crea campo texto para universidad
**Pasos:**
1. Iniciar sesión como SUPERADMIN
2. Navegar a Admin > Parametrización
3. Seleccionar módulo "Universidades"
4. Click en "Crear campo"
5. Completar:
   - Etiqueta: "Teléfono de contacto"
   - Tipo: "Texto corto"
   - Requerido: true
6. Guardar

**Esperado:** Campo creado exitosamente, aparece en la lista

---

### 2. SUPERADMIN crea select con opciones
**Pasos:**
1. Navegar a Parametrización > Programas
2. Click en "Crear campo"
3. Completar:
   - Etiqueta: "Nivel académico"
   - Tipo: "Lista desplegable"
   - Opciones: ["Licenciatura", "Maestría", "Doctorado"]
4. Guardar

**Esperado:** Campo creado con opciones, se guarda como array de objetos {label, value}

---

### 3. SUPERADMIN intenta crear select sin opciones y falla
**Pasos:**
1. Navegar a Parametrización > Universidad
2. Click en "Crear campo"
3. Completar:
   - Etiqueta: "Tipo de universidad"
   - Tipo: "Lista desplegable"
   - Opciones: (vacío)
4. Intentar guardar

**Esperado:** Error 400 "opciones es obligatorio para campos select"

---

### 4. SUPERADMIN intenta duplicar name en mismo módulo y falla
**Pasos:**
1. Crear campo "Ciudad" en módulo Universidad
2. Intentar crear otro campo con nombre interno "ciudad"

**Esperado:** Error 400 "Ya existe un campo con nombre interno 'ciudad' en el módulo universidad"

---

### 5. Puede existir mismo name en módulo distinto
**Pasos:**
1. Crear campo "Ciudad" en Universidad
2. Crear campo "Ciudad" en Programa

**Esperado:** Ambos se crean correctamente (el unique constraint es por módulo)

---

### 6. Campo requerido obliga valor al crear universidad
**Pasos:**
1. Crear campo "Teléfono" como requerido
2. Intentar crear universidad sin completar el campo dinámico

**Esperado:** Error indicando que el campo es obligatorio

---

### 7. Campo inactivo no aparece en formulario
**Pasos:**
1. Crear campo "Campo prueba"
2. Desactivar el campo
3. Ir a crear universidad

**Esperado:** El campo no aparece en el formulario de creación

---

### 8. Campo visible_in_card aparece en tarjeta
**Pasos:**
1. Crear campo "Acreditación" con visible_in_card = true
2. Crear una universidad con ese campo
3. Ver la lista de universidades

**Esperado:** El campo aparece en la tarjeta de la universidad

---

### 9. Campo visible_in_detail aparece en detalle
**Pasos:**
1. Crear campo con visible_in_detail = true
2. Crear entidad con ese campo
3. Ver el detalle de la entidad

**Esperado:** El campo aparece en la vista de detalle

---

### 10. Campo editable_by_university=false no aparece en panel UNIVERSITY
**Pasos:**
1. Crear campo con editable_by_university = false
2. Iniciar sesión como UNIVERSITY
3. Ir a editar perfil

**Esperado:** El campo no aparece en el formulario de edición

---

### 11. Campo searchable=true aparece en resultados de búsqueda
**Pasos:**
1. Crear campo "Acreditación" con searchable = true
2. Crear universidades con valores en ese campo
3. Realizar búsqueda global

**Esperado:** Los valores de ese campo se incluyen en la búsqueda

---

### 12. Campo filterable=true aparece como filtro
**Pasos:**
1. Crear campo "Ciudad" con filterable = true
2. Ir a lista de universidades

**Esperado:** Aparece filtro por ese campo en la barra de filtros

---

### 13. Valores dinámicos existentes no se pierden
**Pasos:**
1. Tener universidades con campos dinámicos
2. Ejecutar migración de nuevas columnas
3. Verificar que los valores persisten

**Esperado:** Todos los valores existentes se mantienen

---

### 14. Build backend pasa
**Pasos:**
```bash
cd backend
npm run build
```

**Esperado:** Compilación sin errores

---

### 15. Build frontend pasa
**Pasos:**
```bash
cd frontend
npm run build
```

**Esperado:** Compilación sin errores

---

## Casos de Prueba Adicionales

### 16. Validación de tipos de campo
**Pasos:**
1. Intentar crear campo con tipo no válido

**Esperado:** Error de validación

### 17. Validación de módulos
**Pasos:**
1. Intentar crear campo con módulo no válido

**Esperado:** Error de validación

### 18. Soft-delete al eliminar campo con valores
**Pasos:**
1. Eliminar campo que tiene valores asociados

**Esperado:** Se hace soft-delete (activo = false) en lugar de eliminar

### 19. Reordenar campos
**Pasos:**
1. Cambiar el orden de varios campos
2. Guardar

**Esperado:** Los campos aparecen en el nuevo orden

### 20. Normalización automática de nombre interno
**Pasos:**
1. Ingresar etiqueta con espacios y tildes
2. Click en botón de normalizar

**Esperado:** El nombre interno se convierte a snake_case sin tildes
### 21. Backend valida tipos avanzados
**Pasos:**
1. Crear campo porcentaje requerido con min=0 y max=100
2. Intentar guardar una entidad con valor 150
3. Intentar guardar una entidad con valor 80

**Esperado:** El valor 150 falla en backend; el valor 80 se guarda correctamente.

### 22. Multi-select usa value_json
**Pasos:**
1. Crear campo multi_select con dos opciones
2. Guardar una entidad seleccionando ambas opciones
3. Consultar la entidad

**Esperado:** Los valores se guardan en value_json y se devuelven como arreglo.

### 23. Permisos UNIVERSITY
**Pasos:**
1. Crear campo de programa con editable_by_university=false
2. Iniciar sesion como UNIVERSITY
3. Intentar enviarlo manualmente en dynamicFields

**Esperado:** El backend responde 403 y no modifica el valor.
