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
if (maxId < 242) throw new Error(`Expected dataset through t242, found t${maxId}.`);
console.log('Existing PetInfo inventory:', { total: ids.length, maxId, counts });

const candidates = [
  { category:'dog', featured:true, titleKo:'엘리베이터 문 앞에서는 리드줄 길이를 짧게 정리해요', titleEn:'Shorten the leash near elevator doors', summaryKo:'문이 열리고 닫히는 순간 리드줄이 멀리 늘어져 있지 않도록 가까이에서 차분히 이동해요.', summaryEn:'Keep dogs close and avoid a long trailing leash while elevator doors open and close.', bodyKo:'엘리베이터를 기다릴 때는 출입하는 사람과 다른 반려동물이 먼저 지나갈 공간을 확보하고 리드줄이 문틈이나 다른 사람의 발에 걸리지 않게 정리하세요. 문이 열렸다고 바로 뛰어들기보다 보호자와 함께 확인한 뒤 이동하는 습관을 만들어 주세요.', bodyEn:'While waiting, leave room for people and other pets to exit first and keep the leash from trailing into doors or feet. Practice entering and leaving together after checking the doorway.' },
  { category:'dog', featured:false, titleKo:'산책 뒤에는 발가락 사이의 이물질도 가볍게 확인해요', titleEn:'Check between the toes after walks', summaryKo:'풀씨나 작은 돌, 끈적한 이물질이 발가락 사이에 붙지 않았는지 산책 후 짧게 살펴봐요.', summaryEn:'A quick post-walk check can find grass seeds, small stones, or sticky debris caught between the toes.', bodyKo:'밝은 곳에서 발바닥과 발가락 사이를 살펴보고 쉽게 떨어지는 이물질만 부드럽게 제거하세요. 깊이 박힌 것처럼 보이거나 붓기·출혈·계속 핥는 행동이 있으면 억지로 파내지 말고 수의사에게 확인받는 편이 안전해요.', bodyEn:'Inspect the pads and between the toes and remove only loose debris. If something appears embedded, or there is swelling, bleeding, or persistent licking, avoid digging at it and ask a veterinarian.' },

  { category:'cat', featured:true, titleKo:'고양이 이동장은 평소에도 열린 채 익숙한 공간으로 만들어줘요', titleEn:'Let the cat carrier stay familiar between trips', summaryKo:'병원 가는 날에만 이동장이 나타나지 않도록 평소에도 안전한 곳에 열어두고 편하게 탐색하게 해요.', summaryEn:'Leaving the carrier accessible between trips can help it feel less like a cue that only predicts stressful travel.', bodyKo:'문을 고정해 갑자기 닫히지 않게 하고 익숙한 담요나 간식을 안쪽에 두어 스스로 들어갔다 나올 수 있게 해주세요. 억지로 밀어 넣기보다 짧고 편안한 경험을 반복하고 실제 이동 전에는 잠금장치와 손잡이 상태도 확인하세요.', bodyEn:'Secure the door so it cannot swing shut, and place familiar bedding or treats inside so the cat can explore voluntarily. Check latches and handles before travel.' },
  { category:'cat', featured:false, titleKo:'높은 곳으로 오가는 길은 막히지 않게 이어줘요', titleEn:'Keep vertical routes open and easy to navigate', summaryKo:'캣타워나 선반처럼 높은 공간을 이용할 때 올라가는 길과 내려오는 길을 함께 살펴봐요.', summaryEn:'When cats use towers or shelves, consider both the route up and an easy route back down.', bodyKo:'가구나 물건이 착지 지점을 막지 않는지, 표면이 지나치게 미끄럽지 않은지 확인하고 여러 마리가 함께 사는 집이라면 이동 경로를 분산해 주세요. 점프를 갑자기 꺼리거나 통증이 의심되면 수의사에게 상담하세요.', bodyEn:'Make sure landing areas are not blocked and surfaces are not excessively slippery. In multi-cat homes, offer more than one route. Seek veterinary advice if jumping suddenly becomes difficult or painful.' },

  { category:'health', featured:true, titleKo:'체중 숫자와 몸 상태 변화를 함께 기록해요', titleEn:'Track body condition along with body weight', summaryKo:'체중만 보는 것보다 체형과 근육 상태의 변화를 함께 기록하면 평소 상태를 비교하기 쉬워요.', summaryEn:'Weight is more informative when tracked alongside changes in body and muscle condition.', bodyKo:'AAHA 영양 가이드라인은 체중과 함께 체형점수(BCS), 근육상태점수(MCS) 등을 반복 평가하는 것을 권고해요. 갑작스럽거나 설명되지 않는 체중 증감이나 눈에 띄는 근육 감소가 있으면 식사량만 임의로 바꾸기보다 수의사에게 평가를 상담하세요.', bodyEn:'AAHA nutrition guidance recommends repeated assessment of weight together with body condition score and muscle condition score. Discuss unexplained weight change or noticeable muscle loss with a veterinarian rather than making large diet changes on your own.' },
  { category:'health', featured:false, titleKo:'진료 전에는 복용 중인 약과 보충제 목록도 챙겨요', titleEn:'Bring an up-to-date medication and supplement list to visits', summaryKo:'처방약뿐 아니라 영양제·보충제까지 무엇을 얼마나 먹는지 정리해두면 진료 상담에 도움이 돼요.', summaryEn:'A current list of medicines and supplements gives the veterinary team a fuller picture during an appointment.', bodyKo:'AAHA 영양평가 자료는 현재 사용하는 약과 식이 보충제도 평가 항목에 포함해요. 제품명, 용량이나 급여량, 횟수를 적고 포장 사진도 함께 준비하세요. 새 제품을 추가하거나 기존 약을 중단할지는 담당 수의사와 상의하세요.', bodyEn:'AAHA nutritional assessment guidance includes current medications and dietary supplements. Note product names, amounts, and frequency when possible. Discuss starting or stopping products with the treating veterinarian.' },

  { category:'life', featured:false, titleKo:'생활 시간표를 바꿀 때는 한 번에 크게 바꾸지 않아요', titleEn:'Adjust daily routines in smaller steps', summaryKo:'식사·산책·놀이 시간이 달라져야 한다면 가능한 범위에서 조금씩 옮겨 새로운 흐름에 적응하게 해요.', summaryEn:'When meal, walk, or play times need to change, smaller shifts can make a new routine easier to learn.', bodyKo:'출근 시간이나 계절 변화처럼 일정이 바뀌면 며칠에 걸쳐 주요 활동 시간을 조금씩 옮기고 잠자리와 물그릇처럼 익숙한 환경은 안정적으로 유지해 주세요. 식욕·배변·수면의 큰 변화가 오래 지속되면 상태를 확인하세요.', bodyEn:'When work hours or seasons change, shift key activities gradually while keeping familiar resources stable. If major changes in appetite, elimination, or sleep persist, consider veterinary advice.' },
  { category:'life', featured:true, titleKo:'여러 마리가 함께 살면 밥·물·휴식 공간을 나눠 배치해요', titleEn:'Spread key resources around multi-pet homes', summaryKo:'한 장소에 모든 자원을 몰아두기보다 각자 편하게 접근할 수 있는 먹이·물·휴식 공간을 마련해요.', summaryEn:'In multi-pet homes, distributing food, water, and resting areas can reduce competition around a single spot.', bodyKo:'서로 잘 지내는 것처럼 보여도 먹는 속도나 선호하는 휴식 장소가 다를 수 있어요. 필요하면 식사는 분리하고 물그릇과 휴식처를 여러 위치에 두며 특정 아이가 길목을 막지 않는지도 살펴보세요.', bodyEn:'Even compatible pets may eat at different speeds or prefer different resting places. Separate meals when needed and offer water and resting spots in multiple locations.' },

  { category:'food', featured:true, titleKo:'간식·토핑의 양도 하루 전체 섭취량에 포함해요', titleEn:'Count treats and toppers in the daily food total', summaryKo:'간식과 사람 음식, 토핑도 열량을 더하므로 주식과 별개로 무제한 주지 않아요.', summaryEn:'Treats, table foods, and toppers add calories and should not be treated as unlimited extras.', bodyKo:'AAHA는 간식·토핑·사람 음식처럼 완전균형식이 아닌 음식에서 오는 열량을 일반적으로 하루 총 열량의 10% 이하로 관리하도록 안내해요. 체중 변화가 있거나 치료식 중이라면 수의사와 적정 급여량을 상담하세요.', bodyEn:'AAHA advises generally keeping calories from treats, toppers, and other non-complete foods to no more than 10% of total daily calories. Discuss amounts with a veterinarian when weight is changing or a therapeutic diet is used.' },
  { category:'food', featured:false, titleKo:'사료 포장지의 권장량은 출발점으로 보고 몸 상태를 함께 봐요', titleEn:'Use package feeding guides as a starting point', summaryKo:'같은 체중이어도 활동량과 생활환경이 달라 실제 필요한 급여량에는 차이가 생길 수 있어요.', summaryEn:'Pets of the same weight can have different energy needs because activity, life stage, and environment vary.', bodyKo:'제품의 안내량을 참고하되 실제 체중 추세와 몸 상태, 간식 섭취량을 함께 기록하세요. 설명되지 않는 체중 변화가 있거나 적정량 판단이 어렵다면 급격히 줄이거나 늘리기보다 수의사에게 영양평가와 급여량 조정을 상담하세요.', bodyEn:'Use the product guide as a reference while tracking weight trends, body condition, and treats. If weight changes without a clear reason or the right amount is uncertain, ask a veterinarian about nutritional assessment and feeding adjustments.' },

  { category:'training', featured:true, titleKo:'이름을 불렀을 때 보호자를 바라보는 짧은 연습을 해요', titleEn:'Practice a brief check-in when you say the pet’s name', summaryKo:'이름을 여러 번 반복하기보다 한 번 부른 뒤 시선을 주는 순간을 짧게 보상해요.', summaryEn:'Rather than repeating a name many times, reward the moment your pet checks in after hearing it once.', bodyKo:'방해가 적은 실내에서 시작해 이름을 한 번 부르고 고개를 돌리거나 시선을 주면 바로 칭찬이나 작은 보상을 주세요. 익숙해진 뒤 장소와 방해 요소를 조금씩 바꾸되 이름을 혼내는 신호처럼 사용하지 않는 것이 좋아요.', bodyEn:'Start indoors with few distractions, say the name once, and reward a glance or head turn promptly. Gradually practice in different settings, and avoid turning the pet’s name into a scolding cue.' },
  { category:'training', featured:false, titleKo:'산책 중 방향을 바꿔 돌아가는 신호도 미리 연습해요', titleEn:'Teach a simple turn-away cue for walks', summaryKo:'붐비는 길이나 예상치 못한 자극을 만났을 때 자연스럽게 방향을 바꿀 수 있는 짧은 신호를 만들어둬요.', summaryEn:'A practiced turn-away cue can help you change direction smoothly when a walk becomes crowded or distracting.', bodyKo:'조용한 곳에서 짧은 말이나 손동작을 정하고 보호자와 함께 방향을 바꾸면 바로 보상하세요. 충분히 익숙해진 뒤 방해가 있는 환경으로 천천히 넓혀가고 강하게 끌어당겨 방향을 바꾸는 방식은 피하세요.', bodyEn:'Choose a short word or gesture in a quiet area, turn together, and reward promptly. Build up gradually before using it around distractions, and avoid sharp leash corrections.' },

  { category:'safety', featured:true, titleKo:'녹조처럼 보이거나 냄새가 이상한 물에는 반려동물을 들여보내지 않아요', titleEn:'Keep pets away from water that looks or smells suspicious', summaryKo:'호수·하천 물이 변색되거나 거품·막처럼 보인다면 마시거나 수영하지 못하게 해요.', summaryEn:'If lake or river water is discolored or has scum, mats, or an unusual smell, keep pets from drinking or swimming in it.', bodyKo:'CDC는 유해 조류 번성이 반려동물에게 심각한 중독을 일으킬 수 있어 물이 이상하게 보이거나 냄새가 날 때 접근시키지 말라고 안내해요. 의심되는 물을 마셨거나 접촉 뒤 이상 증상이 나타나면 지체하지 말고 수의사 또는 응급 동물병원에 연락하세요.', bodyEn:'CDC warns that harmful algal blooms can seriously poison pets and recommends keeping them away from water that looks or smells bad. If exposure or drinking is suspected and symptoms develop, contact a veterinarian or emergency animal hospital promptly.' },
  { category:'safety', featured:false, titleKo:'미녹시딜 탈모제는 바른 손·피부·침구까지 반려동물 접촉을 막아요', titleEn:'Prevent pet contact with minoxidil and treated surfaces', summaryKo:'미녹시딜 제품은 특히 고양이에게 매우 위험할 수 있어 용기뿐 아니라 흘린 액체와 바른 부위 접촉도 주의해요.', summaryEn:'Minoxidil can be highly dangerous to pets, especially cats, so prevent contact with the product, spills, and treated skin or fabrics.', bodyKo:'FDA는 미녹시딜 제품 라벨에 반려동물의 손이 닿지 않게 하라는 경고를 강화했고 ASPCA도 반려동물 노출 위험을 안내해요. 사용 후 손을 씻고 제품이 완전히 마르기 전에는 반려동물이 바른 피부나 침구를 핥거나 비비지 못하게 하세요. 노출이 의심되면 즉시 수의사 또는 응급 동물병원에 상담하세요.', bodyEn:'FDA labeling warns to keep minoxidil out of pets’ reach, and ASPCA also highlights exposure risks. Wash hands after use and prevent pets from licking or rubbing treated skin or bedding before the product is fully dry. If exposure is suspected, contact a veterinarian promptly.' },

  { category:'grooming', featured:true, titleKo:'발톱은 한 번에 많이 자르기보다 작은 폭으로 확인하며 다듬어요', titleEn:'Trim nails in small, controlled steps', summaryKo:'발톱 안쪽 혈관 위치를 확신하기 어렵다면 조금씩 다듬고 반려동물이 불편해하기 전에 쉬어가요.', summaryEn:'When the quick is hard to judge, trim conservatively and take breaks before the pet becomes uncomfortable.', bodyKo:'밝은 곳에서 발을 안정적으로 받치고 발톱 끝부분부터 조금씩 정리하세요. 검은 발톱처럼 내부가 잘 보이지 않거나 반려동물이 심하게 움직이면 무리하지 말고 전문 미용사나 동물병원에 도움을 요청하세요. 출혈이 멈추지 않으면 수의사에게 연락하세요.', bodyEn:'Support the paw securely in good light and remove only small amounts from the nail tip. If the quick is difficult to see or the pet struggles strongly, stop rather than forcing the session. Contact a veterinarian if bleeding does not stop.' },
  { category:'grooming', featured:false, titleKo:'목욕 뒤에는 샴푸 잔여물이 남지 않도록 충분히 헹궈요', titleEn:'Rinse shampoo thoroughly after bathing', summaryKo:'털이 많은 부위와 배·겨드랑이처럼 거품이 남기 쉬운 곳까지 물로 충분히 헹궈요.', summaryEn:'Rinse thoroughly, including dense coat and areas where suds can linger such as the belly and underarms.', bodyKo:'반려동물용 제품을 설명서에 맞게 사용하고 눈과 귀 안쪽으로 들어가지 않게 주의하면서 거품이 보이지 않을 때까지 부드럽게 헹궈주세요. 목욕 뒤 피부가 계속 붉거나 가렵고 불편해하면 반복 사용하기보다 수의사에게 상담하세요.', bodyEn:'Use a pet-specific product as directed, avoid the eyes and ear canals, and rinse gently until suds are gone. If redness, itching, or discomfort persists after bathing, ask a veterinarian about the skin.' }
];

if (candidates.length !== 16) throw new Error(`Expected 16 candidates, got ${candidates.length}`);
for (const c of categories) {
  const n = candidates.filter(x => x.category === c).length;
  if (n !== 2) throw new Error(`Expected exactly 2 candidates for ${c}, got ${n}`);
}
const candidateTitles = candidates.map(x => x.titleKo);
const already = candidateTitles.filter(t => block.includes(t));
if (already.length === 16) {
  console.log('2026-08-22 PetInfo set already present.');
  process.exit(0);
}
if (already.length) throw new Error(`Partial 2026-08-22 set detected: ${already.join(' | ')}`);
for (const t of candidateTitles) if (titles.includes(t)) throw new Error(`Duplicate title: ${t}`);

const normalize = s => String(s).toLowerCase().replace(/[\s·—–,.'"!?/()\-]/g, '');
for (let i = 0; i < candidateTitles.length; i++) {
  for (let j = i + 1; j < candidateTitles.length; j++) {
    if (normalize(candidateTitles[i]) === normalize(candidateTitles[j])) throw new Error('Duplicate candidate titles');
  }
}

const esc = s => String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
let nextId = maxId + 1;
const rendered = candidates.map(x => `  { id: "t${nextId++}", category: "${x.category}", featured: ${x.featured},\n    title: { ko: "${esc(x.titleKo)}", en: "${esc(x.titleEn)}" },\n    summary: { ko: "${esc(x.summaryKo)}", en: "${esc(x.summaryEn)}" },\n    body: { ko: "${esc(x.bodyKo)}", en: "${esc(x.bodyEn)}" }, sourceDate: "2026-08-22" },`).join('\n');

app = app.slice(0, end) + '\n\n' + rendered + app.slice(end);
fs.writeFileSync(path, app, 'utf8');
const updated = fs.readFileSync(path, 'utf8');
for (const x of candidates) if (!updated.includes(x.titleKo)) throw new Error(`Write verification failed: ${x.titleKo}`);
const newBlock = updated.slice(start, updated.indexOf('\n];', start));
const newIds = [...newBlock.matchAll(/id:\s*"t(\d+)"/g)].map(m => Number(m[1]));
if (newIds.length !== ids.length + 16) throw new Error(`Expected ${ids.length + 16} total IDs, got ${newIds.length}`);
console.log('Added 16 PetInfo items for 2026-08-22.');
console.log(candidates.map(x => `${x.category}: ${x.titleKo}`).join(' | '));
