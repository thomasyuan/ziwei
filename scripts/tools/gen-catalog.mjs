// 一次性生成格局目录（从排盘引擎扫盘得到，作为静态数据）
import { writeFileSync } from 'node:fs';
import { generateChart } from './lib/ziwei/algorithm.ts';
import { detectPatterns } from './lib/ziwei/patterns.ts';

const seen = new Map();
let i = 0;
const YEARS = [];
for (let y = 1950; y <= 1970; y++) YEARS.push(y);
for (let y = 2020; y <= 2026; y++) YEARS.push(y);
for (const y of YEARS) {
  for (let m = 1; m <= 12; m++) {
    for (let h = 0; h < 12; h++) {
      for (const g of ['male', 'female']) {
        i++;
        const day = 1 + ((y * 7 + m * 13 + h) % 27) + 1;
        const c = generateChart({ year: y, month: m, day: Math.min(28, day), hour: h, gender: g });
        for (const p of detectPatterns(c)) {
          if (!seen.has(p.name)) {
            seen.set(p.name, { name: p.name, level: p.level, description: p.description, palaces: p.palaces, source: p.source ?? null, sample: p.conditions ?? null });
          }
        }
      }
    }
    if (m % 4 === 0) console.log(`progress year=${y} month=${m} seen=${seen.size}`);
  }
}
const rows = [...seen.values()];
const body = JSON.stringify(rows, null, 2);
const file = `/**\n * 格局目录 —— 由排盘引擎扫盘生成（静态数据，构建时零成本）\n * 生成方式：npx tsx gen-catalog.mjs（扫 YEARS.length*12*12*2 张盘，覆盖 ${rows.length} 种格局）\n * 每条含 name / level / description / palaces / source 与一条示例条件。\n */\n\nexport interface CatalogPattern {\n  name: string;\n  level: 'excellent' | 'good' | 'neutral' | 'caution';\n  description: string;\n  palaces: string[];\n  source: string | null;\n  sample?: { required: string[]; bonus?: string[]; breaking?: string[] } | null;\n}\n\nexport const PATTERN_CATALOG: CatalogPattern[] = ${body};\n`;
writeFileSync('lib/interpret/pattern-catalog.ts', file);
console.log('written', rows.length, 'patterns');
