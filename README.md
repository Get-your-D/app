# App

A full-stack monorepo with a NestJS backend and multiple Next.js frontends sharing a common component library.

## Structure

```
app/
├── packages/
│   ├── server/          # NestJS REST API
│   ├── web/             # Next.js frontend app
│   ├── web-dashboard/   # Next.js dashboard app
│   ├── web-patient/     # Next.js patient-facing app
│   └── web-shared/      # Shared UI component library
└── package.json         # npm workspace root
```

## Tech Stack

| Layer | Technology |
|---|---|
| Package manager | npm workspaces |
| Backend | NestJS 11, TypeScript |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Shared UI | `web-shared` package (Base UI, Tanstack Table, Lucide icons) |
| Testing | Jest (server), built-in Next.js lint |

## Getting Started

Install all dependencies from the repo root:

```bash
npm install
```

### Running packages individually

**Backend (server):**
```bash
cd packages/server
npm run start:dev     # development with watch
npm run start:debug   # debug mode
npm run start:prod    # production
```

**Frontend apps:**
```bash
cd packages/web          # (or web-dashboard / web-patient)
npm run dev
```

### Running tests (server)

```bash
cd packages/server
npm run test          # unit tests
npm run test:watch    # watch mode
npm run test:cov      # with coverage
npm run test:e2e      # end-to-end
```

## How the Shared UI Library Works

`packages/web-shared` contains all shared React components (shadcn/ui-based), hooks, and utilities. The three Next.js apps depend on it directly via npm workspace resolution.

Each app is configured to:
1. **Resolve the package** via TypeScript path aliases in `tsconfig.json`:
   ```json
   "paths": {
     "web-shared": ["../web-shared/src/index.ts"],
     "web-shared/*": ["../web-shared/src/*"]
   }
   ```
2. **Transpile source** (not compiled output) via `transpilePackages: ["web-shared"]` in `next.config.ts`.

This means you import directly from source and there is no separate build step for `web-shared`. Changes to shared components are immediately reflected in all apps during development.

**Adding a new shared component:**
1. Add your component under `packages/web-shared/src/components/ui/`
2. Export it from `packages/web-shared/src/index.ts` if it should be a top-level import
3. Import in any app as `import { MyComponent } from "web-shared"`

## Adding a New Frontend App

1. Copy `packages/web` or `packages/web-patient` as a template
2. Update the `name` field in its `package.json`
3. Keep the `tsconfig.json` path aliases and the `transpilePackages` config in `next.config.ts` so `web-shared` resolves correctly
4. Run `npm install` from the repo root to link the new workspace

## Docker

### Local database

A `docker-compose.yml` at the repo root starts a PostgreSQL 17 instance for local development:

```bash
docker compose up -d    # start in background
docker compose down     # stop and remove containers
docker compose down -v  # also delete the persisted volume
```

Required environment variables (set in `.env` or your shell):

| Variable | Description |
|---|---|
| `DB_USER` | Postgres username |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name |

The database is exposed on `localhost:5432` and data is persisted in a named Docker volume (`postgres_data`).

### Building production images

All four deployable packages have Dockerfiles. **Always build from the repo root** so npm workspace symlinks resolve correctly:

```bash
docker build -f packages/server/Dockerfile -t app-server .
docker build -f packages/web/Dockerfile -t app-web .
docker build -f packages/web-dashboard/Dockerfile -t app-dashboard .
docker build -f packages/web-patient/Dockerfile -t app-patient .
```

| Package | Dockerfile | Port |
|---|---|---|
| `packages/server` | `packages/server/Dockerfile` | 3003 |
| `packages/web` | `packages/web/Dockerfile` | 3000 |
| `packages/web-dashboard` | `packages/web-dashboard/Dockerfile` | 3001 |
| `packages/web-patient` | `packages/web-patient/Dockerfile` | 3002 |

Each image uses a multi-stage build (deps → build → production) to keep the final layer small. The Next.js apps use [`output: "standalone"`](https://nextjs.org/docs/app/api-reference/next-config-js/output) so the production image contains only the traced dependencies needed to run the server.

## Git Hooks (Husky)

[Husky](https://typicode.github.io/husky/) enforces two checks on every commit:

1. **`commit-msg`** — validates the commit message format:
   ```
   #<ticket> (<type>): <description>
   ```
   - `#<ticket>`: issue number, e.g. `#42`
   - `<type>`: lowercase keyword, e.g. `feat`, `fix`, `ref`, `chore`, `docs`
   - `<description>`: non-empty summary

   Valid example: `#42 (feat): add user login`

2. **`pre-commit`** — runs ESLint across all packages (`npm run lint:check --workspaces --if-present`). The commit is rejected if there are any errors or more than 50 warnings.

Hooks run automatically on `git commit`. No manual setup is needed beyond `npm install` (which triggers `husky` via the `prepare` script).

## Code Style

- **TypeScript** is used throughout — strict mode is enabled in all packages
- **ESLint v9** with Next.js and TypeScript rules for web apps; NestJS-specific config for the server
- **Prettier** is configured in the server package (`.prettierrc`)

To lint and format:
```bash
# From repo root — all packages
npm run format      # Prettier (all packages)
npm run lint        # ESLint with auto-fix (all packages)
npm run lint:check  # ESLint without auto-fix, fails on errors or >50 warnings

# Per-package (from any package directory)
npm run lint        # ESLint with auto-fix (server also runs Prettier via plugin)
```
