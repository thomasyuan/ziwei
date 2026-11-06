'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TopicKey } from '@/lib/interpret/types';
import { ALL_TOPICS, TOPIC_LABEL } from '@/lib/interpret/types';

export interface ReadingSection { title: string; body: string }
export interface ReadingData {
  topic: TopicKey;
  label: string;
  palaceName: string;
  dingdiao: string;
  sections: ReadingSection[];
}

interface Props {
  readings: ReadingData[];
  activeTopic: TopicKey;
  onTopicChange: (t: TopicKey) => void;
  liunianYear: number;
  onYearChange: (y: number) => void;
  loading: boolean;
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/);
  return (
    <>
      {parts.map((p, i) => i % 2 === 0
        ? <span key={i}>{p}</span>
        : <strong key={i} style={{ color: 'var(--tx-0)', fontWeight: 600 }}>{p}</strong>)}
    </>
  );
}

const LEVEL_LABEL: Record<string, string> = { excellent: '上格', good: '中格', neutral: '平格', caution: '需防' };

export default function ReadingPanel({ readings, activeTopic, onTopicChange, liunianYear, onYearChange, loading }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const reading = readings.find(r => r.topic === activeTopic) ?? readings[0];

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--bdr)' }}>
      {/* 主题 tabs */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid var(--bdr)' }}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TOPICS.map(t => {
            const active = t === activeTopic;
            return (
              <button
                key={t}
                onClick={() => onTopicChange(t)}
                disabled={loading}
                className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-40"
                style={{
                  background: active ? 'var(--ac-bg)' : 'transparent',
                  border: `1px solid ${active ? 'var(--ac-bdr)' : 'var(--bdr-med)'}`,
                  color: active ? 'var(--ac)' : 'var(--tx-2)',
                }}
              >
                {TOPIC_LABEL[t]}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: 'var(--tx-3)' }}>
          <span>流年年份</span>
          <input
            type="number"
            value={liunianYear}
            onChange={e => {
              const y = parseInt(e.target.value);
              if (y >= 1900 && y <= 2100) onYearChange(y);
            }}
            className="input-base"
            style={{ width: '88px', padding: '4px 8px', fontSize: '12px' }}
          />
          <span>虚岁 {liunianYear > 0 ? '（按农历年换算）' : ''}</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 min-h-[320px]">
        {loading && (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--tx-3)' }}>
            <span className="animate-spin">◐</span> 正在按本宫、四化、辅煞、三方四正与运限生成…
          </div>
        )}
        {reading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={reading.topic}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-3">
                <div className="text-[10px] tracking-[0.35em]" style={{ color: 'var(--tx-3)' }}>
                  {reading.label} · {reading.palaceName}
                </div>
                <div className="text-[15px] mt-1.5" style={{ color: 'var(--ac)', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {reading.dingdiao || '此宫无主星，借对宫论'}
                </div>
              </div>

              {reading.sections.map((s, i) => {
                const isLong = s.body.length > 260;
                const open = expanded[`${reading.topic}-${i}`] ?? !isLong;
                return (
                  <div key={i} className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--ac)' }}>
                        【{s.title}】
                      </span>
                      {isLong && (
                        <button
                          onClick={() => setExpanded(p => ({ ...p, [`${reading.topic}-${i}`]: !open }))}
                          className="text-[10px] underline"
                          style={{ color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {open ? '收起' : '展开全文'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(open ? s.body : s.body.slice(0, 200) + '…').split('\n').map((line, j) => (
                        line.trim()
                          ? (
                            <div key={j} className="text-[12.5px] leading-[1.85]" style={{ color: 'var(--tx-2)' }}>
                              {line.startsWith('《')
                                ? <span style={{ color: 'var(--tx-1)', fontStyle: 'italic' }}>{line}</span>
                                : <RichText text={line} />}
                            </div>
                          )
                          : <div key={j} className="h-1" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export { LEVEL_LABEL };
