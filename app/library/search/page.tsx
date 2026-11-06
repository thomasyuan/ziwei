'use client';
/**
 * /library/search?q=xxx — 搜索结果页（客户端搜索，静态部署也能用）
 * 古籍全文与检索函数动态导入，按需加载，不进首屏 bundle。
 */

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { SearchHit } from '@/lib/classics/types';

function SearchInner() {
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [anchors, setAnchors] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    if (!q) { setHits([]); return; }
    (async () => {
      const { searchClassics, getParagraphById } = await import('@/lib/classics');
      const res = searchClassics(q, 50);
      if (!alive) return;
      const map: Record<string, number> = {};
      for (const h of res) {
        const ctx = getParagraphById(h.paragraphId);
        map[h.paragraphId] = ctx?.chapterIdx ?? 0;
      }
      setHits(res);
      setAnchors(map);
    })();
    return () => { alive = false; };
  }, [q]);

  const list = hits ?? [];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← 古籍库
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>搜索结果</div>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          首页 →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div style={{ fontSize: '13px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '4px' }}>搜索关键词</div>
          <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
            「{q || '（空）'}」
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '8px' }}>
            {hits === null
              ? '正在检索全文…'
              : <>共找到 <strong style={{ color: 'var(--ac)' }}>{list.length}</strong> 条古籍原文匹配</>}
          </div>
        </div>

        {list.length === 0 && (
          <div style={{
            background: 'var(--bg-card)', padding: '40px 20px', borderRadius: '12px',
            textAlign: 'center', color: 'var(--tx-2)', border: '1px solid rgba(184,146,42,0.15)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>📜</div>
            {q ? (
              <>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}>暂未在已收录古籍中找到这个关键词</div>
                <div style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.7 }}>
                  可尝试搜索：<br />
                  <span style={{ color: 'var(--ac)' }}>七杀朝斗 / 双禄朝垣 / 化忌 / 紫微 / 命宫 / 机月同梁</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px' }}>从古籍库的搜索框输入关键词</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map((hit, i) => (
            <Link
              key={i}
              href={`/library/${hit.bookSlug}/${anchors[hit.paragraphId] ?? 0}#${hit.paragraphId}`}
              style={{
                display: 'block', background: 'var(--bg-card)', padding: '16px 20px',
                borderRadius: '10px', border: '1px solid rgba(184,146,42,0.15)',
                textDecoration: 'none',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--tx-3)', marginBottom: '6px' }}>
                {hit.bookTitle} · {hit.chapterTitle}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tx-1)', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: hit.snippet }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 24px', textAlign: 'center', fontSize: '12px', color: 'var(--tx-3)' }}>载入搜索结果…</div>}>
      <SearchInner />
    </Suspense>
  );
}
