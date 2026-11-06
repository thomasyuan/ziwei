'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import ShareCardCanvas, { captureShareCard, downloadDataURL } from './ShareCardCanvas';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  chart: ZiweiChart | null;
  birth: { year: string; month: string; day: string; hour: string; minute: string; gender: 'male' | 'female'; city?: string };
  highlight?: string;
}

export default function ShareModal({ open, onClose, shareUrl, chart, birth, highlight }: ShareModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const panelBg = isDark ? 'rgba(255,255,255,0.06)' : 'white';
  const textHi = isDark ? '#E8EEF6' : '#3d2f10';
  const textMid = isDark ? '#97A7C2' : '#666';
  const textSoft = isDark ? '#6B7B96' : '#a89b7c';
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadImage = async () => {
    setDownloading(true);
    try {
      const dataURL = await captureShareCard();
      if (!dataURL) {
        alert('图片生成失败，请截图保存或刷新重试');
        return;
      }
      downloadDataURL(dataURL, `紫微命盘_${Date.now()}.png`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={e => e.stopPropagation()}
            className="rounded-2xl overflow-hidden"
            style={{
              background: panelBg,
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* 顶部标题 */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(184,146,42,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textHi, letterSpacing: '0.12em' }}>
                ✦ 分享命盘
              </div>
              <button onClick={onClose}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: textMid, fontSize: '16px',
                  cursor: 'pointer', lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* 卡片图预览（实际渲染） */}
            {/* 卡片预览保持纸质浅色（导出图就是这一版），面板其余部分跟随主题 */}
            <div style={{ padding: '20px', background: '#fbf6e8', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              {chart && (
                <ShareCardCanvas chart={chart} birth={birth} highlight={highlight} />
              )}
            </div>

            <div style={{ padding: '0 20px 12px', textAlign: 'center', fontSize: '11px', color: textSoft, letterSpacing: '0.05em' }}>
              ↑ 朋友圈 / 微信 / 抖音 / 小红书 都能用
            </div>

            {/* 操作区 */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={downloadImage} disabled={downloading}
                style={{
                  padding: '14px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #d4a948 0%, #b8922a 100%)',
                  color: 'white', fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(184,146,42,0.3)',
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading ? '生成中…' : '⬇ 下载分享图'}
              </button>

              <button onClick={copyLink}
                style={{
                  padding: '14px', borderRadius: '10px',
                  border: '1px solid rgba(184,146,42,0.4)', background: panelBg,
                  color: '#b8922a', fontSize: '14px', fontWeight: 500, letterSpacing: '0.12em',
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ 已复制链接' : '🔗 复制命盘链接'}
              </button>

              <div style={{
                fontSize: '11px', color: textSoft, lineHeight: 1.7,
                padding: '10px 12px', background: isDark ? 'rgba(184,146,42,0.10)' : 'rgba(184,146,42,0.05)',
                borderRadius: '8px', marginTop: '4px',
              }}>
                <div style={{ marginBottom: '4px', fontWeight: 600, color: isDark ? '#d4a843' : '#8b6a14' }}>使用提示：</div>
                · 下载图片可发朋友圈 / 抖音 / 小红书<br />
                · 复制链接发给微信好友，对方点开看自己的盘起点
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
