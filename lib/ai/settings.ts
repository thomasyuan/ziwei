'use client';
/**
 * AI Key 的浏览器侧存储（GitHub Pages 没有后端，Key 只留在浏览器里）
 *
 * 三条硬约束：
 *  1. Key 只写在本页的 localStorage / sessionStorage，绝不发给本站服务器（静态站没有服务器），
 *     请求头只出现在「浏览器 → 厂商接口」这一条链路上；
 *  2. 全站不打印 Key：没有 console.log(settings)，错误文案里只放状态码与厂商返回的
 *     提示，不回显 Authorization；厂商 401 的响应体本身也不含 Key
 *     （scripts/regression/ai-key-storage.test.ts 跑完整调用链后断言 console 里查不到 Key）；
 *  3. 用户点「清除」即删：localStorage 与 sessionStorage 两份都清掉。
 *
 * 记住（localStorage）= 关掉浏览器后仍在，自己电脑上方便；不勾选则只存在 sessionStorage，
 * 关掉标签页即消失。两种都是明文存储，共用电脑的人（以及能读站点存储的浏览器扩展）能看到，
 * 所以页面明说了这一点，只建议在自己设备上开。
 */

import { useEffect, useState, useCallback } from 'react';
import { getPreset, normalizeBaseUrl } from './providers';

const LS_KEY = 'ziwei-ai-settings';
const SS_KEY = 'ziwei-ai-settings';

export interface AiSettings {
  /** provider id：deepseek | openai | moonshot | dashscope | zhipu | ollama | custom */
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  /** true → localStorage（跨会话记住）；false → sessionStorage（关掉标签页即失效） */
  remember: boolean;
  /** DeepSeek 的深度思考（默认关：开着时思考 token 会吃满 max_tokens，答案容易空着回来） */
  thinking?: boolean;
}

/** 上一版的 DeepSeek 默认值（base 带 /v1、模型 deepseek-chat）：读到就一次性升级到官方新口径 */
const LEGACY_DEEPSEEK = { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' };

/** 展示用：只留前 3 + 后 4 个字符，其余打点；绝不返回完整 Key */
export function maskKey(key: string): string {
  const k = key.trim();
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 3)}…${k.slice(-4)}（${k.length} 位）`;
}

function normalize(s: AiSettings): AiSettings {
  const preset = getPreset(s.provider);
  const baseUrl = normalizeBaseUrl(s.baseUrl || preset.baseUrl);
  let model = (s.model || preset.model).trim();
  const isLegacyDeepseek = s.provider === 'deepseek'
    && baseUrl === LEGACY_DEEPSEEK.baseUrl
    && model === LEGACY_DEEPSEEK.model;
  return {
    provider: s.provider,
    // 旧默认值自动升级（否则老用户一直用着 /v1 + 历史模型名，看不出哪里不对）
    baseUrl: isLegacyDeepseek ? preset.baseUrl : baseUrl,
    model: isLegacyDeepseek ? preset.model : model,
    apiKey: s.apiKey.trim(),
    remember: s.remember !== false,
    thinking: s.thinking === true,
  };
}

function readStore(raw: string | null): AiSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AiSettings;
    if (!parsed || typeof parsed.apiKey !== 'string' || !parsed.apiKey) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

/** 读当前页的配置：localStorage 优先，退回 sessionStorage */
export function readAiSettings(): AiSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLs = readStore(window.localStorage.getItem(LS_KEY));
    if (fromLs) return fromLs;
    return readStore(window.sessionStorage.getItem(SS_KEY));
  } catch {
    return null;
  }
}

/**
 * 写入配置：按 remember 选存储，并清掉另一份，避免两个地方各存一份。
 * @returns true = 真的落进存储；false = 被浏览器拒（iOS 隐私模式 / 禁用站点存储 / 配额），
 *          此时 Key 只在内存里用于本次会话，刷新即失
 */
export function writeAiSettings(s: AiSettings): boolean {
  if (typeof window === 'undefined') return false;
  const normalized = normalize(s);
  const raw = JSON.stringify(normalized);
  try {
    if (normalized.remember) {
      window.localStorage.setItem(LS_KEY, raw);
      window.sessionStorage.removeItem(SS_KEY);
    } else {
      window.sessionStorage.setItem(SS_KEY, raw);
      window.localStorage.removeItem(LS_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

/** 清除：两份存储都删 */
export function clearAiSettings(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LS_KEY);
    window.sessionStorage.removeItem(SS_KEY);
  } catch { /* 忽略 */ }
}

/** React 侧用这个 hook：挂载后读一次，保存/清除都走它，返回值即页面当前配置 */
export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(readAiSettings());
    setLoaded(true);
  }, []);

  const save = useCallback((s: AiSettings) => {
    const stored = writeAiSettings(s);
    // 存不下（iOS 隐私模式 / 禁用存储）就用内存值：本次会话照用，刷新即失
    setSettings(stored ? readAiSettings() : normalize(s));
    return stored;
  }, []);

  const clear = useCallback(() => {
    clearAiSettings();
    setSettings(null);
  }, []);

  return { settings, save, clear, loaded };
}

/** 配置是否可用（有 Key、有 base URL、有模型名） */
export function isUsable(s: AiSettings | null): boolean {
  if (!s) return false;
  return !!(s.apiKey && s.baseUrl && s.model);
}
