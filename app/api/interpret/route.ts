/**
 * POST /api/interpret —— AI 流式解读（SSE）
 * body: { chart, messages: [{role, content}], topic?, palaceName? }
 *
 * 输出格式与前端解析一致：data: {"delta":{"text":"…"}}\n\n … data: [DONE]
 */

import { NextResponse } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { generateTopicReading, chartDigest } from '@/lib/interpret/generate';
import { buildInterpretSystem } from '@/lib/ai/prompts';
import { streamChat } from '@/lib/ai/client';
import { ALL_TOPICS, type TopicKey } from '@/lib/interpret/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { chart?: ZiweiChart; messages?: { role: 'user' | 'assistant'; content: string }[]; topic?: string; palaceName?: string; dxIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const chart = body.chart;
  const messages = body.messages ?? [];
  if (!chart || !Array.isArray(chart.palaces)) {
    return NextResponse.json({ error: 'chart 缺失' }, { status: 400 });
  }

  const topic = (body.topic && ALL_TOPICS.includes(body.topic as TopicKey)) ? body.topic as TopicKey : 'overview';
  let reading = '';
  try {
    const patterns = detectPatterns(chart);
    reading = generateTopicReading(chart, topic, { patterns, dxIndex: body.dxIndex }).markdown;
    // 只保留与当前问题最相关的部分，控制 prompt 体积
    if (messages.length > 2) reading = reading.split('\n\n').slice(0, 4).join('\n\n');
  } catch { /* 规则解读失败不阻断 AI */ }

  const system = buildInterpretSystem(chartDigest(chart), reading, body.palaceName);
  const stream = streamChat(
    [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role, content: m.content }))],
    { maxTokens: 1500, temperature: 0.7 },
  );

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
