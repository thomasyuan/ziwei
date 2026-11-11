/**
 * 排盘页 AI 追问的 prompt 装配回归
 *
 * 服务端 /api/interpret 已删，prompt 改在浏览器里装配（lib/ai/requests.ts）。
 * 这里把「原服务端路由的做法」在测试里照抄一遍，断言新装配函数逐字一致，
 * 顺带盯住裁剪规则（对话超过 2 条时只留规则解读前 4 段）与宫位提示。
 *
 * 2026-11 起，这条检查同时是「静态站（GitHub Pages）的 AI 追问 prompt == Docker 站」的证明：
 * 同一批纯函数，同一个 prompt，没有服务端差异。
 */

import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { detectPatterns } from '../../lib/ziwei/patterns';
import { generateTopicReading, chartDigest } from '../../lib/interpret/generate';
import { buildInterpretSystem } from '../../lib/ai/prompts';
import { buildInterpretMessages } from '../../lib/ai/requests';
import type { ZiweiChart } from '../../lib/ziwei/types';
import type { TopicKey } from '../../lib/interpret/types';

const chart: ZiweiChart = generateChart({
  year: 1986, month: 8, day: 20, hour: 3, gender: 'female',
  name: '甲', province: '江苏', city: '南京',
});
const topic: TopicKey = 'love';

/** 原服务端路由（app/api/interpret/route.ts）逐字口径，测试里重述一份 */
function legacySystem(c: ZiweiChart, t: TopicKey, historyLen: number, palaceName?: string, dxIndex?: number) {
  const patterns = detectPatterns(c);
  const reading = generateTopicReading(c, t, { patterns, dxIndex }).markdown;
  const trimmed = historyLen > 2 ? reading.split('\n\n').slice(0, 4).join('\n\n') : reading;
  return buildInterpretSystem(chartDigest(c), trimmed, palaceName);
}

async function main() {
  const history = [{ role: 'user' as const, content: '什么时候结婚运最好？' }];
  const sys = buildInterpretMessages(chart, topic, { palaceName: '夫妻宫', dxIndex: 4, history })[0].content;

  // 逐字等于服务端那一版
  assert.equal(sys, legacySystem(chart, topic, history.length, '夫妻宫', 4), 'prompt 与原服务端路由逐字一致');

  // 摘要 + 规则解读 + 宫位提示都在
  assert.ok(sys.includes('===命盘数据==='), '带命盘摘要');
  assert.ok(sys.includes('已生成的规则解读'), '带当前主题的规则解读');
  assert.ok(sys.includes('当前聚焦宫位：夫妻宫'), '带宫位提示');
  assert.ok(sys.includes('1986-8-20'), '摘要含出生资料');
  assert.ok(sys.includes('倪海厦'), '口径写进 system');

  // 12 宫都进摘要（AI 不能拿到半个盘）
  for (const name of ['命宫', '夫妻宫', '财帛宫', '官禄宫', '迁移宫', '福德宫']) {
    assert.ok(sys.includes(name), `摘要缺${name}`);
  }

  // 对话变长后只留前 4 段规则解读（控制 prompt 体积，跟服务端同一规则）
  const longHistory = [
    { role: 'user' as const, content: 'q1' }, { role: 'assistant' as const, content: 'a1' },
    { role: 'user' as const, content: 'q2' }, { role: 'assistant' as const, content: 'a2' },
  ];
  const msgs = buildInterpretMessages(chart, topic, { history: longHistory });
  assert.equal(msgs.length, longHistory.length + 1, 'system + 全部对话轮');
  assert.equal(msgs[0].role, 'system');
  assert.equal(msgs[1].content, 'q1', '对话按原顺序接在 system 后');
  const segs = (msgs[0].content.match(/\*\*【/g) ?? []).length;
  assert.ok(segs <= 4, `裁剪后规则解读段数应 ≤4（实际 ${segs}）`);
  assert.equal(msgs[0].content, legacySystem(chart, topic, longHistory.length, undefined, undefined));

  // 无 Key 时不产出 prompt 请求：面板层由 heming-stream / ai-key-storage 的「不发请求」断言覆盖
  assert.ok(msgs.every(m => !m.content.includes('Bearer sk-')), 'prompt 里不带 Key');

  console.log('排盘页 AI prompt 装配（与已删的服务端路由逐字一致）回归通过');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
