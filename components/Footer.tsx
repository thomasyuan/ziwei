import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--bdr)',
        background: 'var(--bg-1)',
        color: 'var(--tx-2)',
      }}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '0.22em', color: 'var(--ac)', marginBottom: '10px' }}>
            紫微斗数 · 排盘与解读
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.9, maxWidth: '380px' }}>
            排盘引擎基于开源项目
            <Link href="https://github.com/Renhuai123/ziwei-doushu" style={{ color: 'var(--ac)', margin: '0 4px' }}>
              Renhuai123/ziwei-doushu
            </Link>
            （MIT 授权）与
            <Link href="https://github.com/SylarLong/iztro" style={{ color: 'var(--ac)', margin: '0 4px' }}>
              iztro
            </Link>
            安星库；论断内容为本站原创编纂，义理依据《紫微斗数全书》《骨髓赋》等公版古籍。
          </p>
          <p style={{ fontSize: '11px', lineHeight: 1.8, marginTop: '10px', color: 'var(--tx-3)' }}>
            六亲（父母、兄弟、子女）判断在紫微斗数中历来偏弱，相关内容仅供参考；
            本站内容用于学习与文化研究，不构成医疗、法律或投资建议。
          </p>
        </div>

        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--tx-3)', marginBottom: '10px' }}>工具</div>
          {[['/chart', '排盘'], ['/heming', '合盘'], ['/patterns', '格局'], ['/famous', '名人盘']].map(([h, l]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: '12px', color: 'var(--tx-2)', textDecoration: 'none', marginBottom: '6px' }}>{l}</Link>
          ))}
        </div>

        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--tx-3)', marginBottom: '10px' }}>学习</div>
          {[['/knowledge', '知识库'], ['/library', '古籍原文'], ['/library/search', '全文检索'], ['/guides', '入门指南']].map(([h, l]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: '12px', color: 'var(--tx-2)', textDecoration: 'none', marginBottom: '6px' }}>{l}</Link>
          ))}
        </div>

        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--tx-3)', marginBottom: '10px' }}>条款</div>
          {[['/privacy', '隐私'], ['/terms', '条款'], ['/about', '关于']].map(([h, l]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: '12px', color: 'var(--tx-2)', textDecoration: 'none', marginBottom: '6px' }}>{l}</Link>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bdr)', padding: '14px 24px', fontSize: '11px', color: 'var(--tx-3)', textAlign: 'center' }}>
        © {new Date().getFullYear()} 紫微斗数研究 · 代码 MIT · 论断内容 CC BY 4.0（注明出处） · 古籍原文为公版
      </div>
    </footer>
  );
}
