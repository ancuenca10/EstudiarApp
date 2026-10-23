# QA Home Stats

Checklist para validar la columna lateral del Home.

## Endpoint publico

Endpoint:

```http
GET /api/public/stats
```

Esperado:
- Responde `200`.
- No requiere token.
- No expone datos sensibles.
- Devuelve:
  - `universidadesTotal`
  - `ciudadesTotal`
  - `publicasTotal`
  - `privadasTotal`
  - `resenasTotal`
  - `topUniversidades`

## Casos

1. Estadisticas coinciden con la base de datos:

```sql
SELECT COUNT(*) FROM universidades WHERE estado = 'aprobado';
```

Debe coincidir con `universidadesTotal`.

2. Ciudades no cuenta vacios:

```sql
SELECT COUNT(DISTINCT NULLIF(lower(trim(ciudad)), ''))
FROM universidades
WHERE estado = 'aprobado';
```

Debe coincidir con `ciudadesTotal`.

3. Publicas/Privadas no muestra `0/0`.

Como la tabla base `universidades` no tiene campo real de tipo/sector/naturaleza, la UI debe mostrar:

```text
Tipo de institucion: No disponible
```

4. Resenas cuenta solo aprobadas:

```sql
SELECT COUNT(*) FROM reviews WHERE estado = 'aprobada';
```

Debe coincidir con `resenasTotal`.

5. Top Universidades no queda vacio sin mensaje.

- Si hay resenas aprobadas, ordena por promedio, cantidad de resenas y programas aprobados.
- Si no hay resenas, usa universidades con mas programas aprobados.
- Si tampoco hay programas aprobados, muestra:

```text
Aun no hay datos suficientes para destacar universidades.
```

6. Acciones rapidas llevan a rutas reales.

- Usuario `ADMIN`, `ASESOR` o `SUPERADMIN`: `Gestionar Universidades` va a `/admin/universidades`.
- Usuario sin permisos administrativos: `Ver Universidades` va a `/universities`.
- `Escribir Resena` requiere sesion; si no hay sesion, va a `/login`.
- `Explorar Programas` va a `/programs`.

7. Usuario sin permisos no ve `Agregar Universidad`.

La accion administrativa debe aparecer como `Ver Universidades`.

8. Build frontend pasa.

```bash
cd frontend
npm run build
npm run build-only
```

9. Build backend pasa.

```bash
cd backend
npm run build
```
