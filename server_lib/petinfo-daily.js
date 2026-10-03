const DAILY_PET_INFO = [
  { key:"water-bowl", category:"food", title:"물그릇은 매일 씻고 깨끗한 물을 채워요", summary:"남은 물 위에 새 물만 보충하기보다 그릇을 씻은 뒤 새로 채워주세요.", body:"물그릇 안쪽의 미끈한 막과 사료 찌꺼기를 확인하고 반려동물용으로 쓰는 그릇을 깨끗이 세척해 주세요. 물을 갑자기 적게 마시거나 지나치게 많이 마시는 변화가 이어지면 수의사와 상담하세요." },
  { key:"paw-check", category:"grooming", title:"산책 뒤에는 발바닥과 발가락 사이를 확인해요", summary:"작은 돌과 풀씨, 끈적한 이물질이 붙어 있지 않은지 살펴봐요.", body:"밝은 곳에서 발바닥과 발가락 사이를 부드럽게 확인하고 쉽게 떨어지는 이물질만 제거하세요. 붓기·출혈·절뚝거림이나 계속 핥는 행동이 있으면 억지로 파내지 말고 진료를 받아보세요." },
  { key:"meal-record", category:"food", title:"사료와 간식의 하루 총량을 함께 기록해요", summary:"간식과 토핑도 하루 섭취량에 포함하면 체중 관리가 쉬워져요.", body:"가족이 따로 간식을 주면 실제 섭취량이 예상보다 많아질 수 있어요. 하루치 간식을 한 통에 덜어 함께 관리하고, 체중이 빠르게 변하면 급여량을 임의로 크게 바꾸기보다 수의사와 상담하세요." },
  { key:"quiet-rest", category:"life", title:"자극이 많았던 날에는 조용한 휴식 시간을 줘요", summary:"병원·미용·긴 산책 뒤에는 익숙하고 조용한 공간에서 쉬게 해주세요.", body:"물과 잠자리를 편하게 이용할 수 있게 하고 피곤해 보일 때는 추가 놀이와 훈련을 줄여주세요. 회복되지 않는 무기력, 통증 반응, 식욕 저하가 있으면 상태를 확인받는 것이 좋아요." },
  { key:"leash-hardware", category:"safety", title:"외출 전 리드줄 고리와 하네스 버클을 확인해요", summary:"연결 부위가 끝까지 잠겼는지와 마모·갈라짐이 없는지 살펴봐요.", body:"성장기이거나 체중이 변한 반려견은 하네스가 너무 조이거나 헐겁지 않은지도 다시 맞춰주세요. 문을 열기 전에 리드줄을 먼저 연결하는 습관이 갑작스러운 이탈을 예방하는 데 도움이 됩니다." },
  { key:"litter-routine", category:"cat", title:"고양이 화장실은 일정한 청소 습관을 유지해요", summary:"오염된 부분은 매일 치우고 갑작스러운 모래·위치 변경은 피해주세요.", body:"화장실 수와 위치, 모래 상태를 함께 점검하세요. 소변을 보지 못하거나 힘주기, 잦은 출입, 혈뇨가 보이면 단순한 취향 문제로 넘기지 말고 신속히 동물병원에 연락하세요." },
  { key:"short-training", category:"training", title:"새 행동은 짧고 성공하기 쉬운 단계부터 연습해요", summary:"방해가 적은 곳에서 몇 번 성공한 뒤 조금씩 난도를 높여주세요.", body:"원하는 행동이 나온 직후 칭찬이나 작은 보상을 주고, 집중이 떨어지면 길게 반복하지 말고 쉬어가세요. 이름이나 이동장을 혼내는 신호와 연결하지 않는 것이 좋아요." },
  { key:"weight-trend", category:"health", title:"체중은 한 번의 숫자보다 변화 추세를 살펴봐요", summary:"같은 조건에서 주기적으로 재고 식욕·활력 변화도 함께 기록해요.", body:"몇 주 동안의 체중과 체형 변화를 함께 보면 평소 상태를 비교하기 쉬워요. 이유 없이 빠르게 줄거나 늘고 식욕·활력 변화가 동반되면 수의사에게 영양 및 건강 평가를 상담하세요." },
  { key:"door-safety", category:"safety", title:"현관문을 열기 전 반려동물 위치를 먼저 확인해요", summary:"택배나 방문객이 올 때 갑작스럽게 밖으로 나가지 않도록 준비해요.", body:"필요하면 안전문이나 다른 방을 활용하고 가족과 방문객에게 문을 오래 열어두지 않도록 알려주세요. 인식표와 등록정보도 현재 연락처로 유지하는 것이 좋습니다." },
  { key:"dental-look", category:"health", title:"입 냄새와 잇몸 상태를 정기적으로 살펴봐요", summary:"심한 구취·잇몸 출혈·한쪽으로만 씹는 변화는 확인이 필요해요.", body:"반려동물용 칫솔과 치약을 사용하고 억지로 입을 벌려 오래 닦지 마세요. 통증, 출혈, 침 흘림, 식사 곤란이 보이면 양치만으로 해결하려 하지 말고 구강 검진을 받아보세요." },
  { key:"wet-coat", category:"grooming", title:"목욕이나 비 맞은 뒤에는 피부까지 충분히 말려요", summary:"겨드랑이·발가락 사이·피부 주름처럼 습기가 남기 쉬운 곳을 확인해요.", body:"수건으로 물기를 눌러 닦고 드라이어를 쓸 때는 너무 뜨겁거나 가까운 바람을 피하세요. 붉음, 냄새, 가려움이 반복되면 제품 사용을 멈추고 피부 상태를 상담하세요." },
  { key:"carrier", category:"cat", title:"이동장은 평소에도 익숙한 공간으로 만들어줘요", summary:"병원 가는 날에만 꺼내지 말고 안전한 곳에 열어두세요.", body:"문이 갑자기 닫히지 않게 고정하고 익숙한 담요나 간식을 안쪽에 두어 스스로 탐색하게 해주세요. 실제 이동 전에는 잠금장치와 손잡이가 튼튼한지도 확인하세요." },
  { key:"walk-temperature", category:"dog", title:"산책 전 바닥 온도와 날씨를 먼저 확인해요", summary:"더운 날에는 한낮을 피하고 그늘이 있는 짧은 경로를 선택해요.", body:"손등으로 바닥 열기를 확인하고 물과 휴식 시간을 준비하세요. 심한 헐떡임, 비틀거림, 잇몸색 변화가 보이면 즉시 시원한 곳으로 이동하고 응급 동물병원에 연락하세요." },
  { key:"medication-list", category:"health", title:"진료 전 복용 중인 약과 영양제 목록을 챙겨요", summary:"제품명·급여량·횟수와 포장 사진을 정리하면 상담에 도움이 돼요.", body:"처방약뿐 아니라 간식형 영양제와 피부에 바르는 제품도 함께 적어주세요. 새 제품을 추가하거나 기존 약을 중단할지는 담당 수의사와 상의하는 것이 안전합니다." },
  { key:"multi-pet-resources", category:"life", title:"여러 마리가 함께 살면 밥·물·휴식처를 나눠 배치해요", summary:"한곳에 자원을 몰아두지 않으면 접근 경쟁을 줄이는 데 도움이 돼요.", body:"각 아이의 먹는 속도와 선호 장소를 살피고 필요하면 식사를 분리하세요. 특정 아이가 통로나 화장실 입구를 막지 않는지도 확인하고 편하게 피할 수 있는 경로를 마련해 주세요." },
  { key:"new-food", category:"food", title:"새 사료는 기존 사료와 섞어 천천히 바꿔요", summary:"특별한 의료 지시가 없다면 며칠에 걸쳐 비율을 조절해요.", body:"구토·설사·가려움·식욕 저하가 반복되면 변경을 중단하고 상태를 기록하세요. 알레르기나 치료식을 먹는 반려동물은 사료를 바꾸기 전에 수의사와 상담하세요." },
  { key:"name-checkin", category:"training", title:"이름을 한 번 부른 뒤 바라보는 순간을 보상해요", summary:"이름을 여러 번 반복하기보다 짧고 편안하게 연습해요.", body:"조용한 실내에서 이름을 한 번 부르고 고개를 돌리거나 시선을 주면 바로 칭찬하세요. 익숙해지면 장소와 방해 요소를 조금씩 바꾸되 이름을 혼내는 말처럼 사용하지 않는 것이 좋아요." },
  { key:"senior-route", category:"life", title:"노령 반려동물의 이동 경로에는 장애물을 줄여요", summary:"잠자리·물그릇·화장실 사이를 편하게 오갈 수 있게 정리해요.", body:"미끄러운 바닥에는 매트를 두고 높은 곳에는 안정적인 중간 발판을 마련하세요. 갑자기 점프나 계단을 꺼리고 통증이 의심되면 생활환경만 바꾸지 말고 진료를 받아보세요." },
  { key:"eye-discharge", category:"health", title:"눈곱의 양과 색이 갑자기 달라졌는지 살펴봐요", summary:"평소보다 많거나 노란색·녹색 분비물이 보이면 주의해요.", body:"심한 충혈, 눈을 잘 못 뜨는 모습, 계속 비비는 행동이 함께 나타나면 임의로 사람용 안약을 사용하지 말고 동물병원에서 눈 상태를 확인하세요." },
  { key:"cable-safety", category:"safety", title:"충전선과 멀티탭은 반려동물이 닿지 않게 정리해요", summary:"씹은 흔적이 있거나 피복이 손상된 전선은 바로 교체해요.", body:"가구 뒤와 바닥의 전선을 정리하고 사용하지 않는 충전기는 뽑아두세요. 감전이 의심되면 겉으로 멀쩡해 보여도 입안 화상이나 호흡 문제를 확인하기 위해 즉시 진료받는 것이 안전합니다." },
  { key:"nail-trim", category:"grooming", title:"발톱은 한 번에 많이 자르지 말고 조금씩 다듬어요", summary:"혈관 위치가 잘 보이지 않으면 무리하지 않고 쉬어가세요.", body:"밝은 곳에서 발을 안정적으로 받치고 끝부분부터 조금씩 정리하세요. 출혈이 멈추지 않거나 발톱 관리에 강한 통증·스트레스를 보이면 미용사나 동물병원에 도움을 요청하세요." }
];

export function kstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit" }).format(date);
}

export function dailyPetInfo(date = new Date()) {
  const dateKey = kstDateKey(date);
  const dayNumber = Math.floor(Date.parse(`${dateKey}T00:00:00+09:00`) / 86400000);
  const item = DAILY_PET_INFO[((dayNumber % DAILY_PET_INFO.length) + DAILY_PET_INFO.length) % DAILY_PET_INFO.length];
  return { ...item, id:`daily-${dateKey}-${item.key}`, dateKey };
}

export async function publishDailyPetInfo(sql, date = new Date()) {
  const item = dailyPetInfo(date);
  const result = await sql`
    insert into pg_pet_info(
      id,category,title_ko,title_en,summary_ko,summary_en,body_ko,body_en,
      featured,active,sort_order,publish_at,created_by,updated_by
    ) values(
      ${item.id},${item.category},${item.title},'',${item.summary},'',${item.body},'',
      true,true,-100,now(),'petinfo-daily','petinfo-daily'
    )
    on conflict(id) do nothing
    returning id
  `;
  return { ...item, created:Boolean(result.rows?.[0]) };
}
