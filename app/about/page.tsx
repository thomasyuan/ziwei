import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import { ALL_STARS } from '@/lib/seo/knowledge';
import { PATTERN_CATALOG } from '@/lib/interpret/pattern-catalog';

export const metadata = {
  title: '关于本站 · 排盘引擎与论断库怎么建起来',
  description: '本站的技术与内容说明：开源排盘引擎（iztro + 安星算法）、原创论断库（14 主星 × 12 宫 + 四化 + 辅煞）、格局目录与古籍引证的来源与许可。',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[880px] px-4 sm:px-6 py-16">
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tx-0)', marginBottom: '6px' }}>关于本站</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: '28px' }}>自建紫微斗数排盘与解读站点</p>

        <div className="card p-6">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>一 · 这个站做什么</div>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            起一张完整的紫微斗数命盘，然后从 13 个维度逐条给出可以复核的解读：每一句都能追到本宫主星、
            四化落宫、辅煞分布、三方四正、格局与运限。排盘与规则解读不需要 AI Key，也不登录。
          </p>
          <div className="grid gap-3 sm:grid-cols-4" style={{ marginTop: '16px' }}>
            {[
              ['主星', ALL_STARS.length],
              ['格局', PATTERN_CATALOG.length],
              ['古籍', ALL_BOOKS.length],
              ['原文段落', TOTAL_PARAGRAPHS],
            ].map(([l, v]) => (
              <div key={String(l)} className="card-flat p-4 text-center">
                <div style={{ fontSize: '22px', color: 'var(--ac)', fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '4px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6" style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>二 · 排盘内核</div>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            安星算法来自开源仓库
            <Link href="https://github.com/Renhuai123/ziwei-doushu" style={{ color: 'var(--ac)', margin: '0 4px' }}>Renhuai123/ziwei-doushu</Link>
            （MIT）与
            <Link href="https://github.com/SylarLong/iztro" style={{ color: 'var(--ac)', margin: '0 4px' }}>iztro</Link>，
            包含：纳音五行局起盘、命宫逆数生时与身宫顺数生时、十四主星与辅煞安星、
            亮度表对齐《紫微斗数全书》（24 处覆写修正）、真太阳时校正（经度差 + 均时差）、
            中国 1986–1991 夏令时判定、农历公历互转与闰月边界、晚子时按真太阳时换日、
            生年四化与宫干自化、大限流年运限（含童限）、十二神煞、格局识别与四化叠层。
          </p>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9, marginTop: '8px' }}>
            本站沿用的口径：年柱换年按「正月初一」（主流派），亮度默认《斗数全书》，格局识别不用宫干自化与来因宫等飞星派工具。
          </p>
        </div>

        <div className="card p-6" style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>三 · 论断库</div>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            开源仓库里的论断库是占位（<code>STAR_DB</code> 为空），本站的论断库为自建：
            14 主星 × 12 宫（定调 / 核心论断 / 命盘依据 / 建议四层）、14 主星的可发生四化
            （按四化表，不写「紫微化忌」「七杀化权」这类不会发生的组合）、
            六吉六煞与禄马在十二宫的效应、21 种双星组合、杂曜短评、亮度四档、
            大限与流年论断、脏腑取法（取杀星最集中之宫的地支对应）、格局目录与古籍引证。
            合计约 900 条论断条目，全部为本站原创文字，义理依据公版古籍与通行倪师体系。
          </p>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9, marginTop: '8px' }}>
            生成方式是确定性拼接，不经 AI：同一张盘恒得同一份解读，可逐条核对。AI 面板只做追问与深化，
            并把规则解读作为上下文送入模型，避免模型凭空发挥。
          </p>
        </div>

        <div className="card p-6" style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>四 · 技术栈与自部署</div>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            Next.js（App Router）+ React + Tailwind + TypeScript；
            排盘在浏览器与服务端运行，解读与格局识别走服务端 API；古籍与知识库为静态生成，
            14 × 13 知识库页面 SSG 输出，sitemap 与 robots 自动生成。
          </p>
          <pre style={{
            marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'var(--bg-2)',
            fontSize: '12px', color: 'var(--tx-1)', overflowX: 'auto',
          }}>{`npm install
npm run dev          # 本地 http://localhost:3000
npm run build        # 生产构建
npm run typecheck

# .env.local
NEXT_PUBLIC_SITE_URL=https://your-domain
AI_PROVIDER=deepseek # openai / moonshot / dashscope / zhipu / ollama
AI_API_KEY=...       # 不配 Key 时排盘与规则解读照常可用`}</pre>
        </div>

        <div className="card p-6" style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px' }}>五 · 许可与来源标注</div>
          <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            代码沿用 MIT（保留仓库 LICENSE）；论断内容以 CC BY 4.0 授权，转载需注明本站为来源；
            古籍原文为公版；安星库遵循 iztro 上游许可。紫微斗数在六亲判断上历来偏弱，
            古籍与倪师亦承认（「斗数批六亲本来就比较差一点」），故父母、兄弟、子女三段内容仅供参考。
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: '28px' }}>
          <Link href="/chart" className="btn-accent">排盘</Link>
          <Link href="/guides" className="btn-ghost">入门指南</Link>
          <Link href="/patterns" className="btn-ghost">格局目录</Link>
          <Link href="/knowledge" className="btn-ghost">知识库</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
