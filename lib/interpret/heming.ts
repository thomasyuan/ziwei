/**
 * 合盘规则分析（不依赖 AI）
 *
 * 依据：双方夫妻宫与命宫的星曜配置、四化互落、地支合冲、煞星分布。
 * 输出 1–5 星评分 + 逐条依据 + 相处建议。
 */

// 注：这里不加 server-only 守卫 —— 合盘页在浏览器里直接调用它（app/heming/page.tsx、lib/ai/requests.ts），
// 静态部署（GitHub Pages）也能出规则结论。
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU } from '@/lib/ziwei/heming-knowledge';
import { getSiHuaByStem } from '@/lib/ziwei/sihua';

/** 主星相性矩阵（-2 冲克 / -1 需磨合 / 0 平 / 1 相资 / 2 相成） */
const AFFINITY: Record<string, Record<string, number>> = {
  '紫微': { '紫微': 1, '天府': 2, '天相': 2, '七杀': 0, '贪狼': 1, '太阳': 1, '太阴': 1, '天机': 0, '巨门': 0, '天梁': 1, '武曲': 1, '天同': 0, '廉贞': 1, '破军': -1 },
  '天府': { '紫微': 2, '天府': 1, '武曲': 2, '天相': 2, '太阳': 1, '太阴': 2, '天机': 0, '巨门': 0, '天梁': 1, '七杀': 0, '贪狼': 1, '天同': 1, '廉贞': 1, '破军': -1 },
  '太阳': { '太阴': 2, '天梁': 2, '巨门': 1, '太阳': 1, '紫微': 1, '天府': 1, '武曲': 0, '天同': 1, '天机': 1, '贪狼': 1, '天相': 1, '七杀': 0, '廉贞': 0, '破军': -1 },
  '武曲': { '天府': 2, '天相': 2, '七杀': 1, '紫微': 1, '太阳': 0, '太阴': 1, '贪狼': 0, '巨门': 0, '天梁': 1, '天机': 0, '天同': 0, '廉贞': 1, '破军': 0 },
  '天同': { '太阴': 2, '天梁': 2, '太阳': 1, '天机': 1, '巨门': 0, '天府': 1, '紫微': 0, '武曲': 0, '贪狼': 1, '天相': 1, '七杀': -1, '廉贞': 0, '破军': -1 },
  '廉贞': { '天府': 2, '天相': 2, '贪狼': 0, '七杀': 0, '破军': 0, '太阳': 0, '太阴': 1, '天机': 0, '巨门': 1, '天梁': 1, '武曲': 1, '紫微': 1, '天同': 0 },
  '太阴': { '太阳': 2, '天同': 2, '天机': 2, '天府': 2, '武曲': 1, '贪狼': 1, '紫微': 1, '天相': 1, '天梁': 0, '巨门': 0, '七杀': 0, '廉贞': 1, '破军': -1 },
  '贪狼': { '紫微': 1, '天府': 1, '廉贞': 0, '太阳': 1, '太阴': 1, '天机': 1, '巨门': 0, '天相': 1, '天梁': 0, '武曲': 0, '天同': 1, '七杀': 0, '破军': 0 },
  '巨门': { '太阳': 1, '天机': 1, '天同': 0, '天梁': 0, '紫微': 0, '天府': 0, '武曲': 0, '太阴': 0, '贪狼': 0, '廉贞': 1, '天相': 1, '七杀': -1, '破军': -1 },
  '天相': { '紫微': 2, '天府': 2, '武曲': 2, '廉贞': 2, '太阳': 1, '太阴': 1, '天梁': 1, '天机': 1, '巨门': 1, '贪狼': 1, '天同': 1, '七杀': 0, '破军': -1 },
  '天梁': { '太阳': 2, '天同': 2, '天机': 2, '紫微': 1, '天府': 1, '武曲': 1, '太阴': 0, '贪狼': 0, '巨门': 0, '天相': 1, '七杀': 0, '廉贞': 1, '破军': -1 },
  '七杀': { '紫微': 0, '天府': 0, '武曲': 1, '廉贞': 0, '太阳': 0, '太阴': 0, '天相': 0, '天机': 0, '巨门': -1, '天梁': 0, '贪狼': 0, '天同': -1, '破军': 0 },
  '破军': { '紫微': -1, '天府': -1, '武曲': 0, '廉贞': 0, '太阳': -1, '太阴': -1, '天相': -1, '天梁': -1, '天同': -1, '七杀': 0, '贪狼': 0, '巨门': -1, '天机': -1 },
  '天机': { '太阴': 2, '天梁': 2, '太阳': 1, '巨门': 1, '紫微': 0, '天府': 0, '武曲': 0, '天同': 1, '贪狼': 1, '天相': 1, '七杀': 0, '廉贞': 0, '破军': -1 },
};

const SHA = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

function majorNames(p: Palace): string[] {
  return p.stars.filter(s => s.type === 'major').map(s => s.name);
}
function palaceByName(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.name === name);
}
function has(p: Palace, names: string[]): string[] {
  return p.stars.filter(s => names.includes(s.name)).map(s => s.name);
}

export interface HemingResult {
  score: number;          // 1–5
  scoreLabel: string;
  lines: { title: string; body: string }[];
  advice: string;
}

export function analyzeHeming(a: ZiweiChart, b: ZiweiChart): HemingResult {
  const lines: { title: string; body: string }[] = [];
  let score = 3;

  const fuqiA = palaceByName(a, '夫妻');
  const fuqiB = palaceByName(b, '夫妻');
  const mingA = palaceByName(a, '命宫');
  const mingB = palaceByName(b, '命宫');

  // 1) 双方夫妻宫互参
  if (fuqiA && fuqiB) {
    const starsA = majorNames(fuqiA);
    const starsB = majorNames(fuqiB);
    const text: string[] = [];
    for (const s of starsA) {
      const k = STAR_IN_FUQI_GU[s];
      if (k) text.push(`甲方夫妻宫${s}：${k.summary}。${k.spouse_traits}。`);
    }
    for (const s of starsB) {
      const k = STAR_IN_FUQI_GU[s];
      if (k) text.push(`乙方夫妻宫${s}：${k.summary}。${k.spouse_traits}。`);
    }
    if (starsA.length && starsB.length) {
      let sum = 0;
      for (const x of starsA) for (const y of starsB) sum += AFFINITY[x]?.[y] ?? 0;
      const avg = sum / (starsA.length * starsB.length);
      score += avg >= 1.5 ? 1 : avg <= -1 ? -1 : 0;
      text.push(`星性相合度：${avg > 0.8 ? '相资' : avg < -0.5 ? '需磨合' : '平'}（${avg.toFixed(1)}）。`);
    }
    const shaA = has(fuqiA, SHA), shaB = has(fuqiB, SHA);
    if (shaA.length) { text.push(`甲方夫妻宫见煞（${shaA.join('、')}）：感情需空间与边界。`); score -= 0.5; }
    if (shaB.length) { text.push(`乙方夫妻宫见煞（${shaB.join('、')}）：感情需空间与边界。`); score -= 0.5; }
    for (const s of [...starsA, ...starsB]) {
      if (s === '廉贞' && (has(fuqiA, ['贪狼', '七杀', '破军']).length || has(fuqiB, ['贪狼', '七杀', '破军']).length)) {
        text.push('廉贞与贪狼/七杀/破军同宫之婚姻波动较大，宜晚婚、宜聚少离多。');
        score -= 0.5;
      }
    }
    lines.push({ title: '夫妻宫互参', body: text.join('\n') });
  }

  // 2) 四化互落
  const huaText: string[] = [];
  for (const [who, other, label] of [[a, b, '甲'], [b, a, '乙']] as const) {
    const stemIdx = ((who.birthInfo.year - 4) % 10 + 10) % 10;
    const sh = getSiHuaByStem(stemIdx);
    for (const k of ['禄', '权', '科', '忌'] as const) {
      const star = sh[k];
      const target = other.palaces.find(p => p.stars.some(s => s.name === star));
      if (!target) continue;
      if (target.name === '命宫' || target.name === '夫妻') {
        const huaKey = `化${k}`;
        const note = (SIHUA_IN_FUQI_GU as Record<string, string>)[huaKey] ?? '';
        huaText.push(`${label}方生年${star}化${k}入${label === '甲' ? '乙' : '甲'}方的${target.name === '命宫' ? '命宫' : target.name + '宫'}：${note}`);
        if (k === '禄' || k === '科') score += 0.4;
        if (k === '忌') score -= 0.8;
      }
    }
  }
  if (huaText.length) lines.push({ title: '四化互落', body: huaText.join('\n') });

  // 3) 命宫地支合冲
  if (mingA && mingB) {
    const d = Math.abs(mingA.branch - mingB.branch);
    const diff = Math.min(d, 12 - d);
    const rel = diff === 0 ? '命宫同支：气质同类，相处像战友，也需要各自空间。'
      : diff === 6 ? '命宫相冲：看法常相反，互补用则成，硬碰则争。'
      : diff === 4 ? '命宫三合：志向相通，一起做事顺。'
      : '命宫相邻：节奏相近，小事易同步，大事需协商。';
    lines.push({ title: '命宫结构', body: `${rel}\n${STEMS[mingA.stem]}${BRANCHES[mingA.branch]}（${majorNames(mingA).join('、') || '空宫'}）× ${STEMS[mingB.stem]}${BRANCHES[mingB.branch]}（${majorNames(mingB).join('、') || '空宫'}）` });
    if (diff === 4) score += 0.3;
    if (diff === 6) score -= 0.2;
  }

  // 4) 福德与田宅（长期相处）
  const fudeA = palaceByName(a, '福德'), fudeB = palaceByName(b, '福德');
  if (fudeA && fudeB) {
    const shaA = has(fudeA, SHA).length, shaB = has(fudeB, SHA).length;
    lines.push({
      title: '福德与家宅',
      body: `${shaA + shaB === 0
        ? '双方福德宫无六煞，精神层面相处阻力小，能一起把日子过下去。'
        : `福德宫有煞（${shaA + shaB} 颗），精神压力与情绪消耗会在长期相处中放大，需要各自的出口。`}
        田宅（财库）甲方见${has(palaceByName(a, '田宅')!, ['禄存', '天马', '天府']).join('、') || '吉星较少'}，乙方见${has(palaceByName(b, '田宅')!, ['禄存', '天马', '天府']).join('、') || '吉星较少'}。`,
    });
    if (shaA + shaB >= 2) score -= 0.4;
  }

  score = Math.max(1, Math.min(5, Math.round(score)));
  const labels = ['一星：凶煞汇聚，生离死别风险高', '二星：起伏大，需双方主动经营', '三星：各有棱角，需磨合', '四星：基础扎实，长期可稳定', '五星：天作之合，四化互补旺'];

  const advice = [
    '把夫妻宫的「空间需求」讲清楚：谁需要独处、谁需要陪伴，先讲再处。',
    '钱的事写下来：共同账本、借贷上限、投资边界，不因人情让账模糊。',
    '化忌的一方是长期课题所在：不要指望对方改变，先改相处方式。',
    '流年大限同步看：两人走同一运（同居、结婚、合伙）时机最好。',
  ].join('\n');

  return {
    score,
    scoreLabel: labels[score - 1],
    lines,
    advice,
  };
}
