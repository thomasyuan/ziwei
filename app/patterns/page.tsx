/**
 * /patterns —— 格局目录
 *
 * 数据由排盘引擎扫盘生成（lib/interpret/pattern-catalog.ts，11,088 张盘覆盖 70 种格局）。
 * 每条格局：名称、吉凶等级、描述、涉及宫位、古籍出处与一条「示例成立条件」。
 */

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PATTERN_CATALOG } from '@/lib/interpret/pattern-catalog';

export const metadata = {
  title: '紫微斗数格局目录 · 70 种经典格局 · 紫微斗数研究',
  description: '紫微斗数格局目录：紫府同宫、君臣庆会、府相朝垣、机月同梁、杀破狼、阳梁昌禄、马头带箭等 70 种格局，含吉凶等级、成立条件与古籍出处。',
  keywords: '紫微斗数格局, 紫府同宫, 君臣庆会, 府相朝垣, 机月同梁, 杀破狼, 阳梁昌禄, 马头带箭, 紫微斗数全书',
};

const LEVELS = {
  excellent: { label: '上格', color: '#B8922A', bg: 'rgba(184,146,42,0.08)' },
  good: { label: '中格', color: '#2D7A4A', bg: 'rgba(45,122,74,0.08)' },
  neutral: { label: '平格', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
  caution: { label: '需防', color: '#A83228', bg: 'rgba(168,50,40,0.08)' },
} as const;

export default function PatternsPage() {
  const groups: Record<string, typeof PATTERN_CATALOG> = { excellent: [], good: [], neutral: [], caution: [] };
  for (const p of PATTERN_CATALOG) groups[p.level].push(p);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <Header />

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-14 pb-8 text-center">
        <div style={{ fontSize: '11px', letterSpacing: '0.45em', color: 'var(--ac)', marginBottom: '14px' }}>PATTERN CATALOG</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
          格局目录 · {PATTERN_CATALOG.length} 种
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.9, maxWidth: '720px', margin: '14px auto 0' }}>
          格局是星曜组合的命名。本目录由排盘引擎扫
          <span style={{ color: 'var(--ac)' }}> 11,088 张真实命盘 </span>
          收集而来，逐条给出成立条件、加分项、破格项与古籍出处；
          你的命盘符合哪几格，可在排盘页查看，或在格局卡片里看命盘依据。
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link href="/chart" className="btn-accent">排盘看自己的格局</Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-20">
        {(['excellent', 'good', 'neutral', 'caution'] as const).map(lv => {
          const g = groups[lv];
          if (!g.length) return null;
          const L = LEVELS[lv];
          return (
            <div key={lv} style={{ marginTop: '34px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
                <span style={{
                  fontSize: '11px', letterSpacing: '0.3em', padding: '5px 12px', borderRadius: '999px',
                  color: L.color, background: L.bg, border: `1px solid ${L.color}33`,
                }}>{L.label}（{g.length}）</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {g.map(p => (
                  <div key={p.name} className="card p-5">
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.06em' }}>
                      {p.name}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.85, marginTop: '8px' }}>
                      {p.description}
                    </p>
                    {p.sample && (
                      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.75 }}>
                        <div>
                          <span style={{ color: 'var(--ac)', opacity: 0.8 }}>必须：</span>
                          {p.sample.required.join(' + ')}
                        </div>
                        {p.sample.bonus?.length ? (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ color: '#2D7A4A' }}>加分：</span>{p.sample.bonus.join('、')}
                          </div>
                        ) : null}
                        {p.sample.breaking?.length ? (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ color: '#A83228' }}>破格：</span>{p.sample.breaking.join('、')}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {p.source && (
                      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--tx-3)' }}>
                        出处：{p.source}
                      </div>
                    )}
                    <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.1em' }}>
                      涉及宫位：{p.palaces.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="card p-6" style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>怎么用这份目录</div>
          <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            格局是「组合的名字」，不是吉利的标签。同一格在不同盘上的表现差别很大：庙旺与落陷、六吉与六煞、
            四化落宫都会改结果。目录里的「必须 / 加分 / 破格」三层结构就是给这个用的——先满足必须项，
            再看加分与破格谁占上风。上格破格后往往不如中格稳固，这是斗数里常见的事。
          </p>
          <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.9, marginTop: '8px' }}>
            格局识别走倪师口径：以本命四化与三方四正为主，不用宫干自化与来因宫等飞星派工具判格局。
            出处标注为《紫微斗数全书》《紫微斗数全集》《骨髓赋》等公版古籍。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
