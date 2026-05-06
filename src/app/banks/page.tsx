'use client';
import { AppShell } from '@/components/layout';
import { useSimStore } from '@/store/simulatorStore';
import { yen } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BanksPage() {
  const { resultA } = useSimStore();
  const banks = resultA.banks;
  const minInterest = banks.length > 0 ? Math.min(...banks.map(b => b.totalInterest)) : 0;

  return (
    <AppShell>
      <div className="bg-navy-500 text-white px-6 py-4">
        <h1 className="text-lg font-bold">金融機関比較</h1>
        <p className="text-xs text-navy-100">同一借入額・同一期間での返済額・総コスト比較</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-card p-4">
          <h3 className="text-sm font-bold text-navy-500 mb-3">総利息比較（万円）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={banks.map(b => ({ name: b.name.replace('銀行','').replace('ネット',''), 総利息: Math.round(b.totalInterest/10000) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F6F8" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`${v}万円`]} />
              <Bar dataKey="総利息" fill="#1C2B4A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-card overflow-hidden">
          <div className="bg-navy-500 text-white px-4 py-2.5 font-bold text-sm">金融機関比較表</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                {['金融機関','金利','変動/固定','返済期間','月々返済額','総支払額','総利息','判定'].map(h => (
                  <th key={h} scope="col" className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banks.map((b, i) => {
                const isLowest = b.totalInterest === minInterest;
                return (
                  <tr key={b.name} className={`${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} ${isLowest ? 'ring-2 ring-inset ring-success-500' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-xs">{b.name}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-orange-500">{(b.rate * 100).toFixed(3)}%</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${b.type === '変動' ? 'bg-warn-50 text-warn-500' : 'bg-navy-50 text-navy-500'}`}>{b.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs">{b.termYears}年</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold">{yen(b.monthlyPayment)}</td>
                    <td className="px-4 py-2.5 text-right text-xs">{yen(b.totalPayment)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-danger-500 font-semibold">{yen(b.totalInterest)}</td>
                    <td className="px-4 py-2.5 text-center text-xs">{isLowest ? '⭐ 最低金利' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
