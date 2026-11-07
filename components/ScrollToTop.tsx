'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** 客户端路由切换后滚回顶部：sticky header 是覆盖式的，页面停在中间时新页会被导航条压住顶部 */
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as 'auto' });
  }, [pathname]);
  return null;
}
