import Link from 'next/link';
import Footer from '@/components/Footer';
import { FAMOUS_PERSONS, FAMOUS_CATEGORIES, getFamousByCategory } from '@/lib/ziwei/famous';
import { SHICHEN } from '@/lib/ziwei/constants';

export const metadata = {
  title: '名人紫微命盘 · 排盘对照 · 紫微斗数研究',
  description: '以公开记录的出生日期起盘的名人命盘集：商业、文艺、历史、体育、科技。时辰多为估算值，点进去可看完整命盘与格局。',
  keywords: '紫微斗数 名人命盘, 名人 紫微斗数, 命盘案例',
};

export default function FamousPage() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-14 pb-8 text-center">
        <div style={{ fontSize: '11px', letterSpacing: '0.45em', color: 'var(--ac)', marginBottom: '14px' }}>CASE CHARTS</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
          名人命盘对照
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.9, maxWidth: '720px', margin: '14px auto 0' }}>
          全部按公开记录的出生日期起盘，时辰为估算（部分有文献记载）。
          名人盘的真正价值不在「验证名人」，而在拿来做对照练习：看格局、看四化落宫、看大限与生平事件是否对得上。
        </p>
        <p style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '10px', lineHeight: 1.8, maxWidth: '720px', margin: '10px auto 0' }}>
          时辰是估算值，命盘结论只对盘本身负责，不作传记结论。
        </p>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-20">
        {FAMOUS_CATEGORIES.map(cat => {
          const list = getFamousByCategory(cat);
          if (!list.length) return null;
          return (
            <div key={cat} style={{ marginTop: '28px' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '0.3em', color: 'var(--ac)' }}>{cat}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
                <span style={{ fontSize: '11px', color: 'var(--tx-3)' }}>{list.length} 位</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {list.map(p => {
                  const q = new URLSearchParams({
                    y: String(p.year), m: String(p.month), d: String(p.day),
                    sh: String(p.hour), g: p.gender === 'male' ? 'm' : 'f', n: p.name,
                  });
                  return (
                    <Link key={p.id} href={`/chart?${q.toString()}`}
                      className="card p-5" style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tx-0)' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--tx-3)' }}>
                          {p.year}/{p.month}/{p.day} {SHICHEN[p.hour].name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--tx-2)', marginTop: '6px' }}>{p.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '8px', lineHeight: 1.7 }}>
                        {p.notable}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="card p-6" style={{ marginTop: '36px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>练习方法</div>
          <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            打开一张名人盘，先只看命宫与三方四正，写下你对其职业的判断；再翻到官禄宫与四化，看判断是否落在这两宫上。
            然后选 2–3 个已知年份，把流年四化落宫与事件对照。练习的要点是「先判断、后查盘」，不是先查盘、再编故事。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
