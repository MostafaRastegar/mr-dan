# Project Rules

## Project Profile

- Stack: `Next.js 16.4.6 + React 19.3.1 + TypeScript 7.0.2 (App Router, Node runtime)`
- Primary language: `TypeScript (strict)`
- Test command: `pnpm test`
- Typecheck command: `pnpm typecheck`
- Lint command: `pnpm lint`
- Build command: `pnpm build`
- Migration command: `pnpm exec prisma migrate status`
- Dependency manifest / lockfile: `package.json / pnpm-lock.yaml`
- Language rules: `TypeScript strict; no any (unknown + type guards); explicit public types; domain-oriented English names`

Repository rules, commands, architecture, UI gates and prohibitions live in the
root `AGENTS.md`; it wins over this file.

Safety (not covered by the root file): never `git push --force`; run the
`secret-audit` tool before reporting.
