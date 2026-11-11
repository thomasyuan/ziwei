/**
 * AI 请求装配（浏览器里跑，与原先服务端 API 路由逐字一致）
 *
 * 服务端 /api/interpret 与 /api/heming 删掉之后，这两条装配函数是唯一的 prompt 来源：
 * 排盘页与合盘页在浏览器里用同一批纯函数（detectPatterns / generateTopicReading /
 * chartDigest / analyzeHeming / buildInterpretSystem / buildHemingSystem）拼出 system，
 * 再交给 lib/ai/browser.ts 直连厂商接口。所以「静态站」和「Docker 站」的 prompt 完全相同。
 */

import { detectPatterns } from '@/lib/ziwei/patterns';
import { generateTopicReading, chartDigest } from '@/lib/interpret/generate';
import { analyzeHeming } from '@/lib/interpret/heming';
import { buildInterpretSystem, buildHemingSystem } from './prompts';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { TopicKey } from '@/lib/interpret/types';

export interface ChatMsg { role: 'system' | 'user' | 'assistant'; content: string }

/** 排盘页 AI 追问：格局 + 当前主题规则解读 + 命盘摘要 + 对话历史 */
export function buildInterpretMessages(
  chart: ZiweiChart,
  topic: TopicKey,
  opts: { palaceName?: string; dxIndex?: number; history: ChatMsg[] },
): ChatMsg[] {
  const patterns = detectPatterns(chart);
  let reading = generateTopicReading(chart, topic, { patterns, dxIndex: opts.dxIndex }).markdown;
  // 只保留与当前问题最相关的部分，控制 prompt 体积（沿用服务端那一版的裁剪规则）
  if (opts.history.length > 2) reading = reading.split('\n\n').slice(0, 4).join('\n\n');
  const system = buildInterpretSystem(chartDigest(chart), reading, opts.palaceName);
  return [{ role: 'system', content: system }, ...opts.history];
}

/** 合盘页的规则结论头段（不依赖 AI，浏览器本地算出） */
export function hemingHead(chartA: ZiweiChart, chartB: ZiweiChart): string {
  const rule = analyzeHeming(chartA, chartB);
  return `**【规则引擎结论·${rule.scoreLabel}】**\n${rule.lines.map(l => `${l.title}：${l.body}`).join('\n\n')}\n建议：${rule.advice.replace(/\n/g, '；')}`;
}

/** 合盘页 AI 深挖的标记（规则结论与 AI 输出之间的分隔） */
export const HEMING_TAIL_MARK = '\n\n**【AI 深挖】**\n';

/** 合盘页 AI 深挖：双盘摘要 + 规则结论 → system，再挂一个提问 */
export function buildHemingMessages(chartA: ZiweiChart, chartB: ZiweiChart, question?: string): ChatMsg[] {
  const rule = analyzeHeming(chartA, chartB);
  const system = buildHemingSystem(
    chartDigest(chartA, detectPatterns(chartA)),
    chartDigest(chartB, detectPatterns(chartB)),
    rule.lines,
    rule.scoreLabel,
  );
  const userPrompt = question?.trim()
    ? `请针对这个具体问题展开：「${question.trim()}」。先用一句话定调，再逐条给依据。`
    : '请在规则结论之上做更深入的双盘联参分析，指出三人以上关系里最容易忽略的细节，并给出可执行的相处建议。';
  return [{ role: 'system', content: system }, { role: 'user', content: userPrompt }];
}

/** AI 没填 Key 时给用户的说明（规则结论照给，不假装调用） */
export const HEMING_NO_KEY_NOTE =
  '未填 API Key。点上方「设置 Key」填入（Key 存在本浏览器，不上传本站），浏览器直连厂商接口后这里会追加自由问答分析。规则结论不依赖 AI，双盘可在下方切换查看。';
