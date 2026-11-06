import type { MetadataRoute } from 'next';
// 静态导出（GitHub Pages）下也要能预渲染
export const dynamic = 'force-static';
import { SITE_URL } from '@/lib/site';

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
