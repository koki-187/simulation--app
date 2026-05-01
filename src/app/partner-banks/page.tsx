'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout';

type Tab = 'terass' | 'app' | 'doc' | 'area' | 'agency';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${color}`}>
      {label}
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-bold text-navy-500 border-b border-neutral-100 pb-2 mb-3">
      {children}
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
      {children}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-800 text-sm">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1 text-sm text-neutral-700">
      <span className="text-success-500 mr-2 shrink-0">✓</span>
      <span>{children}</span>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-navy-500 text-white text-xs flex items-center justify-center font-bold">
            {i + 1}
          </span>
          <span className="mt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-neutral-200 bg-navy-500 text-white text-xs px-3 py-2 text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-neutral-200 px-3 py-2 text-neutral-700 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab 1: TERASS提携銀行 ───────────────────────────────────────────────────

function AuJibunSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">① auじぶん銀行 TERASS住宅ローン ＜全国＞</h3>
        <Badge label="TERASS提携" color="bg-orange-500" />
        <Badge label="全国" color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoBox>
          <div className="font-semibold mb-1">特徴</div>
          TERASSが銀行代理業者として申込代行。HP・iYell申込より金利・団信が優遇される
        </InfoBox>
        <InfoBox>
          <div className="font-semibold mb-1">連絡</div>
          Slack @loan_support をメンションして相談
        </InfoBox>
      </div>

      <div>
        <SectionHeader>紹介から実行までの流れ</SectionHeader>
        <StepList
          steps={[
            '紹介フォームにお客様情報を入力（HubSpot）',
            '事前審査開始フロー',
            '本審査開始フロー',
            'WEB金消の準備',
            '決済当日',
          ]}
        />
      </div>

      <div>
        <SectionHeader>本審査の手続き</SectionHeader>
        <Table
          headers={['ステップ', '担当', '内容']}
          rows={[
            ['1', 'エージェント＆お客様', '必要書類を用意・提出（エージェントが代行提出も可）。Slackの@loan_supportへ送付'],
            ['2', 'ローンチーム→お客様', '本審査移行確認の連絡。団信告知・口座開設も依頼'],
            ['3', 'ローンチーム', '本審査開始。銀行からのヒアリングや不備対応はTERASSローンセンターが直接対応'],
            ['4', 'お客様', '団体信用生命保険の告知（融資金額1億超の場合は診断書が必要）'],
            ['5', 'お客様', '口座開設（金消前までに必須。アプリなら即日可）'],
            ['6', 'ローンチーム', '審査結果連絡（お客様はメール、エージェントはSlack）'],
          ]}
        />
      </div>

      <div>
        <SectionHeader>金利優遇割</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'auモバイル優遇割', value: '-0.07%' },
            { label: 'じぶんでんき優遇割', value: '-0.03%' },
            { label: 'J:COM NET優遇割', value: '-0.03%' },
            { label: 'J:COM TV優遇割', value: '-0.02%' },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-neutral-700">{item.label}</span>
              <span className="font-bold text-success-500">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader>決済当日の持ち物</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>実印</CheckItem>
          <CheckItem>本人確認書類（運転免許証・マイナンバーカード等）</CheckItem>
          <CheckItem>健康保険証</CheckItem>
          <CheckItem>印鑑証明書 2通（登記住所・発行後3ヶ月以内）</CheckItem>
          <CheckItem>住民票 1通（世帯全員・続柄記載・発行後3ヶ月以内）</CheckItem>
          <CheckItem>収入印紙（ペアローン・収入合算のみ）</CheckItem>
        </div>
      </div>
    </div>
  );
}

function TerassSpecialSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">② TERASS特別金利ローン</h3>
        <Badge label="TERASS限定" color="bg-orange-500" />
        <Badge label="変動" color="bg-neutral-500" />
      </div>

      <div>
        <SectionHeader>基本情報</SectionHeader>
        <Table
          headers={['項目', '内容']}
          rows={[
            ['金利（変動）', '0.845%（LTV90%以下）/ 1.045%（90%以上）'],
            ['融資金額', '4,000万円〜6億円（ペアは最大12億円）'],
            ['返済期間', '1〜50年'],
            ['手数料', '借入金額の2.2%＋電子契約手数料'],
            ['注意', '正社員・勤続3年以上・年収250万円以上、単身者不可'],
          ]}
        />
      </div>

      <div>
        <SectionHeader>団信内容</SectionHeader>
        <Table
          headers={['種類', '上乗せ金利', '引受会社', '上限']}
          rows={[
            ['一般団信', '無料', 'クレディアグリコル生命', '−'],
            ['がん100%', '+0.10%', 'カーディフ生命', '3億'],
            ['3大疾病＋5つの重度慢性疾患', '+0.30%', 'カーディフ生命', '3億'],
            ['介護保障特約', '+0.03%', '太陽生命', '1億'],
            ['がん50%（先進医療付）', '+0.05%', 'クレディアグリコル生命', '2億'],
            ['W入院サポート団信', '+0.05%', 'カーディフ生命', '3億'],
            ['ワイド団信', '+0.30%', 'クレディアグリコル生命', '−'],
          ]}
        />
      </div>
    </div>
  );
}

function AruhibSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">③ ARUHIフラット35</h3>
        <Badge label="フラット35" color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionHeader>申込フロー〈事前審査〉</SectionHeader>
          <StepList
            steps={[
              '申込書を書類ダウンロードフォームまたはSlackで受取',
              'お客様記入',
              'Slack @loan_support に申込書＋必要書類を添付',
            ]}
          />
        </div>
        <div>
          <SectionHeader>申込フロー〈本審査〉</SectionHeader>
          <StepList
            steps={[
              'Slackで@loan_supportに本審査希望を連絡（買取型 or 保証型、ペアローン有無、郵送先住所を伝える）',
              'ローンチームから申込書類セットを郵送',
              'お客様記入後、返信用封筒でTERASS宛に返送 or 虎ノ門オフィスに持参',
            ]}
          />
        </div>
      </div>

      <InfoBox>
        <span className="font-semibold">問い合わせ：</span> Slack @loan_support
      </InfoBox>
    </div>
  );
}

function Tab1Terass() {
  return (
    <div className="space-y-6">
      <AuJibunSection />
      <TerassSpecialSection />
      <AruhibSection />
    </div>
  );
}

// ─── Tab 2: アプリ申込の銀行 ────────────────────────────────────────────────

function PayPaySection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">④ PayPay銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
      </div>

      <WarningBox>
        エージェントの代理申込は厳禁。お客様自身がアクセスして申込を行うこと
      </WarningBox>

      <div>
        <SectionHeader>申込フロー</SectionHeader>
        <StepList
          steps={[
            'お客様が必要書類を準備',
            'お客様が専用窓口URLにアクセス（ペアローンは二人ともアクセス必要）',
            'お客様が住宅ローン申込ナビに登録',
            '不動産業者名の欄に「TERASS」とエージェント名を記載',
            '審査書類の提出はエージェントが代行可',
          ]}
        />
      </div>

      <InfoBox>
        <div className="font-semibold mb-1">金利情報</div>
        変動金利基準金利 2026年4月1日より 2.68% → 2.93%（+0.25%）
      </InfoBox>

      <div className="text-sm text-neutral-700 space-y-1">
        <div><span className="text-neutral-400">担当：</span>山口 様</div>
        <div><span className="text-neutral-400">TEL：</span><a href="tel:0367434499" className="text-navy-500 hover:underline">03-6743-4499</a></div>
        <div><span className="text-neutral-400">Mail：</span><a href="mailto:teikei-jutaku@paypay-bank.co.jp" className="text-navy-500 hover:underline">teikei-jutaku@paypay-bank.co.jp</a></div>
      </div>
    </div>
  );
}

function MUFJSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">⑤ 三菱UFJ銀行 ＜首都圏・東海・関西・九州＞</h3>
        {['首都圏', '東海', '関西', '九州'].map((a) => (
          <Badge key={a} label={a} color="bg-blue-500" />
        ))}
      </div>

      <div>
        <SectionHeader>アクセスコード</SectionHeader>
        <code className="bg-neutral-100 rounded px-2 py-0.5 font-mono text-sm text-navy-500">
          w-mufg-hgshw001
        </code>
      </div>

      <WarningBox>
        申込後、必ずエージェントから担当者へメール（名刺添付）で連絡。アプリ内にエージェント連絡先入力欄なし
      </WarningBox>

      <div className="text-sm text-neutral-700 space-y-1">
        <div><span className="text-neutral-400">担当：</span>三菱UFJローンビジネス㈱ 日本橋営業部</div>
        <div><span className="text-neutral-400">TEL：</span><a href="tel:0332770911" className="text-navy-500 hover:underline">03-3277-0911</a>（平日9時〜18時）</div>
      </div>

      <InfoBox>
        <span className="font-semibold">金利変更情報：</span>変動金利優遇幅 ▲2.28% → ▲2.205%（△0.075%縮小）
      </InfoBox>
    </div>
  );
}

function ShinseisbiSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">⑥ 住信SBIネット銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
      </div>

      <div className="text-sm text-neutral-700 space-y-1">
        <div>
          <span className="text-neutral-400">WEB申込URL：</span>
          <a href="https://www.netbk.co.jp/contents/kantan-hl-guide/index.html" target="_blank" rel="noopener noreferrer" className="text-navy-500 hover:underline break-all">
            https://www.netbk.co.jp/contents/kantan-hl-guide/index.html
          </a>
        </div>
        <div>
          <span className="text-neutral-400">銀行メール：</span>
          <a href="mailto:teikei_kantan@netbk.co.jp" className="text-navy-500 hover:underline">teikei_kantan@netbk.co.jp</a>
          <span className="text-neutral-400 ml-1 text-xs">（旧アドレス teikei@netbk.co.jp は変更済）</span>
        </div>
      </div>

      <WarningBox>FAX不可 → 全てメールで提出</WarningBox>

      <div className="text-sm text-neutral-700 space-y-1">
        <div><span className="text-neutral-400">担当：</span>岡田 昌祥</div>
        <div><span className="text-neutral-400">TEL：</span><a href="tel:08077100026" className="text-navy-500 hover:underline">080-7710-0026</a></div>
      </div>
    </div>
  );
}

function SMBCSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">⑦ 三井住友銀行（SMBC） ＜首都圏・東海・関西・福岡＞</h3>
        {['首都圏', '東海', '関西', '福岡'].map((a) => (
          <Badge key={a} label={a} color="bg-blue-500" />
        ))}
      </div>

      <div className="text-sm text-neutral-700">
        <span className="text-neutral-400">事前審査URL：</span>
        <a href="https://j-loan.smbc.co.jp/guest" target="_blank" rel="noopener noreferrer" className="text-navy-500 hover:underline">
          https://j-loan.smbc.co.jp/guest
        </a>
      </div>

      <div>
        <SectionHeader>エリア別 企業ID</SectionHeader>
        <Table
          headers={['エリア', '担当窓口', '企業ID']}
          rows={[
            ['首都圏（神奈川以外）', '東京LP 唐鎌 正実', '00000 42112 00001'],
            ['神奈川県', '横浜LP 森本祐希子', '00000 42112 00005'],
            ['東海', '名古屋LP 水野 鋼治', '00000 42112 00002'],
            ['関西', '梅田LP 井口 あや', '00000 42112 00003'],
            ['福岡', '福岡LP 深水', '00000 42112 00004'],
            ['北海道・東北', '事前審査前の案件相談のみ 東京LP唐鎌', '−'],
          ]}
        />
      </div>

      <div>
        <SectionHeader>ローンの特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>最短当日〜翌日審査、電子契約可（印紙不要）</CheckItem>
          <CheckItem>単身・女性に強い</CheckItem>
          <CheckItem>建ぺい・容積オーバー・旧耐震対応可</CheckItem>
          <CheckItem>勤続年数縛りなし、試用期間明け実行可</CheckItem>
          <CheckItem>融資上限3億円</CheckItem>
        </div>
      </div>
    </div>
  );
}

function ResonaSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">⑧ りそな銀行 ＜首都圏・東海・関西・九州＞</h3>
        {['首都圏', '東海', '関西', '九州'].map((a) => (
          <Badge key={a} label={a} color="bg-blue-500" />
        ))}
      </div>

      <WarningBox>事前審査時に謄本（直近3ヶ月以内）の提出が必要</WarningBox>

      <div>
        <SectionHeader>WEB事前審査フロー エージェント側</SectionHeader>
        <StepList
          steps={[
            '初回のみエージェント登録（5分）',
            'ログイン後「紹介コード発行」→「りそな銀行」を選択',
            'お客様名と携帯番号を入力し発行（SMSで通知）',
            'そのまま物件情報を登録',
          ]}
        />
      </div>

      <div>
        <SectionHeader>エリア別担当窓口</SectionHeader>
        <Table
          headers={['エリア', '担当', '業者コード']}
          rows={[
            ['首都圏', '上野LP 大野様・高道様 / 03-3835-1301', '23507001'],
            ['東海', '名古屋駅前支店 井上様・千葉様 / 052-541-2266', '23507004'],
            ['関西', '梅田LP 木下様 / 06-6312-7680', '23507002'],
            ['九州', '九州LP 猶塚様 / 092-714-6715', '23507003'],
          ]}
        />
      </div>
    </div>
  );
}

function SBIShinseiSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">⑨ SBI新生銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
        <Badge label="2024年7月提携開始" color="bg-purple-600" />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-neutral-500 text-sm">提携金利</span>
        <span className="text-success-500 font-bold text-2xl">0.520%</span>
      </div>

      <div>
        <SectionHeader>強み</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          <CheckItem>35年超ローン（最大50年）：上乗せ+0.1%（一律）</CheckItem>
          <CheckItem>収入合算者：最低年収100万円、雇用形態問わず100%合算可</CheckItem>
          <CheckItem>返済比率：年収問わず一律40%まで、審査金利3.0%</CheckItem>
          <CheckItem>転職者：勤続年数不問、オファーレターでも審査可</CheckItem>
          <CheckItem>産育休：休暇期間を含まない年度の源泉徴収票100%で審査可</CheckItem>
          <CheckItem>住み替えローン（後売り）：現自宅ローンを返済比率に含めず審査可</CheckItem>
        </div>
      </div>
    </div>
  );
}

function RowkinSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">ろうきん（労働金庫） ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
        <Badge label="会員向け優遇" color="bg-green-600" />
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>組合員・会員向け優遇金利（変動0.375%〜）</CheckItem>
          <CheckItem>労働組合・生協組合員が対象（非組合員も入会で利用可）</CheckItem>
          <CheckItem>会員向けの特別優遇あり</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>各都道府県労働金庫の窓口・Web
      </InfoBox>
    </div>
  );
}

function ChuoRowkinSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">中央労働金庫 ＜首都圏＞</h3>
        <Badge label="首都圏" color="bg-blue-500" />
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>首都圏エリア対応（1都3県・茨城・栃木・群馬・長野・新潟）</CheckItem>
          <CheckItem>変動金利優遇（組合員向け）</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>窓口申込
      </InfoBox>
    </div>
  );
}

function YokohamaBankSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">横浜銀行 ＜神奈川・東京＞</h3>
        <Badge label="神奈川" color="bg-blue-500" />
        <Badge label="東京" color="bg-blue-500" />
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>神奈川・東京エリアに強み</CheckItem>
          <CheckItem>変動〜固定まで幅広い商品ラインナップ</CheckItem>
          <CheckItem>土地先行融資（分割実行）対応可</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>アプリ・Web・窓口
      </InfoBox>
    </div>
  );
}

function IonBankSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">イオン銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-neutral-500 text-sm">変動金利</span>
        <span className="text-success-500 font-bold text-2xl">1.130%</span>
        <span className="text-neutral-400 text-sm">（LTV≤80%）</span>
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>イオングループ利用者への優遇あり</CheckItem>
          <CheckItem>がん100%保障団信が無料付帯</CheckItem>
        </div>
      </div>
      <WarningBox>
        全額繰上返済手数料 55,000円が発生します
      </WarningBox>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>Web申込
      </InfoBox>
    </div>
  );
}

function MizuhoBankSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">みずほ銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
        <Badge label="メガバンク" color="bg-neutral-500" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-neutral-500 text-sm">変動金利</span>
        <span className="text-success-500 font-bold text-2xl">1.025%</span>
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>大手メガバンクの安心感・全国対応</CheckItem>
          <CheckItem>みずほダイレクトアプリで手続き可能</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>アプリ・窓口
      </InfoBox>
    </div>
  );
}

function SMTBSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">三井住友信託銀行 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
        <Badge label="信託銀行" color="bg-neutral-500" />
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>信託銀行ならではの資産運用連携が強み</CheckItem>
          <CheckItem>財産管理・相続など総合サービス提供</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>窓口
      </InfoBox>
    </div>
  );
}

function YuchoBankSection() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-navy-500 text-base">ゆうちょ銀行 フラット35取扱 ＜全国＞</h3>
        <Badge label="全国" color="bg-blue-500" />
        <Badge label="フラット35" color="bg-green-600" />
      </div>
      <div>
        <SectionHeader>特徴</SectionHeader>
        <div className="space-y-1.5">
          <CheckItem>全国の郵便局・ゆうちょ銀行でフラット35取扱</CheckItem>
          <CheckItem>全期間固定で返済額が安定</CheckItem>
        </div>
      </div>
      <InfoBox>
        <span className="font-semibold">申込方法：</span>窓口
      </InfoBox>
    </div>
  );
}

function Tab2App() {
  return (
    <div className="space-y-6">
      <PayPaySection />
      <MUFJSection />
      <ShinseisbiSection />
      <SMBCSection />
      <ResonaSection />
      <SBIShinseiSection />
      <RowkinSection />
      <ChuoRowkinSection />
      <YokohamaBankSection />
      <IonBankSection />
      <MizuhoBankSection />
      <SMTBSection />
      <YuchoBankSection />
    </div>
  );
}

// ─── Tab 3: 書類申込の銀行 ──────────────────────────────────────────────────

function Tab3Doc() {
  const banks = [
    {
      name: '千葉銀行',
      contact: '東京ローンセンター セグチ様',
      email: 'tokyolc@chibabank.co.jp',
      tel: '03-5715-6391',
      method: '紙の申込書（HP DL）→エージェントがメール提出',
      notes: '千葉・首都圏エリア対応',
    },
    {
      name: 'きらぼし銀行',
      contact: '新宿支店 矢浪',
      email: 'yanami@kiraboshibank.co.jp',
      tel: '03-3365-3436',
      method: '紙の申込書（HP DL）→エージェントがメール提出',
      notes: '',
    },
    {
      name: 'ドコモファイナンス（フラット35）',
      contact: 'NEOモーゲージ 橋野',
      email: '',
      tel: '080-5892-0451',
      method: 'フラット35（オリックス）提携',
      notes: '',
    },
    {
      name: 'スルガ銀行',
      contact: '新宿・名古屋・大阪・福岡・札幌',
      email: '',
      tel: '',
      method: '①住宅ローン（最大4億）②クレディセゾン保証（最大1億・おまとめ可）',
      notes: '',
    },
    {
      name: '協同住宅ローン',
      contact: '野々下 直也',
      email: 'nonoshita-n@kyojyu.co.jp',
      tel: '03-5656-9804',
      method: '個信難・セカンドハウス可・1都3県・電子売買不可',
      notes: '',
    },
    {
      name: '埼玉りそな銀行',
      contact: '埼玉・首都圏エリア担当窓口',
      email: '',
      tel: '',
      method: '書類申込・窓口',
      notes: '埼玉・首都圏エリア対応。マイゲート経由で繰上返済手数料無料',
    },
    {
      name: 'SBI新生銀行（書類申込）',
      contact: '',
      email: '',
      tel: '',
      method: '書類申込',
      notes: '5年ルール・1.25倍ルールなし（金利変動即反映）、繰上返済無料、変動金利1.080%',
    },
  ];

  return (
    <div className="space-y-4">
      {banks.map((bank) => (
        <div key={bank.name} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <div className="font-bold text-navy-500 text-base mb-2">{bank.name}</div>
          {bank.notes && (
            <div className="text-xs text-neutral-500 mb-2 bg-neutral-50 rounded px-2 py-1">{bank.notes}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-neutral-700">
            <div>
              <div className="text-neutral-400 text-xs mb-1">担当</div>
              <div>{bank.contact || '—'}</div>
              {bank.tel && (
                <div className="mt-1">
                  <a href={`tel:${bank.tel.replace(/-/g, '')}`} className="text-navy-500 hover:underline">
                    {bank.tel}
                  </a>
                </div>
              )}
              {bank.email && (
                <div className="mt-1">
                  <a href={`mailto:${bank.email}`} className="text-navy-500 hover:underline break-all">
                    {bank.email}
                  </a>
                </div>
              )}
            </div>
            <div>
              <div className="text-neutral-400 text-xs mb-1">申込方法</div>
              <div>{bank.method}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 4: エリア別 金融機関 ────────────────────────────────────────────────

function Tab4Area() {
  const nonPartnerBanks = [
    { name: '関西みらい銀行', area: '関西エリア', method: '紙の申込書 or いえーる経由' },
    { name: '但馬銀行', area: '大阪府・兵庫県', method: '直接申込 or いえーる経由' },
    { name: '沖縄ろうきん', area: '沖縄県', method: 'HPから仮審査申込' },
    { name: '横浜銀行', area: '神奈川県・東京都', method: 'WEB申込 or 紙' },
    { name: '静岡銀行', area: '静岡・神奈川・東京一部・愛知一部', method: '紙の申込書。買い先行・転職直後に強い' },
    { name: '南都銀行', area: '奈良・大阪・京都・和歌山', method: '紙の申込書 or いえーる経由。全工程非対面対応可' },
  ];

  const regions = [
    { name: '北海道', banks: ['北海道銀行', '北陸銀行', '北洋銀行', '北海道ろうきん', '北海道信用金庫'] },
    { name: '首都圏', banks: ['八十二銀行（東京都・埼玉・群馬・長野・名古屋市内・大阪市内）'] },
    { name: '東海', banks: ['三十三銀行（東海・大阪一部）', '大垣共立銀行（岐阜・愛知・三重・滋賀一部）'] },
    { name: '関西', banks: ['京都銀行（京都・大阪・奈良）', '紀陽銀行（大阪・奈良・和歌山）', '滋賀銀行（滋賀・京都・大阪一部）'] },
    { name: '中四国', banks: ['広島銀行', '中国銀行（兵庫含む）', 'もみじ銀行（中国のみ）', '百十四銀行（香川・岡山一部）'] },
    { name: '九州', banks: ['熊本銀行（熊本）', '宮崎銀行（宮崎・鹿児島）', '佐賀銀行（佐賀・福岡・長崎一部）'] },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <SectionHeader>TERASS非提携銀行</SectionHeader>
        <Table
          headers={['銀行', 'エリア', '申込方法']}
          rows={nonPartnerBanks.map((b) => [b.name, b.area, b.method])}
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <SectionHeader>エリア別 金融機関窓口</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {regions.map((region) => (
            <div key={region.name} className="bg-neutral-50 rounded-lg p-3">
              <div className="font-semibold text-navy-500 text-sm mb-2">{region.name}</div>
              <ul className="space-y-1">
                {region.banks.map((bank) => (
                  <li key={bank} className="text-sm text-neutral-700 flex items-start gap-1.5">
                    <span className="text-neutral-300 mt-0.5">•</span>
                    {bank}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-navy-500 text-white p-5 space-y-4">
        <div>
          <div className="font-bold text-base mb-2">三栄建築設計 売主物件 取扱可能金融機関</div>
          <div className="text-navy-100 text-sm space-y-1">
            <div><span className="font-semibold text-white">全国：</span>三井住友銀行・三菱UFJ銀行・りそな銀行・住信SBIネット銀行</div>
            <div><span className="font-semibold text-white">東海：</span>東海労金・三十三銀行・大垣共立銀行・岡崎信用金庫</div>
          </div>
        </div>
        <div>
          <div className="font-bold text-base mb-2">土地先行融資（分割実行）が可能な金融機関</div>
          <div className="text-navy-100 text-sm">
            住信SBIネット銀行・三井住友銀行・三菱UFJ銀行・りそな銀行（土地のみ）・横浜銀行・UI銀行・山梨中央銀行・静岡銀行
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: 代理店窓口 ─────────────────────────────────────────────────────

function Tab5Agency() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-navy-500 text-base">⑮ いえーるダンドリ【ローンアレンジャー】</h3>

        <div className="space-y-1.5">
          <CheckItem>ネット銀行・地銀・信金・モーゲージバンクから幅広く提案</CheckItem>
          <CheckItem>LINEのようなチャットで専門オペレーターが対応</CheckItem>
          <CheckItem>アプリ（iOS/Android）またはWEB版で利用</CheckItem>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-700 font-bold text-sm mb-1">インセンティブ</div>
          <div className="text-orange-800 text-lg font-bold">
            iYell経由で実行まで至った案件は <span className="text-2xl">2万円/件</span>
          </div>
          <div className="text-orange-600 text-sm mt-1">（2026年12月末実行まで）</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-navy-500 text-base">⑯ 住まプラ</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['西葛西', '横浜', '池袋'].map((loc) => (
            <div key={loc} className="bg-neutral-50 rounded-lg p-3 text-center">
              <div className="text-neutral-500 text-xs mb-1">担当者</div>
              <div className="font-semibold text-navy-500">{loc}</div>
            </div>
          ))}
        </div>

        <div>
          <SectionHeader>取扱商品</SectionHeader>
          <div className="space-y-1.5">
            <CheckItem>auじぶん銀行（代理店）</CheckItem>
            <CheckItem>ソニー銀行</CheckItem>
            <CheckItem>フラット35（クレセゾン・カシワバラ）</CheckItem>
            <CheckItem>オリックス投資ローン</CheckItem>
          </div>
        </div>

        <InfoBox>お客様と直接やりとり・訪問対応可</InfoBox>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'terass', label: '🏠 TERASS提携' },
  { id: 'app', label: '📱 アプリ申込' },
  { id: 'doc', label: '📄 書類申込' },
  { id: 'area', label: '🌍 エリア別' },
  { id: 'agency', label: '🔄 代理店' },
];

export default function PartnerBanksPage() {
  const [activeTab, setActiveTab] = useState<Tab>('terass');

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-navy-500 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-xl tracking-wide">提携金融機関ガイド</h1>
          <p className="text-navy-100 text-xs mt-1">TERASS提携銀行の申込手順・担当者・審査条件</p>
        </div>
        <span className="flex-shrink-0 bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
          ※ エージェント専用 社内資料
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 px-6 pt-4 pb-0">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-navy-500 text-white border-navy-500'
                  : 'bg-white border border-neutral-200 text-navy-500 hover:bg-navy-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'terass' && <Tab1Terass />}
        {activeTab === 'app' && <Tab2App />}
        {activeTab === 'doc' && <Tab3Doc />}
        {activeTab === 'area' && <Tab4Area />}
        {activeTab === 'agency' && <Tab5Agency />}
      </div>
    </AppShell>
  );
}
