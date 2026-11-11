'use client';
/**
 * 浏览器直连 AI（OpenAI 兼容协议）
 *
 * 2026-11 实测（见 lib/ai/providers.ts 注释）：DeepSeek / OpenAI / Moonshot / DashScope
 * 的 CORS 预检都会回 `access-control-allow-headers: authorization,content-type`，
 * `GET /models` 也放行，所以浏览器带着用户自己的 Key 直接请求厂商接口是可行的，不需要后端。
 *
 * Key 只出现在「浏览器 → 厂商接口」这一条链路：
 *   - 静态站没有服务器，也就没有服务端日志；
 *   - GitHub Pages 只发 HTML/JS，看不到这个请求；
 *   - 本模块不打印 Key，错误文案里只放状态码与厂商自己的提示（并把回显的 Key 尾号打码）。
 */

import { readSseStream, textFromJsonBody } from './sse';
import { resolveConfig, endpoint } from './providers';
import type { AiSettings } from './settings';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export interface DirectConfig { baseUrl: string; model: string; apiKey: string }

/** 从配置算出调用参数；不可用时返回 null（面板会提示去填 Key） */
export function directConfig(s: AiSettings | null): DirectConfig | null {
  const r = resolveConfig(s ?? { provider: 'custom', apiKey: '' });
  if (!r) return null;
  return { baseUrl: r.baseUrl, model: r.model, apiKey: r.apiKey };
}

/** 厂商报错里可能回显 Key 尾号（DeepSeek 会写 ****abcd）：一律打码，别把任何片段带进页面 */
function scrub(s: string): string {
  return s
    .replace(/Your api key:\s*\*+\w*/gi, 'Your api key: ****')
    .replace(/sk-[A-Za-z0-9_-]{6,}/g, 'sk-****');
}

/** 状态码 → 中文提示（不带 Key） */
function statusHint(status: number, detail: string): string {
  const brief = scrub(detail.replace(/\s+/g, ' ')).slice(0, 160);
  if (status === 401 || status === 403) {
    return `鉴权失败（${status}）。Key 无效或没有这个模型的权限：${brief}`;
  }
  if (status === 402) return `余额不足（402）：${brief}`;
  if (status === 404) return `接口不存在（404）。Base URL 或模型名不对：${brief}`;
  if (status === 429) return `触发限流（429）。稍等再问，或换更大额度的 Key：${brief}`;
  return `接口返回 ${status}：${brief}`;
}

/** 跨域被拦 / 网络不通时给的解释（浏览器不会把 CORS 失败的具体原因交给 JS） */
function failHint(e: unknown): string {
  const m = e instanceof Error ? e.message : 'unknown';
  if (
    e instanceof TypeError
    || m.toLowerCase().includes('failed to fetch')
    || m.toLowerCase().includes('networkerror')
    || m.toLowerCase().includes('load failed')
  ) {
    return '浏览器直连被拦下了：该接口不允许从本站跨域调用（CORS），或网络/插件挡了这个域名。'
      + 'DeepSeek / OpenAI / Moonshot / 通义 实测允许直连；智谱不行（需自建中转）。'
      + '也可以在浏览器控制台 Network 里看那条请求的具体失败原因。';
  }
  return `调用异常：${m}`;
}

export interface ModelInfo { id: string; name?: string; contextWindow?: number }

export interface ModelsResult {
  ok: boolean;
  models: ModelInfo[];
  /** 失败原因（已打码），面板直接展示 */
  error?: string;
  /** 状态码，便于区分「Key 无效」还是「该接口没有 /models」 */
  status?: number;
}

/**
 * 拉模型列表：GET {baseUrl}/models（OpenAI 兼容）
 * 成功就按厂商返回的 id 生成下拉，失败给可读原因。
 */
export async function fetchModels(input: { baseUrl: string; apiKey: string }): Promise<ModelsResult> {
  const baseUrl = input.baseUrl.trim().replace(/\/+$/, '');
  const apiKey = input.apiKey.trim();
  if (!baseUrl || !apiKey) return { ok: false, models: [], error: '先填 Key 与 Base URL。' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(endpoint(baseUrl, 'models'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, models: [], status: res.status, error: statusHint(res.status, detail) };
    }
    const j = await res.json() as { data?: { id?: string; name?: string; context_window?: number }[] };
    const models = (j.data ?? [])
      .filter(m => typeof m.id === 'string' && m.id)
      .map(m => ({ id: m.id as string, name: m.name, contextWindow: m.context_window }));
    if (!models.length) return { ok: false, models: [], error: '接口没返回任何模型。' };
    return { ok: true, models };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { ok: false, models: [], error: '拉模型列表超时（20 秒）。' };
    return { ok: false, models: [], error: failHint(e) };
  } finally {
    clearTimeout(timer);
  }
}

export interface StreamOutcome { text: string; reasoning: string; status?: number; finishReason?: string | null }

/**
 * 流式调用：边生成边回调 onDelta（面板据此刷新最后一条气泡）。
 * 思考过程（reasoning_content）单独收集：若模型只出思考不出正文，也会在最后显示出来，
 * 不留空白气泡。
 */
export async function streamChatDirect(
  settings: AiSettings | null,
  messages: ChatMessage[],
  opts: {
    maxTokens?: number;
    temperature?: number;
    /** DeepSeek 的思考模式：默认关闭（开着时思考 token 会占满 max_tokens，答案就空了） */
    thinking?: boolean;
    onDelta: (chunk: string) => void;
    onReasoning?: (chunk: string) => void;
  },
): Promise<StreamOutcome> {
  const cfg = directConfig(settings);
  if (!cfg) {
    const msg = '还没有填 API Key。点上方「设置 Key」填 Key（存在本机浏览器，不上传），AI 追问就能用。排盘与规则解读不需要 Key。';
    opts.onDelta(msg);
    return { text: msg, reasoning: '' };
  }
  const url = endpoint(cfg.baseUrl, 'chat/completions');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        // 默认 4000：思考模式开着时，max_tokens 要同时容纳思考与答案；
        // 太小（比如 1500）会出现「请求成功、usage 在涨、正文一个字没有」。
        max_tokens: opts.maxTokens ?? 4000,
        temperature: opts.temperature ?? 0.7,
        // thinking 只有 DeepSeek 认；其他厂子传了会 400，所以按 provider 决定要不要带
        ...(settings?.provider === 'deepseek' ? { thinking: { type: opts.thinking ? 'enabled' : 'disabled' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const msg = statusHint(res.status, detail);
      opts.onDelta(msg);
      return { text: msg, reasoning: '', status: res.status };
    }

    const ctype = (res.headers.get('content-type') ?? '').toLowerCase();

    // 网关忽略 stream=true、直接回整段 JSON：从 message.content 里取
    if (ctype.includes('application/json')) {
      const body = await res.text();
      const text = textFromJsonBody(body);
      if (text) { opts.onDelta(text); return { text, reasoning: '', status: res.status }; }
      const msg = `接口返回了 JSON 但没有正文：${scrub(body).slice(0, 160)}`;
      opts.onDelta(msg);
      return { text: msg, reasoning: '', status: res.status };
    }

    if (!res.body) {
      // 老 iOS Safari（15 及部分 16）的 fetch 拿不到 ReadableStream：退化成整段解析。
      // 没有打字机效果，但答案照样出，不会卡在「思考中」。
      const full = await res.text();
      const text = textFromJsonBody(full) || full;
      if (text.trim()) { opts.onDelta(text); return { text, reasoning: '', status: res.status }; }
      const msg = '接口没有返回可解析的内容（响应体为空）。';
      opts.onDelta(msg);
      return { text: msg, reasoning: '', status: res.status };
    }

    const { text, reasoning, finishReason } = await readSseStream(res.body, opts.onDelta, opts.onReasoning);

    // 只出思考不出正文：把思考显示出来（多半是 max_tokens 被思考吃完了）
    if (!text && reasoning) {
      const why = finishReason === 'length'
        ? '（撞上 max_tokens 上限：思考把预算用完了。关掉「深度思考」或调大 max_tokens 再试）'
        : '';
      const shown = `**【思考过程】**${why}\n${reasoning}`;
      opts.onDelta(shown);
      return { text: shown, reasoning, status: res.status, finishReason };
    }
    if (!text) {
      const tail = finishReason ? `（finish_reason=${finishReason}）` : '';
      const msg = `接口返回了 200，但正文是空的${tail}。`
        + '常见原因：模型名不对、max_tokens 太小、或该模型把输出都放在思考里。'
        + '关掉「深度思考」、换个模型再试；浏览器控制台 Network 里能看到原始响应。';
      opts.onDelta(msg);
      return { text: msg, reasoning: '', status: res.status, finishReason };
    }
    return { text, reasoning, status: res.status, finishReason };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      const msg = '请求超时（120 秒），已中断。';
      opts.onDelta(msg);
      return { text: msg, reasoning: '' };
    }
    const msg = failHint(e);
    opts.onDelta(msg);
    return { text: msg, reasoning: '' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 「测试连接」：先打 GET /models（不花 token，还能顺带确认 Key 与地址），
 * 该接口不可用再退回一条 max_tokens=1 的请求。
 */
export async function pingAi(settings: AiSettings | null): Promise<string> {
  const cfg = directConfig(settings);
  if (!cfg) return '先填 Key 与模型名。';

  const listed = await fetchModels({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey });
  if (listed.ok) {
    const names = listed.models.map(m => m.id).slice(0, 6).join('、');
    return `已连通 ${cfg.baseUrl}（/models 返回 ${listed.models.length} 个模型：${names}${listed.models.length > 6 ? '…' : ''}）。`;
  }
  if (listed.status === 401 || listed.status === 402 || listed.status === 403) {
    // Key 本身有问题，不用再花一次 token
    return listed.error ?? '鉴权失败。';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(endpoint(cfg.baseUrl, 'chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
        max_tokens: 1,
        ...(settings?.provider === 'deepseek' ? { thinking: { type: 'disabled' } } : {}),
      }),
      signal: controller.signal,
    });
    if (res.ok) return `已连通（${cfg.model}）。/models 不可用（${listed.status ?? '失败'}），但聊天接口正常。`;
    const detail = await res.text().catch(() => '');
    return statusHint(res.status, detail);
  } catch (e) {
    return failHint(e);
  } finally {
    clearTimeout(timer);
  }
}
