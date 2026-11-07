'use client';

/**
 * 统一的章节头：细线 + 英文/拼音 eyebrow + 标题 + 副文案
 * 所有页面用同一套尺寸，保证从知识库/古籍到排盘、格局、合盘、名人盘观感一致。
 */

interface Props {
  /** eyebrow（全大写英文/拼音，带字距） */
  eyebrow: string;
  title: string;
  desc?: React.ReactNode;
  /** 标题下的操作区（按钮/链接） */
  children?: React.ReactNode;
  align?: 'center' | 'left';
  /** 顶部间距（px）：默认 48；上方已有面包屑/导航条的页面用较小值，保证 h1 到主导航条的距离一致 */
  topPad?: number;
}

const HAIR = (toRight: boolean) =>
  `linear-gradient(to ${toRight ? 'right' : 'left'}, transparent, rgba(184,146,42,0.45))`;

export default function SectionHead({ eyebrow, title, desc, children, align = 'center', topPad }: Props) {
  const center = align === 'center';
  const pad = topPad ?? (center ? 48 : 20);
  return (
    <div className={center ? 'text-center' : ''} style={{ paddingTop: `${pad}px`, paddingBottom: '28px' }}>
      <div className="flex items-center justify-center gap-3" style={{ marginBottom: '14px' }}>
        <div style={{ height: '1px', width: '48px', background: HAIR(true) }} />
        <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.42em' }}>{eyebrow}</span>
        <div style={{ height: '1px', width: '48px', background: HAIR(false) }} />
      </div>
      <h1 style={{
        fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--tx-0)',
        letterSpacing: '0.1em', lineHeight: 1.25,
      }}>
        {title}
      </h1>
      {desc && (
        <p style={{
          fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.9,
          maxWidth: '720px', margin: center ? '14px auto 0' : '14px 0 0',
        }}>
          {desc}
        </p>
      )}
      {children && <div style={{ marginTop: '20px' }}>{children}</div>}
    </div>
  );
}
