'use client';
import { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ChartSummary from '@/components/ChartSummary';
import ReadingPanel, { type ReadingData } from '@/components/ReadingPanel';
import AiPanel from '@/components/AiPanel';
import PatternsCard from '@/components/PatternsCard';
import StarDetailPanel from '@/components/StarDetailPanel';
import Header from '@/components/Header';
import ShareModal from '@/components/ShareModal';
import { formToBirthInfo, formToSearchParams, searchParamsToForm } from '@/lib/ziwei/share';
import { generateChart } from '@/lib/ziwei/algorithm';
import { TOPIC_PALACE, PALACE_NAME_TO_KEY, type TopicKey } from '@/lib/interpret/types';
import { STAR_TO_SLUG } from '@/lib/seo/slugs';
import type { BirthInfo, ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import type { Pattern } from '@/lib/ziwei/patterns';

const TOPIC_BY_PALACE_KEY: Record<string, TopicKey> = (() => {
  const m: Record<string, TopicKey> = {};
  for (const t of Object.keys(TOPIC_PALACE) as TopicKey[]) m[TOPIC_PALACE[t]] = t;
  return m;
})();

function WorkspaceInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [readings, setReadings] = useState<ReadingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'mingpan' | 'daxian' | 'liunian'>('mingpan');
  const [year, setYear] = useState(new Date().getFullYear());
  const [topic, setTopic] = useState<TopicKey>('overview');
  const [palace, setPalace] = useState<Palace | null>(null);
  const [starDetail, setStarDetail] = useState<{ star: Star; palace: Palace } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchReadings = useCallback(async (c: ZiweiChart, y: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart: c, year: y }),
      });
      const j = await res.json();
      if (Array.isArray(j.readings)) {
        setReadings(j.readings);
        setPatterns(j.patterns ?? []);
      }
    } catch { /* 静默：面板显示为空 */ }
    finally { setLoading(false); }
  }, []);

  const openChart = useCallback((info: BirthInfo) => {
    try {
      const c = generateChart(info);
      setChart(c);
      setPalace(null);
      setStarDetail(null);
      void fetchReadings(c, year);
    } catch (e) {
      setChart(null);
      alert(e instanceof Error ? e.message : '起盘失败：请检查出生资料');
    }
  }, [fetchReadings, year]);

  // 分享链接 / URL 参数自动起盘
  useEffect(() => {
    const p = new URLSearchParams(params.toString());
    const form = searchParamsToForm(p);
    if (!form) return;
    const info = formToBirthInfo({
      name: form.name ?? '', year: form.year ?? '', month: form.month ?? '', day: form.day ?? '',
      clockHour: form.clockHour ?? '8', clockMinute: form.clockMinute ?? '0',
      unknownTime: form.unknownTime ?? false,
      province: form.province ?? '', city: form.city ?? '',
      longitude: form.longitude ?? 120,
      gender: form.gender ?? 'male',
    } as BirthFormState);
    openChart(info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 年份变化 → 重新生成流年解读（防抖）
  useEffect(() => {
    if (!chart) return;
    const t = setTimeout(() => void fetchReadings(chart, year), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const handlePalace = (p: Palace) => {
    setPalace(p);
    const key = PALACE_NAME_TO_KEY[p.name];
    if (key) setTopic(TOPIC_BY_PALACE_KEY[key] ?? 'overview');
  };

  const shareUrl = useMemo(() => {
    if (!chart) return '';
    const b = chart.birthInfo;
    const p = new URLSearchParams({
      y: String(b.year), m: String(b.month), d: String(b.day),
      h: String(b.hour), g: b.gender === 'male' ? 'm' : 'f',
    });
    if (b.name) p.set('n', b.name);
    if (b.province) p.set('p', b.province);
    if (b.city) p.set('c', b.city);
    return typeof location !== 'undefined' ? `${location.origin}/chart?${p.toString()}` : '';
  }, [chart]);

  if (!chart) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-12">
        <Header />
        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.5em]" style={{ color: 'var(--ac)' }}>ZI WEI DOU SHU</div>
          <h1 className="mt-3 text-[28px] font-bold" style={{ color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
            紫微斗数排盘
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--tx-2)', maxWidth: '560px', margin: '0 auto' }}>
            填入出生资料，即时生成完整命盘：十四主星、六吉六煞、四化与十二宫。
            真太阳时按出生地经度校正，晚子时换日按真太阳时判定。
          </p>
        </div>
        <BirthForm onSubmit={openChart} />
        <p className="mt-6 text-[11px] leading-relaxed text-center" style={{ color: 'var(--tx-3)' }}>
          出生资料只用于起盘，不存储于服务端；AI 追问会把命盘摘要送到所配置的大模型接口。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1240px] px-3 sm:px-6 py-6">
      <Header />
      {/* 顶部操作条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setChart(null); setPalace(null); setReadings([]); }}
            className="btn-ghost" style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            ← 重新起盘
          </button>
          <div className="text-[12px]" style={{ color: 'var(--tx-1)' }}>
            <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{chart.birthInfo.name || '命盘'}</span>
            <span style={{ color: 'var(--tx-3)', marginLeft: '8px', fontSize: '11px' }}>
              {chart.birthInfo.year}/{chart.birthInfo.month}/{chart.birthInfo.day} · {chart.wuxingJuName} · {chart.yinYangGender}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/heming" className="btn-ghost" style={{ padding: '8px 16px', fontSize: '12px' }}>合盘</Link>
          <button onClick={() => setShareOpen(true)} className="btn-accent" style={{ padding: '8px 18px', fontSize: '12px' }}>
            分享命盘卡
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] items-start">
        <div className="w-full">
          <ChartBoard
            chart={chart}
            view={view}
            liunianYear={year}
            onViewChange={setView}
            onYearChange={setYear}
            onPalaceSelect={handlePalace}
            onStarSelect={(s, p) => setStarDetail({ star: s, palace: p })}
          />
        </div>

        <div className="space-y-5">
          {palace && (
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--bdr)' }}>
              <div className="text-[11px] tracking-[0.3em] mb-2" style={{ color: 'var(--tx-3)' }}>已选宫位 · 已切到对应主题</div>
              <div className="text-[13px]" style={{ color: 'var(--tx-0)' }}>
                {palace.name === '命宫' ? '命宫' : palace.name + '宫'}（{['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][palace.branch]}）
                · 主星 {palace.stars.filter(s => s.type === 'major').map(s => s.name).join('、') || `空宫借${palace.borrowedFromName ?? ''}`}
              </div>
              {(() => {
                const majors = palace.stars.filter(s => s.type === 'major').map(s => s.name);
                const first = majors[0] ?? palace.borrowedStars?.[0];
                const slug = first ? STAR_TO_SLUG[first] : null;
                if (!slug) return null;
                return (
                  <Link href={`/knowledge/${slug}/${topic}`} style={{ fontSize: '11px', color: 'var(--ac)', marginTop: '6px', display: 'inline-block' }}>
                    读这篇：{first} 在{palace.name === '命宫' ? '命宫' : palace.name + '宫'} · 知识库 →
                  </Link>
                );
              })()}
            </div>
          )}

          <ReadingPanel
            readings={readings}
            activeTopic={topic}
            onTopicChange={setTopic}
            liunianYear={year}
            onYearChange={setYear}
            loading={loading}
          />

          <AiPanel chart={chart} topic={topic} palaceName={palace?.name} />

          <PatternsCard chart={chart} />
          <ChartSummary chart={chart} />
        </div>
      </div>

      {starDetail && (
        <div className="mt-5">
          <StarDetailPanel
            star={starDetail.star}
            palaceName={starDetail.palace.name}
            onClose={() => setStarDetail(null)}
          />
        </div>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        chart={chart}
        birth={{
          year: String(chart.birthInfo.year), month: String(chart.birthInfo.month), day: String(chart.birthInfo.day),
          hour: String(((chart.birthInfo.hour * 2 - 1 + 24) % 24)), minute: '0',
          gender: chart.birthInfo.gender, city: chart.birthInfo.city,
        }}
        highlight={patterns.slice(0, 3).map(p => p.name).join(' · ')}
      />
    </main>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[12px]" style={{ color: 'var(--tx-3)' }}>载入命盘…</div>}>
      <WorkspaceInner />
    </Suspense>
  );
}
