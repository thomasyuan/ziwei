/**
 * POST /api/heming —— 合盘分析（SSE）
 * body: { chartA, chartB, question? }
 *
 * 先输出规则引擎的结论（不依赖 AI，本地可用），再拼接 AI 深挖。
 */

import { NextResponse } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { chartDigest } from '@/lib/interpret/generate';
import { analyzeHeming } from '@/lib/interpret/heming';
import { buildHemingSystem } from '@/lib/ai/prompts';
import { streamChat, loadAiConfig } from '@/lib/ai/client';

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { chartA?: ZiweiChart; chartB?: ZiweiChart; question?: string; aiOnly?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const a = body.chartA, b = body.chartB;
  if (!a || !b || !Array.isArray(a.palaces) || !Array.isArray(b.palaces)) {
    return NextResponse.json({ error: '两份命盘缺失' }, { status: 400 });
  }

  const rule = analyzeHeming(a, b);
  const digestA = chartDigest(a, detectPatterns(a));
  const digestB = chartDigest(b, detectPatterns(b));

  const head = [
    `**【规则引擎结论·${rule.scoreLabel}】**`,
    ...rule.lines.map(l => `${l.title}：${l.body}`),
    `建议：${rule.advice.replace(/\n/g, '；')}`,
    '',
  ].join('\n\n');

  const encoder = new TextEncoder();
  const cfg = loadAiConfig();

  if (!cfg) {
    const tail = '\n\n**【AI 深挖】**\n未配置 AI Key，规则结论已给出；配置 AI_API_KEY 后可追加自由问答分析。';
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(`data: ${JSON.stringify({ delta: { text: head + tail } })}\n\n`);
        c.enqueue('data: [DONE]\n\n' as never);
        c.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
    });
  }

  const q = body.question?.trim();
  const userPrompt = q
    ? `请针对这个具体问题展开：「${q}」。先用一句话定调，再逐条给依据。`
    : '请在规则结论之上做更深入的双盘联参分析，指出三人以上关系里最容易忽略的细节，并给出可执行的相处建议。';

  const sys = buildHemingSystem(digestA, digestB, rule.lines, rule.scoreLabel);
  const aiStream = streamChat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens: 1600, temperature: 0.6 },
  );

  // 串起来：先吐规则结论，再透传 AI 流
  const merged = new ReadableStream({
    async start(c) {
      c.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: head } })}\n\n`));
      const reader = aiStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        c.enqueue(value);
      }
      c.close();
    },
  });

  return new Response(merged, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
  });
}
