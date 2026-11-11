/**
 * AI Provider 预设（浏览器直连用）
 *
 * 2026-11 实测各家 OpenAI 兼容接口的 CORS 预检（OPTIONS + 带 Origin 的 POST）：
 *   deepseek / openai / moonshot / dashscope —— 回 access-control-allow-origin 并允许
 *   `authorization` + `content-type`，浏览器可以从 GitHub Pages 直连；
 *   zhipu —— 预检不回 allow-origin，浏览器直连会被 CORS 拦住，只能走服务端；
 *   ollama —— 本机服务，默认不开跨域，通常只对 localhost 页面有效。
 *
 * 结论：`browserDirect: true` 的厂子，把用户自己的 Key 存在浏览器里、由浏览器直接
 * 调用厂商接口即可（无需任何后端）；其余厂子需要服务端中转。
 */

export interface ProviderPreset {
  /** 厂商 id（写入存储的 provider 字段） */
  id: string;
  /** UI 显示名 */
  label: string;
  baseUrl: string;
  model: string;
  /** 该厂商是否允许浏览器跨域直连（实测 CORS 预检通过） */
  browserDirect: boolean;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  deepseek: {
    id: 'deepseek', label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat',
    browserDirect: true,
  },
  openai: {
    id: 'openai', label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini',
    browserDirect: true,
  },
  moonshot: {
    id: 'moonshot', label: 'Moonshot（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k',
    browserDirect: true,
  },
  dashscope: {
    id: 'dashscope', label: '通义（DashScope 兼容模式）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus',
    browserDirect: true,
  },
  zhipu: {
    id: 'zhipu', label: '智谱（需服务端中转）',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash',
    browserDirect: false,
  },
  ollama: {
    id: 'ollama', label: 'Ollama（本机）',
    baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder:latest',
    browserDirect: false,
  },
};

export const PROVIDER_LIST: ProviderPreset[] = Object.values(PROVIDER_PRESETS);

/** 自定义厂子：用户自己填 base URL + model（很多自建 OpenAI 兼容网关属于这一类） */
export const CUSTOM_PRESET: ProviderPreset = {
  id: 'custom', label: '自定义（OpenAI 兼容）',
  baseUrl: '', model: '', browserDirect: true,
};

export function getPreset(provider: string): ProviderPreset {
  return PROVIDER_PRESETS[provider] ?? CUSTOM_PRESET;
}

/** 规范化 base URL：去尾斜杠、补 /v1 场景由用户自填，这里只保证不含尾斜杠 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
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
