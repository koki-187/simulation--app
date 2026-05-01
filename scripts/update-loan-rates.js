#!/usr/bin/env node
/**
 * ローンチェッカー 金利自動更新スクリプト
 *
 * 実行方法: node scripts/update-loan-rates.js
 *
 * 推奨スケジュール: 毎月1日・15日 9:00 (Windows タスクスケジューラ)
 * タスクスケジューラ設定例:
 *   トリガー: 毎月 1日・15日 09:00
 *   操作: node "C:\Users\reale\terass-sim\scripts\update-loan-rates.js"
 *   開始: C:\Users\reale\terass-sim
 *
 * 前提条件:
 *   - Chrome が TERASS アカウントでログイン済み
 *   - loan-checker.jp にセッションが残っている
 *   - npm install playwright（初回のみ: npx playwright install chromium）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/lib/data/loanCheckerBanks.ts');
const LOAN_CHECKER_URL = 'https://loan-checker.jp/loan';

// ブラウザ接続設定（既存Chromeに接続を優先）
const CDP_URL = 'http://localhost:9222';

async function extractBankData(page) {
  await page.goto(LOAN_CHECKER_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  if (page.url().includes('/login') || page.url().includes('/signin')) {
    throw new Error('ログインが必要です。Chromeでloan-checker.jpにログイン後、再実行してください。');
  }

  return page.evaluate(() => {
    const results = [];
    const seen = new Set();

    document.querySelectorAll('[class*="text--size_2xl"]').forEach(nameEl => {
      const bankName = nameEl.textContent.trim();
      if (!bankName || bankName.length < 2 || bankName.length > 60 ||
          /^\d/.test(bankName) || seen.has(bankName) ||
          bankName.includes('お知らせ') || bankName.includes('通知')) return;
      seen.add(bankName);

      let card = nameEl;
      for (let i = 0; i < 10; i++) {
        if (!card.parentElement) break;
        card = card.parentElement;
        const t = card.textContent;
        if (t.includes('返済額/月') && t.includes('手数料等') && t.includes('%')) break;
      }

      const cardText = card.textContent;
      const rates = [...cardText.matchAll(/(\d+\.\d{2,3})\s*%/g)]
        .map(m => parseFloat(m[1]))
        .filter(r => r >= 0.3 && r <= 5.0);
      const rate = rates[0] ?? null;

      const feeMatch = cardText.match(/手数料等\s*¥([\d,]+)/);
      const fee = feeMatch ? parseInt(feeMatch[1].replace(/,/g, '')) : null;

      const monthlyMatch = cardText.match(/返済額\/月\s*¥([\d,]+)/);
      const monthly = monthlyMatch ? parseInt(monthlyMatch[1].replace(/,/g, '')) : null;

      const prevMatch = cardText.match(/前月[：:]\s*(\d+\.\d{2,3})\s*%/);
      const prevRate = prevMatch ? parseFloat(prevMatch[1]) : null;

      let rateType = '変動';
      if (bankName.includes('フラット') || (bankName.includes('固定') && !bankName.includes('変動'))) {
        rateType = '固定';
      }

      if (bankName && rate !== null) {
        results.push({ no: results.length + 1, name: bankName, rate, rateType, fee, monthly, prevRate });
      }
    });

    return results;
  });
}

function generateTypeScript(banks) {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  let ts = `// ローンチェッカー 全金融機関データ\n`;
  ts += `// 自動取得: ${today.toISOString().slice(0, 10)} | 件数: ${banks.length}行\n`;
  ts += `// ⚠️ このファイルは scripts/update-loan-rates.js により自動生成されます\n\n`;
  ts += `export interface LoanCheckerBank {\n`;
  ts += `  no: number;\n  name: string;\n  rateType: '変動' | '固定' | 'フラット35';\n`;
  ts += `  rate: number;\n  prevRate: number | null;\n`;
  ts += `  monthlyPayment: number | null;\n  processingFee: number | null;\n}\n\n`;
  ts += `export const LOAN_CHECKER_UPDATED = "${month}";\n\n`;
  ts += `export const LOAN_CHECKER_BANKS: LoanCheckerBank[] = [\n`;

  banks.forEach(b => {
    ts += `  { no: ${b.no}, name: ${JSON.stringify(b.name)}, rateType: "${b.rateType}", `;
    ts += `rate: ${b.rate}, prevRate: ${b.prevRate ?? 'null'}, `;
    ts += `monthlyPayment: ${b.monthly ?? 'null'}, processingFee: ${b.fee ?? 'null'} },\n`;
  });
  ts += `];\n`;

  return ts;
}

async function main() {
  console.log('🏦 ローンチェッカー 金利自動更新スクリプト');
  console.log('='.repeat(50));

  let browser;
  let usedCDP = false;

  // 1. 既存Chromeに接続を試みる
  try {
    console.log(`📡 既存Chrome (CDP ${CDP_URL}) に接続中...`);
    const { chromium: pw } = require('playwright');
    browser = await pw.chromium.connectOverCDP(CDP_URL);
    usedCDP = true;
    console.log('✅ 既存Chromeに接続しました');
  } catch {
    // 2. 新しいブラウザを起動
    console.log('⚠️  CDP接続失敗。新規ブラウザを起動します...');
    console.log('   ※ loan-checker.jp にログインが必要な場合があります');
    browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  }

  let page;
  try {
    if (usedCDP) {
      const contexts = browser.contexts();
      // loan-checker.jp が開いているタブを探す
      for (const ctx of contexts) {
        for (const p of ctx.pages()) {
          if (p.url().includes('loan-checker.jp')) {
            page = p;
            break;
          }
        }
        if (page) break;
      }
      if (!page) {
        page = await (contexts[0] || await browser.newContext()).newPage();
      }
    } else {
      page = await browser.newPage();
    }

    console.log('🔍 loan-checker.jp からデータを取得中...');
    const banks = await extractBankData(page);
    console.log(`✅ ${banks.length}件の金融機関データを取得しました`);

    // サンプル表示
    console.log('\n📊 取得データ（上位5件）:');
    banks.slice(0, 5).forEach(b => {
      console.log(`  ${b.no}. ${b.name}: ${b.rate}% (前月: ${b.prevRate ?? '-'}%)`);
    });

    // TypeScriptファイルを生成・書き込み
    console.log(`\n📝 ${OUTPUT_FILE} を更新中...`);
    const tsContent = generateTypeScript(banks);
    fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
    console.log('✅ TypeScriptファイルを更新しました');

    // ビルド確認
    console.log('\n🔨 TypeScript ビルド確認中...');
    try {
      execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      console.log('✅ ビルド成功');
    } catch {
      console.error('❌ ビルドエラー - デプロイを中止します');
      process.exit(1);
    }

    // Vercelデプロイ
    console.log('\n🚀 Vercel へデプロイ中...');
    execSync('npx vercel --prod --yes', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('✅ デプロイ完了！');
    console.log(`\n🎉 ${banks.length}件の金利データを更新・公開しました`);
    console.log(`   更新日時: ${new Date().toLocaleString('ja-JP')}`);

  } finally {
    if (!usedCDP) await browser.close();
  }
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
