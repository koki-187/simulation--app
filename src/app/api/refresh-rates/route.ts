export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel Pro: 30s timeout

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
    console.warn('Jina Reader failed:', e);
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
    console.warn('Direct fetch failed:', e);
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

export async function POST() {
  try {
    const monthStr = getCurrentMonthJST();

    // Try primary source, then fallback
    let rates = await fetchViaJinaReader();
    const primaryCount = Object.keys(rates).length;

    if (primaryCount < 4) {
      const fallback = await fetchDirectFromSite();
      // Merge: prefer primary results, fill gaps with fallback
      for (const [k, v] of Object.entries(fallback)) {
        if (!rates[k]) rates[k] = v;
      }
    }

    const foundCount = Object.keys(rates).length;

    return Response.json({
      success: true,
      rates,
      month: monthStr,
      updatedAt: new Date().toISOString(),
      foundCount,
      totalBanks: TOTAL_BANKS,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
