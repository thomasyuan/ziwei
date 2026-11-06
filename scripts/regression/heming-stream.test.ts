import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Feed real byte chunks through the page's original reader callback.
const source = readFileSync(new URL('../../app/heming/page.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  // 表单是否填齐');
const end = source.indexOf('  const cardStyle =', start);
assert.ok(start >= 0 && end > start);
const body = `export function makeRun(ctx) {
  const {chartA,chartB,formA,formB,generateChart,formToBirthInfo,setFormError,
    setAnalyzing,setAnalysis,setAnalysisError,setChartA,setChartB,fetch,
    setApiMissing,analysisRef,analyzeHeming} = ctx;
  const useCallback = (fn) => fn;
  ${source.slice(start, end)}
  return runAnalysis;
}`;
const moduleExports: Record<string, (ctx: object) => () => Promise<void>> = {};
new Function('exports', 'setTimeout', ts.transpileModule(body, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(moduleExports, () => {});
const noop = () => {};
const form = { year: '1990', month: '1', day: '1', gender: 'male', clockHour: '8', clockMinute: '0' };
const STUB = { score: 3, scoreLabel: '三星：各有棱角，需磨合', lines: [{ title: '夫妻宫互参', body: 'A' }], advice: ['建议1','建议2'].join('\n') };
const HEAD = ['**【规则引擎结论·' + STUB.scoreLabel + '】**',
  STUB.lines.map(l => l.title + '：' + l.body).join('\n\n'),
  '建议：' + STUB.advice.split('\n').join('；')].join('\n');
async function consume(chunks: Uint8Array[]) {
  let text = '';
  let failed = false;
  await moduleExports.makeRun({
    chartA: {}, chartB: {}, formA: form, formB: form,
    generateChart: async () => ({}), formToBirthInfo: () => ({}),
    setChartA: noop, setChartB: noop, setFormError: noop, setAnalyzing: noop,
    analyzeHeming: () => STUB,
    setAnalysis: (value: string) => { text = value; },
    setAnalysisError: (value: boolean) => { failed = value; },
    setApiMissing: noop, analysisRef: { current: null },
    fetch: async () => ({ status: 200, ok: true, body: new ReadableStream({
      start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); },
    }) }),
  })();
  assert.equal(failed, false);
  return text;
}
async function main() {
  for (const ending of ['\n', '\r\n']) {
    const bytes = new TextEncoder().encode(
      `data: {"delta":{"text":"你好"}}${ending}${ending}` +
      `data: {"delta":{"text":"世界"}}${ending}${ending}data: [DONE]${ending}${ending}`,
    );
    assert.equal(await consume([bytes]), HEAD + '你好世界');
    for (let cut = 1; cut < bytes.length; cut++) {
      assert.equal(await consume([bytes.slice(0, cut), bytes.slice(cut)]), HEAD + '你好世界', `byte split ${cut}`);
    }
    assert.equal(await consume(Array.from(bytes, byte => Uint8Array.of(byte))), HEAD + '你好世界');
  }
  console.log('Heming SSE byte-fragment regressions passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
