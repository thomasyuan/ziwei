/**
 * lib/ziwei/db-analysis —— 论断内容库入口
 *
 * 开源仓库里的这份文件是占位（STAR_DB 为空）。本站自建了论断库
 * （lib/interpret/），这里把内容接进同一套接口，使知识库 SEO 页
 * （lib/seo/knowledge.ts）与排盘解读共用一份数据源。
 *
 * 内容为本站原创编纂，义理依据公版古籍（《紫微斗数全书》《骨髓赋》等）。
 */

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

// iztro zh-CN 宫位名：命宫保留「宫」字，其余无「宫」字，「交友」在 iztro 里叫「仆役」
export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻',
  career:      '官禄',
  wealth:      '财帛',
  health:      '疾厄',
  family:      '兄弟',
  children:    '子女',
  move:        '迁移',
  friends:     '仆役',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    '命格总览',
  personality: '性格特质',
  love:        '感情婚姻',
  career:      '事业职业',
  wealth:      '财富运势',
  health:      '健康状况',
  family:      '兄弟合伙',
  children:    '子女缘分',
  move:        '迁移外出',
  friends:     '人际贵人',
  home:        '田宅不动产',
  spirit:      '精神福德',
  parents:     '父母长辈',
};

import { KNOWLEDGE_STAR_DB } from '@/lib/interpret/knowledge';

/** 论断内容库（14 主星 × 13 主题） */
export const STAR_DB: Record<string, Record<string, string>> = KNOWLEDGE_STAR_DB;
