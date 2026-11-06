import { KNOWLEDGE_STAR_DB } from './lib/interpret/knowledge.ts';
import { getKnowledge, getAllKnowledgeRoutes } from './lib/seo/knowledge.ts';
console.log('routes:', getAllKnowledgeRoutes().length);
const d = getKnowledge('紫微', 'love');
console.log('exists:', d.exists, '| palace:', d.palaceName, '| dingdiao:', d.parsed.dingdiao);
console.log('--- core ---\n', d.parsed.lundian.slice(0, 400));
console.log('--- basis ---\n', d.parsed.yiju.slice(0, 200));
console.log('--- source ---\n', d.parsed.chuchu.slice(0, 300));
