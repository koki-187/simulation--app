# Open Questions

## performance-optimization - 2026-04-30
- [ ] Font weight '500' removal: Is `font-medium` (Tailwind = weight 500) used in the app? If yes, keep weight '500' in the Noto Sans JP config. Grep for `font-medium` before applying Step 6. — Incorrect removal would cause visible font rendering fallback.
- [ ] Recharts dynamic loading (Issue 9) deferred: Should this be planned as a follow-up? It requires ~7 wrapper components and loading skeletons. — Would further reduce initial JS bundle on each page.
- [ ] `removeConsole` scope: Should `console.warn` and `console.error` be preserved in production? Current plan removes all console output. Can be configured with `{ production: { exclude: ['error', 'warn'] } }`. — Affects production debugging ability.
