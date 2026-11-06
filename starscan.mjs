import { generateChart } from './lib/ziwei/algorithm.ts';
const byType = {};
for (let y = 1950; y <= 2020; y += 7) {
  for (let m = 1; m <= 12; m += 3) {
    for (let h = 0; h < 12; h += 3) {
      const g = (y + m + h) % 2 ? 'male' : 'female';
      const c = generateChart({ year: y, month: m, day: 15, hour: h, gender: g });
      for (const p of c.palaces) for (const s of p.stars) {
        byType[s.type] = byType[s.type] || {};
        byType[s.type][s.name] = (byType[s.type][s.name] || 0) + 1;
      }
    }
  }
}
for (const t of Object.keys(byType)) {
  const arr = Object.entries(byType[t]).sort((a,b)=>b[1]-a[1]);
  console.log(`\n[${t}] ${arr.length} stars`);
  console.log(arr.map(([n,c])=>`${n}:${c}`).join('  '));
}
