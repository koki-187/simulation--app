export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Railway: max execution time (seconds)

// ── Rate Limiting ──────────────────────────────────────────────────────────
// in-memory rate limiter（サーバー再起動でリセット）
// 無料枠の単一インスタンス環境を想定
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;           // 1時間あたり最大5回
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1時間（ms）

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfter: 0 };
}

interface ParsedRates {
  [bankId: string]: number;
}

// Japanese bank name → internal bankId mapping
const BANK_NAME_TO_ID: Array<[string, string]> = [
  ['PayPay銀行', 'paypay'],
  ['ペイペイ銀行', 'paypay'],
  ['住信SBIネット銀行', 'sbi-sumishin'],
  ['住信SBI', 'sbi-sumishin'],
  ['auじぶん銀行', 'au-jibun'],
  ['auじぶん', 'au-jibun'],
  ['ソニー銀行', 'sony'],
  ['三菱UFJ銀行', 'mufg'],
  ['三菱UFJ', 'mufg'],
  ['みずほ銀行', 'mizuho'],
  ['イオン銀行', 'aeon'],
  ['三井住友銀行', 'smbc'],
  ['三井住友', 'smbc'],
  ['楽天銀行', 'rakuten'],
  ['SBI新生銀行', 'sbi-shinsei'],
  ['新生銀行', 'sbi-shinsei'],
  ['りそな銀行', 'resona'],
  ['埼玉りそな銀行', 'resona'],
];

const TOTAL_BANKS = 11;
const VALID_RATE_MIN = 0.1;
const VALID_RATE_MAX = 3.5;

function matchBankName(text: string): string | null {
  for (const [name, id] of BANK_NAME_TO_ID) {
    if (text.includes(name)) return id;
  }
  return null;
}

function isValidRate(rate: number): boolean {
  return !isNaN(rate) && rate >= VALID_RATE_MIN && rate <= VALID_RATE_MAX;
}

/** Parse rates from markdown/text content */
function parseRatesFromText(text: string): ParsedRates {
  const rates: ParsedRates = {};

  // Strategy 1: markdown table rows — | BankName | 0.850% |
  const tableRowRegex = /\|\s*([^|\n]{2,30})\s*\|\s*(\d+\.\d{2,3})%?\s*\|/g;
  let match;
  while ((match = tableRowRegex.exec(text)) !== null) {
    const bankName = match[1].trim();
    const rate = parseFloat(match[2]);
    if (!isValidRate(rate)) continue;
    const bankId = matchBankName(bankName);
    if (bankId && !rates[bankId]) rates[bankId] = rate;
  }

  // Strategy 2: line-by-line scan — "PayPay銀行 0.850%"
  if (Object.keys(rates).length < 4) {
    const lines = text.split('\n');
    for (const line of lines) {
      const rateMatch = line.match(/(\d+\.\d{2,3})\s*%/);
      if (!rateMatch) continue;
      const rate = parseFloat(rateMatch[1]);
      if (!isValidRate(rate)) continue;
      const bankId = matchBankName(line);
      if (bankId && !rates[bankId]) rates[bankId] = rate;
    }
  }

  return rates;
}

/** Primary: Jina Reader on rate comparison site */
async function fetchViaJinaReader(): Promise<ParsedRates> {
  const url = 'https://r.jina.ai/https://0systems.com/interest-rate-table/';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'text/plain, text/markdown',
        'X-No-Cache': 'true',
        ...(process.env.JINA_API_KEY
          ? { 'Authorization': `Bearer ${process.env.JINA_API_KEY}` }
          : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.includes('not found') || text.length < 200) throw new Error('Invalid response');
    return parseRatesFromText(text);
  } catch (e) {
    clearTimeout(timer);
    console.error('[refresh-rates] Jina Reader failed:', e);
    return {};
  }
}

/** Secondary: direct fetch on the comparison site */
async function fetchDirectFromSite(): Promise<ParsedRates> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://0systems.com/interest-rate-table/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible)',
        'Accept': 'text/html',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Strip HTML tags for text parsing
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return parseRatesFromText(text);
  } catch (e) {
    clearTimeout(timer);
    console.error('[refresh-rates] Direct fetch failed:', e);
    return {};
  }
}

/** Get current month in JST as "YYYY-MM" */
function getCurrentMonthJST(): string {
  const now = new Date();
  const jst = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = jst.find(p => p.type === 'year')?.value ?? String(now.getFullYear());
  const month = jst.find(p => p.type === 'month')?.value ?? String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

import { LOAN_CHECKER_BANKS, LOAN_CHECKER_UPDATED } from '@/lib/data/loanCheckerBanks';

export async function GET() {
  return Response.json({
    success: true,
    banks: LOAN_CHECKER_BANKS,
    updatedAt: LOAN_CHECKER_UPDATED,
    totalBanks: LOAN_CHECKER_BANKS.length,
  });
}

export async function POST(req: Request) {
  const adminToken = process.env.REFRESH_API_TOKEN;
  if (!adminToken) {
    // トークン未設定時は常に拒否（fail-closed）
    return Response.json(
      { success: false, error: 'REFRESH_API_TOKEN が設定されていません。Railway の環境変数に設定してください。' },
      { status: 503 }
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${adminToken}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // レート制限チェック（IPアドレスベース、なければglobalキー）
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'global';
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        success: false,
        error: `レート制限: 1時間に${RATE_LIMIT_MAX}回まで。${rateLimit.retryAfter}秒後に再試行してください。`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor((Date.now() + rateLimit.retryAfter * 1000) / 1000)),
        },
      }
    );
  }

  try {
    const monthStr = getCurrentMonthJST();

    // Try primary source, then fallback
    const rates = await fetchViaJinaReader();
    const primaryCount = Object.keys(rates).length;

    if (primaryCount < 4) {
      const fallback = await fetchDirectFromSite();
      // Merge: prefer primary results, fill gaps with fallback
      for (const [k, v] of Object.entries(fallback)) {
        if (!rates[k]) rates[k] = v;
      }
    }

    const foundCount = Object.keys(rates).length;

    return Response.json(
      {
        success: true,
        rates,
        month: monthStr,
        updatedAt: new Date().toISOString(),
        foundCount,
        totalBanks: TOTAL_BANKS,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error('[refresh-rates] Fatal error:', error);
    return Response.json(
      { success: false, error: '金利データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
