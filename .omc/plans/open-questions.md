# Open Questions

## performance-optimization - 2026-04-30
- [ ] Font weight '500' removal: Is `font-medium` (Tailwind = weight 500) used in the app? If yes, keep weight '500' in the Noto Sans JP config. Grep for `font-medium` before applying Step 6. — Incorrect removal would cause visible font rendering fallback.
- [ ] Recharts dynamic loading (Issue 9) deferred: Should this be planned as a follow-up? It requires ~7 wrapper components and loading skeletons. — Would further reduce initial JS bundle on each page.
- [ ] `removeConsole` scope: Should `console.warn` and `console.error` be preserved in production? Current plan removes all console output. Can be configured with `{ production: { exclude: ['error', 'warn'] } }`. — Affects production debugging ability.

## ux-improvement - 2026-05-09
- [ ] PDF 表紙の「巨大数字オーナメント」: 表面利回り / 借入額 / 物件価格 のどれを背景装飾に採用するか — ブランドメッセージと数値の見映え (3 桁 vs 9 桁) で印象が変わる
- [ ] PDF 表紙ロゴ: 既存 `mas-logo-horizontal.png` を白抜き反転して使うか、専用の白モノグラム SVG を新規作成するか — 後者の方が高解像度だが追加アセット作成コストあり
- [ ] A4 オーバーフロー対策: 21年超のシナリオでテーブル分割 vs フォント縮小 vs 行省略 のどれを採用するか — 情報量と可読性のトレードオフ
- [ ] A/B 比較 勝者判定の重み付け: KPI ごとに重みを設定可能にするか、固定 (累計CF=2.0, IRR=1.5, NOI=1.0 等) にするか — ユーザー設定 UI が必要かどうかで実装規模が変わる
- [ ] モバイル対応スコープ: iPhone のみか Android 含むか / どこまでの解像度 (320px〜) をサポートするか — 最小幅でグラフが破綻する可能性あり
- [ ] 両ディレクトリ同期: `C:\mas` への反映は手動コピー / robocopy バッチ / git worktree のどれにするか — 運用継続性に関わる
