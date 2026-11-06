/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // Docker / VPS：standalone（镜像里只需 node + .next/standalone + .next/static）
  // 静态导出（GitHub Pages / 纯静态托管）：STATIC_EXPORT=1 npm run build
  // 静态模式下没有服务端 API：AI 追问会提示「需要服务端」；排盘、13 维解读、合盘规则、格局、古籍全在浏览器里跑
  output: process.env.STATIC_EXPORT ? 'export' : 'standalone',
  // GitHub Pages 项目站（https://<user>.github.io/<repo>/）需要子路径：
  //   NEXT_PUBLIC_BASE_PATH=/ziwei STATIC_EXPORT=1 npm run build
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true },
};

module.exports = nextConfig;
