import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

const expectedCategories = ['dog','cat','health','life','food','training','safety','grooming'];
const existingIds = [...block.matchAll(/id:\s*"t(\d+)"/g)].map(m => Number(m[1]));
const existingCategories = [...block.matchAll(/category:\s*"(dog|cat|health|life|food|training|safety|grooming)"/g)].map(m => m[1]);
const counts = Object.fromEntries(expectedCategories.map(c => [c, existingCategories.filter(x => x === c).length]));
if (!existingIds.length) throw new Error('No existing PetInfo IDs found.');
if (expectedCategories.some(c => !counts[c])) throw new Error(`Missing PetInfo category: ${JSON.stringify(counts)}`);
const maxId = Math.max(...existingIds);
if (maxId < 226) throw new Error(`Expected PetInfo dataset through at least t226, found t${maxId}. Refusing stale update.`);
if (block.includes('2026-08-21')) {
  console.log('2026-08-21 PetInfo items already present.');
  process.exit(0);
}
console.log('Existing PetInfo inventory:', { total: existingIds.length, maxId, counts });

const candidates = [
  { category:'dog', featured:true, signature:'목줄 연결부', titleKo:'목줄·하네스 연결부는 산책 전에 한 번 더 확인해요', titleEn:'Check leash and harness connections before walks', summaryKo:'버클과 고리, 리드줄 연결부가 제대로 잠겼는지 출발 전에 확인하면 예기치 않은 이탈을 줄이는 데 도움이 돼요.', summaryEn:'A quick check of buckles, rings, and leash clips before leaving can reduce accidental escapes.', bodyKo:'착용감뿐 아니라 버클이 끝까지 잠겼는지, 금속 고리나 리드줄 클립에 금이 가거나 느슨한 부분은 없는지 살펴보세요. 성장기나 체중 변화가 있는 강아지는 장비가 너무 조이거나 헐거워지지 않았는지도 주기적으로 다시 맞춰주세요.', bodyEn:'Check that buckles are fully closed and that rings and leash clips are not cracked, bent, or loose. For growing dogs or dogs whose weight changes, recheck the fit regularly so equipment is neither too tight nor too loose.' },
  { category:'dog', featured:false, signature:'차 문을 열기 전', titleKo:'차 문을 열기 전에는 기다리는 순서를 정해둬요', titleEn:'Teach a pause before opening the car door', summaryKo:'차에서 내릴 때 바로 뛰어나가지 않도록 문이 열려도 잠시 기다리는 습관을 만들면 이동이 한결 안전해져요.', summaryEn:'Practicing a brief pause before exiting the car can make arrivals safer and more predictable.', bodyKo:'처음에는 조용한 장소에서 리드줄을 연결한 상태로 문을 조금 열고, 차분히 기다리면 짧게 보상한 뒤 내려오게 해보세요. 주차장이나 도로 주변에서는 항상 리드줄을 먼저 확보하고 차량과 주변 교통 상황을 확인한 뒤 이동하세요.', bodyEn:'Begin in a quiet place with the leash secured, open the door slightly, reward a calm pause, and then invite the dog out. Near roads or parking areas, secure the leash first and check traffic and surroundings before exiting.' },

  { category:'cat', featured:true, signature:'모래를 바꿀 때', titleKo:'고양이 모래를 바꿀 때는 익숙한 냄새를 조금 남겨요', titleEn:'Change cat litter gradually when possible', summaryKo:'모래 종류를 갑자기 전부 바꾸면 화장실 사용을 망설이는 고양이도 있어 기존 모래와 새 모래를 단계적으로 섞어볼 수 있어요.', summaryEn:'Some cats hesitate when litter changes suddenly, so a gradual transition can make the new texture and scent easier to accept.', bodyKo:'새 모래가 꼭 필요한 상황이라면 며칠에 걸쳐 비율을 조금씩 늘리고 화장실 위치와 청소 루틴은 가능한 한 그대로 유지해 주세요. 소변을 보지 못하거나 힘주기, 잦은 출입 같은 변화가 보이면 단순 취향 문제로 넘기지 말고 신속히 수의사에게 상담하세요.', bodyEn:'If a new litter is needed, increase its proportion over several days while keeping box location and cleaning routine as consistent as possible. Inability to urinate, straining, or repeated box visits can be urgent and should prompt veterinary advice.' },
  { category:'cat', featured:false, signature:'숨숨집 출구', titleKo:'숨숨집은 들어간 뒤 빠져나올 길도 편한지 봐주세요', titleEn:'Make sure cat hiding spots have an easy exit', summaryKo:'편안한 은신처는 몸을 숨길 수 있을 뿐 아니라 필요할 때 다른 동물이나 사람을 피해 자연스럽게 나올 수 있어야 해요.', summaryEn:'A comfortable hiding place should let a cat feel concealed while still having an easy way to leave when needed.', bodyKo:'상자나 숨숨집을 벽 사이에 너무 끼워 한쪽 출구만 막히게 두기보다 주변에 여유를 두고 배치해 주세요. 다묘 가정에서는 한 마리가 입구를 막아 다른 고양이가 갇히는 상황이 생기지 않도록 은신처와 이동 경로를 여러 곳에 마련하는 것이 좋아요.', bodyEn:'Avoid wedging boxes or hideaways so tightly that the exit can be blocked. In multi-cat homes, provide multiple hiding places and routes so one cat cannot easily trap another at a single entrance.' },

  { category:'health', featured:true, signature:'입 냄새를 나이 탓', titleKo:'심해진 입 냄새를 단순히 나이 탓으로 넘기지 않아요', titleEn:'Do not dismiss worsening bad breath as normal aging', summaryKo:'지속적인 심한 입 냄새와 붉은 잇몸, 먹기 불편해하는 모습은 구강 상태를 확인할 신호가 될 수 있어요.', summaryEn:'Persistent strong breath, red gums, or difficulty eating can be reasons to have a pet’s mouth examined.', bodyKo:'AAHA의 반려견·반려묘 치과 관리 자료는 정기적인 구강 평가와 적절한 가정 관리를 강조해요. 입 냄새가 갑자기 심해지거나 잇몸 출혈, 침 흘림, 한쪽으로만 씹기 같은 변화가 있으면 임의로 사람용 구강제품을 쓰지 말고 수의사에게 구강 검진을 상담하세요.', bodyEn:'AAHA dental-care guidance emphasizes regular oral assessment and appropriate home care. If breath suddenly worsens or you notice bleeding gums, drooling, or one-sided chewing, avoid human oral-care products and ask your veterinarian about an oral examination.' },
  { category:'health', featured:false, signature:'집에서 양치', titleKo:'집에서 양치는 짧고 편안한 단계부터 시작해요', titleEn:'Build pet tooth brushing in short, comfortable steps', summaryKo:'처음부터 입 전체를 닦으려 하기보다 입 주변 만지기와 짧은 칫솔 접촉을 천천히 익히면 관리가 수월해질 수 있어요.', summaryEn:'Starting with brief, comfortable handling can make tooth brushing easier than trying to brush the whole mouth at once.', bodyKo:'반려동물용 부드러운 칫솔과 전용 치약을 사용하고, 싫어하면 억지로 입을 벌리기보다 짧게 끝낸 뒤 다음 기회에 다시 시도하세요. AAHA는 사람용 치약을 사용하지 않도록 안내하며, 통증·출혈·심한 구취가 있다면 양치로 해결하려 하지 말고 먼저 수의사에게 확인받는 것이 좋아요.', bodyEn:'Use a soft pet toothbrush and pet-specific toothpaste, and keep sessions short rather than forcing the mouth open. AAHA advises against human toothpaste; pain, bleeding, or marked bad breath should be evaluated by a veterinarian rather than treated with brushing alone.' },

  { category:'life', featured:false, signature:'문 여닫는 규칙', titleKo:'가족과 방문객에게 출입문 여닫는 규칙을 공유해요', titleEn:'Share door-safety rules with family and visitors', summaryKo:'반려동물이 현관으로 따라오는 집이라면 누가 문을 열더라도 같은 순서로 확인하도록 약속해두면 좋아요.', summaryEn:'If a pet tends to approach the entrance, consistent door routines among household members and visitors can reduce escape opportunities.', bodyKo:'택배나 손님 방문 전에는 반려동물이 어디에 있는지 먼저 확인하고 필요하면 안전문이나 다른 방을 활용하세요. 어린이와 방문객에게도 문을 오래 열어두지 않기, 반려동물이 근처에 있으면 보호자에게 알리기 같은 간단한 규칙을 알려주세요.', bodyEn:'Before deliveries or guests arrive, locate your pet and use a gate or separate room when helpful. Give children and visitors simple rules such as not leaving doors open and alerting the owner if the pet is near the entrance.' },
  { category:'life', featured:true, signature:'장거리 이동 전', titleKo:'장거리 이동 전에는 짧은 이동부터 연습해요', titleEn:'Practice short trips before a long journey', summaryKo:'이동장이나 차량에 익숙하지 않은 아이는 긴 여행 당일 처음 경험하기보다 짧고 편안한 이동을 여러 번 경험하는 편이 좋아요.', summaryEn:'Pets unfamiliar with carriers or car travel may cope better after several short, calm practice trips before a long journey.', bodyKo:'이동장 안에서 간식을 먹거나 잠깐 머무는 연습부터 시작하고, 이후 짧은 거리 이동으로 시간을 조금씩 늘려보세요. 멀미나 극심한 불안이 반복되면 임의로 사람 약을 주지 말고 여행 전 수의사에게 안전한 관리 방법을 상담하세요.', bodyEn:'Start with treats and brief stays in the carrier, then gradually add short trips. If motion sickness or severe anxiety recurs, do not give human medication on your own; discuss safe travel management with your veterinarian.' },

  { category:'food', featured:true, signature:'사료는 원래 포장', titleKo:'건사료는 원래 포장 정보를 남긴 채 보관해요', titleEn:'Keep dry pet food with its original packaging information', summaryKo:'제품명·제조번호·유통기한을 확인할 수 있도록 원래 포장을 보관하면 보관 관리와 리콜 확인에 도움이 돼요.', summaryEn:'Keeping the original package preserves product, lot, and date information that can help with storage and recall checks.', bodyKo:'FDA는 건사료를 서늘하고 건조한 곳에 두고 원래 포장을 유지하도록 안내해요. 별도 보관함을 쓴다면 포장째 넣거나 제품명·로트번호·유통기한을 확인할 수 있게 남겨두고, 새 사료를 넣기 전 용기는 깨끗하고 완전히 마른 상태로 관리하세요.', bodyEn:'FDA advises storing dry pet food in a cool, dry place and keeping it in the original bag. If you use a storage bin, place the bag inside or retain product, lot, and date details, and make sure the container is clean and fully dry before refilling.' },
  { category:'food', featured:false, signature:'남은 습식', titleKo:'개봉한 습식 사료는 남은 양을 오래 실온에 두지 않아요', titleEn:'Refrigerate or discard leftover wet pet food promptly', summaryKo:'캔이나 파우치를 개봉한 뒤 남은 사료는 뚜껑을 덮어 냉장하거나 안전하게 버리는 것이 좋아요.', summaryEn:'After opening canned or pouched food, cover and refrigerate leftovers promptly or discard them safely.', bodyKo:'FDA는 사용하고 남은 캔·파우치 사료를 즉시 냉장하거나 폐기하고 냉장 보관 시 단단히 덮도록 안내해요. 냄새나 상태가 평소와 다르거나 얼마나 오래 방치됐는지 확실하지 않다면 먹이지 않는 편이 안전하며, 제품별 보관 지침도 함께 확인하세요.', bodyEn:'FDA recommends promptly refrigerating or discarding unused canned or pouched pet food and tightly covering refrigerated leftovers. If odor or appearance is unusual, or you are unsure how long it was left out, do not feed it and check the product’s storage directions.' },

  { category:'training', featured:true, signature:'초인종 소리', titleKo:'초인종 소리는 아주 작은 자극부터 차분하게 연습해요', titleEn:'Practice doorbell sounds at a low intensity first', summaryKo:'초인종에 크게 흥분하거나 짖는다면 실제 손님이 올 때만 훈련하기보다 낮은 볼륨의 녹음부터 연습할 수 있어요.', summaryEn:'For pets that react strongly to the doorbell, practice can begin with a quiet recording rather than only during real arrivals.', bodyKo:'반응이 거의 없는 낮은 소리에서 간식이나 차분한 행동과 연결하고, 편안함이 유지될 때만 볼륨을 조금씩 높여주세요. 짖음이나 불안이 커지면 난도를 낮추고, 공포나 공격 반응이 심하면 보상 기반 훈련을 사용하는 수의행동 전문가나 자격 있는 훈련사에게 도움을 받아보세요.', bodyEn:'Pair a barely noticeable recording with rewards or calm behavior and increase volume only while the pet stays comfortable. If barking or anxiety escalates, lower the difficulty; severe fear or aggression may warrant help from a reward-based veterinary behavior professional or qualified trainer.' },
  { category:'training', featured:false, signature:'매트에서 쉬기', titleKo:'매트에서 쉬는 행동을 일상 신호로 만들어봐요', titleEn:'Teach settling on a mat as an everyday cue', summaryKo:'특정 매트에 가서 편하게 머무는 연습은 식사 준비나 손님 방문처럼 잠시 기다려야 하는 상황에서 활용하기 좋아요.', summaryEn:'A comfortable mat cue can be useful during meals, visitors, or other moments when a pet needs a predictable place to settle.', bodyKo:'처음에는 매트를 바라보거나 한 발 올리는 작은 행동부터 보상하고, 스스로 올라가면 눕거나 머무는 시간을 아주 짧게 늘려주세요. 벌을 주는 장소로 사용하지 말고 편안한 휴식과 좋은 경험이 연결되도록 연습하세요.', bodyEn:'Reward small steps such as looking at or stepping onto the mat, then gradually reinforce lying down and very short stays. Do not use the mat as punishment; keep it associated with calm, positive experiences.' },

  { category:'safety', featured:true, signature:'전자담배 액상', titleKo:'전자담배 액상과 리필 용기는 반려동물 손이 닿지 않게 보관해요', titleEn:'Keep e-cigarette liquids and refills away from pets', summaryKo:'전자담배와 리필 제품은 니코틴을 포함할 수 있어 씹거나 핥지 못하도록 잠금 보관이 필요해요.', summaryEn:'E-cigarettes and refill products can contain nicotine and should be stored where pets cannot chew or lick them.', bodyKo:'FDA는 담배 제품과 전자담배 및 리필을 반려동물에게 위험할 수 있는 품목으로 안내해요. 액상이 새거나 용기를 씹은 흔적이 있거나 섭취가 의심되면 증상을 기다리지 말고 제품 정보를 확보해 즉시 수의사 또는 응급 동물병원에 연락하세요.', bodyEn:'FDA lists tobacco products, including e-cigarettes and refills, among items that can be dangerous to pets. If a container leaks, is chewed, or ingestion is suspected, keep the product information and contact a veterinarian or emergency animal hospital promptly rather than waiting for symptoms.' },
  { category:'safety', featured:false, signature:'생이스트 반죽', titleKo:'부풀리는 생이스트 반죽은 반려동물이 먹지 못하게 치워요', titleEn:'Keep raw yeast dough out of pets’ reach', summaryKo:'발효 중인 생반죽은 반려동물에게 안전한 간식이 아니므로 조리 전후 모두 접근하지 못하게 관리해요.', summaryEn:'Raw yeast dough is not a safe pet treat and should remain inaccessible before and during baking.', bodyKo:'FDA는 생이스트 반죽을 반려동물에게 잠재적으로 위험한 식품으로 안내해요. 반죽을 먹은 것이 의심되면 집에서 억지로 토하게 하거나 임의 처치하지 말고 먹은 양과 시간을 확인해 수의사 또는 응급 동물병원에 바로 상담하세요.', bodyEn:'FDA identifies raw yeast products as potentially dangerous for pets. If ingestion is suspected, do not induce vomiting or attempt home treatment; note the amount and timing and contact a veterinarian or emergency animal hospital promptly.' },

  { category:'grooming', featured:false, signature:'브러시와 빗도 세척', titleKo:'브러시와 빗도 털을 제거하고 깨끗하게 관리해요', titleEn:'Clean grooming brushes and combs regularly', summaryKo:'미용 도구에 털과 피지가 계속 쌓이지 않도록 사용 후 털을 제거하고 제품에 맞는 방법으로 청결하게 관리해요.', summaryEn:'Remove trapped hair after grooming and clean brushes and combs appropriately so debris and oils do not keep building up.', bodyKo:'사용 뒤 엉킨 털을 빼고 세척 가능한 도구는 제조사 지침에 따라 씻은 뒤 완전히 말려주세요. 녹이 슬거나 날카롭게 변형된 핀, 깨진 빗살이 있으면 피부를 긁을 수 있으니 교체하고, 피부 감염을 치료 중인 경우 도구 공유와 소독 방법은 수의사에게 확인하세요.', bodyEn:'Remove trapped hair after use, wash washable tools according to manufacturer instructions, and dry them completely. Replace rusty, sharp, or broken pins and teeth; if a pet is being treated for a skin infection, ask your veterinarian about tool sharing and disinfection.' },
  { category:'grooming', featured:true, signature:'목욕 전 엉킨 털', titleKo:'목욕 전에는 심하게 엉킨 털이 없는지 먼저 살펴봐요', titleEn:'Check for significant mats before bathing', summaryKo:'단단한 엉킴이 있는 상태에서 무작정 물을 묻히기보다 피부 당김과 엉킴 정도를 먼저 확인하는 편이 좋아요.', summaryEn:'Before bathing, check for tight mats and skin pulling rather than simply wetting heavily tangled coat.', bodyKo:'가벼운 엉킴은 털 끝부터 조금씩 풀되 피부를 잡아당기지 않도록 하고, 피부 가까이 단단하게 뭉친 털은 가위로 무리하게 자르지 마세요. 통증이 있거나 피부가 보이지 않을 정도의 심한 엉킴은 전문 미용사나 동물병원에 도움을 요청하는 것이 안전해요.', bodyEn:'Work through minor tangles gently from the ends without pulling the skin, and do not use scissors blindly on tight mats close to the body. Painful or severe matting that hides the skin is safer to address with a professional groomer or veterinary team.' },
];

const normalize = s => String(s).toLowerCase().replace(/[\s·—–,.'"!?/()\-]/g, '');
for (const x of candidates) {
  if (normalize(block).includes(normalize(x.signature))) throw new Error(`Potential topic overlap found for signature: ${x.signature}`);
}
const titleMatches = [...block.matchAll(/title:\s*\{\s*ko:\s*"([^"]+)"/g)].map(m => normalize(m[1]));
for (const x of candidates) {
  if (titleMatches.includes(normalize(x.titleKo))) throw new Error(`Duplicate title: ${x.titleKo}`);
}
const perCategory = Object.fromEntries(expectedCategories.map(c => [c, candidates.filter(x => x.category === c).length]));
if (expectedCategories.some(c => perCategory[c] !== 2)) throw new Error(`Need exactly 2 additions per category: ${JSON.stringify(perCategory)}`);
if (candidates.length !== 16) throw new Error(`Need exactly 16 additions, got ${candidates.length}`);

const quote = s => JSON.stringify(s);
const additions = candidates.map((x, i) => {
  const id = `t${maxId + i + 1}`;
  return `  { id: ${quote(id)}, category: ${quote(x.category)}, featured: ${x.featured},\n    title: { ko: ${quote(x.titleKo)}, en: ${quote(x.titleEn)} },\n    summary: { ko: ${quote(x.summaryKo)}, en: ${quote(x.summaryEn)} },\n    body: { ko: ${quote(x.bodyKo)}, en: ${quote(x.bodyEn)} }, sourceDate: "2026-08-21" },`;
}).join('\n');

app = app.slice(0, end) + '\n\n' + additions + app.slice(end);

const updatedEnd = app.indexOf('\n];', start);
const updatedBlock = app.slice(start, updatedEnd);
const addedIds = [...updatedBlock.matchAll(/sourceDate:\s*"2026-08-21"/g)].length;
if (addedIds !== 16) throw new Error(`Post-insert validation failed: expected 16 dated items, got ${addedIds}`);
for (const c of expectedCategories) {
  const count = candidates.filter(x => x.category === c).length;
  if (count !== 2) throw new Error(`Post-insert category validation failed for ${c}`);
}
const allTitles = [...updatedBlock.matchAll(/title:\s*\{\s*ko:\s*"([^"]+)"/g)].map(m => normalize(m[1]));
if (new Set(allTitles).size !== allTitles.length) throw new Error('Duplicate Korean PetInfo title detected after insertion.');
if (/\uFFFD/.test(additions)) throw new Error('Replacement character detected in additions.');

fs.writeFileSync(path, app);
console.log('Added 16 PetInfo items for 2026-08-21:', candidates.map(x => `${x.category}: ${x.titleKo}`));
