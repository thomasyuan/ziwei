'use client';
/**
 * AI Key 设置面板（浏览器直连用）
 *
 * 流程：填 Key → 自动拉 `GET {baseUrl}/models` → 用下拉选模型（拉不到才手动填）。
 * Key 只写进本页的 localStorage / sessionStorage，不上传本站；
 * 输入框默认空（占位符显示打码后的 Key），保存时才带上 Key，避免页面上明文回显。
 */

import { useRef, useState } from 'react';
import { PROVIDER_LIST, CUSTOM_PRESET, getPreset, normalizeBaseUrl } from '@/lib/ai/providers';
import { maskKey, type AiSettings } from '@/lib/ai/settings';
import type { ModelInfo } from '@/lib/ai/browser';

interface Props {
  /** 当前已存的配置（Key 不在页面上回显，只用于占位符） */
  initial: AiSettings | null;
  /** 保存；返回 false 表示浏览器把写入挡了（iOS 隐私模式 / 禁用站点存储） */
  onSave: (s: AiSettings) => boolean;
  onClear: () => void;
  onClose: () => void;
}

export default function AiKeySettings({ initial, onSave, onClear, onClose }: Props) {
  const [provider, setProvider] = useState(initial?.provider ?? 'deepseek');
  const preset = getPreset(provider);
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? preset.baseUrl);
  const [model, setModel] = useState(initial?.model ?? preset.model);
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(initial?.remember ?? true);
  const [thinking, setThinking] = useState(initial?.thinking === true);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  // 模型列表：拉到就出下拉，拉不到退回手填
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [modelsBusy, setModelsBusy] = useState(false);
  const [modelsNote, setModelsNote] = useState<string | null>(null);
  const [manualModel, setManualModel] = useState(false);
  const busyRef = useRef(false);

  const keyToUse = key.trim() || (initial?.apiKey ?? '');
  const canSave = keyToUse.length > 0 && normalizeBaseUrl(baseUrl).length > 0 && model.trim().length > 0;
  const current = models?.find(m => m.id === model.trim());

  function handleProvider(p: string) {
    const p2 = getPreset(p);
    setProvider(p);
    // 换厂子时 base URL / 模型名跟着预设走，用户之后仍可改
    setBaseUrl(p2.baseUrl);
    setModel(p2.model);
    setModels(null);
    setModelsNote(null);
    setManualModel(false);
    setStatus(null);
  }

  /** 拉模型列表：Key + Base URL 就够，不必先保存 */
  async function loadModels(opts: { apiKey?: string } = {}) {
    const apiKey = (opts.apiKey ?? keyToUse).trim();
    const b = normalizeBaseUrl(baseUrl);
    if (busyRef.current) return;
    if (!apiKey || !b) { setModelsNote('先填 Key 与 Base URL，再拉模型列表。'); return; }
    busyRef.current = true;
    setModelsBusy(true);
    setModelsNote(null);
    try {
      const { fetchModels } = await import('@/lib/ai/browser');
      const r = await fetchModels({ baseUrl: b, apiKey });
      if (!r.ok) {
        setModels(null);
        setManualModel(true);
        setModelsNote(`${r.error ?? '拉取模型列表失败'} —— 可直接手动填写模型名。`);
        return;
      }
      setModels(r.models);
      setManualModel(false);
      // 当前模型不在列表里就切到第一个（DeepSeek 官方顺序把 deepseek-flash 放前面）
      if (!r.models.some(m => m.id === model.trim())) setModel(r.models[0].id);
      setModelsNote(`已从 /models 拉到 ${r.models.length} 个模型。`);
    } finally {
      busyRef.current = false;
      setModelsBusy(false);
    }
  }

  function save() {
    if (!canSave) {
      setStatus('填齐 Key、Base URL 与模型名才能保存。');
      return;
    }
    const stored = onSave({ provider, baseUrl: normalizeBaseUrl(baseUrl), model: model.trim(), apiKey: keyToUse, remember, thinking });
    const where = remember ? 'localStorage（跨会话保留）' : 'sessionStorage（关掉标签页即失效）';
    setStatus(stored
      ? `已存到本机浏览器 ${where} · ${preset.label} · ${model.trim()} · ${maskKey(keyToUse)}`
      : `这台浏览器把写入挡了（iPhone 隐私模式 / 站点存储被禁），${where} 用不了。Key 只留在这次会话的内存里，刷新即失。`);
    setKey('');
    // 第一次保存后顺手把模型列表拉出来，省一次点击
    if (!models && !manualModel) void loadModels({ apiKey: keyToUse });
  }

  async function test() {
    if (!canSave) { setStatus('填齐 Key、Base URL 与模型名才能测试。'); return; }
    setTesting(true);
    setStatus(null);
    try {
      const { pingAi } = await import('@/lib/ai/browser');
      const msg = await pingAi({ provider, baseUrl: normalizeBaseUrl(baseUrl), model: model.trim(), apiKey: keyToUse, remember });
      setStatus(msg);
      if (!models && !manualModel) void loadModels({ apiKey: keyToUse });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '测试请求发不出去。');
    } finally {
      setTesting(false);
    }
  }

  function clear() {
    onClear();
    setKey('');
    setStatus('已清除本机浏览器里的 Key。刷新页面后 AI 追问回到「只出规则解读」的状态。');
  }

  const linkBtn = { padding: 0, border: 'none', background: 'transparent', color: 'var(--ac)', cursor: 'pointer', fontSize: '10.5px' } as const;

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.3em]" style={{ color: 'var(--ac)' }}>设置 API Key</div>
          <p className="mt-1 text-[11.5px] leading-[1.7]" style={{ color: 'var(--tx-3)' }}>
            Key 只存在你本浏览器的 <code>localStorage</code> / <code>sessionStorage</code>，不上传本站（GitHub Pages 是静态站，没有服务器可以收），
            也不写进任何日志；请求由浏览器直接发给厂商接口（DeepSeek 已实测允许浏览器跨域直连）。
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}>
          收起
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: 'var(--tx-3)' }}>Provider</span>
          <select
            value={provider}
            onChange={e => handleProvider(e.target.value)}
            className="input-base input-key"
          >
            {PROVIDER_LIST.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
            <option value={CUSTOM_PRESET.id}>{CUSTOM_PRESET.label}</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: 'var(--tx-3)' }}>
            Model{models && !manualModel ? '（从接口列表选）' : ''}
          </span>
          {models && !manualModel ? (
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="input-base input-key"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name ? `${m.name} · ${m.id}` : m.id}</option>
              ))}
              {!models.some(m => m.id === model.trim()) && <option value={model}>{model}</option>}
            </select>
          ) : (
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              className="input-base input-key"
              placeholder="deepseek-flash"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          )}
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]" style={{ color: 'var(--tx-3)' }}>
            <button type="button" onClick={() => void loadModels()} style={linkBtn}>
              {modelsBusy ? '正在拉模型列表…' : (models ? '重新拉取' : '拉取模型列表')}
            </button>
            {models && !manualModel ? (
              <button type="button" onClick={() => setManualModel(true)} style={linkBtn}>手动输入</button>
            ) : (!manualModel && (
              <button type="button" onClick={() => setManualModel(true)} style={linkBtn}>改手填</button>
            ))}
            {current?.contextWindow ? <span>上下文 {Math.round(current.contextWindow / 1024)}K</span> : null}
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="block text-[10.5px] mb-1" style={{ color: 'var(--tx-3)' }}>Base URL（OpenAI 兼容，尾斜杠可省）</span>
          <input
            value={baseUrl}
            onChange={e => { setBaseUrl(e.target.value); setModels(null); }}
            className="input-base input-key"
            placeholder="https://api.deepseek.com"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="block text-[10.5px] mb-1" style={{ color: 'var(--tx-3)' }}>
            API Key{initial?.apiKey ? ` · 已存 ${maskKey(initial.apiKey)}` : ''}（留空则沿用已存的 Key；填完失焦会自动拉模型列表）
          </span>
          <div className="flex gap-2">
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              onBlur={() => { if (!models && !manualModel && keyToUse) void loadModels(); }}
              type={showKey ? 'text' : 'password'}
              className="input-base flex-1 input-key"
              placeholder={initial?.apiKey ? `已存 ${maskKey(initial.apiKey)}，留空不改` : 'sk-…'}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="btn-ghost"
              style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </label>
      </div>

      {modelsNote && (
        <p className="mt-2 text-[11px] leading-[1.7]" style={{ color: 'var(--tx-2)' }}>{modelsNote}</p>
      )}

      <label className="mt-3 flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--tx-2)' }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
          style={{ accentColor: 'var(--ac)' }}
        />
        在我这台浏览器记住 Key（不勾 = 只在本标签页，关掉即失效）
      </label>

      {provider === 'deepseek' && (
        <label className="mt-2 flex items-start gap-2 text-[11.5px]" style={{ color: 'var(--tx-2)' }}>
          <input
            type="checkbox"
            checked={thinking}
            onChange={e => setThinking(e.target.checked)}
            style={{ accentColor: 'var(--ac)', marginTop: 3 }}
          />
          <span>
            深度思考（DeepSeek thinking 模式：回答更慢、更耗 token，思考 token 也算 max_tokens）。
            默认关闭；关着时正文直接流出来。
          </span>
        </label>
      )}

      {!preset.browserDirect && (
        <p className="mt-2 text-[11.5px] leading-[1.7]" style={{ color: 'var(--tx-2)' }}>
          实测该接口的 CORS 预检不返回跨域许可，浏览器直连会被拦（智谱尤其如此）。浏览器直连可用的是
          DeepSeek / OpenAI / Moonshot / 通义；这一家要浏览器直连就得自建一个允许跨域的中转。
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={save} className="btn-accent" style={{ padding: '8px 16px', fontSize: '12px' }}>保存</button>
        <button onClick={test} disabled={testing || !canSave} className="btn-ghost"
          style={{ padding: '8px 16px', fontSize: '12px', opacity: testing || !canSave ? 0.6 : 1 }}>
          {testing ? '测试中…' : '测试连接'}
        </button>
        {initial?.apiKey && (
          <button onClick={clear} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '12px' }}>清除 Key</button>
        )}
      </div>

      {status && (
        <p className="mt-2 text-[11.5px] leading-[1.7]" style={{ color: 'var(--tx-2)' }}>{status}</p>
      )}

      <p className="mt-3 text-[10.5px] leading-[1.7]" style={{ color: 'var(--tx-3)' }}>
        注意：浏览器存储是明文，共用电脑上的人与装了读取站点存储权限的浏览器扩展都能看到；只在个人设备上用。
        花费记在你自己的厂商账号，本站不经手。提问与命盘摘要会送到厂商接口（详见隐私政策）。
      </p>
    </div>
  );
}
