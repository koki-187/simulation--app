# MAS UI/UX 改善計画 — 2026-05

## Context
ユーザーフィードバック (画像①〜④) を起点に、MAS (不動産投資シミュレーター / Next.js) の
PDF レポート品質 + Web アプリ UX を強化する。MAS Monochrome パレット
(#000 / #888 / #F7F7F7 / #FFF) を維持しつつ、視認性とビジュアルインパクトを底上げする。

二系統に反映する必要あり:
- `C:\mas`         (dev サーバー稼働ディレクトリ)
- `C:\Users\reale\mas` (git リポジトリ)

## Work Objectives
1. PDF 表紙のビジュアルインパクト強化 (画像①)
2. CF 分析テーブルの列区切り線+ヘッダー/データ行の視覚的連結 (画像②③)
3. 全 PDF ページのタイトルフォント太字化 + A4 サイズ整合性
4. サイドバーロゴ拡大 (画像④)
5. A/B 比較ページの「勝者一目判定」UI
6. iPhone (モバイル) 操作改善

## Guardrails
**Must Have**
- PDF は MAS Monochrome パレット (#000 / #888 / #F7F7F7 / #FFF) のみ使用
- Web は既存 Navy + Orange デザインシステムを維持
- 既存機能の挙動・データ計算ロジックは一切変更しない
- 両ディレクトリ (C:\mas と C:\Users\reale\mas) に同期反映
- A4 (794×1123 / 1122×794) の overflow を発生させない

**Must NOT Have**
- 新パッケージ追加 (Tailwind / 既存依存のみで実装)
- PDF にカラーアクセント追加 (モノクローム厳守)
- 計算ロジック・型定義 (`SimResult`, `CFRow`) の変更
- 破壊的変更 (props/API 互換性破壊)

---

## 優先度付き改善リスト

### P0 — 即効性が高く、フィードバック直撃項目

#### P0-1. CF 分析テーブル 列区切り線修復 (画像②③)
**根本原因:** `src/lib/pdf/sectionHtml.ts`
- `th()` (L177): `border:1px solid #000000` → 黒背景ヘッダー上で**完全に不可視**
- `td()` (L184): `border:1px solid #F7F7F7` → 白行 (i%2===0) 上で**完全に不可視**
- 結果: 9列 (年/家賃収入/運営費/運営CF/ローン返済/税金/税引後CF/累計CF/残債) の判別が不可能

**実装方針:**
- `th()` の border を `border-right:1px solid rgba(255,255,255,0.25); border-bottom:2px solid ${WHITE};` に変更 (黒背景上で白い縦罫)
- `td()` の border を `border-right:1px solid #D8D8D8; border-bottom:1px solid #EEEEEE;` に変更 (#F7F7F7 より一段濃いグレーで縞模様の上でも視認可)
- ストライプ行の `LIGHT` 背景値を `#F2F2F2` に微調整して罫線とのコントラスト確保
- 最後の列の `border-right` は明示的に削除 (テーブル右端の二重線回避)
- ヘッダー `<th>` と最初の `<tr>` の境界に `border-top:1px solid #000` を入れて視覚連結

#### P0-2. PDF 表紙の刷新 (画像①)
**現状の問題:** `coverHtml()` (sectionHtml.ts L228)
- 黒背景に低透明度 (0.20〜0.40) の細字テキストのみ → スカスカ感
- メトリクスが `font-weight:300` の細字 → インパクト不足
- 余白だけが目立ちビジュアル要素が皆無

**実装方針 (詳細):**
1. **巨大タイポグラフィのヒーロー化**
   - 物件名のフォントサイズ: 40px → **64〜72px / font-weight:600**
   - 物件名上部に `<div>` で巨大数字オーナメント: 表面利回り or 借入額を `font-size:240px; font-weight:100; color:rgba(255,255,255,0.06); position:absolute;` で背景装飾として配置
2. **左サイドの縦バー (Editorial Bar)**
   - `position:absolute; left:0; top:0; bottom:0; width:6px; background:linear-gradient(180deg,#FFF 0%,#888 100%);`
   - 高級レポート感を出すモノクロームアクセント
3. **Diagonal Split レイアウト**
   - 上半分: `background:#000` + ヒーロータイトル
   - 下半分: `background:#0A0A0A` (微妙な段差) + メトリクスグリッド
   - 境界に `clip-path: polygon(...)` で 6° 斜めカット (もしくは SVG `<line>` で diagonal divider)
4. **メトリクス強調**
   - メトリクス数値のフォントサイズ: 18px → **28px / font-weight:500**
   - ラベル opacity: 0.40 → 0.60 (可読性向上)
   - 数値色: 純白 (#FFF) を維持しつつ `text-shadow:0 0 32px rgba(255,255,255,0.08)` でグロー
5. **左下 / 右下バッジ**
   - 左下: `MAS` ロゴモノグラム (SVG / 80×80px / 白 1px ストローク四角内に "MAS")
   - 右下: 発行日 + シリアル番号風 `REPORT NO. 2026-001` (8px / letter-spacing:0.4em)
6. **ドットグリッド or ノイズテクスチャ**
   - 既存 `gridOverlay()` の opacity を上げて (0.04 → 0.08) かすかなブループリント感

実装は新ヘルパー `coverHeroBlock()` を `sectionHtml.ts` 内に追加し、`coverHtml()` を再構成。

#### P0-3. サイドバーロゴ拡大 (画像④)
**現状:** `src/components/layout/Sidebar.tsx` L60 — `className="h-10 w-auto ... max-w-full"`
サイドバー幅 `w-56` (224px) に対し `h-10` (40px) は小さすぎる。

**実装方針:**
- ロゴ高さ: `h-10` → `h-14` または `h-16` (56〜64px)
- コンテナ余白: `px-4 py-4` → `px-3 py-5`
- 背景に微弱な orange グラデを追加 (`bg-gradient-to-b from-navy-500 to-navy-600`) でロゴを浮かせる
- フォールバックテキスト (L70 "MAS") のフォントサイズも `text-xl` → `text-2xl` に揃える
- ロゴクリックで `/` (ダッシュボード) に遷移する `<Link>` でラップ (現状ただの `<img>`)

---

### P1 — 視認性・サイズ整合の体系修正

#### P1-1. PDF タイトル太字化 (全ページ共通)
**対象:** `sectionHeading()` (sectionHtml.ts L142) と `pageHeader()` (L127)
- 英タイトル: 既存 weight → `font-weight:700; letter-spacing:0.08em` に変更
- 日本語サブタイトル: weight 400 → 600
- セクションヘッダー下の罫線を `1px solid #000` → `2px solid #000` に
- 各ページの H1 相当箇所 (KPI 上のタイトル等) を一括見直し

#### P1-2. A4 サイズ overflow 完全排除
**現状の問題:** `pageWrap()` で `min-height` のみ指定 → コンテンツ多寡で縦伸び/縮みが発生し統一感欠如

**実装方針:**
- `min-height` → `height` に変更し固定 (overflow:hidden で切り捨て防止のため、内部要素の `max-height` を計算)
- 各セクションの行数を測定するユーティリティを追加 (`maxRowsForLandscape = 30` 等)
- `cashflowSectionHtml`: rows.length > 30 の場合は 2 ページ分割するロジック追加
- `amortizationSectionHtml`: 既存の年次集約ロジックを再利用しつつ overflow チェック
- 全ページで paddding `91px / 83px` を厳守し、`pageWrap` の bottom に `pageFooter` を `position:absolute; bottom:30px;` で固定配置

#### P1-3. A/B 比較 — 勝者一目判定 UI
**対象:** `src/app/compare/page.tsx`

**実装方針:**
- 比較対象 KPI (累計 CF / IRR / NOI / 月次 CF など) ごとに勝者を判定するヘルパー `pickWinner(a, b, kpi)` を追加
- 勝者カラムのヘッダーに `🏆` バッジ + `bg-orange-50 ring-2 ring-orange-400`
- 各 KPI 行で勝者セル背景を `bg-green-50` (微緑) + 勝差を `+¥XXX (+X.X%)` のチップ表示
- ページ最上部に「総合スコア」サマリーカード (KPI 数中の勝利数 / 重み付けスコア)
- 「Pattern A 優勢」「Pattern B 優勢」「拮抗」を大きなバナーで表示

#### P1-4. iPhone (モバイル) 操作改善
**対象:** `AppShell.tsx`, `Sidebar.tsx`, 入力系ページ全般

**実装方針:**
- `Sidebar` をモバイルで Drawer 化 (既存 `onClose` props を活用 / `lg:translate-x-0 -translate-x-full` で開閉)
- AppShell に `<button>` ハンバーガー (top-left, `lg:hidden`) を追加
- `/input`, `/compare` などのテーブルを `overflow-x-auto` ラップ + sticky 列頭
- タップターゲットを `min-h-[44px]` に統一 (HIG 準拠)
- フォーム入力で `inputMode="numeric"` `pattern="[0-9]*"` を数値フィールドに付与 (iOS テンキー)
- viewport meta `maximum-scale=1` を `_document` で確認

---

### P2 — 仕上げ・体験向上

#### P2-1. PDF KPI ボックス強化
- `StatBox` 相当の PDF 版 (`kpiBlock`) で枠線を 1px → 2px、数値フォント 24px → 32px

#### P2-2. PDF チャート (`chartSvg.ts`) のグリッド線可視化
- 横軸グリッドを `stroke:#D8D8D8` で明示 (現状薄すぎる場合)

#### P2-3. ダッシュボード `/page.tsx` のヒーロー化
- 上部に "今月のサマリー" ヒーローカード (Navy 背景 + Orange アクセント)

---

## Task Flow (実装順序 — 依存関係考慮)

```
P0-1 (CFテーブル罫線) ─┐
                       ├─→ P1-1 (タイトル太字) ─→ P1-2 (A4整合性) ─→ P2-1, P2-2
P0-2 (表紙刷新) ───────┘
P0-3 (ロゴ拡大) ─→ P1-4 (モバイル) ─→ P2-3
P1-3 (A/B勝者UI)  (独立)
```

理由:
- P0-1 / P0-2 は `sectionHtml.ts` 集中改修なので同一 PR で実施し競合回避
- P1-1 (タイトル太字) は P0 で触ったヘルパーの上に積むため後続
- P1-2 (A4 サイズ) は P0/P1-1 で各ページ高さが変わるので最後に整合
- P0-3 (ロゴ) は他と独立で並行可
- P1-3 (A/B) は `compare/page.tsx` 単独なので独立タスク化

---

## Detailed TODOs

### TODO-1: CF テーブル罫線修復 [P0]
- [ ] `sectionHtml.ts` `th()` を白系縦罫線に変更
- [ ] `sectionHtml.ts` `td()` を `#D8D8D8` 縦罫線に変更
- [ ] `LIGHT` 定数 (もしくは行ストライプ色) を `#F2F2F2` に微調整
- [ ] `cashflowSectionHtml`, `amortizationSectionHtml`, `taxSectionHtml` 等 全テーブルで視覚確認
- **Acceptance:** PDF を出力し、9 列すべての境界が肉眼で識別できる / ヘッダーとデータ行が連続して見える

### TODO-2: PDF 表紙刷新 [P0]
- [ ] `coverHeroBlock()` ヘルパー新規追加 (背景巨大数字 + diagonal split)
- [ ] `coverHtml()` を再構成
- [ ] 物件名 64〜72px / weight 600 へ
- [ ] メトリクス 28px / weight 500 へ
- [ ] 左サイドの縦バー追加 (`linear-gradient(#FFF→#888)`)
- [ ] `MAS` モノグラムバッジ (SVG) 配置
- [ ] `gridOverlay` opacity 微増
- **Acceptance:** プリント時の第一印象が「高級レポート」レベル / 黒背景でも情報密度が前向きに感じられる / モノクローム厳守

### TODO-3: サイドバーロゴ拡大 [P0]
- [ ] `Sidebar.tsx` の `<img>` を `h-14`〜`h-16` に
- [ ] コンテナを `<Link href="/">` でラップ
- [ ] フォールバックテキストもサイズ調整
- **Acceptance:** 通常解像度で 30cm 離れてもロゴが識別できる / クリックでダッシュボード遷移

### TODO-4: PDF タイトル太字化 [P1]
- [ ] `sectionHeading()`, `pageHeader()` の weight / letter-spacing 調整
- [ ] セクション下罫線 2px 化
- **Acceptance:** 全 PDF ページのタイトル階層が明確 / 太字で視認性 UP

### TODO-5: A4 オーバーフロー解消 [P1]
- [ ] `pageWrap()` の `min-height` → `height` 切替 + footer 絶対配置
- [ ] `cashflowSectionHtml` の行数チェック + 分割
- [ ] 全 PDF ページの実出力で 1 ページ完結を確認
- **Acceptance:** 21 年保有等の長期シナリオでも全ページが A4 1 枚 (またはきれいに 2 枚分割) で出力される

### TODO-6: A/B 比較 勝者 UI [P1]
- [ ] `pickWinner()` ヘルパー (KPI ごとの優劣判定)
- [ ] 勝者カラムハイライト (orange ring) + 🏆
- [ ] 総合スコアバナー
- **Acceptance:** ページを開いた瞬間にどちらが優れているか 3 秒以内に判別可能

### TODO-7: モバイル UX [P1]
- [ ] Sidebar Drawer 化 + ハンバーガー
- [ ] 全テーブル `overflow-x-auto`
- [ ] 数値入力 `inputMode="numeric"`
- [ ] タップターゲット 44px
- **Acceptance:** iPhone 13 サイズ (390×844) で全ページ操作可能 / iOS Safari でテンキーが起動

### TODO-8: 仕上げ [P2]
- [ ] KPI ボックスの強調
- [ ] PDF チャートグリッド可視化
- [ ] ダッシュボードヒーローカード
- **Acceptance:** 全体の完成度が「公開前提資料」のレベルに到達

### TODO-9: 両ディレクトリ同期
- [ ] `C:\Users\reale\mas` で実装 → コミット
- [ ] `C:\mas` に同等変更を反映 (rsync / robocopy / 手動)
- **Acceptance:** dev サーバー (C:\mas) で表示が一致

---

## 推定インパクト

| 項目 | UX インパクト | 実装コスト | 優先度 |
|---|---|---|---|
| P0-1 CF テーブル罫線 | **★★★★★** (フィードバック直撃) | S (1〜2h) | P0 |
| P0-2 PDF 表紙刷新 | **★★★★★** (第一印象 +) | M (4〜6h) | P0 |
| P0-3 ロゴ拡大 | ★★★★ (ブランド視認性) | XS (15min) | P0 |
| P1-1 タイトル太字 | ★★★ (全体品質底上げ) | S (1h) | P1 |
| P1-2 A4 整合 | ★★★★ (印刷品質保証) | M (3〜4h) | P1 |
| P1-3 A/B 勝者 UI | ★★★★ (意思決定加速) | M (3h) | P1 |
| P1-4 モバイル | ★★★★ (利用シーン拡大) | L (6〜8h) | P1 |
| P2 仕上げ | ★★ | M | P2 |

**合計見積り:** 約 22〜28 時間 (1.5〜2 営業日相当)

---

## Success Criteria
- 画像①〜④ で指摘された全項目が解消される
- 既存機能の挙動・計算結果が一切変わらない (既存 unit test 全グリーン)
- PDF が A4 1 枚 (もしくは意図された 2 枚) に収まる
- iPhone 13 サイズで主要 5 ページが操作可能
- 両ディレクトリ (C:\mas / C:\Users\reale\mas) で表示一致

## Open Questions
別途 `.omc/plans/open-questions.md` 参照。
