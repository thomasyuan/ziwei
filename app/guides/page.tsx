import Link from 'next/link';
import { SI_HUA_TABLE, STEMS, BRANCHES, SHICHEN, PALACE_NAMES_ORDER } from '@/lib/ziwei/constants';
import SectionHead from '@/components/SectionHead';

export const metadata = {
  title: '紫微斗数入门指南 · 起盘到读盘的七步 · 紫微斗数研究',
  description: '紫微斗数入门：安星五步、十四主星速览、四化速览、十二宫职责、庙旺利陷、大限与流年、读盘顺序与常见误区。附四化表与年干对照。',
  keywords: '紫微斗数入门, 紫微斗数怎么排盘, 四化表, 十四主星, 十二宫, 大限, 流年',
};

const STEPS = [
  { t: '定命宫', d: '以出生月与时辰定命宫：生月顺数至生时，再从该宫起「子」逆数至「寅」定命宫位置。命宫是全局之主，所有论断从这里出发。', },
  { t: '定五行局', d: '命宫与生年天干组合取纳音，得水二局、木三局、金四局、土五局、火六局。局数决定紫微星的位置与大限起点。', },
  { t: '安紫微系', d: '按局数与生日定紫微，然后顺逆安天机、太阳、武曲、天同、廉贞五颗，紫微系六星定盘。', },
  { t: '安天府系', d: '以紫微与寅申的对称关系定天府，顺安太阴、贪狼、巨门、天相、天梁、七杀、破军，共八星。', },
  { t: '安辅煞与四化', d: '按年干安文昌、文曲、左辅、右弼、天魁、天钺、禄存、擎羊、陀罗、火星、铃星、地空、地劫等；按生年天干起四化（禄权科忌），四化是运势的手。', },
];

const PRACTICE = [
  { t: '先定主星，再看亮度', d: '同一颗星在庙旺与落陷的表现完全不同。命宫紫微落陷与庙旺，是「虚名」与「实权」的差别。第一步永远是看主星与亮度。' },
  { t: '四化落宫比星曜更重要', d: '星曜是基础，四化决定事情发生在哪、什么时候发生。化禄所在是财路，化忌所在是长期课题与消耗。不看四化，命盘只解一半。' },
  { t: '空宫借对宫', d: '命宫无主星，借对宫（迁移宫）星曜论。借星论断要连对宫一起看，一生此领域靠外力与平台，不靠自足。' },
  { t: '三方四正一起看', d: '看一个宫，必须连对宫与两个三合宫一起看。单宫断事是新手最常犯的错——本宫有禄、对宫有忌，结果与「本宫有禄」并不相同。' },
  { t: '大限定十年，流年终一年', d: '大限是十年的底色，流年是当年的事件。先看大限吉凶，再看流年四化落在哪宫，事件就有轮廓。' },
  { t: '六亲是斗数的弱项', d: '父母、兄弟、子女三段的判断历来偏弱，古人亦承认。当作参考，不要当作定论；铁板神数在核对六亲方面更被传统看重。' },
];

export default function GuidesPage() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[900px] px-4 sm:px-6">
        <SectionHead
          eyebrow="BEGINNER GUIDE"
          title="紫微斗数入门 · 从起盘到读盘"
          desc="一页读完：安星五步、四化表、十二宫职责、读盘顺序与常见误区。读完可以开始用排盘页练盘，十五张盘之后你就能形成自己的判断框架。"
        />
      </div>

      <div className="mx-auto max-w-[900px] px-4 sm:px-6 pb-20">
        {/* 安星五步 */}
        <div className="card p-6">
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '14px' }}>
            一 · 安星五步（知道顺序，才知道盘怎么来）
          </div>
          {STEPS.map((s, i) => (
            <div key={s.t} className="flex gap-3" style={{ marginBottom: i < STEPS.length - 1 ? '12px' : 0 }}>
              <span style={{ color: 'var(--ac)', fontSize: '13px', fontWeight: 700, minWidth: '28px' }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--tx-0)', fontWeight: 600 }}>{s.t}</div>
                <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.85, marginTop: '4px' }}>{s.d}</p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '14px', lineHeight: 1.8 }}>
            本站排盘页用开源安星引擎（iztro）执行以上步骤，并把亮度表对齐《紫微斗数全书》；
            真太阳时按出生地经度加均时差校正，晚子时换日按真太阳时判定。
          </p>
        </div>

        {/* 四化表 */}
        <div className="card p-6" style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '12px' }}>
            二 · 四化表（必须背下来）
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--tx-3)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>年干</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--lu)', borderBottom: '1px solid var(--bdr)' }}>化禄</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--quan)', borderBottom: '1px solid var(--bdr)' }}>化权</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--ke)', borderBottom: '1px solid var(--bdr)' }}>化科</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--ji)', borderBottom: '1px solid var(--bdr)' }}>化忌</th>
                </tr>
              </thead>
              <tbody>
                {STEMS.map((st, i) => (
                  <tr key={st} style={{ color: 'var(--tx-2)' }}>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--bdr)', fontWeight: 600, color: 'var(--tx-0)' }}>{st}年</td>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--bdr)' }}>{SI_HUA_TABLE[i][0]}</td>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--bdr)' }}>{SI_HUA_TABLE[i][1]}</td>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--bdr)' }}>{SI_HUA_TABLE[i][2]}</td>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--bdr)' }}>{SI_HUA_TABLE[i][3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '12px', lineHeight: 1.8 }}>
            注意：天府、天相、七杀在标准四化表里没有四化，紫微只有化科与化权，廉贞只有化禄与化忌。
            「七杀化权」「紫微化忌」这类说法不会在这张盘上出现，遇到标着它们的断语可以直接怀疑。
          </p>
        </div>

        {/* 十二宫 */}
        <div className="card p-6" style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '12px' }}>
            三 · 十二宫职责（从命宫起，逆时针前进）
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['命宫', '自我、格局、一生气运的总纲'],
              ['兄弟宫', '手足、合伙人、现金往来与床第之秘'],
              ['夫妻宫', '婚姻、配偶、感情相处模式'],
              ['子女宫', '子女、晚辈、部属、性爱与生育'],
              ['财帛宫', '理财方式、财路、赚钱模式'],
              ['疾厄宫', '体质、疾病、意外、情绪病'],
              ['迁移宫', '外出、社会机遇、外人眼中的形象'],
              ['交友宫（仆役）', '朋友、部属、贵人、小人'],
              ['官禄宫', '事业形态、社会地位、成就方式'],
              ['田宅宫', '不动产、家宅、财库、家族环境'],
              ['福德宫', '精神世界、兴趣、享福方式'],
              ['父母宫', '父母、长辈、文书、庇护、上司缘'],
            ].map(([n, r]) => (
              <div key={n} style={{ fontSize: '12px', lineHeight: 1.75, color: 'var(--tx-2)' }}>
                <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{n}</span>
                <span style={{ margin: '0 6px', color: 'var(--tx-3)' }}>·</span>
                {r}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '12px', lineHeight: 1.8 }}>
            排盘上「交友宫」写作仆役，是传统叫法；「命宫」以外的宫位名在盘上不带「宫」字。
            宫位顺序从命宫起，地支每减一前进一宫（逆时针）。
          </p>
        </div>

        {/* 读盘顺序 */}
        <div className="card p-6" style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '12px' }}>
            四 · 读盘顺序（建议照这个顺序读）
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.9 }}>
            1. 命宫主星 + 亮度 → 定格局与性格底色。<br />
            2. 三方四正（财帛、官禄、迁移）→ 定「用武之地」，看此生成就从哪来。<br />
            3. 生年四化落宫 → 定财路（禄）、权柄（权）、名声（科）、课题（忌）落在哪些领域。<br />
            4. 六吉六煞分布 → 定助力与阻力在哪里，哪些领域需要主动管理。<br />
            5. 大限十年 → 定当下十年的底色；再看当年流年四化落宫 → 定今年的事件轮廓。<br />
            6. 最后看格局 → 格局是给前面五步的命名，不是独立结论。
          </div>
        </div>

        {/* 时辰表 */}
        <div className="card p-6" style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '12px' }}>
            五 · 时辰对照（时辰序号 0–11，不是钟点）
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {SHICHEN.map((s, i) => (
              <div key={s.name} style={{ fontSize: '12px', color: 'var(--tx-2)' }}>
                <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{i} · {s.name}</span>
                <span style={{ margin: '0 6px', color: 'var(--tx-3)' }}>=</span>
                {s.range}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--tx-3)', marginTop: '12px', lineHeight: 1.8 }}>
            23:00–00:59 分晚子时与早子时：晚子时（23:00–23:59）按次日排盘，判定口径是
            <span style={{ color: 'var(--ac)' }}>真太阳时</span>——填了出生地时，东经 100° 的钟表 23:30
            是真太阳时 22:10（亥时），留在当日；不填出生地时不做校正。
          </p>
        </div>

        {/* 常见误区 */}
        <div className="card p-6" style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '12px' }}>
            六 · 常见误区
          </div>
          {PRACTICE.map(p => (
            <div key={p.t} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--tx-0)', fontWeight: 600 }}>{p.t}</div>
              <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.85, marginTop: '4px' }}>{p.d}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: '28px' }}>
          <Link href="/chart" className="btn-accent">开始排盘</Link>
          <Link href="/knowledge" className="btn-ghost">十四主星知识库</Link>
          <Link href="/library" className="btn-ghost">古籍原文</Link>
          <Link href="/patterns" className="btn-ghost">格局目录</Link>
        </div>
      </div>

    </div>
  );
}
