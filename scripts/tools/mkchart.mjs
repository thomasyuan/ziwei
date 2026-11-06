// 生成测试用命盘 JSON（node 20+ 直接跑，无需 tsx）
import { writeFileSync } from 'node:fs';
const { generateChart } = await import('../../lib/ziwei/algorithm.ts');
const c = generateChart({ year: 1986, month: 8, day: 20, hour: 3, gender: 'female', name: '测试', province: '广东', city: '广州', longitude: 113.3 });
writeFileSync('.chart.json', JSON.stringify(c));
writeFileSync('.req.json', JSON.stringify({ chart: c, year: 2026 }));
console.log('ok palaces', c.palaces.length);
