# AIRA frontend

The primary UI for AIRA: a React 18 single-page app built with Vite, Tailwind CSS,
shadcn/ui (Radix primitives) and TanStack React Query. It talks to the FastAPI backend
over HTTP. See the [root README](../README.md) for the whole project and
[ARCHITECTURE.md](../ARCHITECTURE.md) for how a request flows from a click to the
database and back.

> Originally scaffolded with Base44 (hence `"name": "base44-app"` in `package.json`).
> Nothing here calls the Base44 API.

## Run it

Start the backend first (see the root README), then:

```bash
npm install
npm run dev        # http://localhost:5173
```

The app calls `http://localhost:8000` by default. To point it elsewhere, set
`VITE_API_URL` in `frontend/.env` — Vite reads env files from this folder, not the
repo root. Tested with Node 24.

## Checks

```bash
npm run build      # production bundle in dist/
npm run typecheck  # tsc --noEmit; only .ts/.tsx files are type-checked
npm run lint       # ESLint; ~490 pre-existing problems, mostly react/prop-types in the shadcn kit
```

There are no frontend unit tests yet, and CI does not run lint or the build.

## Where things are

| Path | What it holds |
|------|---------------|
| `src/api/airaApi.js` | Every HTTP call to the backend |
| `src/api/queries.js` | React Query hooks: caching, refetching, invalidation after changes |
| `src/lib/reportTransform.js` | Turns a backend `IntegrityReport` into the shape the dashboard renders |
| `src/pages/` | Routes: `Home` (landing + upload), `Library`, `PaperDetail`, `ProjectDetail` |
| `src/components/` | Dashboard, library, upload and landing components; `ui/` is the shadcn kit |
| `src/pages/dev/` | Redesign (A0) artifacts served at `/styleguide` and `/styleguide/paper` |
| `DESIGN.md` | Design direction and token rules for the redesign |
