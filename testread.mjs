import { generateChart } from './lib/ziwei/algorithm.ts';
import { detectPatterns } from './lib/ziwei/patterns.ts';
import { generateAllReadings } from './lib/interpret/generate.ts';

const chart = generateChart({ year: 1990, month: 1, day: 1, hour: 5, gender: 'male', name: '样例', province: '北京', city: '北京', longitude: 116.4 });
const patterns = detectPatterns(chart);
const readings = generateAllReadings(chart, { patterns, year: 2026 });
console.log('patterns:', patterns.map(p => `${p.name}(${p.level})`).join(', '));
const love = readings.find(r => r.topic === 'love');
console.log('\n=== love ===', love.palaceName, '|', love.dingdiao);
for (const s of love.sections) console.log(`\n[${s.title}]\n${s.body}`);
