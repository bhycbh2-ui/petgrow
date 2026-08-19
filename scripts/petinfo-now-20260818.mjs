import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
let block = app.slice(start, end);

const items = [
  { category: 'dog', featured: false, title: '산책 후 발바닥과 발가락 사이를 확인해요', enTitle: 'Check paws and between toes after walks', summary: '산책길의 작은 돌, 씨앗, 흙이나 이물질이 발 사이에 남아 불편함을 줄 수 있어요.', enSummary: 'Small stones, seeds, dirt, or debris can remain between the toes after a walk.', body: '귀가 후 발바닥과 발가락 사이를 가볍게 살펴보고 젖었거나 더러우면 닦은 뒤 잘 말려 주세요. 상처·절뚝거림·계속 핥는 행동이 보이면 수의사와 상담하세요.', enBody: 'After walks, gently inspect paw pads and between the toes, clean if needed, and dry well. Contact a veterinarian if you notice wounds, limping, or persistent licking.' },
  { category: 'cat', featured: false, title: '화장실 주변 모래도 자주 정리해요', enTitle: 'Clean scattered litter around the box regularly', summary: '화장실 밖으로 나온 모래와 먼지를 정리하면 생활공간을 더 깔끔하게 유지할 수 있어요.', enSummary: 'Cleaning scattered litter and dust helps keep the living area tidy.', body: '화장실 주변을 주기적으로 쓸거나 닦고, 청소 후에는 손을 씻어 주세요. 고양이 용품은 제품 라벨의 세척 지침을 따르는 게 좋아요.', enBody: 'Sweep or wipe around the litter box regularly and wash your hands after cleaning. Follow product-label directions when cleaning cat supplies.' },
  { category: 'health', featured: true, title: '평소 활력과 행동 패턴을 알아두세요', enTitle: 'Know your pet’s normal activity and behavior patterns', summary: '평소 모습을 알아두면 갑작스러운 변화가 생겼을 때 더 빨리 알아차릴 수 있어요.', enSummary: 'Knowing what is normal makes sudden changes easier to notice.', body: '식사, 음수, 배변, 수면, 놀이 같은 평소 패턴을 가볍게 기록해 두세요. 눈에 띄는 변화가 지속되거나 다른 증상이 함께 나타나면 수의사에게 상담하세요.', enBody: 'Keep simple notes on eating, drinking, elimination, sleep, and play. If a noticeable change persists or occurs with other symptoms, contact a veterinarian.' },
  { category: 'life', featured: false, title: '반려동물 침구는 정기적으로 세탁해요', enTitle: 'Wash pet bedding regularly', summary: '침구와 담요는 털, 먼지, 오염이 쌓이기 쉬워 정기적인 세척이 도움이 돼요.', enSummary: 'Beds and blankets can collect fur, dirt, and debris, so regular cleaning helps.', body: 'CDC는 반려동물 침구와 담요 같은 용품을 정기적으로 세척하도록 안내해요. 제품의 세탁 지침을 확인하고 충분히 말린 뒤 다시 사용하세요.', enBody: 'CDC recommends regularly cleaning pet supplies such as beds and blankets. Follow the item’s washing instructions and dry thoroughly before reuse.' },
  { category: 'food', featured: true, title: '물그릇은 매일 씻고 깨끗한 물을 채워요', enTitle: 'Wash water bowls daily and refill with fresh water', summary: '물그릇도 음식그릇처럼 오염될 수 있어 정기적인 세척이 필요해요.', enSummary: 'Water bowls can become contaminated just like food bowls and need regular cleaning.', body: 'FDA와 CDC는 물그릇을 자주 세척하도록 안내해요. 남은 물을 버리고 그릇을 씻어 말린 뒤 깨끗한 물을 채워 주세요.', enBody: 'FDA and CDC recommend frequent cleaning of water bowls. Empty old water, wash and dry the bowl, then refill it with fresh water.' },
  { category: 'training', featured: false, title: '새 행동은 방해가 적은 곳에서 먼저 연습해요', enTitle: 'Practice new behaviors first in a low-distraction place', summary: '처음부터 자극이 많은 장소에서 연습하면 집중하기 어려울 수 있어요.', enSummary: 'Learning can be harder when a new behavior is practiced in a highly distracting environment.', body: '집처럼 조용한 환경에서 짧게 연습한 뒤 성공이 늘면 복도, 현관, 야외처럼 자극이 많은 곳으로 천천히 넓혀 주세요. 성공 직후 보상하는 일관성도 중요해요.', enBody: 'Start with short practice in a quiet place, then gradually add distractions as success improves. Reward consistently right after the desired behavior.' },
  { category: 'safety', featured: false, title: '세척·소독제는 완전히 마른 뒤 반려동물이 접근하게 해요', enTitle: 'Let cleaned surfaces dry before pets return', summary: '일부 소독제는 젖어 있을 때 반려동물에게 위험할 수 있어 제품 지침을 지켜야 해요.', enSummary: 'Some disinfectants can be hazardous while wet, so label directions matter.', body: 'CDC는 세척제와 소독제를 라벨대로 사용하고 필요한 경우 표면이 완전히 마를 때까지 반려동물의 접근을 막도록 안내해요. 제품은 항상 손이 닿지 않는 곳에 보관하세요.', enBody: 'CDC advises using cleaners and disinfectants exactly as labeled and keeping pets away until surfaces are dry when required. Store products securely out of reach.' },
  { category: 'grooming', featured: false, title: '브러시와 빗도 털을 제거하고 정리해요', enTitle: 'Remove trapped fur from brushes and combs', summary: '미용도구에 쌓인 털과 먼지를 정리하면 다음 사용 때 더 깔끔하게 관리할 수 있어요.', enSummary: 'Removing fur and debris from grooming tools keeps them cleaner for the next use.', body: '사용 후 브러시와 빗에 낀 털을 제거하고 제품 재질에 맞는 방법으로 닦아 충분히 말려 보관하세요. 피부병이 있거나 여러 동물이 함께 쓰는 경우에는 수의사에게 적절한 위생 관리법을 문의하세요.', enBody: 'After use, remove trapped fur, clean according to the tool material, and dry thoroughly before storage. If a pet has a skin condition or tools are shared, ask a veterinarian about appropriate hygiene.' }
];

const existingTitles = new Set([...block.matchAll(/title:\s*\{\s*ko:\s*["'`]([^"'`]+)["'`]/g)].map(m => m[1]));
const ids = [...block.matchAll(/id:\s*["']t(\d+)["']/g)].map(m => Number(m[1])).filter(Number.isFinite);
let nextId = (ids.length ? Math.max(...ids) : 0) + 1;
const additions = [];
for (const item of items) {
  if (existingTitles.has(item.title)) {
    console.log('Skip duplicate title:', item.title);
    continue;
  }
  const id = `t${nextId++}`;
  additions.push(`\n  { id: "${id}", category: "${item.category}", featured: ${item.featured},\n    title: { ko: ${JSON.stringify(item.title)}, en: ${JSON.stringify(item.enTitle)} },\n    summary: { ko: ${JSON.stringify(item.summary)}, en: ${JSON.stringify(item.enSummary)} },\n    body: { ko: ${JSON.stringify(item.body)}, en: ${JSON.stringify(item.enBody)} } },`);
  existingTitles.add(item.title);
}

if (!additions.length) {
  console.log('No new PetInfo items to add.');
  process.exit(0);
}

app = app.slice(0, end) + additions.join('') + app.slice(end);
fs.writeFileSync(path, app);
console.log(`Added ${additions.length} PetInfo items.`);
