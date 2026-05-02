# MAS — My Agent Simulation

不動産投資・住宅ローン専用シミュレーター。エージェント向けの多機能財務分析ツールです。

## 主な機能

- **収益用ローンシミュレーション** — キャッシュフロー分析・返済スケジュール・税金詳細・売却シナリオ
- **A/B パターン比較** — 2物件の同時比較・一括PDF出力
- **住宅ローン計算機** — 137金融機関DB・繰上返済・借換え比較
- **資金計画書** — 全セクション一括PDF出力（バッチエクスポート）

## 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

## ビルド・デプロイ

```bash
npm run build   # Railway向け standalone ビルド
npm start       # 本番サーバー起動
```

## 技術スタック

- **Next.js 16** (App Router, `output: standalone`)
- **React 19** + TypeScript
- **Tailwind CSS v4**
- **Zustand v5** (状態管理・LocalStorage永続化)
- **Recharts v3** (グラフ描画)
- **html2canvas** + **jsPDF** (PDF出力)
- **ExcelJS** (Excel出力)
- **Vitest** (テスト)

## 環境変数

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `REFRESH_API_TOKEN` | 金利更新APIの認証トークン | 任意 |
| `JINA_API_KEY` | Jina Reader APIキー（金利スクレイピング） | 任意 |
