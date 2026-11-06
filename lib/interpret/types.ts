/**
 * lib/interpret/types —— 13 维解读的数据结构
 *
 * 与开源仓库的 lib/ziwei/db-analysis.ts 占位版对齐：本模块提供真正的论断内容，
 * db-analysis.ts 通过 re-export 把 STAR_DB 接上，使知识库 SEO 页与排盘解读共用一份数据源。
 */

export type PalaceKey =
  | 'ming' | 'xiongdi' | 'fuqi' | 'zinv' | 'caibo' | 'jiee'
  | 'qianyi' | 'jiaoyou' | 'guanlu' | 'tianzhai' | 'fude' | 'fumu';

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

export type SihuaKey = 'lu' | 'quan' | 'ke' | 'ji';

/** 一条论断：定调 / 核心论断 / 命盘依据 / 建议 */
export interface Note {
  /** 一句话定调（≤14 字，用于标题与 SEO） */
  key: string;
  /** 核心论断正文 */
  core: string;
  /** 命盘依据：成立条件、加分项、破格项 */
  basis: string;
  /** 可执行建议 */
  advice: string;
}

export interface StarProfile {
  name: string;
  pinyin: string;
  /** 北斗 / 南斗 */
  dou: '北斗' | '南斗';
  /** 星格：帝星 / 财星 / 将星 等 */
  label: string;
  /** 五行 + 阴阳，如「阴土」 */
  element: string;
  /** 化气：尊 / 财 / 肃杀 等 */
  huaQi: string;
  keywords: string;
  intro: string;
  /** 适合的事业方向 */
  career: string;
  /** 亮度分档论断 */
  brightness: Record<'庙旺' | '得地' | '平和' | '落陷', string>;
  /** 十二宫论断 */
  palaces: Record<PalaceKey, Note>;
  /** 生年四化（此星化禄/权/科/忌）——只列出四化表里真实存在的组合 */
  sihua: Partial<Record<SihuaKey, Note>>;
}

/** 宫位中文名 → PalaceKey（iztro 命盘里「仆役」= 交友，「命宫」带宫字） */
export const PALACE_NAME_TO_KEY: Record<string, PalaceKey> = {
  '命宫': 'ming',
  '兄弟': 'xiongdi',
  '夫妻': 'fuqi',
  '子女': 'zinv',
  '财帛': 'caibo',
  '疾厄': 'jiee',
  '迁移': 'qianyi',
  '仆役': 'jiaoyou',
  '交友': 'jiaoyou',
  '官禄': 'guanlu',
  '田宅': 'tianzhai',
  '福德': 'fude',
  '父母': 'fumu',
};

/** PalaceKey → 盘上显示名 */
export const PALACE_KEY_TO_NAME: Record<PalaceKey, string> = {
  ming: '命宫',
  xiongdi: '兄弟宫',
  fuqi: '夫妻宫',
  zinv: '子女宫',
  caibo: '财帛宫',
  jiee: '疾厄宫',
  qianyi: '迁移宫',
  jiaoyou: '交友宫',
  guanlu: '官禄宫',
  tianzhai: '田宅宫',
  fude: '福德宫',
  fumu: '父母宫',
};

/** 盘上宫位顺序（从命宫起，每减一地支前进一宫） */
export const PALACE_ORDER: PalaceKey[] = [
  'ming', 'xiongdi', 'fuqi', 'zinv', 'caibo', 'jiee',
  'qianyi', 'jiaoyou', 'guanlu', 'tianzhai', 'fude', 'fumu',
];

export const TOPIC_PALACE: Record<TopicKey, PalaceKey> = {
  overview: 'ming',
  personality: 'ming',
  love: 'fuqi',
  career: 'guanlu',
  wealth: 'caibo',
  health: 'jiee',
  family: 'xiongdi',
  children: 'zinv',
  move: 'qianyi',
  friends: 'jiaoyou',
  home: 'tianzhai',
  spirit: 'fude',
  parents: 'fumu',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview: '命格总览',
  personality: '性格特质',
  love: '感情婚姻',
  career: '事业职业',
  wealth: '财富运势',
  health: '健康状况',
  family: '兄弟合伙',
  children: '子女缘分',
  move: '迁移外出',
  friends: '人际贵人',
  home: '田宅不动产',
  spirit: '精神福德',
  parents: '父母长辈',
};

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

/** 每个宫位主管的人生领域（用于解读的「主管」说明） */
export const PALACE_ROLE: Record<PalaceKey, string> = {
  ming: '自我、格局、一生气运的总纲',
  xiongdi: '手足、合伙人、经济往来与床第之秘',
  fuqi: '婚姻、配偶、感情相处模式',
  zinv: '子女、晚辈、部属、性爱与生育',
  caibo: '理财方式、财路、赚钱模式',
  jiee: '体质、疾病、意外、情绪病',
  qianyi: '外出、社会机遇、外人眼中的形象',
  jiaoyou: '朋友、部属、贵人、小人',
  guanlu: '事业形态、社会地位、成就方式',
  tianzhai: '不动产、家宅、财库、家族环境',
  fude: '精神世界、兴趣、享福方式、前业',
  fumu: '父母、长辈、文书、庇护、上司缘',
};

/**
 * 三方四正：本宫 i → 对宫 (i+6)、三合 (i+4)、(i+8)（按宫位顺序索引）
 * 与地支算法等价（支 +4 / +8 / +6 对应宫序 -4 / -8 / -6）。
 */
export function sanFangSiZheng(idx: number): { duigong: number; sanhe1: number; sanhe2: number } {
  return {
    duigong: (idx + 6) % 12,
    sanhe1: (idx + 4) % 12,
    sanhe2: (idx + 8) % 12,
  };
}
