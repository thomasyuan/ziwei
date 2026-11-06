/**
 * POST /api/reading
 * body: { chart: ZiweiChart, year?: number, dxIndex?: number }
 * 返回：{ patterns, readings: TopicReading[], digest }
 *
 * 格局识别与论断生成在服务端（lib/ziwei/patterns.ts 是 server-only）。
 */

import { NextResponse } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { generateAllReadings, chartDigest } from '@/lib/interpret/generate';

export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { chart?: ZiweiChart; year?: number; dxIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const chart = body.chart;
  if (!chart || !Array.isArray(chart.palaces) || chart.palaces.length !== 12) {
    return NextResponse.json({ error: 'chart 缺失或不完整' }, { status: 400 });
  }
  try {
    const patterns = detectPatterns(chart);
    const readings = generateAllReadings(chart, { patterns, year: body.year, dxIndex: body.dxIndex });
    return NextResponse.json({
      patterns,
      readings,
      digest: chartDigest(chart, patterns),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'generate failed' }, { status: 500 });
  }
}
