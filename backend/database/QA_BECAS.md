# QA Becas

Ejecuta primero `backend/database/20260427_becas.sql`.

## Casos funcionales

1. USER ve solo becas aprobadas:
   `GET /api/becas` debe excluir `pendiente` y `rechazado`.

2. UNIVERSITY crea beca:
   `POST /api/becas/university` con `nombre` y `descripcion`.
   Resultado esperado: `estado = pendiente` y `universidadId` resuelto desde `universidades.user_id`.

3. UNIVERSITY edita beca rechazada:
   `PUT /api/becas/university/:id`.
   Resultado esperado: vuelve a `pendiente`, limpia rechazo/aprobacion y registra `reenviado_revision`.

4. UNIVERSITY no edita beca ajena:
   `PUT /api/becas/university/:id` sobre beca de otra universidad.
   Resultado esperado: `403`.

5. ADMIN/ASESOR/SUPERADMIN aprueban:
   `PATCH /api/becas/admin/:id/status` con `{ "estado": "aprobado" }`.
   Resultado esperado: limpia rechazo, registra historial y crea notificacion si la universidad tiene `user_id`.

6. Rechazar con motivo:
   `PATCH /api/becas/admin/:id/status` con `{ "estado": "rechazado", "rechazoMotivo": "..." }`.
   Resultado esperado: guarda motivo, historial y notificacion.

7. Rechazar sin motivo:
   Resultado esperado: `400`.

8. UNIVERSITY ve motivo:
   `GET /api/becas/university/mis-becas` debe incluir `rechazoMotivo` y `fechaRechazo`.

9. Historial:
   `GET /api/becas/:id/moderation-history`.
   ADMIN/ASESOR/SUPERADMIN ven cualquiera. UNIVERSITY solo propias. USER recibe `403`.

10. Buscar becas:
    `/becas?search=...` desde frontend debe listar becas aprobadas.

11. Boton "Buscar Becas":
    Debe navegar a `/becas`.

12. Builds:
    `backend npm run build`, `frontend npm run build`, `frontend npm run build-only`.
