import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Label,
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
    privacyIntro: "Petgrow(이하 \"서비스\")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수하기 위해 노력합니다. 본 개인정보처리방침은 Petgrow 웹사이트 및 모바일 애플리케이션에 적용됩니다.",
    contactBtn: "문의하기",
    contactFallback: "메일 앱이 안 열리면 help.petgrow@gmail.com으로 직접 보내주세요. 기능 개선 제안이나 버그 제보도 언제든 환영이에요!",
    feedbackBtn: "개선 요청하기",
    tipsTitle: "꿀팁",
    myPetsNav: "우리 아이",
    petgrowTagline: "우리 아이의 건강한 성장을 함께",
    badgesTitle: "성장 배지",
    badgeInfo: {
      record_first: { title: "첫 기록", desc: "체중 기록을 처음 추가했어요" },
      records_3: { title: "기록 3회", desc: "체중 기록을 3번 남겼어요" },
      records_10: { title: "기록 10회", desc: "체중 기록을 10번 남겼어요" },
      records_20: { title: "기록 20회", desc: "체중 기록을 20번 남겼어요" },
      first_photo: { title: "첫 사진", desc: "성장앨범에 사진을 처음 등록했어요" },
      photos_5: { title: "사진 5장", desc: "성장앨범에 사진 5장을 모았어요" },
      photos_10: { title: "사진 10장", desc: "성장앨범에 사진 10장을 모았어요" },
      photos_20: { title: "사진 20장", desc: "성장앨범에 사진 20장을 모았어요" },
      age_3m: { title: "3개월 함께", desc: "생후 3개월을 함께했어요" },
      age_6m: { title: "6개월 함께", desc: "생후 6개월을 함께했어요" },
      one_year: { title: "함께한 1년", desc: "등록 후 1년(생후 12개월)을 함께했어요" },
      vaccine_progress: { title: "접종 관리 중", desc: "예방접종 체크리스트를 3개 이상 체크했어요" },
    },
    badgeNext: (name) => `다음 배지: "${name}" — 조금만 더 기록해보세요!`,
    breedInfoNotice: "품종 특성은 일반적인 경향을 참고용으로 정리한 것이며, 개체마다 차이가 클 수 있어요.",
    breedInfoAvgWeight: "평균 성체 체중",
    breedInfoLifespan: "평균 수명",
    breedInfoActivity: "활동량",
    breedInfoGrooming: "털 관리",
    breedInfoBtn: "품종 정보 보기",
    vaccineChecklistTitle: "예방접종 체크리스트",
    vaccineChecklistNote: "실제 접종 시기·종류는 반려동물과 지역에 따라 다를 수 있어요. 정확한 일정은 동물병원과 상담해주세요.",
    vaccineChecklistItems: {
      dog: [
        { age: "생후 6~8주", label: "종합백신 1차" },
        { age: "생후 9~11주", label: "종합백신 2차" },
        { age: "생후 12~14주", label: "종합백신 3차 + 광견병 1차" },
        { age: "생후 15~17주", label: "종합백신 4차" },
        { age: "생후 6개월 전후", label: "중성화 상담" },
        { age: "생후 12개월 전후", label: "종합백신·광견병 연 1회 추가접종" },
      ],
      cat: [
        { age: "생후 6~8주", label: "켓트리플(FVRCP) 1차" },
        { age: "생후 9~11주", label: "켓트리플 2차" },
        { age: "생후 12~14주", label: "켓트리플 3차 + 백혈병(FeLV)" },
        { age: "생후 6개월 전후", label: "중성화 상담" },
        { age: "생후 12개월 전후", label: "켓트리플 연 1회 추가접종" },
      ],
    },
    shareCardTitle: "성장 리포트 공유 카드",
    shareCardLoading: "카드를 만들고 있어요...",
    shareCardDownload: "이미지 저장",
    shareCardShare: "공유하기",
    shareCardManualHint: "저장·공유가 안 되면 이미지를 길게 눌러 직접 저장해보세요.",
    shareCardBtn: "공유 카드 만들기",
    tipsAria: "꿀팁 보기",
    tipSearchPlaceholder: "궁금한 내용을 검색해보세요",
    tipFeaturedTitle: "오늘의 추천",
    tipAllTitle: "전체 꿀팁",
    tipBookmarkedFilter: "즐겨찾기",
    tipBookmarkAria: "즐겨찾기 추가/해제",
    tipEmptyResult: "조건에 맞는 꿀팁이 없어요.",
    tipCategoryLabels: { all: "전체보기", dog: "강아지", cat: "고양이", health: "건강", life: "생활" },
    privacyFooterLink: "개인정보처리방침",
    guideSections: [
      { title: "1. 아이 등록하기", body: "이름·품종·생년월일·현재 체중을 입력하면 예상 성체 체중과 성장 그래프가 바로 나와요. 대표 사진도 등록할 수 있어요." },
      { title: "2. 성장 기록", body: "체중을 잰 날짜와 함께 남기면, 예상보다 빠르게 크는지 느리게 크는지 자동으로 비교해줘요." },
      { title: "3. 성장앨범", body: "사진과 촬영일을 언제든 추가할 수 있어요. 월령별로 정리돼서 성장 과정을 한눈에 볼 수 있고, 슬라이드쇼로도 볼 수 있어요." },
      { title: "4. 또래 비교 · 참고 정보", body: "비슷한 또래와 비교하거나 사료량·예방접종 시기 같은 참고 정보를 확인해보세요. 확정 수치가 아니니 병원 상담은 꼭 함께 해주세요." },
      { title: "5. 성장 배지 · 예방접종 체크리스트", body: "기록·사진을 남길수록 배지가 하나씩 채워져요. 예방접종 일정은 체크리스트로 직접 체크하며 관리할 수 있어요." },
      { title: "6. 품종 정보 · 공유 카드", body: "이름 아래 품종을 누르면 품종별 참고 정보가 뜨고, 예측 결과 위 버튼으로 예쁜 공유 카드 이미지를 만들어 SNS에 공유할 수 있어요." },
      { title: "7. 꿀팁", body: "헤더의 '꿀팁' 버튼을 누르면 건강·생활 꿀팁을 검색하고 즐겨찾기할 수 있어요. 오늘의 추천은 매일 자동으로 바뀌어요." },
      { title: "8. 여러 마리 관리", body: "상단 탭에서 강아지·고양이를 나누고, 이름 칩을 눌러 최대 10마리까지 각자 따로 관리할 수 있어요." },
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
    labelProfileImage: "대표 사진 (선택)",
    profileImagePickBtn: "사진 선택",
    profileImageRemoveBtn: "삭제",
    profileHeaderBirth: (dateText) => `${dateText}생`,
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
    onboardingConfirmEditTitle: "정보를 수정하시겠습니까?",
    onboardingConfirmAddTitle: "이 정보로 등록하시겠습니까?",
    onboardingConfirmMessage: (name) => `${name}의 정보를 저장할게요. 계속할까요?`,
    onboardingConfirmBtn: "등록하기",
    ageUnder1Month: "1개월 미만",
    ageAbout: (n) => `약 ${n}개월`,
    heroAgeLabel: (breedName, ageText) => `${breedName} · 현재 ${ageText}령`,
    heroLabel: (adultWord) => `예상 ${adultWord} 체중`,
    heroLikelyPrefix: "가장 가능성이 높은 범위 약",
    heroDisclaimer: "성장 속도는 개체차가 커요. 확정 수치가 아닌 참고용 예측치예요.",
    chartTitle: "월령별 성장 그래프",
    chartLegend: "● 진한 점 = 현재 위치",
    chartBandLegend: "연두색 밴드 = 참고용 정상 범위 (예상치의 ±15%)",
    chartCurrentLabel: "현재",
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
    photoCountLabel: (n) => `${n}장`,
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
    privacyIntro: "Petgrow (\"the Service\") takes user privacy seriously and works to comply with the Personal Information Protection Act and other applicable laws. This privacy policy applies to the Petgrow website and mobile application.",
    contactBtn: "Contact us",
    contactFallback: "If your mail app doesn't open, email us directly at help.petgrow@gmail.com. Feature suggestions and bug reports are always welcome!",
    feedbackBtn: "Send feedback",
    tipsTitle: "Tips",
    myPetsNav: "My Pets",
    petgrowTagline: "Growing up healthy, together",
    badgesTitle: "Growth badges",
    badgeInfo: {
      record_first: { title: "First record", desc: "Added your first weight record" },
      records_3: { title: "3 records", desc: "Logged weight 3 times" },
      records_10: { title: "10 records", desc: "Logged weight 10 times" },
      records_20: { title: "20 records", desc: "Logged weight 20 times" },
      first_photo: { title: "First photo", desc: "Added a first photo to the growth album" },
      photos_5: { title: "5 photos", desc: "Collected 5 photos in the growth album" },
      photos_10: { title: "10 photos", desc: "Collected 10 photos in the growth album" },
      photos_20: { title: "20 photos", desc: "Collected 20 photos in the growth album" },
      age_3m: { title: "3 months together", desc: "Reached 3 months old" },
      age_6m: { title: "6 months together", desc: "Reached 6 months old" },
      one_year: { title: "1 year together", desc: "Been together for a year (12 months old)" },
      vaccine_progress: { title: "Staying on track", desc: "Checked off 3+ items on the vaccine checklist" },
    },
    badgeNext: (name) => `Next badge: "${name}" — keep logging to earn it!`,
    breedInfoNotice: "These traits are general tendencies for reference only — individual pets can vary a lot.",
    breedInfoAvgWeight: "Average adult weight",
    breedInfoLifespan: "Average lifespan",
    breedInfoActivity: "Activity level",
    breedInfoGrooming: "Grooming needs",
    breedInfoBtn: "View breed info",
    vaccineChecklistTitle: "Vaccine checklist",
    vaccineChecklistNote: "Actual timing and vaccine types vary by pet and region. Confirm the exact schedule with a vet.",
    vaccineChecklistItems: {
      dog: [
        { age: "6-8 weeks old", label: "Combo vaccine, dose 1" },
        { age: "9-11 weeks old", label: "Combo vaccine, dose 2" },
        { age: "12-14 weeks old", label: "Combo vaccine, dose 3 + rabies, dose 1" },
        { age: "15-17 weeks old", label: "Combo vaccine, dose 4" },
        { age: "Around 6 months old", label: "Spay/neuter consultation" },
        { age: "Around 12 months old", label: "Annual combo + rabies booster" },
      ],
      cat: [
        { age: "6-8 weeks old", label: "FVRCP, dose 1" },
        { age: "9-11 weeks old", label: "FVRCP, dose 2" },
        { age: "12-14 weeks old", label: "FVRCP, dose 3 + FeLV" },
        { age: "Around 6 months old", label: "Spay/neuter consultation" },
        { age: "Around 12 months old", label: "Annual FVRCP booster" },
      ],
    },
    shareCardTitle: "Growth report share card",
    shareCardLoading: "Building your card...",
    shareCardDownload: "Save image",
    shareCardShare: "Share",
    shareCardManualHint: "If saving or sharing doesn't work, try pressing and holding the image to save it directly.",
    shareCardBtn: "Make a share card",
    tipsAria: "View tips",
    tipSearchPlaceholder: "Search for a topic",
    tipFeaturedTitle: "Today's picks",
    tipAllTitle: "All tips",
    tipBookmarkedFilter: "Bookmarked",
    tipBookmarkAria: "Add/remove bookmark",
    tipEmptyResult: "No tips match your filters.",
    tipCategoryLabels: { all: "All", dog: "Dogs", cat: "Cats", health: "Health", life: "Lifestyle" },
    privacyFooterLink: "Privacy Policy",
    guideSections: [
      { title: "1. Register your pet", body: "Enter a name, breed, birth date, and current weight to instantly see the predicted adult weight and growth chart. You can add a profile photo too." },
      { title: "2. Growth records", body: "Log weight along with the date you measured it — PetGrow automatically compares it to the prediction and tells you if growth is running fast or slow." },
      { title: "3. Growth album", body: "Add photos with the date taken, anytime. They're grouped by age in months so you can see the whole growth story at a glance, and you can view them as a slideshow." },
      { title: "4. Peer comparison & reference info", body: "Compare with similar-aged pets, and check reference info like feeding amounts and vaccination timing. These are estimates, not prescriptions — always check with a vet." },
      { title: "5. Growth badges & vaccine checklist", body: "Badges fill in as you log records and photos. Track vaccinations with a checklist you can tick off yourself." },
      { title: "6. Breed info & share cards", body: "Tap the breed name under your pet's name for breed reference info, and use the button above the prediction to create a shareable image card for social media." },
      { title: "7. Tips", body: "Tap the 'Tips' button in the header to search and bookmark health and lifestyle tips. Today's picks rotate automatically each day." },
      { title: "8. Managing multiple pets", body: "Switch between dogs and cats with the top tabs, and tap a name chip to switch pets — up to 10 per species." },
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
    labelProfileImage: "Profile photo (optional)",
    profileImagePickBtn: "Choose photo",
    profileImageRemoveBtn: "Remove",
    profileHeaderBirth: (dateText) => `Born ${dateText}`,
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
    onboardingConfirmEditTitle: "Save these changes?",
    onboardingConfirmAddTitle: "Register with this info?",
    onboardingConfirmMessage: (name) => `We'll save ${name}'s info. Continue?`,
    onboardingConfirmBtn: "Register",
    ageUnder1Month: "under 1 month old",
    ageAbout: (n) => `about ${n} months old`,
    heroAgeLabel: (breedName, ageText) => `${breedName} · currently ${ageText}`,
    heroLabel: (adultWord) => `Predicted ${adultWord} weight`,
    heroLikelyPrefix: "Most likely range: about",
    heroDisclaimer: "Individual growth rates vary a lot — this is a reference estimate, not a fixed number.",
    chartTitle: "Growth chart by age",
    chartLegend: "● Bold dot = current point",
    chartBandLegend: "Green band = reference healthy range (±15% of prediction)",
    chartCurrentLabel: "Now",
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
    photoCountLabel: (n) => `${n} photo${n === 1 ? "" : "s"}`,
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

function formatBirthDate(dateStr, lang) {
  const d = new Date(dateStr);
  if (lang === "en") {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
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
const TrophyIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M6 3h12v2h2a1 1 0 0 1 1 1v1c0 2.2-1.6 4-3.7 4.4A6 6 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1a6 6 0 0 1-4.3-3.5C4.6 11 3 9.2 3 7V6a1 1 0 0 1 1-1h2V3zm0 4V7H5v.02C5.1 8.3 5.9 9.3 7 9.7 6.6 8.9 6.3 8 6.2 7H6zm11.8 0c-.1 1-.4 1.9-.8 2.7 1.1-.4 1.9-1.4 2-2.68V7h-1.2z" />
  </svg>
);
const ShareIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M18 16.1c-.8 0-1.5.3-2 .8l-7-4.1c.1-.3.1-.5.1-.8s0-.5-.1-.8l6.9-4.1c.6.5 1.3.9 2.1.9 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L8.1 9.9C7.5 9.4 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.4 2.1-.9l6.9 4.1c-.1.3-.1.5-.1.8 0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3z" />
  </svg>
);
const CheckSquareIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm5.2 12.4L18 7.6l-1.4-1.4-7.4 7.4L6 10.4 4.6 11.8l5.6 5.6z" />
  </svg>
);
// PetGrow 브랜드 마크 (강아지+고양이+하트) — 귀여운 핑크 톤
const PetGrowMark = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 30c-8 0-13 6-13 14 0 7 4 12 9 15-3 6-2 13 2 18" stroke="#1C1C1C" strokeWidth="3.2" />
      <circle cx="20" cy="34" r="1.6" fill="#1C1C1C" />
      <path d="M55 38c8-2 15 3 17 11 2 8-2 15-8 19 2 6 0 12-4 16" stroke="#4F9D3C" strokeWidth="3.2" />
      <circle cx="65" cy="42" r="1.6" fill="#4F9D3C" />
      <path d="M32 60c4-5 10-5 14 0 4-5 10-5 14 0 0 6-7 12-14 16-7-4-14-10-14-16z" stroke="#4F9D3C" strokeWidth="3" />
      <path d="M46 58c0-4 2-6 6-7-1 4-2 6-6 7z" fill="#4F9D3C" stroke="none" />
    </g>
  </svg>
);

// 실제 PetGrow 로고 이미지 (제공해주신 파일을 내장) — data URI라 배포 후에도 항상 함께 로드돼요
const PETGROW_LOGO_DATA_URI = "data:image/png;base64,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";
const PetGrowLogo = ({ style, className }) => (
  <img src={PETGROW_LOGO_DATA_URI} alt="PetGrow" className={className}
    style={{ ...style, borderRadius: "50%", objectFit: "cover", display: "block" }} />
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

// 입력 누락 등을 팝업으로 한 번 더 확실히 알려주는 단순 알림창
function AlertModal({ open, message, onClose }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} width={360}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22 }}>
        <BellIcon style={{ width: 20, height: 20, color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{message}</p>
      </div>
      <button className="bg-btn" style={{ width: "100%" }} onClick={onClose}>{t.guideConfirm}</button>
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
    title: "1. 개인정보 수집 및 이용",
    body: "Petgrow는 별도의 회원가입 및 로그인 기능을 제공하지 않으며, 서비스 이용을 위해 이용자의 이름, 이메일 주소, 전화번호 등의 개인정보를 직접 수집하지 않습니다. 다만 서비스 이용 과정에서 광고 제공, 서비스 보안 및 안정적인 운영을 위해 기기정보, 광고 관련 식별정보, 접속정보 등이 자동으로 처리될 수 있습니다.",
  },
  {
    title: "2. 광고 서비스",
    body: "Petgrow는 무료 서비스 제공을 위해 Google AdMob 등 광고 서비스를 사용할 수 있습니다. 광고 서비스 제공 과정에서 광고 제공업체가 기기 정보, 광고 식별자, IP 주소, 앱 이용 및 광고 상호작용 정보, 대략적인 위치정보 등 광고 제공에 필요한 정보를 자동으로 수집하거나 처리할 수 있습니다. 해당 정보의 처리 방식은 각 광고 서비스 제공업체의 개인정보처리방침에 따릅니다.",
  },
  {
    title: "3. 개인정보의 이용 목적",
    body: "자동으로 수집 또는 처리되는 정보는 광고 제공 및 광고 성과 측정, 서비스 이용 현황 분석, 서비스 안정성 및 품질 개선, 부정 이용 및 보안 위협 방지 목적으로 이용될 수 있습니다.",
  },
  {
    title: "4. 개인정보의 보유 및 이용기간",
    body: "Petgrow가 개인정보를 직접 수집하는 경우가 아닌 외부 광고 서비스 등을 통해 처리되는 정보의 보유기간은 해당 서비스 제공업체의 정책에 따를 수 있습니다. Petgrow가 별도로 개인정보를 수집하게 되는 경우에는 수집 목적이 달성된 후 관련 법령에 따라 필요한 경우를 제외하고 지체 없이 파기합니다.",
  },
  {
    title: "5. 개인정보의 제3자 제공",
    body: "Petgrow는 이용자의 개인정보를 임의로 판매하거나 제3자에게 제공하지 않습니다. 다만 광고 제공 등 서비스 운영을 위해 Google AdMob과 같은 외부 서비스가 이용될 수 있으며, 해당 서비스가 자체 정책에 따라 정보를 처리할 수 있습니다. 또한 관계 법령에 따라 적법한 요청이 있는 경우 관련 법령이 허용하는 범위에서 정보가 제공될 수 있습니다.",
  },
  {
    title: "6. 외부 서비스 이용",
    body: "Petgrow는 서비스 제공 및 운영을 위해 Google AdMob(제공자: Google LLC, 목적: 앱 내 광고 제공 및 광고 성과 측정, 처리될 수 있는 정보: 광고 식별자·기기정보·IP 주소·광고 상호작용 등)과 같은 외부 서비스를 이용할 수 있습니다. 외부 서비스의 개인정보 처리에 관한 자세한 사항은 해당 서비스 제공자의 개인정보처리방침을 통해 확인할 수 있습니다.",
  },
  {
    title: "7. 쿠키 및 유사 기술",
    body: "Petgrow 웹사이트 또는 서비스에서 사용하는 외부 서비스는 서비스 제공, 이용 현황 분석 또는 광고 제공을 위해 쿠키 및 유사 기술을 사용할 수 있습니다. 이용자는 사용하는 브라우저 또는 기기의 설정을 통해 일부 정보의 수집이나 맞춤형 광고를 제한할 수 있습니다.",
  },
  {
    title: "8. 이용자의 권리",
    body: "이용자는 관련 법령에서 정한 범위에서 자신의 개인정보에 대한 열람, 정정, 삭제 또는 처리정지를 요청할 수 있습니다. Petgrow가 직접 보유하고 있는 개인정보에 관한 요청 및 개인정보 관련 문의는 아래 이메일을 통해 접수할 수 있습니다.",
  },
  {
    title: "9. 아동의 개인정보",
    body: "Petgrow는 아동을 대상으로 개인정보를 의도적으로 수집하지 않습니다. 향후 아동을 대상으로 하는 기능을 제공하거나 아동의 개인정보를 처리하게 되는 경우 관련 법령 및 앱 마켓 정책에서 요구하는 보호조치를 적용합니다.",
  },
  {
    title: "10. 개인정보의 안전성 확보",
    body: "Petgrow는 서비스 운영 과정에서 처리되는 개인정보를 보호하기 위해 필요한 기술적·관리적 보호조치를 적용하도록 노력합니다. 또한 개인정보에 대한 불필요한 접근을 최소화하고 서비스의 안전성을 유지하기 위해 노력합니다.",
  },
  {
    title: "11. 개인정보 관련 문의",
    body: "개인정보처리방침 및 개인정보 보호와 관련한 문의는 아래 이메일로 연락해주시기 바랍니다.\n서비스명: Petgrow\n문의 이메일: help.petgrow@gmail.com\n접수된 개인정보 관련 문의는 가능한 한 신속하게 확인하고 처리하도록 노력합니다.",
  },
  {
    title: "12. 개인정보처리방침의 변경",
    body: "서비스 기능 또는 관련 법령 및 정책의 변경에 따라 본 개인정보처리방침이 변경될 수 있습니다. 중요한 내용이 변경되는 경우 Petgrow 웹사이트 또는 앱을 통해 안내합니다.\n\n시행일: 2026년 8월 13일",
  },
];
const PRIVACY_SECTIONS_EN = [
  { title: "1. Collection and Use of Personal Information", body: "Petgrow does not provide a separate sign-up or login feature, and does not directly collect personal information such as your name, email address, or phone number to use the service. However, device information, advertising identifiers, and connection information may be automatically processed for ad delivery, service security, and stable operation." },
  { title: "2. Advertising Services", body: "Petgrow may use advertising services such as Google AdMob to provide the service free of charge. In doing so, the ad provider may automatically collect or process device information, advertising identifiers, IP address, app usage and ad interaction data, and approximate location information needed to serve ads. How this information is handled follows each ad provider's own privacy policy." },
  { title: "3. Purpose of Use", body: "Automatically collected or processed information may be used to deliver ads and measure ad performance, analyze service usage, improve service stability and quality, and prevent fraud and security threats." },
  { title: "4. Retention Period", body: "For information processed through external advertising services rather than collected directly by Petgrow, the retention period follows that provider's policy. Where Petgrow does collect personal information directly, it is deleted without delay once its purpose is fulfilled, except where retention is required by law." },
  { title: "5. Sharing with Third Parties", body: "Petgrow does not sell or arbitrarily share your personal information with third parties. However, external services such as Google AdMob may be used for service operation, including ad delivery, and may process information under their own policies. Information may also be disclosed where required by law through a lawful request." },
  { title: "6. Use of External Services", body: "Petgrow may use external services such as Google AdMob (provider: Google LLC; purpose: in-app ad delivery and performance measurement; information that may be processed: advertising identifiers, device information, IP address, ad interactions, etc.) to provide and operate the service. Details on how these external services handle personal information can be found in their own privacy policies." },
  { title: "7. Cookies and Similar Technologies", body: "External services used on the Petgrow website or app may use cookies and similar technologies to provide the service, analyze usage, or serve ads. You can limit some data collection or personalized ads through your browser or device settings." },
  { title: "8. Your Rights", body: "You may request to view, correct, delete, or stop the processing of your personal information within the scope defined by applicable law. Requests or inquiries regarding personal information directly held by Petgrow can be submitted via the email address below." },
  { title: "9. Children's Personal Information", body: "Petgrow does not intentionally collect personal information from children. Should Petgrow offer features aimed at children or process children's personal information in the future, it will apply the protective measures required by applicable law and app marketplace policies." },
  { title: "10. Security of Personal Information", body: "Petgrow strives to apply the technical and managerial safeguards necessary to protect personal information processed in the course of operating the service, and works to minimize unnecessary access to it." },
  { title: "11. Contact", body: "For inquiries about this privacy policy or personal information protection, please contact us at the email below.\nService: Petgrow\nContact email: help.petgrow@gmail.com\nWe make every effort to review and respond to inquiries as quickly as possible." },
  { title: "12. Changes to this Policy", body: "This privacy policy may change due to changes in service features or applicable laws and policies. Material changes will be announced via the Petgrow website or app.\n\nEffective date: August 13, 2026" },
];

function PrivacyContent({ onGoHome }) {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS_KO;
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      {onGoHome && (
        <button type="button" onClick={onGoHome}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20 }}>
          <PetGrowLogo style={{ width: 22, height: 22 }} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
            <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
          </span>
        </button>
      )}
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>{t.privacyTitle}</h1>
      <p className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>{t.privacyIntro}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {sections.map((s) => (
          <div key={s.title}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
            <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text)", whiteSpace: "pre-line" }}>{s.body}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="mailto:help.petgrow@gmail.com?subject=%5BPetGrow%5D%20%EB%AC%B8%EC%9D%98" className="bg-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "9px 18px", fontSize: 13 }}>
            <MailIcon style={{ width: 14, height: 14 }} /> {t.contactBtn}
          </a>
          <a href="mailto:help.petgrow@gmail.com?subject=%5BPetGrow%5D%20%EA%B0%9C%EC%84%A0%20%EC%9A%94%EC%B2%AD" className="bg-btn bg-btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "9px 18px", fontSize: 13 }}>
            <LightbulbIcon style={{ width: 14, height: 14 }} /> {t.feedbackBtn}
          </a>
        </div>
        <div className="bg-sub" style={{ fontSize: 12, marginTop: 8 }}>{t.contactFallback}</div>
      </div>
    </div>
  );
}

// petgrow.co.kr/privacy 로 실제 배포됐을 때 직접 접속하는 경우를 위한 독립 페이지
function PrivacyPage() {
  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0" }}>
        <PrivacyContent onGoHome={() => { window.location.href = "/"; }} />
      </div>
    </div>
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
    @import url('https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap');
    .bboggl-root{
      --primary:#4F9D3C;--primary-dark:#3D7A2E;--text:#1C1C1C;--sub:#666666;--bg:#FAF7F0;--surface:#F1F3E9;--border:#E3DECF;
      font-family:'Gowun Dodum','Inter',sans-serif; letter-spacing:0; color:var(--text); background:var(--bg);
      min-height:100%; width:100%; box-sizing:border-box; font-weight:500; overflow-x:hidden;
    }
    .bboggl-root *{box-sizing:border-box;}
    .bboggl-root h1,.bboggl-root h2,.bboggl-root h3{font-family:'Jua','Gowun Dodum',sans-serif; font-weight:400; margin:0;}
    .bg-btn{border-radius:999px;padding:13px 22px;font-weight:700;background:var(--primary);color:#fff;border:none;
      box-shadow:0 5px 0 var(--primary-dark);cursor:pointer;transition:.12s; font-size:15px; font-family:inherit;}
    .bg-btn:hover{transform:translateY(-2px); box-shadow:0 7px 0 var(--primary-dark);}
    .bg-btn:active{transform:translateY(2px); box-shadow:0 2px 0 var(--primary-dark);}
    .bg-btn:disabled{opacity:.4; cursor:not-allowed; transform:none; box-shadow:0 5px 0 var(--primary-dark);}
    .bg-btn-ghost{background:var(--surface); color:var(--text); box-shadow:0 4px 0 var(--border); border:none;}
    .bg-btn-ghost.invalid{box-shadow:0 4px 0 var(--primary-dark); outline:2px solid var(--primary); outline-offset:-2px;}
    .bg-btn-ghost:hover{box-shadow:0 5px 0 var(--border);}
    .bg-btn-ghost:active{box-shadow:0 1px 0 var(--border);}
    .icon{width:22px;height:22px;fill:currentColor;stroke:none;flex-shrink:0;}
    .bg-card{background:var(--bg); border:2px solid var(--border); border-radius:26px; padding:22px;}
    .bg-surface-card{background:var(--surface); border-radius:22px; padding:20px;}
    .bg-input{width:100%; max-width:100%; min-width:0; box-sizing:border-box; padding:12px 16px; border:2px solid var(--border); border-radius:18px; font-family:inherit;
      font-size:14px; background:#fff; color:var(--text);}
    .bg-input:focus{outline:none; border-color:var(--primary);}
    input[type="date"].bg-input{min-width:0; -webkit-min-logical-width:0;}
    .bg-chip{padding:10px 16px; border-radius:999px; border:2px solid var(--border); background:#fff; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:500; color:var(--text); transition:.12s; text-align:left;}
    .bg-chip:hover{border-color:var(--primary); transform:translateY(-1px);}
    .bg-chip.active{background:var(--primary); color:#fff; border-color:var(--primary); font-weight:700;}
    .bg-label{font-size:13px; font-weight:700; color:var(--text); margin-bottom:8px; display:block;}
    .bg-sub{color:var(--sub); font-size:13px;}
    .bg-accordion{border:2px solid var(--border); border-radius:20px; overflow:hidden; margin-bottom:10px;}
    .bg-accordion summary{padding:14px 18px; cursor:pointer; font-weight:700; font-size:14px; list-style:none;
      display:flex; align-items:center; justify-content:space-between; background:#fff;}
    .bg-accordion summary::-webkit-details-marker{display:none;}
    .bg-accordion[open] summary{border-bottom:2px solid var(--border);}
    .bg-accordion .acc-body{padding:14px 18px; font-size:13px; line-height:1.7; color:var(--text); background:var(--surface);}
    .photo-tile{aspect-ratio:1; border-radius:22px; overflow:hidden; position:relative; cursor:pointer;
      border:2px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center;}
    .photo-tile.locked{cursor:not-allowed; opacity:.5;}
    .photo-tile img{width:100%; height:100%; object-fit:cover;}
    .photo-tile .tile-label{position:absolute; bottom:0; left:0; right:0; background:rgba(91,74,79,.65); color:#fff;
      font-size:11px; font-weight:700; padding:4px 6px; text-align:center;}
    .tile-actions{position:absolute; top:5px; right:5px; display:flex; gap:4px;}
    .tile-btn{width:28px; height:28px; border-radius:50%; border:none; background:rgba(91,74,79,.55);
      display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0;}
    .tile-btn:hover{background:rgba(91,74,79,.8);}
    .tile-btn .icon{width:14px; height:14px; fill:#fff;}
    .reminder-banner{display:flex; align-items:center; gap:10px; background:#fff; border:2px solid var(--primary);
      border-radius:18px; padding:12px 14px; margin-bottom: 14px;}
    .photo-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(110px,1fr)); gap:10px;}
    .album-month-header{position:sticky; top:0; z-index:5; background:var(--bg); display:flex; align-items:baseline;
      gap:8px; padding:6px 0; font-family:'Jua',sans-serif; font-size:16px; color:var(--text);}
    .album-month-header .bg-sub{font-family:'Gowun Dodum',sans-serif; font-size:12px;}
    .pet-switcher{display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; margin-bottom:18px;}
    .add-photo-row{display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap; max-width:100%;}
    .add-photo-field{flex:1 1 140px; min-width:0; max-width:100%;}
    @media (max-width:480px){
      .add-photo-row{flex-direction:column; align-items:stretch;}
      .add-photo-field{flex-basis:auto; width:100%; max-width:100%;}
      .add-photo-row > .bg-btn{width:100%;}
    }
    @keyframes aboutFadeUp{from{opacity:0; transform:translateY(16px);} to{opacity:1; transform:translateY(0);}}
    @keyframes aboutFloat{0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);}}
    @keyframes sparklineDraw{from{stroke-dashoffset:300;} to{stroke-dashoffset:0;}}
    @keyframes badgeBounce{0%,100%{transform:translateY(0) rotate(-6deg);} 50%{transform:translateY(-14px) rotate(-6deg);}}
    @keyframes badgeBounceAlt{0%,100%{transform:translateY(0) rotate(6deg);} 50%{transform:translateY(-14px) rotate(6deg);}}
    @keyframes stepPop{0%{opacity:0; transform:scale(.4);} 70%{transform:scale(1.12);} 100%{opacity:1; transform:scale(1);}}
    @keyframes gradientPan{0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;}}
    @keyframes leafDrift{0%{transform:translate(0,0) rotate(0deg); opacity:.5;} 50%{opacity:.9;} 100%{transform:translate(14px,-22px) rotate(20deg); opacity:.5;}}
    .about-fade{opacity:0; animation:aboutFadeUp .7s ease both;}
    .about-logo-float{animation:aboutFloat 3.2s ease-in-out infinite;}
    .mock-sparkline polyline{stroke-dasharray:300; animation:sparklineDraw 1.3s ease-out .5s both;}
    .landing-hero-section{position:relative; overflow:hidden;
      background:linear-gradient(120deg,#F7FBF5,#EAF3E4,#F7FBF5); background-size:200% 200%; animation:gradientPan 10s ease infinite;}
    .landing-hero-section::before, .landing-hero-section::after{content:"🌿"; position:absolute; font-size:26px;
      opacity:.5; animation:leafDrift 6s ease-in-out infinite;}
    .landing-hero-section::before{top:18%; left:8%;}
    .landing-hero-section::after{bottom:14%; right:10%; animation-delay:2s;}
    .landing-illustration .paw-badge{animation:badgeBounce 2.6s ease-in-out infinite;}
    .landing-illustration .cat-badge{animation:badgeBounceAlt 2.6s ease-in-out infinite .4s;}
    .landing-step-num{animation:stepPop .6s ease both;}
    .landing-showcase-media{transition:transform .3s ease;}
    .landing-showcase-media:hover{transform:translateY(-6px);}
    .pet-switcher .bg-chip{white-space:nowrap; flex-shrink:0;}
    .bg-input.invalid{border-color:var(--primary);}
    .field-error{color:var(--primary-dark); font-size:12px; font-weight:700; margin-top:5px;}
    .form-alert{display:flex; align-items:flex-start; gap:8px; background:var(--surface); border:2px solid var(--primary);
      border-radius:18px; padding:10px 14px; font-size:13px; font-weight:600; margin-bottom:12px;}
    .icon-btn{width:40px; height:40px; border-radius:50%; border:2px solid var(--border); background:#fff;
      display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;}
    .icon-btn:hover{border-color:var(--primary); transform:translateY(-1px);}
    .profile-avatar{width:64px; height:64px; border-radius:50%; background:var(--surface); border:2px solid var(--border);
      display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; flex-shrink:0;}
    .profile-avatar img{width:100%; height:100%; object-fit:cover;}
    .profile-header{display:flex; align-items:center; gap:16px;}
    .profile-header-avatar{width:112px; height:112px; border-radius:50%; background:var(--surface);
      border:4px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden;
      flex-shrink:0; cursor:pointer; position:relative;}
    .profile-header-avatar img{width:100%; height:100%; object-fit:cover;}
    .profile-header-avatar .avatar-edit-badge{position:absolute; bottom:2px; right:2px; width:32px; height:32px;
      border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center;
      border:2px solid #fff;}
    .profile-header-avatar .avatar-edit-badge .icon{width:14px; height:14px; fill:#fff;}
    .profile-header-name{font-family:'Jua',sans-serif; font-size:24px; color:var(--text);}
    .profile-header-meta{font-size:13px; color:var(--sub); margin-top:6px;}
    .badge-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:14px 4px;}
    .badge-tile{text-align:center;}
    .badge-tile-circle{width:56px; height:56px; border-radius:50%; margin:0 auto 6px;
      display:flex; align-items:center; justify-content:center;}
    .badge-tile-label{font-size:11px; font-weight:700; line-height:1.3;}
    @media (max-width:420px){ .badge-grid{grid-template-columns:repeat(3,1fr);} }
    .lang-toggle{display:flex; border:2px solid var(--border); border-radius:999px; overflow:hidden; flex-shrink:0;}
    .lang-toggle button{border:none; background:#fff; padding:0 14px; height:40px; font-family:inherit; font-size:12px;
      font-weight:700; cursor:pointer; color:var(--sub);}
    .lang-toggle button.active{background:var(--primary); color:#fff;}
    .account-btn{display:flex; align-items:center; gap:6px; height:40px; padding:0 14px; border-radius:999px;
      border:2px solid var(--border); background:#fff; cursor:pointer; font-family:inherit; font-size:13px;
      font-weight:700; color:var(--text); flex-shrink:0;}
    .account-btn:hover{border-color:var(--primary);}
    .demo-tag{font-size:10px; font-weight:700; color:var(--primary-dark); background:var(--surface);
      border-radius:999px; padding:2px 8px; margin-left:2px;}
    .login-divider{display:flex; align-items:center; gap:10px; margin:16px 0; color:var(--sub); font-size:12px;}
    .login-divider::before, .login-divider::after{content:""; flex:1; height:1px; background:var(--border);}
    .btn-google{display:flex; align-items:center; justify-content:center; gap:8px; width:100%;}
    .notif-wrap{position:relative;}
    .notif-badge{position:absolute; top:-4px; right:-4px; background:var(--primary); color:#fff; font-size:10px;
      font-weight:700; min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center;
      justify-content:center; padding:0 3px;}
    .notif-panel{position:absolute; top:calc(100% + 6px); right:0; width:280px; background:#fff;
      border:2px solid var(--border); border-radius:20px; box-shadow:0 12px 28px rgba(91,74,79,.16); z-index:30;
      max-height:340px; overflow-y:auto;}
    .notif-item{padding:11px 14px; font-size:13px; line-height:1.5; cursor:pointer; border-bottom:1px solid var(--border);}
    .notif-item:hover{background:var(--surface);}
    .notif-footer{padding:12px 14px; border-top:1px solid var(--border);}
    .slideshow-card{background:#3a2e32; border-radius:24px; padding:16px; max-width:640px; width:100%;
      display:flex; flex-direction:column; position:relative;}
    .slideshow-close{position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%;
      border:none; background:rgba(255,255,255,.15); color:#fff; font-size:16px; cursor:pointer; z-index:2;}
    .slideshow-image-wrap{position:relative; display:flex; align-items:center; justify-content:center;
      min-height:280px; max-height:60vh;}
    .slideshow-image-wrap img{max-width:100%; max-height:60vh; border-radius:16px; object-fit:contain;}
    .slideshow-nav{position:absolute; top:50%; transform:translateY(-50%); width:40px; height:40px;
      border-radius:50%; border:none; background:rgba(255,255,255,.2); color:#fff; font-size:24px; cursor:pointer;}
    .slideshow-nav:hover{background:rgba(255,255,255,.35);}
    .slideshow-prev{left:4px;} .slideshow-next{right:4px;}
    .slideshow-caption{display:flex; justify-content:space-between; color:#fff; font-size:13px; margin-top:12px;}
    .slideshow-caption .bg-sub{color:rgba(255,255,255,.6);}
    .landing-root{--pg-dark:#1C1C1C; --pg-green:#4F9D3C; --pg-green-light:#F2F8F0;
      background:linear-gradient(180deg,#F7FBF5 0%, #F2F8F0 60%, #F7FBF5 100%); min-height:100vh;}
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
    .landing-showcase{display:flex; flex-direction:column; gap:36px; margin-top:8px;}
    .landing-showcase-row{display:flex; align-items:center; gap:40px;}
    .landing-showcase-row.reverse{flex-direction:row-reverse;}
    .landing-showcase-media{flex:1 1 320px; display:flex; justify-content:center;}
    .landing-showcase-text{flex:1 1 320px;}
    .landing-showcase-title{font-size:26px; font-weight:800; color:var(--pg-dark); margin-bottom:14px;}
    .landing-showcase-desc{font-size:16px; color:#787774; line-height:1.85; max-width:400px;}
    .mock-card{background:#fff; border-radius:22px; padding:26px; box-shadow:0 20px 48px rgba(28,28,28,.1);
      width:100%; max-width:340px; border:1px solid var(--border);}
    .mock-card-label{font-size:12px; color:var(--sub); font-weight:700; text-transform:uppercase; letter-spacing:.03em;}
    .mock-card-value{font-size:36px; font-weight:800; color:var(--text); margin-top:6px;}
    .mock-card-sub{font-size:13px; color:var(--primary); font-weight:700; margin-top:4px;}
    .mock-sparkline{margin-top:18px;}
    .mock-photos{display:flex; gap:10px; margin-top:14px;}
    .mock-photo{flex:1; aspect-ratio:1; border-radius:14px; background:var(--surface);
      display:flex; align-items:center; justify-content:center;}
    .mock-photo-alt{background:var(--border);}
    .mock-photo-caption{font-size:12px; color:var(--sub); margin-top:12px;}
    .mock-checklist-row{display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border);}
    .mock-checklist-row:last-child{border-bottom:none;}
    .mock-checklist-icon{width:36px; height:36px; border-radius:10px; background:var(--surface);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;}
    .mock-checklist-text{font-size:14px; font-weight:600; color:var(--text);}
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
    .landing-section{padding:36px 0;}
    .landing-section-white{background:#fff;}
    .landing-hero-section{padding-top:44px; padding-bottom:20px;}
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
      .landing-showcase-row, .landing-showcase-row.reverse{flex-direction:column; align-items:stretch; gap:28px;}
      .landing-showcase{gap:36px;}
      .landing-showcase-media{width:100%;}
      .mock-card{max-width:100%;} }
    .modal-overlay{position:fixed; inset:0; background:rgba(91,74,79,.45); display:flex; align-items:center;
      justify-content:center; padding:20px; z-index:100;}
    .modal-card{background:#fff; border-radius:28px; padding:26px; width:100%; box-shadow:0 24px 48px rgba(91,74,79,.25);
      max-height:82vh; overflow-y:auto;}
    .combobox-wrap{position:relative;}
    .combobox-dropdown{position:absolute; top:calc(100% + 4px); left:0; right:0; background:#fff;
      border:2px solid var(--border); border-radius:18px; max-height:260px; overflow-y:auto; z-index:20;
      box-shadow:0 8px 20px rgba(91,74,79,.14);}
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

function ProfileImagePicker({ species, value, onChange }) {
  const t = useT();
  const inputRef = useRef(null);
  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
    e.target.value = "";
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div className="profile-avatar" onClick={() => inputRef.current && inputRef.current.click()}>
        {value ? (
          <img src={value} alt="" />
        ) : species === "cat" ? (
          <CatIcon style={{ width: 30, height: 30, color: "var(--sub)" }} />
        ) : (
          <PawIcon style={{ width: 30, height: 30, color: "var(--sub)" }} />
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="bg-btn bg-btn-ghost" style={{ padding: "9px 14px", fontSize: 13 }}
          onClick={() => inputRef.current && inputRef.current.click()}>
          {t.profileImagePickBtn}
        </button>
        {value && (
          <button type="button" className="bg-btn bg-btn-ghost" style={{ padding: "9px 14px", fontSize: 13 }}
            onClick={() => onChange(null)}>
            {t.profileImageRemoveBtn}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePick} />
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
  const [profileImage, setProfileImage] = useState(initialValues?.profileImage ?? null);
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
  const [alertPopup, setAlertPopup] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = t.errName;
    if (!birthDate) next.birthDate = t.errBirthDate;
    if (!isEdit && !(Number(weight) > 0)) next.weight = t.errWeight;
    if (isCustom && !customBreedName.trim()) next.customBreedName = t.errCustomBreed(otherLabel);
    return next;
  };

  const buildProfileData = () => {
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
    return {
      species,
      name: name.trim(),
      profileImage,
      breedId,
      breedName: breedNameToStore,
      curveKey,
      avgAdultKg,
      birthDate,
      gender,
      neutered,
      bodyCondition,
      initialWeightKg: isEdit ? initialValues.initialWeightKg : Number(weight),
    };
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormAlert(t.formAlertMissing);
      setAlertPopup(true);
      return;
    }
    setErrors({});
    setFormAlert("");
    setPendingData(buildProfileData());
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    setConfirmOpen(false);
    if (pendingData) onSubmit(pendingData);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 20px 60px" }}>
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
          <label className="bg-label">{t.labelProfileImage}</label>
          <ProfileImagePicker species={species} value={profileImage} onChange={setProfileImage} />
        </div>

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

      <AlertModal open={alertPopup} message={t.formAlertMissing} onClose={() => setAlertPopup(false)} />
      <ConfirmModal
        open={confirmOpen}
        title={isEdit ? t.onboardingConfirmEditTitle : t.onboardingConfirmAddTitle}
        message={t.onboardingConfirmMessage(name.trim() || speciesLabel)}
        confirmLabel={isEdit ? t.submitEdit : t.onboardingConfirmBtn}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
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

function GrowthChartCard({ table, ageMonths, currentWeightKg, statusDiffGrams }) {
  const t = useT();
  const data = table.map((r) => ({
    month: r.month,
    weight: r.weight,
    band: [Math.round(r.weight * 0.85 * 100) / 100, Math.round(r.weight * 1.15 * 100) / 100],
  }));
  const currentPoint = { month: Math.round(ageMonths * 10) / 10, weight: currentWeightKg };
  const status = statusDiffGrams === undefined || statusDiffGrams === null ? null : diffLabel(statusDiffGrams, t);
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ChartIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.chartTitle}</h3>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#E3DECF" vertical={false} />
          <XAxis dataKey="month" type="number" domain={[0, 24]} tick={{ fontSize: 12, fill: "#666666" }} tickFormatter={(m) => t.monthLabel(m)}
            stroke="#E3DECF" />
          <YAxis tick={{ fontSize: 12, fill: "#666666" }} stroke="#E3DECF" width={40} tickFormatter={(v) => `${v}kg`} />
          <Tooltip formatter={(v, name) => name === "band" ? null : [`${v}kg`, t.tooltipWeight]} labelFormatter={(m) => t.monthLabelAge(m)}
            contentStyle={{ borderRadius: 16, border: "2px solid #E3DECF", fontSize: 13 }} />
          <Area dataKey="band" stroke="none" fill="#4F9D3C" fillOpacity={0.12} isAnimationActive={false} />
          <Line type="monotone" dataKey="weight" stroke="#4F9D3C" strokeWidth={3} dot={{ r: 4, fill: "#4F9D3C" }} />
          <ReferenceDot x={currentPoint.month} y={currentPoint.weight} r={8} fill="#3D7A2E" stroke="#fff" strokeWidth={3}>
            <Label value={`${t.chartCurrentLabel} ${currentPoint.weight}kg`} position="top" offset={12}
              style={{ fontSize: 12, fontWeight: 700, fill: "#1C1C1C" }} />
          </ReferenceDot>
        </LineChart>
      </ResponsiveContainer>
      <div className="bg-sub" style={{ fontSize: 12, marginTop: 4 }}>{t.chartLegend}</div>
      <div className="bg-sub" style={{ fontSize: 12, marginTop: 2 }}>{t.chartBandLegend}</div>
      {status && (
        <div className="bg-surface-card" style={{ marginTop: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700,
          color: status.tone === "up" ? "var(--primary)" : status.tone === "down" ? "var(--text)" : "var(--sub)" }}>
          {status.text}
        </div>
      )}
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
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [alertPopup, setAlertPopup] = useState(false);

  const submit = () => {
    const next = {};
    if (!date) next.date = t.recordErrDate;
    const w = Number(weight);
    if (!(w > 0)) next.weight = t.recordErrWeight;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setAlert(t.formAlertMissing);
      setAlertPopup(true);
      return;
    }
    setErrors({});
    setAlert("");
    onAdd(date, w);
    setWeight("");
  };

  return (
    <div>
      {alert && (
        <div className="form-alert">
          <BellIcon style={{ width: 16, height: 16, color: "var(--primary)", marginTop: 1 }} />
          <span>{alert}</span>
        </div>
      )}
      <div className="add-photo-row">
        <div className="add-photo-field">
          <label className="bg-label">{t.recordDateLabel}</label>
          <input type="date" className={`bg-input ${errors.date ? "invalid" : ""}`} value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date && <div className="field-error">{errors.date}</div>}
        </div>
        <div className="add-photo-field">
          <label className="bg-label">{t.recordWeightLabel}</label>
          <input type="number" step="0.01" min="0" className={`bg-input ${errors.weight ? "invalid" : ""}`} value={weight}
            onChange={(e) => setWeight(e.target.value)} placeholder="1.45" />
          {errors.weight && <div className="field-error">{errors.weight}</div>}
        </div>
        <button className="bg-btn" style={{ height: 42 }} onClick={submit}>
          {t.recordAddBtn}
        </button>
      </div>
      <AlertModal open={alertPopup} message={t.formAlertMissing} onClose={() => setAlertPopup(false)} />
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
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [alertPopup, setAlertPopup] = useState(false);

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  };

  const handleAdd = async () => {
    const next = {};
    if (!date) next.date = t.photoErrDate;
    if (!pendingFile) next.photo = t.photoErrPhoto;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setAlert(t.formAlertMissing);
      setAlertPopup(true);
      return;
    }
    setErrors({});
    setAlert("");
    const dataUrl = await fileToDataUrl(pendingFile);
    onAdd(date, dataUrl);
    setPendingFile(null);
  };

  return (
    <div className="bg-surface-card">
      {alert && (
        <div className="form-alert">
          <BellIcon style={{ width: 16, height: 16, color: "var(--primary)", marginTop: 1 }} />
          <span>{alert}</span>
        </div>
      )}
      <div className="add-photo-row">
        <div className="add-photo-field">
          <label className="bg-label">{t.photoDateLabel}</label>
          <input type="date" className={`bg-input ${errors.date ? "invalid" : ""}`} value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date && <div className="field-error">{errors.date}</div>}
        </div>
        <div className="add-photo-field">
          <label className="bg-label">{t.photoLabel}</label>
          <button type="button" className={`bg-btn bg-btn-ghost ${errors.photo ? "invalid" : ""}`} style={{ width: "100%", textAlign: "center" }}
            onClick={() => inputRef.current && inputRef.current.click()}>
            {pendingFile ? pendingFile.name.slice(0, 16) : t.photoPickBtn}
          </button>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePick} />
          {errors.photo && <div className="field-error">{errors.photo}</div>}
        </div>
        <button className="bg-btn" style={{ height: 42 }} onClick={handleAdd}>
          {t.photoAddBtn}
        </button>
      </div>
      <AlertModal open={alertPopup} message={t.formAlertMissing} onClose={() => setAlertPopup(false)} />
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

function groupPhotosByMonth(photos, birthDate) {
  const groups = {};
  photos.forEach((photo) => {
    const m = Math.round(monthsBetween(new Date(birthDate), new Date(photo.date)));
    if (!groups[m]) groups[m] = [];
    groups[m].push(photo);
  });
  return Object.keys(groups).map(Number).sort((a, b) => b - a).map((m) => ({
    month: m,
    photos: groups[m].sort((a, b) => new Date(b.date) - new Date(a.date)),
  }));
}

function PhotoAlbum({ birthDate, photos, onAdd, onEdit, onDelete }) {
  const t = useT();
  const lang = useLang();
  // 슬라이드쇼는 오래된 순으로 넘겨보는 게 자연스러워서 별도로 정렬해요
  const chronological = useMemo(() => [...photos].sort((a, b) => new Date(a.date) - new Date(b.date)), [photos]);
  const groups = useMemo(() => groupPhotosByMonth(photos, birthDate), [photos, birthDate]);
  const [slideshow, setSlideshow] = useState(null); // index within chronological | null

  const openSlideshowFor = (photoId) => {
    const idx = chronological.findIndex((p) => p.id === photoId);
    setSlideshow(idx >= 0 ? idx : 0);
  };

  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CameraIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
          <h3 style={{ fontSize: 16 }}>{t.albumTitle}</h3>
        </div>
        {chronological.length > 0 && (
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
      {groups.length > 0 ? (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 22 }}>
          {groups.map((group) => (
            <div key={group.month}>
              <div className="album-month-header">
                <span>{group.month < 1 ? t.ageUnder1Month : t.monthLabel(group.month)}</span>
                <span className="bg-sub">{t.photoCountLabel(group.photos.length)}</span>
              </div>
              <div className="photo-grid" style={{ marginTop: 10 }}>
                {group.photos.map((photo) => (
                  <PhotoTile key={photo.id} photo={photo} birthDate={birthDate} onEdit={onEdit} onDelete={onDelete}
                    onOpenSlideshow={() => openSlideshowFor(photo.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-sub" style={{ marginTop: 14, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
          {t.albumEmpty}
        </div>
      )}
      <SlideshowModal open={slideshow !== null} photos={chronological} birthDate={birthDate} startIndex={slideshow} onClose={() => setSlideshow(null)} />
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
   ① 성장 마일스톤 배지 — 로컬 데이터만으로 자동 판정
   ============================================================ */
const MILESTONE_BADGES = [
  { id: "record_first", icon: ChartIcon, check: (pet) => pet.records.length >= 2 },
  { id: "records_3", icon: ChartIcon, check: (pet) => pet.records.length >= 3 },
  { id: "records_10", icon: ChartIcon, check: (pet) => pet.records.length >= 10 },
  { id: "records_20", icon: ChartIcon, check: (pet) => pet.records.length >= 20 },
  { id: "first_photo", icon: CameraIcon, check: (pet) => pet.photos.length >= 1 },
  { id: "photos_5", icon: CameraIcon, check: (pet) => pet.photos.length >= 5 },
  { id: "photos_10", icon: CameraIcon, check: (pet) => pet.photos.length >= 10 },
  { id: "photos_20", icon: CameraIcon, check: (pet) => pet.photos.length >= 20 },
  { id: "age_3m", icon: TrophyIcon, check: (pet, ageMonths) => ageMonths >= 3 },
  { id: "age_6m", icon: TrophyIcon, check: (pet, ageMonths) => ageMonths >= 6 },
  { id: "one_year", icon: TrophyIcon, check: (pet, ageMonths) => ageMonths >= 12 },
  { id: "vaccine_progress", icon: CheckSquareIcon, check: (pet) => Object.values(pet.vaccineChecklist || {}).filter(Boolean).length >= 3 },
];

function MilestoneBadges({ pet, ageMonths }) {
  const t = useT();
  const next = MILESTONE_BADGES.find((b) => !b.check(pet, ageMonths));
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <TrophyIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.badgesTitle}</h3>
      </div>
      <div className="badge-grid">
        {MILESTONE_BADGES.map((b) => {
          const Icon = b.icon;
          const got = b.check(pet, ageMonths);
          return (
            <div key={b.id} title={t.badgeInfo[b.id].desc} className="badge-tile" style={{ opacity: got ? 1 : 0.35 }}>
              <div className="badge-tile-circle" style={{ background: got ? "var(--primary)" : "var(--surface)" }}>
                <Icon style={{ width: 22, height: 22, color: got ? "#fff" : "var(--sub)" }} />
              </div>
              <div className="badge-tile-label">{t.badgeInfo[b.id].title}</div>
            </div>
          );
        })}
      </div>
      {next && (
        <div className="bg-sub" style={{ marginTop: 14, fontSize: 12 }}>
          {t.badgeNext(t.badgeInfo[next.id].title)}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ② 품종 정보 페이지 — 보유 중인 견종/묘종 데이터를 활용한 참고 정보
   ============================================================ */
const BREED_SIZE_INFO = {
  "dog-small": { lifespan: "12~16세", activity: "낮음~보통", grooming: "보통", note: "실내 생활에 적합하고 산책 필요량이 상대적으로 적은 편이에요." },
  "dog-medium": { lifespan: "10~14세", activity: "보통~높음", grooming: "보통", note: "매일 규칙적인 산책과 활동량이 필요한 편이에요." },
  "dog-large": { lifespan: "8~12세", activity: "높음", grooming: "보통~많음", note: "관절 부담을 줄이기 위해 어릴 때 과격한 운동은 피하는 게 좋아요." },
  "cat-standard": { lifespan: "13~17세", activity: "보통", grooming: "보통", note: "대부분 실내 생활에 적합하고 개체별 성격 차이가 큰 편이에요." },
  "cat-giant": { lifespan: "12~15세", activity: "보통", grooming: "많음", note: "몸집이 크고 성장이 느린 편이라 성묘가 되기까지 시간이 더 걸려요." },
};
function BreedInfoModal({ open, onClose, profile, breedDisplayName }) {
  const t = useT();
  const info = BREED_SIZE_INFO[profile.curveKey] || BREED_SIZE_INFO["dog-small"];
  const adultWord = t.adultWord[profile.species];
  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <InfoIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{breedDisplayName}</h3>
      </div>
      <p className="bg-sub" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>{t.breedInfoNotice}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="bg-surface-card" style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px" }}>
          <span className="bg-sub">{t.breedInfoAvgWeight}</span>
          <strong>{fmtKg(profile.avgAdultKg)} {adultWord}</strong>
        </div>
        <div className="bg-surface-card" style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px" }}>
          <span className="bg-sub">{t.breedInfoLifespan}</span>
          <strong>{info.lifespan}</strong>
        </div>
        <div className="bg-surface-card" style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px" }}>
          <span className="bg-sub">{t.breedInfoActivity}</span>
          <strong>{info.activity}</strong>
        </div>
        <div className="bg-surface-card" style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px" }}>
          <span className="bg-sub">{t.breedInfoGrooming}</span>
          <strong>{info.grooming}</strong>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>{info.note}</div>
      </div>
      <button className="bg-btn" style={{ width: "100%", marginTop: 22 }} onClick={onClose}>{t.guideConfirm}</button>
    </Modal>
  );
}

/* ============================================================
   ③ 예방접종 일정 체크리스트 — 반려동물별로 로컬 저장
   ============================================================ */
function VaccineChecklist({ profile, checklist, onToggle }) {
  const t = useT();
  const items = t.vaccineChecklistItems[profile.species];
  const doneCount = items.filter((_, i) => checklist[i]).length;
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckSquareIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
          <h3 style={{ fontSize: 16 }}>{t.vaccineChecklistTitle}</h3>
        </div>
        <span className="bg-sub" style={{ fontSize: 12 }}>{doneCount}/{items.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <label key={i} className="bg-surface-card" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer",
          }}>
            <input type="checkbox" checked={!!checklist[i]} onChange={() => onToggle(i)}
              style={{ width: 18, height: 18, accentColor: "var(--primary)", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textDecoration: checklist[i] ? "line-through" : "none", color: checklist[i] ? "var(--sub)" : "var(--text)" }}>
                {item.age}
              </div>
              <div className="bg-sub" style={{ fontSize: 12, marginTop: 2 }}>{item.label}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="bg-sub" style={{ marginTop: 10, fontSize: 11 }}>{t.vaccineChecklistNote}</div>
    </div>
  );
}

/* ============================================================
   ④ 성장 리포트 공유 카드 — 캔버스로 이미지 생성 (외부 라이브러리 불필요)
   ============================================================ */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderShareCard({ pet, estimate, range, breedDisplayName, lang, t }) {
  const canvas = document.createElement("canvas");
  const W = 1000, H = 950;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 배경
  ctx.fillStyle = "#F1F3E9";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  const pad = 50;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 40);
  ctx.fill();

  // 로고 + 워드마크
  try {
    const logo = await loadImage(PETGROW_LOGO_DATA_URI);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pad + 90, pad + 90, 40, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, pad + 50, pad + 50, 80, 80);
    ctx.restore();
  } catch {}
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Pet", pad + 148, pad + 100);
  ctx.fillStyle = "#4F9D3C";
  ctx.fillText("Grow", pad + 148 + ctx.measureText("Pet").width, pad + 100);

  // 반려동물 사진 (원형)
  const photoCenterX = W / 2;
  const photoY = pad + 170;
  const photoR = 150;
  if (pet.profile.profileImage) {
    try {
      const img = await loadImage(pet.profile.profileImage);
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCenterX, photoY + photoR, photoR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, photoCenterX - photoR, photoY, photoR * 2, photoR * 2);
      ctx.restore();
    } catch {}
  } else {
    ctx.fillStyle = "#F1F3E9";
    ctx.beginPath();
    ctx.arc(photoCenterX, photoY + photoR, photoR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#E3DECF";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(photoCenterX, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.stroke();

  // 이름
  ctx.textAlign = "center";
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 58px sans-serif";
  ctx.fillText(pet.profile.name, photoCenterX, photoY + photoR * 2 + 78);

  // 품종
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#666666";
  ctx.fillText(breedDisplayName, photoCenterX, photoY + photoR * 2 + 122);

  // 예상 체중
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#666666";
  ctx.fillText(t.heroLabel(t.adultWord[pet.profile.species]), photoCenterX, photoY + photoR * 2 + 192);
  ctx.font = "bold 78px sans-serif";
  ctx.fillStyle = "#4F9D3C";
  ctx.fillText(`${range.low.toFixed(1)} ~ ${range.high.toFixed(1)}kg`, photoCenterX, photoY + photoR * 2 + 278);

  ctx.font = "bold 21px sans-serif";
  ctx.fillStyle = "#666666";
  ctx.fillText(t.petgrowTagline, photoCenterX, H - pad - 46);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ShareCardModal({ open, onClose, pet, estimate, range, breedDisplayName }) {
  const lang = useLang();
  const t = useT();
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!open) { setDataUrl(null); return; }
    renderShareCard({ pet, estimate, range, breedDisplayName, lang, t }).then(setDataUrl);
  }, [open, lang]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${pet.profile.name}-petgrow.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${pet.profile.name}-petgrow.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "PetGrow" });
        return;
      }
    } catch {}
    handleDownload();
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>{t.shareCardTitle}</h3>
        <button type="button" className="icon-btn" aria-label={t.cancel} onClick={onClose}>
          <PlusIcon style={{ width: 16, height: 16, color: "var(--sub)", transform: "rotate(45deg)" }} />
        </button>
      </div>
      {dataUrl ? (
        <img src={dataUrl} alt="share card" style={{ width: "100%", borderRadius: 16, marginBottom: 16, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }} />
      ) : (
        <div className="bg-sub" style={{ textAlign: "center", padding: "60px 0" }}>{t.shareCardLoading}</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={handleDownload}>{t.shareCardDownload}</button>
        <button className="bg-btn" style={{ flex: 1 }} onClick={handleShare}>{t.shareCardShare}</button>
      </div>
      <div className="bg-sub" style={{ fontSize: 11, marginTop: 10, textAlign: "center" }}>{t.shareCardManualHint}</div>
    </Modal>
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
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        onClick={() => onChange("dog")}>
        <PawIcon style={{ width: 16, height: 16 }} /> {t.tabDog(dogCount)}
      </button>
      <button className={`bg-chip ${species === "cat" ? "active" : ""}`}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
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

/* ============================================================
   꿀팁 (건강·생활 정보) — 검색 + 카테고리 필터 + 즐겨찾기
   ============================================================ */
const HeartIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 21s-7.5-4.6-10-9.3C.5 8.3 2.3 5 5.7 5c1.9 0 3.5 1 4.3 2.5C10.8 6 12.4 5 14.3 5c3.4 0 5.2 3.3 3.7 6.7C19.5 16.4 12 21 12 21z" />
  </svg>
);
const HeartOutlineIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 21s-7.5-4.6-10-9.3C.5 8.3 2.3 5 5.7 5c1.9 0 3.5 1 4.3 2.5C10.8 6 12.4 5 14.3 5c3.4 0 5.2 3.3 3.7 6.7C19.5 16.4 12 21 12 21z"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
  </svg>
);
const LightbulbIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2zM9.5 19h5v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1z" />
  </svg>
);

/* ============================================================
   꿀팁 콘텐츠 소스 — 구글 시트로 직접 관리할 수 있게 하는 장치
   -----------------------------------------------------------
   아래 TIPS_SHEET_CSV_URL을 채워두면, 코드를 안 건드리고도
   구글 시트만 고쳐서 꿀팁 내용을 바로 바꿀 수 있어요.
   비워두면(기본값) 아래 TIPS_DATA(코드 안 더미 데이터)를 그대로 써요.

   설정 방법:
   1) 구글 시트를 새로 만들고 첫 줄(헤더)에 아래 열 이름을 정확히 입력하세요:
      id, category, title_ko, title_en, summary_ko, summary_en, body_ko, body_en
      - category는 dog / cat / health / life 중 하나
   2) 파일 → 공유 → 웹에 게시(Publish to web) → 형식을 "쉼표로 구분된 값(.csv)"으로 선택 → 게시
   3) 발급된 링크를 복사해서 아래 TIPS_SHEET_CSV_URL에 붙여넣기
   4) 그 다음부터는 시트 내용만 수정하면(저장하면) 앱에도 자동 반영돼요 (별도 배포 필요 없음)
   ============================================================ */
const TIPS_SHEET_CSV_URL = ""; // 예: "https://docs.google.com/spreadsheets/d/xxx/pub?output=csv"

function parseTipsCsv(csvText) {
  const rows = csvText.trim().split("\n").map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
  const [header, ...body] = rows;
  return body
    .filter((row) => row.length >= header.length && row[0])
    .map((row) => {
      const obj = {};
      header.forEach((key, i) => { obj[key] = row[i]; });
      return {
        id: obj.id,
        category: obj.category,
        featured: false,
        title: { ko: obj.title_ko, en: obj.title_en },
        summary: { ko: obj.summary_ko, en: obj.summary_en },
        body: { ko: obj.body_ko, en: obj.body_en },
      };
    });
}

const TIPS_DATA = [
  { id: "t1", category: "dog", featured: true,
    title: { ko: "강아지 산책, 얼마나 해야 할까?", en: "How much should I walk my dog?" },
    summary: { ko: "견종과 체구에 따라 다르지만, 소형견은 하루 20~30분, 활동량 많은 중대형견은 하루 1시간 이상이 참고 기준이에요.", en: "It varies by breed and size, but small dogs generally do well with 20-30 minutes a day, while active medium-large breeds often need an hour or more." },
    body: { ko: "너무 어린 강아지(성장판이 닫히기 전)는 무리한 장거리 산책보다 짧고 자주 나가는 게 관절에 더 좋아요. 더운 날엔 아스팔트 온도를 손등으로 먼저 확인해보는 것도 좋아요.", en: "Very young puppies (before growth plates close) do better with short, frequent walks rather than long ones. On hot days, check the pavement temperature with the back of your hand before heading out." } },
  { id: "t2", category: "cat", featured: true,
    title: { ko: "고양이 화장실 관리 팁", en: "Litter box care tips" },
    summary: { ko: "깨끗한 화장실이 고양이 스트레스를 크게 줄여줘요. 고양이 수 + 1개의 화장실 개수를 참고해보세요.", en: "A clean litter box goes a long way in reducing stress. A common rule of thumb is one box per cat, plus one extra." },
    body: { ko: "모래는 하루 1~2회 배변만 치워주고, 전체 교체는 1~2주에 한 번이 일반적이에요. 화장실 위치를 자주 바꾸면 스트레스를 받을 수 있어요.", en: "Scoop solids once or twice a day, and do a full litter change roughly every 1-2 weeks. Moving the box around often can stress your cat out." } },
  { id: "t3", category: "health", featured: true,
    title: { ko: "여름철 반려동물 건강 관리", en: "Keeping pets healthy in summer" },
    summary: { ko: "더운 날엔 우리 아이도 열사병 위험이 있어요. 그늘·물·서늘한 실내 환경을 꼭 챙겨주세요.", en: "Pets are at risk of heatstroke on hot days too — always make sure they have shade, water, and a cool indoor space." },
    body: { ko: "헐떡임이 평소보다 심하거나 잇몸이 붉어지면 즉시 시원한 곳으로 옮기고 병원에 문의하세요. 차 안에 혼자 두는 건 아주 짧은 시간이라도 위험해요.", en: "If panting seems unusually heavy or the gums look red, move your pet somewhere cool right away and contact a vet. Never leave a pet alone in a car, even briefly." } },
  { id: "t4", category: "dog", featured: false,
    title: { ko: "강아지가 꼬리를 흔드는 진짜 이유는?", en: "What tail wagging really means" },
    summary: { ko: "꼬리를 흔든다고 항상 반가운 건 아니에요. 흔드는 속도와 높이에 따라 감정이 달라요.", en: "A wagging tail doesn't always mean happiness — the speed and height can signal very different emotions." },
    body: { ko: "낮고 느린 꼬리 흔들기는 불안이나 경계일 수 있고, 높고 빠른 흔들기는 흥분·기쁨에 가까워요. 몸 전체 언어를 함께 보는 게 정확해요.", en: "A low, slow wag can signal anxiety or caution, while a high, fast wag is closer to excitement or joy. Reading the whole body helps you interpret it accurately." } },
  { id: "t5", category: "cat", featured: false,
    title: { ko: "고양이가 골골거리는 이유", en: "Why cats purr" },
    summary: { ko: "기분 좋을 때뿐 아니라 아프거나 스트레스 받을 때도 골골거릴 수 있어요.", en: "Cats don't only purr when content — they may also purr when in pain or stressed." },
    body: { ko: "골골송은 자가 진정 효과가 있다는 연구도 있어요. 평소와 다르게 골골거림이 잦아지고 식욕이 줄었다면 건강 체크가 필요해요.", en: "Some research suggests purring may have a self-soothing effect. If purring becomes unusually frequent alongside reduced appetite, it's worth a health check." } },
  { id: "t6", category: "health", featured: false,
    title: { ko: "양치, 얼마나 자주 해줘야 할까?", en: "How often should I brush my pet's teeth?" },
    summary: { ko: "이상적으로는 매일이지만, 주 2~3회만 꾸준히 해도 치석 예방에 큰 도움이 돼요.", en: "Daily is ideal, but even 2-3 times a week consistently makes a big difference in preventing tartar." },
    body: { ko: "반려동물용 치약을 사용하고, 사람용 치약은 절대 쓰지 마세요. 처음엔 손가락 칫솔로 천천히 적응시켜주는 게 좋아요.", en: "Use pet-specific toothpaste and never human toothpaste. Starting with a finger brush to help them get used to it slowly works well." } },
  { id: "t7", category: "life", featured: false,
    title: { ko: "장마철 산책 후 발 관리", en: "Paw care after rainy-season walks" },
    summary: { ko: "젖은 발을 그대로 두면 습진이 생기기 쉬워요. 산책 후엔 발가락 사이까지 꼼꼼히 말려주세요.", en: "Leaving paws wet can lead to skin irritation. Dry thoroughly between the toes after every walk." },
    body: { ko: "마른 수건으로 먼저 물기를 제거하고, 발가락 사이 냄새나 붉어짐이 있는지 확인하는 습관을 들이면 좋아요.", en: "Pat dry with a towel first, and get in the habit of checking between the toes for odor or redness." } },
  { id: "t8", category: "life", featured: false,
    title: { ko: "이사 후 반려동물 적응시키기", en: "Helping your pet adjust after moving" },
    summary: { ko: "새 공간에 대한 불안은 자연스러운 반응이에요. 익숙한 담요·장난감을 먼저 놓아주세요.", en: "Anxiety about a new space is completely normal. Set out familiar blankets and toys first." },
    body: { ko: "며칠간은 방 하나만 먼저 개방하고 점차 넓혀가는 게 좋고, 사료·화장실 위치는 최대한 빨리 고정해주는 게 안정에 도움이 돼요.", en: "Opening up just one room at first and gradually expanding helps, and settling on a fixed spot for food and litter/potty as soon as possible aids adjustment." } },
  { id: "t9", category: "dog", featured: false,
    title: { ko: "초코릿, 왜 강아지에게 위험할까?", en: "Why chocolate is dangerous for dogs" },
    summary: { ko: "테오브로민 성분을 강아지는 잘 분해하지 못해서 소량도 위험할 수 있어요.", en: "Dogs can't metabolize theobromine well, so even a small amount can be dangerous." },
    body: { ko: "다크초콜릿일수록 더 위험해요. 섭취를 의심되면 양과 시간을 기록해두고 바로 동물병원에 연락하세요.", en: "Darker chocolate is more dangerous. If ingestion is suspected, note the amount and time, and contact a vet immediately." } },
  { id: "t10", category: "cat", featured: false,
    title: { ko: "고양이 스크래처, 왜 필요할까?", en: "Why cats need a scratching post" },
    summary: { ko: "발톱 관리뿐 아니라 스트레스 해소와 영역 표시 본능이기도 해요.", en: "It's not just for claw maintenance — it's also a way to relieve stress and mark territory." },
    body: { ko: "가구를 긁는다면 혼내기보다 스크래처 위치를 잘 보이는 동선에 놓아주는 게 훨씬 효과적이에요.", en: "If they're scratching furniture, placing a scratching post along a visible, frequently-used path works far better than scolding." } },
  { id: "t11", category: "health", featured: false,
    title: { ko: "겨울철 관절 관리, 이렇게 도와주세요", en: "Supporting joints through winter" },
    summary: { ko: "추운 날씨는 관절 통증을 더 심하게 느끼게 할 수 있어요. 산책 전 가벼운 스트레칭이 도움이 돼요.", en: "Cold weather can make joint pain feel worse. A light warm-up before walks can help." },
    body: { ko: "미끄러운 바닥엔 매트를 깔아주고, 노령 반려동물은 산책 시간을 짧게 여러 번 나누는 게 좋아요.", en: "Add mats to slippery floors, and for senior pets, splitting walks into shorter, more frequent sessions helps." } },
  { id: "t12", category: "life", featured: false,
    title: { ko: "새 식구 소개, 천천히가 정답이에요", en: "Introducing a new pet — slow and steady wins" },
    summary: { ko: "기존 아이와 새 아이를 처음부터 한 공간에 두면 스트레스가 커질 수 있어요.", en: "Putting a resident pet and a newcomer together right away can cause a lot of stress." },
    body: { ko: "냄새 교환부터 시작해서 짧은 시간 함께 있어보는 식으로 점진적으로 늘려가는 게 안전해요.", en: "Start with scent-swapping, then gradually increase short supervised time together." } },
  { id: "t13", category: "dog", featured: false,
    title: { ko: "강아지 사회화, 언제가 적기일까?", en: "The best window for puppy socialization" },
    summary: { ko: "생후 3~14주가 사회화에 특히 중요한 시기로 알려져 있어요.", en: "Weeks 3-14 are considered an especially important window for socialization." },
    body: { ko: "접종이 다 끝나지 않았어도 안는 상태로 다양한 소리·사람을 접하게 해주는 것부터 시작할 수 있어요.", en: "Even before vaccinations are complete, you can start by carrying them to safely expose them to different sounds and people." } },
  { id: "t14", category: "cat", featured: false,
    title: { ko: "고양이 물그릇, 이렇게 두면 더 잘 마셔요", en: "Placing water bowls cats actually use" },
    summary: { ko: "밥그릇과 물그릇을 붙여두면 오히려 안 마시는 고양이도 있어요.", en: "Some cats drink less when the water bowl sits right next to the food bowl." },
    body: { ko: "밥자리와 떨어진 조용한 곳에 물그릇을 여러 개 두면 음수량이 늘어나는 경우가 많아요.", en: "Placing several water bowls in quiet spots away from the food area often increases water intake." } },
];

function TipCard({ tip, lang, bookmarked, onToggleBookmark }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const categoryLabel = t.tipCategoryLabels[tip.category];
  return (
    <div className="bg-surface-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
          <span className="bg-sub" style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{categoryLabel}</span>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{tip.title[lang]}</div>
          <div className="bg-sub" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{tip.summary[lang]}</div>
        </div>
        <button type="button" onClick={() => onToggleBookmark(tip.id)} aria-label={t.tipBookmarkAria}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
          {bookmarked
            ? <HeartIcon style={{ width: 22, height: 22, color: "var(--primary)" }} />
            : <HeartOutlineIcon style={{ width: 22, height: 22, color: "var(--sub)" }} />}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.7 }}>
          {tip.body[lang]}
        </div>
      )}
    </div>
  );
}

function TipsPage({ onClose }) {
  const lang = useLang();
  const t = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [tipsSource, setTipsSource] = useState(TIPS_DATA);

  useEffect(() => {
    (async () => {
      const saved = await safeGet("bboggl:tipBookmarks");
      if (saved) setBookmarks(saved);
    })();
  }, []);

  useEffect(() => {
    if (!TIPS_SHEET_CSV_URL) return;
    (async () => {
      try {
        const res = await fetch(TIPS_SHEET_CSV_URL);
        const text = await res.text();
        const parsed = parseTipsCsv(text);
        if (parsed.length > 0) setTipsSource(parsed);
      } catch {
        // 시트를 못 불러오면 코드 안 기본 데이터를 그대로 써요
      }
    })();
  }, []);

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      safeSet("bboggl:tipBookmarks", next);
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const filtered = tipsSource.filter((tip) => {
    if (showBookmarked && !bookmarks.includes(tip.id)) return false;
    if (category !== "all" && tip.category !== category) return false;
    if (q && !(tip.title[lang].toLowerCase().includes(q) || tip.summary[lang].toLowerCase().includes(q))) return false;
    return true;
  });
  // 매일 조금씩 바뀌는 "오늘의 추천" — 날짜 기반으로 자동 로테이션돼요 (별도 관리 필요 없음)
  const featured = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const n = tipsSource.length;
    if (n === 0) return [];
    return [0, 1, 2].map((i) => tipsSource[(dayIndex + i) % n]);
  }, [tipsSource]);

  const categories = [
    { id: "all", name: t.tipCategoryLabels.all },
    { id: "dog", name: t.tipCategoryLabels.dog },
    { id: "cat", name: t.tipCategoryLabels.cat },
    { id: "health", name: t.tipCategoryLabels.health },
    { id: "life", name: t.tipCategoryLabels.life },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <LightbulbIcon style={{ width: 22, height: 22, color: "var(--primary)" }} />
        <h1 style={{ fontSize: 18 }}>{t.tipsTitle}</h1>
      </div>

      <div className="combobox-wrap" style={{ marginBottom: 14 }}>
        <SearchIcon style={{ width: 16, height: 16, color: "var(--sub)", position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input className="bg-input" style={{ paddingLeft: 38 }} value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t.tipSearchPlaceholder} />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
        {categories.map((c) => (
          <button key={c.id} className={`bg-chip ${category === c.id && !showBookmarked ? "active" : ""}`}
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            onClick={() => { setCategory(c.id); setShowBookmarked(false); }}>
            {c.name}
          </button>
        ))}
        <button className={`bg-chip ${showBookmarked ? "active" : ""}`}
          style={{ whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
          onClick={() => setShowBookmarked((v) => !v)}>
          <HeartIcon style={{ width: 14, height: 14 }} /> {t.tipBookmarkedFilter}
        </button>
      </div>

      {!showBookmarked && !q && category === "all" && featured.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>{t.tipFeaturedTitle}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {featured.map((tip) => (
              <TipCard key={tip.id} tip={tip} lang={lang} bookmarked={bookmarks.includes(tip.id)} onToggleBookmark={toggleBookmark} />
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>
        {showBookmarked ? t.tipBookmarkedFilter : t.tipAllTitle}
      </h3>
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((tip) => (
            <TipCard key={tip.id} tip={tip} lang={lang} bookmarked={bookmarks.includes(tip.id)} onToggleBookmark={toggleBookmark} />
          ))}
        </div>
      ) : (
        <div className="bg-sub" style={{ textAlign: "center", padding: "30px 0", fontSize: 13 }}>{t.tipEmptyResult}</div>
      )}
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
function ResultPage({ pet, breedGroups, onAddRecord, onAddPhoto, onEditPhoto, onDeletePhoto, onEdit, onDelete, onUpdateProfileImage, onToggleVaccineItem }) {
  const lang = useLang();
  const t = useT();
  const { profile, records, photos } = pet;
  const [now] = useState(() => new Date());
  const ageMonthsNow = monthsBetween(new Date(profile.birthDate), now);
  const allBreedsFlat = useMemo(() => breedGroups.flatMap((g) => g.breeds), [breedGroups]);
  const breedDisplayName = getBreedDisplayName(profile, allBreedsFlat, lang);
  const avatarInputRef = useRef(null);
  const [breedInfoOpen, setBreedInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handlePickAvatar = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onUpdateProfileImage(dataUrl);
    e.target.value = "";
  };

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
  const range = predictionRange(estimate);
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div className="profile-header">
          <div className="profile-header-avatar" onClick={() => avatarInputRef.current && avatarInputRef.current.click()}>
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} />
            ) : profile.species === "cat" ? (
              <CatIcon style={{ width: 46, height: 46, color: "var(--sub)" }} />
            ) : (
              <PawIcon style={{ width: 46, height: 46, color: "var(--sub)" }} />
            )}
            <span className="avatar-edit-badge"><EditIcon /></span>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickAvatar} />
          </div>
          <div>
            <div className="profile-header-name">{profile.name}</div>
            <button type="button" onClick={() => setBreedInfoOpen(true)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
              <div className="profile-header-meta" style={{ textDecoration: "underline" }}>
                {breedDisplayName} · {t.profileHeaderBirth(formatBirthDate(profile.birthDate, lang))}
              </div>
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bg-btn bg-btn-ghost" onClick={onEdit}>{t.editBtn}</button>
          <button className="bg-btn bg-btn-ghost" onClick={onDelete}>{t.deleteBtn}</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <AdultWeightHero profile={profile} estimate={estimate} ageMonths={ageMonthsNow} breedDisplayName={breedDisplayName} />
        <button type="button" className="bg-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => setShareOpen(true)}>
          <ShareIcon style={{ width: 16, height: 16 }} /> {t.shareCardBtn}
        </button>
        <GrowthChartCard table={table} ageMonths={ageAtLatest} currentWeightKg={latest.weightKg} statusDiffGrams={latest.diffGrams} />
        <GrowthTableCard table={table} />
        <RecordSection records={sortedRecords} onAddRecord={handleAddRecord} />
        <MilestoneBadges pet={pet} ageMonths={ageMonthsNow} />
        <PeerCompareCard profile={profile} latestWeightKg={latest.weightKg} ageAtLatest={ageAtLatest} />
        <PhotoAlbum birthDate={profile.birthDate} photos={photos} onAdd={onAddPhoto} onEdit={onEditPhoto} onDelete={onDeletePhoto} />
        <VaccineChecklist profile={profile} checklist={pet.vaccineChecklist || {}} onToggle={onToggleVaccineItem} />
        <InfoAccordion profile={profile} latestWeightKg={latest.weightKg} ageAtLatest={ageAtLatest} />
      </div>

      <BreedInfoModal open={breedInfoOpen} onClose={() => setBreedInfoOpen(false)} profile={profile} breedDisplayName={breedDisplayName} />
      <ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} pet={pet} estimate={estimate} range={range} breedDisplayName={breedDisplayName} />
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
        <polyline points="0,58 40,50 80,40 120,34 160,24 200,16 240,10" fill="none" stroke="#4F9D3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="240" cy="10" r="5" fill="#4F9D3C" />
        <circle cx="120" cy="34" r="4" fill="#1C1C1C" />
      </svg>
    </div>
  );
}
function MiniAlbumCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-label">성장앨범</div>
      <div className="mock-photos">
        <div className="mock-photo"><PawIcon style={{ width: 22, height: 22, color: "#4F9D3C" }} /></div>
        <div className="mock-photo mock-photo-alt"><CatIcon style={{ width: 22, height: 22, color: "#1C1C1C" }} /></div>
        <div className="mock-photo"><CameraIcon style={{ width: 20, height: 20, color: "#4F9D3C" }} /></div>
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
        <div className="mock-checklist-icon"><BowlIcon style={{ width: 16, height: 16, color: "#4F9D3C" }} /></div>
        <div className="mock-checklist-text">사료 급여량 참고</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ShieldIcon style={{ width: 16, height: 16, color: "#4F9D3C" }} /></div>
        <div className="mock-checklist-text">예방접종·건강관리</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ScaleIcon style={{ width: 16, height: 16, color: "#4F9D3C" }} /></div>
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
            <PetGrowLogo style={{ width: 78, height: 78 }} />
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
            <div className="cat-badge"><CatIcon style={{ width: 60, height: 60, color: "#4F9D3C" }} /></div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-about">
            <div className="landing-about-icon">
              <PetGrowLogo style={{ width: 52, height: 52 }} />
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
            <PetGrowLogo style={{ width: 18, height: 18 }} />
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

/* ============================================================
   소개 페이지 — 로고를 누르면 보이는 사업 설명 화면 (히어로 + 단계 + 기능 쇼케이스 + 신뢰 배지)
   ============================================================ */
function AboutPage({ onStart }) {
  const t = useT();
  return (
    <div className="landing-root">
      <section className="landing-section landing-hero-section">
        <div className="landing-wrap">
          <div className="landing-logo-badge about-logo-float">
            <PetGrowLogo style={{ width: 96, height: 96 }} />
          </div>

          <h1 className="landing-headline about-fade" style={{ animationDelay: ".1s" }}>
            {t.landingHeadline1} <span className="hl">{t.landingHeadlineHighlight}</span>{t.landingHeadline2}
          </h1>
          <p className="landing-subtitle about-fade" style={{ animationDelay: ".22s" }}>{t.landingSubtitle}</p>
          <button className="landing-cta about-fade" style={{ animationDelay: ".34s" }} onClick={onStart}>{t.landingCta}</button>

          <div className="landing-illustration about-fade" style={{ animationDelay: ".46s" }}>
            <div className="paw-badge"><PawIcon style={{ width: 60, height: 60, color: "#3a3a3a" }} /></div>
            <div className="cat-badge"><CatIcon style={{ width: 60, height: 60, color: "#4F9D3C" }} /></div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-about about-fade">
            <div className="landing-about-icon">
              <PetGrowLogo style={{ width: 52, height: 52 }} />
            </div>
            <h2 className="landing-section-title" style={{ marginBottom: 0 }}>{t.landingAboutTitle}</h2>
            <p className="landing-about-text">{t.landingAboutBody}</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title about-fade">{t.landingHowTitle}</h2>
          <div className="landing-steps">
            <div className="landing-step about-fade" style={{ animationDelay: ".1s" }}>
              <div className="landing-step-num">1</div>
              <div className="landing-step-title">{t.landingStep1Title}</div>
              <div className="landing-step-desc">{t.landingStep1Desc}</div>
            </div>
            <div className="landing-step about-fade" style={{ animationDelay: ".22s" }}>
              <div className="landing-step-num">2</div>
              <div className="landing-step-title">{t.landingStep2Title}</div>
              <div className="landing-step-desc">{t.landingStep2Desc}</div>
            </div>
            <div className="landing-step about-fade" style={{ animationDelay: ".34s" }}>
              <div className="landing-step-num">3</div>
              <div className="landing-step-title">{t.landingStep3Title}</div>
              <div className="landing-step-desc">{t.landingStep3Desc}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-white">
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

      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-trust">
            <span className="landing-trust-item"><ShieldIcon style={{ width: 14, height: 14 }} />{t.landingTrust1}</span>
            <span className="landing-trust-item"><PlusIcon style={{ width: 14, height: 14 }} />{t.landingTrust2}</span>
            <span className="landing-trust-item"><LeafIcon style={{ width: 14, height: 14 }} />{t.landingTrust3}</span>
            <span className="landing-trust-item"><InfoIcon style={{ width: 14, height: 14 }} />{t.landingTrust4}</span>
          </div>
          <button className="landing-cta" style={{ marginTop: 32 }} onClick={onStart}>{t.landingCta}</button>
        </div>
      </section>
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
  const [showTips, setShowTips] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} | null

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
      vaccineChecklist: {},
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

  const handleUpdateProfileImage = (dataUrl) => {
    const nextList = currentList.map((p) => (p.id === currentPet.id ? { ...p, profile: { ...p.profile, profileImage: dataUrl } } : p));
    persistPets({ ...pets, [species]: nextList });
  };

  const handleToggleVaccineItem = (index) => {
    const nextList = currentList.map((p) => {
      if (p.id !== currentPet.id) return p;
      const nextChecklist = { ...(p.vaccineChecklist || {}) };
      nextChecklist[index] = !nextChecklist[index];
      return { ...p, vaccineChecklist: nextChecklist };
    });
    persistPets({ ...pets, [species]: nextList });
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

  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={() => { setShowAbout(true); setShowTips(false); setShowPrivacy(false); scrollToTop(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <PetGrowLogo style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
              <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
            </span>
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="bg-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 40,
              ...(!showTips && !showPrivacy && !showAbout ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}) }}
              onClick={() => { setShowTips(false); setShowPrivacy(false); setShowAbout(false); scrollToTop(); }}>
              <PawIcon style={{ width: 16, height: 16 }} /> {t.myPetsNav}
            </button>
            <button type="button" className="bg-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 40,
              ...(showTips && !showPrivacy ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}) }}
              onClick={() => { setShowTips(true); setShowPrivacy(false); setShowAbout(false); scrollToTop(); }}>
              <LightbulbIcon style={{ width: 16, height: 16 }} /> {t.tipsTitle}
            </button>
            <LangToggle lang={lang} onChange={setLang} />
            <button type="button" className="icon-btn" aria-label={t.helpAria}
              onClick={() => setGuideOpen(true)}>
              <HelpIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
            </button>
          </div>
        </div>
        {!showTips && !showPrivacy && !showAbout && (
          <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}
            onChange={(s) => { setSpecies(s); setMode("view"); }} />
        )}
      </div>

      {showPrivacy ? (
        <PrivacyContent />
      ) : showAbout ? (
        <AboutPage onStart={() => { setShowAbout(false); scrollToTop(); }} />
      ) : showTips ? (
        <TipsPage />
      ) : showOnboarding ? (
        <OnboardingPage
          species={species}
          breedGroups={breedGroups} sizeOptions={sizeOptions}
          initialValues={mode === "edit" ? currentPet.profile : null}
          onSubmit={mode === "edit" ? handleEditProfile : handleAddPet}
          onCancel={currentPet ? () => setMode("view") : null}
        />
      ) : (
        <>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
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
            onUpdateProfileImage={handleUpdateProfileImage}
            onToggleVaccineItem={handleToggleVaccineItem}
          />
        </>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" }}>
        <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
          {t.privacyFooter}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
          <button type="button" onClick={() => { setShowPrivacy(true); setShowTips(false); setShowAbout(false); scrollToTop(); }}
            style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {t.privacyFooterLink}
          </button>
          <a href="mailto:help.petgrow@gmail.com" style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
            {t.contactBtn}
          </a>
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
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPrivacyPage = path === "/privacy" || path === "/privacy/";
  return (
    <LangContext.Provider value={lang}>
      {isPrivacyPage ? <PrivacyPage /> : <AppInner lang={lang} setLang={setLang} />}
    </LangContext.Provider>
  );
}
