/**
 * POST /api/reading
 * body: { chart: ZiweiChart, year?: number, dxIndex?: number }
 * 返回：{ patterns, readings: TopicReading[], digest }
 *
 * 只在 Docker / VPS（standalone）模式下存在；排盘页不调它 —— 论断生成与格局识别是纯函数，
 * 排盘页在浏览器里动态导入 lib/interpret/generate（app/chart/page.tsx），静态部署也完整可用。
 * 这条路由留着是给外部脚本 / 将来做「盘 → 预生成解读」查询用的。
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
