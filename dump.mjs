import { generateChart } from './lib/ziwei/algorithm.ts';
const chart = generateChart({ year: 1990, month: 1, day: 1, hour: 5, gender: 'male', name: '测试', province: '北京', city: '北京', longitude: 116.4 });
for (const p of chart.palaces) {
  console.log(`${p.name} stem=${p.stem} branch=${p.branch} daXian=${JSON.stringify(p.daXianAge)} empty=${p.isEmpty} borrow=${p.borrowedFromName} ${JSON.stringify(p.borrowedStars)} selfSihua=${JSON.stringify(p.selfSihua)}`);
  console.log('  stars: ' + p.stars.map(s => `${s.name}(${s.type},${s.brightnessRaw})${s.siHua ? '化' + s.siHua : ''}`).join(' '));
}
console.log('ju', chart.wuxingJuName, 'mingZhu', chart.mingZhu, 'shenZhu', chart.shenZhu, 'yy', chart.yinYangGender, 'age', chart.currentAge, 'dxIdx', chart.currentDaXianIndex);
console.log('daXians', JSON.stringify(chart.daXians.map(d => [d.startAge, d.endAge, d.palaceName, d.stemName, d.siHua])));
