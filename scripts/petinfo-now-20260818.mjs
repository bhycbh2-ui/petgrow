import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

const categories = ['dog','cat','health','life','food','training','safety','grooming'];
const ids = [...block.matchAll(/id:\s*"t(\d+)"/g)].map(m => Number(m[1]));
const cats = [...block.matchAll(/category:\s*"(dog|cat|health|life|food|training|safety|grooming)"/g)].map(m => m[1]);
const titles = [...block.matchAll(/title:\s*\{\s*ko:\s*"([^"]+)"/g)].map(m => m[1]);
const counts = Object.fromEntries(categories.map(c => [c, cats.filter(x => x === c).length]));
if (!ids.length || categories.some(c => !counts[c])) throw new Error(`Invalid PetInfo inventory: ${JSON.stringify(counts)}`);
const maxId = Math.max(...ids);
if (maxId < 258) throw new Error(`Expected dataset through at least t258, found t${maxId}.`);
console.log('Existing PetInfo inventory:', { total: ids.length, maxId, counts });

const candidates = [
  {category:'dog',featured:true,titleKo:'비 오는 날 산책 뒤에는 몸을 충분히 말려줘요',titleEn:'Dry your dog well after rainy walks',summaryKo:'젖은 털과 발을 그대로 두기보다 부드럽게 닦고 피부가 축축하게 남지 않게 확인해요.',summaryEn:'After wet walks, gently dry the coat and paws and check that skin folds are not left damp.',bodyKo:'수건으로 발과 배, 털 사이의 물기를 눌러 닦고 피부가 접히는 부위도 확인하세요. 드라이어를 쓴다면 너무 뜨겁거나 가까운 바람은 피하고, 피부가 붉어지거나 냄새·가려움이 지속되면 수의사와 상담하세요.',bodyEn:'Towel-dry the paws, belly, and coat, including skin folds. If using a dryer, avoid hot air or holding it too close. Persistent redness, odor, or itching warrants veterinary advice.'},
  {category:'dog',featured:false,titleKo:'차에서 내리기 전에는 리드줄 연결을 먼저 확인해요',titleEn:'Check the leash before opening the car door',summaryKo:'차문을 열기 전에 하네스나 목줄과 리드줄이 제대로 연결됐는지 먼저 확인해 갑작스러운 뛰어내림을 예방해요.',summaryEn:'Before opening the car door, confirm the harness or collar and leash are securely connected to reduce sudden escapes.',bodyKo:'주차 후 바로 문을 열기보다 차량 안에서 리드줄 연결과 주변 차량·자전거·보행자를 먼저 확인하세요. 반려견이 흥분했다면 잠시 기다렸다가 보호자 신호에 맞춰 천천히 내리는 습관을 만들어 주세요.',bodyEn:'After parking, verify leash attachment and check for traffic, bicycles, and pedestrians before opening the door. If your dog is excited, wait briefly and practice exiting on cue.'},
  {category:'cat',featured:true,titleKo:'창문 방충망은 고양이 체중을 버티는 안전장치가 아니에요',titleEn:'Window screens are not fall-proof barriers for cats',summaryKo:'열린 창문 주변에서는 방충망만 믿지 말고 잠금장치와 튼튼한 안전망 등 별도 보호수단을 확인해요.',summaryEn:'Do not rely on an ordinary insect screen alone around open windows; use secure barriers and locks designed to prevent falls.',bodyKo:'고양이가 창가에 올라가는 집이라면 방충망의 찢김과 프레임 이탈 여부를 자주 살피고, 창문이 크게 열리지 않도록 제한장치나 안전망을 사용하세요. 가구를 창가 발판처럼 두는 것도 함께 점검하세요.',bodyEn:'Inspect screens and frames regularly and consider window restrictors or secure pet-safe barriers. Also check whether nearby furniture creates an easy launch point toward an open window.'},
  {category:'cat',featured:false,titleKo:'화장실 모래를 바꿀 때는 기존 모래와 천천히 섞어줘요',titleEn:'Transition cat litter gradually when possible',summaryKo:'모래 종류를 갑자기 전부 바꾸기보다 기존 모래와 조금씩 섞어 냄새와 촉감 변화에 적응할 시간을 줘요.',summaryEn:'When changing litter, gradually mixing the new type with the familiar one can make the texture and scent change easier to accept.',bodyKo:'며칠에 걸쳐 새 모래의 비율을 조금씩 늘리고 화장실 위치와 청결 상태는 안정적으로 유지해 주세요. 갑자기 화장실을 피하거나 배뇨·배변 행동이 달라지면 단순한 취향 문제로만 보지 말고 건강 상태도 확인하세요.',bodyEn:'Increase the proportion of new litter over several days while keeping the box location and cleanliness consistent. Sudden litter-box avoidance or elimination changes can also warrant a health check.'},
  {category:'health',featured:true,titleKo:'평소 호흡 모습을 짧게 영상으로 남겨두면 비교에 도움이 돼요',titleEn:'A short video of normal breathing can help with comparison',summaryKo:'편안히 쉬는 평소 호흡 모습을 가끔 기록해두면 나중에 변화가 생겼을 때 설명하는 데 도움이 될 수 있어요.',summaryEn:'Occasionally recording your pet breathing comfortably at rest can help demonstrate changes later.',bodyKo:'반려동물이 편안히 쉬는 순간의 가슴 움직임과 자세를 짧게 촬영해두세요. 호흡이 갑자기 힘들어 보이거나 입을 벌리고 숨쉬는 등 평소와 뚜렷이 다른 모습이 나타나면 영상 촬영을 위해 기다리지 말고 즉시 수의학적 도움을 받으세요.',bodyEn:'Record a brief clip when your pet is resting comfortably. If breathing suddenly looks difficult or markedly abnormal, do not delay care to make a video; seek veterinary help promptly.'},
  {category:'health',featured:false,titleKo:'건강 기록에는 증상이 시작된 시간도 함께 적어둬요',titleEn:'Note when a symptom first started',summaryKo:'구토·설사·기침처럼 변화가 생기면 횟수뿐 아니라 처음 본 시간과 지속 시간을 같이 기록해요.',summaryEn:'When symptoms appear, record not only how often they occur but also when they began and how long they persist.',bodyKo:'날짜와 시간, 횟수, 식사·활동과의 관계, 사진이나 영상이 있으면 함께 정리하세요. 이런 기록은 진료 시 경과를 설명하는 데 도움이 됩니다. 증상이 심하거나 빠르게 악화되면 기록을 더 모으기 위해 진료를 미루지 마세요.',bodyEn:'Record date and time, frequency, relation to meals or activity, and photos or videos when useful. These details can help at a veterinary visit, but worsening or severe symptoms should not be delayed for more tracking.'},
  {category:'life',featured:true,titleKo:'청소나 가구 이동 뒤에는 반려동물의 익숙한 쉼터를 남겨줘요',titleEn:'Keep a familiar resting spot after household changes',summaryKo:'대청소나 가구 재배치 후에도 익숙한 침구나 숨숨집처럼 안정감을 주는 공간 하나는 유지해요.',summaryEn:'After cleaning or rearranging furniture, preserve at least one familiar bed, hideaway, or resting area.',bodyKo:'집안 냄새와 동선이 크게 바뀌면 낯설게 느낄 수 있어요. 자주 쓰던 침구나 장난감 일부를 그대로 두고 새로운 배치는 천천히 탐색하게 해주세요. 불안 행동이 오래 지속되면 환경 자극을 줄이고 전문가와 상담을 고려하세요.',bodyEn:'Large changes in scent and layout can feel unfamiliar. Leave some commonly used bedding or toys in place and allow gradual exploration. Persistent distress may benefit from environmental adjustment and professional advice.'},
  {category:'life',featured:false,titleKo:'외출 전후의 인사는 짧고 차분하게 유지해요',titleEn:'Keep departures and returns calm and predictable',summaryKo:'외출할 때와 돌아왔을 때 지나치게 흥분시키기보다 짧고 일정한 루틴으로 안정적인 흐름을 만들어줘요.',summaryEn:'A brief, predictable routine around departures and returns can help keep those transitions calmer.',bodyKo:'외출 직전 특별한 자극을 많이 주기보다 필요한 배변·물·휴식 환경을 준비하고 자연스럽게 이동하세요. 돌아온 뒤에도 먼저 안전하게 문을 닫고 반려동물이 진정된 후 차분히 교류하는 습관을 만들어 주세요.',bodyEn:'Before leaving, make sure toileting, water, and resting needs are met without adding excessive excitement. On return, secure the doorway first and greet calmly once your pet has settled.'},
  {category:'food',featured:true,titleKo:'습식사료는 개봉 후 보관 방법과 시간을 지켜요',titleEn:'Handle opened wet food with care',summaryKo:'개봉한 습식사료는 제품 안내에 따라 냉장 보관하고 상온에 오래 방치된 음식은 다시 주지 않아요.',summaryEn:'Follow the product instructions for refrigerating opened wet food and avoid re-serving food that has sat out too long.',bodyKo:'한 번에 먹을 만큼 덜어 급여하고 남은 제품은 깨끗하게 덮어 제조사 안내에 맞게 보관하세요. 냄새나 색, 질감이 평소와 다르거나 보관 상태가 의심되면 급여하지 않는 편이 안전합니다.',bodyEn:'Serve an appropriate portion and cover and store leftovers according to the manufacturer’s directions. If odor, color, texture, or storage conditions seem questionable, discard the food rather than feeding it.'},
  {category:'food',featured:false,titleKo:'새 간식은 처음부터 여러 종류를 한꺼번에 주지 않아요',titleEn:'Introduce new treats one at a time',summaryKo:'처음 먹는 간식은 소량으로 시작하고 여러 신제품을 동시에 추가하지 않으면 변화를 확인하기 쉬워요.',summaryEn:'Starting one new treat at a time in small amounts makes it easier to notice how your pet responds.',bodyKo:'기존 식단을 유지한 채 새 간식은 작은 양으로 시작하고 식욕·변 상태·피부 등 평소와 다른 변화가 있는지 살펴보세요. 특정 질환이나 치료식을 먹는 반려동물은 새 간식을 추가하기 전에 담당 수의사와 상의하세요.',bodyEn:'Keep the usual diet stable, introduce a small amount of one new treat, and watch for changes in appetite, stool, or skin. Pets on therapeutic diets or with medical conditions should have new treats discussed with their veterinarian.'},
  {category:'training',featured:true,titleKo:'문을 통과할 때 잠깐 기다리는 연습을 생활 속에서 해요',titleEn:'Practice a brief pause at doorways',summaryKo:'현관이나 대문 앞에서 잠깐 멈추고 보호자 신호 뒤에 이동하는 습관은 안전한 출입에 도움이 돼요.',summaryEn:'A short pause at doors followed by a release cue can make everyday entrances and exits safer.',bodyKo:'조용한 실내문에서 시작해 문이 조금 열려도 잠깐 기다리면 칭찬하고 짧은 해제 신호 뒤 함께 이동하세요. 억지로 오래 기다리게 하기보다 성공하기 쉬운 몇 초부터 반복하고 실제 현관에서는 항상 물리적 안전장치도 함께 사용하세요.',bodyEn:'Start at a quiet interior door, reward a brief pause as it opens, then move through together after a release cue. Begin with a few easy seconds and still use physical safety measures at exterior doors.'},
  {category:'training',featured:false,titleKo:'잘한 행동을 발견했을 때 바로 보상해줘요',titleEn:'Reward desired behavior when you notice it',summaryKo:'문제가 생긴 뒤에만 반응하기보다 조용히 기다리거나 제자리에 눕는 등 원하는 행동이 나왔을 때 바로 알려줘요.',summaryEn:'Instead of responding only to problems, reinforce calm waiting, settling, and other behaviors you want to see more often.',bodyKo:'보상은 간식뿐 아니라 칭찬, 놀이, 산책 재개처럼 반려동물이 좋아하는 것으로 선택할 수 있어요. 행동 직후 짧고 일관되게 보상하면 어떤 행동이 좋은 결과를 만드는지 배우기 쉬워집니다.',bodyEn:'Rewards can be food, praise, play, or access to something the pet enjoys. Delivering them promptly and consistently helps make the desired behavior clearer.'},
  {category:'safety',featured:true,titleKo:'세탁기와 건조기는 사용 전 내부를 꼭 확인해요',titleEn:'Check washers and dryers before every use',summaryKo:'고양이나 작은 반려동물이 따뜻하고 어두운 기기 안으로 들어갈 수 있어 사용 전 내부 확인을 습관화해요.',summaryEn:'Cats and small pets may explore warm, enclosed appliances, so check washers and dryers before every cycle.',bodyKo:'세탁물을 넣기 전과 문을 닫기 직전에 드럼 안을 직접 확인하고 사용하지 않을 때는 접근을 제한하세요. 세제와 섬유유연제도 반려동물이 닿지 않는 곳에 보관하세요.',bodyEn:'Visually inspect the drum before loading and again before closing the door, and restrict access when appliances are not in use. Store detergents and fabric products securely out of reach.'},
  {category:'safety',featured:false,titleKo:'산책용 가방에는 비상 연락 정보를 함께 넣어둬요',titleEn:'Keep emergency contact details in the walk bag',summaryKo:'평소 산책 가방에 보호자 연락처와 자주 가는 동물병원 정보를 간단히 적어두면 예상치 못한 상황에 대비하기 좋아요.',summaryEn:'Keeping owner and veterinary contact details in the regular walk bag can help during unexpected situations.',bodyKo:'휴대폰 배터리가 없거나 다른 사람이 반려동물을 도와야 하는 상황도 생각해 작은 카드 형태로 보호자 연락처와 병원 정보를 준비하세요. 개인정보는 필요한 범위만 적고 내용이 바뀌면 갱신하세요.',bodyEn:'A small card can be useful if a phone is unavailable or someone else needs to help your pet. Include only necessary contact information and update it when details change.'},
  {category:'grooming',featured:true,titleKo:'빗질 전에는 피부에 작은 상처나 붉은 곳이 없는지 먼저 봐요',titleEn:'Check the skin before brushing',summaryKo:'털을 빗기 전에 손으로 가볍게 만져 엉킴뿐 아니라 붉은 부위나 통증 반응이 없는지 확인해요.',summaryEn:'Before brushing, gently feel through the coat for tangles as well as redness, sore areas, or sensitivity.',bodyKo:'당기는 느낌이 강한 엉킴을 억지로 풀면 피부를 자극할 수 있어요. 작은 구역씩 부드럽게 진행하고 피부가 아파 보이거나 진물·딱지·심한 붉음이 있으면 그 부위의 미용을 멈추고 상태를 확인하세요.',bodyEn:'Do not force tight mats, which can pull painfully on the skin. Work gently in small sections and stop grooming an area that looks painful, weepy, crusted, or markedly red.'},
  {category:'grooming',featured:false,titleKo:'목욕 후 귀 바깥쪽의 물기는 부드럽게 닦아줘요',titleEn:'Gently dry the outer ear after bathing',summaryKo:'목욕 뒤 귀 주변과 바깥쪽에 남은 물기를 닦되 면봉을 귀 깊숙이 넣지는 않아요.',summaryEn:'After bathing, dry moisture around the outer ear gently and avoid inserting cotton swabs deep into the ear canal.',bodyKo:'부드러운 수건이나 거즈로 보이는 바깥 부분만 닦고 귀 안쪽을 깊게 파거나 임의의 세정액을 사용하지 마세요. 냄새, 분비물, 붉음, 잦은 머리 흔들기가 보이면 수의사에게 확인받으세요.',bodyEn:'Use a soft towel or gauze only on visible outer areas and avoid probing deeply or using unadvised cleaning solutions. Odor, discharge, redness, or frequent head shaking should be checked by a veterinarian.'}
];

for (const c of categories) {
  const n = candidates.filter(x => x.category === c).length;
  if (n !== 2) throw new Error(`Expected exactly 2 candidates for ${c}, got ${n}`);
}
const candidateTitles = candidates.map(x => x.titleKo);
const already = candidateTitles.filter(t => block.includes(t));
if (already.length === 16) {
  console.log('2026-08-23 PetInfo set already present.');
  process.exit(0);
}
if (already.length) throw new Error(`Partial 2026-08-23 set detected: ${already.join(' | ')}`);
if (candidateTitles.some(t => titles.includes(t))) throw new Error('Duplicate PetInfo title detected.');
const normalize = s => String(s).toLowerCase().replace(/[\s·—–,.'"!?/()\-]/g, '');
const existingNormalized = new Set(titles.map(normalize));
for (const t of candidateTitles) if (existingNormalized.has(normalize(t))) throw new Error(`Near-duplicate title: ${t}`);
if (new Set(candidateTitles.map(normalize)).size !== 16) throw new Error('Duplicate title inside candidate set.');

const esc = s => String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
let nextId = maxId + 1;
const rendered = candidates.map(x => `  { id: "t${nextId++}", category: "${x.category}", featured: ${x.featured},\n    title: { ko: "${esc(x.titleKo)}", en: "${esc(x.titleEn)}" },\n    summary: { ko: "${esc(x.summaryKo)}", en: "${esc(x.summaryEn)}" },\n    body: { ko: "${esc(x.bodyKo)}", en: "${esc(x.bodyEn)}" }, sourceDate: "2026-08-23" },`).join('\n');
app = app.slice(0, end) + '\n\n' + rendered + app.slice(end);
fs.writeFileSync(path, app);

const updated = fs.readFileSync(path, 'utf8');
for (const x of candidates) if (!updated.includes(x.titleKo)) throw new Error(`Write verification failed: ${x.titleKo}`);
const newBlock = updated.slice(start, updated.indexOf('\n];', start));
const newIds = [...newBlock.matchAll(/id:\s*"t(\d+)"/g)].map(m => Number(m[1]));
if (newIds.length !== ids.length + 16) throw new Error(`Expected ${ids.length + 16} total IDs, got ${newIds.length}`);
console.log('Added 16 PetInfo items for 2026-08-23.');
console.log(candidates.map(x => `${x.category}: ${x.titleKo}`).join(' | '));
