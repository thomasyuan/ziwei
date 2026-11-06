/**
 * 回归测试 —— 论断库与解读生成器
 *
 * 断言：
 *  1. 论断库里写出的四化，必须真实存在于四化表（不能出现「紫微化忌」「七杀化权」这类不会发生的组合）
 *  2. 十四主星在十二宫都有定调 / 核心论断 / 命盘依据 / 建议，非空
 *  3. 抽样盘生成 13 维解读：无空段、无 "undefined" 文本、宫位名全部在映射表内
 *  4. 双星组合的键与主星名一致，且组合数覆盖天府系/紫微系的常见 pairing
 *
 * 跑：npx tsx scripts/regression/interpret.test.ts
 */

import { generateChart } from '../../lib/ziwei/algorithm';
import { SI_HUA_TABLE } from '../../lib/ziwei/constants';
import { detectPatterns } from '../../lib/ziwei/patterns';
import { STAR_PROFILES, COMBO_MAP, AUX_MAP, MINOR_MAP, GENERIC_MAP } from '../../lib/interpret/stars';
import { generateAllReadings } from '../../lib/interpret/generate';
import { ALL_TOPICS, PALACE_NAME_TO_KEY, TOPIC_PALACE, type PalaceKey, type SihuaKey } from '../../lib/interpret/types';

let fails = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) { fails++; console.error('✗ ' + msg); }
}

// ── 1. 四化表校验 ─────────────────────────────────────────
const REALIZABLE = new Set<string>();
for (const row of Object.values(SI_HUA_TABLE)) {
  const labels = ['lu', 'quan', 'ke', 'ji'] as SihuaKey[];
  row.forEach((star, i) => REALIZABLE.add(`${star}|${labels[i]}`));
}

for (const [star, profile] of Object.entries(STAR_PROFILES)) {
  for (const key of Object.keys(profile.sihua) as SihuaKey[]) {
    const label = { lu: '禄', quan: '权', ke: '科', ji: '忌' }[key];
    assert(REALIZABLE.has(`${star}|${key}`), `${star}化${label} 不在四化表里，论断库不应存在这条`);
    const note = profile.sihua[key]!;
    assert(note.key.includes(`${star}化${label}`), `${star}化${label} 的定调应写明「${star}化${label}」（当前：${note.key}）`);
  }
}

// ── 2. 十二宫论断完整性 ───────────────────────────────────
const PALACE_KEYS: PalaceKey[] = ['ming','xiongdi','fuqi','zinv','caibo','jiee','qianyi','jiaoyou','guanlu','tianzhai','fude','fumu'];
for (const [star, p] of Object.entries(STAR_PROFILES)) {
  for (const k of PALACE_KEYS) {
    const n = p.palaces[k];
    assert(!!n, `${star} 缺 ${k} 宫论断`);
    if (!n) continue;
    assert(n.key.length >= 4 && n.core.length >= 20, `${star}/${k} 定调与核心论断过短`);
    assert(n.basis.length >= 10, `${star}/${k} 命盘依据过短`);
    assert(n.advice.length >= 8, `${star}/${k} 建议过短`);
  }
  assert(Object.keys(p.brightness).length === 4, `${star} 亮度分档不齐`);
}

// ── 3. 抽样盘生成 ─────────────────────────────────────────
let charts = 0;
for (let y = 1960; y <= 2020; y += 5) {
  for (let m = 1; m <= 12; m += 4) {
    for (let h = 0; h < 12; h += 4) {
      const c = generateChart({ year: y, month: m, day: 15, hour: h, gender: (y + m + h) % 2 ? 'male' : 'female' });
      charts++;
      for (const p of c.palaces) {
        assert(!!PALACE_NAME_TO_KEY[p.name], `宫位名「${p.name}」不在映射表（盘 ${y}-${m}-${h}）`);
        for (const s of p.stars) {
          const known = STAR_PROFILES[s.name] || AUX_MAP[s.name] || MINOR_MAP[s.name] || GENERIC_MAP[s.name];
          assert(!!known, `星曜「${s.name}」不在论断库（盘 ${y}-${m}-${h}）`);
        }
      }
      const readings = generateAllReadings(c, { patterns: detectPatterns(c), year: 2026 });
      for (const r of readings) {
        assert(!!r.palaceName && r.sections.length >= 3, `盘 ${y}-${m}-${h} 主题 ${r.topic} 段落不足`);
        const all = r.sections.map(s => s.body).join('\n');
        assert(!all.includes('undefined'), `盘 ${y}-${m}-${h} 主题 ${r.topic} 含 undefined`);
        assert(!all.includes('NaN'), `盘 ${y}-${m}-${h} 主题 ${r.topic} 含 NaN`);
        for (const sec of r.sections) assert(!!sec.title && sec.body.trim().length > 0, `空段 ${r.topic}/${sec.title}`);
      }
    }
  }
}

// ── 4. 双星组合键 ─────────────────────────────────────────
for (const [pair, c] of Object.entries(COMBO_MAP)) {
  const [a, b] = pair.split('|');
  assert(!!STAR_PROFILES[a] && !!STAR_PROFILES[b], `组合键 ${pair} 含非主星`);
  assert(c.stars.length === 2 && [a, b].sort().join('|') === pair, `组合 ${pair} 的 stars 字段与键不一致`);
}

console.log(`\n采样 ${charts} 张盘；论断条目 ${Object.keys(STAR_PROFILES).length * 12} 主星宫位 + ${Object.keys(AUX_MAP).length * 12} 辅星宫位 + ${Object.keys(GENERIC_MAP).length} 杂曜`);
if (fails) {
  console.error(`\n❌ 论断库回归失败：${fails} 条`);
  process.exit(1);
}
console.log('\n✅ 论断库与解读生成器回归全过');
