'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const NAV = [
  { href: '/chart', label: '排盘' },
  { href: '/heming', label: '合盘' },
  { href: '/knowledge', label: '知识库' },
  { href: '/patterns', label: '格局' },
  { href: '/library', label: '古籍' },
  { href: '/famous', label: '名人盘' },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: isDark ? 'rgba(2,8,16,0.82)' : 'rgba(250,250,249,0.86)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${isDark ? 'rgba(212,168,67,0.16)' : 'rgba(184,146,42,0.18)'}`,
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span style={{ color: 'var(--ac)', fontSize: '18px', lineHeight: 1 }}>☉</span>
          <span style={{ color: 'var(--tx-0)', fontSize: '14px', letterSpacing: '0.22em', fontWeight: 600 }}>
            紫微斗数
          </span>
          <span style={{ color: 'var(--tx-3)', fontSize: '10px', letterSpacing: '0.22em' }}>ZI WEI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  textDecoration: 'none',
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  padding: '7px 12px',
                  borderRadius: '999px',
                  color: active ? 'var(--ac)' : 'var(--tx-2)',
                  background: active ? 'var(--ac-bg)' : 'transparent',
                  border: `1px solid ${active ? 'var(--ac-bdr)' : 'transparent'}`,
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/chart"
            className="hidden sm:inline-flex btn-accent"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            开始排盘
          </Link>
          <button
            onClick={toggle}
            aria-label="切换主题"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              border: `1px solid ${isDark ? 'rgba(212,168,67,0.3)' : 'rgba(140,100,20,0.3)'}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,252,242,0.9)',
              color: isDark ? 'var(--ac)' : '#7a5008',
              fontSize: '13px',
            }}
          >
            {isDark ? '☾' : '☀'}
          </button>
        </div>
      </div>

      {/* 移动端导航 */}
      <nav className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto" style={{ borderTop: `1px solid var(--bdr)` }}>
        {NAV.map(n => {
          const active = pathname === n.href || pathname.startsWith(n.href + '/');
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                textDecoration: 'none', fontSize: '12px', whiteSpace: 'nowrap',
                padding: '6px 10px', borderRadius: '999px',
                color: active ? 'var(--ac)' : 'var(--tx-2)',
                background: active ? 'var(--ac-bg)' : 'transparent',
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
