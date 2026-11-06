/**
 * 主星论断总表 + 亮度分组 + 查询 helper
 */

import type { PalaceKey, SihuaKey, StarProfile } from './types';
import { ZIWEI, TIANJI, TAIYANG, WUQU } from './stars-1';
import { TIANTONG, LIANZHEN, TIANFU, TAIYIN } from './stars-2';
import { TANLANG, JUMEN, TIANXIANG, TIANLIANG } from './stars-3';
import { QISHA, POJUN } from './stars-4';
import { AUX_STARS } from './aux-1';
import { MINOR_STARS, GENERIC_MINOR } from './aux-2';
import { COMBOS, AUX_SIHUA } from './combos';

export const STAR_PROFILES: Record<string, StarProfile> = Object.fromEntries(
  [ZIWEI, TIANJI, TAIYANG, WUQU, TIANTONG, LIANZHEN, TIANFU, TAIYIN,
    TANLANG, JUMEN, TIANXIANG, TIANLIANG, QISHA, POJUN].map(s => [s.name, s]),
);

export const ALL_STARS: string[] = Object.keys(STAR_PROFILES);

export const AUX_MAP: Record<string, (typeof AUX_STARS)[number]> = Object.fromEntries(
  AUX_STARS.map(a => [a.name, a]),
);

export const MINOR_MAP: Record<string, (typeof MINOR_STARS)[number]> = Object.fromEntries(
  MINOR_STARS.map(m => [m.name, m]),
);

export const GENERIC_MAP: Record<string, { kind: 'lucky' | 'sha' | 'minor'; text: string }> = { ...GENERIC_MINOR };

export const COMBO_MAP: Record<string, (typeof COMBOS)[number]> = Object.fromEntries(
  COMBOS.map(c => [c.pair, c]),
);

/** 庙旺利陷平不闲陷 → 四档 */
export function brightnessGroup(b?: string): '庙旺' | '得地' | '平和' | '落陷' {
  if (!b) return '平和';
  if (b === '庙' || b === '旺') return '庙旺';
  if (b === '得' || b === '利') return '得地';
  if (b === '平') return '平和';
  return '落陷';
}

export function getStarProfile(name: string): StarProfile | undefined {
  return STAR_PROFILES[name];
}

/** 该星在此宫的四化论断（表内不存在时返回 null，如紫微化忌、七杀化权） */
export function getSihuaNote(starName: string, sihua: SihuaKey): { key: string; core: string } | null {
  const profile = STAR_PROFILES[starName];
  if (profile && profile.sihua[sihua]) {
    return { key: profile.sihua[sihua]!.key, core: profile.sihua[sihua]!.core };
  }
  const aux = AUX_SIHUA[starName];
  if (aux && aux[sihua]) return aux[sihua]!;
  return null;
}

/** 星在宫位中的核心论断（主星）；非主星返回 null */
export function getPalaceNote(starName: string, key: PalaceKey): { key: string; core: string; basis: string; advice: string } | null {
  const p = STAR_PROFILES[starName];
  return p ? p.palaces[key] : null;
}

export function getAuxText(starName: string, key: PalaceKey): string | null {
  const a = AUX_MAP[starName];
  if (a) return a.palaces[key];
  const m = MINOR_MAP[starName];
  if (m && m.palaces) return m.palaces[key];
  const g = GENERIC_MAP[starName];
  if (g) return g.text;
  return null;
}

export function getAuxIntro(starName: string): string | null {
  const a = AUX_MAP[starName];
  if (a) return a.intro;
  const m = MINOR_MAP[starName];
  if (m) return m.intro;
  const g = GENERIC_MAP[starName];
  if (g) return g.text;
  return null;
}

export function getCombo(stars: string[]) {
  const pair = [...stars].sort().join('|');
  return COMBO_MAP[pair] ?? null;
}

export type { StarProfile, PalaceKey, SihuaKey };