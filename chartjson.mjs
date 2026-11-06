import { generateChart } from './lib/ziwei/algorithm.ts';
const c = generateChart({ year: 1986, month: 8, day: 20, hour: 3, gender: 'female', name: '林', province: '广东', city: '广州', longitude: 113.3 });
process.stdout.write(JSON.stringify(c));
