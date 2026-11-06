/**
 * 回归测试 —— 知识库内容与引证
 *
 * 断言：
 *  1. 14 主星 × 13 主题全部有内容（182 条），且四段 markers 都能解析
 *  2. 「经典出处」里的每条引文必须逐字出现在古籍原文里（可核对，杜绝伪引文）
 *  3. 定调不含不会发生的四化（按四化表校验）
 *  4. SEO helper 生成的静态路由数 = 182
 *
 * 跑：npx tsx scripts/regression/reading-content.test.ts
 */

import { STAR_DB, TOPIC_LABEL, TOPIC_PALACE_NAME, type TopicKey } from '../../lib/ziwei/db-analysis';
import { ALL_STARS, ALL_TOPICS, getKnowledge, getAllKnowledgeRoutes, STAR_TO_SLUG } from '../../lib/seo/knowledge';
import { ALL_BOOKS } from '../../lib/classics';
import { SI_HUA_TABLE } from '../../lib/ziwei/constants';

let fails = 0;
const assert = (cond: boolean, msg: string) => { if (!cond) { fails++; console.error('✗ ' + msg); } };

// 全部古籍原文，用于逐字核对
const ALL_TEXT = ALL_BOOKS.map(b => b.chapters.map(c => c.paragraphs.map(p => p.text).join(' ')).join(' ')).join(' ');

// 四化表：哪些「星 + 四化」组合真实存在
const REAL = new Set<string>();
for (const row of Object.values(SI_HUA_TABLE)) {
  const labels = ['禄', '权', '科', '忌'];
  row.forEach((star, i) => REAL.add(`${star}化${labels[i]}`));
}

const routes = getAllKnowledgeRoutes();
assert(routes.length === ALL_STARS.length * ALL_TOPICS.length, `静态路由数 ${routes.length}，应为 ${ALL_STARS.length * ALL_TOPICS.length}`);

for (const star of ALL_STARS) {
  for (const topic of ALL_TOPICS) {
    const d = getKnowledge(star, topic as TopicKey);
    assert(d.exists, `${star} × ${topic} 无内容`);
    assert(d.parsed.dingdiao.length > 3, `${star}/${topic} 定调缺失`);
    assert(d.parsed.lundian.length > 30, `${star}/${topic} 核心论断过短`);
    assert(d.parsed.yiju.length > 10, `${star}/${topic} 命盘依据过短`);
    assert(d.parsed.chuchu.length > 20, `${star}/${topic} 经典出处过短`);
    assert(d.parsed.advice.length > 8, `${star}/${topic} 建议过短`);

    // 引文逐字核对（《书名》：原文）
    const quotes = d.parsed.chuchu.split('\n').map(l => l.trim()).filter(Boolean);
    for (const q of quotes) {
      const m = q.match(/^《(.+?)》：(.+)$/);
      if (!m) { assert(q.includes('义理本于'), `${star}/${topic} 出处行格式不明：${q.slice(0, 40)}`); continue; }
      const book = ALL_BOOKS.find(b => b.title === m[1]);
      assert(!!book, `${star}/${topic} 引用了未收录的书《${m[1]}》`);
      const body = m[2].replace(/^「|」$/g, '');
      assert(ALL_TEXT.includes(body), `${star}/${topic} 引文无法逐字核对：${body.slice(0, 50)}`);
    }

    // 定调里的四化必须真实存在
    const ding = d.parsed.dingdiao;
    const huaMentions = ding.match(/(紫微|天机|太阳|武曲|天同|廉贞|天府|太阴|贪狼|巨门|天相|天梁|七杀|破军|文昌|文曲|左辅|右弼)化(禄|权|科|忌)/g) ?? [];
    for (const h of huaMentions) assert(REAL.has(h), `${star}/${topic} 定调写了不会发生的四化：${h}`);
  }
}

// 主题标签与宫位映射完整性
for (const t of ALL_TOPICS) {
  assert(!!TOPIC_LABEL[t as TopicKey], `主题 ${t} 缺标签`);
  assert(!!TOPIC_PALACE_NAME[t as TopicKey], `主题 ${t} 缺宫位映射`);
}

console.log(`\n知识库条目：${Object.keys(STAR_DB).length} 主星 × ${ALL_TOPICS.length} 主题 = ${Object.keys(STAR_DB).length * ALL_TOPICS.length}`);
if (fails) {
  console.error(`\n❌ 知识库内容回归失败：${fails} 条`);
  process.exit(1);
}
console.log('\n✅ 知识库内容与引证回归全过（引文逐字可查）');
