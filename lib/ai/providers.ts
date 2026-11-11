/**
 * AI Provider 预设（浏览器直连用）
 *
 * 2026-11 实测：各家 OpenAI 兼容接口的 CORS 预检（OPTIONS + 带 Origin 的请求）——
 *   deepseek / openai / moonshot / dashscope —— 回 access-control-allow-origin，并允许
 *   `authorization`（+`content-type`）；`GET /models` 同样放行，所以浏览器可以直连并拉模型列表。
 *   zhipu —— 预检不回 allow-origin，浏览器直连会被 CORS 拦（只能自建中转）；
 *   ollama —— 本机服务，默认不开跨域，通常只对 localhost 页面有效。
 *
 * 结论：`browserDirect: true` 的厂子，把用户自己的 Key 存在浏览器里、由浏览器直接调用，
 * 不需要任何后端。
 *
 * 口径以厂商官方文档为准（2026-11 核对）：
 *   DeepSeek base_url = https://api.deepseek.com（不带 /v1 也是同一套接口），
 *   模型 = deepseek-flash / deepseek-v4-pro（旧的 deepseek-chat 已是历史名）。
 *   见 https://api-docs.deepseek.com/ 与 https://api-docs.deepseek.com/api/list-models
 */

export interface ProviderPreset {
  /** 厂商 id（写入存储的 provider 字段） */
  id: string;
  /** UI 显示名 */
  label: string;
  baseUrl: string;
  /** 默认模型（拉不到 /models 时的兜底） */
  model: string;
  /** 拉不到 /models 时给用户挑的候选（来自官方文档） */
  fallbackModels: string[];
  /** 该厂商是否允许浏览器跨域直连（实测 CORS 预检通过） */
  browserDirect: boolean;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  deepseek: {
    id: 'deepseek', label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
    fallbackModels: ['deepseek-flash', 'deepseek-v4-pro'],
    browserDirect: true,
  },
  openai: {
    id: 'openai', label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    fallbackModels: ['gpt-4o-mini', 'gpt-4o'],
    browserDirect: true,
  },
  moonshot: {
    id: 'moonshot', label: 'Moonshot（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-32k',
    fallbackModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    browserDirect: true,
  },
  dashscope: {
    id: 'dashscope', label: '通义（DashScope 兼容模式）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    fallbackModels: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    browserDirect: true,
  },
  zhipu: {
    id: 'zhipu', label: '智谱（需自建中转）',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    fallbackModels: ['glm-4-flash', 'glm-4-plus'],
    browserDirect: false,
  },
  ollama: {
    id: 'ollama', label: 'Ollama（本机）',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5-coder:latest',
    fallbackModels: [],
    browserDirect: false,
  },
};

export const PROVIDER_LIST: ProviderPreset[] = Object.values(PROVIDER_PRESETS);

/** 自定义厂子：用户自己填 base URL + model（很多自建 OpenAI 兼容网关属于这一类） */
export const CUSTOM_PRESET: ProviderPreset = {
  id: 'custom', label: '自定义（OpenAI 兼容）',
  baseUrl: '', model: '', fallbackModels: [], browserDirect: true,
};

export function getPreset(provider: string): ProviderPreset {
  return PROVIDER_PRESETS[provider] ?? CUSTOM_PRESET;
}

/** 规范化 base URL：去尾斜杠 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

/** 拼接口地址：base URL 可能已带 /v1（OpenAI 系），也可能不带（DeepSeek 官方写法） */
export function endpoint(baseUrl: string, path: 'chat/completions' | 'models'): string {
  return `${normalizeBaseUrl(baseUrl)}/${path}`;
}

/** 把 provider / baseUrl / model 补齐成一次调用所需的完整配置 */
export function resolveConfig(input: { provider: string; apiKey: string; baseUrl?: string; model?: string }):
  { baseUrl: string; model: string; apiKey: string; browserDirect: boolean } | null {
  const preset = getPreset(input.provider);
  const baseUrl = normalizeBaseUrl(input.baseUrl || preset.baseUrl);
  const model = (input.model || preset.model).trim();
  const apiKey = input.apiKey.trim();
  if (!apiKey || !baseUrl || !model) return null;
  return { baseUrl, model, apiKey, browserDirect: preset.browserDirect };
}
