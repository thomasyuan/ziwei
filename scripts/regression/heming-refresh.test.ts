/**
 * 合盘页改过出生资料后，送进模型的必须是新数据
 *
 * 原测试盯「第二次 /api/heming 请求体用改后的表单」；服务端路由已删，所以现在把页面里
 * 真实的 runAnalysis 抽出来跑（沿用上来的抽源码手法），把两个动态 import 换成桩，
 * 抓住送进模型的 messages：
 *   1. 改表单后（1990 → 1991）system prompt 必须跟着改，旧年份不能留
 *   2. 规则结论 head 在 AI 之前，且不需要 Key
 *   3. 没填 Key 时不发任何厂商请求，只补一行说明
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { formToBirthInfo } from '../../lib/ziwei/share';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthInfo } from '../../lib/ziwei/types';
import { hemingHead, buildHemingMessages, HEMING_TAIL_MARK, HEMING_NO_KEY_NOTE } from '../../lib/ai/requests';
import type { BirthFormState } from '../../components/BirthForm';
import type { AiSettings } from '../../lib/ai/settings';

const source = readFileSync(new URL('../../app/heming/page.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  // 表单是否填齐');
const end = source.indexOf('  const cardStyle =', start);
assert.ok(start >= 0 && end > start, '合盘页的 runAnalysis 片段位置变了，需要同步这个测试');
const body = `export function makeRun(ctx) {
  const {formA,formB,setFormError,setAnalyzing,setAnalysis,setAnalysisError,
    setChartA,setChartB,generateChart,formToBirthInfo,aiAccRef,aiReady,settings,analysisRef} = ctx;
  const useCallback = (fn) => fn;
  // 页面里的模块级小工具（不在抽取片段里）
  const hostOf = (u) => { try { return new URL(u).host } catch { return u } };
  ${source.slice(start, end)}
  return runAnalysis;
}`;
const moduleExports: Record<string, (ctx: object) => () => Promise<void>> = {};
// 页面里的动态 import 走 require，这里只放行这两个模块，其余路径直接炸，防止偷偷引入别的依赖
const STUBS: Record<string, object> = {
  '@/lib/ai/requests': { hemingHead, buildHemingMessages, HEMING_TAIL_MARK, HEMING_NO_KEY_NOTE },
  '@/lib/ai/browser': { streamChatDirect: async (s: AiSettings | null, msgs: { role: string; content: string }[], opts: { onDelta: (c: string) => void }) => {
    sent.push(msgs);
    opts.onDelta('你好');
    opts.onDelta('世界');
    return '你好世界';
  } },
};
const fakeRequire = (id: string) => {
  if (!(id in STUBS)) throw new Error(`页面引入了未预期的模块：${id}`);
  return STUBS[id];
};
new Function('exports', 'setTimeout', 'require', ts.transpileModule(body, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(moduleExports, () => {}, fakeRequire);

const sent: { role: string; content: string }[][] = [];
const shown: string[] = [];
const formA: BirthFormState = {
  year: '1990', month: '1', day: '1', clockHour: '8', clockMinute: '0',
  gender: 'male', unknownTime: false, name: '甲', province: '江苏', city: '南京', longitude: 120,
};
const formB: BirthFormState = {
  ...formA, year: '1988', month: '5', day: '15', clockHour: '14', clockMinute: '30',
  gender: 'female', name: '乙', city: '苏州',
};
const SETTINGS: AiSettings = { provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: 'sk-<|mask_privacy|>', remember: true };

function ctx(formA: BirthFormState, aiReady: boolean) {
  return {
    formA, formB, setFormError: (m: string | null) => { if (m) throw new Error(m); },
    setAnalyzing: () => {}, setAnalysis: (t: string) => { shown.push(t); },
    setAnalysisError: (v: boolean) => { if (v) throw new Error('analysisError'); },
    setChartA: () => {}, setChartB: () => {},
    generateChart: async (info: BirthInfo) => generateChart(info),
    formToBirthInfo, aiAccRef: { current: '' }, aiReady, settings: SETTINGS, analysisRef: { current: null },
  };
}

async function main() {
  sent.length = 0; shown.length = 0;
  await moduleExports.makeRun(ctx(formA, true))();
  assert.equal(sent.length, 1, '填了 Key 才发请求');
  const sys1 = sent[0][0].content;
  assert.ok(sys1.includes('1990-1-1'), '第一版 prompt 用 1990 年');
  assert.ok(sys1.includes('1988-5-15'), '乙方数据进 prompt');
  const out1 = shown[shown.length - 1];
  assert.ok(out1.startsWith('**【规则引擎结论·'), '规则结论在前');
  assert.ok(out1.includes(HEMING_TAIL_MARK + '你好世界'), 'AI 增量接在规则结论后');

  // 改表单后重跑：必须用改后的数据，不能复用上一版
  sent.length = 0; shown.length = 0;
  await moduleExports.makeRun({ ...ctx({ ...formA, year: '1991' }, true) })();
  const sys2 = sent[0][0].content;
  assert.ok(sys2.includes('1991-1-1'), '改过的出生年必须进 prompt');
  assert.ok(!sys2.includes('1990-1-1'), '旧年份不能留在 prompt 里');

  // 没填 Key：不发请求，规则结论照给，只补一行说明
  sent.length = 0; shown.length = 0;
  await moduleExports.makeRun(ctx(formA, false))();
  assert.equal(sent.length, 0, '没 Key 不能发厂商请求');
  const noKey = shown[shown.length - 1];
  assert.ok(noKey.startsWith('**【规则引擎结论·'), '没有 Key 也先出规则结论');
  assert.ok(noKey.includes(HEMING_NO_KEY_NOTE), '缺 Key 的说明写清楚');

  console.log('合盘页 prompt 跟随表单改动 + 无 Key 不发请求 回归通过');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
