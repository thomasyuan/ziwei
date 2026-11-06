import { generateChart } from './lib/ziwei/algorithm.ts';
import { detectPatterns } from './lib/ziwei/patterns.ts';
const seen = new Map();
const t0 = Date.now();
for (let y = 1950; y <= 2026; y += 1) {
  for (let m = 1; m <= 12; m += 1) {
    for (let h = 0; h < 12; h += 1) {
      const g = (y + m + h) % 2 ? 'male' : 'female';
      const c = generateChart({ year: y, month: m, day: Math.min(28, 1 + ((y+m)%28)+1), hour: h, gender: g });
      for (const p of detectPatterns(c)) {
        if (!seen.has(p.name)) seen.set(p.name, { level: p.level, description: p.description, palaces: p.palaces, source: p.source });
      }
    }
  }
}
console.log('charts:', 77*12*12, 'patterns found:', seen.size, 'time ms:', Date.now()-t0);
console.log([...seen.keys()].join(', '));
