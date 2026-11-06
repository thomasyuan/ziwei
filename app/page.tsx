'use client';
import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import StarField from '@/components/StarField';
import { ALL_STARS, STAR_TO_SLUG } from '@/lib/seo/slugs';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import { SHICHEN } from '@/lib/ziwei/constants';

function FadeIn({ children, delay = 0, y = 24, className = '' }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    title: '安星排盘',
    lines: ['纳音五行局起盘，命宫逆数生时、身宫顺数生时', '十四主星、六吉六煞与杂曜全量入宫', '真太阳时校正（经度差 + 均时差）、中国 1986–1991 夏令时'],
    href: '/chart',
    cta: '排盘',
  },
  {
    title: '四化飞星',
    lines: ['生年四化、宫干自化、大限与流年四化叠层', '四化入宫、入对宫、入三合逐条标注', '禄权科忌各有专论，庙旺与落陷分档断语'],
    href: '/chart',
    cta: '看四化',
  },
  {
    title: '十三维解读',
    lines: ['命格、性格、感情、事业、财运、健康', '兄弟、子女、迁移、人际、田宅、福德、父母', '每一维都按本宫主星 + 四化 + 辅煞 + 三方四正 + 运限生成'],
    href: '/chart',
    cta: '读命盘',
  },
  {
    title: '格局识别',
    lines: ['紫府同宫、君臣庆会、杀破狼、机月同梁等 30 余格', '条件分层：必须 / 加分 / 破格，出处可查', '吉凶等级并陈，优势与功课一目了然'],
    href: '/patterns',
    cta: '看格局',
  },
  {
    title: '古籍原文',
    lines: ['《紫微斗数全书》《紫微斗数全集》《骨髓赋》全文', '全文检索、章节阅读、段落锚点', '公版原文，逐字可查，引证可核对'],
    href: '/library',
    cta: '读古籍',
  },
  {
    title: 'AI 追问',
    lines: ['把命盘摘要交给大模型，按倪师体系口径追问', '事业、感情、大限、流年自由提问', '支持 OpenAI 兼容接口（DeepSeek / 通义 / 智谱等）'],
    href: '/chart',
    cta: '追问',
  },
];

const STEPS = [
  { n: '01', t: '填出生资料', d: '公历生日、出生地（用于真太阳时）、时辰；不确定时辰可勾「时辰不详」按子时起盘。' },
  { n: '02', t: '即时起盘', d: '浏览器与服务器内跑开源安星引擎，不上传个人资料到第三方；同一输入恒得同一张盘。' },
  { n: '03', t: '逐维解读', d: '十三维内容按本宫、四化、辅煞、三方四正、格局与运限生成；可追问 AI 深挖。' },
];

export default function Home() {
  const router = useRouter();
  const [quick, setQuick] = useState({ year: '', month: '', day: '', hour: '5', gender: 'male' as 'male' | 'female' });

  const canGo = quick.year && quick.month && quick.day;

  const go = () => {
    if (!canGo) return;
    const p = new URLSearchParams({
      y: quick.year, m: quick.month, d: quick.day,
      sh: quick.hour, g: quick.gender === 'male' ? 'm' : 'f',
    });
    router.push(`/chart?${p.toString()}`);
  };

  const stats = useMemo(() => ({
    books: ALL_BOOKS.length,
    paragraphs: TOTAL_PARAGRAPHS,
    combos: ALL_STARS.length * 13,
  }), []);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <StarField />
        <div className="relative z-10 mx-auto max-w-[1180px] px-4 sm:px-6 pt-20 pb-16 text-center">
          <FadeIn>
            <div style={{ fontSize: '11px', letterSpacing: '0.5em', color: 'var(--ac)', marginBottom: '18px' }}>
              ZI WEI DOU SHU · 紫微斗数
            </div>
            <h1 style={{
              fontSize: 'clamp(30px, 6vw, 56px)', fontWeight: 700, color: 'var(--tx-0)',
              letterSpacing: '0.1em', lineHeight: 1.25,
            }}>
              排一张盘，读十三维
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--tx-2)', marginTop: '16px', lineHeight: 1.9, maxWidth: '640px', margin: '16px auto 0' }}>
              开源安星引擎即时起盘，十四主星、六吉六煞、四化飞星全部入宫；
              命格、性格、感情、事业、财运、健康、兄弟、子女、迁移、人际、田宅、福德、父母——十三维逐条生成，
              每一句都能追到本宫星曜与古籍原文。
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mx-auto mt-10 max-w-[860px] rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--ac-bdr)', boxShadow: 'var(--sh-md)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-[110px_1fr_1fr_150px_120px_auto] gap-3 items-end">
                <label style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '6px' }}>年</div>
                  <input className="input-base" placeholder="1990" value={quick.year}
                    onChange={e => setQuick({ ...quick, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                </label>
                <label style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '6px' }}>月</div>
                  <input className="input-base" placeholder="1" value={quick.month}
                    onChange={e => setQuick({ ...quick, month: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                </label>
                <label style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '6px' }}>日</div>
                  <input className="input-base" placeholder="15" value={quick.day}
                    onChange={e => setQuick({ ...quick, day: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                </label>
                <label style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '6px' }}>时辰</div>
                  <select className="input-base" value={quick.hour} onChange={e => setQuick({ ...quick, hour: e.target.value })}>
                    {SHICHEN.map((s, i) => <option key={i} value={i}>{s.name} {s.range}</option>)}
                  </select>
                </label>
                <label style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '6px' }}>性别</div>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map(g => (
                      <button key={g} onClick={() => setQuick({ ...quick, gender: g })}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                          border: `1px solid ${quick.gender === g ? 'var(--ac-bdr)' : 'var(--bdr-med)'}`,
                          background: quick.gender === g ? 'var(--ac-bg)' : 'transparent',
                          color: quick.gender === g ? 'var(--ac)' : 'var(--tx-2)',
                        }}>
                        {g === 'male' ? '男' : '女'}
                      </button>
                    ))}
                  </div>
                </label>
                <div>
                  <div style={{ fontSize: '10px', color: 'transparent', marginBottom: '6px' }}>·</div>
                  <button className="btn-accent" style={{ padding: '10px 22px', opacity: canGo ? 1 : 0.5 }} onClick={go}>
                    起盘
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '12px', textAlign: 'left' }}>
                要更精确（出生地、真太阳时、时辰不详）请用完整表单 →
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/chart" className="btn-accent">完整排盘表单</Link>
              <Link href="/knowledge" className="btn-ghost">十四主星知识库</Link>
              <Link href="/heming" className="btn-ghost">合盘分析</Link>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── 流程 ── */}
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-16">
        <FadeIn>
          <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'var(--ac)', textAlign: 'center', marginBottom: '32px' }}>
            HOW IT WORKS
          </div>
        </FadeIn>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.12}>
              <div className="card p-6 h-full">
                <div style={{ fontSize: '28px', color: 'var(--ac)', opacity: 0.35, fontWeight: 700, marginBottom: '10px' }}>{s.n}</div>
                <div style={{ fontSize: '15px', color: 'var(--tx-0)', fontWeight: 600, marginBottom: '8px' }}>{s.t}</div>
                <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.85 }}>{s.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── 能力 ── */}
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-10">
        <FadeIn>
          <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'var(--ac)', textAlign: 'center', marginBottom: '32px' }}>
            WHAT YOU GET
          </div>
        </FadeIn>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={(i % 3) * 0.1}>
              <div className="card p-6 h-full flex flex-col">
                <div style={{ fontSize: '16px', color: 'var(--tx-0)', fontWeight: 600, marginBottom: '12px' }}>{f.title}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', flex: 1 }}>
                  {f.lines.map(l => (
                    <li key={l} style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.8, marginBottom: '8px', paddingLeft: '14px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--ac)', opacity: 0.6 }}>·</span>
                      {l}
                    </li>
                  ))}
                </ul>
                <Link href={f.href} style={{ fontSize: '12px', color: 'var(--ac)', marginTop: '14px', textDecoration: 'none' }}>
                  {f.cta} →
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── 十四主星 ── */}
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-16">
        <FadeIn>
          <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'var(--ac)', textAlign: 'center', marginBottom: '14px' }}>
            FOURTEEN MAIN STARS
          </div>
          <div style={{ fontSize: '22px', color: 'var(--tx-0)', textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em' }}>
            十四主星 · 逐星深读
          </div>
          <p style={{ fontSize: '12px', color: 'var(--tx-3)', textAlign: 'center', marginTop: '10px' }}>
            {stats.combos} 个「主星 × 主题」专题，每篇含定调、论断、命盘依据与古籍引证
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-8">
            {ALL_STARS.map(star => (
              <Link key={star} href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
                className="card-flat p-4 text-center" style={{ textDecoration: 'none' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.14em' }}>{star}</div>
                <div style={{ fontSize: '10px', color: 'var(--tx-3)', marginTop: '6px', letterSpacing: '0.1em' }}>
                  {STAR_TO_SLUG[star]}
                </div>
              </Link>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* ── 数据 ── */}
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-12">
        <FadeIn>
          <div className="card p-8 grid gap-6 sm:grid-cols-3 text-center">
            {[
              { v: stats.books, l: '部古籍全文' },
              { v: stats.paragraphs, l: '段原文可检索' },
              { v: 13, l: '维解读维度' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: '34px', color: 'var(--ac)', fontWeight: 700 }}>{s.v}</div>
                <div style={{ fontSize: '12px', color: 'var(--tx-2)', marginTop: '6px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ marginTop: '28px', fontSize: '12px', color: 'var(--tx-3)', textAlign: 'center', lineHeight: 1.9, maxWidth: '760px', margin: '28px auto 0' }}>
            排盘内核（安星算法、四化、格局识别、古籍原文）来自开源仓库，MIT 授权；
            论断库为本站原创编纂，义理依据公版古籍与倪海厦《天纪》体系。
            紫微斗数在六亲判断上历来偏弱，父母、兄弟、子女三维内容仅供参考。
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
