# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Full-stack monorepo with an npm workspaces setup:

```
app/
├── packages/
│   ├── server/          # NestJS REST API
│   ├── web/             # Next.js frontend app
│   ├── web-dashboard/   # Next.js dashboard app
│   ├── web-patient/     # Next.js patient-facing app
│   └── web-shared/      # Shared UI component library (this package)
└── package.json         # npm workspace root
```

Install all dependencies from the repo root: `npm install`

## Commands

**Frontend apps** (`packages/web`, `packages/web-dashboard`, `packages/web-patient`):
```bash
npm run dev       # development server
npm run build     # production build
npm run lint      # ESLint
```

**Backend** (`packages/server`):
```bash
npm run start:dev   # development with watch
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run lint        # ESLint with auto-fix
npm run format      # Prettier
```

**web-shared** has no build step — it is transpiled directly by the Next.js consumer apps.

## Architecture: Shared Component Library

`web-shared` is a **source-level library** — no separate build step. Consumer apps resolve it via TypeScript path aliases and `transpilePackages: ["web-shared"]` in `next.config.ts`. Changes are immediately reflected in all apps.

### Source Structure

```
src/
├── components/ui/   # shadcn/ui-based components (~30 components)
├── hooks/           # React hooks (e.g., useIsMobile)
├── lib/utils.ts     # cn() utility (clsx + tailwind-merge)
├── styles/          # globals.css — Tailwind v4 + CSS variable theming
└── index.ts         # Top-level exports
```

### Component Patterns

- Components use **CVA** (`class-variance-authority`) for type-safe variant management
- **`cn()`** from `lib/utils.ts` is used everywhere to merge Tailwind classes safely
- Compound components use `data-slot` attributes for CSS targeting (e.g., `Card` with `CardHeader`, `CardContent`, etc.)
- `asChild` prop uses `Slot.Root` from Base UI for polymorphic rendering
- Dark mode is handled via CSS variables in `globals.css` under the `.dark` class

### Adding a New Component

1. Create the component under `src/components/ui/`
2. Export it from `src/index.ts` if it should be a top-level import
3. Import in any app as `import { MyComponent } from "web-shared"`

### Styling

Tailwind CSS v4 is used. The design token system lives in `src/styles/globals.css` as CSS custom properties (`--background`, `--primary`, `--radius-*`, etc.). Reference these via Tailwind utility classes — do not hardcode colors.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, Next.js 16 (consumer apps) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Primitives | `@base-ui/react` (unstyled, accessible headless components) |
| Tables | `@tanstack/react-table` |
| Icons | `lucide-react` |
| Toasts | `sonner` |
| Variants | `class-variance-authority` |
| Type checking | TypeScript 5, strict mode |
