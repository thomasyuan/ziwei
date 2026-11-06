/**
 * AI 客户端（服务端专用，OpenAI 兼容协议）
 *
 * 配置写在 .env.local：
 *   AI_PROVIDER=deepseek            （可选：deepseek / openai / moonshot / dashscope / zhipu / 自定义）
 *   AI_API_KEY=...                  通用 key；也可用 DEEPSEEK_API_KEY / OPENAI_API_KEY
 *   AI_BASE_URL=...                 覆盖 base url
 *   AI_MODEL=...                    覆盖模型名
 *
 * 未配置 key 时接口返回 503，前端会显示「AI 未配置」提示，排盘与规则解读不受影响。
 */

// 注：本模块只在服务端调用（API 路由 / SSR）。这里不加 server-only 守卫，
// 否则 tsx 跑的回归脚本会被 node 的 server-only 占位包拦住。

const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  dashscope: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  ollama: { baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder:latest' },
};

export interface AiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function loadAiConfig(): AiConfig | null {
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
  const preset = PROVIDER_PRESETS[provider] ?? { baseUrl: '', model: provider };
  const baseUrl = process.env.AI_BASE_URL || preset.baseUrl;
  const model = process.env.AI_MODEL || preset.model;
  const apiKey = process.env.AI_API_KEY
    || (provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : undefined)
    || (provider === 'openai' ? process.env.OPENAI_API_KEY : undefined)
    || '';
  if (!apiKey || !baseUrl) return null;
  return { baseUrl, model, apiKey };
}

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * 流式调用：逐块产出文本
 * @returns ReadableStream (Response body) — SSE，格式 data: {"delta":{"text":"…"}}
 */
export function streamChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}): ReadableStream<Uint8Array> {
  const cfg = loadAiConfig();
  if (!cfg) {
    const msg = JSON.stringify({ delta: { text: 'AI 未配置：请在 .env.local 填入 AI_API_KEY（与 AI_PROVIDER / AI_BASE_URL / AI_MODEL）。排盘与规则解读不需要 AI Key。' } });
    const enc = new TextEncoder();
    return new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(`data: ${msg}\n\n`));
        c.enqueue(enc.encode('data: [DONE]\n\n'));
        c.close();
      },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({
            model: cfg.model,
            messages,
            stream: true,
            max_tokens: opts.maxTokens ?? 1200,
            temperature: opts.temperature ?? 0.7,
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => '');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: `AI 调用失败（${res.status}）。${detail.slice(0, 120)}` } })}\n\n`));
          controller.enqueue('data: [DONE]\n\n' as never);
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        let pending = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split('\n');
          pending = lines.pop() ?? '';
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') continue;
            let deltaText = '';
            try {
              const j = JSON.parse(payload);
              deltaText = j.choices?.[0]?.delta?.content
                ?? j.choices?.[0]?.delta?.text
                ?? j.delta?.text ?? '';
            } catch { continue; }
            if (deltaText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: deltaText } })}\n\n`));
            }
          }
        }
        controller.enqueue('data: [DONE]\n\n' as never);
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: `AI 调用异常：${msg}` } })}\n\n`));
        controller.enqueue('data: [DONE]\n\n' as never);
        controller.close();
      }
    },
  });
}

/** 非流式（用于合盘打分、摘要等） */
export async function chatJson(messages: ChatMessage[], opts: { maxTokens?: number } = {}): Promise<string> {
  const cfg = loadAiConfig();
  if (!cfg) return '';
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages, stream: false, max_tokens: opts.maxTokens ?? 900, temperature: 0.6 }),
  });
  if (!res.ok) return '';
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? '';
}
