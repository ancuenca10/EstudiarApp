# QA University Panel

Checklist de pruebas reales para el panel UNIVERSITY y moderacion de programas.

## Preparacion

1. Ejecutar migraciones SQL no destructivas:
   - `backend/database/20260427_university_safety_and_sources.sql`
   - `backend/database/20260427_program_rejection_feedback.sql`
   - `backend/database/20260427_program_audit_fields.sql`
2. Crear o identificar un usuario con rol `UNIVERSITY`.
3. Asociar una universidad a ese usuario desde el panel admin o por SQL:
   `universidades.user_id = users.id`.
4. Iniciar sesion con roles `UNIVERSITY`, `ADMIN`, `ASESOR` y `SUPERADMIN` para validar permisos.

## UNIVERSITY

### Crear programa propio

Endpoint:

```http
POST /api/university-panel/programas
Authorization: Bearer <UNIVERSITY_TOKEN>
Content-Type: application/json

{
  "nombre": "Programa QA",
  "descripcion": "Descripcion de prueba",
  "precio": 0,
  "modalidad": "Presencial",
  "duracion": "10 semestres"
}
```

Esperado:
- `201`
- `estado = "pendiente"`
- `creadoPor` coincide con el usuario UNIVERSITY autenticado.
- El backend ignora cualquier `universidadId` enviado por el frontend.

### Editar programa propio

Endpoint:

```http
PUT /api/university-panel/programas/<programa_propio_id>
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- `estado = "pendiente"`
- Si estaba `rechazado`, limpia `rechazoMotivo`, `fechaRechazo` y `rechazado_por`.
- Si estaba `aprobado`, limpia `aprobado_por` y `fecha_aprobacion`.
- Actualiza `actualizado_por` y `fecha_actualizacion`.

### Eliminar programa propio

Endpoint:

```http
DELETE /api/university-panel/programas/<programa_propio_id>
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- El programa se elimina si no hay restricciones relacionadas.

### Intentar editar programa ajeno

Endpoint:

```http
PUT /api/university-panel/programas/<programa_ajeno_id>
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `403`
- Mensaje de permisos.

### Intentar eliminar programa ajeno

Endpoint:

```http
DELETE /api/university-panel/programas/<programa_ajeno_id>
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `403`
- Mensaje de permisos.

### Intentar aprobar o rechazar

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <UNIVERSITY_TOKEN>

{
  "estado": "aprobado"
}
```

Esperado:
- `403`
- `UNIVERSITY` no puede aprobar ni rechazar.

## ADMIN / ASESOR / SUPERADMIN

### Asociar universidad con selector

Vista:
- `/admin/universidades`

Esperado:
- El selector lista solo usuarios con rol `UNIVERSITY`.
- Al guardar, se envia `userId`.
- Si el usuario no existe o no tiene rol `UNIVERSITY`, backend responde `400`.

### Aprobar programa

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "aprobado"
}
```

Esperado:
- `200`
- `estado = "aprobado"`
- `aprobadoPor` se guarda.
- `fechaAprobacion` se guarda.
- Se limpian datos de rechazo.

### Rechazar sin motivo

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "rechazado"
}
```

Esperado:
- `400`
- Mensaje: `rechazo_motivo es obligatorio al rechazar un programa`.

### Rechazar con motivo

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "rechazado",
  "rechazoMotivo": "Falta informacion de duracion y modalidad."
}
```

Esperado:
- `200`
- `estado = "rechazado"`
- `rechazoMotivo` visible para UNIVERSITY en su panel.
- `fechaRechazo` visible para UNIVERSITY.
- `rechazado_por` no se muestra en frontend.

## Permisos Esperados

- `UNIVERSITY` solo usa `/api/university-panel`.
- `UNIVERSITY` no puede crear programas por `/api/programas`.
- `UNIVERSITY` no puede crear, editar ni eliminar universidades.
- `UNIVERSITY` no puede acceder a gestion de usuarios.
- `ADMIN`, `ASESOR` y `SUPERADMIN` pueden aprobar/rechazar programas.
- Escritura de parametrizacion: solo `SUPERADMIN`.
- Lectura de parametrizacion: `UNIVERSITY`, `ASESOR`, `ADMIN`, `SUPERADMIN`.

## Historial de moderacion de programas

Antes de probar, ejecutar:

```sql
\i backend/database/20260427_program_moderation_history.sql
```

### Crear programa como UNIVERSITY genera historial

1. Crear un programa con `POST /api/university-panel/programas`.
2. Consultar:

```http
GET /api/programas/<programa_propio_id>/moderation-history
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- Primer registro con `accion = "creado"`.
- `estadoAnterior = null`.
- `estadoNuevo = "pendiente"`.

### Editar programa pendiente genera historial actualizado

1. Editar un programa pendiente con `PUT /api/university-panel/programas/<programa_id>`.
2. Consultar historial.

Esperado:
- Nuevo registro con `accion = "actualizado"`.
- `estadoAnterior = "pendiente"`.
- `estadoNuevo = "pendiente"`.

### Editar programa rechazado genera reenviado_revision

1. Rechazar un programa con motivo.
2. Editarlo como `UNIVERSITY`.
3. Consultar historial.

Esperado:
- Nuevo registro con `accion = "reenviado_revision"`.
- `estadoAnterior = "rechazado"`.
- `estadoNuevo = "pendiente"`.
- El programa limpia `rechazoMotivo` y `fechaRechazo`.

### Aprobar programa genera historial

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "aprobado"
}
```

Esperado:
- Nuevo registro con `accion = "aprobado"`.
- `estadoNuevo = "aprobado"`.
- `motivo = null`.

### Rechazar programa con motivo genera historial

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "rechazado",
  "rechazoMotivo": "Falta informacion verificable."
}
```

Esperado:
- Nuevo registro con `accion = "rechazado"`.
- `estadoNuevo = "rechazado"`.
- `motivo` contiene la razon enviada.
- El motivo tambien queda visible en el panel `UNIVERSITY`.

### Seguridad del historial

- `UNIVERSITY` consulta historial de programa propio: `200`.
- `UNIVERSITY` consulta historial de programa ajeno: `403`.
- `USER` consulta historial: `403`.
- `ADMIN` consulta historial de cualquier programa: `200`.
- La respuesta no expone nombre ni email del moderador.

## Notificaciones internas

Antes de probar, ejecutar:

```sql
\i backend/database/20260427_notifications.sql
```

### Aprobar programa crea notificacion

Precondicion:
- El programa pertenece a una universidad con `universidades.user_id` asociado a un usuario `UNIVERSITY`.

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "aprobado"
}
```

Esperado:
- `200`
- Se crea una notificacion para el usuario `UNIVERSITY`.
- `tipo = "programa_aprobado"`.
- `entidadTipo = "programa"`.
- `entidadId = <programa_id>`.

### Rechazar programa crea notificacion con motivo

Endpoint:

```http
PATCH /api/programas/<programa_id>/status
Authorization: Bearer <ADMIN_ASESOR_SUPERADMIN_TOKEN>

{
  "estado": "rechazado",
  "rechazoMotivo": "Falta soporte de duracion."
}
```

Esperado:
- `200`
- Se crea una notificacion `programa_rechazado`.
- El mensaje incluye el motivo de rechazo.

### UNIVERSITY consulta sus notificaciones

Endpoint:

```http
GET /api/notifications?limit=20
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- Devuelve solo notificaciones de `req.user.id`.
- Incluye `titulo`, `mensaje`, `tipo`, `entidadTipo`, `entidadId`, `leida` y `fecha`.

### Otro usuario no puede verlas

Endpoint:

```http
GET /api/notifications
Authorization: Bearer <OTRO_USUARIO_TOKEN>
```

Esperado:
- `200`
- No aparecen notificaciones del usuario `UNIVERSITY` anterior.
- No existe query por `userId`.

### Contador de no leidas

Endpoint:

```http
GET /api/notifications/unread-count
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- `count` aumenta cuando se aprueba o rechaza un programa.

### Marcar una como leida

Endpoint:

```http
PATCH /api/notifications/<notification_id>/read
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- `leida = true`.
- `unread-count` baja.
- Si el id no pertenece al usuario autenticado, responde `404`.

### Marcar todas como leidas

Endpoint:

```http
PATCH /api/notifications/read-all
Authorization: Bearer <UNIVERSITY_TOKEN>
```

Esperado:
- `200`
- Devuelve la cantidad actualizada.
- `unread-count = 0`.

### Universidad sin usuario asociado

1. Usar un programa cuya universidad tenga `user_id = NULL`.
2. Aprobar o rechazar como `ADMIN`, `ASESOR` o `SUPERADMIN`.

Esperado:
- La moderacion no falla.
- No se crea notificacion.
