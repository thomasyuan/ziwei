/**
 * AI prompt 组装（服务端专用）
 *
 * 口径：以倪海厦《天纪》体系为主，四化为核心，庙旺与三方四正并论；
 * 输出结构用 **【标题】** 分段，与前端渲染器一致。
 */

// 注：本模块只在服务端调用（API 路由 / SSR）。这里不加 server-only 守卫，
// 否则 tsx 跑的回归脚本会被 node 的 server-only 占位包拦住。
import { HEMING_METHODOLOGY, STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU, MARRIAGE_STARS_BRIEF, HEMING_SCORE_CRITERIA } from '@/lib/ziwei/heming-knowledge';

export function buildInterpretSystem(digest: string, reading: string, palaceHint?: string): string {
  return [
    '你是紫微斗数解读助手，严格遵循倪海厦《天纪》体系与传统古籍口径。',
    '规则：',
    '1. 只依据提供的命盘数据说话，不凭空推断未给出的星曜与宫位。',
    '2. 四化（禄权科忌）是断运势的关键，必须逐条落到宫位上。',
    '3. 庙旺利陷与三方四正（对宫、两个三合宫）都要考虑；空宫借对宫星论。',
    '4. 断语要可复核：说明依据是哪颗星、哪一宫、哪个四化。',
    '5. 输出用中文，分段用 **【标题】** 格式；每段 2–4 句，讲具体，不套话。',
    '6. 涉及健康、六亲时加一句「仅供参考，不构成医疗建议」；紫微斗数论六亲历来偏弱。',
    '7. 不装神弄鬼，不做绝对化预言；给可操作建议。',
    '',
    '===命盘数据===',
    digest,
    reading ? `\n===已生成的规则解读（可引用、可深化）===\n${reading}` : '',
    palaceHint ? `\n当前聚焦宫位：${palaceHint}` : '',
  ].join('\n');
}

export function buildHemingSystem(
  digestA: string, digestB: string,
  ruleLines: { title: string; body: string }[],
  scoreLabel: string,
): string {
  const fuqi = Object.entries(STAR_IN_FUQI_GU)
    .slice(0, 6)
    .map(([s, v]) => `${s}在夫妻宫：${v.summary}`)
    .join('\n');
  const hua = Object.entries(SIHUA_IN_FUQI_GU).map(([k, v]) => `夫妻宫${k}：${v}`).join('\n');
  const stars = Object.entries(MARRIAGE_STARS_BRIEF).map(([k, v]) => `${k}：${v}`).join('\n');
  return [
    '你是紫微斗数合盘分析师，按倪海厦《天纪》体系与古籍口径，分析两人关系。',
    '结构要求：用 **【标题】** 分段，逐条给出依据（哪颗星、哪一宫、哪个四化）。',
    '不要绝对化；六亲与婚姻判断历来是斗数弱项，务必加「仅供参考」。',
    '',
    '===方法论参考===',
    HEMING_METHODOLOGY.slice(0, 1500),
    fuqi, hua, stars,
    `评分标准：${Object.entries(HEMING_SCORE_CRITERIA).map(([k, v]) => `${k}=${v}`).join('；')}`,
    '',
    `===规则引擎已给的结论（评分：${scoreLabel}）===`,
    ruleLines.map(l => `${l.title}：${l.body}`).join('\n'),
    '',
    `===甲方命盘===\n${digestA}`,
    `===乙方命盘===\n${digestB}`,
    '\n请给出：关系格局定性、双方夫妻宫互参、四化互落、大限同步性、相处风险、可操作建议。',
  ].join('\n');
}
