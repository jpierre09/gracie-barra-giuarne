# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PWA (Progressive Web App) for **Gracie Barra Guarne**, a Jiu-Jitsu academy, to manage student enrollment, monthly tuition payments (in COP), and payment reminder emails. UI text and all model/field names are in Spanish. Frontend is React 19 + TypeScript + Tailwind v4 + Vite; backend is Django 5 + PostgreSQL. The frontend can also run standalone against a lightweight Express/Vite dev server that mocks the API.

## Commands

```bash
npm run dev      # tsx server.ts — Express+Vite dev server on :3000 (frontend-only, mock API)
npm run build     # vite build (frontend) + esbuild bundle of server.ts -> dist/server.cjs
npm run start     # node dist/server.cjs — serve built frontend via Express (production, no Django)
npm run lint      # tsc --noEmit — this is the only "lint"/typecheck step; there is no ESLint config
```

There is no JS test runner configured (no test script, no test files).

Django backend (used for the real deployment path):

```bash
python manage.py runserver              # dev server (serves API + dist/index.html)
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
```

Docker Compose (full stack: Django + gunicorn + Postgres, matches production on Railway):

```bash
docker-compose up -d --build
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
# -> http://localhost:3000
```

No automated backend tests exist either (no `tests.py` content beyond Django defaults).

## Architecture — two parallel runtimes, one React app

This repo contains **two independent ways to run the same `src/` React frontend**, and it's important not to mix them up:

1. **Node/Express path** (`server.ts`, `npm run dev` / `npm run build` / `npm run start`): a minimal Express server that serves the Vite app and stubs out a few `/api/*` routes in-memory (health check, `/api/config/`, `/api/send-email-reminders`). This has no persistence and no auth — it exists for fast frontend-only iteration (e.g. in AI Studio). **Its API routes are not the source of truth** and will drift from the Django ones; when adding a real feature, the Django backend below is what matters.
2. **Django path** (`graciebarra/`, `apps/core/`, `Dockerfile`, `docker-compose.yml`): the real backend. Django serves the compiled `dist/index.html` as a catch-all SPA route (`apps/core/urls.py` → `views.spa_index_view`) and exposes the actual REST API under `/api/...` backed by PostgreSQL. This is what Docker/Railway run in production, via gunicorn.

Both paths serve the exact same built frontend (`vite build` output in `dist/`); only the API implementation differs. When changing an API contract, update **both** `server.ts` and `apps/core/views.py` or explicitly note that the mock is intentionally out of sync.

### Frontend data flow (`src/`)

`src/App.tsx` is the single stateful root component — there is no router, no global state library (no Redux/Zustand/Context). All app state (`students`, `payments`, `alertsHistory`, `currentUser`) lives in `useState` in `App.tsx` and is:
- persisted to `localStorage` (keys `gb_guarne_students`, `gb_guarne_payments`, `gb_guarne_alerts`, `gb_guarne_current_user`) as the primary client-side store,
- opportunistically synced with the backend via `fetch('/api/config/')` and `fetch('/api/me/')` on mount, and via fire-and-forget POSTs (`/api/payments/`, `/api/config/update-fee/`) on mutation — these calls do not block or reconcile local state on failure (`.catch(() => {})`).

Domain types are defined once in `src/types.ts` (`UserProfile`, `PaymentRecord`, `EmailAlertLog`, and the union types `Role`, `BeltRank`, `PaymentStatus`, `VerificationStatus`, `PaymentMethod`). Seed/demo data lives in `src/data/initialData.ts` and is only used when localStorage is empty.

Two top-level views are chosen by `currentUser.role` in `App.tsx`: `AdminDashboard` (role `ADMIN`) and `StudentProfile` (role `STUDENT`), plus modal components (`LoginModal`, `RegisterStudentModal`, `EmailAlertsModal`) and `PWAInstallPrompt`/`Header` for PWA chrome (install prompt, online/offline indicator).

### Auth & RBAC

There is no real frontend auth SDK wired in — `handleGoogleSignIn` in `App.tsx` takes already-resolved Google user data and assigns role by comparing the signed-in email against `import.meta.env.VITE_ADMIN_EMAIL`. On the Django side, real Google OAuth goes through `django-allauth` (`apps/core/settings` config, `GOOGLE_OAUTH_CLIENT_ID/SECRET`), and role assignment is mirrored server-side in `apps/core/signals.py::sync_user_role`, which runs on `User` `post_save` and on allauth's `user_signed_up`/`user_logged_in` signals, comparing against `settings.ADMIN_EMAIL`. **The admin-email comparison logic must stay consistent between `App.tsx` and `signals.py`** since both independently decide ADMIN vs STUDENT.

### Django models (`apps/core/models.py`)

- `UserProfile` — one-to-one with Django `User`; carries `role`, `cinturon` (belt rank), `monto_mensualidad` (fee), `dia_vencimiento` (due day), `estado_pago`.
- `Pago` (payment) — FK to `UserProfile`, tracks `estado` (approval workflow: `PENDIENTE_VERIFICACION` → `APROBADO`/`RECHAZADO`), method, receipt image (`comprobante`, uploaded via `custom_comprobante_upload_to` into `media/comprobantes/{año}/{mes}/{estudiante}/`), and an optional `comprobante_url` for externally-hosted receipts.
- `AlertaEmail` — log of reminder emails sent.
- `ConfiguracionAcademia` — singleton (`id=1`, via `get_or_create`) holding the global monthly fee; updating it in `views.api_update_fee` mass-updates every `STUDENT` profile's `monto_mensualidad`.

All REST endpoints live in `apps/core/views.py` and are wired in `apps/core/urls.py`; the catch-all `re_path(r'^.*$', ...)` at the end must stay last so it doesn't shadow API routes.

### Environment configuration

Runtime config is env-var driven (`.env`, loaded via `python-dotenv` in `settings.py`); see `.env.example` for the full list: `DJANGO_SECRET_KEY`, `ADMIN_EMAIL`/`VITE_ADMIN_EMAIL` (RBAC), `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `DATABASE_URL`/`POSTGRES_*`, SMTP `EMAIL_*` vars for payment reminder emails, and `GEMINI_API_KEY` (the `@google/genai` dependency). Production (Railway) needs a persistent volume mounted at `/app/media` so uploaded payment receipts survive redeploys.
