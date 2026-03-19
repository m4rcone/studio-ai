# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Next.js dev server (localhost:3000)
npm run build     # Build production bundle
npm run start     # Start production server
npm run lint      # Run ESLint
npm run lint:fix  # Run ESLint with auto-fix
npm run format    # Format all files with Prettier
```

## Architecture

Minimal **Next.js 16** app with **React 19**, **Tailwind CSS v4**, and **TypeScript**.

- `src/app/` — App Router directory
  - `layout.tsx` — Root layout (Geist font, `bg-stone-50`, `pt-BR` locale)
  - `page.tsx` — Home page
  - `globals.css` — Global styles (`@import 'tailwindcss'`)

**Path alias:** `@/*` maps to `src/*` (e.g., `import Foo from '@/components/Foo'`)

**TypeScript:** Strict mode is OFF (`"strict": false` in tsconfig.json).

## Agent Skills

This project uses Claude Code Agent Skills (`.agents/skills/`, symlinked to `.claude/skills/`):
- `deploy-to-vercel` — Vercel deployment
- `vercel-react-best-practices` — React/Next.js performance patterns
- `vercel-composition-patterns` — React composition patterns
- `web-design-guidelines` — UI/accessibility review
