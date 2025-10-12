# Repository Guidelines

## Project Structure & Module Organization

- `src/routes/` holds SvelteKit pages; nested folders map to routes, with shared data wired through `+layout.*`.
- `src/lib/components/` contains reusable UI, while `src/lib/server/` hosts server-only helpers and database adapters.
- Unit specs live beside code as `*.spec.ts`; Playwright flows sit in `e2e/`; static assets land in `static/`.
- Drizzle migrations are versioned in `drizzle/`, with tooling in `drizzle.config.ts` and bindings described by `wrangler.jsonc`.

## Build, Test, and Development Commands

- `npm run dev` launches the Vite dev server; append `-- --open` to auto-open a browser tab.
- `npm run check` performs `svelte-kit sync` plus `svelte-check` against `tsconfig.json` for type safety.
- `npm run build` compiles the production bundle; `npm run preview` serves it via `wrangler pages dev`.
- `npm run lint` runs Prettier (check) and ESLint; use `npm run format` to fix style issues.
- `npm run test` runs Vitest headlessly and then Playwright; `npm run test:unit -- --watch` keeps Vitest hot during development.
- Database helpers: `npm run db:generate` creates snapshots, `npm run db:push` syncs schema, and `npm run db:migrate:local` applies migrations.

## Coding Style & Naming Conventions

- TypeScript is mandatory; organize Svelte files as `<script lang="ts">`, markup, then optional `<style lang="scss">`.
- Prettier enforces tabs for HTML, JS/TS, CSS/Sass, and Svelte plus double quotes and 100-char width—run `npm run format` to stay aligned.
- Name Svelte components in PascalCase, server utilities in camelCase, and route folders in kebab-case (`admin-dashboard`).

## Testing Guidelines

- Place unit specs beside the code (`*.spec.ts`), mock remote calls, and label Vitest `describe` blocks after the module under test.
- Maintain e2e journeys in `e2e/*.test.ts`, favoring resilient selectors such as `getByRole` to prevent flakiness.
- Refresh database state through Drizzle migrations or Cloudflare D1 resets before and after destructive tests.

## Commit & Pull Request Guidelines

- Use short, present-tense commit messages (`Show countdown to events this season`), mirroring the current history.
- Group related changes per commit and confirm `npm run lint` plus `npm run test` pass locally before pushing.
- Pull requests need a summary, linked issue when available, UI screenshots for visible changes, and callouts for database or Cloudflare impacts.

## Cloudflare & Environment Notes

- Wrangler commands rely on the `bionic_portal_db` D1 binding; rerun `npm run cf-typegen` after binding updates to refresh `src/worker-configuration.d.ts`.
- Mirror Wrangler secrets in your local `.env`; never commit credentials—document the setup steps instead.
