import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";

/* ============================================================
   data/growthCurves.js 역할
   ============================================================ */
const ALL_CURVES = {
  "dog-small": { points: { 1: 0.10, 2: 0.25, 3: 0.40, 4: 0.51, 5: 0.62, 6: 0.69, 7: 0.75, 8: 0.81, 9: 0.87, 10: 0.91, 11: 0.95, 12: 0.98, 15: 1.0, 18: 1.0, 24: 1.0 } },
  "dog-medium": { points: { 1: 0.08, 2: 0.18, 3: 0.30, 4: 0.40, 5: 0.50, 6: 0.58, 7: 0.65, 8: 0.71, 9: 0.77, 10: 0.82, 11: 0.86, 12: 0.90, 15: 0.97, 18: 1.0, 24: 1.0 } },
  "dog-large": { points: { 1: 0.05, 2: 0.12, 3: 0.20, 4: 0.28, 5: 0.35, 6: 0.42, 7: 0.49, 8: 0.55, 9: 0.61, 10: 0.66, 11: 0.71, 12: 0.75, 15: 0.86, 18: 0.94, 24: 1.0 } },
  "cat-standard": { points: { 1: 0.15, 2: 0.30, 3: 0.45, 4: 0.58, 5: 0.68, 6: 0.76, 7: 0.82, 8: 0.87, 9: 0.91, 10: 0.94, 11: 0.97, 12: 0.99, 15: 1.0, 18: 1.0, 24: 1.0 } },
  "cat-giant": { points: { 1: 0.08, 2: 0.16, 3: 0.24, 4: 0.32, 5: 0.40, 6: 0.47, 7: 0.53, 8: 0.59, 9: 0.64, 10: 0.69, 11: 0.73, 12: 0.77, 15: 0.85, 18: 0.90, 24: 1.0 } },
};

/* ============================================================
   견종 / 묘종 데이터베이스 (name = 한국어, nameEn = 영어)
   ============================================================ */
const DOG_BREED_GROUPS = [
  {
    size: "small", label: "소형견", labelEn: "Small breeds",
    breeds: [
      { id: "chihuahua", name: "치와와", nameEn: "Chihuahua", avgAdultKg: 2.3 },
      { id: "pomeranian", name: "포메라니안", nameEn: "Pomeranian", avgAdultKg: 2.0 },
      { id: "yorkshire", name: "요크셔테리어", nameEn: "Yorkshire Terrier", avgAdultKg: 2.8 },
      { id: "maltese", name: "몰티즈", nameEn: "Maltese", avgAdultKg: 3.2 },
      { id: "shihtzu", name: "시츄", nameEn: "Shih Tzu", avgAdultKg: 4.5 },
      { id: "pekingese", name: "페키니즈", nameEn: "Pekingese", avgAdultKg: 5.0 },
      { id: "papillon", name: "파피용", nameEn: "Papillon", avgAdultKg: 4.0 },
      { id: "min-pin", name: "미니어처핀셔", nameEn: "Miniature Pinscher", avgAdultKg: 4.5 },
      { id: "bichon", name: "비숑프리제", nameEn: "Bichon Frise", avgAdultKg: 3.5 },
      { id: "maltipoo", name: "말티푸", nameEn: "Maltipoo", avgAdultKg: 3.0 },
      { id: "toy-poodle", name: "푸들(토이)", nameEn: "Poodle (Toy)", avgAdultKg: 2.5 },
      { id: "mini-poodle", name: "푸들(미니어처)", nameEn: "Poodle (Miniature)", avgAdultKg: 6.0 },
      { id: "jack-russell", name: "잭러셀테리어", nameEn: "Jack Russell Terrier", avgAdultKg: 7.0 },
      { id: "silky-terrier", name: "실키테리어", nameEn: "Silky Terrier", avgAdultKg: 4.5 },
      { id: "cavalier", name: "카발리에 킹 찰스 스패니얼", nameEn: "Cavalier King Charles Spaniel", avgAdultKg: 7.5 },
      { id: "mini-schnauzer", name: "미니어처 슈나우저", nameEn: "Miniature Schnauzer", avgAdultKg: 6.5 },
      { id: "lhasa-apso", name: "라사압소", nameEn: "Lhasa Apso", avgAdultKg: 6.5 },
      { id: "italian-greyhound", name: "이탈리안 그레이하운드", nameEn: "Italian Greyhound", avgAdultKg: 4.5 },
      { id: "brussels-griffon", name: "브뤼셀그리펀", nameEn: "Brussels Griffon", avgAdultKg: 4.5 },
      { id: "japanese-chin", name: "재패니즈친", nameEn: "Japanese Chin", avgAdultKg: 3.5 },
      { id: "boston-terrier", name: "보스턴테리어", nameEn: "Boston Terrier", avgAdultKg: 8.0 },
      { id: "dachshund-mini", name: "미니어처 닥스훈트", nameEn: "Miniature Dachshund", avgAdultKg: 5.0 },
      { id: "pug", name: "퍼그", nameEn: "Pug", avgAdultKg: 7.5 },
    ],
  },
  {
    size: "medium", label: "중형견", labelEn: "Medium breeds",
    breeds: [
      { id: "corgi", name: "웰시코기", nameEn: "Welsh Corgi", avgAdultKg: 12 },
      { id: "beagle", name: "비글", nameEn: "Beagle", avgAdultKg: 11 },
      { id: "cocker-spaniel", name: "코카스패니얼", nameEn: "Cocker Spaniel", avgAdultKg: 13 },
      { id: "shiba", name: "시바견", nameEn: "Shiba Inu", avgAdultKg: 10 },
      { id: "jindo", name: "진돗개", nameEn: "Jindo", avgAdultKg: 19 },
      { id: "border-collie", name: "보더콜리", nameEn: "Border Collie", avgAdultKg: 18 },
      { id: "french-bulldog", name: "프렌치불독", nameEn: "French Bulldog", avgAdultKg: 11 },
      { id: "bulldog", name: "불독", nameEn: "Bulldog", avgAdultKg: 20 },
      { id: "basset-hound", name: "바셋하운드", nameEn: "Basset Hound", avgAdultKg: 25 },
      { id: "sheltie", name: "셰틀랜드쉽독", nameEn: "Shetland Sheepdog", avgAdultKg: 9 },
      { id: "westie", name: "웨스트하이랜드화이트테리어", nameEn: "West Highland White Terrier", avgAdultKg: 9 },
      { id: "bull-terrier", name: "불테리어", nameEn: "Bull Terrier", avgAdultKg: 24 },
      { id: "am-staffordshire", name: "아메리칸 스태퍼드셔 테리어", nameEn: "American Staffordshire Terrier", avgAdultKg: 25 },
      { id: "dalmatian", name: "달마시안", nameEn: "Dalmatian", avgAdultKg: 24 },
      { id: "chow-chow", name: "차우차우", nameEn: "Chow Chow", avgAdultKg: 25 },
      { id: "australian-shepherd", name: "오스트레일리안 셰퍼드", nameEn: "Australian Shepherd", avgAdultKg: 23 },
      { id: "brittany", name: "브리타니 스패니얼", nameEn: "Brittany Spaniel", avgAdultKg: 17 },
    ],
  },
  {
    size: "large", label: "대형견", labelEn: "Large breeds",
    breeds: [
      { id: "golden-retriever", name: "골든리트리버", nameEn: "Golden Retriever", avgAdultKg: 30 },
      { id: "labrador", name: "래브라도리트리버", nameEn: "Labrador Retriever", avgAdultKg: 30 },
      { id: "german-shepherd", name: "저먼셰퍼드", nameEn: "German Shepherd", avgAdultKg: 32 },
      { id: "doberman", name: "도베르만핀셔", nameEn: "Doberman Pinscher", avgAdultKg: 35 },
      { id: "rottweiler", name: "로트와일러", nameEn: "Rottweiler", avgAdultKg: 45 },
      { id: "great-dane", name: "그레이트데인", nameEn: "Great Dane", avgAdultKg: 60 },
      { id: "st-bernard", name: "세인트버나드", nameEn: "Saint Bernard", avgAdultKg: 65 },
      { id: "bernese", name: "버니즈마운틴독", nameEn: "Bernese Mountain Dog", avgAdultKg: 40 },
      { id: "malamute", name: "알래스칸 말라뮤트", nameEn: "Alaskan Malamute", avgAdultKg: 38 },
      { id: "husky", name: "시베리안허스키", nameEn: "Siberian Husky", avgAdultKg: 23 },
      { id: "boxer", name: "복서", nameEn: "Boxer", avgAdultKg: 28 },
      { id: "mastiff", name: "마스티프", nameEn: "Mastiff", avgAdultKg: 70 },
      { id: "newfoundland", name: "뉴펀들랜드", nameEn: "Newfoundland", avgAdultKg: 60 },
      { id: "greyhound", name: "그레이하운드", nameEn: "Greyhound", avgAdultKg: 30 },
      { id: "standard-poodle", name: "푸들(스탠다드)", nameEn: "Poodle (Standard)", avgAdultKg: 27 },
      { id: "samoyed", name: "사모예드", nameEn: "Samoyed", avgAdultKg: 25 },
      { id: "pointer", name: "포인터", nameEn: "Pointer", avgAdultKg: 28 },
    ],
  },
];

const CAT_BREED_GROUPS = [
  {
    size: "standard", label: "일반 체구", labelEn: "Standard size",
    breeds: [
      { id: "korean-shorthair", name: "코리안숏헤어", nameEn: "Korean Shorthair", avgAdultKg: 4.0 },
      { id: "russian-blue", name: "러시안블루", nameEn: "Russian Blue", avgAdultKg: 4.3 },
      { id: "british-shorthair", name: "브리티시숏헤어", nameEn: "British Shorthair", avgAdultKg: 5.0 },
      { id: "scottish-fold", name: "스코티시폴드", nameEn: "Scottish Fold", avgAdultKg: 4.0 },
      { id: "scottish-straight", name: "스코티시스트레이트", nameEn: "Scottish Straight", avgAdultKg: 4.0 },
      { id: "persian", name: "페르시안", nameEn: "Persian", avgAdultKg: 4.3 },
      { id: "american-shorthair", name: "아메리칸숏헤어", nameEn: "American Shorthair", avgAdultKg: 4.5 },
      { id: "munchkin", name: "먼치킨", nameEn: "Munchkin", avgAdultKg: 3.0 },
      { id: "sphynx", name: "스핑크스", nameEn: "Sphynx", avgAdultKg: 4.0 },
      { id: "abyssinian", name: "아비시니안", nameEn: "Abyssinian", avgAdultKg: 3.8 },
      { id: "bengal", name: "벵갈", nameEn: "Bengal", avgAdultKg: 5.0 },
      { id: "siamese", name: "샴", nameEn: "Siamese", avgAdultKg: 4.0 },
      { id: "turkish-angora", name: "터키시앙고라", nameEn: "Turkish Angora", avgAdultKg: 3.8 },
      { id: "exotic-shorthair", name: "엑조틱숏헤어", nameEn: "Exotic Shorthair", avgAdultKg: 4.3 },
      { id: "himalayan", name: "히말라얀", nameEn: "Himalayan", avgAdultKg: 4.5 },
      { id: "burmese", name: "버미즈", nameEn: "Burmese", avgAdultKg: 4.0 },
      { id: "oriental-shorthair", name: "오리엔탈숏헤어", nameEn: "Oriental Shorthair", avgAdultKg: 3.6 },
      { id: "devon-rex", name: "데본렉스", nameEn: "Devon Rex", avgAdultKg: 3.5 },
      { id: "cornish-rex", name: "코니시렉스", nameEn: "Cornish Rex", avgAdultKg: 3.3 },
    ],
  },
  {
    size: "giant", label: "대형 품종 (성장이 느려요)", labelEn: "Large breeds (slow growth)",
    breeds: [
      { id: "ragdoll", name: "랙돌", nameEn: "Ragdoll", avgAdultKg: 7.0 },
      { id: "maine-coon", name: "메인쿤", nameEn: "Maine Coon", avgAdultKg: 8.0 },
      { id: "norwegian-forest", name: "노르웨이숲", nameEn: "Norwegian Forest Cat", avgAdultKg: 6.5 },
      { id: "siberian-cat", name: "시베리안", nameEn: "Siberian", avgAdultKg: 6.0 },
      { id: "turkish-van", name: "터키시반", nameEn: "Turkish Van", avgAdultKg: 6.0 },
    ],
  },
];

const DOG_SIZE_OPTIONS = [
  { id: "small", name: "소형 (~9kg 내외)", nameEn: "Small (~9kg)", avgAdultKg: 4.0 },
  { id: "medium", name: "중형 (9~25kg 내외)", nameEn: "Medium (9-25kg)", avgAdultKg: 15 },
  { id: "large", name: "대형 (25kg 이상)", nameEn: "Large (25kg+)", avgAdultKg: 35 },
];
const CAT_SIZE_OPTIONS = [
  { id: "standard", name: "일반 체구 (대부분의 품종)", nameEn: "Standard size (most breeds)", avgAdultKg: 4.3 },
  { id: "giant", name: "대형 품종 (메인쿤·랙돌 등, 성장이 느려요)", nameEn: "Large breed (Maine Coon, Ragdoll, etc. — grows slowly)", avgAdultKg: 7.0 },
];

const BODY_CONDITIONS = [
  { id: "thin", name: "마른 편", nameEn: "Thin" },
  { id: "normal", name: "보통", nameEn: "Average" },
  { id: "chubby", name: "통통한 편", nameEn: "Chubby" },
];

/* ============================================================
   i18n — 언어 컨텍스트 + 문자열 사전
   ============================================================ */
const LangContext = createContext("ko");
function useLang() {
  return useContext(LangContext);
}

const STRINGS = {
  ko: {
    privacyFooter: "입력하신 정보와 사진은 이 브라우저(계정)에만 저장되고, 다른 사용자와 공유되거나 외부로 전송되지 않아요.",
    cancel: "취소",
    helpAria: "이용 가이드 보기",
    confirmDeleteTitle: "정말 삭제할까요?",
    confirmDeleteMsg: (name) => `${name}의 모든 기록·사진이 사라지고 되돌릴 수 없어요.`,
    confirmDeleteBtn: "삭제",
    guideTitle: "이용 가이드",
    guideConfirm: "확인했어요",
    privacyTitle: "개인정보처리방침",
    privacyDraftNotice: "이 문서는 법률 자문이 아닌 초안이에요. 실제 서비스를 오픈하기 전에 [담당자], [연락처] 등 대괄호 부분을 채우고, 변호사 등 전문가의 검토를 받으시길 권장해요.",
    privacyFooterLink: "개인정보처리방침",
    guideSections: [
      { title: "1. 아이 등록하기", body: "이름·품종·생년월일·현재 체중을 입력하면 예상 성체 체중과 성장 그래프가 바로 나와요." },
      { title: "2. 성장 기록", body: "체중을 잰 날짜와 함께 남기면, 예상보다 빠르게 크는지 느리게 크는지 자동으로 비교해줘요." },
      { title: "3. 성장앨범", body: "사진과 촬영일을 언제든 추가할 수 있어요. 날짜순으로 정리돼서 성장 과정을 한눈에 볼 수 있어요." },
      { title: "4. 또래 비교 · 참고 정보", body: "비슷한 또래와 비교하거나 사료량·예방접종 시기 같은 참고 정보를 확인해보세요. 확정 수치가 아니니 병원 상담은 꼭 함께 해주세요." },
      { title: "5. 여러 마리 관리", body: "상단 탭에서 강아지·고양이를 나누고, 이름 칩을 눌러 최대 10마리까지 각자 따로 관리할 수 있어요." },
    ],
    speciesLabel: { dog: "강아지", cat: "고양이" },
    adultWord: { dog: "성견", cat: "성묘" },
    otherLabel: { dog: "견종", cat: "묘종" },
    mixLabel: { dog: "믹스견 (부모견 기반)", cat: "믹스묘 (품종 미상)" },
    customLabel: (otherLabel) => `목록에 없는 ${otherLabel} (직접 입력)`,
    searchPlaceholder: (otherLabel, example) => `${otherLabel} 검색 (예: ${example})`,
    searchExample: { dog: "말티즈", cat: "코리안숏헤어" },
    otherGroupLabel: "기타",
    noResultsText: (customLabel) => `검색 결과가 없어요. "${customLabel}"를 선택해보세요.`,
    introEdit: (nameOrLabel) => `${nameOrLabel}의 정보를 수정해요.`,
    introNew: (speciesLabel, adultWord) => `우리 ${speciesLabel}, 다 크면 얼마나 될까? 기본 정보만 입력하면 예상 ${adultWord} 체중과 성장 곡선을 바로 확인할 수 있어요.`,
    formAlertMissing: "입력이 누락된 항목이 있어요. 아래 표시된 항목을 채워주세요.",
    errName: "이름을 입력해주세요",
    errBirthDate: "생년월일을 선택해주세요",
    errWeight: "현재 체중을 입력해주세요",
    errCustomBreed: (otherLabel) => `${otherLabel} 이름을 입력해주세요`,
    labelPetName: (speciesLabel) => `${speciesLabel} 이름`,
    placeholderPetName: { dog: "예: 뭉치", cat: "예: 나비" },
    defaultPetName: { dog: "뭉치", cat: "나비" },
    labelBreedField: (otherLabel) => otherLabel,
    customBreedPlaceholder: (otherLabel) => `${otherLabel} 이름을 입력해 주세요`,
    sizeCategoryPrompt: "가장 가까운 성체 크기를 골라주세요",
    labelBirthDate: "생년월일",
    labelWeight: "현재 체중 (kg)",
    placeholderWeight: { dog: "예: 1.1", cat: "예: 0.6" },
    labelGender: "성별",
    genderFemale: "여아",
    genderMale: "남아",
    labelNeutered: "중성화 여부",
    neuteredNo: "안 함",
    neuteredYes: "완료",
    labelBodyCondition: "현재 체형",
    submitNew: (adultWord) => `예상 ${adultWord} 체중 확인하기`,
    submitEdit: "수정 완료",
    ageUnder1Month: "1개월 미만",
    ageAbout: (n) => `약 ${n}개월`,
    heroAgeLabel: (breedName, ageText) => `${breedName} · 현재 ${ageText}령`,
    heroLabel: (adultWord) => `예상 ${adultWord} 체중`,
    heroLikelyPrefix: "가장 가능성이 높은 범위 약",
    heroDisclaimer: "성장 속도는 개체차가 커요. 확정 수치가 아닌 참고용 예측치예요.",
    chartTitle: "월령별 성장 그래프",
    chartLegend: "● 검은 점 = 현재 위치",
    tooltipWeight: "예상 체중",
    monthLabel: (n) => `${n}개월`,
    monthLabelAge: (n) => `${n}개월령`,
    tableTitle: "월령별 예상 성장표",
    recordTitle: "성장 기록",
    recordDateLabel: "측정일",
    recordWeightLabel: "체중 (kg)",
    recordAddBtn: "기록 추가",
    recordErrDate: "측정일을 선택해주세요",
    recordErrWeight: "체중을 입력해주세요",
    recordFirst: "첫 기록이에요",
    recordUpdated: (prev, next) => `성체 예상치 ${prev}kg → ${next}kg으로 업데이트`,
    diffUp: (g) => `예상보다 +${g}g 빠르게 성장 중`,
    diffDown: (g) => `예상보다 ${g}g 느리게 성장 중`,
    diffFlat: "예상과 비슷하게 성장 중",
    peerTitle: (speciesLabel) => `우리 ${speciesLabel}는 작은 편일까?`,
    peerSubtitle: (speciesLabel) => `같은 품종·월령 ${speciesLabel}들과 비교한 참고 수치예요.`,
    peerBelow: (pct) => `또래 대비 체중 하위 ${pct}%`,
    peerAbove: (pct) => `또래 대비 체중 상위 ${pct}%`,
    peerDesc: {
      muchBelow: "또래보다 많이 작은 편",
      below: "평균보다 약간 작은 편",
      similar: "또래와 비슷한 편",
      above: "평균보다 약간 큰 편",
      muchAbove: "또래보다 많이 큰 편",
    },
    peerFootnote: "같은 품종의 기록이 쌓일수록 더 정확해지는 참고용 비교예요.",
    albumTitle: "성장앨범",
    albumSubtitle: "생각날 때마다 사진을 남겨보세요. 촬영일을 입력하면 자동으로 개월수와 함께 시간순으로 정리돼요.",
    photoDateLabel: "촬영일",
    photoLabel: "사진",
    photoPickBtn: "사진 선택",
    photoAddBtn: "앨범에 추가",
    photoErrDate: "촬영일을 선택해주세요",
    photoErrPhoto: "사진을 선택해주세요",
    albumEmpty: "아직 등록된 사진이 없어요. 첫 사진을 남겨보세요!",
    albumLoginRequiredTitle: "로그인하면 성장앨범을 쓸 수 있어요",
    albumLoginRequiredBody: "사진 저장은 로그인(회원) 전용 기능이에요. 로그인하면 성장앨범은 물론 반려동물도 최대 10마리까지 등록할 수 있어요. 지금까지 입력한 체중·성장 정보는 그대로 남아있어요.",
    slideshowBtn: "슬라이드쇼로 보기",
    photoEditAria: "사진 수정",
    photoDeleteAria: "사진 삭제",
    infoTitle: "참고 정보",
    feedingTitle: "사료 급여량 참고",
    feedingBody: (low, high, bodyLabel) => `하루 약 ${low}~${high}kcal 정도가 참고 범위예요. 활동량, 체형(${bodyLabel}), 사료 종류에 따라 달라지니 실제 급여량은 사료 포장지의 권장량과 수의사 상담을 기준으로 조절해주세요.`,
    humanAgeTitle: "사람 나이로 환산하면?",
    humanAgeWithAge: (age) => `지금은 사람 나이로 약 ${age}살 정도예요.`,
    humanAgeNoAge: "아직 1살이 안 돼서 사람 나이보다는 '한창 크는 시기'로 보는 게 더 맞아요. 보통 1살 무렵엔 사람 나이로 약 15살 정도가 돼요.",
    humanAgeNote: "품종·크기에 따라 차이가 있는 참고용 환산이에요.",
    ddayTitle: "다음 생일까지",
    ddayBody: (days) => `다음 생일까지 D-${days} 남았어요 🎂`,
    vaccineTitle: "예방접종·건강관리",
    vaccineNote: "정확한 접종 스케줄과 건강 관리는 반드시 동물병원과 상담해주세요.",
    vaccineText: {
      dog: [
        "생후 6~8주부터 1차 접종을 시작해요. 접종 전이라면 외부 산책·다른 강아지와의 접촉은 피해주세요.",
        "종합백신·광견병 등 기초 접종을 이어가는 시기예요. 정확한 스케줄은 병원마다 다르니 상담 후 진행하세요.",
        "중성화 상담, 심장사상충·구충 예방을 시작하기 좋은 시기예요.",
        "영구치가 나는 시기라 치아 관리가 중요해요. 정기 검진도 챙겨주세요.",
        "성견에 가까워지는 시기예요. 연 1회 정기 건강검진을 추천해요.",
      ],
      cat: [
        "생후 6~8주부터 켓트리플(FVRCP) 1차 접종을 시작해요. 접종 전이라면 외출·다른 고양이와의 접촉은 피해주세요.",
        "켓트리플 2~3차 접종과 백혈병(FeLV) 접종을 이어가는 시기예요. 정확한 스케줄은 병원마다 다르니 상담 후 진행하세요.",
        "중성화 상담을 시작하기 좋은 시기예요. 심장사상충·구충 예방도 함께 챙겨주세요.",
        "영구치가 나는 시기라 치아 관리가 중요해요. 정기 검진도 챙겨주세요.",
        "성묘에 가까워지는 시기예요. 연 1회 정기 건강검진을 추천해요.",
      ],
    },
    sizeTitle: { dog: "옷 사이즈 참고", cat: "하네스/이동장 사이즈 참고" },
    sizeBody: (size, neck, chest) => `현재 체중 기준 참고 사이즈는 ${size} (목둘레 ${neck} / 가슴둘레 ${chest}) 대예요.`,
    sizeNote: "브랜드마다 사이즈 기준이 달라 실제 구매 전에는 실측을 확인해주세요.",
    tabDog: (n) => `멍그로우${n > 0 ? ` (${n})` : ""}`,
    tabCat: (n) => `냥그로우${n > 0 ? ` (${n})` : ""}`,
    addPetLabel: { dog: "강아지 추가", cat: "고양이 추가" },
    maxPetsReached: "최대 10마리까지 등록할 수 있어요",
    loginToAddMore: "로그인하고 더 추가하기",
    reportTitle: (name) => `${name}의 성장 리포트`,
    editBtn: "정보 수정",
    deleteBtn: "삭제",
    footerNote1: "AI 챗봇, 지도, 실제 푸시 알림처럼",
    footerNoteStrong: "API 키·백엔드가 필요한 기능",
    footerNote2: "은 원하실 때 말씀해주시면 순서대로 붙여드릴게요.",
    accountLoginBtn: "로그인",
    accountLogoutBtn: "로그아웃",
    accountDemoTag: "데모",
    loginGateTitle: "로그인이 필요해요",
    loginGateBody: "휴대폰 번호(또는 이메일)로 로그인하면 이 계정에 반려동물 정보를 안전하게 저장하고 관리할 수 있어요.",
    loginTitle: "로그인 / 회원가입",
    loginDemoNotice: "지금은 화면만 먼저 보여드리는 데모예요. 실제 Supabase 연동은 키를 발급받으면 이어서 연결해드릴게요.",
    loginEmailLabel: "이메일",
    loginPasswordLabel: "비밀번호",
    loginContinueEmail: "이메일로 계속하기",
    loginOrDivider: "또는",
    loginContinueGoogle: "Google로 계속하기",
    loginContinueKakao: "카카오로 계속하기",
    loginErrEmail: "이메일을 입력해주세요",
    loginErrPassword: "비밀번호를 입력해주세요",
    loginPhonePlaceholder: "휴대폰 번호 (예: 01012345678)",
    loginPhoneSectionLabel: "휴대폰 번호로 로그인",
    loginSendOtp: "인증번호 받기",
    loginOtpPlaceholder: "인증번호 6자리",
    loginVerifyOtp: "확인",
    loginErrPhone: "휴대폰 번호를 입력해주세요",
    loginErrOtp: "인증번호를 입력해주세요",
    loggedInGreeting: (name) => `${name}님, 안녕하세요`,
    notifAria: "알림 보기",
    notifEmpty: "새로운 알림이 없어요",
    notifBirthdayToday: (name) => `${name}의 생일이에요! 🎉`,
    notifBirthdaySoon: (name, days) => `${name}의 생일이 ${days}일 남았어요 🎂`,
    notifRecordStale: (name) => `${name}의 성장 기록을 남긴 지 좀 됐어요. 최근 체중을 기록해보세요`,
    notifPhotoStale: (name) => `${name}의 성장앨범에 사진을 추가해보세요`,
    pushEnableBtn: "브라우저 알림 켜기",
    pushGranted: "브라우저 알림이 켜졌어요. (이 미리보기 화면 안에서는 실제 알림이 오지 않을 수 있어요)",
    pushDenied: "알림이 차단됐어요. 브라우저 설정에서 허용해주세요.",
    pushUnsupported: "이 화면에서는 브라우저 알림을 지원하지 않아요.",
    pushNote: "실제로 휴대폰에 푸시 알림을 보내려면 Firebase Cloud Messaging(FCM)과 알림을 보낼 서버가 필요해요.",
    landingTagline: "우리 아이의 건강한 성장을 함께",
    landingHeadline1: "반려동물의 성장,",
    landingHeadlineHighlight: "과학적인 계산",
    landingHeadline2: "으로 더 건강하게",
    landingSubtitle: "견종·묘종, 나이, 체중 정보를 바탕으로 예측 체중과 월령별 성장 데이터를 참고해보세요.",
    landingFeature1Title: "성장 예측",
    landingFeature1Desc: "예측 체중과 월령별 성장 곡선을 보여드려요",
    landingFeature2Title: "성장 기록 · 앨범",
    landingFeature2Desc: "체중과 사진을 날짜와 함께 차곡차곡 기록해요",
    landingFeature3Title: "참고 정보 가이드",
    landingFeature3Desc: "또래 비교, 사료·예방접종 참고 정보를 확인해요",
    landingCta: "지금 시작하기",
    landingTrust1: "참고용 성장 데이터",
    landingTrust2: "간편한 시작",
    landingTrust3: "개인정보는 이 기기에만",
    landingTrust4: "지속적인 업데이트",
    landingPreviewLabel: "예측 성체 체중",
    landingBackHome: "홈으로",
    landingHowTitle: "3단계로 시작하세요",
    landingStep1Title: "정보 입력",
    landingStep1Desc: "품종·생년월일·현재 체중만 입력하면 돼요",
    landingStep2Title: "예측 결과 확인",
    landingStep2Desc: "예상 성체 체중과 월령별 성장 그래프를 바로 볼 수 있어요",
    landingStep3Title: "꾸준히 기록",
    landingStep3Desc: "체중과 사진을 남기면서 우리 아이의 성장을 지켜봐요",
    landingFeaturesTitle: "PetGrow가 도와드리는 것들",
    landingAboutTitle: "PetGrow는 이런 서비스예요",
    landingAboutBody: "PetGrow는 강아지와 고양이의 견종·묘종, 생년월일, 체중 정보를 바탕으로 예상 성체 체중과 월령별 성장 곡선을 보여주는 반려동물 성장 기록 서비스예요. 병원에서 잰 체중을 날짜와 함께 기록하면 예상보다 빠르게 크는지 느리게 크는지 자동으로 비교해주고, 사진을 촬영일과 함께 남기면 시간순으로 정리된 성장앨범이 만들어져요. 모든 예측은 참고용 데이터이며, 정확한 건강 관리는 반드시 수의사와 상담해주세요.",
    landingPricingTitle: "체험판과 회원, 무엇이 다를까요?",
    landingTierTrialName: "체험판",
    landingTierTrialPrice: "무료 · 로그인 불필요",
    landingTierTrial1: "반려동물 1마리 등록",
    landingTierTrial2: "성장 예측 · 그래프 · 기록 · 또래 비교",
    landingTierTrial3: "참고 정보 가이드",
    landingTierMemberName: "회원",
    landingTierMemberPrice: "무료 · 휴대폰 번호로 로그인",
    landingTierMember1: "반려동물 최대 10마리 등록",
    landingTierMember2: "체험판의 모든 기능 포함",
    landingTierMember3: "성장앨범(사진) 등록·슬라이드쇼",
  },
  en: {
    privacyFooter: "Everything you enter and every photo you add is stored only in this browser (account) — never shared with other users or sent anywhere else.",
    cancel: "Cancel",
    helpAria: "Open the guide",
    confirmDeleteTitle: "Delete this pet?",
    confirmDeleteMsg: (name) => `All of ${name}'s records and photos will be gone for good — this can't be undone.`,
    confirmDeleteBtn: "Delete",
    guideTitle: "How to use Bboggl",
    guideConfirm: "Got it",
    privacyTitle: "Privacy Policy",
    privacyDraftNotice: "This is a draft, not legal advice. Before launching, fill in the bracketed placeholders (e.g. [contact name], [contact info]) and have it reviewed by a lawyer or other qualified professional.",
    privacyFooterLink: "Privacy Policy",
    guideSections: [
      { title: "1. Register your pet", body: "Enter a name, breed, birth date, and current weight to instantly see the predicted adult weight and growth chart." },
      { title: "2. Growth records", body: "Log weight along with the date you measured it — Bboggl automatically compares it to the prediction and tells you if growth is running fast or slow." },
      { title: "3. Growth album", body: "Add photos with the date taken, anytime. They're organized in chronological order so you can see the whole growth story at a glance." },
      { title: "4. Peer comparison & reference info", body: "Compare with similar-aged pets, and check reference info like feeding amounts and vaccination timing. These are estimates, not prescriptions — always check with a vet." },
      { title: "5. Managing multiple pets", body: "Switch between dogs and cats with the top tabs, and tap a name chip to switch pets — up to 10 per species." },
    ],
    speciesLabel: { dog: "dog", cat: "cat" },
    adultWord: { dog: "adult dog", cat: "adult cat" },
    otherLabel: { dog: "breed", cat: "breed" },
    mixLabel: { dog: "Mixed breed (based on parents)", cat: "Mixed breed (unknown)" },
    customLabel: (otherLabel) => `${otherLabel} not listed (enter manually)`,
    searchPlaceholder: (otherLabel, example) => `Search ${otherLabel} (e.g. ${example})`,
    searchExample: { dog: "Maltese", cat: "Korean Shorthair" },
    otherGroupLabel: "Other",
    noResultsText: (customLabel) => `No matches. Try "${customLabel}" instead.`,
    introEdit: (nameOrLabel) => `Editing ${nameOrLabel}'s info.`,
    introNew: (speciesLabel, adultWord) => `How big will your ${speciesLabel} get? Enter a few basics and we'll show the predicted ${adultWord} weight and growth curve right away.`,
    formAlertMissing: "A few required fields are empty. Please fill in what's marked below.",
    errName: "Please enter a name",
    errBirthDate: "Please select a birth date",
    errWeight: "Please enter the current weight",
    errCustomBreed: (otherLabel) => `Please enter a ${otherLabel} name`,
    labelPetName: (speciesLabel) => `${speciesLabel.charAt(0).toUpperCase() + speciesLabel.slice(1)}'s name`,
    placeholderPetName: { dog: "e.g. Buddy", cat: "e.g. Nabi" },
    defaultPetName: { dog: "Buddy", cat: "Nabi" },
    labelBreedField: (otherLabel) => otherLabel.charAt(0).toUpperCase() + otherLabel.slice(1),
    customBreedPlaceholder: (otherLabel) => `Enter the ${otherLabel} name`,
    sizeCategoryPrompt: "Pick the closest adult size",
    labelBirthDate: "Birth date",
    labelWeight: "Current weight (kg)",
    placeholderWeight: { dog: "e.g. 1.1", cat: "e.g. 0.6" },
    labelGender: "Sex",
    genderFemale: "Female",
    genderMale: "Male",
    labelNeutered: "Spayed/neutered",
    neuteredNo: "Not yet",
    neuteredYes: "Done",
    labelBodyCondition: "Current body condition",
    submitNew: (adultWord) => `See predicted ${adultWord} weight`,
    submitEdit: "Save changes",
    ageUnder1Month: "under 1 month old",
    ageAbout: (n) => `about ${n} months old`,
    heroAgeLabel: (breedName, ageText) => `${breedName} · currently ${ageText}`,
    heroLabel: (adultWord) => `Predicted ${adultWord} weight`,
    heroLikelyPrefix: "Most likely range: about",
    heroDisclaimer: "Individual growth rates vary a lot — this is a reference estimate, not a fixed number.",
    chartTitle: "Growth chart by age",
    chartLegend: "● Black dot = current point",
    tooltipWeight: "Predicted weight",
    monthLabel: (n) => `${n}mo`,
    monthLabelAge: (n) => `${n} months old`,
    tableTitle: "Predicted growth by month",
    recordTitle: "Growth records",
    recordDateLabel: "Date measured",
    recordWeightLabel: "Weight (kg)",
    recordAddBtn: "Add record",
    recordErrDate: "Please select the date measured",
    recordErrWeight: "Please enter a weight",
    recordFirst: "First record",
    recordUpdated: (prev, next) => `Adult estimate updated: ${prev}kg → ${next}kg`,
    diffUp: (g) => `Growing +${g}g faster than predicted`,
    diffDown: (g) => `Growing ${g}g slower than predicted`,
    diffFlat: "Growing about as predicted",
    peerTitle: (speciesLabel) => `Is your ${speciesLabel} on the small side?`,
    peerSubtitle: (speciesLabel) => `A reference comparison against ${speciesLabel}s of the same breed and age.`,
    peerBelow: (pct) => `Bottom ${pct}% by weight among peers`,
    peerAbove: (pct) => `Top ${pct}% by weight among peers`,
    peerDesc: {
      muchBelow: "Noticeably smaller than peers",
      below: "A bit smaller than average",
      similar: "About average for peers",
      above: "A bit bigger than average",
      muchAbove: "Noticeably bigger than peers",
    },
    peerFootnote: "A reference comparison that gets more accurate as more records for the breed come in.",
    albumTitle: "Growth album",
    albumSubtitle: "Add a photo whenever you think of it. Enter the date taken and it's automatically sorted by age and time.",
    photoDateLabel: "Date taken",
    photoLabel: "Photo",
    photoPickBtn: "Choose photo",
    photoAddBtn: "Add to album",
    photoErrDate: "Please select the date taken",
    photoErrPhoto: "Please choose a photo",
    albumEmpty: "No photos yet — add your first one!",
    albumLoginRequiredTitle: "Log in to use the growth album",
    albumLoginRequiredBody: "Saving photos is a member-only feature. Log in and you can also register up to 10 pets, not just one. The weight and growth info you've entered so far stays right where it is.",
    slideshowBtn: "View slideshow",
    photoEditAria: "Edit photo",
    photoDeleteAria: "Delete photo",
    infoTitle: "Reference info",
    feedingTitle: "Feeding amount reference",
    feedingBody: (low, high, bodyLabel) => `About ${low}-${high}kcal a day is a reasonable reference range. It varies with activity level, body condition (${bodyLabel}), and food type — use the food packaging's recommendation and a vet's advice for the actual amount.`,
    humanAgeTitle: "In human years?",
    humanAgeWithAge: (age) => `Right now that's roughly ${age} in human years.`,
    humanAgeNoAge: "Under 1 year old is really more of a rapid-growth stage than a human-age equivalent. Around the 1-year mark it's roughly 15 in human years.",
    humanAgeNote: "A rough reference conversion — it varies by breed and size.",
    ddayTitle: "Next birthday",
    ddayBody: (days) => `${days} days until the next birthday 🎂`,
    vaccineTitle: "Vaccines & health care",
    vaccineNote: "Always confirm the exact vaccination schedule and health care plan with a vet.",
    vaccineText: {
      dog: [
        "First vaccinations usually start around 6-8 weeks old. Until then, avoid walks outside and contact with other dogs.",
        "This is when core vaccines (combo shot, rabies, etc.) continue — schedules vary by clinic, so confirm with your vet.",
        "A good time to discuss spay/neuter, and to start heartworm and deworming prevention.",
        "Adult teeth are coming in, so dental care matters now — keep up with regular checkups too.",
        "Getting close to full adulthood — an annual checkup is a good idea from here on.",
      ],
      cat: [
        "The first FVRCP (feline distemper combo) shot usually starts around 6-8 weeks old. Until then, avoid outings and contact with other cats.",
        "This is when the 2nd-3rd FVRCP doses and FeLV (feline leukemia) vaccination continue — schedules vary by clinic, so confirm with your vet.",
        "A good time to discuss spay/neuter, along with heartworm and deworming prevention.",
        "Adult teeth are coming in, so dental care matters now — keep up with regular checkups too.",
        "Getting close to full adulthood — an annual checkup is a good idea from here on.",
      ],
    },
    sizeTitle: { dog: "Clothing size reference", cat: "Harness/carrier size reference" },
    sizeBody: (size, neck, chest) => `Based on the current weight, a reasonable reference size is ${size} (neck ${neck} / chest ${chest}).`,
    sizeNote: "Sizing varies by brand — check actual measurements before buying.",
    tabDog: (n) => `Bark-Grow${n > 0 ? ` (${n})` : ""}`,
    tabCat: (n) => `Meow-Grow${n > 0 ? ` (${n})` : ""}`,
    addPetLabel: { dog: "Add a dog", cat: "Add a cat" },
    maxPetsReached: "You can register up to 10 pets",
    loginToAddMore: "Log in to add more",
    reportTitle: (name) => `${name}'s growth report`,
    editBtn: "Edit info",
    deleteBtn: "Delete",
    footerNote1: "Features like an AI chatbot, maps, and real push notifications",
    footerNoteStrong: "need their own API keys and backend",
    footerNote2: " — just say the word and we'll add them one at a time, in whatever order you'd like.",
    accountLoginBtn: "Log in",
    accountLogoutBtn: "Log out",
    accountDemoTag: "Demo",
    loginGateTitle: "Please log in",
    loginGateBody: "Log in with your phone number (or email) to safely save and manage your pets under this account.",
    loginTitle: "Log in / Sign up",
    loginDemoNotice: "This is a demo of the screen for now — once you get real Supabase keys, we'll wire up the actual connection.",
    loginEmailLabel: "Email",
    loginPasswordLabel: "Password",
    loginContinueEmail: "Continue with email",
    loginOrDivider: "or",
    loginContinueGoogle: "Continue with Google",
    loginContinueKakao: "Continue with Kakao",
    loginErrEmail: "Please enter an email",
    loginErrPassword: "Please enter a password",
    loginPhonePlaceholder: "Phone number (e.g. 01012345678)",
    loginPhoneSectionLabel: "Log in with your phone number",
    loginSendOtp: "Send code",
    loginOtpPlaceholder: "6-digit code",
    loginVerifyOtp: "Verify",
    loginErrPhone: "Please enter a phone number",
    loginErrOtp: "Please enter the verification code",
    loggedInGreeting: (name) => `Hi, ${name}`,
    notifAria: "View notifications",
    notifEmpty: "No new notifications",
    notifBirthdayToday: (name) => `It's ${name}'s birthday! 🎉`,
    notifBirthdaySoon: (name, days) => `${name}'s birthday is in ${days} days 🎂`,
    notifRecordStale: (name) => `It's been a while since ${name}'s last weigh-in — log a recent weight`,
    notifPhotoStale: (name) => `Add a new photo to ${name}'s growth album`,
    pushEnableBtn: "Turn on browser notifications",
    pushGranted: "Browser notifications are on. (This preview screen may not actually deliver them.)",
    pushDenied: "Notifications are blocked — allow them in your browser settings.",
    pushUnsupported: "Browser notifications aren't supported here.",
    pushNote: "Sending real push notifications to a phone needs Firebase Cloud Messaging (FCM) and a server to send them.",
    landingTagline: "Growing up healthy, together",
    landingHeadline1: "Your pet's growth,",
    landingHeadlineHighlight: "backed by data",
    landingHeadline2: " — for a healthier future",
    landingSubtitle: "Enter breed, age, and weight to see a predicted adult weight and month-by-month growth data.",
    landingFeature1Title: "Growth prediction",
    landingFeature1Desc: "Predicted adult weight and a growth curve by month",
    landingFeature2Title: "Records & album",
    landingFeature2Desc: "Log weight and photos, neatly organized by date",
    landingFeature3Title: "Reference guide",
    landingFeature3Desc: "Peer comparison, feeding and vaccine reference info",
    landingCta: "Get started",
    landingTrust1: "Reference-only growth data",
    landingTrust2: "Quick to start",
    landingTrust3: "Data stays on this device",
    landingTrust4: "Continuously improving",
    landingPreviewLabel: "Predicted adult weight",
    landingBackHome: "Home",
    landingHowTitle: "Get started in 3 steps",
    landingStep1Title: "Enter basics",
    landingStep1Desc: "Just breed, birth date, and current weight",
    landingStep2Title: "See the prediction",
    landingStep2Desc: "Get the predicted adult weight and a growth chart by age instantly",
    landingStep3Title: "Keep a record",
    landingStep3Desc: "Log weight and photos and watch your pet grow",
    landingFeaturesTitle: "What PetGrow helps with",
    landingAboutTitle: "What is PetGrow?",
    landingAboutBody: "PetGrow is a growth-tracking service for dogs and cats. Enter your pet's breed, birth date, and weight to see a predicted adult weight and a growth curve by month. Log weight measurements with the date and PetGrow automatically compares actual growth to the prediction, and adding photos with the date taken builds a chronologically organized growth album. All predictions are reference data only — always consult a vet for actual health decisions.",
    landingPricingTitle: "Trial vs. Member — what's different?",
    landingTierTrialName: "Trial",
    landingTierTrialPrice: "Free · no login needed",
    landingTierTrial1: "Register 1 pet",
    landingTierTrial2: "Growth prediction, chart, records, peer comparison",
    landingTierTrial3: "Reference info guide",
    landingTierMemberName: "Member",
    landingTierMemberPrice: "Free · log in with phone number",
    landingTierMember1: "Register up to 10 pets",
    landingTierMember2: "Everything in Trial, plus:",
    landingTierMember3: "Growth album (photos) & slideshow",
  },
};

function useT() {
  const lang = useLang();
  return STRINGS[lang];
}
function breedName(breed, lang) {
  return lang === "en" ? breed.nameEn : breed.name;
}
function optionName(opt, lang) {
  return lang === "en" ? opt.nameEn : opt.name;
}
function groupLabel(group, lang) {
  return lang === "en" ? group.labelEn : group.label;
}
// mix/직접입력 견종은 별도 영어 이름이 없으므로 사용자가 입력한 그대로 보여줘요
function getBreedDisplayName(profile, allBreedsFlat, lang) {
  if (profile.breedId === "mix" || profile.breedId === "custom") return profile.breedName;
  const b = allBreedsFlat.find((x) => x.id === profile.breedId);
  return b ? breedName(b, lang) : profile.breedName;
}

/* ============================================================
   lib/predict.js 역할
   ============================================================ */
function monthsBetween(from, to) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.437));
}

function curveValueAt(curveKey, months) {
  const curve = ALL_CURVES[curveKey] || ALL_CURVES["dog-small"]; // 알 수 없는(예: 이전 버전) curveKey 대비 안전장치
  const pts = curve.points;
  const keys = Object.keys(pts).map(Number).sort((a, b) => a - b);
  if (months <= keys[0]) return pts[keys[0]] * (months / keys[0] || 1);
  if (months >= keys[keys.length - 1]) return 1.0;
  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i], k1 = keys[i + 1];
    if (months >= k0 && months <= k1) {
      const t = (months - k0) / (k1 - k0);
      return pts[k0] + t * (pts[k1] - pts[k0]);
    }
  }
  return 1.0;
}

function estimateAdultWeight(currentWeightKg, ageMonths, curveKey) {
  const frac = Math.max(0.05, curveValueAt(curveKey, ageMonths));
  return currentWeightKg / frac;
}

function predictionRange(estimateKg) {
  return {
    low: estimateKg * 0.85,
    high: estimateKg * 1.15,
    likelyLow: estimateKg * 0.95,
    likelyHigh: estimateKg * 1.05,
  };
}

function buildGrowthTable(estimateKg, curveKey, currentAgeMonths) {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24];
  return months.map((m) => ({
    month: m,
    weight: Math.round(curveValueAt(curveKey, m) * estimateKg * 100) / 100,
    isCurrent: Math.round(currentAgeMonths) === m,
  }));
}

function fmtKg(n) {
  return `${n.toFixed(1)}kg`;
}

// 이전 버전(월령 고정 슬롯)에 저장된 사진을 새 형식(날짜 배열)으로 변환
function normalizePhotos(photos, birthDate) {
  if (Array.isArray(photos)) return photos;
  if (!photos || typeof photos !== "object") return [];
  return Object.entries(photos).map(([month, dataUrl]) => {
    const d = new Date(birthDate);
    d.setMonth(d.getMonth() + Number(month));
    return { id: `legacy-${month}`, date: d.toISOString().slice(0, 10), dataUrl };
  });
}

/* ============================================================
   더미 저장소 (window.storage 사용, 실패해도 앱은 동작)
   ============================================================ */
async function safeGet(key) {
  try {
    const r = await window.storage.get(key, false);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function safeSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch {
    /* 저장 실패해도 화면은 계속 동작 */
  }
}

/* ============================================================
   솔리드 아이콘
   ============================================================ */
const PawIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <circle cx="6" cy="9" r="2.3" /><circle cx="12" cy="6.5" r="2.4" /><circle cx="18" cy="9" r="2.3" />
    <path d="M12 12c-3.5 0-6.5 2.3-6.5 5.2 0 1.7 1.4 2.8 3.1 2.3.9-.3 1.9-.9 3.4-.9s2.5.6 3.4.9c1.7.5 3.1-.6 3.1-2.3C18.5 14.3 15.5 12 12 12z" />
  </svg>
);
const CatIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M5 3l2.2 5.2h9.6L19 3l-5.4 3h-3.2L5 3zM4 10c0 6 3.6 10.5 8 10.5S20 16 20 10l-3 2c-1 3.2-3.2 4.5-5 4.5s-4-1.3-5-4.5l-3-2z" />
  </svg>
);
const ChartIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zM3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3z" />
  </svg>
);
const InfoIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);
const CameraIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9zm3 6a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);
const ScaleIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M4 4h9v2H4zm0 4h16v2H4zm0 4h13v2H4zm0 4h16v2H4zm0 4h9v2H4z" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm-1.2 13.6L7 11.8l1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
  </svg>
);
const BowlIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M3 11h18a1 1 0 0 1 1 1c0 4.4-3.8 8-9 8s-9-3.6-9-8a1 1 0 0 1 1-1zm3.5-7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm6 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm6 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
  </svg>
);
const EditIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);
const TrashIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 8h12l-1 13H7L6 8zm4 2v9h1v-9h-1zm3 0v9h1v-9h-1z" />
  </svg>
);
const BellIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zM18 16v-5a6 6 0 0 0-5-5.92V4a1 1 0 0 0-2 0v1.08A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);
const PlusIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
  </svg>
);
const HelpIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.9 15.5h-1.8v-1.8h1.8v1.8zm1.86-6.9c-.46.5-.8.9-.96 1.34-.1.28-.15.55-.15 1.06h-1.7v-.3c0-.6.13-1.1.4-1.55.24-.4.6-.8 1.05-1.24.36-.35.6-.6.72-.8.16-.28.24-.58.24-.9 0-.6-.16-1.06-.48-1.36-.32-.3-.77-.46-1.36-.46-.6 0-1.08.18-1.44.53-.35.34-.53.82-.53 1.42h-1.75c0-1.06.36-1.9 1.06-2.55.72-.65 1.63-.97 2.75-.97 1.13 0 2.03.3 2.7.9.68.6 1.02 1.4 1.02 2.4 0 .58-.16 1.1-.5 1.48z" />
  </svg>
);
const UserIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
  </svg>
);
const MailIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2L12 12.5 19.6 7H4.4zM4 9.2V17h16V9.2l-8 5.8-8-5.8z" />
  </svg>
);
const GoogleGIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1-4.95 11.95l1.62-1.62A4.7 4.7 0 0 0 12 16.7c2.1 0 3.9-1.35 4.53-3.2H12v-2.3h6.9c.08.4.1.8.1 1.3 0 3.9-2.6 6.7-7 6.7a7 7 0 1 1 0-14c1.85 0 3.4.65 4.6 1.75l-1.9 1.85A4.6 4.6 0 0 0 12 5z" />
  </svg>
);
const KakaoIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 3C6.48 3 2 6.48 2 10.7c0 2.7 1.78 5.08 4.47 6.43-.2.72-.72 2.6-.83 3-.13.5.18.5.38.36.16-.1 2.53-1.7 3.56-2.4.78.11 1.58.17 2.42.17 5.52 0 10-3.48 10-7.56C22 6.48 17.52 3 12 3z" />
  </svg>
);
const LeafIcon = (p) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path d="M4 20c9 0 16-7 16-16-9 0-16 7-16 16zm0 0c2-4 5-7 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// PetGrow 브랜드 마크 (업로드해주신 로고를 참고해 만든 심볼 — 강아지+고양이+하트)
const PetGrowMark = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 30c-8 0-13 6-13 14 0 7 4 12 9 15-3 6-2 13 2 18" stroke="#3a3a3a" strokeWidth="3.2" />
      <circle cx="20" cy="34" r="1.6" fill="#3a3a3a" />
      <path d="M55 38c8-2 15 3 17 11 2 8-2 15-8 19 2 6 0 12-4 16" stroke="#7fa66b" strokeWidth="3.2" />
      <circle cx="65" cy="42" r="1.6" fill="#7fa66b" />
      <path d="M32 60c4-5 10-5 14 0 4-5 10-5 14 0 0 6-7 12-14 16-7-4-14-10-14-16z" stroke="#7fa66b" strokeWidth="3" />
      <path d="M46 58c0-4 2-6 6-7-1 4-2 6-6 7z" fill="#7fa66b" stroke="none" />
    </g>
  </svg>
);

/* ============================================================
   범용 모달 / 확인창 / 가이드
   ============================================================ */
function Modal({ open, onClose, children, width = 420 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onCancel}>
      <h3 style={{ fontSize: 17, marginBottom: 10 }}>{title}</h3>
      <p className="bg-sub" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>{message}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{t.cancel}</button>
        <button className="bg-btn" style={{ flex: 1 }} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

function GuideModal({ open, onClose }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <HelpIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{t.guideTitle}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {t.guideSections.map((s) => (
          <div key={s.title}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
            <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>
      <button className="bg-btn" style={{ width: "100%", marginTop: 22 }} onClick={onClose}>{t.guideConfirm}</button>
    </Modal>
  );
}

/* ============================================================
   개인정보처리방침 (초안) — 법률 자문 아님, 배포 전 검토 필요
   ============================================================ */
const PRIVACY_SECTIONS_KO = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: "회원가입(휴대폰 번호 로그인) 시 휴대폰 번호를 필수로 수집해요. 서비스 이용 과정에서 반려동물의 이름·품종·생년월일·체중·사진을 선택적으로 입력하실 수 있어요. 이 중 사진은 이용자가 직접 업로드하는 콘텐츠이며, 사람이 포함된 사진을 올리실 경우 그 부분도 개인정보에 해당할 수 있으니 유의해주세요.",
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    body: "휴대폰 번호는 회원 식별과 로그인 인증(SMS 인증번호 발송)을 위해서만 사용해요. 반려동물 정보는 성장 예측, 성장 기록 관리, 성장앨범 제공 등 서비스 제공 목적으로만 이용해요.",
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    body: "회원 탈퇴 시 지체 없이 파기하는 것을 원칙으로 해요. 다만 관계 법령에 따라 보존할 의무가 있는 경우 해당 법령에서 정한 기간 동안 보관해요.",
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: "이용자의 동의 없이 개인정보를 외부에 제공하지 않아요. 법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우는 예외로 해요.",
  },
  {
    title: "5. 개인정보 처리위탁 및 국외 이전",
    body: "SMS 인증번호 발송을 위해 외부 문자 발송 업체에 처리를 위탁할 수 있어요. 이용하는 인증·데이터 저장 업체(예: Supabase 등)의 서버 위치에 따라 개인정보가 국외로 이전될 수 있으며, 실제 서비스 오픈 전 위탁업체명·이전국가·이전항목을 이 조항에 구체적으로 명시해야 해요.",
  },
  {
    title: "6. 이용자의 권리와 행사 방법",
    body: "이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있어요. 앱 내 '삭제' 기능으로 반려동물 데이터를 직접 삭제할 수 있고, 계정 자체의 삭제는 별도 문의를 통해 처리해요.",
  },
  {
    title: "7. 개인정보의 파기 절차 및 방법",
    body: "전자적 파일 형태로 저장된 개인정보는 복구할 수 없는 방법으로 영구 삭제해요.",
  },
  {
    title: "8. 쿠키 등 자동 수집 장치",
    body: "현재는 로그인 상태 유지와 반려동물 데이터 저장을 위해 이용자의 브라우저 저장소만 사용하고 있어요. 향후 통계·광고 목적의 쿠키를 도입할 경우 이 방침을 통해 별도로 안내해요.",
  },
  {
    title: "9. 개인정보 보호책임자",
    body: "[담당 부서/담당자명], 이메일: [연락처 이메일 입력], 전화번호: [연락처 전화번호 입력]",
  },
  {
    title: "10. 고지의 의무",
    body: "이 방침은 관련 법령·정책 변경에 따라 수정될 수 있으며, 변경 시 시행일 7일 전부터 공지해요.",
  },
];
const PRIVACY_SECTIONS_EN = [
  { title: "1. Information we collect", body: "We collect your phone number when you sign up (phone-based login). You may optionally enter your pet's name, breed, birth date, weight, and photos. Photos are content you upload yourself — if a photo includes a person, that portion may also count as personal data, so please be mindful." },
  { title: "2. Purpose of collection and use", body: "Your phone number is used only to identify your account and for login verification (sending the SMS code). Pet information is used only to provide the service — growth prediction, growth records, and the growth album." },
  { title: "3. Retention period", body: "As a rule, data is deleted without delay upon account deletion, except where retention is required by law, for the period required by that law." },
  { title: "4. Sharing with third parties", body: "We do not share personal data with outside parties without consent, except where required by law or a lawful request from investigative authorities." },
  { title: "5. Outsourcing and overseas transfer", body: "SMS verification may be outsourced to an external messaging provider. Depending on the server location of the authentication/storage provider used (e.g. Supabase), personal data may be transferred overseas — the specific provider, destination country, and transferred items must be named here before launch." },
  { title: "6. Your rights", body: "You may request to view, correct, delete, or stop processing of your personal data at any time. Pet data can be deleted directly in the app; account deletion is handled through a separate request." },
  { title: "7. Deletion procedure", body: "Personal data stored electronically is permanently deleted in a way that prevents recovery." },
  { title: "8. Cookies and similar technologies", body: "Currently we only use your browser's local storage to keep you logged in and store your pet data. Any future analytics or advertising cookies will be disclosed separately through this policy." },
  { title: "9. Privacy officer", body: "[Department/contact name], email: [contact email], phone: [contact phone]" },
  { title: "10. Notice obligation", body: "This policy may be revised to reflect changes in law or policy; changes will be announced at least 7 days before taking effect." },
];

function PrivacyModal({ open, onClose }) {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS_KO;
  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <ShieldIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{t.privacyTitle}</h3>
      </div>
      <p className="bg-sub" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>{t.privacyDraftNotice}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map((s) => (
          <div key={s.title}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
            <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
      <button className="bg-btn" style={{ width: "100%", marginTop: 22 }} onClick={onClose}>{t.guideConfirm}</button>
    </Modal>
  );
}

/* ============================================================
   로그인 / 회원가입 (데모 — Supabase Auth 연동 전 UI 목업)
   실제 연동 시 onPhoneLogin 부분만
   supabase.auth.signInWithOtp({phone})/signInWithPassword 호출로 교체하면 돼요.
   ============================================================ */
function LoginModal({ open, onClose, onPhoneLogin }) {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const sendOtp = () => {
    if (!phone.trim()) { setPhoneError(t.loginErrPhone); return; }
    setPhoneError("");
    setOtpSent(true);
  };
  const verifyOtp = () => {
    if (otp.trim().length < 4) { setPhoneError(t.loginErrOtp); return; }
    setPhoneError("");
    onPhoneLogin(phone.trim());
    setPhone(""); setOtp(""); setOtpSent(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <UserIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{t.loginTitle}</h3>
      </div>
      <p className="bg-sub" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>{t.loginDemoNotice}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label className="bg-label" style={{ marginBottom: 0 }}>{t.loginPhoneSectionLabel}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="tel" className="bg-input" style={{ flex: 1 }} value={phone} disabled={otpSent}
            onChange={(e) => setPhone(e.target.value)} placeholder={t.loginPhonePlaceholder} />
          {!otpSent && (
            <button className="bg-btn" style={{ flexShrink: 0 }} onClick={sendOtp}>{t.loginSendOtp}</button>
          )}
        </div>
        {otpSent && (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" inputMode="numeric" className="bg-input" style={{ flex: 1 }} value={otp}
              onChange={(e) => setOtp(e.target.value)} placeholder={t.loginOtpPlaceholder} />
            <button className="bg-btn" style={{ flexShrink: 0 }} onClick={verifyOtp}>{t.loginVerifyOtp}</button>
          </div>
        )}
        {phoneError && <div className="field-error">{phoneError}</div>}
      </div>

    </Modal>
  );
}

function AccountButton({ account, onOpenLogin, onLogout }) {
  const t = useT();
  if (account) {
    return (
      <button type="button" className="account-btn" onClick={onLogout} title={t.accountLogoutBtn}>
        <UserIcon style={{ width: 16, height: 16, color: "var(--primary)" }} />
        {account.name}
        <span className="demo-tag">{t.accountDemoTag}</span>
      </button>
    );
  }
  return (
    <button type="button" className="account-btn" onClick={onOpenLogin}>
      <UserIcon style={{ width: 16, height: 16 }} /> {t.accountLoginBtn}
    </button>
  );
}

/* ============================================================
   인앱 알림 (생일 임박·기록/사진 안 남긴 지 오래됨) — 키 불필요
   실제 휴대폰 푸시(FCM)는 별도 서버 연동이 필요해요
   ============================================================ */
function computeNotifications(dogPets, catPets, now, t) {
  const items = [];
  const allPets = [...dogPets.map((p) => ({ ...p, species: "dog" })), ...catPets.map((p) => ({ ...p, species: "cat" }))];
  allPets.forEach((pet) => {
    const { profile, records, photos } = pet;
    const dday = nextBirthdayDday(profile.birthDate, now);
    if (dday <= 7) {
      items.push({
        key: `bday-${pet.id}`, species: pet.species, petId: pet.id,
        message: dday === 0 ? t.notifBirthdayToday(profile.name) : t.notifBirthdaySoon(profile.name, dday),
      });
    }
    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestRecordDate = sortedRecords[0] ? new Date(sortedRecords[0].date) : null;
    const ageMonths = monthsBetween(new Date(profile.birthDate), now);
    if (ageMonths < 24 && latestRecordDate) {
      const daysSince = (now - latestRecordDate) / (1000 * 60 * 60 * 24);
      if (daysSince >= 30) {
        items.push({ key: `record-${pet.id}`, species: pet.species, petId: pet.id, message: t.notifRecordStale(profile.name) });
      }
    }
    const sortedPhotos = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestPhotoDate = sortedPhotos[0] ? new Date(sortedPhotos[0].date) : null;
    const daysSincePhoto = latestPhotoDate ? (now - latestPhotoDate) / (1000 * 60 * 60 * 24) : Infinity;
    if (daysSincePhoto >= 30) {
      items.push({ key: `photo-${pet.id}`, species: pet.species, petId: pet.id, message: t.notifPhotoStale(profile.name) });
    }
  });
  return items;
}

function NotificationBell({ items, onSelect, onEnablePush, pushStatus }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="notif-wrap">
      <button type="button" className="icon-btn" style={{ position: "relative" }} aria-label={t.notifAria}
        onClick={() => setOpen((o) => !o)}>
        <BellIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        {items.length > 0 && <span className="notif-badge">{items.length}</span>}
      </button>
      {open && (
        <div className="notif-panel" onMouseLeave={() => setOpen(false)}>
          {items.length === 0 ? (
            <div className="bg-sub" style={{ padding: "16px 14px", fontSize: 13 }}>{t.notifEmpty}</div>
          ) : (
            items.map((n) => (
              <div key={n.key} className="notif-item" onClick={() => { onSelect(n); setOpen(false); }}>
                {n.message}
              </div>
            ))
          )}
          <div className="notif-footer">
            <button type="button" className="bg-btn bg-btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={onEnablePush}>
              {t.pushEnableBtn}
            </button>
            {pushStatus && (
              <div className="bg-sub" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
                {pushStatus === "granted" ? t.pushGranted : pushStatus === "denied" ? t.pushDenied : t.pushUnsupported}
              </div>
            )}
            <div className="bg-sub" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{t.pushNote}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   전역 스타일 - 디자인 시스템 (브리프 지정값 그대로)
   ============================================================ */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    .bboggl-root{
      --primary:#2383E2;--text:#191919;--sub:#787774;--bg:#FFFFFF;--surface:#F7F6F3;--border:#E9E9E7;
      font-family:'Inter',sans-serif; letter-spacing:-0.01em; color:var(--text); background:var(--bg);
      min-height:100%; width:100%; box-sizing:border-box;
    }
    .bboggl-root *{box-sizing:border-box;}
    .bboggl-root h1,.bboggl-root h2,.bboggl-root h3{font-weight:800; margin:0;}
    .bg-btn{border-radius:10px;padding:12px 20px;font-weight:700;background:var(--primary);color:#fff;border:none;
      box-shadow:0 6px 14px rgba(0,0,0,.25);cursor:pointer;transition:.15s; font-size:15px; font-family:inherit;}
    .bg-btn:hover{transform:translateY(-1px); box-shadow:0 9px 18px rgba(0,0,0,.3);}
    .bg-btn:disabled{opacity:.4; cursor:not-allowed; transform:none;}
    .bg-btn-ghost{background:var(--surface); color:var(--text); box-shadow:none; border:1px solid var(--border);}
    .bg-btn-ghost:hover{box-shadow:0 4px 10px rgba(0,0,0,.12);}
    .icon{width:22px;height:22px;fill:currentColor;stroke:none;flex-shrink:0;}
    .bg-card{background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:20px;}
    .bg-surface-card{background:var(--surface); border-radius:14px; padding:20px;}
    .bg-input{width:100%; padding:11px 13px; border:1px solid var(--border); border-radius:10px; font-family:inherit;
      font-size:14px; background:#fff; color:var(--text);}
    .bg-input:focus{outline:2px solid var(--primary); outline-offset:1px;}
    .bg-chip{padding:10px 14px; border-radius:10px; border:1px solid var(--border); background:#fff; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:500; color:var(--text); transition:.12s; text-align:left;}
    .bg-chip:hover{border-color:var(--primary);}
    .bg-chip.active{background:var(--primary); color:#fff; border-color:var(--primary); font-weight:700;}
    .bg-label{font-size:13px; font-weight:700; color:var(--text); margin-bottom:8px; display:block;}
    .bg-sub{color:var(--sub); font-size:13px;}
    .bg-accordion{border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:8px;}
    .bg-accordion summary{padding:14px 16px; cursor:pointer; font-weight:700; font-size:14px; list-style:none;
      display:flex; align-items:center; justify-content:space-between; background:#fff;}
    .bg-accordion summary::-webkit-details-marker{display:none;}
    .bg-accordion[open] summary{border-bottom:1px solid var(--border);}
    .bg-accordion .acc-body{padding:14px 16px; font-size:13px; line-height:1.7; color:var(--text); background:var(--surface);}
    .photo-tile{aspect-ratio:1; border-radius:12px; overflow:hidden; position:relative; cursor:pointer;
      border:1px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center;}
    .photo-tile.locked{cursor:not-allowed; opacity:.5;}
    .photo-tile img{width:100%; height:100%; object-fit:cover;}
    .photo-tile .tile-label{position:absolute; bottom:0; left:0; right:0; background:rgba(25,25,25,.6); color:#fff;
      font-size:11px; font-weight:700; padding:4px 6px; text-align:center;}
    .tile-actions{position:absolute; top:5px; right:5px; display:flex; gap:4px;}
    .tile-btn{width:26px; height:26px; border-radius:8px; border:none; background:rgba(25,25,25,.55);
      display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0;}
    .tile-btn:hover{background:rgba(25,25,25,.8);}
    .tile-btn .icon{width:14px; height:14px; fill:#fff;}
    .reminder-banner{display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--primary);
      border-radius:10px; padding:12px 14px; margin-bottom: 14px;}
    .photo-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(110px,1fr)); gap:8px;}
    .pet-switcher{display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; margin-bottom:18px;}
    .pet-switcher .bg-chip{white-space:nowrap; flex-shrink:0;}
    .bg-input.invalid{border-color:var(--primary); box-shadow:0 0 0 1px var(--primary);}
    .field-error{color:var(--primary); font-size:12px; font-weight:700; margin-top:5px;}
    .form-alert{display:flex; align-items:flex-start; gap:8px; background:var(--surface); border:1px solid var(--primary);
      border-radius:10px; padding:10px 12px; font-size:13px; font-weight:600; margin-bottom:12px;}
    .icon-btn{width:38px; height:38px; border-radius:10px; border:1px solid var(--border); background:#fff;
      display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;}
    .icon-btn:hover{border-color:var(--primary);}
    .lang-toggle{display:flex; border:1px solid var(--border); border-radius:10px; overflow:hidden; flex-shrink:0;}
    .lang-toggle button{border:none; background:#fff; padding:0 12px; height:38px; font-family:inherit; font-size:12px;
      font-weight:700; cursor:pointer; color:var(--sub);}
    .lang-toggle button.active{background:var(--primary); color:#fff;}
    .account-btn{display:flex; align-items:center; gap:6px; height:38px; padding:0 12px; border-radius:10px;
      border:1px solid var(--border); background:#fff; cursor:pointer; font-family:inherit; font-size:13px;
      font-weight:700; color:var(--text); flex-shrink:0;}
    .account-btn:hover{border-color:var(--primary);}
    .demo-tag{font-size:10px; font-weight:700; color:var(--primary); background:var(--surface);
      border-radius:6px; padding:2px 6px; margin-left:2px;}
    .login-divider{display:flex; align-items:center; gap:10px; margin:16px 0; color:var(--sub); font-size:12px;}
    .login-divider::before, .login-divider::after{content:""; flex:1; height:1px; background:var(--border);}
    .btn-google{display:flex; align-items:center; justify-content:center; gap:8px; width:100%;}
    .notif-wrap{position:relative;}
    .notif-badge{position:absolute; top:-4px; right:-4px; background:var(--primary); color:#fff; font-size:10px;
      font-weight:700; min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center;
      justify-content:center; padding:0 3px;}
    .notif-panel{position:absolute; top:calc(100% + 6px); right:0; width:280px; background:#fff;
      border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 28px rgba(0,0,0,.16); z-index:30;
      max-height:340px; overflow-y:auto;}
    .notif-item{padding:11px 14px; font-size:13px; line-height:1.5; cursor:pointer; border-bottom:1px solid var(--border);}
    .notif-item:hover{background:var(--surface);}
    .notif-footer{padding:12px 14px; border-top:1px solid var(--border);}
    .slideshow-card{background:#111; border-radius:16px; padding:16px; max-width:640px; width:100%;
      display:flex; flex-direction:column; position:relative;}
    .slideshow-close{position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:8px;
      border:none; background:rgba(255,255,255,.15); color:#fff; font-size:16px; cursor:pointer; z-index:2;}
    .slideshow-image-wrap{position:relative; display:flex; align-items:center; justify-content:center;
      min-height:280px; max-height:60vh;}
    .slideshow-image-wrap img{max-width:100%; max-height:60vh; border-radius:8px; object-fit:contain;}
    .slideshow-nav{position:absolute; top:50%; transform:translateY(-50%); width:40px; height:40px;
      border-radius:50%; border:none; background:rgba(255,255,255,.2); color:#fff; font-size:24px; cursor:pointer;}
    .slideshow-nav:hover{background:rgba(255,255,255,.35);}
    .slideshow-prev{left:4px;} .slideshow-next{right:4px;}
    .slideshow-caption{display:flex; justify-content:space-between; color:#fff; font-size:13px; margin-top:12px;}
    .slideshow-caption .bg-sub{color:rgba(255,255,255,.6);}
    .landing-root{--pg-dark:#33383a; --pg-green:#7fa66b; --pg-green-light:#eef3ea;
      background:linear-gradient(180deg,#f6f8f4 0%, #eef3ea 60%, #f6f8f4 100%); min-height:100vh;}
    .landing-wrap{max-width:960px; margin:0 auto; padding:0 24px;}
    .landing-logo-badge{width:132px; height:132px; border-radius:50%; background:#fff; display:flex;
      align-items:center; justify-content:center; margin:0 auto 18px; box-shadow:0 10px 30px rgba(0,0,0,.1);}
    .landing-wordmark{text-align:center; font-size:clamp(38px,7vw,56px); font-weight:800; letter-spacing:-0.02em;}
    .landing-wordmark .pet{color:var(--pg-dark);} .landing-wordmark .grow{color:var(--pg-green);}
    .landing-tagline{text-align:center; color:#8a8f86; font-size:15px; margin-top:8px;}
    .landing-headline{text-align:center; font-size:clamp(28px,5vw,42px); font-weight:800; line-height:1.35; margin-top:44px; color:var(--pg-dark);}
    .landing-headline .hl{color:var(--pg-green);}
    .landing-subtitle{text-align:center; color:#787774; font-size:17px; margin-top:18px; line-height:1.7;
      max-width:560px; margin-left:auto; margin-right:auto;}
    .landing-cta{display:block; margin:32px auto 0; background:var(--pg-green); color:#fff; border:none;
      border-radius:14px; padding:18px 42px; font-size:18px; font-weight:700; font-family:inherit; cursor:pointer;
      box-shadow:0 10px 24px rgba(127,166,107,.35); transition:.15s;}
    .landing-cta:hover{transform:translateY(-1px); box-shadow:0 14px 28px rgba(127,166,107,.4);}
    .landing-illustration{display:flex; justify-content:center; gap:24px; margin:52px 0;}
    .landing-illustration .paw-badge, .landing-illustration .cat-badge{width:128px; height:128px; border-radius:32px;
      display:flex; align-items:center; justify-content:center; box-shadow:0 12px 28px rgba(0,0,0,.07);}
    .landing-illustration .paw-badge{background:#fff; transform:rotate(-6deg);}
    .landing-illustration .cat-badge{background:var(--pg-green-light); transform:rotate(6deg); margin-top:26px;}
    .landing-about{display:flex; flex-direction:column; align-items:center; text-align:center; gap:18px; max-width:640px; margin:0 auto;}
    .landing-about-icon{width:96px; height:96px; border-radius:28px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 10px 24px rgba(0,0,0,.05);}
    .landing-about-text{font-size:17px; line-height:1.9; color:#585d57;}
    .landing-showcase{display:flex; flex-direction:column; gap:72px; margin-top:8px;}
    .landing-showcase-row{display:flex; align-items:center; gap:56px;}
    .landing-showcase-row.reverse{flex-direction:row-reverse;}
    .landing-showcase-media{flex:1 1 320px; display:flex; justify-content:center;}
    .landing-showcase-text{flex:1 1 320px;}
    .landing-showcase-title{font-size:26px; font-weight:800; color:var(--pg-dark); margin-bottom:14px;}
    .landing-showcase-desc{font-size:16px; color:#787774; line-height:1.85; max-width:400px;}
    .mock-card{background:#fff; border-radius:22px; padding:26px; box-shadow:0 20px 48px rgba(51,56,58,.1);
      width:100%; max-width:340px;}
    .mock-card-label{font-size:12px; color:#8a8f86; font-weight:700; text-transform:uppercase; letter-spacing:.03em;}
    .mock-card-value{font-size:36px; font-weight:800; color:var(--pg-dark); margin-top:6px;}
    .mock-card-sub{font-size:13px; color:var(--pg-green); font-weight:700; margin-top:4px;}
    .mock-sparkline{margin-top:18px;}
    .mock-photos{display:flex; gap:10px; margin-top:14px;}
    .mock-photo{flex:1; aspect-ratio:1; border-radius:14px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center;}
    .mock-photo-alt{background:#f3efe6;}
    .mock-photo-caption{font-size:12px; color:#8a8f86; margin-top:12px;}
    .mock-checklist-row{display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f0f2ee;}
    .mock-checklist-row:last-child{border-bottom:none;}
    .mock-checklist-icon{width:36px; height:36px; border-radius:10px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;}
    .mock-checklist-text{font-size:14px; font-weight:600; color:var(--pg-dark);}
    .landing-features{display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:20px;}
    .landing-feature-card{background:#fff; border-radius:16px; padding:26px 20px; text-align:center;
      box-shadow:0 4px 14px rgba(0,0,0,.04);}
    .landing-feature-icon{width:58px; height:58px; border-radius:16px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; margin:0 auto 14px;}
    .landing-feature-title{font-weight:700; font-size:16px; color:var(--pg-dark); margin-bottom:8px;}
    .landing-feature-desc{font-size:13px; color:#8a8f86; line-height:1.6;}
    .landing-trust{display:flex; flex-wrap:wrap; justify-content:center; gap:12px 28px; margin-top:44px;
      padding-top:28px; border-top:1px solid #e3e8de;}
    .landing-trust-item{display:flex; align-items:center; gap:6px; font-size:13px; color:#787774; font-weight:600;}
    .landing-pricing{display:grid; grid-template-columns:repeat(2,1fr); gap:20px; max-width:640px; margin:0 auto;}
    .landing-pricing-card{background:#fff; border:1px solid #e3e8de; border-radius:18px; padding:28px 24px;}
    .landing-pricing-highlight{background:var(--pg-dark); border-color:var(--pg-dark);}
    .landing-pricing-name{font-weight:800; font-size:16px; color:var(--pg-dark);}
    .landing-pricing-highlight .landing-pricing-name{color:#fff;}
    .landing-pricing-price{font-weight:800; font-size:24px; color:var(--pg-green); margin:8px 0 16px;}
    .landing-pricing-highlight .landing-pricing-price{color:#9dc088;}
    .landing-pricing-list{list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;
      font-size:13px; color:#585d57;}
    .landing-pricing-highlight .landing-pricing-list{color:rgba(255,255,255,.85);}
    .landing-pricing-list li{padding-left:20px; position:relative;}
    .landing-pricing-list li::before{content:"✓"; position:absolute; left:0; color:var(--pg-green); font-weight:800;}
    .landing-pricing-highlight .landing-pricing-list li::before{color:#9dc088;}
    .landing-section{padding:56px 0;}
    .landing-section-white{background:#fff;}
    .landing-hero-section{padding-top:56px; padding-bottom:36px;}
    .landing-section-title{text-align:center; font-size:22px; font-weight:800; color:var(--pg-dark); margin-bottom:32px;}
    .landing-steps{display:grid; grid-template-columns:repeat(3,1fr); gap:24px;}
    .landing-step{text-align:center;}
    .landing-step-num{width:36px; height:36px; border-radius:50%; background:var(--pg-green); color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:800; margin:0 auto 12px;}
    .landing-step-title{font-weight:700; font-size:14px; color:var(--pg-dark); margin-bottom:6px;}
    .landing-step-desc{font-size:12px; color:#8a8f86; line-height:1.6;}
    .landing-footer{background:var(--pg-dark);}
    .landing-footer-text{text-align:center; color:rgba(255,255,255,.55); font-size:11px; margin-top:10px; line-height:1.7;}
    @media (max-width:680px){ .landing-features{grid-template-columns:1fr;} .landing-steps{grid-template-columns:1fr;} .landing-pricing{grid-template-columns:1fr;}
      .landing-showcase-row, .landing-showcase-row.reverse{flex-direction:column; gap:28px;} .landing-showcase{gap:52px;} }
    .modal-overlay{position:fixed; inset:0; background:rgba(25,25,25,.5); display:flex; align-items:center;
      justify-content:center; padding:20px; z-index:100;}
    .modal-card{background:#fff; border-radius:16px; padding:26px; width:100%; box-shadow:0 24px 48px rgba(0,0,0,.3);
      max-height:82vh; overflow-y:auto;}
    .combobox-wrap{position:relative;}
    .combobox-dropdown{position:absolute; top:calc(100% + 4px); left:0; right:0; background:#fff;
      border:1px solid var(--border); border-radius:10px; max-height:260px; overflow-y:auto; z-index:20;
      box-shadow:0 8px 20px rgba(0,0,0,.14);}
    .combobox-group-label{padding:8px 12px 4px; font-size:11px; font-weight:700; color:var(--sub);}
    .combobox-item{padding:9px 12px; font-size:14px; cursor:pointer;}
    .combobox-item:hover, .combobox-item.active{background:var(--surface);}
    @media (max-width:680px){ .bg-grid-2{grid-template-columns:1fr !important;} }
  `}</style>
);

/* ============================================================
   OnboardingPage (강아지/고양이 공용)
   ============================================================ */
function ChipGroup({ options, value, onChange, cols = 2, lang }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }} className="bg-grid-2">
      {options.map((opt) => (
        <button key={opt.id} type="button" className={`bg-chip ${value === opt.id ? "active" : ""}`}
          onClick={() => onChange(opt.id)}>
          {lang ? optionName(opt, lang) : opt.name}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   견종/묘종 검색 콤보박스 (클라이언트 사이드 검색 — API 키 불필요)
   ============================================================ */
function BreedCombobox({ breedGroups, allBreeds, species, value, onChange, invalid }) {
  const lang = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const otherLabel = t.otherLabel[species];
  const mixLabel = t.mixLabel[species];
  const customLabel = t.customLabel(otherLabel);

  const selectedBreed = allBreeds.find((b) => b.id === value);
  const selectedName = selectedBreed ? breedName(selectedBreed, lang)
    : value === "mix" ? mixLabel
    : value === "custom" ? customLabel
    : "";

  const q = query.trim().toLowerCase();
  const matchName = (b) => breedName(b, lang).toLowerCase().includes(q);
  const filteredGroups = q
    ? breedGroups.map((g) => ({ ...g, breeds: g.breeds.filter(matchName) })).filter((g) => g.breeds.length > 0)
    : breedGroups;
  const showMix = !q || mixLabel.toLowerCase().includes(q);
  const noResults = filteredGroups.every((g) => g.breeds.length === 0) && !showMix;

  const pick = (id) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="combobox-wrap">
      <input
        className={`bg-input ${invalid ? "invalid" : ""}`}
        value={open ? query : selectedName}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t.searchPlaceholder(otherLabel, t.searchExample[species])}
      />
      {open && (
        <div className="combobox-dropdown">
          {filteredGroups.map((g) => g.breeds.length > 0 && (
            <div key={g.size}>
              <div className="combobox-group-label">{groupLabel(g, lang)}</div>
              {g.breeds.map((b) => (
                <div key={b.id} className="combobox-item" onMouseDown={() => pick(b.id)}>{breedName(b, lang)}</div>
              ))}
            </div>
          ))}
          <div className="combobox-group-label">{t.otherGroupLabel}</div>
          {showMix && <div className="combobox-item" onMouseDown={() => pick("mix")}>{mixLabel}</div>}
          <div className="combobox-item" onMouseDown={() => pick("custom")}>{customLabel}</div>
          {noResults && <div className="bg-sub" style={{ padding: "10px 12px" }}>{t.noResultsText(customLabel)}</div>}
        </div>
      )}
    </div>
  );
}

function OnboardingPage({ species, breedGroups, sizeOptions, initialValues, onSubmit, onCancel }) {
  const lang = useLang();
  const t = useT();
  const isEdit = !!initialValues;
  const allBreeds = useMemo(() => breedGroups.flatMap((g) => g.breeds.map((b) => ({ ...b, size: g.size }))), [breedGroups]);
  const speciesLabel = t.speciesLabel[species];
  const adultWord = t.adultWord[species];
  const otherLabel = t.otherLabel[species];

  const [name, setName] = useState(initialValues?.name ?? t.defaultPetName[species]);
  const [breedId, setBreedId] = useState(initialValues?.breedId ?? allBreeds[0]?.id ?? "custom");
  const [customBreedName, setCustomBreedName] = useState(initialValues?.breedId === "custom" ? initialValues.breedName : "");
  const [sizeCategory, setSizeCategory] = useState(
    initialValues?.curveKey ? initialValues.curveKey.split("-")[1] : sizeOptions[0].id
  );
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  })());
  const [weight, setWeight] = useState(species === "cat" ? "0.6" : "1.1");
  const [gender, setGender] = useState(initialValues?.gender ?? "female");
  const [neutered, setNeutered] = useState(initialValues?.neutered ?? "no");
  const [bodyCondition, setBodyCondition] = useState(initialValues?.bodyCondition ?? "normal");

  const isMix = breedId === "mix";
  const isCustom = breedId === "custom";
  const selectedBreed = allBreeds.find((b) => b.id === breedId);
  const [errors, setErrors] = useState({});
  const [formAlert, setFormAlert] = useState("");

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = t.errName;
    if (!birthDate) next.birthDate = t.errBirthDate;
    if (!isEdit && !(Number(weight) > 0)) next.weight = t.errWeight;
    if (isCustom && !customBreedName.trim()) next.customBreedName = t.errCustomBreed(otherLabel);
    return next;
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormAlert(t.formAlertMissing);
      return;
    }
    setErrors({});
    setFormAlert("");
    let breedNameToStore, curveKey, avgAdultKg;
    if (isMix) {
      breedNameToStore = t.mixLabel[species].split(" (")[0];
      curveKey = `${species}-${sizeCategory}`;
      avgAdultKg = sizeOptions.find((s) => s.id === sizeCategory).avgAdultKg;
    } else if (isCustom) {
      breedNameToStore = customBreedName.trim();
      curveKey = `${species}-${sizeCategory}`;
      avgAdultKg = sizeOptions.find((s) => s.id === sizeCategory).avgAdultKg;
    } else {
      breedNameToStore = breedName(selectedBreed, lang);
      curveKey = `${species}-${selectedBreed.size}`;
      avgAdultKg = selectedBreed.avgAdultKg;
    }
    onSubmit({
      species,
      name: name.trim(),
      breedId,
      breedName: breedNameToStore,
      curveKey,
      avgAdultKg,
      birthDate,
      gender,
      neutered,
      bodyCondition,
      initialWeightKg: isEdit ? initialValues.initialWeightKg : Number(weight),
    });
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        {species === "cat"
          ? <CatIcon style={{ width: 28, height: 28, color: "var(--primary)" }} />
          : <PawIcon style={{ width: 28, height: 28, color: "var(--primary)" }} />}
        <h1 style={{ fontSize: 24 }}>{species === "cat" ? t.tabCat(0) : t.tabDog(0)}</h1>
      </div>
      <p className="bg-sub" style={{ marginBottom: 28 }}>
        {isEdit ? t.introEdit(name || speciesLabel) : t.introNew(speciesLabel, adultWord)}
      </p>

      {formAlert && (
        <div className="form-alert">
          <BellIcon style={{ width: 16, height: 16, color: "var(--primary)", marginTop: 1 }} />
          <span>{formAlert}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <label className="bg-label">{t.labelPetName(speciesLabel)}</label>
          <input className={`bg-input ${errors.name ? "invalid" : ""}`} value={name}
            onChange={(e) => setName(e.target.value)} placeholder={t.placeholderPetName[species]} />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>

        <div>
          <label className="bg-label">{t.labelBreedField(otherLabel)}</label>
          <BreedCombobox breedGroups={breedGroups} allBreeds={allBreeds} species={species} value={breedId} onChange={setBreedId} />

          {isCustom && (
            <div style={{ marginTop: 10 }}>
              <input className={`bg-input ${errors.customBreedName ? "invalid" : ""}`} value={customBreedName}
                onChange={(e) => setCustomBreedName(e.target.value)}
                placeholder={t.customBreedPlaceholder(otherLabel)} />
              {errors.customBreedName && <div className="field-error">{errors.customBreedName}</div>}
            </div>
          )}

          {(isMix || isCustom) && (
            <div style={{ marginTop: 10 }}>
              <label className="bg-label" style={{ fontWeight: 500, color: "var(--sub)" }}>
                {t.sizeCategoryPrompt}
              </label>
              <ChipGroup options={sizeOptions} value={sizeCategory} onChange={setSizeCategory} cols={1} lang={lang} />
            </div>
          )}
        </div>

        <div>
          <label className="bg-label">{t.labelBirthDate}</label>
          <input type="date" className={`bg-input ${errors.birthDate ? "invalid" : ""}`} value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)} />
          {errors.birthDate && <div className="field-error">{errors.birthDate}</div>}
        </div>

        {!isEdit && (
          <div>
            <label className="bg-label">{t.labelWeight}</label>
            <input type="number" step="0.1" min="0" className={`bg-input ${errors.weight ? "invalid" : ""}`} value={weight}
              onChange={(e) => setWeight(e.target.value)} placeholder={t.placeholderWeight[species]} />
            {errors.weight && <div className="field-error">{errors.weight}</div>}
          </div>
        )}

        <div>
          <label className="bg-label">{t.labelGender}</label>
          <ChipGroup options={[{ id: "female", name: t.genderFemale, nameEn: t.genderFemale }, { id: "male", name: t.genderMale, nameEn: t.genderMale }]}
            value={gender} onChange={setGender} lang={lang} />
        </div>

        <div>
          <label className="bg-label">{t.labelNeutered}</label>
          <ChipGroup options={[{ id: "no", name: t.neuteredNo, nameEn: t.neuteredNo }, { id: "yes", name: t.neuteredYes, nameEn: t.neuteredYes }]}
            value={neutered} onChange={setNeutered} lang={lang} />
        </div>

        <div>
          <label className="bg-label">{t.labelBodyCondition}</label>
          <ChipGroup options={BODY_CONDITIONS} value={bodyCondition} onChange={setBodyCondition} cols={3} lang={lang} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {onCancel && (
            <button className="bg-btn bg-btn-ghost" style={{ flex: "0 0 auto" }} onClick={onCancel}>{t.cancel}</button>
          )}
          <button className="bg-btn" style={{ flex: 1, fontSize: 16, padding: "14px 20px" }} onClick={handleSubmit}>
            {isEdit ? t.submitEdit : t.submitNew(adultWord)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ResultPage 하위 컴포넌트
   ============================================================ */
function AdultWeightHero({ profile, estimate, ageMonths, breedDisplayName }) {
  const t = useT();
  const range = predictionRange(estimate);
  const adultWord = t.adultWord[profile.species];
  const ageText = ageMonths < 1 ? t.ageUnder1Month : t.ageAbout(Math.round(ageMonths));
  return (
    <div className="bg-surface-card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div className="bg-sub" style={{ marginBottom: 6 }}>
        {t.heroAgeLabel(breedDisplayName, ageText)}
      </div>
      <h2 style={{ fontSize: 15, color: "var(--sub)", fontWeight: 700, marginBottom: 10 }}>{t.heroLabel(adultWord)}</h2>
      <div style={{ fontSize: 40, fontWeight: 800, color: "var(--primary)", lineHeight: 1.1 }}>
        {fmtKg(range.low)} ~ {fmtKg(range.high)}
      </div>
      <div className="bg-sub" style={{ marginTop: 10, fontSize: 14 }}>
        {t.heroLikelyPrefix} <strong style={{ color: "var(--text)" }}>{fmtKg(range.likelyLow)}~{fmtKg(range.likelyHigh)}</strong>
      </div>
      <div className="bg-sub" style={{ marginTop: 14, fontSize: 12 }}>
        {t.heroDisclaimer}
      </div>
    </div>
  );
}

function GrowthChartCard({ table, ageMonths, currentWeightKg }) {
  const t = useT();
  const data = table.map((r) => ({ month: r.month, weight: r.weight }));
  const currentPoint = { month: Math.round(ageMonths * 10) / 10, weight: currentWeightKg };
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ChartIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.chartTitle}</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#E9E9E7" vertical={false} />
          <XAxis dataKey="month" type="number" domain={[0, 24]} tick={{ fontSize: 12, fill: "#787774" }} tickFormatter={(m) => t.monthLabel(m)}
            stroke="#E9E9E7" />
          <YAxis tick={{ fontSize: 12, fill: "#787774" }} stroke="#E9E9E7" width={40} tickFormatter={(v) => `${v}kg`} />
          <Tooltip formatter={(v) => [`${v}kg`, t.tooltipWeight]} labelFormatter={(m) => t.monthLabelAge(m)}
            contentStyle={{ borderRadius: 10, border: "1px solid #E9E9E7", fontSize: 13 }} />
          <Line type="monotone" dataKey="weight" stroke="#2383E2" strokeWidth={2.5} dot={{ r: 3, fill: "#2383E2" }} />
          <ReferenceDot x={currentPoint.month} y={currentPoint.weight} r={6} fill="#191919" stroke="#fff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <div className="bg-sub" style={{ fontSize: 12, marginTop: 4 }}>{t.chartLegend}</div>
    </div>
  );
}

function GrowthTableCard({ table }) {
  const t = useT();
  return (
    <div className="bg-card">
      <h3 style={{ fontSize: 16, marginBottom: 14 }}>{t.tableTitle}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {table.map((r) => (
          <div key={r.month} style={{
            flex: "1 1 70px", textAlign: "center", padding: "10px 6px", borderRadius: 10,
            background: r.isCurrent ? "var(--primary)" : "var(--surface)",
            color: r.isCurrent ? "#fff" : "var(--text)",
          }}>
            <div style={{ fontSize: 11, opacity: .85 }}>{t.monthLabel(r.month)}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{r.weight}kg</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   성장 기록 저장 + 자동 비교 코멘트
   ============================================================ */
function diffLabel(diffGrams, t) {
  if (diffGrams > 20) return { text: t.diffUp(diffGrams), tone: "up" };
  if (diffGrams < -20) return { text: t.diffDown(Math.abs(diffGrams)), tone: "down" };
  return { text: t.diffFlat, tone: "flat" };
}

function RecordForm({ onAdd }) {
  const t = useT();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!date) { setError(t.recordErrDate); return; }
    const w = Number(weight);
    if (!(w > 0)) { setError(t.recordErrWeight); return; }
    setError("");
    onAdd(date, w);
    setWeight("");
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 140px" }}>
        <label className="bg-label">{t.recordDateLabel}</label>
        <input type="date" className="bg-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={{ flex: "1 1 100px" }}>
        <label className="bg-label">{t.recordWeightLabel}</label>
        <input type="number" step="0.01" min="0" className="bg-input" value={weight}
          onChange={(e) => setWeight(e.target.value)} placeholder="1.45" />
      </div>
      <button className="bg-btn" style={{ height: 42 }} onClick={submit}>
        {t.recordAddBtn}
      </button>
      {error && <div className="field-error" style={{ flexBasis: "100%" }}>{error}</div>}
    </div>
  );
}

function RecordList({ records }) {
  const t = useT();
  const rows = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {rows.map((r) => {
        const label = r.diffGrams === undefined ? null : diffLabel(r.diffGrams, t);
        return (
          <div key={r.id} className="bg-surface-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.date}</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{r.weightKg}kg</span>
            </div>
            {label ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: label.tone === "up" ? "var(--primary)" : "var(--text)" }}>
                {label.text}
              </div>
            ) : (
              <div className="bg-sub" style={{ marginTop: 6, fontSize: 13 }}>{t.recordFirst}</div>
            )}
            {r.prevEstimateKg !== undefined && (
              <div className="bg-sub" style={{ marginTop: 3, fontSize: 12 }}>
                {t.recordUpdated(r.prevEstimateKg.toFixed(1), r.newEstimateKg.toFixed(1))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordSection({ records, onAddRecord }) {
  const t = useT();
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <CalendarIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.recordTitle}</h3>
      </div>
      <RecordForm onAdd={onAddRecord} />
      <RecordList records={records} />
    </div>
  );
}

/* ============================================================
   또래 비교
   ============================================================ */
function estimatePercentile(ratio) {
  const raw = 50 + (ratio - 1) * 180;
  return Math.min(97, Math.max(3, Math.round(raw)));
}
function percentileDescKey(percentile) {
  if (percentile <= 15) return "muchBelow";
  if (percentile <= 35) return "below";
  if (percentile <= 64) return "similar";
  if (percentile <= 84) return "above";
  return "muchAbove";
}

function PeerCompareCard({ profile, latestWeightKg, ageAtLatest }) {
  const t = useT();
  const avgWeightAtAge = curveValueAt(profile.curveKey, ageAtLatest) * profile.avgAdultKg;
  const ratio = avgWeightAtAge > 0 ? latestWeightKg / avgWeightAtAge : 1;
  const percentile = estimatePercentile(ratio);
  const isBelow = percentile <= 50;
  const speciesLabel = t.speciesLabel[profile.species];

  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <ScaleIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.peerTitle(speciesLabel)}</h3>
      </div>
      <p className="bg-sub" style={{ marginBottom: 14, fontSize: 13 }}>
        {t.peerSubtitle(speciesLabel)}
      </p>
      <div className="bg-surface-card" style={{ textAlign: "center", padding: "18px 12px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
          {isBelow ? t.peerBelow(percentile) : t.peerAbove(100 - percentile)}
        </div>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>{t.peerDesc[percentileDescKey(percentile)]}</div>
      </div>
      <div className="bg-sub" style={{ marginTop: 10, fontSize: 12 }}>
        {t.peerFootnote}
      </div>
    </div>
  );
}

/* ============================================================
   성장앨범 (언제든지 촬영일과 함께 추가/수정/삭제)
   ============================================================ */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AddPhotoCard({ onAdd }) {
  const t = useT();
  const inputRef = useRef(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState("");

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  };

  const handleAdd = async () => {
    if (!date) { setError(t.photoErrDate); return; }
    if (!pendingFile) { setError(t.photoErrPhoto); return; }
    setError("");
    const dataUrl = await fileToDataUrl(pendingFile);
    onAdd(date, dataUrl);
    setPendingFile(null);
  };

  return (
    <div className="bg-surface-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 140px" }}>
        <label className="bg-label">{t.photoDateLabel}</label>
        <input type="date" className="bg-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={{ flex: "1 1 160px" }}>
        <label className="bg-label">{t.photoLabel}</label>
        <button type="button" className="bg-btn bg-btn-ghost" style={{ width: "100%", textAlign: "center" }}
          onClick={() => inputRef.current && inputRef.current.click()}>
          {pendingFile ? pendingFile.name.slice(0, 16) : t.photoPickBtn}
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePick} />
      </div>
      <button className="bg-btn" style={{ height: 42 }} onClick={handleAdd}>
        {t.photoAddBtn}
      </button>
      {error && <div className="field-error" style={{ flexBasis: "100%" }}>{error}</div>}
    </div>
  );
}

function PhotoTile({ photo, birthDate, onEdit, onDelete, onOpenSlideshow }) {
  const t = useT();
  const inputRef = useRef(null);
  const handleChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onEdit(photo.id, dataUrl);
    e.target.value = "";
  };
  const months = monthsBetween(new Date(birthDate), new Date(photo.date));
  const ageText = months < 1 ? t.ageUnder1Month : t.ageAbout(Math.round(months));

  return (
    <div className="photo-tile" onClick={onOpenSlideshow}>
      <img src={photo.dataUrl} alt={photo.date} />
      <span className="tile-label">{photo.date} · {ageText}</span>
      <div className="tile-actions">
        <button type="button" className="tile-btn" aria-label={t.photoEditAria}
          onClick={(e) => { e.stopPropagation(); inputRef.current && inputRef.current.click(); }}>
          <EditIcon />
        </button>
        <button type="button" className="tile-btn" aria-label={t.photoDeleteAria}
          onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}>
          <TrashIcon />
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
    </div>
  );
}

/* ============================================================
   성장앨범 슬라이드쇼 (전체화면 넘겨보기)
   ============================================================ */
function SlideshowModal({ open, photos, birthDate, startIndex, onClose }) {
  const t = useT();
  const [index, setIndex] = useState(startIndex || 0);

  useEffect(() => { if (open) setIndex(startIndex || 0); }, [open, startIndex]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length, onClose]);

  if (!open || photos.length === 0) return null;
  const photo = photos[index];
  const months = monthsBetween(new Date(birthDate), new Date(photo.date));
  const ageText = months < 1 ? t.ageUnder1Month : t.ageAbout(Math.round(months));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="slideshow-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="slideshow-close" onClick={onClose} aria-label={t.cancel}>✕</button>
        <div className="slideshow-image-wrap">
          <img src={photo.dataUrl} alt={photo.date} />
          {index > 0 && (
            <button type="button" className="slideshow-nav slideshow-prev" onClick={() => setIndex(index - 1)} aria-label="prev">‹</button>
          )}
          {index < photos.length - 1 && (
            <button type="button" className="slideshow-nav slideshow-next" onClick={() => setIndex(index + 1)} aria-label="next">›</button>
          )}
        </div>
        <div className="slideshow-caption">
          <span>{photo.date} · {ageText}</span>
          <span className="bg-sub">{index + 1} / {photos.length}</span>
        </div>
      </div>
    </div>
  );
}

function PhotoAlbum({ birthDate, photos, onAdd, onEdit, onDelete }) {
  const t = useT();
  const sorted = useMemo(() => [...photos].sort((a, b) => new Date(a.date) - new Date(b.date)), [photos]);
  const [slideshow, setSlideshow] = useState(null); // index | null

  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CameraIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
          <h3 style={{ fontSize: 16 }}>{t.albumTitle}</h3>
        </div>
        {sorted.length > 0 && (
          <button type="button" className="bg-btn bg-btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }}
            onClick={() => setSlideshow(0)}>
            {t.slideshowBtn}
          </button>
        )}
      </div>
      <p className="bg-sub" style={{ marginBottom: 14, fontSize: 13 }}>
        {t.albumSubtitle}
      </p>
      <AddPhotoCard onAdd={onAdd} />
      {sorted.length > 0 ? (
        <div className="photo-grid" style={{ marginTop: 14 }}>
          {sorted.map((photo, i) => (
            <PhotoTile key={photo.id} photo={photo} birthDate={birthDate} onEdit={onEdit} onDelete={onDelete}
              onOpenSlideshow={() => setSlideshow(i)} />
          ))}
        </div>
      ) : (
        <div className="bg-sub" style={{ marginTop: 14, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
          {t.albumEmpty}
        </div>
      )}
      <SlideshowModal open={slideshow !== null} photos={sorted} birthDate={birthDate} startIndex={slideshow} onClose={() => setSlideshow(null)} />
    </div>
  );
}

/* ============================================================
   참고 정보 — 사료급여 / 나이환산 / D-day / 예방접종 / 사이즈
   ============================================================ */
function calcFeedingKcal(species, weightKg, ageMonths) {
  const rer = 70 * Math.pow(weightKg, 0.75);
  const factor = species === "cat"
    ? (ageMonths < 4 ? 2.5 : ageMonths < 12 ? 2.0 : 1.4)
    : (ageMonths < 4 ? 3.0 : ageMonths < 12 ? 2.5 : 2.0);
  return { low: Math.round(rer * factor * 0.9), high: Math.round(rer * factor * 1.1) };
}
function calcHumanAge(ageYears) {
  if (ageYears < 1) return null;
  if (ageYears < 2) return Math.round(15 + (ageYears - 1) * 9);
  return Math.round(24 + (ageYears - 2) * 4);
}
function nextBirthdayDday(birthDate, today) {
  const b = new Date(birthDate);
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
  const days = Math.round((next - today) / (1000 * 60 * 60 * 24));
  return days;
}
function vaccineStageIndex(ageMonths) {
  if (ageMonths < 2) return 0;
  if (ageMonths < 4) return 1;
  if (ageMonths < 6) return 2;
  if (ageMonths < 12) return 3;
  return 4;
}
function clothingSize(weightKg) {
  const table = [
    { max: 2, size: "XXS", neck: "18~20cm", chest: "24~28cm" },
    { max: 4, size: "XS", neck: "20~24cm", chest: "28~34cm" },
    { max: 6, size: "S", neck: "24~28cm", chest: "34~40cm" },
    { max: 9, size: "M", neck: "28~32cm", chest: "40~46cm" },
    { max: 15, size: "L", neck: "32~38cm", chest: "46~54cm" },
    { max: 25, size: "XL", neck: "38~45cm", chest: "54~64cm" },
    { max: Infinity, size: "XXL", neck: "45cm~", chest: "64cm~" },
  ];
  return table.find((tb) => weightKg <= tb.max);
}

function InfoAccordion({ profile, latestWeightKg, ageAtLatest }) {
  const lang = useLang();
  const t = useT();
  const feeding = calcFeedingKcal(profile.species, latestWeightKg, ageAtLatest);
  const ageYears = ageAtLatest / 12;
  const humanAge = calcHumanAge(ageYears);
  const dday = nextBirthdayDday(profile.birthDate, new Date());
  const vaccine = t.vaccineText[profile.species][vaccineStageIndex(ageAtLatest)];
  const clothing = clothingSize(latestWeightKg);
  const bodyConditionOpt = BODY_CONDITIONS.find((b) => b.id === profile.bodyCondition);
  const bodyLabel = bodyConditionOpt ? optionName(bodyConditionOpt, lang) : "";

  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <InfoIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.infoTitle}</h3>
      </div>

      <details className="bg-accordion" open>
        <summary><span style={{ display: "flex", alignItems: "center", gap: 8 }}><BowlIcon style={{ width: 16, height: 16 }} />{t.feedingTitle}</span></summary>
        <div className="acc-body">
          {t.feedingBody(feeding.low, feeding.high, bodyLabel)}
        </div>
      </details>

      <details className="bg-accordion">
        <summary>{t.humanAgeTitle}</summary>
        <div className="acc-body">
          {humanAge ? t.humanAgeWithAge(humanAge) : t.humanAgeNoAge}
          <div className="bg-sub" style={{ marginTop: 6 }}>{t.humanAgeNote}</div>
        </div>
      </details>

      <details className="bg-accordion">
        <summary>{t.ddayTitle}</summary>
        <div className="acc-body">
          {t.ddayBody(dday)}
        </div>
      </details>

      <details className="bg-accordion">
        <summary><span style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldIcon style={{ width: 16, height: 16 }} />{t.vaccineTitle}</span></summary>
        <div className="acc-body">
          {vaccine}
          <div className="bg-sub" style={{ marginTop: 6 }}>{t.vaccineNote}</div>
        </div>
      </details>

      <details className="bg-accordion">
        <summary>{t.sizeTitle[profile.species]}</summary>
        <div className="acc-body">
          {t.sizeBody(clothing.size, clothing.neck, clothing.chest)}
          <div className="bg-sub" style={{ marginTop: 6 }}>{t.sizeNote}</div>
        </div>
      </details>
    </div>
  );
}

/* ============================================================
   여러 마리 관리 — 탭 + 펫 스위처 + 언어 토글
   ============================================================ */
function SpeciesTabBar({ species, onChange, dogCount, catCount }) {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className={`bg-chip ${species === "dog" ? "active" : ""}`}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        onClick={() => onChange("dog")}>
        <PawIcon style={{ width: 16, height: 16 }} /> {t.tabDog(dogCount)}
      </button>
      <button className={`bg-chip ${species === "cat" ? "active" : ""}`}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        onClick={() => onChange("cat")}>
        <CatIcon style={{ width: 16, height: 16 }} /> {t.tabCat(catCount)}
      </button>
    </div>
  );
}

function LangToggle({ lang, onChange }) {
  return (
    <div className="lang-toggle">
      <button type="button" className={lang === "ko" ? "active" : ""} onClick={() => onChange("ko")}>KO</button>
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

function PetSwitcher({ species, pets, activePetId, onSelect, onAddNew }) {
  const t = useT();
  return (
    <div className="pet-switcher">
      {pets.map((p) => (
        <button key={p.id} className={`bg-chip ${p.id === activePetId ? "active" : ""}`} onClick={() => onSelect(p.id)}>
          {p.profile.name}
        </button>
      ))}
      {pets.length < 10 ? (
        <button className="bg-chip" style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={onAddNew}>
          <PlusIcon style={{ width: 14, height: 14 }} /> {t.addPetLabel[species]}
        </button>
      ) : (
        <span className="bg-sub" style={{ alignSelf: "center", fontSize: 12 }}>{t.maxPetsReached}</span>
      )}
    </div>
  );
}

/* ============================================================
   ResultPage
   ============================================================ */
function ResultPage({ pet, breedGroups, onAddRecord, onAddPhoto, onEditPhoto, onDeletePhoto, onEdit, onDelete }) {
  const lang = useLang();
  const t = useT();
  const { profile, records, photos } = pet;
  const [now] = useState(() => new Date());
  const ageMonthsNow = monthsBetween(new Date(profile.birthDate), now);
  const allBreedsFlat = useMemo(() => breedGroups.flatMap((g) => g.breeds), [breedGroups]);
  const breedDisplayName = getBreedDisplayName(profile, allBreedsFlat, lang);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [records]
  );
  const latest = sortedRecords[sortedRecords.length - 1] || {
    id: "fallback",
    date: new Date().toISOString().slice(0, 10),
    weightKg: profile.initialWeightKg,
  };
  const ageAtLatest = monthsBetween(new Date(profile.birthDate), new Date(latest.date));
  const estimate = estimateAdultWeight(latest.weightKg, ageAtLatest, profile.curveKey);
  const table = useMemo(
    () => buildGrowthTable(estimate, profile.curveKey, ageAtLatest),
    [estimate, profile.curveKey, ageAtLatest]
  );

  const handleAddRecord = (dateStr, weightKg) => {
    const newAgeMonths = monthsBetween(new Date(profile.birthDate), new Date(dateStr));
    const predictedAtNewAge = curveValueAt(profile.curveKey, newAgeMonths) * estimate;
    const diffGrams = Math.round((weightKg - predictedAtNewAge) * 1000);
    const newEstimate = estimateAdultWeight(weightKg, newAgeMonths, profile.curveKey);
    onAddRecord({
      id: `${Date.now()}`,
      date: dateStr,
      weightKg,
      diffGrams,
      prevEstimateKg: estimate,
      newEstimateKg: newEstimate,
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {profile.species === "cat"
            ? <CatIcon style={{ width: 22, height: 22, color: "var(--primary)" }} />
            : <PawIcon style={{ width: 22, height: 22, color: "var(--primary)" }} />}
          <h1 style={{ fontSize: 18 }}>{t.reportTitle(profile.name)}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bg-btn bg-btn-ghost" onClick={onEdit}>{t.editBtn}</button>
          <button className="bg-btn bg-btn-ghost" onClick={onDelete}>{t.deleteBtn}</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <AdultWeightHero profile={profile} estimate={estimate} ageMonths={ageMonthsNow} breedDisplayName={breedDisplayName} />
        <GrowthChartCard table={table} ageMonths={ageAtLatest} currentWeightKg={latest.weightKg} />
        <GrowthTableCard table={table} />
        <RecordSection records={sortedRecords} onAddRecord={handleAddRecord} />
        <PeerCompareCard profile={profile} latestWeightKg={latest.weightKg} ageAtLatest={ageAtLatest} />
        <PhotoAlbum birthDate={profile.birthDate} photos={photos} onAdd={onAddPhoto} onEdit={onEditPhoto} onDelete={onDeletePhoto} />
        <InfoAccordion profile={profile} latestWeightKg={latest.weightKg} ageAtLatest={ageAtLatest} />

        <div className="bg-surface-card" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <InfoIcon style={{ width: 18, height: 18, color: "var(--sub)", marginTop: 1 }} />
          <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {t.footerNote1} <strong style={{ color: "var(--text)" }}>{t.footerNoteStrong}</strong>{t.footerNote2}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   App
   ============================================================ */
/* ============================================================
   랜딩 페이지 (첫 화면) — PetGrow 브랜드, 앱(멍그로우/냥그로우)으로 진입하는 홈
   ============================================================ */
/* ============================================================
   랜딩페이지용 미니 프리뷰 카드 (실제 앱 화면을 축소한 모형 — 큰 이미지 대체용)
   ============================================================ */
function MiniPredictionCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-label">성장 계산 결과</div>
      <div className="mock-card-value">5.2<span style={{ fontSize: 16 }}>kg</span></div>
      <div className="mock-card-sub">예측 성체 체중 (±0.4kg)</div>
      <svg className="mock-sparkline" viewBox="0 0 260 70" width="100%" height="70">
        <polyline points="0,58 40,50 80,40 120,34 160,24 200,16 240,10" fill="none" stroke="#7fa66b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="240" cy="10" r="5" fill="#7fa66b" />
        <circle cx="120" cy="34" r="4" fill="#33383a" />
      </svg>
    </div>
  );
}
function MiniAlbumCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-label">성장앨범</div>
      <div className="mock-photos">
        <div className="mock-photo"><PawIcon style={{ width: 22, height: 22, color: "#7fa66b" }} /></div>
        <div className="mock-photo mock-photo-alt"><CatIcon style={{ width: 22, height: 22, color: "#33383a" }} /></div>
        <div className="mock-photo"><CameraIcon style={{ width: 20, height: 20, color: "#7fa66b" }} /></div>
      </div>
      <div className="mock-photo-caption">2026-03-02 · 약 3개월</div>
    </div>
  );
}
function MiniGuideCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-label">참고 정보</div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><BowlIcon style={{ width: 16, height: 16, color: "#7fa66b" }} /></div>
        <div className="mock-checklist-text">사료 급여량 참고</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ShieldIcon style={{ width: 16, height: 16, color: "#7fa66b" }} /></div>
        <div className="mock-checklist-text">예방접종·건강관리</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ScaleIcon style={{ width: 16, height: 16, color: "#7fa66b" }} /></div>
        <div className="mock-checklist-text">또래 대비 체중 비교</div>
      </div>
    </div>
  );
}

function LandingPage({ onEnter }) {
  const t = useT();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <div className="bboggl-root landing-root">
      <section className="landing-section landing-hero-section">
        <div className="landing-wrap">
          <div className="landing-logo-badge">
            <PetGrowMark style={{ width: 78, height: 78 }} />
          </div>
          <div className="landing-wordmark"><span className="pet">Pet</span><span className="grow">Grow</span></div>
          <div className="landing-tagline">{t.landingTagline}</div>

          <h1 className="landing-headline">
            {t.landingHeadline1} <span className="hl">{t.landingHeadlineHighlight}</span>{t.landingHeadline2}
          </h1>
          <p className="landing-subtitle">{t.landingSubtitle}</p>
          <button className="landing-cta" onClick={onEnter}>{t.landingCta}</button>

          <div className="landing-illustration">
            <div className="paw-badge"><PawIcon style={{ width: 60, height: 60, color: "#3a3a3a" }} /></div>
            <div className="cat-badge"><CatIcon style={{ width: 60, height: 60, color: "#7fa66b" }} /></div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-about">
            <div className="landing-about-icon">
              <PetGrowMark style={{ width: 52, height: 52 }} />
            </div>
            <h2 className="landing-section-title" style={{ marginBottom: 0 }}>{t.landingAboutTitle}</h2>
            <p className="landing-about-text">{t.landingAboutBody}</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <h2 className="landing-section-title">{t.landingHowTitle}</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <div className="landing-step-title">{t.landingStep1Title}</div>
              <div className="landing-step-desc">{t.landingStep1Desc}</div>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <div className="landing-step-title">{t.landingStep2Title}</div>
              <div className="landing-step-desc">{t.landingStep2Desc}</div>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <div className="landing-step-title">{t.landingStep3Title}</div>
              <div className="landing-step-desc">{t.landingStep3Desc}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title">{t.landingFeaturesTitle}</h2>
          <div className="landing-showcase">
            <div className="landing-showcase-row">
              <div className="landing-showcase-media"><MiniPredictionCard /></div>
              <div className="landing-showcase-text">
                <div className="landing-showcase-title">{t.landingFeature1Title}</div>
                <p className="landing-showcase-desc">{t.landingFeature1Desc}</p>
              </div>
            </div>
            <div className="landing-showcase-row reverse">
              <div className="landing-showcase-media"><MiniAlbumCard /></div>
              <div className="landing-showcase-text">
                <div className="landing-showcase-title">{t.landingFeature2Title}</div>
                <p className="landing-showcase-desc">{t.landingFeature2Desc}</p>
              </div>
            </div>
            <div className="landing-showcase-row">
              <div className="landing-showcase-media"><MiniGuideCard /></div>
              <div className="landing-showcase-text">
                <div className="landing-showcase-title">{t.landingFeature3Title}</div>
                <p className="landing-showcase-desc">{t.landingFeature3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title">{t.landingPricingTitle}</h2>
          <div className="landing-pricing">
            <div className="landing-pricing-card">
              <div className="landing-pricing-name">{t.landingTierTrialName}</div>
              <div className="landing-pricing-price">{t.landingTierTrialPrice}</div>
              <ul className="landing-pricing-list">
                <li>{t.landingTierTrial1}</li>
                <li>{t.landingTierTrial2}</li>
                <li>{t.landingTierTrial3}</li>
              </ul>
            </div>
            <div className="landing-pricing-card landing-pricing-highlight">
              <div className="landing-pricing-name">{t.landingTierMemberName}</div>
              <div className="landing-pricing-price">{t.landingTierMemberPrice}</div>
              <ul className="landing-pricing-list">
                <li>{t.landingTierMember1}</li>
                <li>{t.landingTierMember2}</li>
                <li>{t.landingTierMember3}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-trust">
            <span className="landing-trust-item"><ShieldIcon style={{ width: 14, height: 14 }} />{t.landingTrust1}</span>
            <span className="landing-trust-item"><PlusIcon style={{ width: 14, height: 14 }} />{t.landingTrust2}</span>
            <span className="landing-trust-item"><LeafIcon style={{ width: 14, height: 14 }} />{t.landingTrust3}</span>
            <span className="landing-trust-item"><InfoIcon style={{ width: 14, height: 14 }} />{t.landingTrust4}</span>
          </div>
          <button className="landing-cta" style={{ marginTop: 32 }} onClick={onEnter}>{t.landingCta}</button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap" style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <PetGrowMark style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>
              <span style={{ color: "#fff" }}>Pet</span><span style={{ color: "#9dc088" }}>Grow</span>
            </span>
          </div>
          <div className="landing-footer-text">
            © {new Date().getFullYear()} PetGrow · petgrow.co.kr<br />{t.landingTagline}
            <br />
            <button type="button" onClick={() => setPrivacyOpen(true)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,.75)", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 6, padding: 0, textDecoration: "underline" }}>
              {t.privacyFooterLink}
            </button>
          </div>
        </div>
      </footer>
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

function AppInner({ lang, setLang }) {
  const t = useT();
  const [species, setSpecies] = useState("dog");
  const [pets, setPets] = useState({ dog: [], cat: [] });
  const [activeId, setActiveId] = useState({ dog: null, cat: null });
  const [mode, setMode] = useState("view"); // 'view' | 'onboarding' | 'edit'
  const [loaded, setLoaded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} | null
  const [pushStatus, setPushStatus] = useState(null);

  const handleEnablePush = async () => {
    if (typeof Notification === "undefined") { setPushStatus("unsupported"); return; }
    try {
      const perm = await Notification.requestPermission();
      setPushStatus(perm === "granted" ? "granted" : "denied");
    } catch {
      setPushStatus("unsupported");
    }
  };

  useEffect(() => {
    (async () => {
      const dogsKey = "bboggl:dogs";
      const catsKey = "bboggl:cats";
      const activesKey = "bboggl:activeIds";

      let dogs = await safeGet(dogsKey);
      let cats = await safeGet(catsKey);
      const actives = await safeGet(activesKey);

      // 예전(계정별 저장) 버전에서 남겨둔 체험용 데이터가 있으면 가져와요
      if (!dogs || dogs.length === 0) {
        const guestDogs = await safeGet("bboggl:dogs:guest");
        if (guestDogs && guestDogs.length > 0) { dogs = guestDogs; safeSet(dogsKey, dogs); }
      }
      if (!cats || cats.length === 0) {
        const guestCats = await safeGet("bboggl:cats:guest");
        if (guestCats && guestCats.length > 0) { cats = guestCats; safeSet(catsKey, cats); }
      }
      // 더 이전(단일 반려동물) 버전 데이터도 함께 확인해요
      if (!dogs || dogs.length === 0) {
        const legacyProfile = await safeGet("bboggl:profile");
        if (legacyProfile) {
          const legacyRecords = (await safeGet("bboggl:records")) || [{
            id: "initial", date: new Date().toISOString().slice(0, 10), weightKg: legacyProfile.initialWeightKg,
          }];
          const legacyPhotos = (await safeGet("bboggl:photos")) || {};
          dogs = [{
            id: "dog-legacy",
            profile: { ...legacyProfile, species: "dog" },
            records: legacyRecords,
            photos: normalizePhotos(legacyPhotos, legacyProfile.birthDate),
          }];
          safeSet(dogsKey, dogs);
        }
      }

      dogs = (dogs || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));
      cats = (cats || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));

      setPets({ dog: dogs, cat: cats });
      setActiveId({
        dog: (actives && actives.dog) || (dogs[0] && dogs[0].id) || null,
        cat: (actives && actives.cat) || (cats[0] && cats[0].id) || null,
      });
      setLoaded(true);
    })();
  }, []);

  const persistPets = (next) => {
    setPets(next);
    safeSet("bboggl:dogs", next.dog);
    safeSet("bboggl:cats", next.cat);
  };
  const persistActive = (next) => {
    setActiveId(next);
    safeSet("bboggl:activeIds", next);
  };

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  };

  const currentList = pets[species];
  const currentPet = currentList.find((p) => p.id === activeId[species]) || null;

  const handleAddPet = (profileData) => {
    const isFirstEver = pets.dog.length + pets.cat.length === 0;
    const newPet = {
      id: `${species}-${Date.now()}`,
      profile: profileData,
      records: [{ id: "initial", date: new Date().toISOString().slice(0, 10), weightKg: profileData.initialWeightKg }],
      photos: [],
    };
    const nextList = [...currentList, newPet];
    persistPets({ ...pets, [species]: nextList });
    persistActive({ ...activeId, [species]: newPet.id });
    setMode("view");
    scrollToTop();
    if (isFirstEver) {
      setGuideOpen(true);
      safeSet("bboggl:guideSeen", true);
    }
  };

  const handleEditProfile = (profileData) => {
    const nextList = currentList.map((p) => (p.id === currentPet.id ? { ...p, profile: profileData } : p));
    persistPets({ ...pets, [species]: nextList });
    setMode("view");
    scrollToTop();
  };

  const requestDeletePet = () => {
    if (!currentPet) return;
    setDeleteTarget({ id: currentPet.id, name: currentPet.profile.name });
  };
  const confirmDeletePet = () => {
    if (!deleteTarget) return;
    const nextList = currentList.filter((p) => p.id !== deleteTarget.id);
    persistPets({ ...pets, [species]: nextList });
    persistActive({ ...activeId, [species]: nextList[0] ? nextList[0].id : null });
    setDeleteTarget(null);
  };

  const updateCurrentPet = (updater) => {
    const nextList = currentList.map((p) => (p.id === currentPet.id ? updater(p) : p));
    persistPets({ ...pets, [species]: nextList });
  };

  const handleAddRecord = (record) => updateCurrentPet((p) => ({ ...p, records: [...p.records, record] }));
  const handleAddPhoto = (date, dataUrl) => updateCurrentPet((p) => ({
    ...p, photos: [...p.photos, { id: `${Date.now()}`, date, dataUrl }],
  }));
  const handleEditPhoto = (photoId, dataUrl) => updateCurrentPet((p) => ({
    ...p, photos: p.photos.map((ph) => (ph.id === photoId ? { ...ph, dataUrl } : ph)),
  }));
  const handleDeletePhoto = (photoId) => updateCurrentPet((p) => ({
    ...p, photos: p.photos.filter((ph) => ph.id !== photoId),
  }));

  if (!loaded) return <div className="bboggl-root" style={{ minHeight: 300 }} />;

  const breedGroups = species === "dog" ? DOG_BREED_GROUPS : CAT_BREED_GROUPS;
  const sizeOptions = species === "dog" ? DOG_SIZE_OPTIONS : CAT_SIZE_OPTIONS;
  const showOnboarding = mode === "onboarding" || mode === "edit" || (mode === "view" && !currentPet);
  const notifications = computeNotifications(pets.dog, pets.cat, new Date(), t);
  const handleSelectNotification = (n) => {
    setSpecies(n.species);
    persistActive({ ...activeId, [n.species]: n.petId });
    setMode("view");
    scrollToTop();
  };

  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PetGrowMark style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 15, fontWeight: 800 }}>
              <span style={{ color: "#33383a" }}>Pet</span><span style={{ color: "#7fa66b" }}>Grow</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <NotificationBell items={notifications} onSelect={handleSelectNotification}
              onEnablePush={handleEnablePush} pushStatus={pushStatus} />
            <LangToggle lang={lang} onChange={setLang} />
            <button type="button" className="icon-btn" aria-label={t.helpAria}
              onClick={() => setGuideOpen(true)}>
              <HelpIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
            </button>
          </div>
        </div>
        <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}
          onChange={(s) => { setSpecies(s); setMode("view"); }} />
      </div>

      {showOnboarding ? (
        <OnboardingPage
          species={species}
          breedGroups={breedGroups} sizeOptions={sizeOptions}
          initialValues={mode === "edit" ? currentPet.profile : null}
          onSubmit={mode === "edit" ? handleEditProfile : handleAddPet}
          onCancel={currentPet ? () => setMode("view") : null}
        />
      ) : (
        <>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>
            <PetSwitcher species={species} pets={currentList} activePetId={currentPet.id}
              onSelect={(id) => { persistActive({ ...activeId, [species]: id }); scrollToTop(); }}
              onAddNew={() => setMode("onboarding")} />
          </div>
          <ResultPage
            pet={currentPet}
            breedGroups={breedGroups}
            onAddRecord={handleAddRecord}
            onAddPhoto={handleAddPhoto}
            onEditPhoto={handleEditPhoto}
            onDeletePhoto={handleDeletePhoto}
            onEdit={() => setMode("edit")}
            onDelete={requestDeletePet}
          />
        </>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 40px" }}>
        <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
          {t.privacyFooter}
        </div>
      </div>

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ConfirmModal
        open={!!deleteTarget}
        title={t.confirmDeleteTitle}
        message={deleteTarget ? t.confirmDeleteMsg(deleteTarget.name) : ""}
        confirmLabel={t.confirmDeleteBtn}
        onConfirm={confirmDeletePet}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("ko");
  return (
    <LangContext.Provider value={lang}>
      <AppInner lang={lang} setLang={setLang} />
    </LangContext.Provider>
  );
}
