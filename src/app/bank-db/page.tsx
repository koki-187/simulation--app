'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { INVESTMENT_BANKS, InvestmentBank, BankType } from '@/lib/data/investmentBanks';

const BANK_TYPES: BankType[] = [
  '属性重視の銀行',
  'スピード重視のノンバンク',
  'エリア密着の金融機関',
];

const STRUCTURE_OPTIONS = ['W（木造）', 'RC', '重量鉄骨'] as const;
type StructureOption = (typeof STRUCTURE_OPTIONS)[number];

function TypeBadge({ type }: { type: BankType }) {
  if (type === '属性重視の銀行') {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-navy-500 text-white">
        {type}
      </span>
    );
  }
  if (type === 'スピード重視のノンバンク') {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
        {type}
      </span>
    );
  }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: '#27AE60' }}
    >
      {type}
    </span>
  );
}

function structureMatches(bank: InvestmentBank, filter: StructureOption | ''): boolean {
  if (!filter) return true;
  const s = bank.structure.toLowerCase();
  if (filter === 'W（木造）') return s.includes('w') || s.includes('木造');
  if (filter === 'RC') return s.toLowerCase().includes('rc');
  if (filter === '重量鉄骨') return s.includes('鉄骨') || s.includes('steel') || s.toLowerCase().includes('src');
  return true;
}

function isWMTOnly(bank: InvestmentBank): boolean {
  return (
    bank.phone.includes('WMT') ||
    bank.email.includes('WMT') ||
    bank.phone === '—' ||
    bank.email === '—'
  );
}

function BankCard({ bank }: { bank: InvestmentBank }) {
  const wmt = isWMTOnly(bank);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-navy-700 text-base leading-tight">{bank.name}</div>
        <TypeBadge type={bank.type} />
      </div>

      {/* Rate */}
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-gray-500 shrink-0">金利</span>
        <span className="text-orange-500 font-bold text-sm leading-tight">{bank.rate}</span>
      </div>

      {/* Area */}
      <div className="flex items-start gap-1">
        <span className="text-xs text-gray-500 shrink-0 mt-0.5">エリア</span>
        <span className="text-xs text-gray-700 truncate">{bank.area}</span>
      </div>

      {/* Structure */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 shrink-0">得意構造</span>
        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
          {bank.structure}
        </span>
      </div>

      {/* Features */}
      <div className="text-xs text-gray-600 line-clamp-2">{bank.features}</div>

      {/* Borrowing period */}
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="bg-gray-50 rounded p-1.5">
          <div className="text-gray-400 text-[10px] mb-0.5">木造</div>
          <div className="text-gray-700 leading-tight">{bank.termWood}</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5">
          <div className="text-gray-400 text-[10px] mb-0.5">鉄骨</div>
          <div className="text-gray-700 leading-tight">{bank.termSteel}</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5">
          <div className="text-gray-400 text-[10px] mb-0.5">RC</div>
          <div className="text-gray-700 leading-tight">{bank.termRC}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium ${bank.dansin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {bank.dansin ? '団信 ✓' : '団信 ✗'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          {bank.foreigners.includes('なしでも') ? '外国籍OK' : '要永住権'}
        </span>
        {(bank.minpaku === true || bank.minpaku === '対応') && (
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
            民泊OK
          </span>
        )}
      </div>

      {/* Income / Equity */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-400 text-[10px] mb-0.5">最低年収</div>
          <div className="text-gray-700 font-medium">{bank.minIncome}</div>
        </div>
        <div>
          <div className="text-gray-400 text-[10px] mb-0.5">自己資金</div>
          <div className="text-gray-700 font-medium">{bank.minEquity}</div>
        </div>
      </div>

      {/* Contact */}
      {!wmt && (
        <div className="border-t border-gray-100 pt-2 text-xs text-gray-500 space-y-0.5">
          {bank.phone && bank.phone !== '—' && (
            <div>
              <span className="text-gray-400">Tel: </span>
              <a href={`tel:${bank.phone}`} className="text-navy-600 hover:underline">{bank.phone}</a>
            </div>
          )}
          {bank.email && bank.email !== '—' && !bank.email.includes('WMT') && (
            <div>
              <span className="text-gray-400">Mail: </span>
              <a href={`mailto:${bank.email}`} className="text-navy-600 hover:underline break-all">{bank.email}</a>
            </div>
          )}
        </div>
      )}
      {wmt && (
        <div className="border-t border-gray-100 pt-2 text-xs text-orange-600 font-medium">
          WMT担当者経由で相談
        </div>
      )}
    </div>
  );
}

export default function BankDbPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BankType | ''>('');
  const [structureFilter, setStructureFilter] = useState<StructureOption | ''>('');
  const [minpakuOnly, setMinpakuOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return INVESTMENT_BANKS.filter((bank) => {
      if (q && !bank.name.toLowerCase().includes(q) && !bank.features.toLowerCase().includes(q)) {
        return false;
      }
      if (typeFilter && bank.type !== typeFilter) return false;
      if (structureFilter && !structureMatches(bank, structureFilter)) return false;
      if (minpakuOnly && bank.minpaku !== true && bank.minpaku !== '対応') return false;
      return true;
    });
  }, [search, typeFilter, structureFilter, minpakuOnly]);

  return (
    <AppShell>
      {/* Page header */}
      <div className="bg-navy-500 px-6 py-4">
        <h1 className="text-white font-bold text-lg tracking-wide">投資用金融機関データベース</h1>
        <p className="text-navy-100 text-xs mt-0.5">収益用不動産融資に対応する金融機関の情報一覧</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="金融機関名・特徴で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-navy-400"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BankType | '')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        >
          <option value="">全て</option>
          {BANK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={structureFilter}
          onChange={(e) => setStructureFilter(e.target.value as StructureOption | '')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        >
          <option value="">全て</option>
          {STRUCTURE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={minpakuOnly}
            onChange={(e) => setMinpakuOnly(e.target.checked)}
            className="rounded accent-orange-500"
          />
          民泊対応のみ
        </label>

        <span className="ml-auto text-sm font-medium text-navy-600 bg-navy-50 border border-navy-200 rounded-full px-3 py-1">
          {filtered.length} 件の金融機関
        </span>
      </div>

      {/* Results grid */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">
            条件に一致する金融機関が見つかりません
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
