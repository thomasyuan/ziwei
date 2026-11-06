/**
 * 知识库内容装配 —— 给 14 主星 × 13 主题的 SEO 页与排盘页共用
 *
 * 输出格式与线上知识库一致：四段 markers（一句话定调 / 核心论断 / 命盘依据 / 经典出处）。
 * 内容来自 lib/interpret 的论断库（本站原创编纂），经典出处引自公版古籍原文，逐字可查。
 */

import { STAR_PROFILES, getAuxIntro } from './stars';
import { PALACE_KEY_TO_NAME, TOPIC_PALACE, type PalaceKey, type TopicKey } from './types';
import { searchClassics } from '@/lib/classics';

const TOPIC_FIELD: Record<TopicKey, string> = {
  overview: 'mingGong',
  personality: 'personality',
  love: 'fuQi',
  career: 'guanLu',
  wealth: 'caiBo',
  health: 'jiE',
  family: 'xiongDi',
  children: 'ziNv',
  move: 'qianYi',
  friends: 'jiaoYou',
  home: 'tianZhai',
  spirit: 'fuDe',
  parents: 'fuMu',
};

/** topic → PalaceKey（personality 走命宫，但用「性格」角度重写） */
function topicPalaceKey(topic: TopicKey): PalaceKey {
  return TOPIC_PALACE[topic];
}

function quotesFor(starName: string, limit = 3): { book: string; text: string }[] {
  const out: { book: string; text: string }[] = [];
  for (const h of searchClassics(starName, 12)) {
    const t = h.text.trim();
    if (t.length < 25 || t.length > 220) continue;
    if (out.some(o => o.text === t)) continue;
    out.push({ book: h.bookTitle, text: t });
    if (out.length >= limit) break;
  }
  return out;
}

function buildContent(starName: string, topic: TopicKey): string {
  const profile = STAR_PROFILES[starName];
  if (!profile) return '';
  const key = topicPalaceKey(topic);
  const note = profile.palaces[key];
  const palaceName = PALACE_KEY_TO_NAME[key];

  const dingdiao = topic === 'personality'
    ? `${starName}坐命：${profile.keywords}`
    : note.key;

  // 核心论断
  const coreParts: string[] = [];
  if (topic === 'personality') {
    coreParts.push(profile.intro);
    coreParts.push(note.core);
    coreParts.push(profile.brightness['庙旺']);
    coreParts.push(`落陷时：${profile.brightness['落陷']}`);
  } else if (topic === 'overview') {
    coreParts.push(`${starName}入${palaceName}：${note.core}`);
    coreParts.push(`此星系性：${profile.keywords}（${profile.dou}·${profile.element}·${profile.huaQi}）。`);
  } else {
    coreParts.push(`${starName}入${palaceName}：${note.core}`);
  }

  // 该主题的四化补充（此星可化之四化）
  const huaKeys = Object.keys(profile.sihua) as (keyof typeof profile.sihua)[];
  if (huaKeys.length) {
    coreParts.push(
      huaKeys.map(k => {
        const label = { lu: '化禄', quan: '化权', ke: '化科', ji: '化忌' }[k as 'lu' | 'quan' | 'ke' | 'ji'];
        return `${starName}${label}——${profile.sihua[k]!.core}`;
      }).join(' '),
    );
  }

  const quotes = quotesFor(starName);
  const chuchu = quotes.length
    ? quotes.map(q => `《${q.book}》：「${q.text}」`).join('\n')
    : `${profile.intro}（义理本于《紫微斗数全书》与《骨髓赋》通行口诀。）`;

  return [
    `**【一句话定调】**\n${dingdiao}`,
    `**【核心论断】**\n${coreParts.join('\n')}`,
    `**【命盘依据】**\n${note.basis}`,
    `**【经典出处】**\n${chuchu}`,
    `**【建议】**\n${note.advice}`,
  ].join('\n\n');
}

/** STAR_DB：14 主星 × 13 主题（字段名沿用线上 SEO helper） */
export const KNOWLEDGE_STAR_DB: Record<string, Record<string, string>> = (() => {
  const db: Record<string, Record<string, string>> = {};
  for (const starName of Object.keys(STAR_PROFILES)) {
    const rec: Record<string, string> = {};
    for (const topic of Object.keys(TOPIC_FIELD) as TopicKey[]) {
      rec[TOPIC_FIELD[topic]] = buildContent(starName, topic);
    }
    // 星曜简介（供星曜详情面板调用）
    rec.__intro = STAR_PROFILES[starName].intro;
    rec.__career = STAR_PROFILES[starName].career;
    rec.__keywords = STAR_PROFILES[starName].keywords;
    db[starName] = rec;
  }
  return db;
})();

export { getAuxIntro };
