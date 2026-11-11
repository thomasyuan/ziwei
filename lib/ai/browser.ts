'use client';
/**
 * 浏览器直连 AI（OpenAI 兼容协议）
 *
 * 2026-11 实测（见 lib/ai/providers.ts 注释）：DeepSeek / OpenAI / Moonshot / DashScope
 * 的 CORS 预检都会回 `access-control-allow-headers: authorization,content-type`，
 * 所以浏览器带着用户自己的 Key 直接请求厂商接口是可行的，不需要任何后端中转。
 *
 * Key 只出现在「浏览器 → 厂商接口」这一条链路：
 *   - 静态站没有服务器，也就没有服务端日志；
 *   - GitHub Pages 只发 HTML/JS，看不到这个请求；
 *   - 本模块不打印 Key，错误文案里只放状态码与厂商自己的提示，Authorization 头不进任何日志。
 */

import { readSseStream, parseSseBuffer } from './sse';
import { resolveConfig } from './providers';
import type { AiSettings } from './settings';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export interface DirectConfig { baseUrl: string; model: string; apiKey: string }

/** 从配置算出调用参数；不可用时返回 null（面板会提示去填 Key） */
export function directConfig(s: AiSettings | null): DirectConfig | null {
  const r = resolveConfig(s ?? { provider: 'custom', apiKey: '' });
  if (!r) return null;
  return { baseUrl: r.baseUrl, model: r.model, apiKey: r.apiKey };
}

/** 状态码 → 中文提示（不带 Key，不 echo 厂商响应里的敏感片段） */
function statusHint(status: number, detail: string): string {
  const brief = detail.replace(/\s+/g, ' ').slice(0, 120);
  if (status === 401 || status === 403) {
    return `鉴权失败（${status}）。Key 无效或没有这个模型的权限：${brief}`;
  }
  if (status === 402) return `余额不足（402）：${brief}`;
  if (status === 429) return `触发限流（429）。稍等再问，或换更大额度的 Key：${brief}`;
  return `接口返回 ${status}：${brief}`;
}

/** 跨域被拦 / 网络不通时给的解释（浏览器不会把 CORS 失败的具体原因交给 JS） */
function failHint(e: unknown): string {
  const m = e instanceof Error ? e.message : 'unknown';
  if (m.toLowerCase().includes('failed to fetch') || m.toLowerCase().includes('networkerror') || e instanceof TypeError) {
    return '浏览器直连被拦下了：该接口不允许从本站跨域调用（CORS）。换成支持浏览器直连的厂子（DeepSeek / OpenAI / Moonshot / 通义），或自建一个能加跨域头的中转。';
  }
  return `调用异常：${m}`;
}

/**
 * 流式调用：边生成边回调 onDelta（面板据此刷新最后一条气泡）。
 * @returns 全文
 */
export async function streamChatDirect(
  settings: AiSettings | null,
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; onDelta: (chunk: string) => void },
): Promise<string> {
  const cfg = directConfig(settings);
  if (!cfg) {
    const msg = '还没有填 API Key。点上方「设置 Key」填 DeepSeek Key（存在本机浏览器，不上传），AI 追问就能用。排盘与规则解读不需要 Key。';
    opts.onDelta(msg);
    return msg;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        max_tokens: opts.maxTokens ?? 1500,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const msg = statusHint(res.status, detail);
      opts.onDelta(msg);
      return msg;
    }
    if (!res.body) {
      // 老 iOS Safari（15 及部分 16 版本）的 fetch 拿不到 ReadableStream：退化成整段解析。
      // 没有打字机效果，但答案照样出，不会卡在「思考中」。
      const full = await res.text();
      const { deltas } = parseSseBuffer(full);
      const joined = deltas.join('');
      if (joined) { opts.onDelta(joined); return joined; }
      const msg = '接口没有返回可解析的内容（响应体为空）。';
      opts.onDelta(msg);
      return msg;
    }
    return await readSseStream(res.body, opts.onDelta);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      const msg = '请求超时（120 秒），已中断。';
      opts.onDelta(msg);
      return msg;
    }
    const msg = failHint(e);
    opts.onDelta(msg);
    return msg;
  } finally {
    clearTimeout(timer);
  }
}

/** 「测试连接」：一条极短的非流式请求，返回可读的诊断文本（不含 Key） */
export async function pingAi(settings: AiSettings | null): Promise<string> {
  const cfg = directConfig(settings);
  if (!cfg) return '先填 Key 与模型名。';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
        max_tokens: 1,
      }),
      signal: controller.signal,
    });
    if (res.ok) return `已连通（${cfg.model}）。`;
    const detail = await res.text().catch(() => '');
    return statusHint(res.status, detail);
  } catch (e) {
    return failHint(e);
  } finally {
    clearTimeout(timer);
  }
}


