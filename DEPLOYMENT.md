# EstudiarApp Production Beta Deployment

This guide prepares EstudiarApp for a VPS or Dokploy deployment with:

- Frontend: Vue 3 + Vite served by Nginx.
- Backend: Node.js + Express running compiled TypeScript from `dist`.
- Database: PostgreSQL with persistent Docker volume.
- Domains: `app.estudiarapp.com` and `api.estudiarapp.com`.

## 1. Production Files

The production setup uses:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `docker-compose.production.yml`
- `.env.production.example`

Local development is unchanged:

- Backend dev: `cd backend && npm run dev`
- Frontend dev: `cd frontend && npm run dev`

## 2. Required Environment Variables

Copy the example file on the server:

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

```bash
FRONTEND_URL=https://app.estudiarapp.com
VITE_API_URL=https://api.estudiarapp.com/api
FRONTEND_PORT=8080
BACKEND_PORT=3001

POSTGRES_DB=estudiarapp
POSTGRES_USER=estudiarapp
POSTGRES_PASSWORD=<strong-random-password>

JWT_SECRET=<strong-random-secret-at-least-32-chars>
JWT_EXPIRES_IN=1h

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Do not commit `.env.production` or any real secret. `.gitignore` is configured to ignore `.env.*` except example files.

## 3. Build And Start With Docker Compose

From the repository root:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Equivalent npm scripts from the repo root:

```bash
npm run prod:build
npm run prod:up
```

Check containers:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs -f
```

## 4. Dokploy Routing

Create one Dokploy app/service for the compose stack or import the repository with `docker-compose.production.yml`.

Recommended routing:

- `app.estudiarapp.com` routes to the `frontend` service on port `80`.
- `api.estudiarapp.com` routes to the `backend` service on port `3001`.

If Dokploy exposes host ports instead of service ports:

- Route `app.estudiarapp.com` to host port `${FRONTEND_PORT}`. Default: `8080`.
- Route `api.estudiarapp.com` to host port `${BACKEND_PORT}`. Default: `3001`.

Enable HTTPS in Dokploy for both domains.

## 5. CORS And API URL

Backend CORS uses:

```bash
FRONTEND_URL=https://app.estudiarapp.com
```

Frontend API calls are compiled with:

```bash
VITE_API_URL=https://api.estudiarapp.com/api
```

Important: `VITE_API_URL` is a build-time variable. If the API domain changes, rebuild the frontend image.

## 6. Healthchecks

Backend healthcheck:

```bash
curl https://api.estudiarapp.com/api/health
```

Expected response includes:

```json
{
  "status": "OK"
}
```

Frontend healthcheck:

```bash
curl https://app.estudiarapp.com/health
```

Expected response:

```text
OK
```

## 7. Database Persistence

PostgreSQL data is stored in the Docker volume:

```yaml
volumes:
  postgres_data:
```

Do not remove this volume unless you intend to delete production data.

## 8. Running SQL Migrations

SQL migrations live in `backend/database`.

After the database container is healthy, run migrations from the repository root.

Run base schema files first when starting from an empty database:

```text
backend/database/auth.sql
backend/database/universidades.sql
backend/database/programas.sql
backend/database/favoritos.sql
backend/database/parametrizacion.sql
backend/database/reviews.sql
```

Then run dated migration files in filename order:

```text
backend/database/202*.sql
```

Do not run `QA_*.sql` files in production; those are diagnostic/support scripts.

PowerShell:

```powershell
$baseMigrations = @(
  "backend/database/auth.sql",
  "backend/database/universidades.sql",
  "backend/database/programas.sql",
  "backend/database/favoritos.sql",
  "backend/database/parametrizacion.sql",
  "backend/database/reviews.sql"
)

$datedMigrations = Get-ChildItem backend/database -Filter "202*.sql" | Sort-Object Name | ForEach-Object { $_.FullName }

($baseMigrations + $datedMigrations) | ForEach-Object {
  Get-Content $_ | docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
}
```

Bash:

```bash
base_migrations=(
  backend/database/auth.sql
  backend/database/universidades.sql
  backend/database/programas.sql
  backend/database/favoritos.sql
  backend/database/parametrizacion.sql
  backend/database/reviews.sql
)

for file in "${base_migrations[@]}"; do
  docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "$file"
done

for file in $(find backend/database -maxdepth 1 -name "202*.sql" | sort); do
  docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "$file"
done
```

If your shell does not load `.env.production`, export the variables first:

```bash
set -a
. ./.env.production
set +a
```

The current dated migration files are named with dates where order matters.

## 9. Production Build Checks

Before deploying, verify locally:

```bash
npm --prefix backend run build
npm --prefix frontend run type-check
npm --prefix frontend run build-only
```

Or from repo root:

```bash
npm run build
```

## 10. Security Checklist

- Use strong unique values for `POSTGRES_PASSWORD` and `JWT_SECRET`.
- Do not commit `.env`, `.env.production`, database dumps, certificates or private keys.
- Keep `OPENAI_API_KEY` empty unless the IA assistant is enabled for beta.
- Use HTTPS on both `app.estudiarapp.com` and `api.estudiarapp.com`.
- Restrict direct database access on the VPS firewall.
- Back up the `postgres_data` volume regularly.

## 11. Updating Production

Pull the latest code, rebuild and restart:

```bash
git pull
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Run any new SQL migrations after deployment.
