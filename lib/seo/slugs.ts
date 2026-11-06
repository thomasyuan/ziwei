/**
 * 主星 ↔ 拼音 slug 映射（URL 用 slug，避免中文 URL 在 CDN 上的边界问题）
 * 独立小模块：客户端只需要 slug 表时不会把整份论断库打进 bundle。
 */

export const ALL_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
];

export const STAR_TO_SLUG: Record<string, string> = {
  '紫微': 'ziwei', '天机': 'tianji', '太阳': 'taiyang', '武曲': 'wuqu',
  '天同': 'tiantong', '廉贞': 'lianzhen', '天府': 'tianfu', '太阴': 'taiyin',
  '贪狼': 'tanlang', '巨门': 'jumen', '天相': 'tianxiang', '天梁': 'tianliang',
  '七杀': 'qisha', '破军': 'pojun',
};

export const SLUG_TO_STAR: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_TO_SLUG).map(([k, v]) => [v, k]),
);
