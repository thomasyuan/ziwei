/**
 * 13 维解读生成器 —— 用排盘引擎的输出 + 论断库组装
 *
 * 纯函数：同一命盘同一参数恒得同一输出（不经 AI）。
 * 论断拼接顺序：定性 → 主星 → 四化 → 辅煞 → 三方四正 → 格局 → 运限 → 经典 → 建议。
 *
 * 本模块依赖 lib/ziwei/patterns.ts（server-only），只能在服务端调用（API 路由 / SSR）。
 */

// 注：本模块只在服务端调用（API 路由 / SSR）。这里不加 server-only 守卫，
// 否则 tsx 跑的回归脚本会被 node 的 server-only 占位包拦住。
import type { ZiweiChart, Palace, SiHua } from '@/lib/ziwei/types';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';
import { getSiHuaByStem, getYearStemIndex } from '@/lib/ziwei/sihua';
import { STEMS, BRANCHES, SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { searchClassics } from '@/lib/classics';
import {
  TOPIC_PALACE, TOPIC_LABEL, PALACE_KEY_TO_NAME, PALACE_NAME_TO_KEY,
  PALACE_ROLE, ALL_TOPICS, sanFangSiZheng,
  type TopicKey, type PalaceKey, type SihuaKey,
} from './types';
import { STAR_PROFILES, brightnessGroup, getAuxText, getCombo, getSihuaNote } from './stars';

export interface Section { title: string; body: string }

export interface TopicReading {
  topic: TopicKey;
  label: string;
  palaceName: string;
  /** 一句话定调 */
  dingdiao: string;
  sections: Section[];
  /** 拼成 Markdown（用于 AI prompt 与展示） */
  markdown: string;
}

const SIHUA_LABEL: Record<SihuaKey, SiHua> = { lu: '禄', quan: '权', ke: '科', ji: '忌' };
const SIHUA_ORDER: SihuaKey[] = ['lu', 'quan', 'ke', 'ji'];

/** 子时配胆、丑配脾……按地支对应脏腑（倪师口径：取杀星最集中之宫的地支论脏腑） */
const BRANCH_ORGAN: string[] = [
  '胆与膀胱', '脾与肌肉', '胆与肝（木旺之地）', '肝与目', '皮肤与脾胃', '三焦与心包',
  '心与血脉', '脾与胃', '肺与经络', '肺与支气管', '心包与脾胃', '肾与肝胆',
];

/** 六煞与刑杀之星（杀星最集中的判定用） */
const SHA_STARS = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫', '天刑', '阴煞', '大耗', '蜚廉', '劫煞', '孤辰', '寡宿'];

function palaceKey(p: Palace): PalaceKey {
  return PALACE_NAME_TO_KEY[p.name] ?? 'ming';
}

function palaceDisplay(p: Palace): string {
  return p.name === '命宫' ? '命宫' : `${p.name}宫`;
}

function findPalace(chart: ZiweiChart, key: PalaceKey): Palace | undefined {
  return chart.palaces.find(p => palaceKey(p) === key);
}

function majorStars(p: Palace): { name: string; brightness?: string; sihua?: string; borrowed: boolean }[] {
  const majors = p.stars.filter(s => s.type === 'major');
  if (majors.length > 0) {
    return majors.map(s => ({ name: s.name, brightness: s.brightnessRaw, sihua: s.siHua, borrowed: false }));
  }
  return (p.borrowedStars ?? []).map(n => ({ name: n, brightness: undefined, sihua: undefined, borrowed: true }));
}

/** 该宫的四化（含自化），逐条列出 */
function palaceSihuaLines(p: Palace, viewLabel: string): string[] {
  const lines: string[] = [];
  for (const s of p.stars) {
    if (!s.siHua) continue;
    const huaKey = (['禄', '权', '科', '忌'] as const).includes(s.siHua as never)
      ? ({ '禄': 'lu', '权': 'quan', '科': 'ke', '忌': 'ji' } as Record<string, SihuaKey>)[s.siHua]
      : undefined;
    if (!huaKey) continue;
    const note = getSihuaNote(s.name, huaKey);
    if (!note) continue;
    lines.push(`${viewLabel}·${s.name}化${s.siHua}（${note.key}）：${note.core}`);
  }
  for (const m of p.selfSihua ?? []) {
    const huaKey = ({ '禄': 'lu', '权': 'quan', '科': 'ke', '忌': 'ji' } as Record<string, SihuaKey>)[m.siHua];
    const note = huaKey ? getSihuaNote(m.starName, huaKey) : null;
    lines.push(
      `自化${m.siHua}（${m.starName}，宫干${STEMS[p.stem]}）：${note ? note.core : '宫干使该星自化，气易散，此事在此领域留不住，需外力守住。'}`,
    );
  }
  return lines;
}

/** 星曜组合（双星）定性 */
function comboLine(starNames: string[], key: PalaceKey): string | null {
  if (starNames.length < 2) return null;
  const c = getCombo(starNames);
  if (!c) return null;
  const note = c.palaceNotes?.[key];
  return `${c.key}：${c.nature}${note ? `（在此宫：${note}）` : ''}`;
}

function brightnessSuffix(name: string, b?: string): string {
  const g = brightnessGroup(b);
  const p = STAR_PROFILES[name];
  return p ? p.brightness[g] : '';
}

/** 经典引文：从公版古籍中找与主星相关的原句 */
function classicQuotes(starNames: string[], limit = 2): { book: string; text: string }[] {
  const out: { book: string; text: string }[] = [];
  for (const name of starNames) {
    const hits = searchClassics(name, 6);
    for (const h of hits) {
      const t = h.text;
      // 引文长度控制：取 40–120 字
      if (t.length < 20 || t.length > 200) continue;
      if (out.some(o => o.text === t)) continue;
      out.push({ book: h.bookTitle, text: t });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** 大限论断（当前大限，或指定大限索引） */
function daXianSection(chart: ZiweiChart, topicPalace: Palace, dxIndex?: number): Section | null {
  if (dxIndex === undefined) dxIndex = chart.currentDaXianIndex;
  const dx = chart.daXians[dxIndex];
  if (!dx) return null;
  const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
  if (!dxPalace) return null;

  const lines: string[] = [];
  lines.push(
    `大限（虚岁 ${dx.startAge}–${dx.endAge}）走【${palaceDisplay(dxPalace)}】，宫干${STEMS[dxPalace.stem]}。`
    + `此限主管：${PALACE_ROLE[palaceKey(dxPalace)]}。`,
  );
  const stars = majorStars(dxPalace);
  if (stars.length) {
    lines.push(
      `大限命宫主星：${stars.map(s => `${s.name}${s.sihua ? '化' + s.sihua : ''}（${brightnessGroup(s.brightness)}）`).join('、')}。`
      + stars.map(s => {
        const p = STAR_PROFILES[s.name];
        return p ? p.palaces[palaceKey(dxPalace)].core : '';
      }).join(' '),
    );
  } else {
    lines.push('大限命宫无主星，借对宫星曜论此限之气象，行事宜借外力与平台。');
  }
  const sh = getSiHuaByStem(dxPalace.stem);
  const huaLines: string[] = [];
  for (const k of SIHUA_ORDER) {
    const starName = sh[SIHUA_LABEL[k]];
    const target = chart.palaces.find(p => p.stars.some(s => s.name === starName));
    const note = getSihuaNote(starName, k);
    if (!note) continue;
    const where = target ? palaceDisplay(target) : '该星不在盘上任何宫（借对宫论）';
    const hitsTopic = target && target.branch === topicPalace.branch;
    huaLines.push(`限·${starName}化${SIHUA_LABEL[k]}入${where}${hitsTopic ? '（正落在本宫，此限对本领域影响最直接）' : ''}：${note.core}`);
  }
  if (huaLines.length) lines.push(...huaLines);

  return { title: '大限（十年）', body: lines.join('\n') };
}

/** 流年论断 */
function liuNianSection(chart: ZiweiChart, topicPalace: Palace, year: number): Section | null {
  const stemIdx = getYearStemIndex(year);
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  const lnPalace = chart.palaces.find(p => p.branch === branchIdx);
  if (!lnPalace) return null;
  const age = year - chart.lunarInfo.lunarYear + 1;

  const lines: string[] = [];
  lines.push(`流年 ${year}（${STEMS[stemIdx]}${BRANCHES[branchIdx]}年），虚岁 ${age}；流年命宫在【${palaceDisplay(lnPalace)}】（${palaceDisplay(topicPalace)}与流年命宫的关系见下）。`);

  const stars = majorStars(lnPalace);
  if (stars.length) {
    lines.push(`流年命宫主星：${stars.map(s => `${s.name}（${brightnessGroup(s.brightness)}）`).join('、')}。` + stars.map(s => STAR_PROFILES[s.name]?.palaces[palaceKey(lnPalace)].core ?? '').join(' '));
  }

  const isTopicGong = lnPalace.branch === topicPalace.branch;
  const sh = getSiHuaByStem(stemIdx);
  for (const k of SIHUA_ORDER) {
    const starName = sh[SIHUA_LABEL[k]];
    const target = chart.palaces.find(p => p.stars.some(s => s.name === starName));
    const note = getSihuaNote(starName, k);
    if (!note) continue;
    const where = target ? palaceDisplay(target) : '借对宫论（此星今年落空，借对宫宫干论）';
    const samePalace = target && target.branch === topicPalace.branch;
    lines.push(`年·${starName}化${SIHUA_LABEL[k]}入${where}${samePalace ? '（落本宫，今年此领域是主角）' : ''}：${note.core}`);
  }
  if (isTopicGong) lines.push('今年流年命宫就是本宫，以上四化全部直接作用在此领域。');

  // 流年与本宫的地支关系：同宫 / 对冲 / 三合
  const rel = lnPalace.branch === topicPalace.branch
    ? '今年该宫即流年命宫，事最显。'
    : (lnPalace.branch - topicPalace.branch + 12) % 12 === 6
      ? '流年命宫与本宫相冲，该领域今年有正面冲击，动象明显。'
      : ((lnPalace.branch - topicPalace.branch + 12) % 12) % 4 === 0
        ? '流年命宫与本宫三合，该领域今年得助力，机会好接。'
        : '流年命宫与本宫无直接结构关系，该领域今年以本宫自化与四化为主。';
  lines.push(rel);
  return { title: '流年', body: lines.join('\n') };
}

/** 脏腑 focus（倪师口径：杀星最集中之宫的地支对应脏腑） */
function healthFocus(chart: ZiweiChart): string {
  let best: Palace | undefined;
  let bestCount = -1;
  for (const p of chart.palaces) {
    const c = p.stars.filter(s => SHA_STARS.includes(s.name)).length;
    if (c > bestCount) { best = p; bestCount = c; }
  }
  if (!best) return '';
  return `全盘杀星最集中于【${palaceDisplay(best)}】（${BRANCHES[best.branch]}宫，${bestCount} 颗），按倪师取脏腑之法，${BRANCHES[best.branch]}对应${BRANCH_ORGAN[best.branch]}，这是长期保养的重点部位。`;
}

const TOPIC_ADVICE: Record<TopicKey, string> = {
  overview: '先看清命宫主星的格局与四化，把主线定在能累积的专业上；大限走吉宫时扩张，走忌宫时守成。',
  personality: '性格是命宫与福德的合论：对外讲方法，对内讲情绪；把长处用在专业上，把短处交给纪律。',
  love: '感情看夫妻宫与其三方：晚婚与空间是通则；择偶看对方夫妻宫主星之性，相处看四化之扰。',
  career: '事业看官禄与命宫是否相配：官禄强宜专业立身，命强官弱宜自主；换跑道要留积累。',
  wealth: '财看财帛与田宅（财库）：财路要有制度，库要守得住；禄存之宫是财路，破耗之宫是漏点。',
  health: '健康看疾厄与杀星之聚：按地支对应脏腑早保养；煞聚之宫是重点，化忌之星是长期课题。',
  family: '六亲看兄弟与父母：往来要有账，亲情要有界；合伙先定退路，钱不掺人情。',
  children: '子女看子女宫与部属：教养给规则也给空间；部属用制度带，流动是常态要有接班规划。',
  move: '迁移看外出与机遇：出外靠专业与信誉；迁移强则离乡发展，弱则本地深耕。',
  friends: '人际看交友与贵煞：择友看品行，部属看制度；阴煞防暗箭，恩威并施。',
  home: '田宅看财库与家宅：置业以自住稳定为先；家宅防潮采光，产权手续要清。',
  spirit: '福德看精神与享福：消费设上限，给思虑找出口（创作、教学、修行）；兴趣做成专业最稳。',
  parents: '父母看长辈与文书：庇护要借，文书要审；长辈健康按该宫对应脏腑早查。',
};

/**
 * 生成一个主题的完整解读
 * @param patterns 预先算好的格局（服务端传入，避免客户端 bundling server-only 模块）
 * @param year 流年年份（默认今年）
 * @param dxIndex 指定大限索引（默认当前大限）
 */
export function generateTopicReading(
  chart: ZiweiChart,
  topic: TopicKey,
  opts: { patterns?: Pattern[]; year?: number; dxIndex?: number } = {},
): TopicReading {
  const key = TOPIC_PALACE[topic];
  const palace = findPalace(chart, key);
  const year = opts.year ?? new Date().getFullYear();
  const patterns = opts.patterns ?? detectPatterns(chart);
  const sections: Section[] = [];

  if (!palace) {
    const empty: TopicReading = {
      topic, label: TOPIC_LABEL[topic], palaceName: PALACE_KEY_TO_NAME[key],
      dingdiao: '', sections: [], markdown: '',
    };
    return empty;
  }

  const majors = majorStars(palace);
  const starNames = majors.map(m => m.name);

  // ── 1. 定性 ──
  const dingdiaoParts = majors.length
    ? majors.map(m => STAR_PROFILES[m.name]?.palaces[key].key ?? '')
    : ['空宫借对宫星曜论断'];
  const dingdiao = dingdiaoParts.filter(Boolean).join('；');

  // ── 2. 主星解读 ──
  const starLines: string[] = [];
  const combo = comboLine(starNames, key);
  if (combo) starLines.push(combo);
  if (majors.length) {
    starLines.push(
      majors.map(m => {
        const note = STAR_PROFILES[m.name]?.palaces[key];
        if (!note) return '';
        const tag = m.borrowed
          ? `（${palaceDisplay(palace)}无主星，借${PALACE_KEY_TO_NAME[palaceKey(chart.palaces.find(p => p.name === palace.borrowedFromName!) ?? palace)] ?? palace.borrowedFromName}星曜）`
          : '';
        return `${m.name}${m.sihua ? '化' + m.sihua : ''}入${palaceDisplay(palace)}${tag}：${note.core}【${brightnessGroup(m.brightness)}：${STAR_PROFILES[m.name]?.brightness[brightnessGroup(m.brightness)] ?? ''}】`;
      }).join('\n'),
    );
  } else {
    const from = palace.borrowedFromName;
    starLines.push(
      `${palaceDisplay(palace)}是空宫，须借对宫（${from ?? ''}）的主星论：${(palace.borrowedStars ?? []).join('、')}。空宫者，此事在外，需借人与借环境而成，一生此领域多靠外力。`,
    );
  }
  sections.push({ title: '主星解读', body: starLines.join('\n') });

  // ── 3. 四化 ──
  const huaLines = palaceSihuaLines(palace, '生年');
  sections.push({
    title: '四化',
    body: huaLines.length
      ? huaLines.join('\n')
      : `本宫无生年四化星入驻，此领域靠宫干${STEMS[palace.stem]}的气流动，四化在别宫，主线不在这里。`,
  });

  // ── 4. 辅星与煞星 ──
  const auxLines: string[] = [];
  for (const s of palace.stars) {
    if (s.type === 'major') continue;
    const t = getAuxText(s.name, key);
    if (t) auxLines.push(`${s.name}入${palaceDisplay(palace)}：${t}`);
  }
  if (auxLines.length) sections.push({ title: '辅星与煞星', body: auxLines.join('\n') });

  // ── 5. 三方四正 ──
  const idx = chart.palaces.indexOf(palace);
  const sf = sanFangSiZheng(idx);
  const relPalaces = [sf.duigong, sf.sanhe1, sf.sanhe2]
    .map(i => chart.palaces[(i + 12) % 12])
    .filter(Boolean);
  const relLines: string[] = [];
  for (const rp of relPalaces) {
    const isOpposite = rp.branch === (palace.branch + 6) % 12;
    const stars = majorStars(rp);
    const names = stars.map(s => s.name).join('、') || '空宫';
    const text = stars.map(s => STAR_PROFILES[s.name]?.palaces[palaceKey(rp)]?.core ?? '').join(' ');
    const hua = palaceSihuaLines(rp, '生年');
    relLines.push(
      `${isOpposite ? '对宫' : '三合'}【${palaceDisplay(rp)}】（${names}）：${text}${hua.length ? ' ' + hua.join(' ') : ''}`,
    );
  }
  sections.push({ title: '三方四正', body: relLines.join('\n') });

  // ── 6. 格局 ──
  const normalized = palace.name === '命宫' ? '命宫' : palace.name;
  const hits = patterns.filter(p => p.palaces.some(n => n === normalized || n === palaceDisplay(palace)));
  if (hits.length) {
    sections.push({
      title: '格局',
      body: hits.map(p => {
        const lv = { excellent: '上格', good: '中格', neutral: '平格', caution: '需防' }[p.level];
        const cond = p.conditions
          ? `条件：${p.conditions.required.join(' + ')}${p.conditions.bonus?.length ? '；加分：' + p.conditions.bonus.join('、') : ''}${p.conditions.breaking?.length ? '；破格：' + p.conditions.breaking.join('、') : ''}`
          : '';
        return `${p.name}（${lv}）：${p.description}${cond ? `\n${cond}` : ''}${p.source ? `\n出处：${p.source}` : ''}`;
      }).join('\n\n'),
    });
  }

  // ── 7. 健康专论（脏腑 focus） ──
  if (topic === 'health') {
    sections.push({ title: '脏腑取法', body: healthFocus(chart) });
  }

  // ── 8. 运限 ──
  const dx = daXianSection(chart, palace, opts.dxIndex);
  if (dx) sections.push(dx);
  const ln = liuNianSection(chart, palace, year);
  if (ln) sections.push(ln);

  // ── 9. 经典引证 ──
  const quotes = classicQuotes(starNames.length ? starNames : (palace.borrowedStars ?? []));
  if (quotes.length) {
    sections.push({
      title: '古籍引证',
      body: quotes.map(q => `《${q.book}》：${q.text}`).join('\n'),
    });
  }

  // ── 10. 建议 ──
  const adviceLines = [TOPIC_ADVICE[topic]];
  const starAdvice = majors.map(m => STAR_PROFILES[m.name]?.palaces[key].advice).filter(Boolean);
  adviceLines.push(...starAdvice);
  sections.push({ title: '建议', body: adviceLines.join('\n') });

  const markdown = [
    `**【${TOPIC_LABEL[topic]}·${palaceDisplay(palace)}】**`,
    dingdiao,
    ...sections.map(s => `**【${s.title}】**\n${s.body}`),
  ].join('\n\n');

  return { topic, label: TOPIC_LABEL[topic], palaceName: palaceDisplay(palace), dingdiao, sections, markdown };
}

export function generateAllReadings(chart: ZiweiChart, opts: { patterns?: Pattern[]; year?: number; dxIndex?: number } = {}): TopicReading[] {
  const patterns = opts.patterns ?? detectPatterns(chart);
  return ALL_TOPICS.map(t => generateTopicReading(chart, t, { patterns, year: opts.year, dxIndex: opts.dxIndex }));
}

/** 供合盘与 AI 用的命盘摘要（紧凑文本） */
export function chartDigest(chart: ZiweiChart, patterns?: Pattern[]): string {
  const lines: string[] = [];
  const b = chart.birthInfo;
  lines.push(`出生：${b.year}-${b.month}-${b.day} 时辰${BRANCHES[b.hour]}时，${b.gender === 'male' ? '男' : '女'}，${b.province ?? ''}${b.city ?? ''}`);
  lines.push(`命宫在${BRANCHES[chart.mingGongBranch]}，身宫在${BRANCHES[chart.shenGongBranch]}，${chart.wuxingJuName}，命主${chart.mingZhu}，身主${chart.shenZhu}，${chart.yinYangGender}`);
  for (const p of chart.palaces) {
    const majors = p.stars.filter(s => s.type === 'major').map(s => `${s.name}${s.brightnessRaw ? `(${s.brightnessRaw})` : ''}${s.siHua ? '化' + s.siHua : ''}`);
    const others = p.stars.filter(s => s.type !== 'major').map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`);
    lines.push(`${p.name === '命宫' ? '命宫' : p.name + '宫'}（${BRANCHES[p.branch]}，宫干${STEMS[p.stem]}）：${majors.join('、') || '空宫借' + (p.borrowedFromName ?? '') + (p.borrowedStars?.join('、') ?? '')}${others.length ? '｜辅煞：' + others.join('、') : ''}`);
  }
  const ps = patterns ?? detectPatterns(chart);
  if (ps.length) lines.push('格局：' + ps.map(p => `${p.name}(${p.level})`).join('、'));
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (dx) lines.push(`当前大限 ${dx.startAge}-${dx.endAge} 岁走${dx.palaceName}`);
  return lines.join('\n');
}

export { detectPatterns };
