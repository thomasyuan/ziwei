import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/Header';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '紫微斗数排盘 · 十四主星四化 · 十三维解读',
  description: '开源安星引擎即时起盘：十四主星、六吉六煞、四化飞星、庙旺利陷全部入宫；命格、性格、感情、事业、财运、健康、兄弟、子女、迁移、人际、田宅、福德、父母十三维逐条生成，可追到本宫星曜与古籍原文。',
  keywords: '紫微斗数, 紫微斗数排盘, 倪海厦, 紫微斗数全书, 紫微斗数全集, 骨髓赋, 命盘, 四化, 14主星, 12宫位, 格局',
  metadataBase: new URL(SITE_URL),
  icons: { icon: '/favicon.svg' },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '紫微斗数排盘 · 十四主星四化 · 十三维解读',
    description: '开源安星引擎起盘，十四主星与四化全量入宫；十三维解读按本宫、四化、辅煞、三方四正与运限生成，可逐条复核。',
    url: SITE_URL,
    siteName: '紫微斗数研究',
    locale: 'zh_CN',
    type: 'website',
  },
  // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
      // 百度站长（等执照下来后）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站长（等执照下来后）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {/* 导航与主题切换在 RootLayout 里，所有页面（含 /chart、古籍子页）都用同一条 header */}
          <Header />
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
