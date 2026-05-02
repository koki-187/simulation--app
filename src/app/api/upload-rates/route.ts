export const dynamic = 'force-dynamic';

interface ParsedRates {
  [bankId: string]: number;
}

// Japanese bank name → internal bankId mapping (partial match)
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

const VALID_RATE_MIN = 0.1;
const VALID_RATE_MAX = 5.0;

function matchBankName(text: string): string | null {
  for (const [name, id] of BANK_NAME_TO_ID) {
    if (text.includes(name)) return id;
  }
  return null;
}

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; continue; }
      if (ch === '"') { inQuote = false; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQuote = true; continue; }
      if (ch === ',') { fields.push(field); field = ''; continue; }
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

export async function POST(req: Request) {
  const adminToken = process.env.REFRESH_API_TOKEN;
  if (adminToken) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${adminToken}`) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Content-Lengthヘッダーに依存しない実際のボディサイズ制限
  const MAX_BODY_SIZE = 1_000_000; // 1MB
  let totalSize = 0;
  const chunks: Uint8Array[] = [];

  const reader = req.body?.getReader();
  if (!reader) {
    return Response.json({ success: false, error: 'リクエストボディが空です' }, { status: 400 });
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.length;
      if (totalSize > MAX_BODY_SIZE) {
        await reader.cancel();
        return Response.json(
          { success: false, error: 'ファイルサイズが1MBを超えています' },
          { status: 413 }
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new TextDecoder().decode(
    chunks.reduce((acc, chunk) => {
      const merged = new Uint8Array(acc.length + chunk.length);
      merged.set(acc);
      merged.set(chunk, acc.length);
      return merged;
    }, new Uint8Array())
  );

  try {
    const text = body;
    // Remove BOM
    const csv = text.replace(/^﻿/, '');
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length > 10_000) {
      return Response.json({ success: false, error: '行数が上限(10,000行)を超えています' }, { status: 400 });
    }

    const rates: ParsedRates = {};
    let parsedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVRow(lines[i]);
      if (fields.length < 4) continue;

      // CSV columns: No, 銀行名, 種別, 金利, ...
      const bankName = fields[1]?.trim() ?? '';
      const rateStr = fields[3]?.trim() ?? '';

      const rateMatch = rateStr.match(/(\d+\.\d+)/);
      if (!rateMatch) continue;

      const rate = parseFloat(rateMatch[1]);
      if (isNaN(rate) || rate < VALID_RATE_MIN || rate > VALID_RATE_MAX) continue;

      const bankId = matchBankName(bankName);
      if (bankId && !rates[bankId]) {
        rates[bankId] = rate;
      }
      parsedCount++;
    }

    return Response.json({
      success: true,
      rates,
      count: parsedCount,
      matchedBanks: Object.keys(rates).length,
    });
  } catch (error) {
    console.error('[upload-rates] Error:', error);
    return Response.json(
      { success: false, error: 'CSVの解析に失敗しました' },
      { status: 500 }
    );
  }
}
