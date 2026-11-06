'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { TopicKey } from '@/lib/interpret/types';
import { TOPIC_LABEL } from '@/lib/interpret/types';

interface Message { role: 'user' | 'assistant'; content: string }

interface Props {
  chart: ZiweiChart;
  topic: TopicKey;
  palaceName?: string;
  /** 大限索引（null = 当前大限） */
  dxIndex?: number;
}

const QUICK: { topic: TopicKey; q: string }[] = [
  { topic: 'overview', q: '我的整体命格与人生主线是什么？最该发挥的天赋与最该避开的坑？' },
  { topic: 'career', q: '事业方向：适合上班、创业还是专业自由业？未来三年怎么走？' },
  { topic: 'love', q: '感情婚姻：配偶特征、婚期与需要修的课题？' },
  { topic: 'wealth', q: '财运与理财：我的财路在哪里，怎么守库？' },
  { topic: 'health', q: '健康：需要长期保养的部位与作息建议？' },
  { topic: 'overview', q: '当前大限与今年流年：机会与风险分别落在哪件事上？' },
];

function RichText({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sec = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sec) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--ac)' }}>【{sec[1]}】</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[12.5px] leading-[1.85]" style={{ color: 'var(--tx-2)' }}>
            {parts.map((p, j) => j % 2 === 0
              ? p
              : <strong key={j} style={{ color: 'var(--tx-0)', fontWeight: 600 }}>{p}</strong>)}
          </div>
        );
      })}
      {streaming && (
        <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle" style={{ background: 'var(--ac)', opacity: 0.6 }} />
      )}
    </div>
  );
}

export default function AiPanel({ chart, topic, palaceName, dxIndex }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loadingRef.current) return;
    const user: Message = { role: 'user', content: text };
    const history = [...messages, user];
    setMessages([...history]);
    setInput('');
    loadingRef.current = true;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart, messages: history, topic,
          palaceName, dxIndex,
          // 把当前主题的规则解读一并交给模型（服务端会重新生成，这里只作提示）
        }),
      });
      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'AI 接口调用失败，请检查服务端 AI_API_KEY 配置。' }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      let pending = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            acc += JSON.parse(payload).delta?.text ?? '';
            setMessages(prev => {
              const u = [...prev];
              u[u.length - 1] = { role: 'assistant', content: acc };
              return u;
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'AI 追问需要服务端：Docker / VPS 部署时配置 AI_API_KEY 才能用。静态站点（如 GitHub Pages）没有 AI 接口；排盘与规则解读不受影响。' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--bdr)', minHeight: '420px' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
        <div className="text-[11px] tracking-[0.3em]" style={{ color: 'var(--ac)' }}>AI 追问</div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--tx-3)' }}>
          当前上下文：{TOPIC_LABEL[topic]}{palaceName ? ` · ${palaceName}` : ''} · 服务端把命盘摘要与规则解读一起送入模型
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2" style={{ color: 'var(--ac)', opacity: 0.18 }}>✦</div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--tx-3)' }}>
              命盘已就绪。可以直接提问，或用下方的常见问题开始。
            </p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className="max-w-[88%] rounded-xl px-3 py-2.5"
                style={{
                  background: m.role === 'user' ? 'var(--ac-bg)' : 'var(--bg-1)',
                  border: `1px solid ${m.role === 'user' ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                  color: m.role === 'user' ? 'var(--tx-0)' : 'var(--tx-2)',
                  fontSize: '12.5px',
                }}
              >
                {m.role === 'user' ? m.content : <RichText text={m.content} streaming={loading && i === messages.length - 1} />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--bdr)' }}>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK.map(q => (
            <button
              key={q.q}
              onClick={() => send(q.q)}
              disabled={loading}
              className="rounded-full px-2.5 py-1 text-[10.5px]"
              style={{ border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', background: 'transparent', cursor: 'pointer' }}
            >
              {q.q.length > 18 ? q.q.slice(0, 18) + '…' : q.q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input); }}
            placeholder="就这张盘提问：今年能换工作吗？什么时候结婚运最好？"
            className="input-base flex-1"
            style={{ fontSize: '12.5px' }}
          />
          <button className="btn-accent" style={{ padding: '10px 18px', fontSize: '13px', opacity: loading ? 0.6 : 1 }} onClick={() => send(input)}>
            {loading ? '思考中' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
