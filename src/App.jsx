import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Label,
} from "recharts";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";
import { SplashScreen } from "@capacitor/splash-screen";

// AdMob 앱/광고 단위 ID — 실제 앱(Android/iOS)에서만 동작해요, 웹사이트에서는 광고가 안 떠요
const ADMOB_ANDROID_APP_ID = "ca-app-pub-9699974051273244~1293517862";
const ADMOB_BANNER_ID = "ca-app-pub-9699974051273244/9809518314";
// 개발 중 테스트할 때는 실제 광고 대신 구글 공식 테스트 ID를 쓰는 게 안전해요(실수로 자기 광고를 클릭하면 계정 정지 위험이 있어요).
// 테스트하려면 아래 줄의 주석을 풀고, 위 ADMOB_BANNER_ID 대신 이 값을 쓰세요.
// const ADMOB_BANNER_ID_TEST = "ca-app-pub-3940256099942544/6300978111";

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
    privacyFooter: "카카오 계정으로 로그인하면 등록한 우리 아이 정보는 로그인한 계정에 안전하게 저장되고, 다른 기기에서도 로그인만 하면 그대로 불러올 수 있어요.",
    cancel: "취소",
    helpAria: "이용 가이드 보기",
    hamMenuAria: "메뉴 열기",
    hamCloseAria: "메뉴 닫기",
    hamNavHome: "홈",
    aboutNav: "소개",
    hamNavMy: "MY",
    hamNavSettings: "설정",
    appTabPetInfo: "Pet정보",
    appTabPetContent: "Pet콘텐츠",
    contentTabAll: "전체",
    confirmDeleteTitle: "정말 삭제할까요?",
    confirmDeleteMsg: (name) => `${name}의 모든 기록·사진이 사라지고 되돌릴 수 없어요.`,
    confirmDeleteBtn: "삭제",
    guideTitle: "이용 가이드",
    guideConfirm: "확인했어요",
    privacyTitle: "개인정보처리방침",
    privacyIntro: "PetGrow(이하 \"서비스\")는 이용자의 개인정보를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을 준수하기 위해 노력합니다. 본 개인정보처리방침은 PetGrow 웹사이트 및 모바일 애플리케이션에 적용됩니다.",
    termsTitle: "이용약관",
    termsIntro: "본 약관은 PetGrow가 제공하는 웹사이트, 모바일 애플리케이션 및 관련 서비스의 이용조건과 PetGrow 및 이용자의 권리·의무·책임사항을 정합니다.",
    contactBtn: "문의하기",
    contactFallback: "메일 앱이 안 열리면 help.petgrow@gmail.com으로 직접 보내주세요. 기능 개선 제안이나 버그 제보도 언제든 환영이에요!",
    feedbackBtn: "개선 요청하기",
    tipsTitle: "Pet꿀팁",
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
    optional: "선택",
    sajuNav: "Pet사주",
    petBtiNav: "PetBTI",
    petBtiMainTitle: "우리 아이는 어떤 성격일까?",
    petBtiMainDesc: "평소 행동 몇 가지만 알려주세요.\nPetGrow가 우리 아이의 성격 유형을 찾아드릴게요 🐶💕",
    petBtiStartBtn: "PetBTI 시작하기 🐾",
    petBtiRestartBtn: "다시 테스트하기",
    petBtiNoPet: "먼저 '우리 아이'에 반려동물을 등록해주세요.",
    petBtiPreviousResult: (name) => `${name}의 저장된 PetBTI`,
    petBtiResultHeading: (name) => `${name}의 PetBTI는?`,
    petBtiStatsTitle: "PetBTI 능력치",
    petBtiStatAffection: "애교력", petBtiStatCuriosity: "호기심", petBtiStatFood: "먹방력",
    petBtiStatSocial: "친화력", petBtiStatControl: "집사조종력",
    petBtiSectionTitle: {
      personality: "기본 성격", bond: "보호자와의 관계", friends: "친구 관계", play: "놀이 스타일", walk: "산책 스타일",
      food: "간식 앞에서는?", alone: "혼자 있을 때", mischief: "사고뭉치 모먼트", affection: "애정 표현법", hidden: "숨겨진 매력",
    },
    petBtiOneWordTitle: (name) => `${name}를 한마디로 표현하면?`,
    petBtiCompatTitle: (name) => `💕 ${name}와 잘 맞는 친구`,
    petBtiCompatGood: (name) => `${name}에게 없는 매력을 가진 상대라, 서로 다른 점이 오히려 좋은 케미가 될 수 있어요. 함께 있으면 서로의 부족한 부분을 자연스럽게 채워줄 가능성이 높아요.`,
    petBtiCompatChaosTitle: "만나면 정신없는 조합",
    petBtiCompatChaos: (name) => `${name}와 성향이 아주 비슷한 친구예요. 만나면 둘 다 신나서 정신없이 놀 수도 있어요 — 나쁘다는 게 아니라 그만큼 텐션이 두 배가 된다는 뜻이에요 😆`,
    petBtiShareBtn: "내 PetBTI 공유하기 🐾",
    petBtiShareTitle: "PetBTI 카드 공유",
    petBtiShareHeading: (name) => `${name}의 PetBTI`,
    petBtiDisclaimer: "재미로 알아보는 PetGrow 반려동물 성격 테스트예요. 행동학적·의학적 진단을 대신하지 않아요.",
    sajuFormTitle: "우리 아이 사주 🐾",
    sajuFormSub: "정보를 입력하면 재미로 보는 우리 아이 운명을 알려드려요.",
    sajuNameLabel: "이름",
    sajuNamePlaceholder: "몽치",
    sajuSpeciesLabel: "강아지 / 고양이",
    sajuBirthLabel: "생년월일",
    sajuGenderLabel: "성별",
    sajuTimeLabel: "태어난 시간",
    sajuBreedLabel: "품종",
    sajuBreedPlaceholder: "말티즈",
    sajuGenerateBtn: "우리 아이 운명 알아보기 🐾",
    sajuErrName: "이름을 입력해주세요",
    sajuErrBirth: "생년월일을 입력해주세요",
    sajuIntroTitle: (name) => `${name}의 사주를 볼까요?`,
    sajuNeedPetTitle: "등록된 아이가 아직 없어요",
    sajuNeedPetBody: "Pet사주는 '우리 아이'에 등록한 반려동물만 볼 수 있어요. 먼저 반려동물을 등록해주세요.",
    sajuGoRegisterBtn: "우리 아이 등록하러 가기",
    sajuIntroSub: "등록된 정보로 바로 결과를 볼 수 있어요.",
    sajuUseOtherInfo: "다른 정보로 보기",
    sajuResultHeading: (name) => `${name}의 타고난 운명`,
    sajuCategoryTitle: {
      personality: "타고난 성격", bond: "보호자와의 인연", friends: "친구 관계", food: "먹을 복",
      play: "놀이·산책 스타일", affection: "애교 스타일", mischief: "사고뭉치 지수", luck: "타고난 복",
    },
    sajuOneWordTitle: (name) => `${name}를 한마디로 표현하면?`,
    sajuTodayTitle: "오늘의 한마디",
    sajuShareBtn: "우리 아이 사주 공유하기",
    sajuShareTitle: "사주 카드 공유",
    sajuShareHeading: (name) => `${name}의 타고난 운명`,
    sajuComingCompat: "보호자와 궁합 보기",
    sajuComingDaily: "오늘의 운세 보기",
    sajuComingSoon: "곧 만나요! 준비 중이에요",
    sajuRestartBtn: "다시 보기",
    sajuDisclaimer: "재미로 보는 PetGrow 콘텐츠예요 🐾 실제 성격이나 미래를 판단하는 자료가 아니에요.",
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
      { title: "9. 성장 그래프 읽는 법", body: "빨간 점이 우리 아이의 현재 위치예요. 연두색 밴드는 참고용 정상 범위(예상치의 ±15%)이고, 이 범위를 벗어나면 그래프에 세로선과 경고 문구가 함께 떠요." },
    ],
    infoGuideTitle: "정보가이드",
    infoGuideIntro: "PetGrow의 기능을 처음이라도 쉽게 따라 할 수 있도록 정리했어요.",
    infoGuideSections: [
      { title: "카카오 간편로그인", body: "PetGrow는 카카오 계정 하나로 간편하게 로그인해요. 별도 회원가입이나 비밀번호 없이 '카카오로 시작하기' 버튼만 누르면 돼요." },
      { title: "우리 아이 등록", body: "이름·종류·품종·생년월일·현재 체중을 입력하면 예상 성체 체중과 성장 그래프가 바로 나와요. 대표 사진도 등록할 수 있어요." },
      { title: "여러 반려동물 관리", body: "강아지·고양이를 나눠서 각각 여러 마리까지 등록할 수 있어요. 사진과 이름으로 아이를 선택하면 그 아이 기준으로 모든 결과가 표시돼요." },
      { title: "계정 저장 · 다른 기기에서 정보 불러오기", body: "등록한 우리 아이 정보는 로그인한 카카오 계정에 안전하게 저장돼요. 다른 기기나 웹에서도 같은 카카오 계정으로 로그인하면 그대로 이어서 볼 수 있어요." },
      { title: "성장정보", body: "체중을 기록할 때마다 예상보다 빠르게 크는지 느리게 크는지 자동으로 비교해주고, 사진을 모아 성장앨범도 만들 수 있어요." },
      { title: "Pet사주", body: "등록한 우리 아이의 정보를 바탕으로 성격·궁합·행운 같은 재미있는 사주 콘텐츠를 볼 수 있어요. 결과는 참고와 재미를 위한 것이에요." },
      { title: "오늘의 운세 · 보호자와 궁합", body: "오늘의 기분·활력·행운 포인트와 보호자와 보내기 좋은 시간을 알려줘요. 같은 아이는 같은 날짜에 항상 같은 결과가 나와요." },
      { title: "PetBTI", body: "몇 가지 질문에 답하면 우리 아이만의 16가지 성격 유형이 나와요. 강아지와 고양이 각각에 맞는 질문으로 진행돼요." },
      { title: "PetBTI 결과 저장", body: "완료한 결과는 자동으로 저장돼서 'PetBTI 결과 보기'로 언제든 다시 볼 수 있고, '다시 검사하기'로 새로 진행할 수도 있어요." },
      { title: "Pet꿀팁", body: "건강관리·식단영양·행동훈련·성장생활·안전상식 다섯 카테고리, 총 50개의 꿀팁을 확인할 수 있어요. 검색창에서는 전체 꿀팁을 대상으로 검색돼요." },
      { title: "Pet톡", body: "우리 아이 사진과 일상을 다른 회원과 나누는 커뮤니티예요. 등록한 반려동물 중 하나를 선택해서 글을 남기고, 다른 아이들의 이야기에 좋아요·댓글을 남길 수 있어요. 부적절한 게시물은 신고할 수 있어요." },
      { title: "검색", body: "Pet꿀팁 화면 상단 검색창에 원하는 키워드를 입력하면 현재 페이지가 아닌 전체 50개 꿀팁 중에서 찾아줘요." },
      { title: "로그아웃", body: "우측 상단 계정 버튼을 누르면 로그아웃할 수 있어요. 로그아웃해도 서버에 저장된 정보는 삭제되지 않고, 다시 로그인하면 그대로 남아있어요." },
      { title: "회원탈퇴", body: "계정 설정에서 회원탈퇴를 진행하면 반려동물 정보·사진·PetBTI 결과·Pet톡 게시글과 댓글 등 계정에 연결된 데이터가 함께 삭제돼요. 삭제 후에는 복구할 수 없어요." },
    ],
    migrationTitle: "기존에 등록한 우리 아이 정보가 있어요 🐾",
    migrationBody: "이 정보를 내 PetGrow 계정에 저장할까요? 저장하면 다른 기기에서도 로그인만 하면 이어서 볼 수 있어요.",
    migrationLater: "나중에",
    migrationConfirm: "내 계정에 저장하기",
    migrationSaving: "저장 중...",
    deleteAccountPageTitle: "회원탈퇴",
    deleteAccountPageBody: "회원탈퇴를 진행하면 관계 법령에 따라 별도로 보관해야 하는 정보를 제외하고 아래 데이터가 삭제되며, 삭제 후에는 복구할 수 없어요.",
    deleteAccountItems: [
      "PetGrow 계정 및 카카오 인증 연동 정보",
      "등록한 반려동물 정보와 프로필 사진",
      "성장 기록 등 저장된 데이터",
      "PetBTI 결과",
      "Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진",
      "기타 계정에 연결된 저장 정보 및 로그인 세션",
    ],
    deleteAccountLoggedInAs: (name) => `현재 ${name} 계정으로 로그인되어 있어요.`,
    deleteAccountNeedLogin: "회원탈퇴를 진행하려면 먼저 카카오 계정으로 로그인해주세요.",
    deleteAccountEmailFallback: "카카오 계정으로 로그인할 수 없는 경우 help.petgrow@gmail.com 으로 문의해주시면 확인 후 처리해드릴게요.",
    deleteAccountConfirmTitle: "정말 탈퇴하시겠어요?",
    deleteAccountConfirmBody: "탈퇴하면 계정과 반려동물 정보가 모두 삭제되며 되돌릴 수 없어요.",
    deleteAccountDoneTitle: "탈퇴가 완료됐어요",
    deleteAccountDoneBody: "그동안 PetGrow를 이용해주셔서 감사해요. 계정과 관련 정보가 모두 삭제됐어요.",
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
    chartLegend: "진한 점 = 현재 위치",
    chartBandLegend: "연두색 밴드 = 참고용 정상 범위 (예상치의 ±15%)",
    chartOutsideBand: "⚠ 현재 체중이 정상 범위를 벗어났어요. 건강이 걱정되시면 수의사와 상담해보세요.",
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
    recordDeleteBtn: "삭제",
    recordDeleteTitle: "기록을 삭제할까요?",
    recordDeleteMsg: (date, weight) => `${date} · ${weight}kg 기록을 삭제해요. 이 작업은 되돌릴 수 없어요.`,
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
    photoSaveError: "사진을 저장하지 못했어요. 파일이 너무 크거나 저장 공간이 부족할 수 있어요. 다른 사진으로 다시 시도해주세요.",
    albumEmpty: "아직 등록된 사진이 없어요. 첫 사진을 남겨보세요!",
    photoCountLabel: (n) => `${n}장`,
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
    reportTitle: (name) => `${name}의 성장 리포트`,
    editBtn: "정보 수정",
    deleteBtn: "삭제",
    footerNote1: "AI 챗봇, 지도, 실제 푸시 알림처럼",
    footerNoteStrong: "API 키·백엔드가 필요한 기능",
    footerNote2: "은 원하실 때 말씀해주시면 순서대로 붙여드릴게요.",
    accountLoginBtn: "로그인",
    accountLogoutBtn: "로그아웃",
    accountDeleteBtn: "회원탈퇴",
    accountSettingsBtn: "계정 설정",
    accountSettingsTitle: "계정 설정",
    accountKakaoTag: "카카오 계정으로 로그인됨",
    loginToastSuccess: "로그인됐어요",
    loginToastError: "로그인에 실패했어요. 다시 시도해주세요.",
    communityNav: "Pet톡",
    communityCategoryAll: "전체",
    communityCategoryLabels: { daily: "일상", brag: "자랑", question: "질문", health: "건강·식단", info: "정보공유" },
    communitySortLatest: "최신순",
    communitySortPopular: "인기순",
    communitySearchPlaceholder: "제목이나 내용으로 검색해보세요",
    communityWriteBtn: "글쓰기",
    communityEmptyFeed: "아직 게시글이 없어요. 첫 글을 남겨보세요 🐾",
    communityLoadMore: "더 보기",
    communityLoading: "불러오는 중...",
    communityHealthNotice: "회원이 작성한 내용은 개인적인 경험이나 의견일 수 있어요. 반려동물의 건강 문제는 반드시 수의사와 상담해주세요.",
    communityNeedPetTitle: "등록된 아이가 있어야 글을 쓸 수 있어요",
    communityNeedPetBody: "Pet톡은 '우리 아이'에 등록한 반려동물과 함께 글을 남기는 공간이에요. 먼저 반려동물을 등록해주세요.",
    communityComposeTitlePet: "함께 표시할 아이",
    communityComposeTitleCategory: "카테고리",
    communityComposeVisibility: "공개 설정",
    communityComposeVisibilityPublicHelp: "모든 PetGrow 이용자가 볼 수 있어요.",
    communityComposeVisibilityPrivateHelp: "나만 볼 수 있어요. MY 페이지에서는 확인할 수 있어요.",
    communityComposeTitleTitle: "제목",
    communityComposeTitlePlaceholder: "제목을 입력해주세요",
    communityComposeTitleContent: "내용",
    communityComposeContentPlaceholder: "우리 아이 이야기를 들려주세요",
    communityComposePhotos: (n) => `사진 (최대 5장, ${n}/5)`,
    communityComposeSubmit: "등록하기",
    communityComposeSubmitEdit: "수정 완료",
    communityComposeUploading: "업로드 중...",
    communityComposeErrTitle: "제목을 입력해주세요",
    communityComposeErrContent: "내용을 입력해주세요",
    communityComposeErrPet: "함께할 아이를 선택해주세요",
    communityBack: "뒤로",
    communityEditBtn: "수정",
    communityDeleteBtn: "삭제",
    communityVisibilityPublic: "공개",
    communityVisibilityPrivate: "비공개",
    communityMakePrivate: "비공개로 전환",
    communityMakePublic: "공개로 전환",
    communityVisibilityChanged: "공개 설정이 변경됐어요.",
    communityDeleteConfirmTitle: "게시글을 삭제할까요?",
    communityDeleteConfirmBody: "삭제하면 되돌릴 수 없어요.",
    communityCommentsTitle: "댓글",
    communityCommentPlaceholder: "댓글을 남겨보세요",
    communityCommentSubmit: "등록",
    communityCommentEmpty: "아직 댓글이 없어요. 첫 댓글을 남겨보세요!",
    communityCommentDeleteConfirmTitle: "댓글을 삭제할까요?",
    communityReportBtn: "신고",
    communityReportTitle: "신고하기",
    communityReportReasonLabel: "신고 사유를 선택해주세요",
    communityReportDetailPlaceholder: "추가로 남기고 싶은 내용이 있다면 적어주세요 (선택)",
    communityReportSubmit: "신고 접수",
    communityReportDone: "신고가 접수됐어요. 확인 후 조치할게요.",
    communityReportAlready: "이미 신고한 게시글/댓글이에요.",
    communityReportReasons: {
      ad: "광고/홍보", abuse: "욕설/비방", sexual: "음란하거나 부적절한 콘텐츠", animal_abuse: "동물학대 관련 콘텐츠",
      privacy: "개인정보 노출", misinformation: "허위/위험 정보", spam: "도배", other: "기타",
    },
    communityMyActivityNav: "내 활동",
    communityMyPostsTab: "내가 쓴 글",
    communityMyCommentsTab: "내가 쓴 댓글",
    communityMyLikesTab: "좋아요한 글",
    communityMyEmptyPosts: "아직 작성한 글이 없어요.",
    communityMyEmptyComments: "아직 작성한 댓글이 없어요.",
    communityMyEmptyLikes: "아직 좋아요한 글이 없어요.",
    myPageTitle: "MY",
    myPageAccountTitle: "내 계정",
    myPagePetsTitle: "등록한 우리 아이",
    myPagePetsCount: (n) => `${n}마리`,
    myPageActivityTitle: "Pet톡 내 활동",
    myPageSettingsBtn: "계정 설정",
    myPageManagePetsBtn: "우리 아이 관리",
    communityImageTooMany: "사진은 최대 5장까지 등록할 수 있어요.",
    communityImageInvalidType: "JPG, PNG, WebP 형식의 사진만 등록할 수 있어요.",
    communityUploadFailed: "사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.",
    loginTagline: "우리 아이의 건강한 성장을 함께해요",
    loginGateTitle: "로그인이 필요해요",
    loginGateBody: "카카오 계정으로 로그인하면 반려동물 정보가 이 계정에 안전하게 저장되고, 다른 기기에서도 로그인만 하면 그대로 불러올 수 있어요.",
    loginContinueKakao: "카카오로 시작하기",
    termsFooterLink: "이용약관",
    loggedInGreeting: (name) => `${name}님, 안녕하세요`,
    homeGreeting: (name) => `안녕하세요, ${name} 보호자님! 🐾`,
    homeSubGreeting: "오늘도 우리 아이와 행복한 하루 보내세요.",
    homePetCardBtn: "아이 정보 보기",
    homeAddPetBtn: "우리 아이 등록하기",
    homeServicesTitle: "PetGrow와 함께 성장해요",
    homeCardGrowthTitle: "우리 아이",
    homeCardGrowthDesc: "나이·체중·예방접종 등 우리 아이 성장 기록",
    homeCardSajuDesc: "생년월일로 보는 우리 아이의 운세",
    homeCardPetBtiDesc: "성격 유형 검사로 우리 아이 이해하기",
    homeCardTipsDesc: "건강·식단·생활 등 유용한 정보 모음",
    homeCardCommunityDesc: "보호자들과 소통하는 커뮤니티 공간",
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
    landingHeadline1: "우리 아이의 모든 순간을",
    landingGreeting: "안녕하세요, 펫그로우입니다 🐾",
    socialTitle: "PetGrow 공식 채널",
    saveToastOk: "저장됐어요",
    saveToastError: "저장에 실패했어요 — 저장 공간이 가득 찼을 수 있어요. 오래된 사진을 정리해보세요.",
    welcomeBackMsg: (name) => name ? `다시 오셨군요! 🐾 ${name}의 기록을 이어가볼까요?` : "다시 오셨군요! 🐾 기록을 이어가볼까요?",
    socialLabels: { youtube: "유튜브", instagram: "인스타그램", threads: "스레드", tiktok: "틱톡", blog: "네이버 블로그" },
    introVideoMute: "소리 끄기",
    introVideoUnmute: "소리 켜기",
    landingHeadlineHighlight: "PetGrow",
    landingHeadline2: "와 함께",
    landingSubtitle: "성장 기록부터 PetBTI, Pet사주, 맞춤 정보와 Pet톡까지 — 반려동물과 함께하는 매일을 더 특별하게 기록해보세요.",
    landingFeature1Title: "성장 예측",
    landingFeature1Desc: "예측 체중과 월령별 성장 곡선을 보여드려요",
    landingFeature2Title: "성장 기록 · 앨범",
    landingFeature2Desc: "체중과 사진을 날짜와 함께 차곡차곡 기록해요",
    landingFeature3Title: "참고 정보 가이드",
    landingFeature3Desc: "또래 비교, 사료·예방접종 참고 정보를 확인해요",
    landingCta: "지금 시작하기",
    landingTrust1: "참고용 성장 데이터",
    landingTrust2: "간편한 시작",
    landingTrust3: "카카오 계정으로 안전하게 저장",
    landingTrust4: "지속적인 업데이트",
    landingPreviewLabel: "예측 성체 체중",
    landingBackHome: "홈으로",
    landingHowTitle: "PetGrow 시작은 간단해요",
    landingStep1Title: "카카오로 시작하기",
    landingStep1Desc: "간편하게 로그인해요.",
    landingStep2Title: "우리 아이 등록하기",
    landingStep2Desc: "사진과 기본 정보를 등록해요.",
    landingStep3Title: "우리 아이와 PetGrow 즐기기",
    landingStep3Desc: "성장기록, Pet사주, PetBTI, Pet톡 등 다양한 기능을 이용해요.",
    landingFeaturesTitle: "PetGrow가 도와드리는 것들",
    landingAboutTitle: "PetGrow는 이런 서비스예요",
    landingAboutBody: "PetGrow는 강아지와 고양이의 견종·묘종, 생년월일, 체중 정보를 바탕으로 예상 성체 체중과 월령별 성장 곡선을 보여주는 반려동물 성장 기록 서비스예요. 병원에서 잰 체중을 날짜와 함께 기록하면 예상보다 빠르게 크는지 느리게 크는지 자동으로 비교해주고, 사진을 촬영일과 함께 남기면 시간순으로 정리된 성장앨범이 만들어져요. 모든 예측은 참고용 데이터이며, 정확한 건강 관리는 반드시 수의사와 상담해주세요.",
    landingCoreFeaturesTitle: "우리 아이와 함께하는 모든 순간",
    landingCoreFeaturesSubtitle: "기록하고, 알아가고, 이야기하는 반려생활을 PetGrow 하나로",
    landingCardMyPetsTitle: "🐾 우리 아이",
    landingCardMyPetsDesc: "우리 아이의 프로필과 성장 기록을 한곳에서. 사진, 생년월일, 품종, 몸무게 등 반려동물 정보를 관리해요.",
    landingCardGrowthTitle: "📈 성장 기록",
    landingCardGrowthDesc: "하루하루 달라지는 모습을 기록해요. 몸무게와 사진을 기록하고 성장 변화를 확인해요.",
    landingCardSajuTitle: "🔮 Pet사주",
    landingCardSajuDesc: "우리 아이에게 숨겨진 특별한 이야기를 만나보세요. 등록된 정보를 바탕으로 재미있게 즐기는 반려동물 사주 콘텐츠예요.",
    landingCardPetBtiTitle: "🐶 PetBTI",
    landingCardPetBtiDesc: "우리 아이는 어떤 성격일까요? 행동과 성향에 관한 질문으로 우리 아이의 PetBTI를 알아봐요.",
    landingCardFortuneTitle: "💚 오늘의 운세",
    landingCardFortuneDesc: "오늘 우리 아이의 하루는 어떨까요? 매일 가볍게 확인하는 우리 아이의 오늘의 운세를 제공해요.",
    landingCardCompatTitle: "🫶 보호자 궁합",
    landingCardCompatDesc: "나와 우리 아이는 얼마나 잘 맞을까요? 보호자와 반려동물의 재미있는 궁합 결과를 확인해요.",
    landingCardTipsTitle: "💡 Pet꿀팁",
    landingCardTipsDesc: "반려생활에 필요한 정보를 쉽고 빠르게. 건강, 식단, 행동, 성장, 생활 정보를 확인해요.",
    landingCardCommunityTitle: "💬 Pet톡",
    landingCardCommunityDesc: "우리 아이 이야기를 함께 나눠요. 다른 보호자들과 반려동물의 일상과 사진, 질문과 정보를 공유하는 커뮤니티예요.",
    landingFunTitle: "우리 아이를 더 알아가는 재미",
    landingSajuEyebrow: "Pet사주",
    landingSajuHighlightTitle: "우리 아이에게도 타고난 매력이 있을까요? 🔮",
    landingSajuHighlightDesc: "우리 아이의 정보로 만나는 특별한 이야기예요.",
    landingSajuHighlightCta: "Pet사주 만나보기",
    landingPetBtiEyebrow: "PetBTI",
    landingPetBtiHighlightTitle: "우리 아이의 진짜 성격은? 🐾",
    landingPetBtiHighlightDesc: "행동과 성향을 통해 알아보는 우리 아이만의 PetBTI예요.",
    landingPetBtiHighlightCta: "PetBTI 알아보기",
    landingFunDisclaimer: "Pet사주·PetBTI는 재미와 참고를 위한 콘텐츠이며 과학적으로 검증된 진단이 아니에요.",
    landingCommunityTitle: "우리 아이 이야기를 함께 나눠요",
    landingCommunitySubtitle: "Pet톡에서 다른 보호자들과 반려생활을 공유해보세요.",
    landingCommunityDesc: "일상, 자랑, 질문, 건강·식단, 정보공유까지 — 우리 아이와 함께한 순간을 다른 보호자들과 나누고 좋아요와 댓글로 소통해보세요.",
    landingCommunityCta: "Pet톡 둘러보기",
    landingMockPost1Name: "몽이", landingMockPost1Breed: "말티푸", landingMockPost1Time: "10분 전",
    landingMockPost1Text: "오늘 산책하다가 친구를 만났어요 🐾",
    landingMockPost2Name: "나비", landingMockPost2Breed: "코리안숏헤어", landingMockPost2Time: "1시간 전",
    landingMockPost2Text: "창가에서 낮잠 자는 중... 방해 금지 🐱",
    landingTipsGuideTitle: "Pet꿀팁 · 정보가이드",
    landingTipsGuideDesc: "건강·식단·행동·성장·생활 꿀팁 50가지와, PetGrow를 처음부터 끝까지 안내하는 정보가이드도 준비되어 있어요.",
    landingTipsTeaserLabel: "Pet꿀팁 보러가기",
    landingGuideTeaserLabel: "정보가이드 보러가기",
    landingFinalCtaLine1: "우리 아이와 함께한 오늘,",
    landingFinalCtaLine2: "PetGrow에 남겨보세요 🐾",
    landingFinalCtaDesc: "성장하는 순간부터 소소한 일상까지\nPetGrow가 우리 아이와 함께합니다.",
    landingFinalCtaBtn: "PetGrow 시작하기",
    landingPricingTitle: "체험판과 회원, 무엇이 다를까요?",
    landingTierTrialName: "체험판",
    landingTierTrialPrice: "무료 · 로그인 불필요",
    landingTierTrial1: "반려동물 1마리 등록",
    landingTierTrial2: "성장 예측 · 그래프 · 기록 · 또래 비교",
    landingTierTrial3: "참고 정보 가이드",
    landingTierMemberName: "회원",
    landingTierMemberPrice: "무료 · 카카오 간편로그인",
    landingTierMember1: "반려동물 최대 10마리 등록",
    landingTierMember2: "체험판의 모든 기능 포함",
    landingTierMember3: "성장앨범(사진) 등록·슬라이드쇼",
  },
  en: {
    privacyFooter: "Once you log in with Kakao, everything you register for your pet is safely saved to your account — log in on any device to pick up right where you left off.",
    cancel: "Cancel",
    helpAria: "Open the guide",
    hamMenuAria: "Open menu",
    hamCloseAria: "Close menu",
    hamNavHome: "Home",
    aboutNav: "About PetGrow",
    hamNavMy: "MY",
    hamNavSettings: "Settings",
    appTabPetInfo: "Pet Info",
    appTabPetContent: "Content",
    contentTabAll: "All",
    confirmDeleteTitle: "Delete this pet?",
    confirmDeleteMsg: (name) => `All of ${name}'s records and photos will be gone for good — this can't be undone.`,
    confirmDeleteBtn: "Delete",
    guideTitle: "How to use Bboggl",
    guideConfirm: "Got it",
    privacyTitle: "Privacy Policy",
    privacyIntro: "PetGrow (\"the Service\") takes user privacy seriously and works to comply with the Personal Information Protection Act and other applicable laws. This privacy policy applies to the PetGrow website and mobile application.",
    termsTitle: "Terms of Service",
    termsIntro: "These Terms set out the conditions of use for the website, mobile application, and related services provided by PetGrow, and the rights, obligations, and responsibilities of PetGrow and users.",
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
    optional: "optional",
    sajuNav: "Saju",
    petBtiNav: "PetBTI",
    petBtiMainTitle: "What's your pet's personality?",
    petBtiMainDesc: "Just answer a few questions about their everyday behavior.\nPetGrow will find their personality type 🐶💕",
    petBtiStartBtn: "Start PetBTI 🐾",
    petBtiRestartBtn: "Take the test again",
    petBtiNoPet: "Please add a pet under 'My Pets' first.",
    petBtiPreviousResult: (name) => `${name}'s saved PetBTI`,
    petBtiResultHeading: (name) => `${name}'s PetBTI is...`,
    petBtiStatsTitle: "PetBTI Stats",
    petBtiStatAffection: "Affection", petBtiStatCuriosity: "Curiosity", petBtiStatFood: "Food Drive",
    petBtiStatSocial: "Sociability", petBtiStatControl: "Charm Power",
    petBtiSectionTitle: {
      personality: "Natural personality", bond: "Bond with you", friends: "With other pets", play: "Play style", walk: "Walk style",
      food: "At treat time", alone: "When alone", mischief: "Mischief moments", affection: "How they show love", hidden: "Hidden charm",
    },
    petBtiOneWordTitle: (name) => `${name} in one line?`,
    petBtiCompatTitle: (name) => `💕 A friend who'd suit ${name}`,
    petBtiCompatGood: (name) => `A personality with charms ${name} doesn't have — their differences could actually make for a great pairing, each filling in where the other doesn't.`,
    petBtiCompatChaosTitle: "The chaos combo",
    petBtiCompatChaos: (name) => `A friend with a very similar personality to ${name}. Put them together and it might get delightfully chaotic — not a bad thing, just double the energy 😆`,
    petBtiShareBtn: "Share my PetBTI 🐾",
    petBtiShareTitle: "Share PetBTI card",
    petBtiShareHeading: (name) => `${name}'s PetBTI`,
    petBtiDisclaimer: "A fun PetGrow personality quiz — not a behavioral or medical assessment.",
    sajuFormTitle: "Pet Fortune 🐾",
    sajuFormSub: "Enter a few details for a fun look at your pet's fortune.",
    sajuNameLabel: "Name",
    sajuNamePlaceholder: "Bella",
    sajuSpeciesLabel: "Dog / Cat",
    sajuBirthLabel: "Birth date",
    sajuGenderLabel: "Gender",
    sajuTimeLabel: "Birth time",
    sajuBreedLabel: "Breed",
    sajuBreedPlaceholder: "Maltese",
    sajuGenerateBtn: "Reveal my pet's fortune 🐾",
    sajuErrName: "Please enter a name",
    sajuErrBirth: "Please enter a birth date",
    sajuIntroTitle: (name) => `See ${name}'s fortune?`,
    sajuNeedPetTitle: "No pets registered yet",
    sajuNeedPetBody: "Saju is only available for pets registered under My Pets. Please register a pet first.",
    sajuGoRegisterBtn: "Go register my pet",
    sajuIntroSub: "We'll use their saved profile info.",
    sajuUseOtherInfo: "Use different info",
    sajuResultHeading: (name) => `${name}'s fortune`,
    sajuCategoryTitle: {
      personality: "Natural personality", bond: "Bond with you", friends: "With other pets", food: "Food luck",
      play: "Play & walk style", affection: "Affection style", mischief: "Mischief meter", luck: "Their strongest luck",
    },
    sajuOneWordTitle: (name) => `${name} in one line?`,
    sajuTodayTitle: "A word for today",
    sajuShareBtn: "Share this fortune",
    sajuShareTitle: "Share fortune card",
    sajuShareHeading: (name) => `${name}'s fortune`,
    sajuComingCompat: "Compatibility with you",
    sajuComingDaily: "Today's horoscope",
    sajuComingSoon: "Coming soon!",
    sajuRestartBtn: "Try again",
    sajuDisclaimer: "A fun PetGrow feature 🐾 not a real assessment of personality or the future.",
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
      { title: "9. Reading the growth chart", body: "The red dot marks your pet's current spot. The green band is a reference healthy range (±15% of the prediction) — stepping outside it adds a vertical line and a warning note to the chart." },
    ],
    infoGuideTitle: "Info Guide",
    infoGuideIntro: "A simple walkthrough of everything PetGrow can do, even if it's your first time.",
    infoGuideSections: [
      { title: "Kakao Login", body: "PetGrow logs you in with a single Kakao account. No separate sign-up or password — just tap 'Start with Kakao'." },
      { title: "Registering your pet", body: "Enter a name, species, breed, birth date, and current weight to instantly see the predicted adult weight and growth chart. You can add a profile photo too." },
      { title: "Managing multiple pets", body: "Register several dogs and cats. Pick a pet by photo and name, and every result on the app follows that pet." },
      { title: "Account storage & cross-device sync", body: "Your pet info is safely saved to your logged-in Kakao account. Log in with the same account on any device or the web to pick up right where you left off." },
      { title: "Growth info", body: "Every weight you log is automatically compared to the prediction, and you can build a growth photo album over time." },
      { title: "Saju", body: "Fun Saju-style content — personality, compatibility, luck — generated from your registered pet's info, for entertainment and reference." },
      { title: "Daily fortune & guardian compatibility", body: "See today's mood, energy, lucky point, and a good time to spend with your guardian. The same pet always gets the same result on the same day." },
      { title: "PetBTI", body: "Answer a few questions to get your pet's 16-type personality result, with questions tailored separately for dogs and cats." },
      { title: "Saving PetBTI results", body: "Your completed result is saved automatically — revisit it anytime with 'View PetBTI result', or take the test again." },
      { title: "Pet Tips", body: "50 tips across five categories — health, diet & nutrition, behavior & training, growth & lifestyle, and safety. Search looks across all 50, not just the current page." },
      { title: "Search", body: "Type a keyword into the search box on the Pet Tips screen to search across all 50 tips, not just the page you're on." },
      { title: "Logging out", body: "Tap the account button in the top right to log out. Your data stays safely saved on the server and comes right back when you log in again." },
      { title: "Deleting your account", body: "Deleting your account from account settings removes all data linked to it — pet info, photos, and PetBTI results included. This can't be undone." },
    ],
    migrationTitle: "Looks like you had pets registered before 🐾",
    migrationBody: "Want to save this to your PetGrow account? Once saved, you can pick up right where you left off on any device.",
    migrationLater: "Later",
    migrationConfirm: "Save to my account",
    migrationSaving: "Saving...",
    deleteAccountPageTitle: "Delete Account",
    deleteAccountPageBody: "Deleting your account removes the data below, except information that must be separately retained under applicable law. This cannot be undone.",
    deleteAccountItems: [
      "Your PetGrow account and Kakao authentication link",
      "Registered pet information and profile photos",
      "Saved data such as growth records",
      "PetBTI results",
      "Your Pet Talk posts, comments, likes, and attached photos",
      "Other data linked to your account and your login session",
    ],
    deleteAccountLoggedInAs: (name) => `You're currently logged in as ${name}.`,
    deleteAccountNeedLogin: "Please log in with Kakao first to delete your account.",
    deleteAccountEmailFallback: "If you can't log in with Kakao, email help.petgrow@gmail.com and we'll take care of it for you.",
    deleteAccountConfirmTitle: "Are you sure you want to delete your account?",
    deleteAccountConfirmBody: "This deletes your account and all pet data, and it can't be undone.",
    deleteAccountDoneTitle: "Your account has been deleted",
    deleteAccountDoneBody: "Thank you for using PetGrow. Your account and all related data have been deleted.",
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
    chartLegend: "Bold dot = current point",
    chartBandLegend: "Green band = reference healthy range (±15% of prediction)",
    chartOutsideBand: "⚠ Current weight is outside the healthy range. If you're concerned, please consult a vet.",
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
    recordDeleteBtn: "Delete",
    recordDeleteTitle: "Delete this record?",
    recordDeleteMsg: (date, weight) => `This will delete the ${date} · ${weight}kg record. This can't be undone.`,
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
    photoSaveError: "Couldn't save the photo. The file may be too large or storage may be full. Please try a different photo.",
    albumEmpty: "No photos yet — add your first one!",
    photoCountLabel: (n) => `${n} photo${n === 1 ? "" : "s"}`,
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
    reportTitle: (name) => `${name}'s growth report`,
    editBtn: "Edit info",
    deleteBtn: "Delete",
    footerNote1: "Features like an AI chatbot, maps, and real push notifications",
    footerNoteStrong: "need their own API keys and backend",
    footerNote2: " — just say the word and we'll add them one at a time, in whatever order you'd like.",
    accountLoginBtn: "Log in",
    accountLogoutBtn: "Log out",
    accountDeleteBtn: "Delete account",
    accountSettingsBtn: "Account settings",
    accountSettingsTitle: "Account settings",
    accountKakaoTag: "Logged in with Kakao",
    loginTagline: "Grow healthy together with your pet",
    loginGateTitle: "Please log in",
    loginGateBody: "Log in with Kakao to save your pet's info to your account — and pick up right where you left off on any device.",
    loginContinueKakao: "Start with Kakao",
    termsFooterLink: "Terms of Service",
    loginToastSuccess: "You're logged in",
    loginToastError: "Login failed. Please try again.",
    communityNav: "Pet Talk",
    communityCategoryAll: "All",
    communityCategoryLabels: { daily: "Daily", brag: "Brag", question: "Question", health: "Health & Diet", info: "Info" },
    communitySortLatest: "Latest",
    communitySortPopular: "Popular",
    communitySearchPlaceholder: "Search titles and posts",
    communityWriteBtn: "Write",
    communityEmptyFeed: "No posts yet. Be the first to share 🐾",
    communityLoadMore: "Load more",
    communityLoading: "Loading...",
    communityHealthNotice: "Posts here reflect members' personal experience or opinions. Please consult a veterinarian for your pet's health issues.",
    communityNeedPetTitle: "You'll need a registered pet to post",
    communityNeedPetBody: "Pet Talk posts are shared alongside a pet registered under My Pets. Please register a pet first.",
    communityComposeTitlePet: "Post with",
    communityComposeTitleCategory: "Category",
    communityComposeVisibility: "Visibility",
    communityComposeVisibilityPublicHelp: "Visible to everyone on PetGrow.",
    communityComposeVisibilityPrivateHelp: "Only you can see it. It remains available from MY.",
    communityComposeTitleTitle: "Title",
    communityComposeTitlePlaceholder: "Enter a title",
    communityComposeTitleContent: "Content",
    communityComposeContentPlaceholder: "Tell us about your pet",
    communityComposePhotos: (n) => `Photos (up to 5, ${n}/5)`,
    communityComposeSubmit: "Post",
    communityComposeSubmitEdit: "Save changes",
    communityComposeUploading: "Uploading...",
    communityComposeErrTitle: "Please enter a title",
    communityComposeErrContent: "Please enter some content",
    communityComposeErrPet: "Please choose a pet to post with",
    communityBack: "Back",
    communityEditBtn: "Edit",
    communityDeleteBtn: "Delete",
    communityVisibilityPublic: "Public",
    communityVisibilityPrivate: "Private",
    communityMakePrivate: "Make private",
    communityMakePublic: "Make public",
    communityVisibilityChanged: "Post visibility updated.",
    communityDeleteConfirmTitle: "Delete this post?",
    communityDeleteConfirmBody: "This can't be undone.",
    communityCommentsTitle: "Comments",
    communityCommentPlaceholder: "Leave a comment",
    communityCommentSubmit: "Post",
    communityCommentEmpty: "No comments yet. Be the first!",
    communityCommentDeleteConfirmTitle: "Delete this comment?",
    communityReportBtn: "Report",
    communityReportTitle: "Report",
    communityReportReasonLabel: "Choose a reason",
    communityReportDetailPlaceholder: "Anything else you'd like to add? (optional)",
    communityReportSubmit: "Submit report",
    communityReportDone: "Your report has been submitted. We'll review it.",
    communityReportAlready: "You've already reported this.",
    communityReportReasons: {
      ad: "Advertising/Promotion", abuse: "Abuse/Harassment", sexual: "Sexual or inappropriate content", animal_abuse: "Animal abuse content",
      privacy: "Exposed personal info", misinformation: "False/dangerous info", spam: "Spam", other: "Other",
    },
    communityMyActivityNav: "My Activity",
    communityMyPostsTab: "My posts",
    communityMyCommentsTab: "My comments",
    communityMyLikesTab: "Liked posts",
    communityMyEmptyPosts: "You haven't posted anything yet.",
    communityMyEmptyComments: "You haven't commented on anything yet.",
    communityMyEmptyLikes: "You haven't liked anything yet.",
    myPageTitle: "MY",
    myPageAccountTitle: "My account",
    myPagePetsTitle: "My pets",
    myPagePetsCount: (n) => `${n} pets`,
    myPageActivityTitle: "My Pet Talk activity",
    myPageSettingsBtn: "Account settings",
    myPageManagePetsBtn: "Manage pets",
    communityImageTooMany: "You can add up to 5 photos.",
    communityImageInvalidType: "Only JPG, PNG, and WebP images are allowed.",
    communityUploadFailed: "Photo upload failed. Please try again.",
    loggedInGreeting: (name) => `Hi, ${name}`,
    homeGreeting: (name) => `Hi ${name}, hello! 🐾`,
    homeSubGreeting: "Hope you and your pet have a happy day today.",
    homePetCardBtn: "View pet info",
    homeAddPetBtn: "Register your pet",
    homeServicesTitle: "Grow together with PetGrow",
    homeCardGrowthTitle: "My Pet",
    homeCardGrowthDesc: "Age, weight, vaccines — your pet's growth records",
    homeCardSajuDesc: "Your pet's fortune, based on their birth date",
    homeCardPetBtiDesc: "Understand your pet through a personality test",
    homeCardTipsDesc: "Handy info on health, diet, and daily life",
    homeCardCommunityDesc: "A community space to connect with guardians",
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
    landingHeadline1: "Every moment with your pet,",
    landingGreeting: "Hello, welcome to PetGrow 🐾",
    socialTitle: "PetGrow official channels",
    saveToastOk: "Saved",
    saveToastError: "Couldn't save — storage may be full. Try removing some older photos.",
    welcomeBackMsg: (name) => name ? `Welcome back! 🐾 Ready to continue tracking ${name}?` : "Welcome back! 🐾 Ready to continue your records?",
    socialLabels: { youtube: "YouTube", instagram: "Instagram", threads: "Threads", tiktok: "TikTok", blog: "Naver Blog" },
    introVideoMute: "Mute",
    introVideoUnmute: "Unmute",
    landingHeadlineHighlight: "PetGrow",
    landingHeadline2: " is here",
    landingSubtitle: "From growth records to PetBTI, Saju, tailored info, and Pet Talk — make every day with your pet a little more special.",
    landingFeature1Title: "Growth prediction",
    landingFeature1Desc: "Predicted adult weight and a growth curve by month",
    landingFeature2Title: "Records & album",
    landingFeature2Desc: "Log weight and photos, neatly organized by date",
    landingFeature3Title: "Reference guide",
    landingFeature3Desc: "Peer comparison, feeding and vaccine reference info",
    landingCta: "Get started",
    landingTrust1: "Reference-only growth data",
    landingTrust2: "Quick to start",
    landingTrust3: "Safely saved to your Kakao account",
    landingTrust4: "Continuously improving",
    landingPreviewLabel: "Predicted adult weight",
    landingBackHome: "Home",
    landingHowTitle: "Getting started with PetGrow is simple",
    landingStep1Title: "Start with Kakao",
    landingStep1Desc: "Log in in seconds.",
    landingStep2Title: "Register your pet",
    landingStep2Desc: "Add a photo and the basics.",
    landingStep3Title: "Enjoy PetGrow together",
    landingStep3Desc: "Growth records, Saju, PetBTI, Pet Talk, and more.",
    landingFeaturesTitle: "What PetGrow helps with",
    landingAboutTitle: "What is PetGrow?",
    landingAboutBody: "PetGrow is a growth-tracking service for dogs and cats. Enter your pet's breed, birth date, and weight to see a predicted adult weight and a growth curve by month. Log weight measurements with the date and PetGrow automatically compares actual growth to the prediction, and adding photos with the date taken builds a chronologically organized growth album. All predictions are reference data only — always consult a vet for actual health decisions.",
    landingCoreFeaturesTitle: "Every moment with your pet",
    landingCoreFeaturesSubtitle: "Record, discover, and share your pet life — all in one place with PetGrow",
    landingCardMyPetsTitle: "🐾 My Pets",
    landingCardMyPetsDesc: "Your pet's profile and growth records, all in one place. Manage photos, birth date, breed, and weight.",
    landingCardGrowthTitle: "📈 Growth Records",
    landingCardGrowthDesc: "Track how they change, day by day. Log weight and photos and watch their growth unfold.",
    landingCardSajuTitle: "🔮 Saju",
    landingCardSajuDesc: "Discover the special story hidden in your pet. Fun Saju-style content generated from their registered info.",
    landingCardPetBtiTitle: "🐶 PetBTI",
    landingCardPetBtiDesc: "What's their personality really like? Find out their PetBTI through questions about behavior and temperament.",
    landingCardFortuneTitle: "💚 Daily Fortune",
    landingCardFortuneDesc: "How's your pet's day looking today? A light, fun daily fortune just for them.",
    landingCardCompatTitle: "🫶 Guardian Compatibility",
    landingCardCompatDesc: "How well do you and your pet click? See a fun compatibility result between you two.",
    landingCardTipsTitle: "💡 Pet Tips",
    landingCardTipsDesc: "Everything you need for pet life, quick and easy. Health, diet, behavior, growth, and lifestyle info.",
    landingCardCommunityTitle: "💬 Pet Talk",
    landingCardCommunityDesc: "Share your pet's story with others. A community for sharing daily life, photos, questions, and info with fellow guardians.",
    landingFunTitle: "The fun side of getting to know your pet",
    landingSajuEyebrow: "Saju",
    landingSajuHighlightTitle: "Does your pet have a natural-born charm? 🔮",
    landingSajuHighlightDesc: "A fun, special story generated from your pet's info.",
    landingSajuHighlightCta: "Try Saju",
    landingPetBtiEyebrow: "PetBTI",
    landingPetBtiHighlightTitle: "What's their true personality? 🐾",
    landingPetBtiHighlightDesc: "Discover your pet's own PetBTI through their behavior and temperament.",
    landingPetBtiHighlightCta: "Try PetBTI",
    landingFunDisclaimer: "Saju and PetBTI are for fun and reference only — not scientifically verified assessments.",
    landingCommunityTitle: "Share your pet's story",
    landingCommunitySubtitle: "Share pet life with fellow guardians on Pet Talk.",
    landingCommunityDesc: "Daily life, brags, questions, health & diet, and info — share moments with your pet and connect through likes and comments.",
    landingCommunityCta: "Explore Pet Talk",
    landingMockPost1Name: "Mongi", landingMockPost1Breed: "Maltipoo", landingMockPost1Time: "10m ago",
    landingMockPost1Text: "Made a new friend on our walk today 🐾",
    landingMockPost2Name: "Nabi", landingMockPost2Breed: "Korean Shorthair", landingMockPost2Time: "1h ago",
    landingMockPost2Text: "Napping in the sun... do not disturb 🐱",
    landingTipsGuideTitle: "Pet Tips · Info Guide",
    landingTipsGuideDesc: "50 tips across health, diet, behavior, growth, and lifestyle — plus a full info guide to PetGrow from start to finish.",
    landingTipsTeaserLabel: "Browse Pet Tips",
    landingGuideTeaserLabel: "Open the Info Guide",
    landingFinalCtaLine1: "Today, with your pet —",
    landingFinalCtaLine2: "leave it in PetGrow 🐾",
    landingFinalCtaDesc: "From growing moments to quiet everyday ones,\nPetGrow is with you and your pet.",
    landingFinalCtaBtn: "Start with PetGrow",
    landingPricingTitle: "Trial vs. Member — what's different?",
    landingTierTrialName: "Trial",
    landingTierTrialPrice: "Free · no login needed",
    landingTierTrial1: "Register 1 pet",
    landingTierTrial2: "Growth prediction, chart, records, peer comparison",
    landingTierTrial3: "Reference info guide",
    landingTierMemberName: "Member",
    landingTierMemberPrice: "Free · Kakao Login",
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

// Pet톡 게시글/댓글에 표시하는 짧은 나이 표기 (예: "4개월", "2살")
function petAgeLabel(birthDate, lang) {
  if (!birthDate) return "";
  const months = Math.floor(monthsBetween(new Date(birthDate), new Date()));
  if (months < 12) return lang === "en" ? `${Math.max(months, 0)}mo` : `${Math.max(months, 0)}개월`;
  const years = Math.floor(months / 12);
  return lang === "en" ? `${years}yr` : `${years}살`;
}

// 게시 시각을 "10분 전" 처럼 상대 시간으로 표시해요
function timeAgoLabel(dateStr, lang) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.max(0, Math.floor(diffMs / 60000));
  if (min < 1) return lang === "en" ? "just now" : "방금 전";
  if (min < 60) return lang === "en" ? `${min}m ago` : `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return lang === "en" ? `${hr}h ago` : `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return lang === "en" ? `${day}d ago` : `${day}일 전`;
  const d = new Date(dateStr);
  return lang === "en"
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : `${d.getMonth() + 1}월 ${d.getDate()}일`;
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
   저장소 — 로그인 전에는 브라우저 localStorage, 로그인 후에는
   카카오 계정에 연결된 클라우드(/api/state)를 사용해요.
   account 인자가 있으면(=로그인 상태) 서버에, 없으면 이 기기에만 저장해요.
   ============================================================ */
async function cloudGet(key) {
  try {
    const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, { credentials: "include" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.value;
  } catch (err) {
    console.warn("클라우드 불러오기 실패:", key, err);
    return null;
  }
}
async function cloudSet(key, value) {
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch (err) {
    console.warn("클라우드 저장 실패:", key, err);
    return false;
  }
}
async function localGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
async function localSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // 저장 실패해도(예: 용량 초과) 화면은 계속 동작하되, 실패했다는 건 알려줘요
    console.warn("저장 실패:", key, err);
    return false;
  }
}
async function safeGet(key, account) {
  return account ? cloudGet(key) : localGet(key);
}
async function safeSet(key, value, account) {
  return account ? cloudSet(key, value) : localSet(key, value);
}

/* ============================================================
   인증(카카오 간편로그인) — 서버 API 호출
   ============================================================ */
function goToKakaoLogin() {
  // 전체 페이지 이동으로 카카오 로그인 화면으로 리다이렉트해요 (실제 OAuth 인가 흐름).
  window.location.href = "/api/auth/kakao/login";
}
async function fetchMe() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function apiLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {}
}
async function apiDeleteAccount() {
  try {
    const res = await fetch("/api/account", { method: "POST", credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

/* ============================================================
   Pet톡 커뮤니티 — API 클라이언트 헬퍼
   ============================================================ */
async function apiJson(url, options) {
  const res = await fetch(url, { credentials: "include", ...options });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error((data && data.error) || `request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
function communityListPosts({ category, sort, search, page }) {
  const params = new URLSearchParams({
    category: category || "all",
    sort: sort || "latest",
    search: search || "",
    page: String(page || 1),
  });
  return apiJson(`/api/community?action=posts&${params}`);
}
function communityGetPost(id) {
  return apiJson(`/api/community?action=post&id=${encodeURIComponent(id)}`);
}
function communityCreatePost(payload) {
  return apiJson("/api/community?action=posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
function communityUpdatePost(id, payload) {
  return apiJson(`/api/community?action=post&id=${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
function communityDeletePost(id) {
  return apiJson(`/api/community?action=post&id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
function communitySetPostVisibility(id, isPublic) {
  return apiJson(`/api/community?action=post&id=${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: !!isPublic })
  });
}
function communityToggleLike(id) {
  return apiJson(`/api/community?action=like&id=${encodeURIComponent(id)}`, { method: "POST" });
}
function communityListComments(postId) {
  return apiJson(`/api/community?action=comments&postId=${encodeURIComponent(postId)}`);
}
function communityAddComment(postId, payload) {
  return apiJson(`/api/community?action=comments&postId=${encodeURIComponent(postId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
function communityDeleteComment(id) {
  return apiJson(`/api/community?action=comment&id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
function communityReport(payload) {
  return apiJson("/api/community?action=report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
function communityMyActivity(type, page) {
  return apiJson(`/api/community?action=my&type=${encodeURIComponent(type)}&page=${page || 1}`);
}
async function communityUploadImage(dataUrl) {
  const data = await apiJson("/api/community?action=upload", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }),
  });
  return data.url;
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
const TalkIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.3A1 1 0 0 1 3 19.5V5a1 1 0 0 1 1-1z" />
  </svg>
);
const HamburgerIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);
const CloseIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);
const HomeIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
  </svg>
);
const SettingsIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
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
const YoutubeIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <rect x="1" y="5" width="22" height="14" rx="5" fill="currentColor" />
    <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#fff" />
  </svg>
);
const InstagramIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
  </svg>
);
const ThreadsIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2C6.5 2 3 6 3 12s3.5 10 9 10c3.8 0 6.3-1.7 7.6-4.4l-2-1c-.9 1.8-2.6 2.9-5.2 2.9-3.6 0-5.9-2.2-6.3-5.6.5.2 1.3.4 2.5.4 3.6 0 6-1.7 6-4.7 0-2.5-2-4.1-5-4.1-2.6 0-4.6 1.1-5.6 3l1.9 1c.7-1.3 1.9-1.9 3.5-1.9 1.5 0 2.4.6 2.4 1.7 0 1.3-1.3 1.9-3.3 1.9-1 0-1.9-.2-2.7-.5.2-3 2.2-4.8 5.2-4.8 3.5 0 6 2.1 6 6 0 4.4-3.1 7-8 7z" fill="none" stroke="currentColor" strokeWidth="0" />
    <path d="M12 3c4.6 0 7.5 2.9 7.9 7.4.1 1 .1 2 0 2.9C19.5 18.3 16.6 21 12 21c-4.2 0-7.4-2.4-8.6-6.2M12 3c-4.2 0-7.3 2.3-8.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 9.5c.7-1.3 1.9-1.9 3.5-1.9 2.2 0 3.7 1.2 3.7 3.3 0 2.4-2 3.6-5 3.6-1.2 0-2.2-.2-3-.6.3 2.9 2.3 4.6 5.3 4.6 2.3 0 3.9-1 4.7-2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const TiktokIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M15 3c.4 2.2 1.8 3.7 4 4v3c-1.5 0-2.9-.4-4-1.3v6.3c0 3.3-2.4 5.7-5.5 5.7S4 18.3 4 15s2.4-5.7 5.5-5.7c.5 0 1 .1 1.5.2v3.2a2.7 2.7 0 0 0-1.5-.4c-1.5 0-2.5 1.1-2.5 2.7s1 2.7 2.5 2.7 2.6-1 2.6-2.7V3h2.9z" fill="currentColor" />
  </svg>
);
const BlogIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 13h10M7 16.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const SoundOnIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 3.2v2.06c3.39.85 5.9 3.91 5.9 7.74s-2.51 6.89-5.9 7.74v2.06c4.5-.88 7.9-4.84 7.9-9.8s-3.4-8.92-7.9-9.8z" />
  </svg>
);
const SoundOffIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4zm15.7-1.5-1.4-1.4-2.6 2.6-2.6-2.6-1.4 1.4 2.6 2.6-2.6 2.6 1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6z" />
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

// 앱 업데이트 안내 — 웹에서는 표시하지 않고, Capacitor 앱에서만 동작해요.
// 새 APK/AAB를 만들 때 capacitor.config.json의 ?app_version= 값도 함께 올려주세요.
function compareVersions(a, b) {
  const pa = String(a || "0").split(".").map((v) => parseInt(v, 10) || 0);
  const pb = String(b || "0").split(".").map((v) => parseInt(v, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function UpdateModal({ open, config, onLater }) {
  if (!config) return null;
  const force = !!config.force;
  const openStore = () => {
    const url = config.playStoreUrl || "https://play.google.com/store/apps/details?id=kr.co.petgrow.app";
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  };
  return (
    <Modal open={open} onClose={force ? () => {} : onLater} width={380}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 12 }}>🐾</div>
        <h3 style={{ fontSize: 19, marginBottom: 10 }}>{config.title || "PetGrow 업데이트 안내 🐾"}</h3>
        <p className="bg-sub" style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>
          {config.message || "더 나은 사용을 위해 새로운 업데이트가 준비되었어요. 최신 버전으로 업데이트해주세요."}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {!force && (
            <button className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={onLater}>나중에</button>
          )}
          <button className="bg-btn" style={{ flex: 1 }} onClick={openStore}>업데이트</button>
        </div>
      </div>
    </Modal>
  );
}

function GuideModal({ open, onClose }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} width={720}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <HelpIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{t.guideTitle}</h3>
      </div>
      <div className="guide-grid">
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
  { title: "1. 개인정보의 처리 목적", body: "PetGrow는 카카오 간편로그인을 통한 회원 식별·계정 관리, 로그인 유지, 반려동물 정보 저장 및 기기 간 동기화, PetBTI 등 서비스 결과 저장·다시보기, 고객 문의, 서비스 안정성·품질 개선, 광고 제공 및 성과 측정, 부정 이용 방지, 회원탈퇴 및 개인정보 삭제 처리를 위하여 필요한 범위에서 개인정보를 처리할 수 있습니다." },
  { title: "2. 처리하는 개인정보 항목", body: "가. 카카오 간편로그인\n- 카카오가 제공하는 사용자 고유 식별정보\n- 닉네임, 프로필 이미지 등은 실제로 동의받아 제공받고 서비스에서 사용하는 경우에만 처리\n- 이메일 등 추가 정보는 실제 구현상 필요한 경우에만 동의를 받아 처리\n\n나. 반려동물 및 서비스 정보\n- 반려동물 이름, 종류, 품종, 생년월일, 성별, 현재 체중 및 성장 관련 정보\n- 반려동물 프로필 사진\n- PetBTI 결과 및 검사일\n- Pet사주 등 저장이 필요한 서비스 정보\n\n다. 자동으로 처리될 수 있는 정보\n- IP 주소, 기기·운영체제·브라우저 또는 앱 정보\n- 접속 및 서비스 이용기록, 오류·보안 관련 기록\n- 광고 식별정보 및 광고 상호작용 정보\n\nPetGrow는 서비스 제공에 필요하지 않은 전화번호, 성별, 생일, 친구목록 등의 개인정보를 불필요하게 요청하지 않는 것을 원칙으로 합니다." },
  { title: "3. 개인정보의 저장 방식", body: "로그인 후 이용자가 등록하거나 생성한 정보는 단순히 '이 기기' 또는 '이 브라우저'에만 저장되는 구조를 원칙으로 하지 않으며, 로그인한 PetGrow 계정에 연결하여 서버 또는 클라우드 저장소에 저장·동기화될 수 있습니다. 동일한 카카오 계정으로 로그인하면 지원되는 다른 기기 또는 웹 환경에서 저장된 정보를 불러올 수 있습니다. 로그인 기능 도입 이전의 기존 기기 저장정보는 이용자의 선택에 따라 계정으로 이전될 수 있습니다." },
  { title: "4. 개인정보의 처리 및 보유기간", body: "회원계정 및 계정에 연결된 개인정보는 원칙적으로 회원탈퇴 시까지 보유·이용합니다. 회원탈퇴 시 관계 법령에 따라 별도로 보관할 필요가 있는 정보를 제외하고 계정 및 관련 개인정보를 삭제합니다. 외부 인증·광고·호스팅 사업자가 자체적으로 처리하는 정보는 해당 사업자의 정책 및 실제 처리 구조에 따를 수 있습니다." },
  { title: "5. 카카오 간편로그인", body: "PetGrow는 이용 편의를 위해 카카오 간편로그인을 제공할 수 있습니다. 로그인 과정에서 카카오의 동의 화면을 통해 이용자가 동의한 범위의 정보만 PetGrow에 제공될 수 있습니다. 처리 목적은 회원 식별, 계정 생성·관리, 사용자별 데이터 저장·동기화, 회원탈퇴 및 고객지원 등입니다." },
  { title: "6. 반려동물 정보 및 프로필 사진", body: "이용자가 등록한 반려동물 정보와 프로필 사진은 해당 PetGrow 계정과 연결하여 저장될 수 있으며, 우리 아이, 성장정보, Pet사주, PetBTI 등 반려동물별 기능 제공에 이용될 수 있습니다." },
  { title: "7. 기존 기기 저장정보의 계정 이전", body: "카카오 간편로그인 도입 이전에 기기 또는 브라우저에 저장되어 있던 반려동물 정보가 있는 경우 이용자의 선택과 동의에 따라 로그인 계정으로 이전할 수 있습니다. 서버 저장이 정상 완료되기 전에 기존 데이터를 임의로 삭제하지 않도록 운영합니다." },
  { title: "8. 개인정보의 제3자 제공·처리위탁 및 국외 이전", body: "PetGrow는 이용자의 개인정보를 임의로 판매하지 않습니다. 제3자 제공, 처리위탁 또는 국외 이전이 발생하는 경우 실제 데이터 흐름, 제공자, 처리 목적, 항목, 보유기간 및 관련 법령상 고지·동의 필요 여부를 확인하여 본 방침에 반영합니다. 실제 사용하는 DB, Storage 및 호스팅 사업자는 최종 배포 구조에 맞추어 구체적으로 기재합니다.\n\n현재 PetGrow는 회원 데이터 저장을 위해 Vercel(호스팅 및 서버리스 인프라), Vercel Postgres(데이터베이스, Neon 기반), Vercel Blob(Pet톡 게시글 사진 저장)을 사용하고 있으며, 이 과정에서 이용자의 반려동물 정보 및 Pet톡 게시물 등이 해당 사업자의 서버(국외 소재 가능)에 저장·처리될 수 있습니다." },
  { title: "9. 외부 서비스", body: "PetGrow는 서비스 운영을 위해 카카오(간편로그인), Google AdMob(광고), 데이터베이스·파일 저장·호스팅 제공업체 등을 사용할 수 있습니다. Google은 간편로그인 제공자가 아니라 광고 등 실제 사용하는 서비스의 제공자로만 기재합니다. 외부 사업자가 자체적으로 처리하는 개인정보에는 해당 사업자의 개인정보처리방침이 적용될 수 있습니다." },
  { title: "10. 쿠키 및 유사 기술", body: "웹 서비스는 로그인 유지, 서비스 제공, 이용 현황 분석 또는 광고 제공 등을 위해 쿠키 및 유사 기술을 사용할 수 있습니다. 이용자는 브라우저 또는 기기 설정을 통해 일부 기능을 제한할 수 있으나 서비스 이용에 제한이 생길 수 있습니다." },
  { title: "11. 개인정보의 파기", body: "개인정보 처리 목적이 달성되거나 회원이 탈퇴한 경우 관계 법령상 보관 의무가 있는 정보를 제외하고 개인정보를 삭제합니다. 삭제 대상에는 PetGrow 계정, 카카오 인증 관련 식별정보, 반려동물 정보, 프로필 사진, 저장된 검사 및 서비스 결과, Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진 등이 포함될 수 있습니다." },
  { title: "12. 이용자의 권리", body: "이용자는 관련 법령에서 정한 범위에서 자신의 개인정보에 대한 열람, 정정, 삭제 또는 처리정지 등을 요청할 수 있습니다. 서비스 내 회원탈퇴 기능을 통해 계정 및 관련 데이터 삭제를 요청할 수 있으며, 앱 이용이 어려운 경우 help.petgrow@gmail.com으로 문의할 수 있습니다." },
  { title: "13. 회원탈퇴 및 계정 삭제", body: "회원은 언제든지 PetGrow의 계정 또는 설정 메뉴에서 회원탈퇴를 요청할 수 있습니다. 탈퇴 완료 시 법령상 별도 보관 의무가 있는 경우를 제외하고 계정과 연결된 개인정보 및 서비스 데이터를 삭제합니다.\n\n계정 삭제 안내: https://www.petgrow.co.kr/delete-account" },
  { title: "14. 아동의 개인정보", body: "PetGrow는 아동의 개인정보를 의도적으로 수집하는 것을 목적으로 하지 않습니다. 향후 아동을 대상으로 하는 기능을 제공하거나 아동의 개인정보를 처리하게 되는 경우 관련 법령 및 앱 마켓 정책에서 요구하는 보호조치를 적용합니다." },
  { title: "15. 개인정보의 안전성 확보조치", body: "PetGrow는 인증정보 및 비밀키 보호, 사용자별 데이터 접근권한 제한, 불필요한 접근 최소화, 서비스 보안 점검 등 합리적으로 필요한 기술적·관리적 보호조치를 적용하도록 노력합니다." },
  { title: "16. Pet톡(커뮤니티) 서비스와 개인정보", body: "PetGrow는 회원 간 반려동물 정보를 공유하는 커뮤니티 기능 'Pet톡'을 제공합니다. Pet톡 이용과 관련하여 다음 정보가 처리됩니다.\n- 게시글, 댓글, 좋아요 및 신고 내역\n- 게시글에 첨부한 사진(최대 5장)\n- 게시글·댓글에 표시되는 반려동물 정보(반려동물 이름, 품종, 생년월일 기반 나이, 프로필 사진)\n\n회원의 카카오 식별정보, 이메일 등 회원 개인정보는 다른 회원에게 공개되지 않으며, Pet톡에는 회원이 선택한 반려동물의 이름·품종·나이·프로필 사진만 표시됩니다. 작성자는 게시글 상세 화면에서 게시글을 공개 또는 비공개로 전환할 수 있으며, 비공개 게시글은 작성자 본인에게만 제공됩니다. 게시글 작성자 본인 여부는 서버에서만 확인하며 다른 회원에게 노출되지 않습니다." },
  { title: "17. Pet톡 게시물의 보유기간 및 삭제", body: "Pet톡의 게시글·댓글·좋아요·신고 내역은 게시글/댓글이 삭제되거나 회원이 탈퇴할 때까지 보유됩니다. 회원은 본인이 작성한 게시글과 댓글을 언제든지 직접 삭제할 수 있습니다. 회원탈퇴 시 해당 회원이 작성한 모든 게시글·댓글·좋아요 기록은 즉시 삭제되며, 첨부된 사진 파일도 함께 삭제됩니다. 신고 내역은 신고한 회원이 탈퇴하는 경우 함께 삭제됩니다.\n\nPetGrow는 신고된 게시물에 대해 운영자가 확인 후 게시글·댓글을 숨기거나 삭제할 수 있습니다." },
  { title: "18. Pet톡 이미지 저장", body: "Pet톡에 첨부하는 사진은 Vercel Blob(파일 저장 서비스)에 저장되며, 데이터베이스에는 사진의 저장 위치(URL)만 저장됩니다. 업로드 시 허용된 이미지 형식(JPG/PNG/WebP) 및 용량 제한이 적용되며, 게시글이 삭제되면 저장된 사진 파일도 함께 삭제됩니다." },
  { title: "19. 개인정보 관련 문의", body: "서비스명: PetGrow\n문의 이메일: help.petgrow@gmail.com" },
  { title: "20. 개인정보처리방침의 변경", body: "서비스 기능, 개인정보 처리 방식, 외부 서비스 또는 관련 법령·정책 변경에 따라 본 개인정보처리방침이 변경될 수 있습니다. 중요한 변경사항은 PetGrow 웹사이트 또는 애플리케이션을 통해 안내합니다.\n\n최종 업데이트: 2026년 8월 15일\n시행일: 2026년 8월 15일" },
];
const PRIVACY_SECTIONS_EN = [
  { title: "1. Purpose of Processing", body: "PetGrow may process personal information to the extent necessary for: member identification and account management via Kakao Login; keeping you logged in; storing and syncing pet information across devices; saving and re-viewing results such as PetBTI; customer support; improving service stability and quality; delivering ads and measuring ad performance; preventing fraud; and processing account deletion and related data removal." },
  { title: "2. Categories of Personal Information Processed", body: "a. Kakao Login\n- The unique user identifier provided by Kakao\n- Nickname and profile image are only processed where actually consented to and used by the service\n- Additional info such as email is only requested with consent where actually needed\n\nb. Pet & service information\n- Pet name, species, breed, birth date, sex, current weight, and growth-related information\n- Pet profile photo\n- PetBTI results and test date\n- Saju and other service results that need to be saved\n\nc. Information that may be processed automatically\n- IP address, device/OS/browser or app info\n- Access and usage logs, error/security logs\n- Advertising identifiers and ad interaction data\n\nPetGrow's principle is not to request phone number, gender, birthday, friend list, or other information not needed for the service." },
  { title: "3. How Information Is Stored", body: "Information you register or create after logging in is not simply stored on 'this device' or 'this browser' — it is linked to your logged-in PetGrow account and may be stored/synced on our servers or cloud storage. Logging in with the same Kakao account lets you retrieve your saved information on other supported devices or the web. Data stored locally before Kakao Login was introduced may be migrated to your account with a separate process." },
  { title: "4. Retention Period", body: "Member accounts and connected personal information are generally retained until account deletion. Upon deletion, the account and related personal information are deleted except where retention is required by law. Information processed by external authentication, advertising, or hosting providers follows those providers' own policies and actual processing structure." },
  { title: "5. Kakao Login", body: "PetGrow may provide Kakao Login for convenience. During login, only the information you consent to on Kakao's consent screen is provided to PetGrow. It is processed for member identification, account creation/management, per-user data storage/sync, account deletion, and customer support." },
  { title: "6. Pet Information and Profile Photos", body: "Pet information and profile photos you register may be stored linked to your PetGrow account, and used to provide pet-specific features such as My Pets, growth info, Saju, and PetBTI." },
  { title: "7. Migrating Existing Device Data", body: "If pet information was stored on your device or browser before Kakao Login was introduced, it may be migrated to your logged-in account with your choice and consent. We do not arbitrarily delete existing data before the server-side save is confirmed successful." },
  { title: "8. Third-Party Provision, Outsourcing, and Overseas Transfer", body: "PetGrow does not arbitrarily sell your personal information. Where third-party provision, outsourcing, or overseas transfer occurs, we reflect the actual data flow, provider, purpose, items, retention period, and any notice/consent required by law in this policy. The actual DB, storage, and hosting providers used are specified according to the final deployment structure.\n\nPetGrow currently uses Vercel (hosting and serverless infrastructure), Vercel Postgres (database, powered by Neon), and Vercel Blob (storage for Pet Talk post photos) to store member data; in this process, pet information and Pet Talk posts etc. may be stored and processed on these providers' servers, which may be located overseas." },
  { title: "9. External Services", body: "PetGrow may use Kakao (login), Google AdMob (advertising), and database/storage/hosting providers to operate the service. Google is listed only as the provider of services actually used, such as advertising — not as a login provider. Personal information processed by external providers on their own may be subject to those providers' own privacy policies." },
  { title: "10. Cookies and Similar Technologies", body: "The web service may use cookies and similar technologies to keep you logged in, provide the service, analyze usage, or serve ads. You can limit some functions via browser or device settings, though this may limit service use." },
  { title: "11. Destruction of Personal Information", body: "Once the purpose of processing is achieved or a member withdraws, personal information is deleted except where retention is required by law. Items subject to deletion may include the PetGrow account, Kakao authentication-related identifiers, pet information, profile photos, and saved test/service results." },
  { title: "12. Your Rights", body: "You may request to view, correct, delete, or stop processing of your personal information within the scope set by applicable law. You can request account and related data deletion via the in-service account deletion feature, or contact help.petgrow@gmail.com if you're unable to use the app." },
  { title: "13. Account Withdrawal and Deletion", body: "You may request account withdrawal at any time from PetGrow's account/settings menu. Upon completion, personal information and service data linked to the account are deleted except where separate retention is legally required.\n\nAccount deletion info: https://www.petgrow.co.kr/delete-account" },
  { title: "14. Children's Personal Information", body: "PetGrow does not intend to intentionally collect children's personal information. If PetGrow offers features aimed at children or processes children's personal information in the future, it will apply the protective measures required by applicable law and app marketplace policy." },
  { title: "15. Security Measures", body: "PetGrow strives to apply reasonably necessary technical and managerial safeguards, including protecting authentication credentials and secret keys, limiting per-user data access, minimizing unnecessary access, and conducting security checks." },
  { title: "16. Pet Talk (Community) and Personal Information", body: "PetGrow provides 'Pet Talk,' a community feature for sharing pet information between members. The following is processed in connection with Pet Talk:\n- Posts, comments, likes, and reports\n- Photos attached to posts (up to 5 per post)\n- Pet information shown on posts/comments (pet name, breed, age derived from birth date, profile photo)\n\nA member's Kakao identifier, email, and other personal information are never shown to other members. Only the name, breed, age, and profile photo of the pet the member chooses are shown on Pet Talk. Authors can switch their own post between public and private on the post detail screen; private posts are available only to the author. Whether a member is the author of a post is checked only on the server and is never exposed to other members." },
  { title: "17. Retention and Deletion of Pet Talk Content", body: "Posts, comments, likes, and reports on Pet Talk are retained until the post/comment is deleted or the member withdraws. Members can delete their own posts and comments at any time. Upon account withdrawal, all posts, comments, and likes by that member are deleted immediately, along with any attached photo files. Report records are deleted if the reporting member withdraws.\n\nPetGrow may hide or delete reported posts/comments after operator review." },
  { title: "18. Pet Talk Image Storage", body: "Photos attached to Pet Talk posts are stored in Vercel Blob (a file storage service); only the storage location (URL) is stored in the database. Uploads are restricted to allowed image formats (JPG/PNG/WebP) and a size limit, and stored photo files are deleted when a post is deleted." },
  { title: "19. Contact", body: "Service: PetGrow\nContact email: help.petgrow@gmail.com" },
  { title: "20. Changes to This Policy", body: "This policy may change due to changes in service features, how personal information is processed, external services, or applicable laws/policies. Material changes will be announced via the PetGrow website or app.\n\nLast updated: August 15, 2026\nEffective date: August 15, 2026" },
];

const TERMS_SECTIONS_KO = [
  { title: "제1조 (목적)", body: "본 약관은 PetGrow가 제공하는 웹사이트, 모바일 애플리케이션 및 관련 서비스의 이용조건과 PetGrow 및 이용자의 권리·의무·책임사항을 정함을 목적으로 합니다." },
  { title: "제2조 (용어의 정의)", body: "① \"서비스\"란 PetGrow가 제공하는 반려동물 등록·성장정보·Pet사주·PetBTI·Pet꿀팁 및 기타 관련 기능을 말합니다.\n② \"이용자\"란 PetGrow 서비스를 이용하는 모든 자를 말합니다.\n③ \"회원\"이란 카카오 간편로그인을 통해 계정을 생성하고 서비스를 이용하는 자를 말합니다.\n④ \"계정\"이란 회원 식별 및 사용자별 데이터 저장을 위해 생성되는 PetGrow 이용자 정보를 말합니다.\n⑤ \"반려동물 정보\"란 회원이 등록하는 반려동물의 이름, 종류, 품종, 생년월일, 성별, 체중, 프로필 사진 및 기타 관련 정보를 말합니다." },
  { title: "제3조 (약관의 효력 및 변경)", body: "본 약관은 서비스에 게시함으로써 효력이 발생합니다. PetGrow는 관련 법령을 위반하지 않는 범위에서 필요한 경우 약관을 변경할 수 있으며 중요한 변경사항은 서비스 내에서 안내합니다." },
  { title: "제4조 (회원가입 및 이용계약)", body: "이용자가 카카오 간편로그인 등 PetGrow가 제공하는 인증 절차를 완료하고 필요한 약관 및 개인정보 관련 절차에 동의하면 이용계약이 성립할 수 있습니다." },
  { title: "제5조 (카카오 간편로그인)", body: "① PetGrow는 회원 편의를 위해 카카오의 외부 인증 서비스를 이용한 간편로그인을 제공할 수 있습니다.\n② 회원은 카카오 계정을 이용하여 PetGrow에 로그인할 수 있습니다.\n③ 카카오 서비스의 장애, 정책 변경 또는 이용자의 카카오 계정 상태에 따라 로그인이 일시적으로 제한될 수 있습니다.\n④ 카카오 인증 서비스 자체에 대해서는 카카오의 이용약관 및 개인정보처리방침이 적용될 수 있습니다." },
  { title: "제6조 (계정 및 로그인 상태 관리)", body: "회원은 자신의 카카오 계정을 안전하게 관리해야 합니다. PetGrow의 주요 기능은 로그인한 회원에게 제공될 수 있으며, 로그아웃 시 서버에 저장된 계정 데이터는 삭제되지 않습니다. 동일한 카카오 계정으로 다시 로그인하면 저장된 정보를 불러올 수 있습니다." },
  { title: "제7조 (서비스 제공)", body: "PetGrow는 우리 아이 등록·관리, 성장 예상 및 성장정보, Pet사주, PetBTI, Pet꿀팁, 정보가이드, Pet톡 커뮤니티, MY(계정·활동 관리), 계정별 데이터 저장 및 기기 간 동기화 등의 서비스를 제공할 수 있습니다." },
  { title: "제8조 (데이터 저장 및 동기화)", body: "로그인 회원이 등록한 반려동물 정보와 일부 서비스 결과는 회원 계정에 연결하여 서버 또는 클라우드 저장소에 저장될 수 있습니다. 따라서 서비스 내에서 '이 기기에만 저장', '이 브라우저에만 저장'되는 것으로 안내하지 않습니다. 동일한 카카오 계정으로 로그인하면 지원되는 다른 기기 또는 웹 환경에서 저장된 정보를 불러올 수 있습니다. 다만 카카오 간편로그인 도입 이전의 기존 로컬 데이터는 별도의 이전 절차가 적용될 수 있습니다." },
  { title: "제9조 (이용자의 의무)", body: "이용자는 타인의 계정·정보 도용, 시스템의 정상 운영 방해, 취약점 악용, 불법적인 데이터 수집, PetGrow 또는 제3자의 권리 침해, 관계 법령 위반 등의 행위를 해서는 안 됩니다." },
  { title: "제10조 (서비스 이용 제한)", body: "이용자가 본 약관 또는 관계 법령을 위반하거나 서비스의 안정적인 운영을 방해하는 경우 PetGrow는 필요한 범위에서 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다." },
  { title: "제11조 (회원탈퇴 및 이용계약 해지)", body: "회원은 언제든지 서비스 내 회원탈퇴 기능을 통해 이용계약을 해지할 수 있습니다. 회원탈퇴가 완료되면 관계 법령에 따라 별도로 보관해야 하는 정보가 있는 경우를 제외하고 회원계정 및 계정과 연결된 개인정보와 저장정보를 삭제합니다." },
  { title: "제12조 (반려동물 관련 정보 및 계산 결과)", body: "PetGrow의 성장 예상, 체중 계산 및 기타 반려동물 관련 정보는 일반적인 자료와 이용자가 입력한 정보를 기반으로 제공되는 참고용 정보이며 실제 결과를 보장하지 않습니다." },
  { title: "제13조 (건강 관련 정보)", body: "PetGrow에서 제공하는 건강, 식단, 영양 및 관리 정보는 일반적인 참고정보이며 수의사의 진료, 진단 또는 처방을 대신하지 않습니다. 반려동물에게 이상 증상이나 응급상황이 있는 경우 수의사 또는 동물병원의 진료를 받아야 합니다." },
  { title: "제14조 (Pet사주·PetBTI 등 재미 콘텐츠)", body: "Pet사주 및 PetBTI 등은 재미와 참고를 위한 콘텐츠이며 과학적 진단, 의학적 판단 또는 미래 결과를 보장하는 자료가 아닙니다." },
  { title: "제15조 (광고 및 외부 서비스)", body: "PetGrow는 서비스 운영을 위해 광고 및 카카오 인증, Google AdMob 등 외부 서비스를 이용할 수 있습니다. Google은 간편로그인 수단으로 제공하지 않으며, 실제 사용하는 광고 등 외부 서비스에 대해서만 해당 제공자의 이용약관 및 개인정보처리방침이 적용될 수 있습니다." },
  { title: "제16조 (개인정보 보호)", body: "회원의 개인정보 처리에 관한 사항은 PetGrow 개인정보처리방침에 따릅니다." },
  { title: "제17조 (지식재산권)", body: "PetGrow가 직접 제작한 로고, 디자인, 문구, 프로그램 및 콘텐츠에 대한 권리는 PetGrow 또는 정당한 권리자에게 귀속됩니다. 이용자는 권리자의 허락 없이 이를 영리 목적으로 복제·배포·판매 또는 변형해서는 안 됩니다." },
  { title: "제18조 (Pet톡 게시물의 작성 및 책임)", body: "① \"Pet톡\"이란 회원이 등록한 반려동물을 중심으로 사진과 글을 공유하는 PetGrow의 커뮤니티 기능을 말합니다.\n② 회원은 Pet톡에 게시글·댓글(이하 \"게시물\")을 작성할 때 자신이 등록한 반려동물 중 하나를 선택하여 함께 표시할 수 있습니다.\n③ 게시물의 내용에 대한 책임은 작성자 본인에게 있으며, 회원은 다음 각 호에 해당하는 게시물을 작성해서는 안 됩니다.\n1. 광고·홍보성 게시물\n2. 욕설·비방 등 타인을 모욕하거나 명예를 훼손하는 게시물\n3. 음란하거나 부적절한 콘텐츠\n4. 동물학대를 조장하거나 미화하는 콘텐츠\n5. 타인의 개인정보를 노출하는 게시물\n6. 허위 사실이나 반려동물에게 위험할 수 있는 정보를 사실인 것처럼 유포하는 게시물\n7. 동일하거나 유사한 내용을 반복적으로 게시(도배)하는 행위\n8. 그 밖에 관계 법령 또는 본 약관을 위반하는 게시물\n④ 건강·식단 카테고리에 게시되는 내용은 회원 개인의 경험이나 의견이며, PetGrow가 직접 작성하거나 검증한 전문 의료정보가 아닙니다. 반려동물의 건강 문제는 반드시 수의사와 상담해야 합니다." },
  { title: "제19조 (게시물의 저작권 및 이용허락)", body: "① 회원이 Pet톡에 게시한 글과 사진의 저작권은 원칙적으로 해당 게시물을 작성한 회원 본인에게 귀속됩니다.\n② 회원은 게시물을 PetGrow 서비스 내에서 게시·전시·전송하는 데 필요한 범위에서 PetGrow에게 무상으로 이용을 허락한 것으로 봅니다. 이는 게시물의 저작권을 PetGrow에 양도하는 것이 아닙니다.\n③ PetGrow는 게시물을 서비스 운영 목적을 벗어나 회원의 동의 없이 상업적으로 이용하지 않습니다.\n④ 회원은 자신이 작성한 Pet톡 게시글을 공개 또는 비공개로 전환할 수 있으며, 비공개 게시글은 작성자 본인에게만 표시됩니다." },
  { title: "제20조 (신고 및 게시물 관리)", body: "① 회원은 다른 회원의 게시물이 제18조 제3항 각 호에 해당한다고 판단되는 경우 서비스 내 신고 기능을 통해 신고할 수 있습니다.\n② 타인의 권리(저작권, 초상권, 개인정보 등)를 침해하는 게시물을 발견한 경우 help.petgrow@gmail.com으로 침해 사실을 구체적으로 알려 삭제 등 조치를 요청할 수 있습니다.\n③ PetGrow는 신고가 접수되거나 제18조 제3항을 위반한 것으로 확인되는 게시물에 대해 사전 통지 없이 게시물을 숨기거나 삭제할 수 있고, 반복적으로 위반하는 회원의 서비스 이용을 제한할 수 있습니다.\n④ 신고 내용 및 처리 이력은 서비스 운영 및 부정 이용 방지 목적으로 보관될 수 있습니다." },
  { title: "제21조 (회원탈퇴와 게시물)", body: "회원탈퇴 시 해당 회원이 Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진은 계정 삭제와 동시에 즉시 삭제되며, 삭제된 게시물은 복구할 수 없습니다. 다른 회원이 그 게시글에 남긴 댓글도 게시글과 함께 삭제됩니다." },
  { title: "제22조 (서비스 변경 및 종료)", body: "PetGrow는 서비스 개선이나 기술적·운영상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다. 중요한 변경 또는 서비스 종료가 예정된 경우 가능한 범위에서 사전에 안내합니다." },
  { title: "제23조 (책임의 제한)", body: "천재지변, 통신장애, 카카오 인증 서비스 장애 또는 PetGrow가 합리적으로 통제하기 어려운 사유로 서비스 이용에 문제가 발생한 경우 관련 법령에서 허용하는 범위에서 책임이 제한될 수 있습니다. 본 조는 관련 법령상 PetGrow가 부담해야 하는 책임을 부당하게 배제하는 것으로 해석되지 않습니다." },
  { title: "제24조 (분쟁 해결 및 준거법)", body: "본 약관은 대한민국 법령을 준거법으로 합니다. PetGrow와 이용자 사이에 분쟁이 발생하는 경우 상호 원만한 해결을 위해 노력하며 관할법원은 관계 법령에서 정하는 바에 따릅니다." },
  { title: "부칙", body: "본 약관은 2026년 8월 15일부터 시행합니다.\n최종 업데이트: 2026년 8월 15일" },
];
const TERMS_SECTIONS_EN = [
  { title: "Article 1 (Purpose)", body: "These Terms set out the conditions of use for the website, mobile application, and related services provided by PetGrow, and the rights, obligations, and responsibilities of PetGrow and users." },
  { title: "Article 2 (Definitions)", body: "① \"Service\" means pet registration, growth info, Saju, PetBTI, Pet Tips, and other related features provided by PetGrow.\n② \"User\" means anyone who uses the PetGrow service.\n③ \"Member\" means a person who creates an account via Kakao Login and uses the service.\n④ \"Account\" means PetGrow user information created to identify members and store per-user data.\n⑤ \"Pet Information\" means a pet's name, species, breed, date of birth, sex, weight, profile photo, and other related information registered by a member." },
  { title: "Article 3 (Effect and Amendment of Terms)", body: "These Terms take effect when posted on the service. PetGrow may amend these Terms as needed, within the bounds of applicable law, and will announce material changes within the service." },
  { title: "Article 4 (Membership and Service Agreement)", body: "A service agreement may be formed once a user completes an authentication procedure provided by PetGrow (such as Kakao Login) and agrees to the required terms and personal-information procedures." },
  { title: "Article 5 (Kakao Login)", body: "① PetGrow may provide Kakao Login, using Kakao's external authentication service, for member convenience.\n② Members may log in to PetGrow using their Kakao account.\n③ Login may be temporarily limited due to Kakao service outages, policy changes, or the status of a user's Kakao account.\n④ Kakao's own Terms of Service and Privacy Policy may apply to the Kakao authentication service itself." },
  { title: "Article 6 (Account and Login Session Management)", body: "Members must securely manage their own Kakao account. PetGrow's core features may be provided to logged-in members, and account data stored on the server is not deleted upon logout. Logging in again with the same Kakao account lets you retrieve your saved information." },
  { title: "Article 7 (Provision of Service)", body: "PetGrow may provide services including registering/managing pets, growth prediction and growth info, Saju, PetBTI, Pet Tips, the info guide, Pet Talk community, MY account/activity management, and per-account data storage and cross-device sync." },
  { title: "Article 8 (Data Storage and Sync)", body: "Pet information and certain service results registered by a logged-in member may be stored on our servers or cloud storage, linked to the member's account. Accordingly, the service does not describe data as being stored 'only on this device' or 'only in this browser.' Logging in with the same Kakao account lets you retrieve saved information on other supported devices or the web. Local data predating Kakao Login may be subject to a separate migration process." },
  { title: "Article 9 (User Obligations)", body: "Users must not impersonate or misuse another person's account or information, interfere with normal system operation, exploit vulnerabilities, unlawfully collect data, infringe the rights of PetGrow or third parties, or violate applicable law." },
  { title: "Article 10 (Restriction of Service Use)", body: "If a user violates these Terms or applicable law, or interferes with the stable operation of the service, PetGrow may restrict use of the service or terminate the service agreement to the necessary extent." },
  { title: "Article 11 (Withdrawal and Termination)", body: "Members may terminate the service agreement at any time via the in-service account withdrawal feature. Upon completion, the member account and connected personal information and stored data are deleted, except for information that must be separately retained under applicable law." },
  { title: "Article 12 (Pet-Related Information and Calculated Results)", body: "PetGrow's growth predictions, weight calculations, and other pet-related information are reference information based on general data and information entered by the user, and do not guarantee actual outcomes." },
  { title: "Article 13 (Health-Related Information)", body: "Health, diet, nutrition, and care information provided by PetGrow is general reference information and does not replace examination, diagnosis, or treatment by a veterinarian. If your pet shows abnormal symptoms or an emergency, please see a veterinarian or animal hospital." },
  { title: "Article 14 (Saju, PetBTI, and Other Entertainment Content)", body: "Saju and PetBTI are content for entertainment and reference purposes, and are not scientific diagnosis, medical judgment, or a guarantee of future outcomes." },
  { title: "Article 15 (Advertising and External Services)", body: "PetGrow may use external services such as advertising, Kakao authentication, and Google AdMob to operate the service. Google is not provided as a login method; the terms and privacy policy of external providers apply only to services actually used, such as advertising." },
  { title: "Article 16 (Protection of Personal Information)", body: "Matters regarding processing of members' personal information follow the PetGrow Privacy Policy." },
  { title: "Article 17 (Intellectual Property)", body: "Rights to logos, designs, text, programs, and content created directly by PetGrow belong to PetGrow or its rightful owners. Users must not reproduce, distribute, sell, or modify these for commercial purposes without the rights holder's permission." },
  { title: "Article 18 (Posting and Responsibility on Pet Talk)", body: "① \"Pet Talk\" means PetGrow's community feature for sharing photos and posts centered on a member's registered pet.\n② When posting or commenting on Pet Talk (\"Content\"), members may select one of their registered pets to display alongside it.\n③ Members are responsible for their own Content and must not post Content that:\n1. Is advertising or promotional in nature\n2. Insults or defames others, including abusive language\n3. Is sexual or otherwise inappropriate\n4. Promotes or glorifies animal abuse\n5. Exposes another person's personal information\n6. Spreads false or potentially dangerous information as if it were fact\n7. Repeats the same or similar content excessively (spam)\n8. Otherwise violates applicable law or these Terms\n④ Content in the Health & Diet category reflects individual members' experience or opinions, not professional medical information written or verified by PetGrow. Always consult a veterinarian for your pet's health issues." },
  { title: "Article 19 (Copyright and License to Content)", body: "① Copyright in text and photos a member posts on Pet Talk belongs, in principle, to that member.\n② By posting, a member grants PetGrow a free license to display, exhibit, and transmit the Content to the extent necessary to operate the service within PetGrow. This is not a transfer of copyright to PetGrow.\n③ PetGrow will not use Content commercially beyond the purpose of operating the service without the member's consent.\n④ Members may switch their own Pet Talk posts between public and private; private posts are shown only to the author." },
  { title: "Article 20 (Reports and Content Moderation)", body: "① Members may report another member's Content believed to violate Article 18(3) using the in-service report feature.\n② If you find Content that infringes your rights (copyright, likeness, personal information, etc.), you may contact help.petgrow@gmail.com with specifics to request removal or other action.\n③ PetGrow may hide or delete reported Content, or Content confirmed to violate Article 18(3), without prior notice, and may restrict the service access of members who repeatedly violate these Terms.\n④ Report content and handling history may be retained for service operation and fraud-prevention purposes." },
  { title: "Article 21 (Account Withdrawal and Content)", body: "Upon account withdrawal, that member's Pet Talk posts, comments, likes, and attached photos are deleted immediately along with the account, and cannot be recovered. Other members' comments on a deleted post are also deleted along with that post." },
  { title: "Article 22 (Changes to and Discontinuation of Service)", body: "PetGrow may change all or part of the service for improvement or operational/technical reasons. Where a material change or discontinuation is planned, PetGrow will provide advance notice where reasonably possible." },
  { title: "Article 23 (Limitation of Liability)", body: "Where an issue arises from force majeure, communication failure, a Kakao authentication service outage, or a cause PetGrow cannot reasonably control, PetGrow's liability may be limited to the extent permitted by applicable law. This article shall not be construed as unfairly excluding liability that PetGrow must bear under applicable law." },
  { title: "Article 24 (Dispute Resolution and Governing Law)", body: "These Terms are governed by the laws of the Republic of Korea. PetGrow and users will make good-faith efforts to resolve disputes amicably, and jurisdiction follows applicable law." },
  { title: "Addendum", body: "These Terms take effect on August 15, 2026.\nLast updated: August 15, 2026." },
];

function LegalContent({ title, intro, sections, contactExtra }) {
  const t = useT();
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      <button type="button" onClick={() => { window.location.href = "/"; }}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20 }}>
        <PetGrowLogo style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
          <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
        </span>
      </button>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>{title}</h1>
      {intro && <p className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>{intro}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {sections.map((s) => (
          <div key={s.title}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
            <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text)", whiteSpace: "pre-line" }}>{s.body}</div>
          </div>
        ))}
      </div>
      {contactExtra}
      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="mailto:help.petgrow@gmail.com?subject=%5BPetGrow%5D%20%EB%AC%B8%EC%9D%98" className="bg-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "9px 18px", fontSize: 13 }}>
            <MailIcon style={{ width: 14, height: 14 }} /> {t.contactBtn}
          </a>
        </div>
      </div>
    </div>
  );
}

function PrivacyContent() {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS_KO;
  return <LegalContent title={t.privacyTitle} intro={t.privacyIntro} sections={sections} />;
}

function TermsContent() {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? TERMS_SECTIONS_EN : TERMS_SECTIONS_KO;
  return <LegalContent title={t.termsTitle} intro={t.termsIntro} sections={sections} />;
}

// petgrow.co.kr/privacy, /terms 로 실제 배포됐을 때 직접 접속하는 경우를 위한 독립 페이지 (로그인 없이 접근 가능)
function PrivacyPage() {
  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0" }}>
        <PrivacyContent />
      </div>
    </div>
  );
}
function TermsPage() {
  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0" }}>
        <TermsContent />
      </div>
    </div>
  );
}

/* ============================================================
   로그인 / 회원가입 (데모 — Supabase Auth 연동 전 UI 목업)
   카카오 간편로그인 전용. 실제 인가 코드 교환/세션 발급은 서버(/api/auth/kakao/*)에서 처리해요.
   ============================================================ */
function LoginScreen({ onGoTerms, onGoPrivacy }) {
  const t = useT();
  return (
    <div style={{ maxWidth: 380, margin: "40px auto 0", textAlign: "center" }}>
      <PetGrowLogo style={{ width: 56, height: 56, margin: "0 auto 14px" }} />
      <h2 style={{ fontSize: 20, fontFamily: "'Jua',sans-serif", marginBottom: 6 }}>
        <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span> 🐾
      </h2>
      <p className="bg-sub" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{t.loginTagline}</p>

      <button type="button" className="kakao-login-btn" onClick={goToKakaoLogin}>
        <KakaoIcon style={{ width: 20, height: 20 }} /> {t.loginContinueKakao}
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26 }}>
        <button type="button" onClick={onGoTerms}
          style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {t.termsFooterLink}
        </button>
        <button type="button" onClick={onGoPrivacy}
          style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {t.privacyFooterLink}
        </button>
      </div>
    </div>
  );
}

function AccountButton({ account, onOpen }) {
  const t = useT();
  if (account) {
    return (
      <button type="button" className="account-btn" onClick={onOpen} title={t.accountSettingsBtn}>
        <UserIcon style={{ width: 16, height: 16, color: "var(--primary)" }} />
        {account.name}
      </button>
    );
  }
  return (
    <button type="button" className="account-btn" onClick={onOpen}>
      <UserIcon style={{ width: 16, height: 16 }} /> {t.accountLoginBtn}
    </button>
  );
}

// 모바일 웹 전용 햄버거 메뉴 — 슬라이드 애니메이션, 오버레이, X 닫기, 바깥 터치 시 닫힘, 뒤 스크롤 잠금
function HamburgerMenu({ open, onClose, view, onNavigate, onOpenAccount, account }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  const items = [
    { key: "home", label: t.hamNavHome, Icon: HomeIcon },
    { key: "about", label: t.aboutNav, Icon: InfoIcon },
    { key: "pets", label: t.myPetsNav, Icon: PawIcon },
    { key: "community", label: t.communityNav, Icon: TalkIcon },
    { key: "saju", label: t.sajuNav, Icon: SajuIcon },
    { key: "petbti", label: t.petBtiNav, Icon: PetBtiIcon },
    { key: "tips", label: t.tipsTitle, Icon: LightbulbIcon },
    { key: "guide", label: t.infoGuideTitle, Icon: HelpIcon },
  ];

  return (
    <>
      <div className={`ham-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden={!open} />
      <div className={`ham-panel ${open ? "open" : ""}`} role="dialog" aria-label={t.hamNavHome}>
        <div className="ham-panel-header">
          <span style={{ fontWeight: 800, fontFamily: "'Jua',sans-serif", fontSize: 16 }}>
            <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
          </span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t.hamCloseAria}>
            <CloseIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <nav className="ham-nav">
          {items.map(({ key, label, Icon }) => (
            <button key={key} type="button" className={`ham-nav-item ${view === key ? "active" : ""}`}
              onClick={() => { onNavigate(key); onClose(); }}>
              <Icon style={{ width: 18, height: 18 }} /> {label}
            </button>
          ))}
          <div className="ham-divider" />
          <button type="button" className={`ham-nav-item ${view === "my" ? "active" : ""}`} onClick={() => { onNavigate("my"); onClose(); }}>
            <UserIcon style={{ width: 18, height: 18 }} /> {t.hamNavMy}
          </button>
          <button type="button" className="ham-nav-item" onClick={() => { onOpenAccount(); onClose(); }}>
            <SettingsIcon style={{ width: 18, height: 18 }} /> {t.hamNavSettings}
          </button>
        </nav>
      </div>
    </>
  );
}

function AccountModal({ open, onClose, account, onLogout, onRequestDelete }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} width={380}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <UserIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 18 }}>{t.accountSettingsTitle}</h3>
      </div>
      {account && (
        <div className="bg-surface-card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          {account.profileImage ? (
            <img src={account.profileImage} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", objectPosition: "center" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserIcon style={{ width: 20, height: 20 }} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{account.name}</div>
            <div className="bg-sub" style={{ fontSize: 12 }}>{t.accountKakaoTag}</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" className="bg-btn bg-btn-ghost" onClick={onLogout}>{t.accountLogoutBtn}</button>
        <button type="button" className="bg-btn bg-btn-ghost" style={{ color: "#C0392B" }} onClick={onRequestDelete}>
          {t.accountDeleteBtn}
        </button>
      </div>
    </Modal>
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
    .result-columns{display:flex; flex-direction:column; gap:16px;}
    .result-block{display:flex; flex-direction:column;}
    @media (min-width:900px){
      .result-columns{display:block; column-count:2; column-gap:20px;}
      .result-columns > *{break-inside:avoid; -webkit-column-break-inside:avoid; margin-bottom:16px; display:block; width:100%;}
    }
    .bg-surface-card{background:var(--surface); border-radius:22px; padding:20px;}
    .bg-input{width:100%; max-width:100%; min-width:0; box-sizing:border-box; padding:12px 16px; border:2px solid var(--border); border-radius:18px; font-family:inherit;
      font-size:14px; background:#fff; color:var(--text);}
    .bg-input:focus{outline:none; border-color:var(--primary);}
    input[type="date"].bg-input{min-width:0; -webkit-min-logical-width:0; -webkit-appearance:none; appearance:none;}
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
      .add-photo-field{flex-basis:auto; width:100%; max-width:100%; overflow:hidden;}
      .add-photo-row > .bg-btn{width:100%;}
      input[type="date"].bg-input{padding-left:12px; padding-right:8px; font-size:13px; width:100%; box-sizing:border-box; -webkit-appearance:none; appearance:none;}
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
    .kakao-login-btn{display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
      height:52px; border-radius:14px; border:none; cursor:pointer; font-family:inherit;
      font-size:16px; font-weight:700; background:#FEE500; color:#191919;}
    .kakao-login-btn:hover{filter:brightness(0.97);}
    .kakao-login-btn:active{filter:brightness(0.93);}
    .tab-bar{display:flex; gap:6px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:2px;}
    .tab-bar::-webkit-scrollbar{display:none;}
    .tab-pill{flex:0 0 auto; display:flex; align-items:center; gap:6px; padding:0 16px; height:40px;
      border-radius:999px; border:1px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.55);
      backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); cursor:pointer; font-family:inherit;
      font-size:13px; font-weight:700; color:var(--text); white-space:nowrap; transition:background .15s,color .15s;}
    .tab-pill.active{background:var(--primary); color:#fff; border-color:var(--primary);}
    /* 900px 기준: 이상은 PC 한 줄 메뉴, 미만은 모바일 상단바 + 햄버거 메뉴 */
    .desktop-nav{display:none;}
    .mobile-topbar{display:flex;}
    @media (min-width:900px){ .desktop-nav{display:flex;} .mobile-topbar{display:none;} }
    .desktop-nav-link{background:none; border:none; cursor:pointer; font-family:inherit; font-size:13.5px; font-weight:700;
      color:var(--sub); padding:8px 9px; border-radius:10px; white-space:nowrap; transition:background .15s,color .15s;}
    .desktop-nav-link:hover{background:var(--surface);}
    .desktop-nav-link.active{color:var(--primary); background:var(--surface);}
    .ham-overlay{position:fixed; inset:0; background:rgba(0,0,0,0); pointer-events:none; z-index:200; transition:background .25s;}
    .ham-overlay.open{background:rgba(0,0,0,.4); pointer-events:auto;}
    .ham-panel{position:fixed; top:0; left:0; bottom:0; width:78%; max-width:300px; background:#fff; z-index:201;
      transform:translateX(-100%); transition:transform .25s ease; box-shadow:2px 0 24px rgba(0,0,0,.12);
      display:flex; flex-direction:column; padding:18px 14px; overflow-y:auto;}
    .ham-panel.open{transform:translateX(0);}
    .ham-panel-header{display:flex; align-items:center; justify-content:space-between; padding:6px 6px 18px;}
    .ham-nav{display:flex; flex-direction:column; gap:2px;}
    .ham-nav-item{display:flex; align-items:center; gap:12px; background:none; border:none; cursor:pointer;
      font-family:inherit; font-size:15px; font-weight:700; color:var(--text); text-align:left;
      padding:13px 10px; border-radius:12px; transition:background .15s,color .15s;}
    .ham-nav-item:hover{background:var(--surface);}
    .ham-nav-item.active{background:var(--primary); color:#fff;}
    .ham-divider{height:1px; background:var(--border); margin:10px 4px;}
    .app-bottom-nav{position:fixed; left:0; right:0; bottom:0; z-index:150; background:#fff;
      border-top:1px solid var(--border); display:flex; padding-bottom:env(safe-area-inset-bottom,0);
      box-shadow:0 -4px 14px rgba(0,0,0,.04);}
    .app-bottom-nav-item{flex:1; display:flex; flex-direction:column; align-items:center; gap:3px;
      background:none; border:none; cursor:pointer; font-family:inherit; padding:9px 2px 8px; color:#9a9d95; font-size:10.5px; font-weight:700;}
    .app-bottom-nav-item.active{color:var(--primary);}
    .home-pet-list{display:flex; flex-direction:column; gap:10px; width:100%; max-width:760px; margin:0 auto;}
    .home-pet-card{display:flex; align-items:center; gap:14px; background:#fff; border:1px solid var(--border);
      border-radius:18px; padding:16px 18px; cursor:pointer; text-align:left; width:100%; max-width:760px; margin-left:auto; margin-right:auto; font-family:inherit;
      box-shadow:0 3px 10px rgba(0,0,0,.03);}
    .home-pet-card-empty{justify-content:center; gap:8px; color:var(--primary); font-weight:700; font-size:14px;
      border-style:dashed; border-color:var(--primary);}
    .home-pet-avatar{width:52px; height:52px; border-radius:50%; overflow:hidden; flex-shrink:0; background:var(--surface);
      display:flex; align-items:center; justify-content:center;}
    .home-pet-avatar img{width:100%; height:100%; object-fit:cover;}
    .home-pet-name{font-weight:800; font-size:16px;}
    .home-service-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:14px;}
    @media (min-width:640px){ .home-service-grid{grid-template-columns:repeat(3,1fr);} }
    .home-service-card{border:none; border-radius:18px; padding:18px 16px; text-align:left; cursor:pointer;
      font-family:inherit; display:flex; flex-direction:column; align-items:flex-start; gap:8px; transition:transform .15s;}
    .home-service-card:hover{transform:translateY(-2px);}
    .home-service-illust{width:44px; height:44px; border-radius:12px; background:rgba(255,255,255,.6);
      display:flex; align-items:center; justify-content:center;}
    .home-service-title{font-weight:800; font-size:14px; color:var(--pg-dark,#1C1C1C);}
    .home-service-desc{font-size:12px; color:#6b6f66; line-height:1.5;}
    .cm-card{background:#fff; border-radius:18px; border:1px solid var(--border); overflow:hidden; cursor:pointer;
      transition:transform .12s, box-shadow .12s;}
    .cm-card:hover{transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.06);}
    .cm-card-img{width:100%; aspect-ratio:4/3; object-fit:cover; background:var(--surface); display:block;}
    .cm-card-body{padding:14px 16px 16px;}
    .cm-pet-row{display:flex; align-items:center; gap:8px; margin-bottom:8px;}
    .cm-pet-avatar{width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; background:var(--surface);}
    .cm-pet-avatar-fallback{width:34px; height:34px; border-radius:50%; flex-shrink:0; background:var(--surface);
      display:flex; align-items:center; justify-content:center; font-size:16px;}
    .cm-cat-chip{display:inline-block; font-size:11px; font-weight:700; color:var(--primary-dark); background:var(--surface);
      border-radius:999px; padding:3px 10px; margin-bottom:8px;}
    .cm-title{font-weight:800; font-size:15px; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
    .cm-content-preview{font-size:13px; color:var(--sub); line-height:1.5; display:-webkit-box;
      -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}
    .cm-meta-row{display:flex; align-items:center; gap:14px; margin-top:10px; font-size:12px; color:var(--sub); font-weight:700;}
    .cm-feed-grid{display:grid; grid-template-columns:1fr; gap:14px;}
    @media (min-width:640px){ .cm-feed-grid{grid-template-columns:1fr 1fr;} }
    .cm-search-input{width:100%; height:44px; border-radius:14px; border:1.5px solid var(--border); padding:0 16px;
      font-family:inherit; font-size:14px; background:#fff;}
    .cm-search-input:focus{outline:none; border-color:var(--primary);}
    .cm-photo-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:8px;}
    .cm-photo-tile{position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; background:var(--surface);}
    .cm-photo-tile img{width:100%; height:100%; object-fit:cover; display:block;}
    .cm-photo-remove{position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%;
      background:rgba(0,0,0,.55); color:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer;}
    .cm-photo-add{aspect-ratio:1; border-radius:12px; border:1.5px dashed var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sub);}
    .cm-carousel{position:relative; width:100%; aspect-ratio:4/3; background:#000; border-radius:16px; overflow:hidden;}
    .cm-carousel img{width:100%; height:100%; object-fit:contain; background:#000; display:block;}
    .cm-carousel-btn{position:absolute; top:50%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%;
      background:rgba(0,0,0,.4); color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px;}
    .cm-carousel-dots{position:absolute; bottom:10px; left:0; right:0; display:flex; justify-content:center; gap:5px;}
    .cm-carousel-dot{width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.5);}
    .cm-carousel-dot.active{background:#fff;}
    .cm-action-row{display:flex; align-items:center; gap:22px; margin:18px 0; font-size:14px; font-weight:700;}
    .cm-action-btn{display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer;
      color:var(--sub); font-family:inherit; font-weight:700; font-size:14px; padding:0;}
    .cm-action-btn.liked{color:var(--primary);}
    .cm-comment-row{display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--border);}
    .cm-comment-avatar{width:26px; height:26px; border-radius:50%; object-fit:cover; flex-shrink:0; background:var(--surface);}
    .login-divider{display:flex; align-items:center; gap:10px; margin:16px 0; color:var(--sub); font-size:12px;}
    .login-divider::before, .login-divider::after{content:""; flex:1; height:1px; background:var(--border);}
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
      min-height:280px; max-height:60vh; padding:0 46px;}
    .slideshow-image-wrap img{max-width:100%; max-height:60vh; border-radius:16px; object-fit:contain;}
    .slideshow-nav{position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px;
      border-radius:50%; border:2px solid rgba(255,255,255,.85); background:rgba(0,0,0,.55); color:#fff;
      font-size:24px; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.4); z-index:3;
      display:flex; align-items:center; justify-content:center;}
    .slideshow-nav:hover{background:rgba(0,0,0,.75);}
    .slideshow-prev{left:8px;} .slideshow-next{right:8px;}
    .slideshow-caption{display:flex; justify-content:space-between; color:#fff; font-size:13px; margin-top:12px;}
    .slideshow-caption .bg-sub{color:rgba(255,255,255,.6);}
    .landing-root{--pg-dark:#1C1C1C; --pg-green:#4F9D3C; --pg-green-light:#F2F8F0;
      background:linear-gradient(180deg,#F7FBF5 0%, #F2F8F0 60%, #F7FBF5 100%); min-height:100vh;}
    .landing-wrap{max-width:960px; margin:0 auto; padding:0 24px;}
    .landing-logo-badge{width:156px; height:156px; border-radius:50%; background:#fff; display:flex;
      align-items:center; justify-content:center; margin:0 auto 18px; box-shadow:0 10px 30px rgba(0,0,0,.1);}
    .landing-wordmark{text-align:center; font-size:clamp(38px,7vw,56px); font-weight:800; letter-spacing:-0.02em;}
    .landing-wordmark .pet{color:var(--pg-dark);} .landing-wordmark .grow{color:var(--pg-green);}
    .landing-tagline{text-align:center; color:#8a8f86; font-size:15px; margin-top:8px;}
    .landing-headline{text-align:center; font-size:clamp(32px,5.5vw,48px); font-weight:800; line-height:1.35; margin-top:44px; color:var(--pg-dark); word-break:keep-all;}
    .landing-headline .hl{color:var(--pg-green);}
    .landing-headline .mobile-br{display:none;}
    @media (max-width:560px){ .landing-headline .mobile-br{display:block; content:"";} }
    .landing-subtitle{text-align:center; color:#787774; font-size:19px; margin-top:18px; line-height:1.75;
      max-width:600px; margin-left:auto; margin-right:auto; word-break:keep-all;}
    .landing-cta{display:block; margin:32px auto 0; background:var(--pg-green); color:#fff; border:none;
      border-radius:14px; padding:18px 42px; font-size:18px; font-weight:700; font-family:inherit; cursor:pointer;
      box-shadow:0 10px 24px rgba(127,166,107,.35); transition:.15s;}
    .landing-cta:hover{transform:translateY(-1px); box-shadow:0 14px 28px rgba(127,166,107,.4);}
    .landing-illustration{display:flex; justify-content:center; gap:24px; margin:52px 0;}
    .landing-illustration .paw-badge, .landing-illustration .cat-badge{width:144px; height:144px; border-radius:34px;
      display:flex; align-items:center; justify-content:center; box-shadow:0 12px 28px rgba(0,0,0,.07);}
    .landing-illustration .paw-badge{background:#fff; transform:rotate(-6deg);}
    .landing-illustration .cat-badge{background:var(--pg-green-light); transform:rotate(6deg); margin-top:26px;}
    .landing-about{display:flex; flex-direction:column; align-items:center; text-align:center; gap:18px; max-width:680px; margin:0 auto;}
    .landing-about-icon{width:104px; height:104px; border-radius:28px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 10px 24px rgba(0,0,0,.05);}
    .landing-about-text{font-size:19px; line-height:1.9; color:#585d57;}
    .landing-showcase{display:flex; flex-direction:column; gap:36px; margin-top:8px;}
    .landing-showcase-row{display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:40px;}
    .landing-showcase-media{order:1; display:flex; justify-content:center; min-width:0; outline:none; border:none;}
    .landing-showcase-text{order:2; min-width:0; outline:none; border:none; padding-left:8px;}
    .landing-showcase-row.reverse .landing-showcase-media{order:2;}
    .landing-showcase-row.reverse .landing-showcase-text{order:1;}
    .landing-showcase-title{font-size:30px; font-weight:800; color:var(--pg-dark); margin-bottom:14px;}
    .landing-showcase-desc{font-size:18px; color:#787774; line-height:1.85; max-width:440px;}
    .mock-card{background:#fff; border-radius:22px; padding:30px; box-shadow:0 20px 48px rgba(28,28,28,.1);
      width:100%; max-width:400px; border:1px solid var(--border);}
    .mock-card-label{font-size:13px; color:var(--sub); font-weight:700; text-transform:uppercase; letter-spacing:.03em;}
    .mock-card-value{font-size:42px; font-weight:800; color:var(--text); margin-top:6px;}
    .mock-card-sub{font-size:14px; color:var(--primary); font-weight:700; margin-top:4px;}
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
    .landing-features{display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin:24px auto 0; max-width:980px;}
    @media (min-width:680px){ .landing-features{grid-template-columns:repeat(3,1fr);} }
    @media (max-width:420px){ .landing-features{grid-template-columns:1fr;} }
    .landing-feature-card{background:#fff; border-radius:16px; padding:26px 20px; text-align:center;
      box-shadow:0 4px 14px rgba(0,0,0,.04); transition:transform .15s, box-shadow .15s;}
    .landing-feature-card:hover{transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.07);}
    .landing-feature-icon{width:58px; height:58px; border-radius:16px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; margin:0 auto 14px;}
    .landing-feature-title{font-weight:700; font-size:16px; color:var(--pg-dark); margin-bottom:8px;}
    .landing-feature-desc{font-size:13px; color:#8a8f86; line-height:1.6;}
    .landing-highlight-grid{display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:20px;}
    @media (max-width:680px){ .landing-highlight-grid{grid-template-columns:1fr;} }
    .landing-highlight-card{background:#fff; border-radius:22px; padding:36px 30px; text-align:center;
      box-shadow:0 6px 20px rgba(0,0,0,.05); display:flex; flex-direction:column; align-items:center;}
    .landing-highlight-illust{width:96px; height:96px; border-radius:26px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; margin:0 auto 18px;}
    .landing-highlight-eyebrow{font-size:12px; font-weight:800; color:var(--pg-green); letter-spacing:.02em; margin-bottom:6px;}
    .landing-highlight-title{font-size:19px; font-weight:800; color:var(--pg-dark); margin-bottom:10px;}
    .landing-highlight-desc{font-size:14px; color:#787774; line-height:1.7; margin-bottom:20px; flex:1;}
    .landing-highlight-cta{margin-top:auto; border:2px solid var(--pg-green); color:var(--pg-green); background:none;
      border-radius:999px; padding:11px 26px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; transition:.15s;}
    .landing-highlight-cta:hover{background:var(--pg-green); color:#fff;}
    .landing-community-wrap{display:flex; flex-direction:column; align-items:center; gap:28px; margin-top:22px;}
    .landing-community-text{text-align:center; max-width:720px; margin:0 auto;}
    .landing-community-cta{margin:22px auto 0;}
    .landing-community-desc{font-size:15px; color:#787774; line-height:1.8; margin:10px auto 0; max-width:680px;}
    .cm-mock-feed{width:100%; max-width:860px; margin:0 auto; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px;}
    @media (max-width:680px){ .cm-mock-feed{grid-template-columns:1fr; max-width:420px; gap:14px;} }
    .cm-mock-card{background:#fff; border-radius:18px; padding:16px; box-shadow:0 8px 22px rgba(0,0,0,.06);
      border:1px solid #eef2ea; overflow:hidden;}
    .cm-mock-header{display:flex; align-items:center; gap:10px; margin-bottom:10px;}
    .cm-mock-avatar{width:34px; height:34px; border-radius:50%; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;}
    .cm-mock-name{font-size:13px; font-weight:800; color:var(--pg-dark);}
    .cm-mock-breed{font-weight:600; color:#9a9d95;}
    .cm-mock-time{font-size:11px; color:#adb0a8; margin-top:1px;}
    .cm-mock-photo{width:100%; aspect-ratio:16/9; border-radius:12px; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center; margin-bottom:10px;}
    .cm-mock-text{font-size:13px; color:#585d57; margin-bottom:8px; line-height:1.5;}
    .cm-mock-meta{font-size:12px; color:#9a9d95; font-weight:700;}
    .landing-final-cta{background:var(--pg-dark); border-radius:32px; padding:56px 32px; text-align:center; position:relative; overflow:hidden;}
    .landing-final-cta-title{color:#fff; font-size:clamp(22px,4vw,30px); font-weight:800; line-height:1.5; margin-bottom:14px;}
    .landing-final-cta-desc{color:rgba(255,255,255,.68); font-size:14px; line-height:1.8; margin-bottom:28px;}
    .landing-final-cta-btn{background:var(--pg-green); color:#fff; border:none; border-radius:999px;
      padding:15px 38px; font-weight:800; font-size:15px; cursor:pointer; font-family:inherit;}
    .landing-final-cta-btn:hover{transform:translateY(-1px);}
    .landing-final-cta-illust{display:flex; justify-content:center; gap:10px; margin-bottom:20px;}
    .landing-mini-teaser{display:flex; flex-wrap:wrap; justify-content:center; gap:16px; margin-top:24px;}
    .landing-mini-teaser-item{display:flex; align-items:center; gap:10px; background:#fff; border-radius:999px;
      padding:10px 20px 10px 10px; box-shadow:0 4px 14px rgba(0,0,0,.04); cursor:pointer; border:none; font-family:inherit;}
    .landing-mini-teaser-icon{width:36px; height:36px; border-radius:50%; background:var(--pg-green-light);
      display:flex; align-items:center; justify-content:center;}
    .landing-mini-teaser-label{font-size:13px; font-weight:700; color:var(--pg-dark);}
    .landing-trust{display:flex; flex-wrap:wrap; justify-content:center; gap:12px 28px; margin-top:44px;
      padding-top:28px; border-top:1px solid #e3e8de;}
    .landing-trust-item{display:flex; align-items:center; gap:6px; font-size:13px; color:#787774; font-weight:600;}
    .social-links{display:flex; justify-content:center; gap:14px;}
    .social-btn{width:46px; height:46px; border-radius:50%; background:#fff; display:flex; align-items:center;
      justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,.08); transition:.15s;}
    .social-btn:hover{transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,.12);}
    .save-toast{position:fixed; left:50%; bottom:max(28px, calc(env(safe-area-inset-bottom) + 20px)); transform:translateX(-50%); z-index:200;
      background:var(--text); color:#fff; padding:12px 20px; border-radius:999px; font-size:13px; font-weight:700;
      display:flex; align-items:center; gap:8px; box-shadow:0 10px 24px rgba(0,0,0,.25); animation:toastIn .25s ease both;
      max-width:calc(100vw - 32px); text-align:center;}
    .save-toast.error{background:#E63946;}
    @keyframes toastIn{from{opacity:0; transform:translateX(-50%) translateY(10px);} to{opacity:1; transform:translateX(-50%) translateY(0);}}
    @media (max-width:480px){
      .header-toprow{flex-direction:column; align-items:center;}
    }
    @media (min-width:720px){
      .header-logo{width:30px !important; height:30px !important;}
    }
    .icon-btn-sm{background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center; border-radius:8px;}
    .icon-btn-sm:hover{background:var(--surface);}
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
    .home-hero-copy{text-align:center; max-width:680px; margin:0 auto 20px;}
    .home-hero-copy h1{font-size:23px; margin:0 0 7px; line-height:1.35;}
    .home-hero-copy .bg-sub{font-size:14px; margin:0; line-height:1.65;}
    .about-video-shell{width:min(92vw, 580px); max-width:100%; margin:24px auto 28px;}
    .about-video-label{text-align:center; font-size:14px; font-weight:800; color:var(--pg-dark); margin-bottom:10px;}
    .intro-video-wrap{position:relative; width:100%; aspect-ratio:16/9; border-radius:24px; overflow:hidden;
      box-shadow:0 16px 40px rgba(28,28,28,.12); background:#000;}
    .intro-video{width:100%; height:100%; object-fit:cover; display:block;}
    .intro-video-sound-btn{position:absolute; bottom:14px; right:14px; width:40px; height:40px; border-radius:50%;
      background:rgba(0,0,0,.5); border:none; color:#fff; display:flex; align-items:center; justify-content:center;
      cursor:pointer; backdrop-filter:blur(2px);}
    .intro-video-sound-btn:hover{background:rgba(0,0,0,.7);}
    .intro-video-sound-btn.pulse{animation:soundPulse 1.8s ease-in-out infinite;}
    @keyframes soundPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.5);} 50%{box-shadow:0 0 0 8px rgba(255,255,255,0);}}
    .landing-section-title{text-align:center; font-size:26px; font-weight:800; color:var(--pg-dark); margin-bottom:32px;}
    .landing-steps{display:grid; grid-template-columns:repeat(3,1fr); gap:24px;}
    .landing-step{text-align:center;}
    .landing-step-num{width:36px; height:36px; border-radius:50%; background:var(--pg-green); color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:800; margin:0 auto 12px;}
    .landing-step-title{font-weight:700; font-size:14px; color:var(--pg-dark); margin-bottom:6px;}
    .landing-step-desc{font-size:12px; color:#8a8f86; line-height:1.6;}
    .landing-footer{background:var(--pg-dark);}
    .landing-footer-text{text-align:center; color:rgba(255,255,255,.55); font-size:11px; margin-top:10px; line-height:1.7;}
    @media (max-width:680px){
      .home-hero-copy{padding:0 8px; margin-bottom:18px;}
      .home-hero-copy h1{font-size:21px;}
      .about-video-shell{width:92%; margin:20px auto 24px;}
      .intro-video-wrap{display:block !important; width:100% !important; border-radius:18px;}
      .intro-video{display:block !important; width:100% !important; height:100% !important; object-fit:cover;}
      .landing-steps{grid-template-columns:1fr;} .landing-pricing{grid-template-columns:1fr;}
      .landing-showcase-row{grid-template-columns:1fr; gap:20px;}
      .landing-showcase-row.reverse .landing-showcase-media, .landing-showcase-row.reverse .landing-showcase-text{order:unset;}
      .landing-showcase{gap:36px;}
      .mock-card{max-width:100%;} }
    .modal-overlay{position:fixed; inset:0; background:rgba(91,74,79,.45); display:flex; align-items:center;
      justify-content:center; padding:16px; padding-top:max(16px, env(safe-area-inset-top));
      padding-bottom:max(16px, env(safe-area-inset-bottom)); z-index:100;}
    .modal-card{background:#fff; border-radius:28px; padding:24px; width:100%; box-shadow:0 24px 48px rgba(91,74,79,.25);
      max-height:85vh; max-height:85dvh; overflow-y:auto; -webkit-overflow-scrolling:touch;}
    .guide-grid{display:grid; grid-template-columns:1fr 1fr; gap:14px 20px;}
    @media (max-width:560px){ .guide-grid{grid-template-columns:1fr;} }
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
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch {
      alert(t.photoSaveError);
    }
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 20px 60px" }}>
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
  const closest = data.reduce((a, b) => (Math.abs(b.month - currentPoint.month) < Math.abs(a.month - currentPoint.month) ? b : a), data[0]);
  const isOutsideBand = closest && (currentPoint.weight < closest.band[0] || currentPoint.weight > closest.band[1]);
  const dotColor = "#E63946";
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
          {isOutsideBand && (
            <ReferenceLine x={currentPoint.month} stroke={dotColor} strokeWidth={2} strokeDasharray="0" ifOverflow="extendDomain" />
          )}
          <Line type="monotone" dataKey="weight" stroke="#4F9D3C" strokeWidth={3} dot={{ r: 4, fill: "#4F9D3C" }} />
          <ReferenceDot x={currentPoint.month} y={currentPoint.weight} r={9} fill={dotColor} stroke="#fff" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
      <div className="bg-sub" style={{ fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: dotColor }} />
        {t.chartLegend} ({currentPoint.weight}kg)
      </div>
      <div className="bg-sub" style={{ fontSize: 12, marginTop: 2 }}>{t.chartBandLegend}</div>
      {isOutsideBand && (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: dotColor }}>{t.chartOutsideBand}</div>
      )}
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

function RecordList({ records, onDelete }) {
  const t = useT();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const rows = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {rows.map((r) => {
        const label = r.diffGrams === undefined ? null : diffLabel(r.diffGrams, t);
        return (
          <div key={r.id} className="bg-surface-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.date}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{r.weightKg}kg</span>
                <button type="button" className="icon-btn-sm" aria-label={t.recordDeleteBtn}
                  onClick={() => setDeleteTarget(r)}>
                  <TrashIcon style={{ width: 15, height: 15, color: "var(--sub)" }} />
                </button>
              </div>
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
      <ConfirmModal
        open={!!deleteTarget}
        title={t.recordDeleteTitle}
        message={deleteTarget ? t.recordDeleteMsg(deleteTarget.date, deleteTarget.weightKg) : ""}
        confirmLabel={t.recordDeleteBtn}
        onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function RecordSection({ records, onAddRecord, onDeleteRecord }) {
  const t = useT();
  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <CalendarIcon style={{ width: 18, height: 18, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 16 }}>{t.recordTitle}</h3>
      </div>
      <RecordForm onAdd={onAddRecord} />
      <RecordList records={records} onDelete={onDeleteRecord} />
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

// 큰 사진(요즘 폰 카메라는 보통 3~8MB)을 그대로 저장하면 브라우저 저장 용량 한도를
// 넘어서 저장이 실패할 수 있어서, 저장 전에 자동으로 줄여서(리사이즈+압축) 저장해요.
function fileToCompressedDataUrl(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
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
    try {
      const dataUrl = await fileToCompressedDataUrl(pendingFile);
      onAdd(date, dataUrl);
      setPendingFile(null);
    } catch {
      setAlert(t.photoSaveError);
      setAlertPopup(true);
    }
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
      <AlertModal open={alertPopup} message={alert} onClose={() => setAlertPopup(false)} />
    </div>
  );
}

function PhotoTile({ photo, birthDate, onEdit, onDelete, onOpenSlideshow }) {
  const t = useT();
  const inputRef = useRef(null);
  const handleChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onEdit(photo.id, dataUrl);
    } catch {
      alert(t.photoSaveError);
    }
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

  const triggerDownloadLink = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${pet.profile.name}-petgrow.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  // 모바일 브라우저(특히 사파리)는 <a download> 방식이 잘 안 먹혀서,
  // 공유 API가 있으면(대부분의 모바일) 그걸 먼저 시도해요 — 저장도 그 안에서 할 수 있어요.
  const handleDownload = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${pet.profile.name}-petgrow.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "PetGrow" });
        return;
      }
    } catch {}
    try {
      triggerDownloadLink();
    } catch {
      window.open(dataUrl, "_blank");
    }
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
    triggerDownloadLink();
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
const SajuIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3c2.5 2.5 2.5 6.5 0 9s-2.5 6.5 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 3c-2.5 2.5-2.5 6.5 0 9s2.5 6.5 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0" />
    <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
  </svg>
);
const PetBtiIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
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
  { id: "t15", category: "dog", featured: false,
    title: { ko: "강아지 짖음, 무작정 혼내지 마세요", en: "Don't just scold a barking dog" },
    summary: { ko: "짖는 이유(불안·심심함·경계)를 먼저 파악하는 게 우선이에요.", en: "Figuring out why they're barking — anxiety, boredom, alertness — comes first." },
    body: { ko: "원인에 맞는 해결이 훨씬 효과적이에요. 불안 때문이라면 혼내는 게 오히려 불안을 키울 수 있어요.", en: "Matching the solution to the cause works far better — scolding an anxious dog can actually make the anxiety worse." } },
  { id: "t16", category: "dog", featured: false,
    title: { ko: "강아지가 눈을 맞추는 건 신뢰의 표현", en: "Eye contact is a sign of trust" },
    summary: { ko: "강아지가 보호자와 눈을 맞추는 건 애정과 신뢰의 표현이에요.", en: "When a dog holds eye contact with you, it's a sign of affection and trust." },
    body: { ko: "낯선 개끼리는 눈맞춤이 위협으로 받아들여질 수 있지만, 보호자와의 눈맞춤은 옥시토신 분비를 늘린다는 연구도 있어요.", en: "Between unfamiliar dogs, eye contact can read as a threat — but eye contact with their own person has even been linked to a rise in oxytocin." } },
  { id: "t17", category: "dog", featured: false,
    title: { ko: "강아지 발톱, 얼마나 자주 깎아야 할까?", en: "How often to trim a dog's nails" },
    summary: { ko: "보통 3~4주에 한 번이 적당해요. 바닥에 딱딱 소리가 나면 깎을 때예요.", en: "Every 3-4 weeks is typical — if you hear clicking on hard floors, it's time." },
    body: { ko: "너무 짧게 자르면 혈관을 다칠 수 있어 조금씩 자주 다듬는 게 안전해요. 무서워하면 발만 만지는 연습부터 천천히 해보세요.", en: "Cutting too short can nick the quick, so small, frequent trims are safer. If they're nervous, start by just handling their paws to build comfort." } },
  { id: "t18", category: "dog", featured: false,
    title: { ko: "강아지 배변 훈련, 이렇게 시작해보세요", en: "Getting started with potty training" },
    summary: { ko: "일정한 시간에 데리고 나가고, 성공했을 때 바로 칭찬해주는 게 핵심이에요.", en: "Taking them out at consistent times and praising success immediately is key." },
    body: { ko: "식사 후, 낮잠 후, 놀이 후는 배변 확률이 높은 타이밍이에요. 실수했을 때 혼내기보다 치우고 넘어가는 게 학습에 더 도움이 돼요.", en: "After meals, naps, or play are high-probability moments. When accidents happen, cleaning up calmly helps learning more than scolding does." } },
  { id: "t19", category: "dog", featured: false,
    title: { ko: "강아지와 자동차 이동, 이것만은 챙기세요", en: "Car safety essentials for dogs" },
    summary: { ko: "전용 카시트나 안전벨트를 사용하고, 창문을 너무 많이 열어두지 마세요.", en: "Use a pet seatbelt or carrier, and avoid opening windows too wide." },
    body: { ko: "머리를 창밖으로 내미는 건 눈·귀 부상 위험이 있어요. 멀미가 있다면 이동 전 공복 상태로 태우는 게 도움이 될 수 있어요.", en: "Letting them stick their head out risks eye and ear injury. If they get carsick, traveling on a lighter stomach can help." } },
  { id: "t20", category: "dog", featured: false,
    title: { ko: "산책 중 리드줄 매너, 왜 중요할까?", en: "Why leash manners matter on walks" },
    summary: { ko: "리드줄을 짧게 잡는 연습은 다른 사람·동물과의 안전한 산책을 위해 꼭 필요해요.", en: "Practicing a shorter, controlled leash helps keep walks safe around other people and animals." },
    body: { ko: "당기는 힘에 끌려다니기보다, 옆에서 걷는 연습을 짧은 구간부터 반복해보세요. 간식으로 옆자리를 보상해주면 훨씬 빨리 배워요.", en: "Rather than being pulled along, practice short stretches of walking beside you. Rewarding the position with treats speeds up learning a lot." } },
  { id: "t21", category: "cat", featured: false,
    title: { ko: "고양이가 긁는 건 나쁜 버릇이 아니에요", en: "Scratching isn't bad behavior" },
    summary: { ko: "발톱 관리뿐 아니라 영역 표시, 스트레스 해소 목적도 있어요.", en: "Scratching serves nail care, territory marking, and stress relief all at once." },
    body: { ko: "가구를 긁는다면 혼내기보다 그 옆에 스크래처를 놔주는 게 훨씬 효과적이에요. 재질(골판지·마)을 여러 개 시도해보세요.", en: "If they're scratching furniture, placing a scratcher right next to it works better than scolding. Try a few materials — cardboard, sisal — to see what they prefer." } },
  { id: "t22", category: "cat", featured: false,
    title: { ko: "고양이 헤어볼, 빗질이 제일 쉬운 예방법", en: "Brushing is the easiest hairball prevention" },
    summary: { ko: "정기적인 빗질이 헤어볼을 줄이는 가장 간단한 방법이에요.", en: "Regular brushing is the simplest way to cut down on hairballs." },
    body: { ko: "장모종은 주 3~4회, 단모종도 주 1~2회 정도 빗겨주면 삼키는 털의 양이 크게 줄어요.", en: "Long-haired cats benefit from brushing 3-4 times a week, and short-haired cats once or twice — it noticeably reduces how much fur they swallow." } },
  { id: "t23", category: "cat", featured: false,
    title: { ko: "고양이가 상자를 좋아하는 이유", en: "Why cats love boxes so much" },
    summary: { ko: "좁은 공간이 안정감을 주기 때문이에요. 스트레스 해소에도 도움이 돼요.", en: "Tight spaces feel safe to them, and can even help relieve stress." },
    body: { ko: "새로운 환경에 적응할 때 상자 하나만 놔줘도 훨씬 빨리 안정을 찾는 경우가 많아요.", en: "Just placing a box in a new environment often helps a cat settle in much faster." } },
  { id: "t24", category: "cat", featured: false,
    title: { ko: "고양이 발톱 vs 가구, 평화롭게 공존하기", en: "Keeping claws and furniture at peace" },
    summary: { ko: "전용 스크래처를 가구 옆에 놔두면 자연스럽게 유도할 수 있어요.", en: "Placing a scratcher right beside furniture naturally redirects the habit." },
    body: { ko: "스크래처에 캣닢을 살짝 묻혀두면 관심을 끌기 더 쉬워요. 가구 커버는 임시방편일 뿐, 대체 공간을 만들어주는 게 근본적인 해결이에요.", en: "A little catnip on the scratcher helps grab their interest. Furniture covers are just a stopgap — giving them a real alternative is the lasting fix." } },
  { id: "t25", category: "cat", featured: false,
    title: { ko: "고양이 음수량 늘리는 법", en: "Getting your cat to drink more water" },
    summary: { ko: "정수기형 급수기를 써보면 물 섭취량이 늘어나는 경우가 많아요.", en: "A pet water fountain often increases how much a cat drinks." },
    body: { ko: "고양이는 본능적으로 흐르는 물을 더 신선하다고 느껴요. 습식 사료를 섞어주는 것도 수분 섭취에 도움이 돼요.", en: "Cats instinctively perceive moving water as fresher. Mixing in some wet food also helps boost hydration." } },
  { id: "t26", category: "cat", featured: false,
    title: { ko: "고양이도 사회화가 필요해요", en: "Cats need socialization too" },
    summary: { ko: "강아지만큼 알려져있진 않지만, 고양이도 어릴 때 사회화가 중요해요.", en: "It's less talked about than with dogs, but early socialization matters for cats too." },
    body: { ko: "생후 2~7주가 특히 중요한 시기로 알려져 있어요. 다만 강아지보다 새로운 자극에는 더 천천히 적응시켜주는 게 좋아요.", en: "Weeks 2-7 are considered especially important. Compared to dogs, cats generally do better adjusting to new stimuli more gradually." } },
  { id: "t27", category: "health", featured: false,
    title: { ko: "예방접종 스케줄을 놓쳤다면?", en: "Missed a vaccine appointment?" },
    summary: { ko: "너무 늦지 않았다면 처음부터 다시 할 필요 없이 이어서 진행할 수 있는 경우가 많아요.", en: "In many cases you can simply continue the schedule rather than starting over, if it hasn't been too long." },
    body: { ko: "정확한 판단은 병원마다 다를 수 있으니, 놓친 기간과 함께 수의사와 상담하는 게 가장 확실해요.", en: "The exact call can vary by clinic, so it's best to check with your vet and mention how much time has passed." } },
  { id: "t28", category: "health", featured: false,
    title: { ko: "우리 아이 비만, 집에서 체크하는 법", en: "Checking for overweight at home" },
    summary: { ko: "위에서 봤을 때 허리 라인이 살짝 들어가 있는지 확인해보세요.", en: "Looking from above, check whether there's a slight waist tuck behind the ribs." },
    body: { ko: "갈비뼈가 만져지지 않을 정도로 지방이 있다면 체중 관리가 필요한 신호예요. 급격한 다이어트보다는 서서히 조절하는 게 안전해요.", en: "If the ribs are hard to feel under a layer of fat, it may be time for weight management. Gradual adjustment is safer than a sudden diet change." } },
  { id: "t29", category: "health", featured: false,
    title: { ko: "심장사상충 예방, 매달 챙겨야 하는 이유", en: "Why heartworm prevention is monthly" },
    summary: { ko: "정기적인 예방이 치료보다 훨씬 안전하고 비용 부담도 적어요.", en: "Regular prevention is far safer and less costly than treatment after the fact." },
    body: { ko: "모기가 매개체라 실내에서만 지내도 완전히 안심할 수는 없어요. 계절과 상관없이 꾸준히 챙겨주는 게 좋아요.", en: "Since mosquitoes are the carrier, even indoor pets aren't fully risk-free. Year-round prevention is generally recommended." } },
  { id: "t30", category: "health", featured: false,
    title: { ko: "반려동물 구토, 병원에 가야 하는 신호", en: "When vomiting means a vet visit" },
    summary: { ko: "한 번의 구토는 크게 걱정 안 해도 되지만, 반복되거나 무기력함이 동반되면 병원에 문의하세요.", en: "A single episode usually isn't alarming, but repeated vomiting with lethargy warrants a call to the vet." },
    body: { ko: "구토물에 피가 섞이거나 색이 이상하다면 바로 병원을 찾는 게 좋아요. 24시간 이상 아무것도 못 먹는다면 지체하지 마세요.", en: "Blood or unusual coloring in vomit calls for an immediate visit. Don't wait if they can't keep anything down for over 24 hours." } },
  { id: "t31", category: "health", featured: false,
    title: { ko: "노령 반려동물, 건강검진은 얼마나 자주?", en: "Checkup frequency for senior pets" },
    summary: { ko: "7세 이상부터는 6개월에 한 번 정도 정기검진을 권장해요.", en: "From around age 7, a checkup roughly every 6 months is often recommended." },
    body: { ko: "노령기엔 증상이 없어도 혈액검사로 미리 발견되는 문제들이 많아요. 작은 변화(음수량, 활동량)도 기록해두면 진료에 도움이 돼요.", en: "In senior pets, bloodwork often catches issues before symptoms appear. Noting small changes in water intake or activity level helps at checkups too." } },
  { id: "t32", category: "health", featured: false,
    title: { ko: "반려동물 스트레스 신호, 놓치기 쉬운 것들", en: "Easy-to-miss signs of stress" },
    summary: { ko: "과도한 그루밍, 식욕 변화, 숨는 행동이 대표적인 신호예요.", en: "Excessive grooming, appetite changes, and hiding are common signals." },
    body: { ko: "환경 변화(이사, 새 가족, 새 반려동물) 직후엔 특히 눈여겨봐주세요. 며칠 이상 지속되면 병원 상담도 고려해보세요.", en: "Pay extra attention right after changes like moving, a new family member, or a new pet. If it lasts more than a few days, a vet visit is worth considering." } },
  { id: "t33", category: "health", featured: false,
    title: { ko: "중성화 수술, 시기가 궁금하다면", en: "Timing questions around spay/neuter" },
    summary: { ko: "보통 생후 6개월 전후를 권장하지만, 정확한 시기는 병원과 상담하는 게 가장 정확해요.", en: "Around 6 months is a common guideline, but your vet can give the most accurate timing." },
    body: { ko: "견종·체구·건강 상태에 따라 권장 시기가 달라질 수 있어요. 수술 전후 관리 방법도 함께 안내받는 게 좋아요.", en: "Recommended timing can vary by breed, size, and health. It's also worth asking about pre- and post-surgery care at the same time." } },
  { id: "t34", category: "life", featured: false,
    title: { ko: "이사할 때 반려동물 스트레스 줄이는 법", en: "Easing moving-day stress for pets" },
    summary: { ko: "익숙한 담요나 장난감을 함께 옮겨주면 새 공간 적응에 도움이 돼요.", en: "Bringing along a familiar blanket or toy helps them settle into the new space." },
    body: { ko: "이사 당일은 방 하나를 미리 정리해서 그 안에서 안정을 찾게 해주는 것도 좋은 방법이에요.", en: "On moving day, setting up one quiet room in advance for them to settle into can help a lot." } },
  { id: "t35", category: "life", featured: false,
    title: { ko: "반려동물과 캠핑 갈 때 챙길 것들", en: "Camping checklist for pets" },
    summary: { ko: "리드줄, 물, 평소 먹던 사료, 배변봉투는 꼭 챙기세요.", en: "Leash, water, their regular food, and waste bags are must-haves." },
    body: { ko: "새로운 사료를 갑자기 주면 배탈이 날 수 있어 평소 먹던 걸 챙기는 게 안전해요. 밤에는 온도 변화에 대비한 담요도 유용해요.", en: "Switching food suddenly can upset their stomach, so their usual food is the safer choice. A blanket for cooler nights is handy too." } },
  { id: "t36", category: "life", featured: false,
    title: { ko: "인식표, 별거 아닌 것 같아도 꼭 필요해요", en: "Small ID tag, big peace of mind" },
    summary: { ko: "혹시 모를 미아 상황에 대비해 연락처가 적힌 인식표를 꼭 채워주세요.", en: "An ID tag with your contact info matters in case they ever get lost." },
    body: { ko: "내장형 마이크로칩과 함께 있으면 더 안전해요. 목걸이만으로는 벗겨질 수 있어 두 가지를 함께 준비하는 게 좋아요.", en: "Pairing it with a microchip adds an extra layer of safety, since collars can slip off — having both is the safer bet." } },
  { id: "t37", category: "life", featured: false,
    title: { ko: "반려동물과 안전하게 겨울나기", en: "Getting through winter safely together" },
    summary: { ko: "산책 후 발바닥에 남은 제설제를 바로 닦아주는 게 좋아요.", en: "Wipe their paws right after walks to remove any de-icing salt." },
    body: { ko: "제설제는 발바닥 자극뿐 아니라 핥았을 때 배탈을 일으킬 수도 있어요. 발바닥용 보습제를 발라주는 것도 도움이 돼요.", en: "De-icing chemicals can irritate paws and cause stomach upset if licked. A paw balm can help protect against the cold too." } },
  { id: "t38", category: "life", featured: false,
    title: { ko: "털갈이 시기, 빗질 횟수 늘려주세요", en: "Brush more during shedding season" },
    summary: { ko: "봄가을 털갈이 시기엔 평소보다 빗질 횟수를 늘려주는 게 좋아요.", en: "During spring and fall shedding, brushing more often than usual helps a lot." },
    body: { ko: "털을 미리 정리해주면 집안 청소도 수월해지고, 피부 트러블 예방에도 도움이 돼요.", en: "Regular brushing means less fur around the house, and it also helps prevent skin irritation." } },
  { id: "t39", category: "life", featured: false,
    title: { ko: "반려동물 혼자 두고 외출할 때 체크리스트", en: "Checklist before leaving them home alone" },
    summary: { ko: "너무 오랜 시간 혼자 두지 않도록 하고, 안전한 환경을 미리 점검해주세요.", en: "Avoid leaving them alone too long, and double-check the space is safe beforehand." },
    body: { ko: "삼킬 수 있는 작은 물건이나 전선은 미리 치워주세요. 물과 사료는 넉넉히, 실내 온도도 미리 확인하는 게 좋아요.", en: "Put away small swallowable items and loose cables. Leave plenty of water and food, and check the indoor temperature in advance." } },
  { id: "t40", category: "life", featured: false,
    title: { ko: "매일 짧게라도, 온전히 함께하는 시간", en: "A few focused minutes together, every day" },
    summary: { ko: "짧더라도 매일 온전히 집중해주는 시간이 유대감 형성에 큰 도움이 돼요.", en: "Even a short daily block of undivided attention does a lot for your bond." },
    body: { ko: "스킨십, 눈맞춤, 짧은 놀이만으로도 충분해요. 휴대폰을 잠깐 내려두는 것만으로도 아이는 그 차이를 느껴요.", en: "A little petting, eye contact, or brief play is enough. Just putting the phone down for a few minutes makes a difference they can feel." } },
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
        <div className="result-columns">
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

/* ============================================================
   우리 아이 사주 🐾 — 생년월일 기반 재미 콘텐츠 (참고용, 미신 아님)
   데이터와 UI를 분리해서 나중에 문구 추가/수정이 쉬워요.
   ============================================================ */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function hasFinalConsonant(str) {
  const ch = (str || "").trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return true;
  return (code - 0xac00) % 28 !== 0;
}
function josa(name, withFinal, withoutFinal) {
  return `${name}${hasFinalConsonant(name) ? withFinal : withoutFinal}`;
}
function seededPick(seed, salt, arr) {
  return arr[hashString(seed + "::" + salt) % arr.length];
}

const SAJU_DATA = {
  ko: {
    summaries: (n) => [
      `사랑받기 위해 태어난 애교쟁이 💕`,
      `호기심은 만렙, 겁은 조금 많은 귀염둥이 🐾`,
      `조용히 집사를 조종하는 천재 전략가 😼`,
      `한번 마음먹으면 끝까지 가는 뚝심의 아이 💪`,
      `어디서든 사랑받는 인싸 기질 만렙 ✨`,
      `느긋해 보이지만 은근 예민한 감성파 🌿`,
      `장난기 가득, 매일이 놀이 시간인 아이 🎾`,
      `보기만 해도 힐링되는 순둥이 캐릭터 🍀`,
      `가족을 세상에서 제일 좋아하는 껌딱지 🧸`,
      `자기만의 세계가 확실한 개성파 스타 🌟`,
    ],
    personality: (n) => [
      `${josa(n, "이는", "는")} 낯을 좀 가리는 편이지만, 한번 마음을 열면 세상 누구보다 다정한 모습을 보여줘요. 처음 보는 사람 앞에서는 살짝 거리를 두다가도, 며칠만 지나면 어느새 곁을 지키고 있을 거예요.`,
      `호기심이 많아서 새로운 냄새, 새로운 장소를 그냥 지나치지 못하는 타입이에요. 그만큼 세상을 즐겁게 탐험하는 아이지만, 가끔은 그 호기심 때문에 엉뚱한 사고를 칠 수도 있어요 😆`,
      `겉으로는 씩씩해 보여도 속은 은근히 여린 구석이 있어요. 큰 소리에 놀라거나 낯선 환경에 예민하게 반응할 수 있으니, 보호자의 다정한 목소리 하나가 이 아이에겐 제일 큰 안정제예요.`,
      `한번 마음먹으면 쉽게 생각을 바꾸지 않는 귀여운 뚝심이 있어요. 고집이 세다기보다는, 자기가 좋아하는 것에 확신이 있는 스타일이라고 봐주세요 😌`,
      `에너지가 넘쳐서 가만히 있는 걸 잘 못 견뎌요. 몸을 움직이고 노는 시간이 부족하면 답답함을 표현할 수도 있으니, 하루 한 번은 신나게 놀아주는 시간이 필요해요.`,
      `느긋하고 여유로운 성격이라 웬만한 일에는 크게 동요하지 않아요. 그래서 옆에 있으면 저절로 마음이 편안해지는, 힐링 담당 반려동물일 가능성이 높아요.`,
    ],
    bond: (n) => [
      `보호자를 세상에서 제일 믿음직한 존재로 생각해요. 하루 종일 밖에서 무슨 일이 있었든, 집에 돌아온 보호자를 보는 순간 그 하루의 스트레스가 다 날아가는 표정을 지을 거예요.`,
      `애정 표현이 은근하지만 확실한 편이에요. 대놓고 매달리진 않아도, 슬쩍 옆에 와서 붙어있거나 시야 안에 보호자가 있는지 자꾸 확인하는 습관이 있을 수 있어요.`,
      `보호자와의 유대감이 아주 깊어서, 보호자의 기분 변화를 은근히 잘 알아채는 편이에요. 우울한 날엔 괜히 더 옆에 붙어 있으려는 모습을 보일 수도 있어요 🥹`,
      `독립적인 성향이 있어서 혼자만의 시간도 잘 즐기지만, 보호자가 집에 없으면 은근히 기다리는 타입이에요. 츤데레 같은 매력이 있는 관계랄까요.`,
      `${josa(n, "이는", "는")} '내 사람'이라고 정한 상대에게는 유독 곁을 잘 내주는 편이에요. 보호자를 그렇게 자기 사람으로 인정했다는 증거가 여기저기서 보일 거예요.`,
    ],
    friends: (n) => [
      `다른 친구들과 어울리는 걸 좋아하지만, 처음엔 살짝 탐색전을 벌이는 신중한 스타일이에요. 친해지고 나면 의외로 먼저 장난을 걸 수도 있어요.`,
      `무리에서 은근히 리더십을 발휘하는 타입이에요. 먼저 나서서 노는 판을 짜거나, 다른 친구들을 이끄는 모습을 볼 수도 있어요.`,
      `낯선 친구를 만나면 조심스럽게 거리를 재다가, 상대가 편안하다고 느껴지면 금방 마음을 여는 편이에요.`,
      `혼자 노는 것도 좋아하지만 마음 맞는 친구가 생기면 껌딱지처럼 붙어다니는 스타일이라, 단짝이 생기면 우정이 아주 깊어질 아이예요.`,
      `또래 친구들 사이에서 인기가 많을 상이에요. 특유의 붙임성 덕분에 어디서든 금방 친구를 사귈 수 있어요.`,
    ],
    food: (n) => [
      `간식 냄새를 맡는 순간 눈빛부터 달라지는 타입이에요. 평소엔 얌전하다가도 간식 앞에서는 세상 진지해지는 반전 매력이 있어요 🍖`,
      `먹을 복이 아주 강한 편이에요. 밥그릇 앞에서는 그 누구보다 집중력이 좋아지고, 어쩌면 은근슬쩍 간식을 더 얻어내는 잔기술도 있을지 몰라요.`,
      `맛있는 걸 보면 못 참는 편이라, 식탐이 있다기보다는 '인생을 맛있게 즐길 줄 아는 아이'라고 봐주세요 😋`,
      `의외로 입이 짧아서 좋아하는 것만 콕 집어 먹는 미식가 스타일일 수 있어요. 그래도 좋아하는 간식 앞에서는 눈빛이 반짝일 거예요.`,
      `식사 시간이 되면 제일 먼저 알아채고 보호자 곁을 맴도는 타입이에요. 배고픔을 티내는 것도 이 아이만의 애교 포인트예요.`,
    ],
    play: (n) => [
      `몸을 움직이는 놀이를 좋아해서, 공놀이나 뛰어다니는 활동을 하면 눈에 띄게 신나 해요. 산책이나 활동량이 부족하면 스트레스가 쌓일 수 있으니 신경 써주세요.`,
      `조용히 앉아서 하는 놀이도 은근히 좋아하는 편이라, 장난감 하나를 물고 오랫동안 혼자서도 잘 놀아요.`,
      `산책 나가는 걸 세상에서 제일 좋아하는 타입일 가능성이 높아요. 현관 근처에서 목줄이나 신발 소리만 나도 반응할 거예요.`,
      `새로운 장난감에 대한 호기심이 커서, 처음 보는 물건은 일단 탐색부터 하고 보는 스타일이에요.`,
      `놀이 중에 갑자기 정색하고 진지해지는 반전 매력이 있어요. 노는 것도 진심으로 임하는 타입이랄까요 😆`,
    ],
    affection: (n) => [
      `애교가 은근하지만 확실한 스타일이에요. 대놓고 표현하기보다는, 슬쩍 다가와 몸을 기대는 걸로 마음을 전할 가능성이 높아요.`,
      `보호자가 다른 곳에 정신이 팔려 있으면 슬쩍 옆으로 와서 존재감을 어필하는 것도 이 아이만의 애정 표현일 수 있어요.`,
      `스킨십을 아주 좋아해서, 쓰다듬어주는 손길 앞에서는 세상 행복한 표정을 지을 거예요.`,
      `애교가 폭발적인 타입이라, 보호자가 집에 들어오는 순간 온몸으로 반가움을 표현할 가능성이 높아요.`,
      `무심한 듯 보이지만 사실은 보호자의 관심을 은근히 원하는 츤데레 스타일이에요.`,
    ],
    mischief: (n) => [
      `조용하다 싶으면 뭔가 재미있는 일을 계획하고 있을지도 몰라요 👀 심심할 때 특히 장난기가 발동하는 타입이에요.`,
      `보호자가 안 보는 틈을 귀신같이 알아채는 눈치의 아이예요. 그 틈을 타 작은 장난을 칠 가능성이 높아요.`,
      `호기심이 많아서 새로운 물건이 생기면 일단 확인부터 하고 보는 습성이 있어요. 가끔 그게 장난으로 이어질 수 있어요.`,
      `평소엔 얌전하다가도 특정 시간대(주로 저녁 무렵)에 갑자기 에너지가 폭발하는 '개모차/캣모차' 타임이 있을 수 있어요.`,
      `장난기 지수가 꽤 높은 편이라, 심심함을 못 참고 스스로 놀거리를 만들어내는 창의력이 있어요.`,
    ],
    luck: (n) => [
      `사랑받는 복이 특히 강한 아이예요. 어딜 가든 자연스럽게 사람들의 시선과 애정을 끌어모으는 매력이 있어요.`,
      `건강 복이 좋은 편이라, 잘 챙겨주기만 하면 무럭무럭 튼튼하게 자랄 가능성이 높아요.`,
      `먹을 복이 타고났어요. 밥이든 간식이든, 이 아이 앞에는 늘 맛있는 것들이 끊이지 않을 거예요.`,
      `친구 복이 많아요. 사람이든 다른 동물 친구든, 이 아이 주변엔 좋은 인연이 잘 모여요.`,
      `보호자 복이 최고예요. 이렇게 사랑을 듬뿍 주는 보호자를 만난 것 자체가 이 아이의 가장 큰 복일지도 몰라요 💕`,
    ],
  },
  en: {
    summaries: (n) => [
      `Born to be loved — total charmer 💕`,
      `Maxed-out curiosity, a little bit of a scaredy-cat 🐾`,
      `The quiet genius who secretly runs the household 😼`,
      `Once decided, never changes their mind 💪`,
      `Loved wherever they go — natural social star ✨`,
      `Looks chill, but a sensitive soul underneath 🌿`,
    ],
    personality: (n) => [
      `${n} can be a little shy with new faces, but once the walls come down, few are more affectionate. Give it a few days and you'll find them right by your side.`,
      `Endlessly curious about new smells and places — always exploring the world with excitement. That same curiosity can occasionally lead to a bit of mischief too.`,
      `Looks tough on the outside but has a soft, sensitive side. Loud noises or new environments can be a bit much, so a calm, gentle voice goes a long way.`,
      `Once they set their mind on something, they rarely change it — call it charming stubbornness rather than difficulty.`,
    ],
    bond: (n) => [
      `You're the most trusted person in their world. Whatever kind of day it was, seeing you walk through the door seems to melt all of it away.`,
      `Affection is shown quietly but clearly — maybe not dramatic displays, but a habit of staying close and keeping an eye on where you are.`,
      `The bond runs deep, and they're surprisingly good at picking up on your mood — expect extra cuddles on your rough days.`,
    ],
    friends: (n) => [
      `Enjoys the company of other animals, though they like to size things up carefully at first before warming up.`,
      `Has a bit of natural leadership among peers — often the one starting the games.`,
      `A little cautious with strangers at first, but quick to open up once comfortable.`,
    ],
    food: (n) => [
      `The moment a treat appears, the whole demeanor changes — food time is serious business 🍖`,
      `Blessed with strong food luck — impressively focused at mealtime, and maybe a little skilled at getting extra treats.`,
      `Not exactly picky, more like someone who truly knows how to enjoy a good meal 😋`,
    ],
    play: (n) => [
      `Loves active play like fetch or running around — regular exercise really matters for keeping them happy.`,
      `Also enjoys quieter play, happily entertained by a favorite toy for a long stretch.`,
      `Walks might be their favorite thing in the world — even the sound of a leash can set off excitement.`,
    ],
    affection: (n) => [
      `Shows love in quiet but unmistakable ways — leaning in close says more than words ever could.`,
      `If you're distracted, don't be surprised by a gentle nudge reminding you they're there — that's love too.`,
      `A big fan of physical affection — expect a very happy expression during pets and cuddles.`,
    ],
    mischief: (n) => [
      `If it's suspiciously quiet, something fun might be brewing 👀 — mischief tends to strike when bored.`,
      `Has an uncanny sense for when you're not looking — prime time for a little trouble.`,
      `New objects get investigated immediately, which occasionally turns into a game.`,
    ],
    luck: (n) => [
      `Especially blessed with the luck of being loved — draws attention and affection everywhere they go.`,
      `Good health luck — with proper care, likely to grow up strong and thriving.`,
      `Born with food luck — treats and good meals seem to always find their way to them.`,
    ],
  },
};

const SAJU_TAG_POOL = {
  ko: ["#껌딱지", "#간식러버", "#사랑둥이", "#호기심대장", "#애교폭발", "#뚝심캐릭터", "#산책러버", "#낯가림주의", "#인싸기질", "#힐링요정", "#장난꾸러기", "#집사바라기"],
  en: ["#Velcro", "#TreatLover", "#SweetSoul", "#CuriousOne", "#AffectionOverload", "#GentleStubborn", "#WalkFanatic", "#ShyAtFirst", "#SocialStar", "#HealingVibes", "#LittleTrouble", "#DevotedToYou"],
};

const SAJU_ONE_WORD = {
  ko: [
    "사랑받는 법을 너무 잘 아는 천재 막내",
    "온 집안의 분위기 메이커",
    "조용히 마음을 훔치는 스나이퍼",
    "매일이 즐거운 긍정 에너지 발전소",
    "보기만 해도 웃음이 나는 힐링캠프",
    "은근한 고집으로 집사를 조종하는 상전",
  ],
  en: [
    "A tiny genius at being loved",
    "The household's official mood-maker",
    "A quiet expert at stealing hearts",
    "A little engine of pure positive energy",
    "Instant happiness, just add eye contact",
    "The boss who runs things with gentle stubbornness",
  ],
};

const SAJU_TODAY = {
  ko: [
    (n) => `오늘 ${josa(n, "이가", "가")} 먼저 다가온다면 하던 일을 잠깐 멈추고 쓰다듬어 주세요. 평소보다 사랑을 더 받고 싶은 날일지도 몰라요. 💕`,
    (n) => `오늘은 ${n}랑 눈을 오래 맞춰보세요. 생각보다 많은 이야기를 하고 있을지도 몰라요 👀`,
    (n) => `${n}가 오늘 유독 옆에 붙어있다면, 그건 "오늘 하루 잘했어"라는 무언의 인사일 수 있어요.`,
    (n) => `오늘 간식 하나 정도는 그냥 넘어가 줘도 좋은 날이에요. ${n}도 가끔은 특별대우가 필요하니까요 🍖`,
    (n) => `바쁘더라도 오늘은 ${n}와 잠깐 산책이나 놀이 시간을 가져보세요. 그 몇 분이 하루를 다르게 만들어줄 거예요.`,
  ],
  en: [
    (n) => `If ${n} comes to you first today, pause what you're doing and give them a good pet. They might just want extra love today. 💕`,
    (n) => `Try holding eye contact with ${n} a little longer today — there might be more being said than you'd expect 👀`,
    (n) => `If ${n} is extra clingy today, take it as their quiet way of saying "you did great today."`,
    (n) => `Today's a good day to let one extra treat slide — ${n} deserves a little special treatment sometimes 🍖`,
    (n) => `However busy today is, try to fit in a short walk or play session with ${n} — those few minutes go a long way.`,
  ],
};

function generateSajuResult(input, lang) {
  const { name, birthDate, species, gender } = input;
  const seed = `${name}|${birthDate}|${species}|${gender || ""}`;
  const bank = SAJU_DATA[lang] || SAJU_DATA.ko;
  const pick = (key, salt) => seededPick(seed, salt, bank[key](name));
  const today = new Date().toISOString().slice(0, 10);
  const todayBank = SAJU_TODAY[lang] || SAJU_TODAY.ko;
  const todayLine = seededPick(seed + today, "today", todayBank)(name);
  const tagPool = SAJU_TAG_POOL[lang] || SAJU_TAG_POOL.ko;
  const t1 = seededPick(seed, "tag1", tagPool);
  let t2 = seededPick(seed, "tag2", tagPool);
  while (t2 === t1) t2 = tagPool[(tagPool.indexOf(t2) + 1) % tagPool.length];
  let t3 = seededPick(seed, "tag3", tagPool);
  while (t3 === t1 || t3 === t2) t3 = tagPool[(tagPool.indexOf(t3) + 1) % tagPool.length];
  return {
    summary: pick("summaries", "summary"),
    oneWord: seededPick(seed, "oneword", (SAJU_ONE_WORD[lang] || SAJU_ONE_WORD.ko)),
    tags: [t1, t2, t3],
    today: todayLine,
    categories: [
      { key: "personality", icon: "🌱", text: pick("personality", "personality") },
      { key: "bond", icon: "💕", text: pick("bond", "bond") },
      { key: "friends", icon: "🐾", text: pick("friends", "friends") },
      { key: "food", icon: "🍖", text: pick("food", "food") },
      { key: "play", icon: "🧸", text: pick("play", "play") },
      { key: "affection", icon: "💗", text: pick("affection", "affection") },
      { key: "mischief", icon: "😈", text: pick("mischief", "mischief") },
      { key: "luck", icon: "🍀", text: pick("luck", "luck") },
    ],
  };
}

function SajuInputForm({ defaultPet, onGenerate }) {
  const t = useT();
  const [name, setName] = useState(defaultPet ? defaultPet.profile.name : "");
  const [species, setSpecies] = useState(defaultPet ? defaultPet.profile.species : "dog");
  const [birthDate, setBirthDate] = useState(defaultPet ? defaultPet.profile.birthDate : "");
  const [gender, setGender] = useState(defaultPet ? defaultPet.profile.gender : "female");
  const [birthTime, setBirthTime] = useState("");
  const [breed, setBreed] = useState(defaultPet ? defaultPet.profile.breedName : "");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const next = {};
    if (!name.trim()) next.name = t.sajuErrName;
    if (!birthDate) next.birthDate = t.sajuErrBirth;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    onGenerate({ name: name.trim(), species, birthDate, gender, birthTime, breed: breed.trim() });
  };

  return (
    <div className="bg-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <SajuIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
        <h3 style={{ fontSize: 17 }}>{t.sajuFormTitle}</h3>
      </div>
      <p className="bg-sub" style={{ fontSize: 13, marginBottom: 18 }}>{t.sajuFormSub}</p>

      <div style={{ marginBottom: 14 }}>
        <label className="bg-label">{t.sajuNameLabel}</label>
        <input type="text" className={`bg-input ${errors.name ? "invalid" : ""}`} value={name}
          onChange={(e) => setName(e.target.value)} placeholder={t.sajuNamePlaceholder} />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bg-label">{t.sajuSpeciesLabel}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={`bg-chip ${species === "dog" ? "active" : ""}`} style={{ flex: 1 }}
            onClick={() => setSpecies("dog")}>🐶 {t.speciesLabel.dog}</button>
          <button type="button" className={`bg-chip ${species === "cat" ? "active" : ""}`} style={{ flex: 1 }}
            onClick={() => setSpecies("cat")}>🐱 {t.speciesLabel.cat}</button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bg-label">{t.sajuBirthLabel}</label>
        <input type="date" className={`bg-input ${errors.birthDate ? "invalid" : ""}`} value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)} />
        {errors.birthDate && <div className="field-error">{errors.birthDate}</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bg-label">{t.sajuGenderLabel}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={`bg-chip ${gender === "female" ? "active" : ""}`} style={{ flex: 1 }}
            onClick={() => setGender("female")}>{t.genderFemale}</button>
          <button type="button" className={`bg-chip ${gender === "male" ? "active" : ""}`} style={{ flex: 1 }}
            onClick={() => setGender("male")}>{t.genderMale}</button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bg-label">{t.sajuTimeLabel} ({t.optional})</label>
        <input type="time" className="bg-input" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="bg-label">{t.sajuBreedLabel} ({t.optional})</label>
        <input type="text" className="bg-input" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t.sajuBreedPlaceholder} />
      </div>

      <button className="bg-btn" style={{ width: "100%", fontSize: 15 }} onClick={submit}>{t.sajuGenerateBtn}</button>
    </div>
  );
}

async function renderSajuShareCard({ result, name, lang, t, petPhoto }) {
  const canvas = document.createElement("canvas");
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Pet사주는 연보라/크림 톤의 부드러운 분위기로
  ctx.fillStyle = "#F4F0FA";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  const pad = 54;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 40);
  ctx.fill();

  try {
    const logo = await loadImage(PETGROW_LOGO_DATA_URI);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pad + 80, pad + 80, 34, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, pad + 46, pad + 46, 68, 68);
    ctx.restore();
  } catch {}
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Pet", pad + 128, pad + 90);
  ctx.fillStyle = "#4F9D3C";
  ctx.fillText("Grow", pad + 128 + ctx.measureText("Pet").width, pad + 90);

  ctx.textAlign = "center";
  ctx.fillStyle = "#666666";
  ctx.font = "24px sans-serif";
  ctx.fillText(t.sajuShareHeading(name), W / 2, pad + 180);

  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 40px sans-serif";
  wrapText(ctx, result.summary, W / 2, pad + 250, W - pad * 2 - 60, 52);

  // 반려동물 사진 (없으면 자연스럽게 생략)
  let photoBottom = pad + 340;
  if (petPhoto) {
    try {
      const img = await loadImage(petPhoto);
      const cx = W / 2, cy = pad + 420, r = 96;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.strokeStyle = "#4F9D3C"; ctx.lineWidth = 5; ctx.stroke();
      ctx.clip();
      // object-fit: cover 방식으로 정사각형 크롭
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      photoBottom = cy + r + 30;
    } catch {}
  }

  let y = photoBottom + 60;
  ctx.font = "bold 26px sans-serif";
  result.categories.slice(0, 3).forEach((c) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#4F9D3C";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(c.icon, pad + 40, y);
    ctx.fillStyle = "#1C1C1C";
    ctx.font = "22px sans-serif";
    wrapText(ctx, c.text, pad + 90, y, W - pad * 2 - 130, 30, 2);
    y += 140;
  });

  ctx.textAlign = "center";
  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#4F9D3C";
  ctx.fillText(result.tags.join("   "), W / 2, Math.min(y + 20, H - pad - 90));

  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#999999";
  ctx.fillText("PetGrow  |  petgrow.co.kr", W / 2, H - pad - 36);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(" ");
  let line = "";
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  lines = lines.slice(0, maxLines);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l.trim(), x, startY + i * lineHeight));
}

function SajuShareModal({ open, onClose, result, name, lang, petPhoto }) {
  const t = useT();
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!open || !result) { setDataUrl(null); return; }
    renderSajuShareCard({ result, name, lang, t, petPhoto }).then(setDataUrl);
  }, [open, result, lang, petPhoto]);

  const triggerDownloadLink = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name}-petgrow-saju.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${name}-petgrow-saju.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "PetGrow" });
        return;
      }
    } catch {}
    triggerDownloadLink();
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>{t.sajuShareTitle}</h3>
        <button type="button" className="icon-btn" aria-label={t.cancel} onClick={onClose}>
          <PlusIcon style={{ width: 16, height: 16, color: "var(--sub)", transform: "rotate(45deg)" }} />
        </button>
      </div>
      {dataUrl ? (
        <img src={dataUrl} alt="saju share card" style={{ width: "100%", borderRadius: 16, marginBottom: 16, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }} />
      ) : (
        <div className="bg-sub" style={{ textAlign: "center", padding: "60px 0" }}>{t.shareCardLoading}</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={handleShare}>{t.sajuShareBtn}</button>
      </div>
    </Modal>
  );
}

function SajuResultView({ input, onRestart }) {
  const lang = useLang();
  const t = useT();
  const [shareOpen, setShareOpen] = useState(false);
  const result = useMemo(() => generateSajuResult(input, lang), [input, lang]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 92, height: 92, borderRadius: "50%", overflow: "hidden", display: "block", border: "3px solid var(--primary)", background: "var(--surface)" }}>
            {input.profileImage ? (
              <img src={input.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            ) : (
              <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>
                {input.species === "cat" ? "🐱" : "🐶"}
              </span>
            )}
          </span>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{input.name}</div>
        </div>
        <div style={{ fontSize: 16, color: "var(--sub)", fontWeight: 700 }}>🐾 {t.sajuResultHeading(input.name)}</div>
        <h2 style={{ fontSize: 28, marginTop: 10, lineHeight: 1.45 }}>{result.summary}</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {result.categories.map((c) => (
          <div key={c.key} className="bg-surface-card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{c.icon} {t.sajuCategoryTitle[c.key]}</div>
            <div style={{ fontSize: 17, lineHeight: 1.85 }}>{c.text}</div>
          </div>
        ))}
      </div>

      <div className="bg-card" style={{ marginTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 15, color: "var(--sub)", fontWeight: 700, marginBottom: 10 }}>{t.sajuOneWordTitle(input.name)}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{input.species === "cat" ? "🐱" : "🐶"} {result.oneWord}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {result.tags.map((tag) => (
            <span key={tag} className="bg-chip" style={{ fontSize: 14, cursor: "default", padding: "8px 12px" }}>{tag}</span>
          ))}
        </div>
      </div>

      <button className="bg-btn" style={{ width: "100%", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => setShareOpen(true)}>
        <ShareIcon style={{ width: 16, height: 16 }} /> {t.sajuShareBtn}
      </button>

      <button type="button" className="bg-btn bg-btn-ghost" style={{ width: "100%", marginTop: 16 }} onClick={onRestart}>
        {t.sajuRestartBtn}
      </button>

      <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
        {t.sajuDisclaimer}
      </div>

      <SajuShareModal open={shareOpen} onClose={() => setShareOpen(false)} result={result} name={input.name} lang={lang} petPhoto={input.profileImage} />
    </div>
  );
}

function SajuPage({ pet, onGoRegister }) {
  const t = useT();
  const [input, setInput] = useState(null);

  if (input) {
    return <SajuResultView input={input} onRestart={() => setInput(null)} />;
  }

  if (!pet) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="bg-card" style={{ textAlign: "center" }}>
          <SajuIcon style={{ width: 40, height: 40, color: "var(--primary)", margin: "0 auto 14px" }} />
          <h2 style={{ fontSize: 19, marginBottom: 6 }}>{t.sajuNeedPetTitle}</h2>
          <p className="bg-sub" style={{ fontSize: 13, marginBottom: 22 }}>{t.sajuNeedPetBody}</p>
          <button className="bg-btn" style={{ width: "100%", fontSize: 15 }} onClick={onGoRegister}>
            {t.sajuGoRegisterBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="bg-card" style={{ textAlign: "center" }}>
        <FeaturePetHeader pet={pet} />
        <h2 style={{ fontSize: 19, marginBottom: 6, marginTop: 10 }}>{t.sajuIntroTitle(pet.profile.name)}</h2>
        <p className="bg-sub" style={{ fontSize: 13, marginBottom: 22 }}>{t.sajuIntroSub}</p>
        <button className="bg-btn" style={{ width: "100%", fontSize: 15 }}
          onClick={() => setInput({
            name: pet.profile.name,
            species: pet.profile.species,
            birthDate: pet.profile.birthDate,
            gender: pet.profile.gender,
            birthTime: "",
            breed: pet.profile.breedName,
            profileImage: pet.profile.profileImage || null,
          })}>
          {t.sajuGenerateBtn}
        </button>
      </div>
      <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
        {t.sajuDisclaimer}
      </div>
    </div>
  );
}

/* ============================================================
   PetBTI 🐾 — 답변 기반 16가지 성격 유형 테스트 (참고용 재미 콘텐츠)
   질문/유형 데이터와 계산 로직, UI를 분리해서 나중에 쉽게 수정할 수 있어요.
   ============================================================ */
const PETBTI_QUESTIONS_DOG = [
  { id: "q1", axis: "EI", ko: "산책하다 처음 보는 강아지를 만났어요! 우리 아이는? 🐕", en: "You meet a new dog on a walk. What does your pet do?",
    options: [
      { ko: "먼저 다가가서 인사한다", en: "Goes over to say hi first", w: 2 },
      { ko: "상대가 다가오면 인사한다", en: "Greets back if approached", w: 1 },
      { ko: "보호자 옆에서 일단 지켜본다", en: "Watches from beside you first", w: -1 },
      { ko: "가능한 한 지나가고 싶어 한다", en: "Would rather just walk past", w: -2 },
    ] },
  { id: "q2", axis: "EI", ko: "집에 처음 보는 손님이 찾아왔어요.", en: "A guest you've never met visits your home.",
    options: [
      { ko: "누구세요?! 바로 달려간다", en: "Who's this?! Runs right over", w: 2 },
      { ko: "조금 지켜보다가 다가간다", en: "Watches a bit, then approaches", w: 1 },
      { ko: "보호자 옆에서 관찰한다", en: "Observes from beside you", w: -1 },
      { ko: "익숙해질 때까지 거리를 둔다", en: "Keeps distance until comfortable", w: -2 },
    ] },
  { id: "q8", axis: "EI", ko: "하루 중 가장 행복해 보이는 순간은?", en: "When do they seem happiest during the day?",
    options: [
      { ko: "사람이나 친구들과 함께 놀 때", en: "Playing with people or friends", w: 2 },
      { ko: "새로운 냄새와 장소를 탐험할 때", en: "Exploring new smells and places", w: 1 },
      { ko: "보호자와 둘이 붙어 있을 때", en: "Cuddled up just with you", w: -1 },
      { ko: "자기만의 자리에서 편하게 쉴 때", en: "Relaxing alone in their own spot", w: -2 },
    ] },
  { id: "q3", axis: "SN", ko: "새로운 장난감을 사줬을 때는? 🧸", en: "You bring home a new toy.",
    options: [
      { ko: "바로 달려들어서 놀아본다", en: "Dives right in to play", w: 2 },
      { ko: "냄새부터 꼼꼼하게 확인한다", en: "Sniffs it carefully first", w: 1 },
      { ko: "보호자가 먼저 보여줘야 관심을 가진다", en: "Only gets interested once you show them", w: -1 },
      { ko: "원래 좋아하던 장난감이 더 좋다", en: "Prefers their old favorite toy", w: -2 },
    ] },
  { id: "q4", axis: "SN", ko: "산책 코스가 갑자기 바뀌면?", en: "Your usual walking route suddenly changes.",
    options: [
      { ko: "새로운 길이라 더 신난다!", en: "Extra excited — a new route!", w: 2 },
      { ko: "냄새 맡으며 열심히 탐색한다", en: "Sniffs around and explores eagerly", w: 1 },
      { ko: "조금 당황하지만 잘 따라간다", en: "A little thrown off but follows along", w: -1 },
      { ko: "익숙한 길로 가고 싶어 한다", en: "Wants to go the usual way", w: -2 },
    ] },
  { id: "q9", axis: "SN", ko: "집에 낯선 냄새(새 물건, 손님 냄새 등)가 나면?", en: "There's an unfamiliar smell at home (new item, a guest's scent, etc).",
    options: [
      { ko: "바로 찾아가서 냄새부터 맡아본다", en: "Goes straight to investigate", w: 2 },
      { ko: "지나가면서 슬쩍 확인한다", en: "Checks it out in passing", w: 1 },
      { ko: "별 관심 없이 하던 대로 지낸다", en: "Not too bothered, carries on as usual", w: -1 },
      { ko: "익숙한 자기 자리에서 안정을 찾는다", en: "Settles into their familiar spot", w: -2 },
    ] },
  { id: "q5", axis: "TF", ko: "보호자가 다른 강아지를 예뻐하고 있다면? 💕", en: "You're petting another dog.",
    options: [
      { ko: "나도 끼어든다!", en: "Squeezes right in!", w: 2 },
      { ko: "보호자에게 바로 관심을 요구한다", en: "Demands your attention right away", w: 1 },
      { ko: "조금 떨어져서 지켜본다", en: "Watches from a bit of a distance", w: -1 },
      { ko: "별로 신경 쓰지 않는다", en: "Doesn't seem to mind much", w: -2 },
    ] },
  { id: "q7", axis: "TF", ko: "보호자가 슬퍼 보인다면?", en: "You seem a little sad.",
    options: [
      { ko: "바로 옆으로 와서 붙어 있는다", en: "Comes right over and stays close", w: 2 },
      { ko: "얼굴을 핥거나 애교를 부린다", en: "Gives kisses or extra affection", w: 1 },
      { ko: "조금 떨어진 곳에서 지켜본다", en: "Keeps a small distance and watches", w: -1 },
      { ko: "평소처럼 행동한다", en: "Behaves as usual", w: -2 },
    ] },
  { id: "q10", axis: "TF", ko: "실수로 물건을 넘어뜨리는 등 살짝 혼이 났을 때는?", en: "They get a gentle scolding for knocking something over.",
    options: [
      { ko: "금방 다가와서 애교로 화해를 청한다", en: "Comes right over asking to make up", w: 2 },
      { ko: "보호자 눈치를 슬쩍 살핀다", en: "Quietly checks your reaction", w: 1 },
      { ko: "잠깐 혼자 있다가 아무 일 없었단 듯 행동한다", en: "Takes a moment alone, then moves on", w: -1 },
      { ko: "별로 신경 쓰지 않고 자기 할 일을 한다", en: "Barely fazed, goes about their business", w: -2 },
    ] },
  { id: "q6", axis: "JP", ko: "간식을 눈앞에 두고 기다려야 한다면? 🍖", en: "They have to wait for a treat right in front of them.",
    options: [
      { ko: "온몸으로 빨리 달라고 표현한다", en: "Expresses impatience with their whole body", w: 2 },
      { ko: "눈을 뚫어져라 쳐다보며 기다린다", en: "Stares intently while waiting", w: 1 },
      { ko: "얌전히 기다리는 편이다", en: "Waits fairly calmly", w: -1 },
      { ko: "관심 없는 척하지만 사실 기다리고 있다", en: "Plays it cool but is definitely waiting", w: -2 },
    ] },
  { id: "q11", axis: "JP", ko: "평소와 다른 시간에 산책을 나가자고 하면?", en: "You suggest a walk at an unusual time.",
    options: [
      { ko: "시간 상관없이 무조건 신난다", en: "Excited no matter the time", w: 2 },
      { ko: "약간 얼떨떨하지만 곧 적응한다", en: "A little confused but adjusts quickly", w: 1 },
      { ko: "괜찮아 하면서도 평소 시간을 더 좋아한다", en: "Fine with it, but prefers the usual time", w: -1 },
      { ko: "정해진 시간이 아니면 시큰둥하다", en: "Not too enthused outside the usual time", w: -2 },
    ] },
  { id: "q12", axis: "JP", ko: "주말에 보호자가 늦잠을 자면?", en: "You sleep in on the weekend.",
    options: [
      { ko: "일단 깨우러 간다", en: "Goes to wake you up", w: 2 },
      { ko: "조금 기다리다가 슬쩍 깨운다", en: "Waits a bit, then nudges you awake", w: 1 },
      { ko: "같이 뒹굴거리며 여유를 즐긴다", en: "Lounges right along with you", w: -1 },
      { ko: "신경 안 쓰고 자기도 늘어져 있는다", en: "Doesn't mind, stays sleepy too", w: -2 },
    ] },
];

const PETBTI_QUESTIONS_CAT = [
  { id: "c1", axis: "EI", ko: "낯선 손님이 집에 찾아왔어요.", en: "An unfamiliar visitor comes to your home.",
    options: [
      { ko: "누군지 확인하러 슬쩍 다가간다", en: "Sneaks over to check them out", w: 2 },
      { ko: "숨어서 눈으로만 지켜본다", en: "Hides and just watches with its eyes", w: 1 },
      { ko: "익숙한 자리로 피해서 쉰다", en: "Retreats to a familiar spot to rest", w: -1 },
      { ko: "아예 안 보이는 곳으로 숨는다", en: "Disappears somewhere completely out of sight", w: -2 },
    ] },
  { id: "c2", axis: "EI", ko: "다른 강아지나 고양이를 마주쳤을 때는?", en: "They come across another dog or cat.",
    options: [
      { ko: "먼저 다가가서 냄새를 맡아본다", en: "Approaches first to sniff them out", w: 2 },
      { ko: "거리를 두고 가만히 관찰한다", en: "Keeps distance and simply observes", w: 1 },
      { ko: "슬쩍 피해서 다른 곳으로 간다", en: "Quietly slips away elsewhere", w: -1 },
      { ko: "하악질하거나 잔뜩 경계한다", en: "Hisses or gets very defensive", w: -2 },
    ] },
  { id: "c3", axis: "EI", ko: "갑자기 큰 소리(청소기, 초인종 등)가 나면?", en: "A sudden loud noise happens (vacuum, doorbell, etc).",
    options: [
      { ko: "소리 난 곳으로 다가가서 확인한다", en: "Goes over to check out the source", w: 2 },
      { ko: "귀만 쫑긋하고 자리에서 지켜본다", en: "Ears perk up, watches from where it is", w: 1 },
      { ko: "다른 방으로 자리를 옮긴다", en: "Moves to another room", w: -1 },
      { ko: "바로 숨을 곳부터 찾는다", en: "Immediately looks for a hiding spot", w: -2 },
    ] },
  { id: "c4", axis: "SN", ko: "집에 새로운 물건(가구, 상자 등)이 생기면?", en: "A new object (furniture, a box, etc) appears at home.",
    options: [
      { ko: "바로 다가가서 냄새부터 맡는다", en: "Goes right over to sniff it first", w: 2 },
      { ko: "주변을 빙빙 돌며 살펴본다", en: "Circles around, checking it out", w: 1 },
      { ko: "시간을 두고 천천히 다가간다", en: "Approaches slowly, taking its time", w: -1 },
      { ko: "관심 없이 하던 대로 지낸다", en: "Ignores it, carries on as usual", w: -2 },
    ] },
  { id: "c5", axis: "SN", ko: "새 장난감을 줬을 때는? 🧶", en: "You give them a new toy.",
    options: [
      { ko: "바로 달려들어 사냥하듯 논다", en: "Pounces on it right away, like hunting", w: 2 },
      { ko: "앞발로 툭툭 건드려본다", en: "Pokes at it with a paw first", w: 1 },
      { ko: "몇 번 보다가 흥미를 잃는다", en: "Looks a couple times, then loses interest", w: -1 },
      { ko: "원래 쓰던 장난감만 찾는다", en: "Just goes for the old favorite toy", w: -2 },
    ] },
  { id: "c6", axis: "SN", ko: "캣타워나 높은 곳이 생기면?", en: "A cat tower or high spot becomes available.",
    options: [
      { ko: "제일 높은 곳부터 바로 올라간다", en: "Climbs straight to the very top", w: 2 },
      { ko: "낮은 곳부터 차근차근 올라가본다", en: "Works up from the lower steps", w: 1 },
      { ko: "지켜보다가 나중에 슬쩍 올라간다", en: "Watches, then climbs up later on its own", w: -1 },
      { ko: "높은 곳보다 바닥이 더 편하다", en: "Prefers staying on the ground", w: -2 },
    ] },
  { id: "c7", axis: "TF", ko: "보호자가 쓰다듬어 줄 때 반응은? 🤲", en: "How do they react when you pet them?",
    options: [
      { ko: "골골거리며 몸을 비빈다", en: "Purrs and rubs against you", w: 2 },
      { ko: "가만히 있으며 즐기는 편이다", en: "Stays still and seems to enjoy it", w: 1 },
      { ko: "잠깐만 허락하고 자리를 뜬다", en: "Allows it briefly, then moves on", w: -1 },
      { ko: "손이 오면 슬쩍 피한다", en: "Dodges away when a hand comes near", w: -2 },
    ] },
  { id: "c8", axis: "TF", ko: "보호자가 외출 후 집에 돌아왔을 때는?", en: "You come home after being out.",
    options: [
      { ko: "현관까지 마중 나와 반긴다", en: "Comes to greet you right at the door", w: 2 },
      { ko: "다가와서 몸을 비비며 인사한다", en: "Comes over and rubs against you in greeting", w: 1 },
      { ko: "있던 자리에서 슬쩍 쳐다본다", en: "Glances over from wherever it was", w: -1 },
      { ko: "별 반응 없이 하던 일을 계속한다", en: "Barely reacts, keeps doing its own thing", w: -2 },
    ] },
  { id: "c9", axis: "TF", ko: "우리 아이만의 애정 표현 방식은?", en: "How do they show affection in their own way?",
    options: [
      { ko: "무릎 위에 올라와 딱 붙어 있는다", en: "Climbs right onto your lap and stays close", w: 2 },
      { ko: "옆에 나란히 앉아 함께 시간을 보낸다", en: "Sits right beside you to spend time together", w: 1 },
      { ko: "가끔 다가와 얼굴을 부빈다", en: "Comes by now and then for a head bump", w: -1 },
      { ko: "적당한 거리를 두는 게 편하다", en: "Prefers keeping a comfortable distance", w: -2 },
    ] },
  { id: "c10", axis: "JP", ko: "혼자 있는 시간이 길어지면?", en: "They spend a long stretch of time alone.",
    options: [
      { ko: "심심해하며 보호자를 기다린다", en: "Gets bored and waits for you", w: 2 },
      { ko: "적당히 놀다가 낮잠을 잔다", en: "Plays a bit, then naps", w: 1 },
      { ko: "자기만의 루틴대로 잘 지낸다", en: "Sticks to its own routine just fine", w: -1 },
      { ko: "오히려 혼자만의 시간을 즐긴다", en: "Actually seems to enjoy the alone time", w: -2 },
    ] },
  { id: "c11", axis: "JP", ko: "잠자는 장소를 정할 때는?", en: "When it comes to picking a spot to sleep.",
    options: [
      { ko: "그때그때 내키는 곳에서 잔다", en: "Sleeps wherever feels right in the moment", w: 2 },
      { ko: "몇 군데를 옮겨 다니며 잔다", en: "Rotates between a few favorite spots", w: 1 },
      { ko: "정해둔 자리를 주로 고수한다", en: "Mostly sticks to one set spot", w: -1 },
      { ko: "항상 똑같은 자리에서만 잔다", en: "Always sleeps in exactly the same spot", w: -2 },
    ] },
  { id: "c12", axis: "JP", ko: "밥 시간이 평소보다 늦어지면?", en: "Mealtime runs later than usual.",
    options: [
      { ko: "바로 다가와서 적극적으로 재촉한다", en: "Comes right over, actively demanding food", w: 2 },
      { ko: "근처를 맴돌며 신호를 보낸다", en: "Hovers nearby, giving hints", w: 1 },
      { ko: "조용히 기다리는 편이다", en: "Tends to wait quietly", w: -1 },
      { ko: "늦어져도 크게 신경 쓰지 않는다", en: "Doesn't seem too bothered either way", w: -2 },
    ] },
];

function petBtiQuestionsFor(species) {
  return species === "cat" ? PETBTI_QUESTIONS_CAT : PETBTI_QUESTIONS_DOG;
}

const PETBTI_TYPES = {
  ENFP: { ko: "핵인싸 모험대장", en: "The Adventure-Loving Social Star", emoji: "🐶" },
  ENFJ: { ko: "모두의 사랑둥이", en: "Everyone's Sweetheart", emoji: "💕" },
  INFP: { ko: "감성 가득 껌딱지", en: "The Sentimental Cuddle-Bug", emoji: "🌷" },
  INFJ: { ko: "조용한 마음읽기 천재", en: "The Quiet Mind-Reader", emoji: "🌙" },
  ESTP: { ko: "사고뭉치 행동대장", en: "The Mischief Captain", emoji: "⚡" },
  ESFP: { ko: "관심받는 슈퍼스타", en: "The Attention-Loving Superstar", emoji: "🎉" },
  ISTJ: { ko: "루틴을 사랑하는 모범생", en: "The Routine-Loving Star Pupil", emoji: "🧸" },
  ISFJ: { ko: "집사바라기 순둥이", en: "The Devoted Sweet Soul", emoji: "💕" },
  ENTP: { ko: "궁금한 건 못 참는 장난꾸러기", en: "The Can't-Resist-Curiosity Trickster", emoji: "🔍" },
  ENTJ: { ko: "산책길의 리더", en: "The Walk-Route Leader", emoji: "🧭" },
  INTP: { ko: "혼자만의 세계가 있는 관찰자", en: "The Thoughtful Observer", emoji: "🔭" },
  INTJ: { ko: "조용히 계획하는 전략가", en: "The Quiet Strategist", emoji: "♟️" },
  ESTJ: { ko: "규칙을 사랑하는 든든한 반장", en: "The Reliable Rule-Follower", emoji: "📋" },
  ESFJ: { ko: "분위기 메이커 인기스타", en: "The Life-of-the-Party Favorite", emoji: "🎈" },
  ISTP: { ko: "쿨한 마이웨이 탐험가", en: "The Cool Independent Explorer", emoji: "🛠️" },
  ISFP: { ko: "자유로운 감성 예술가", en: "The Free-Spirited Artist", emoji: "🎨" },
};

const PETBTI_SUMMARY = {
  ko: {
    ENFP: "친구도 좋아! 산책도 좋아! 근데 집사가 제일 좋아! 💕", ENFJ: "가족 모두를 챙기는 다정한 마음을 가졌어요 💕",
    INFP: "조용히, 하지만 깊이 사랑하는 감성파예요 🌷", INFJ: "말 안 해도 다 알아채는 눈치 100단이에요 🌙",
    ESTP: "심심할 틈이 없게 만드는 에너자이저예요 ⚡", ESFP: "어디서든 시선을 사로잡는 타고난 스타예요 🎉",
    ISTJ: "약속은 약속! 루틴을 지키는 든든한 아이예요 🧸", ISFJ: "보호자 옆이 세상에서 제일 좋은 자리예요 💕",
    ENTP: "궁금한 건 절대 그냥 못 넘어가는 타입이에요 🔍", ENTJ: "산책길에서도 은근히 주도권을 잡는 편이에요 🧭",
    INTP: "자기만의 세계가 확실한 관찰형이에요 🔭", INTJ: "조용하지만 다 계산하고 있는 전략가예요 ♟️",
    ESTJ: "규칙과 루틴 속에서 제일 안정감을 느껴요 📋", ESFJ: "모두를 챙기는 분위기 메이커예요 🎈",
    ISTP: "쿨하게 자기 할 일 하는 마이웨이 스타일이에요 🛠️", ISFP: "자유롭고 감성적인 예술가 기질이 있어요 🎨",
  },
  en: {
    ENFP: "Loves friends, loves walks, but loves you most! 💕", ENFJ: "A warm heart that looks out for everyone 💕",
    INFP: "Quiet but deeply, sincerely loving 🌷", INFJ: "Somehow always knows exactly how you feel 🌙",
    ESTP: "Never a dull moment with this energizer ⚡", ESFP: "A natural-born star who draws every eye 🎉",
    ISTJ: "A promise is a promise — routine's biggest fan 🧸", ISFJ: "Right by your side is their favorite place 💕",
    ENTP: "Can't let a good mystery go uninvestigated 🔍", ENTJ: "Quietly takes the lead, even on walks 🧭",
    INTP: "A thoughtful observer with their own little world 🔭", INTJ: "Quiet, but always thinking three steps ahead ♟️",
    ESTJ: "Most at ease with clear rules and routine 📋", ESFJ: "The warm host who looks after everyone 🎈",
    ISTP: "Cool, capable, and doing their own thing 🛠️", ISFP: "A free-spirited little artist at heart 🎨",
  },
};

// 8개 성향 축별 한 문단 — 이 조각들을 섹션마다 조합해서 16유형 x 10섹션 결과를 만들어요
const PETBTI_AXIS_TRAITS = {
  ko: {
    E: "사람이나 다른 동물을 만나면 먼저 다가가서 인사를 건네는 활발한 편이에요. 새로운 만남 자체를 즐거운 이벤트로 여기는 사교적인 성격이에요.",
    I: "낯선 만남보다는 익숙한 사람, 익숙한 공간에서 훨씬 편안함을 느껴요. 처음엔 조심스럽게 지켜보다가 시간이 지나면 서서히 마음을 여는 신중한 스타일이에요.",
    S: "눈앞의 냄새, 익숙한 산책길, 확실한 먹을거리처럼 지금 느껴지는 것들에 집중하는 편이에요. 확실하고 익숙한 것에서 안정감을 느껴요.",
    N: "새로운 장소, 낯선 냄새, 처음 보는 물건에 유독 호기심이 반짝여요. '이건 또 뭐지?' 하며 탐험하는 걸 좋아하는 은근한 모험가 기질이 있어요.",
    T: "자기만의 기준이 확실한 편이라, 하고 싶은 게 있으면 눈치 안 보고 밀고 나가는 뚝심이 있어요. 감정보다 '내가 원하는 것'이 우선인 마이웨이 스타일이에요.",
    F: "보호자나 친구의 기분 변화를 은근히 잘 알아채는 편이에요. 곁에 있는 사람의 감정에 따라 자기 행동도 슬쩍 바뀌는 정 많은 타입이에요.",
    J: "정해진 시간에 밥 먹고 정해진 코스로 산책하는 익숙한 루틴을 좋아해요. 갑작스러운 변화보다는 예측 가능한 하루를 훨씬 편안해해요.",
    P: "계획보다는 그때그때 내키는 대로 움직이는 걸 좋아해요. 갑자기 상황이 바뀌어도 의외로 잘 적응하는 편이에요.",
  },
  en: {
    E: "Quick to approach and greet new people or animals — a social soul who treats every new meeting as an exciting event.",
    I: "Feels most at ease with familiar people and places, warming up carefully and gradually to anything new.",
    S: "Tuned into what's right in front of them — familiar smells, routes, and treats — and finds comfort in the certain and known.",
    N: "Lights up with curiosity around new places, smells, and objects — a bit of a low-key adventurer at heart.",
    T: "Has a clear sense of what they want and pursues it with quiet confidence, independent of what others think.",
    F: "Remarkably attuned to your mood, often adjusting their own behavior to match how the people around them are feeling.",
    J: "Loves a predictable routine — set mealtimes, familiar walk routes — and feels most comfortable when the day goes as expected.",
    P: "Prefers to go with the flow rather than stick to a plan, and adapts surprisingly well when things change suddenly.",
  },
};

const PETBTI_SECTION_AXES = {
  personality: [0, 1], bond: [2, 0], friends: [0, 2], play: [1, 3], walk: [1, 0],
  food: [3, 2], alone: [0, 2], mischief: [3, 1], affection: [2, 0], hidden: [1, 3],
};

function petBtiScore(answers, questions) {
  const axisScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  (questions || PETBTI_QUESTIONS_DOG).forEach((q) => {
    const ansIdx = answers[q.id];
    if (ansIdx === undefined) return;
    axisScores[q.axis] += q.options[ansIdx].w;
  });
  const letter = (axis, pos, neg) => (axisScores[axis] >= 0 ? pos : neg);
  const type = letter("EI", "E", "I") + letter("SN", "N", "S") + letter("TF", "F", "T") + letter("JP", "P", "J");
  const norm = (v) => Math.round(((v + 6) / 12) * 100);
  const stats = {
    affection: norm(axisScores.TF),
    curiosity: norm(axisScores.SN),
    social: norm(axisScores.EI),
    control: Math.round((norm(axisScores.TF) + norm(axisScores.JP)) / 2),
    food: Math.max(5, Math.min(99, norm(axisScores.JP) + (hashString(JSON.stringify(answers) + "food") % 11 - 5))),
  };
  return { type, axisScores, stats };
}

function petBtiOppositeType(type) {
  const flip = { E: "I", I: "E", S: "N", N: "S", T: "F", F: "T", J: "P", P: "J" };
  return type.split("").map((c) => flip[c]).join("");
}

// 같은 유형이라도 실제 답변 점수(능력치)에 따라 문장이 조금 더 달라지도록 하는 보정 문구
const PETBTI_STAT_FLAVOR = {
  ko: {
    personality: {
      high: (n, statVal) => statVal.affection >= 65 ? `특히 ${n}는 애정 표현이 유독 풍부한 편이라, 이 성격이 더 다정하게 느껴질 거예요.` : "",
      low: (n, statVal) => statVal.affection < 35 ? `다만 ${n}는 표현이 담백한 편이라, 애정이 없다기보단 조용히 마음을 전하는 스타일이에요.` : "",
    },
    affection: {
      high: (n, s) => s.affection >= 70 ? `애교 지수가 꽤 높은 편이라, 하루에도 몇 번씩 애정 표현을 받을 수 있을 거예요 💕` : "",
      low: (n, s) => s.affection < 30 ? `애정 표현이 은근한 편이라, 잘 살펴보면 작은 신호들 속에 마음이 담겨있을 거예요.` : "",
    },
    food: {
      high: (n, s) => s.food >= 70 ? `먹을 것 앞에서는 유독 진심이 되는 편이라, 간식 시간이 하루 중 제일 신나는 순간일 수 있어요 🍖` : "",
      low: (n, s) => s.food < 30 ? `의외로 먹을 것에 크게 연연하지 않는 편이라, 간식보다 다른 것에 더 마음이 가는 타입일 수 있어요.` : "",
    },
    alone: {
      high: (n, s) => s.control >= 65 ? `혼자서도 은근히 자기만의 페이스를 지키는, 독립심 있는 모습을 보일 거예요.` : "",
      low: (n, s) => s.control < 35 ? `다만 보호자가 안 보이면 은근히 기다리는 모습을 보일 수도 있어요.` : "",
    },
  },
  en: {
    personality: {
      high: (n, s) => s.affection >= 65 ? `${n} in particular shows a lot of affection, which makes this side even warmer.` : "",
      low: (n, s) => s.affection < 35 ? `${n} tends to express things subtly — not less loving, just quieter about it.` : "",
    },
    affection: {
      high: (n, s) => s.affection >= 70 ? `Their affection meter runs high, so expect love shown several times a day 💕` : "",
      low: (n, s) => s.affection < 30 ? `Affection shows up in quieter ways — look closely and you'll spot the small signals.` : "",
    },
    food: {
      high: (n, s) => s.food >= 70 ? `Gets especially serious around food — treat time might be the highlight of their day 🍖` : "",
      low: (n, s) => s.food < 30 ? `Surprisingly unbothered by food — other things tend to grab their attention more.` : "",
    },
    alone: {
      high: (n, s) => s.control >= 65 ? `Even alone, they tend to keep to their own independent pace.` : "",
      low: (n, s) => s.control < 35 ? `That said, they might quietly wait around when you're out of sight.` : "",
    },
  },
};

function petBtiSectionText(type, key, name, lang, stats) {
  const traits = PETBTI_AXIS_TRAITS[lang] || PETBTI_AXIS_TRAITS.ko;
  const [i1, i2] = PETBTI_SECTION_AXES[key];
  const letters = key === "hidden"
    ? [petBtiOppositeType(type)[i1], petBtiOppositeType(type)[i2]]
    : [type[i1], type[i2]];
  const t1 = traits[letters[0]];
  const t2 = traits[letters[1]];
  const flavorSet = (PETBTI_STAT_FLAVOR[lang] || PETBTI_STAT_FLAVOR.ko)[key];
  let flavor = "";
  if (flavorSet && stats) {
    flavor = flavorSet.high(name, stats) || flavorSet.low(name, stats) || "";
  }
  return [t1, t2, flavor].filter(Boolean).join(" ");
}

function generatePetBtiResult(input, answers, lang) {
  const { type, axisScores, stats } = petBtiScore(answers, petBtiQuestionsFor(input.species));
  const nickname = PETBTI_TYPES[type];
  const summary = (PETBTI_SUMMARY[lang] || PETBTI_SUMMARY.ko)[type];
  const name = input.name;
  const sections = ["personality", "bond", "friends", "play", "walk", "food", "alone", "mischief", "affection", "hidden"]
    .map((key) => ({ key, text: petBtiSectionText(type, key, name, lang, stats) }));
  const seed = `${name}|${type}|${JSON.stringify(answers)}`;
  const tagBanks = {
    ko: ["#핵인싸", "#집콕러버", "#호기심대장", "#마이웨이", "#사랑교감러", "#루틴수호자", "#즉흥모험가", "#간식러버", "#애교쟁이", "#집사조종러", "#산책마니아", "#관찰형천재"],
    en: ["#SocialStar", "#HomebodyHeart", "#CuriousOne", "#MyWayStyle", "#DeepBonder", "#RoutineKeeper", "#SpontaneousSoul", "#TreatLover", "#AffectionOverload", "#SecretlyInCharge", "#WalkFanatic", "#QuietObserver"],
  };
  const tagPool = tagBanks[lang] || tagBanks.ko;
  const t1 = seededPick(seed, "tag1", tagPool);
  let t2 = seededPick(seed, "tag2", tagPool);
  while (t2 === t1) t2 = tagPool[(tagPool.indexOf(t2) + 1) % tagPool.length];
  let t3 = seededPick(seed, "tag3", tagPool);
  while (t3 === t1 || t3 === t2) t3 = tagPool[(tagPool.indexOf(t3) + 1) % tagPool.length];
  const oneWordBank = {
    ko: ["세상 모든 재미있는 일에 참견해야 직성이 풀리는 사랑둥이", "곁에 있는 것만으로 위로가 되는 다정한 아이", "은근한 매력으로 집안을 다스리는 작은 상전", "매일이 새로운 모험인 것처럼 사는 긍정 에너지"],
    en: ["A sweetheart who has to be part of every fun thing happening", "Comforting simply by being near", "The tiny boss who quietly runs the household", "Living every day like a brand new adventure"],
  };
  const oneWord = seededPick(seed, "oneword", (oneWordBank[lang] || oneWordBank.ko));
  const oppositeType = petBtiOppositeType(type);
  const oppositeNickname = PETBTI_TYPES[oppositeType];
  return { type, nickname, summary, sections, stats, tags: [t1, t2, t3], oneWord, oppositeType, oppositeNickname };
}

function PetBtiStatBar({ label, icon, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        <span>{icon} {label}</span><span style={{ color: "var(--primary)" }}>{value}</span>
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 999, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function PetBtiQuestionFlow({ species, onComplete }) {
  const lang = useLang();
  const t = useT();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = petBtiQuestionsFor(species);
  const q = questions[step];
  const progress = Math.round((step / questions.length) * 100);

  const choose = (idx) => {
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      onComplete(next);
    }
  };

  return (
    <div className="bg-card">
      <div style={{ background: "var(--surface)", borderRadius: 999, height: 6, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", borderRadius: 999, transition: ".2s" }} />
      </div>
      <div className="bg-sub" style={{ fontSize: 12, marginBottom: 8 }}>{step + 1} / {questions.length}</div>
      <h3 style={{ fontSize: 17, marginBottom: 18, lineHeight: 1.5 }}>{lang === "en" ? q.en : q.ko}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, idx) => (
          <button key={idx} type="button" className="bg-btn bg-btn-ghost" style={{ textAlign: "left", padding: "14px 18px", fontSize: 14 }}
            onClick={() => choose(idx)}>
            {lang === "en" ? opt.en : opt.ko}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" className="bg-sub" style={{ background: "none", border: "none", marginTop: 16, fontSize: 12, cursor: "pointer" }}
          onClick={() => setStep(step - 1)}>← {lang === "en" ? "Back" : "이전"}</button>
      )}
    </div>
  );
}

async function renderPetBtiShareCard({ result, name, lang, t, petPhoto }) {
  const canvas = document.createElement("canvas");
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#EAF3FA";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  const pad = 54;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 40);
  ctx.fill();

  try {
    const logo = await loadImage(PETGROW_LOGO_DATA_URI);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pad + 80, pad + 80, 34, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, pad + 46, pad + 46, 68, 68);
    ctx.restore();
  } catch {}
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Pet", pad + 128, pad + 90);
  ctx.fillStyle = "#4F9D3C";
  ctx.fillText("Grow", pad + 128 + ctx.measureText("Pet").width, pad + 90);
  ctx.fillStyle = "#999999";
  ctx.font = "22px sans-serif";
  ctx.fillText("· PetBTI", pad + 128 + ctx.measureText("Grow").width + 138, pad + 90);

  ctx.textAlign = "center";
  ctx.fillStyle = "#666666";
  ctx.font = "24px sans-serif";
  ctx.fillText(t.petBtiShareHeading(name), W / 2, pad + 175);

  ctx.fillStyle = "#4F9D3C";
  ctx.font = "bold 58px sans-serif";
  ctx.fillText(`${result.type} ${result.nickname.emoji}`, W / 2, pad + 255);
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText((lang === "en" ? result.nickname.en : result.nickname.ko), W / 2, pad + 310);

  let photoBottom = pad + 400;
  if (petPhoto) {
    try {
      const img = await loadImage(petPhoto);
      const cx = W / 2, cy = pad + 420, r = 92;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.strokeStyle = "#4F9D3C"; ctx.lineWidth = 5; ctx.stroke();
      ctx.clip();
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      photoBottom = cy + r + 26;
    } catch {}
  }

  ctx.font = "26px sans-serif";
  ctx.fillStyle = "#666666";
  wrapText(ctx, result.summary, W / 2, photoBottom + 50, W - pad * 2 - 80, 36);

  let y = photoBottom + 190;
  ctx.font = "bold 30px sans-serif";
  ctx.fillStyle = "#4F9D3C";
  result.tags.forEach((tag) => {
    ctx.fillText(tag, W / 2, y);
    y += 56;
  });

  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#999999";
  ctx.fillText("PetGrow  |  petgrow.co.kr", W / 2, H - pad - 36);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function PetBtiShareModal({ open, onClose, result, name, lang, petPhoto }) {
  const t = useT();
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!open || !result) { setDataUrl(null); return; }
    renderPetBtiShareCard({ result, name, lang, t, petPhoto }).then(setDataUrl);
  }, [open, result, lang, petPhoto]);

  const triggerDownloadLink = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name}-petgrow-petbti.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${name}-petgrow-petbti.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "PetGrow" });
        return;
      }
    } catch {}
    triggerDownloadLink();
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>{t.petBtiShareTitle}</h3>
        <button type="button" className="icon-btn" aria-label={t.cancel} onClick={onClose}>
          <PlusIcon style={{ width: 16, height: 16, color: "var(--sub)", transform: "rotate(45deg)" }} />
        </button>
      </div>
      {dataUrl ? (
        <img src={dataUrl} alt="petbti share card" style={{ width: "100%", borderRadius: 16, marginBottom: 16, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }} />
      ) : (
        <div className="bg-sub" style={{ textAlign: "center", padding: "60px 0" }}>{t.shareCardLoading}</div>
      )}
      <button className="bg-btn" style={{ width: "100%" }} onClick={handleShare}>{t.petBtiShareBtn}</button>
    </Modal>
  );
}

function PetBtiResultView({ input, result, lang, onRestart }) {
  const t = useT();
  const [shareOpen, setShareOpen] = useState(false);
  const nickname = result.nickname;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 92, height: 92, borderRadius: "50%", overflow: "hidden", display: "block", border: "3px solid var(--primary)", background: "var(--surface)" }}>
            {input.profileImage ? (
              <img src={input.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            ) : (
              <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>
                {input.species === "cat" ? "🐱" : "🐶"}
              </span>
            )}
          </span>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{input.name}</div>
        </div>
        <div style={{ fontSize: 16, color: "var(--sub)", fontWeight: 700 }}>{t.petBtiResultHeading(input.name)}</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: "var(--primary)", marginTop: 10 }}>{result.type}</div>
        <div style={{ fontSize: 23, fontWeight: 800, marginTop: 6 }}>{nickname.emoji} {lang === "en" ? nickname.en : nickname.ko}</div>
        <p style={{ fontSize: 18, marginTop: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.summary}</p>
      </div>

      <div className="bg-card" style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>{t.petBtiStatsTitle}</div>
        <PetBtiStatBar label={t.petBtiStatAffection} icon="💕" value={result.stats.affection} />
        <PetBtiStatBar label={t.petBtiStatCuriosity} icon="👀" value={result.stats.curiosity} />
        <PetBtiStatBar label={t.petBtiStatFood} icon="🍖" value={result.stats.food} />
        <PetBtiStatBar label={t.petBtiStatSocial} icon="🐾" value={result.stats.social} />
        <PetBtiStatBar label={t.petBtiStatControl} icon="😈" value={result.stats.control} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {result.sections.map((s) => (
          <div key={s.key} className="bg-surface-card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              {PETBTI_SECTION_ICON[s.key]} {t.petBtiSectionTitle[s.key]}
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.85 }}>{s.text}</div>
          </div>
        ))}
      </div>

      <div className="bg-card" style={{ marginTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 15, color: "var(--sub)", fontWeight: 700, marginBottom: 10 }}>{t.petBtiOneWordTitle(input.name)}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{input.species === "cat" ? "🐱" : "🐶"} {result.oneWord}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {result.tags.map((tag) => (
            <span key={tag} className="bg-chip" style={{ fontSize: 14, cursor: "default", padding: "8px 12px" }}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="bg-card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>{t.petBtiCompatTitle(input.name)}</div>
        <div className="bg-surface-card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {result.oppositeType} {result.oppositeNickname.emoji} {lang === "en" ? result.oppositeNickname.en : result.oppositeNickname.ko}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.75 }}>{t.petBtiCompatGood(input.name)}</div>
        </div>
        <div className="bg-surface-card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>😂 {t.petBtiCompatChaosTitle}</div>
          <div style={{ fontSize: 16, lineHeight: 1.75 }}>{t.petBtiCompatChaos(input.name)}</div>
        </div>
      </div>

      <button className="bg-btn" style={{ width: "100%", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => setShareOpen(true)}>
        <ShareIcon style={{ width: 16, height: 16 }} /> {t.petBtiShareBtn}
      </button>
      <button type="button" className="bg-btn bg-btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={onRestart}>
        {t.petBtiRestartBtn}
      </button>

      <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
        {t.petBtiDisclaimer}
      </div>

      <PetBtiShareModal open={shareOpen} onClose={() => setShareOpen(false)} result={result} name={input.name} lang={lang} petPhoto={input.profileImage} />
    </div>
  );
}

const PETBTI_SECTION_ICON = {
  personality: "🐾", bond: "💕", friends: "🐕", play: "🧸", walk: "🌳",
  food: "🍖", alone: "🏠", mischief: "😈", affection: "💗", hidden: "✨",
};

function PetBtiPage({ pet, onUpdatePetBti, onGoRegister }) {
  const lang = useLang();
  const t = useT();
  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [liveResult, setLiveResult] = useState(null);

  const savedBti = pet && pet.petBti;

  const handleComplete = (answers) => {
    const input = { name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, profileImage: pet.profile.profileImage || null };
    const result = generatePetBtiResult(input, answers, lang);
    setLiveResult({ input, result, answers });
    if (onUpdatePetBti) onUpdatePetBti(pet.id, { type: result.type, answers, savedAt: new Date().toISOString() });
    setPhase("result");
  };

  if (!pet) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }} className="bg-card">
        <PetBtiIcon style={{ width: 40, height: 40, color: "var(--primary)", margin: "0 auto 14px" }} />
        <p className="bg-sub" style={{ fontSize: 14, marginBottom: 18 }}>{t.petBtiNoPet}</p>
        <button className="bg-btn" style={{ width: "100%", fontSize: 15 }} onClick={onGoRegister}>
          {t.sajuGoRegisterBtn}
        </button>
      </div>
    );
  }

  if (phase === "result" && liveResult) {
    return (
      <PetBtiResultView input={liveResult.input} result={liveResult.result} lang={lang}
        onRestart={() => { setLiveResult(null); setPhase("intro"); }} />
    );
  }

  if (phase === "quiz") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <PetBtiQuestionFlow species={pet.profile.species} onComplete={handleComplete} />
      </div>
    );
  }

  // intro
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="bg-card" style={{ textAlign: "center" }}>
        <FeaturePetHeader pet={pet} />
        <h2 style={{ fontSize: 19, marginBottom: 6, marginTop: 10 }}>{t.petBtiMainTitle}</h2>
        <p className="bg-sub" style={{ fontSize: 13, marginBottom: 4, whiteSpace: "pre-line" }}>{t.petBtiMainDesc}</p>
        {savedBti && (
          <div className="bg-surface-card" style={{ margin: "16px 0", textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700, marginBottom: 4 }}>{t.petBtiPreviousResult(pet.profile.name)}</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {savedBti.type} {PETBTI_TYPES[savedBti.type] && PETBTI_TYPES[savedBti.type].emoji} {PETBTI_TYPES[savedBti.type] && (lang === "en" ? PETBTI_TYPES[savedBti.type].en : PETBTI_TYPES[savedBti.type].ko)}
            </div>
          </div>
        )}
        <button className="bg-btn" style={{ width: "100%", fontSize: 15, marginTop: 14 }} onClick={() => setPhase("quiz")}>
          {savedBti ? t.petBtiRestartBtn : t.petBtiStartBtn}
        </button>
      </div>
      <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
        {t.petBtiDisclaimer}
      </div>
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

// Pet사주 · 오늘의 운세 · 보호자와 궁합 · PetBTI 처럼 반려동물별 결과를 보여주는 화면 상단에서
// 강아지·고양이 구분 없이 등록된 모든 아이 중 하나를 사진+이름으로 고를 수 있게 해줘요.
function PetPicker({ pets, activeId, onSelect }) {
  if (!pets || pets.length < 2) return null;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 12px", WebkitOverflowScrolling: "touch" }}>
      {pets.map((p) => (
        <button key={p.id} type="button" onClick={() => onSelect(p.id)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto",
            background: "none", border: "none", cursor: "pointer", padding: 0, opacity: p.id === activeId ? 1 : 0.55 }}>
          <span style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", display: "block",
            border: p.id === activeId ? "2.5px solid var(--primary)" : "2px solid var(--border)", background: "var(--surface)" }}>
            {p.profile.profileImage ? (
              <img src={p.profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            ) : (
              <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {p.species === "cat" ? "🐱" : "🐶"}
              </span>
            )}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.profile.name}
          </span>
        </button>
      ))}
    </div>
  );
}

// 결과 카드 상단 중앙에 표시하는 선택된 반려동물의 원형 프로필 사진 + 이름 (Pet사주/PetBTI 공통)
function FeaturePetHeader({ pet }) {
  if (!pet) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", display: "block",
        border: "3px solid var(--primary)", background: "var(--surface)" }}>
        {pet.profile.profileImage ? (
          <img src={pet.profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        ) : (
          <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
            {pet.species === "cat" ? "🐱" : "🐶"}
          </span>
        )}
      </span>
      <span style={{ fontWeight: 800, fontSize: 16 }}>{pet.profile.name}</span>
    </div>
  );
}

/* ============================================================
   ResultPage
   ============================================================ */
function ResultPage({ pet, breedGroups, onAddRecord, onDeleteRecord, onAddPhoto, onEditPhoto, onDeletePhoto, onEdit, onDelete, onUpdateProfileImage, onToggleVaccineItem }) {
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
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onUpdateProfileImage(dataUrl);
    } catch {
      alert(t.photoSaveError);
    }
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

      <div className="result-columns">
        <div className="result-block">
          <AdultWeightHero profile={profile} estimate={estimate} ageMonths={ageMonthsNow} breedDisplayName={breedDisplayName} />
          <button type="button" className="bg-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 16 }}
            onClick={() => setShareOpen(true)}>
            <ShareIcon style={{ width: 16, height: 16 }} /> {t.shareCardBtn}
          </button>
        </div>
        <GrowthChartCard table={table} ageMonths={ageAtLatest} currentWeightKg={latest.weightKg} statusDiffGrams={latest.diffGrams} />
        <GrowthTableCard table={table} />
        <RecordSection records={sortedRecords} onAddRecord={handleAddRecord} onDeleteRecord={onDeleteRecord} />
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
   소개페이지 기능 카드용 일러스트 — 외부 이미지 없이 프로젝트 안에서 안정적으로 쓰는 SVG 벡터 일러스트예요.
   전부 화이트/크림/연한 그린/PetGrow 메인 그린 톤으로 통일했고, 글자는 넣지 않았어요.
   ============================================================ */
const ILLUST_GREEN = "#4F9D3C";
const ILLUST_GREEN_LIGHT = "#DCEED4";
const ILLUST_CREAM = "#FBF8F1";
const ILLUST_DARK = "#2E3328";

function IllustMyPets(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <rect x="10" y="26" width="46" height="60" rx="14" fill={ILLUST_CREAM} stroke={ILLUST_GREEN_LIGHT} strokeWidth="2" />
      <rect x="64" y="34" width="46" height="60" rx="14" fill="#fff" stroke={ILLUST_GREEN_LIGHT} strokeWidth="2" transform="rotate(6 87 64)" />
      <circle cx="33" cy="48" r="14" fill={ILLUST_GREEN_LIGHT} />
      <path d="M33 42c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9z" fill="none" />
      <circle cx="27" cy="44" r="2.4" fill={ILLUST_GREEN} /><circle cx="39" cy="44" r="2.4" fill={ILLUST_GREEN} /><circle cx="33" cy="52" r="2.6" fill={ILLUST_GREEN} />
      <rect x="20" y="68" width="26" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="20" y="76" width="18" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <circle cx="87" cy="58" r="13" fill={ILLUST_GREEN} opacity="0.14" />
      <path d="M80 52l3-6 4 5 4-5 3 6" stroke={ILLUST_GREEN} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="81" cy="58" r="2" fill={ILLUST_GREEN} /><circle cx="93" cy="58" r="2" fill={ILLUST_GREEN} />
      <rect x="76" y="78" width="22" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
    </svg>
  );
}

function IllustGrowth(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <rect x="12" y="14" width="96" height="92" rx="18" fill={ILLUST_CREAM} />
      <polyline points="26,82 46,64 62,72 92,38" fill="none" stroke={ILLUST_GREEN} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92" cy="38" r="5" fill={ILLUST_GREEN} />
      <circle cx="62" cy="72" r="3.5" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2.5" />
      <circle cx="46" cy="64" r="3.5" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2.5" />
      <rect x="24" y="88" width="8" height="10" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="40" y="82" width="8" height="16" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="56" y="78" width="8" height="20" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="72" y="70" width="8" height="28" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <g transform="translate(86,20)">
        <ellipse cx="8" cy="10" rx="9" ry="7.5" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2" />
        <circle cx="4.5" cy="9" r="1.4" fill={ILLUST_DARK} /><circle cx="11.5" cy="9" r="1.4" fill={ILLUST_DARK} />
      </g>
    </svg>
  );
}

function IllustSaju(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <circle cx="60" cy="60" r="52" fill={ILLUST_GREEN_LIGHT} opacity="0.5" />
      <rect x="34" y="30" width="52" height="66" rx="12" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2" />
      <path d="M60 44a9 9 0 1 0 6 15.6A11 11 0 1 1 60 44z" fill={ILLUST_GREEN} />
      <path d="M32 22l2.4 5.2L40 30l-5.6 2.6L32 38l-2.4-5.4L24 30l5.6-2.8z" fill={ILLUST_GREEN} opacity="0.85" />
      <path d="M92 70l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8z" fill={ILLUST_GREEN} opacity="0.7" />
      <ellipse cx="60" cy="80" rx="12" ry="9" fill={ILLUST_GREEN_LIGHT} />
      <path d="M52 76l2-5 3.5 4 3.5-4 2 5" stroke={ILLUST_GREEN} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="55" cy="81" r="1.6" fill={ILLUST_DARK} /><circle cx="65" cy="81" r="1.6" fill={ILLUST_DARK} />
    </svg>
  );
}

function IllustPetBti(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <circle cx="60" cy="62" r="24" fill={ILLUST_CREAM} />
      <path d="M50 54l3-7 4.5 5.5L62 47l3 7" stroke={ILLUST_GREEN} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="62" r="2.4" fill={ILLUST_DARK} /><circle cx="68" cy="62" r="2.4" fill={ILLUST_DARK} />
      <path d="M54 70q6 5 12 0" stroke={ILLUST_DARK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <g fill={ILLUST_GREEN}>
        <path d="M22 34l3 3-3 3-3-3z" opacity="0.8" />
        <circle cx="96" cy="30" r="4" opacity="0.7" />
        <path d="M18 84a5 3.4 0 1 0 10 0 5 3.4 0 1 0-10 0z" opacity="0.6" />
        <path d="M92 90l2.6 5.6 5.6 2.4-5.6 2.4L92 106l-2.6-5.6-5.6-2.4 5.6-2.4z" opacity="0.75" />
      </g>
    </svg>
  );
}

function IllustFortune(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <circle cx="86" cy="30" r="16" fill={ILLUST_GREEN_LIGHT} />
      <circle cx="86" cy="30" r="10" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2" />
      <path d="M30 20l2.6 5.6L38 28l-5.4 2.4L30 36l-2.6-5.6L22 28l5.4-2.4z" fill={ILLUST_GREEN} />
      <path d="M60 60c8-10 20-4 16 6-3 8-16 16-16 20-0-4-13-12-16-20-4-10 8-16 16-6z" fill={ILLUST_GREEN} opacity="0.18" />
      <path d="M60 60c6-8 16-3 13 5-2 6-13 13-13 16-0-3-11-10-13-16-3-8 7-13 13-5z" fill="none" stroke={ILLUST_GREEN} strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="46" cy="92" rx="18" ry="12" fill={ILLUST_CREAM} />
      <path d="M36 86l2.6-6.4L44 84l4-6 4 6 5.4-4.4L60 86" stroke={ILLUST_GREEN} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="94" r="1.8" fill={ILLUST_DARK} /><circle cx="52" cy="94" r="1.8" fill={ILLUST_DARK} />
    </svg>
  );
}

function IllustCompat(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <circle cx="34" cy="52" r="18" fill={ILLUST_CREAM} />
      <circle cx="34" cy="42" r="9" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2" />
      <path d="M22 78c0-9 6-16 12-16s12 7 12 16" fill="none" stroke={ILLUST_GREEN} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="86" cy="54" r="17" fill={ILLUST_GREEN_LIGHT} />
      <path d="M78 48l2.4-5.4L86 46l5.6-3.4L94 48" stroke={ILLUST_GREEN} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="81" cy="56" r="2" fill={ILLUST_DARK} /><circle cx="91" cy="56" r="2" fill={ILLUST_DARK} />
      <path d="M60 60c5-6 13-2 10.5 4.5C68.5 69.5 60 75 60 78c0-3-8.5-8.5-10.5-13.5C47 58 55 54 60 60z" fill={ILLUST_GREEN} />
    </svg>
  );
}

function IllustTips(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <rect x="16" y="52" width="52" height="40" rx="10" fill={ILLUST_CREAM} />
      <rect x="26" y="62" width="32" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="26" y="70" width="24" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <rect x="26" y="78" width="28" height="4" rx="2" fill={ILLUST_GREEN_LIGHT} />
      <g transform="translate(66,14)">
        <circle cx="18" cy="18" r="16" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2.4" />
        <path d="M12 15c0-4.4 3.6-8 8-8s8 3.6 8 8c0 3-1.6 4.6-3 6.2-1 1.1-1.8 2-1.8 3.8h-6.4c0-1.8-.8-2.7-1.8-3.8-1.4-1.6-3-3.2-3-6.2z" fill={ILLUST_GREEN_LIGHT} />
        <rect x="14.5" y="27" width="7" height="4" rx="1.6" fill={ILLUST_GREEN} />
      </g>
      <circle cx="30" cy="30" r="10" fill={ILLUST_GREEN_LIGHT} />
      <path d="M25 27l2 5 4-6" stroke={ILLUST_GREEN} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IllustCommunity(p) {
  return (
    <svg viewBox="0 0 120 120" {...p}>
      <rect x="14" y="20" width="70" height="50" rx="16" fill={ILLUST_CREAM} />
      <path d="M30 70l-2 12 14-8z" fill={ILLUST_CREAM} />
      <circle cx="34" cy="42" r="9" fill="#fff" stroke={ILLUST_GREEN} strokeWidth="2" />
      <circle cx="58" cy="46" r="7" fill={ILLUST_GREEN_LIGHT} stroke={ILLUST_GREEN} strokeWidth="1.6" />
      <circle cx="31" cy="41" r="1.6" fill={ILLUST_DARK} /><circle cx="37" cy="41" r="1.6" fill={ILLUST_DARK} />
      <circle cx="56" cy="46" r="1.3" fill={ILLUST_DARK} /><circle cx="60" cy="46" r="1.3" fill={ILLUST_DARK} />
      <circle cx="92" cy="86" r="16" fill="#fff" stroke={ILLUST_GREEN_LIGHT} strokeWidth="2" />
      <path d="M92 80c4-4 10-1 8 4.5-1.5 4-8 8.5-8 10.5 0-2-6.5-6.5-8-10.5-2-5.5 4-8.5 8-4.5z" fill={ILLUST_GREEN} />
      <path d="M80 20l2.4-5.4L88 12l-5.6-2.6L80 4l-2.4 5.4L72 12l5.6 2.6z" fill={ILLUST_GREEN} opacity="0.75" />
    </svg>
  );
}

// 소개페이지 '핵심 기능' 카드 — 기존 .landing-feature-card 스타일을 그대로 활용해요
function LandingFeatureCard({ Illust, title, desc }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon"><Illust style={{ width: 40, height: 40 }} /></div>
      <div className="landing-feature-title">{title}</div>
      <div className="landing-feature-desc">{desc}</div>
    </div>
  );
}

// Pet사주 / PetBTI 강조 영역용 큰 카드
function LandingHighlightCard({ Illust, eyebrow, title, desc, ctaLabel, onClick }) {
  return (
    <div className="landing-highlight-card">
      <div className="landing-highlight-illust"><Illust style={{ width: 76, height: 76 }} /></div>
      <div className="landing-highlight-eyebrow">{eyebrow}</div>
      <div className="landing-highlight-title">{title}</div>
      <p className="landing-highlight-desc">{desc}</p>
      <button type="button" className="landing-highlight-cta" onClick={onClick}>{ctaLabel}</button>
    </div>
  );
}

// Pet톡 소개 영역에 쓰는 가상 피드 카드 (실제 회원 데이터 아님, 소개페이지 전용 목업)
function CommunityMockCard({ Illust, name, breed, timeLabel, text, likeCount, commentCount, dim }) {
  return (
    <div className="cm-mock-card" style={dim ? { opacity: 0.55, transform: "scale(0.96)" } : undefined}>
      <div className="cm-mock-header">
        <span className="cm-mock-avatar"><Illust style={{ width: 22, height: 22 }} /></span>
        <div>
          <div className="cm-mock-name">{name} <span className="cm-mock-breed">· {breed}</span></div>
          <div className="cm-mock-time">{timeLabel}</div>
        </div>
      </div>
      <div className="cm-mock-photo"><Illust style={{ width: 46, height: 46 }} /></div>
      <div className="cm-mock-text">{text}</div>
      <div className="cm-mock-meta">♡ {likeCount} 　💬 {commentCount}</div>
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
// 소개 페이지 영상 — 자동재생하지 않고 사용자가 직접 재생해요.
function IntroVideo() {
  const videoRef = useRef(null);
  const DEFAULT_VOLUME = 0.5;

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = DEFAULT_VOLUME;
  }, []);

  return (
    <div className="intro-video-wrap about-fade">
      <video
        ref={videoRef}
        className="intro-video"
        src="/intro-video.mp4"
        poster="/intro-video-poster.webp"
        controls
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}

// 공식 소셜 채널 링크
const SOCIAL_LINKS = [
  { id: "youtube", url: "https://www.youtube.com/@petgrow_official", icon: YoutubeIcon, color: "#FF0000" },
  { id: "instagram", url: "https://www.instagram.com/petgrow_official", icon: InstagramIcon, color: "#E1306C" },
  { id: "threads", url: "https://www.threads.com/@petgrow_official", icon: ThreadsIcon, color: "#1C1C1C" },
  { id: "tiktok", url: "https://www.tiktok.com/@petgrow_official", icon: TiktokIcon, color: "#1C1C1C" },
  { id: "blog", url: "https://blog.naver.com/petgrow", icon: BlogIcon, color: "#03C75A" },
];
function SocialLinks() {
  const t = useT();
  return (
    <div className="social-links">
      {SOCIAL_LINKS.map((s) => {
        const Icon = s.icon;
        return (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="social-btn"
            style={{ color: s.color }} aria-label={t.socialLabels[s.id]}>
            <Icon style={{ width: 22, height: 22 }} />
          </a>
        );
      })}
    </div>
  );
}

function AboutPage({ onStart, onNavigate }) {
  const t = useT();
  const go = (v) => (onNavigate ? onNavigate(v) : onStart());
  return (
    <div className="landing-root">
      {/* HERO */}
      <section className="landing-section landing-hero-section" style={{ paddingTop: 40 }}>
        <div className="landing-wrap">
          <div className="landing-logo-badge about-logo-float">
            <PetGrowLogo style={{ width: 116, height: 116 }} />
          </div>

          <p className="about-fade" style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)", marginBottom: 4, animationDelay: "0s" }}>
            {t.landingGreeting}
          </p>
          <h1 className="landing-headline about-fade" style={{ animationDelay: ".1s" }}>
            {t.landingHeadline1}<br className="mobile-br" /> <span className="hl">{t.landingHeadlineHighlight}</span>{t.landingHeadline2}
          </h1>
          <p className="landing-subtitle about-fade" style={{ animationDelay: ".22s" }}>{t.landingSubtitle}</p>

          <button className="landing-cta about-fade" style={{ animationDelay: ".28s", fontSize: 17, padding: "18px 46px" }} onClick={onStart}>
            {t.landingCta}
          </button>

          <div className="about-fade" style={{ maxWidth: 620, margin: "26px auto 0", animationDelay: ".36s" }}>
            <div style={{ textAlign: "center", fontSize: 17, fontWeight: 800, marginBottom: 12, fontFamily: "'Jua',sans-serif" }}>
              PetGrow와 함께하는 반려생활 🐾
            </div>
            <IntroVideo />
          </div>

          <div className="landing-illustration about-fade" style={{ animationDelay: ".46s" }}>
            <div className="paw-badge"><PawIcon style={{ width: 72, height: 72, color: "#3a3a3a" }} /></div>
            <div className="cat-badge"><CatIcon style={{ width: 72, height: 72, color: "#4F9D3C" }} /></div>
          </div>
        </div>
      </section>

      {/* PetGrow 소개 */}
      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-about about-fade">
            <div className="landing-about-icon">
              <PetGrowLogo style={{ width: 62, height: 62 }} />
            </div>
            <h2 className="landing-section-title" style={{ marginBottom: 0 }}>{t.landingAboutTitle}</h2>
            <p className="landing-about-text">{t.landingAboutBody}</p>
          </div>
        </div>
      </section>

      {/* 핵심 기능 8개 한눈에 보기 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{t.landingCoreFeaturesTitle}</h2>
          <p style={{ textAlign: "center", color: "#8a8f86", fontSize: 15, marginBottom: 8 }}>{t.landingCoreFeaturesSubtitle}</p>
          <div className="landing-features">
            <LandingFeatureCard Illust={IllustMyPets} title={t.landingCardMyPetsTitle} desc={t.landingCardMyPetsDesc} />
            <LandingFeatureCard Illust={IllustGrowth} title={t.landingCardGrowthTitle} desc={t.landingCardGrowthDesc} />
            <LandingFeatureCard Illust={IllustSaju} title={t.landingCardSajuTitle} desc={t.landingCardSajuDesc} />
            <LandingFeatureCard Illust={IllustPetBti} title={t.landingCardPetBtiTitle} desc={t.landingCardPetBtiDesc} />
            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />
            <LandingFeatureCard Illust={IllustCommunity} title={t.landingCardCommunityTitle} desc={t.landingCardCommunityDesc} />
          </div>
        </div>
      </section>

      {/* 성장관리 (기존 유지) */}
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

      {/* Pet사주 + PetBTI 강조 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title">{t.landingFunTitle}</h2>
          <div className="landing-highlight-grid">
            <LandingHighlightCard Illust={IllustSaju} eyebrow={t.landingSajuEyebrow}
              title={t.landingSajuHighlightTitle} desc={t.landingSajuHighlightDesc}
              ctaLabel={t.landingSajuHighlightCta} onClick={() => go("saju")} />
            <LandingHighlightCard Illust={IllustPetBti} eyebrow={t.landingPetBtiEyebrow}
              title={t.landingPetBtiHighlightTitle} desc={t.landingPetBtiHighlightDesc}
              ctaLabel={t.landingPetBtiHighlightCta} onClick={() => go("petbti")} />
          </div>
          <p className="bg-sub" style={{ textAlign: "center", fontSize: 12, marginTop: 20 }}>{t.landingFunDisclaimer}</p>
        </div>
      </section>

      {/* Pet톡 커뮤니티 강조 */}
      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{t.landingCommunityTitle}</h2>
          <p style={{ textAlign: "center", color: "#8a8f86", fontSize: 15, marginBottom: 8 }}>{t.landingCommunitySubtitle}</p>
          <div className="landing-community-wrap">
            <div className="landing-community-text">
              <p className="landing-community-desc">{t.landingCommunityDesc}</p>
              <button type="button" className="landing-cta landing-community-cta" onClick={() => go("community")}>
                {t.landingCommunityCta}
              </button>
            </div>
            <div className="cm-mock-feed">
              <CommunityMockCard Illust={IllustMyPets} name={t.landingMockPost1Name} breed={t.landingMockPost1Breed}
                timeLabel={t.landingMockPost1Time} text={t.landingMockPost1Text} likeCount={24} commentCount={7} />
              <CommunityMockCard Illust={IllustPetBti} name={t.landingMockPost2Name} breed={t.landingMockPost2Breed}
                timeLabel={t.landingMockPost2Time} text={t.landingMockPost2Text} likeCount={12} commentCount={3} />
            </div>
          </div>
        </div>
      </section>

      {/* Pet꿀팁 / 정보가이드 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{t.landingTipsGuideTitle}</h2>
          <p style={{ textAlign: "center", color: "#8a8f86", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>{t.landingTipsGuideDesc}</p>
          <div className="landing-mini-teaser">
            <button type="button" className="landing-mini-teaser-item" onClick={() => go("tips")}>
              <span className="landing-mini-teaser-icon"><IllustTips style={{ width: 20, height: 20 }} /></span>
              <span className="landing-mini-teaser-label">{t.landingTipsTeaserLabel}</span>
            </button>
            <button type="button" className="landing-mini-teaser-item" onClick={() => go("guide")}>
              <span className="landing-mini-teaser-icon"><HelpIcon style={{ width: 18, height: 18, color: "var(--primary)" }} /></span>
              <span className="landing-mini-teaser-label">{t.landingGuideTeaserLabel}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3단계로 시작하세요 */}
      <section className="landing-section landing-section-white">
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

      {/* 마지막 CTA */}
      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-final-cta">
            <div className="landing-final-cta-illust">
              <PawIcon style={{ width: 34, height: 34, color: "#fff", opacity: 0.9 }} />
              <CatIcon style={{ width: 34, height: 34, color: "var(--pg-green)" }} />
            </div>
            <div className="landing-final-cta-title">{t.landingFinalCtaLine1}<br />{t.landingFinalCtaLine2}</div>
            <p className="landing-final-cta-desc" style={{ whiteSpace: "pre-line" }}>{t.landingFinalCtaDesc}</p>
            <button type="button" className="landing-final-cta-btn" onClick={onStart}>{t.landingFinalCtaBtn}</button>
          </div>
        </div>
      </section>

      {/* SNS + 신뢰 배지 */}
      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-trust">
            <span className="landing-trust-item"><ShieldIcon style={{ width: 14, height: 14 }} />{t.landingTrust1}</span>
            <span className="landing-trust-item"><PlusIcon style={{ width: 14, height: 14 }} />{t.landingTrust2}</span>
            <span className="landing-trust-item"><LeafIcon style={{ width: 14, height: 14 }} />{t.landingTrust3}</span>
            <span className="landing-trust-item"><InfoIcon style={{ width: 14, height: 14 }} />{t.landingTrust4}</span>
          </div>
          <div style={{ marginTop: 40 }}>
            <div className="bg-sub" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{t.socialTitle}</div>
            <SocialLinks />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   기존 localStorage(로그인 전) 데이터를 로그인한 계정으로 이전하는 안내 모달
   ============================================================ */
function MigrationModal({ open, onSkip, onConfirm, loading }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onSkip} width={400}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>{t.migrationTitle}</h3>
        <p className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{t.migrationBody}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={onSkip} disabled={loading}>
            {t.migrationLater}
          </button>
          <button type="button" className="bg-btn" style={{ flex: 1 }} onClick={onConfirm} disabled={loading}>
            {loading ? t.migrationSaving : t.migrationConfirm}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   정보가이드 — 전체 기능 안내 탭 (요청서 15번)
   ============================================================ */
/* ============================================================
   홈 화면 (로그인 사용자 대시보드) — 참고 이미지의 인사말+반려동물 카드+서비스 카드 구성을 반영
   ============================================================ */
function HomeServiceCard({ Illust, bg, title, desc, onClick }) {
  return (
    <button type="button" className="home-service-card" style={{ background: bg }} onClick={onClick}>
      <div className="home-service-illust"><Illust style={{ width: 34, height: 34 }} /></div>
      <div className="home-service-title">{title}</div>
      <div className="home-service-desc">{desc}</div>
    </button>
  );
}

function HomePage({ account, pets = [], lang, onGoPets, onGoView }) {
  const t = useT();
  // 비로그인 상태에서는 브라우저에 남아 있는 이전 반려동물 정보를 홈에 노출하지 않아요.
  const visiblePets = account ? pets : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      <div className="home-hero-copy">
        <h1>{account?.name ? t.homeGreeting(account.name) : (lang === "en" ? "Welcome to PetGrow! 🐾" : "PetGrow에 오신 걸 환영해요! 🐾")}</h1>
        <p className="bg-sub">{t.homeSubGreeting}</p>
      </div>

      {visiblePets.length ? (
        <div className="home-pet-list">
          {visiblePets.map((pet) => (
            <div className="home-pet-card" key={pet.id} onClick={onGoPets}>
              <span className="home-pet-avatar">
                {pet.profile.profileImage ? (
                  <img src={pet.profile.profileImage} alt={`${pet.profile.name || "반려동물"} 프로필`} loading="lazy" />
                ) : (
                  <span style={{ fontSize: 26 }}>{pet.species === "cat" ? "🐱" : "🐶"}</span>
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="home-pet-name">{pet.profile.name}</div>
                <div className="bg-sub" style={{ fontSize: 13 }}>
                  {[pet.profile.breedName, petAgeLabel(pet.profile.birthDate, lang)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button type="button" className="bg-btn bg-btn-ghost" style={{ fontSize: 12, padding: "8px 14px", flexShrink: 0 }} onClick={onGoPets}>
                {t.homePetCardBtn}
              </button>
            </div>
          ))}
          <button type="button" className="home-pet-card home-pet-card-empty" onClick={onGoPets}>
            <PlusIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
            <span>{t.homeAddPetBtn}</span>
          </button>
        </div>
      ) : (
        <button type="button" className="home-pet-card home-pet-card-empty" onClick={onGoPets}>
          <PlusIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
          <span>{t.homeAddPetBtn}</span>
        </button>
      )}

      <h2 style={{ fontSize: 17, marginTop: 24, marginBottom: 14 }}>{t.homeServicesTitle}</h2>
      <div className="home-service-grid">
        <HomeServiceCard Illust={InfoIcon} bg="#EEF5EC" title={t.aboutNav} desc={lang === "en" ? "See PetGrow features and services at a glance" : "PetGrow의 기능과 서비스를 한눈에 보기"} onClick={() => onGoView("about")} />
        <HomeServiceCard Illust={IllustGrowth} bg="#EAF6E4" title={t.homeCardGrowthTitle} desc={t.homeCardGrowthDesc} onClick={onGoPets} />
        <HomeServiceCard Illust={IllustCommunity} bg="#FBE9EF" title={t.landingCardCommunityTitle.replace(/^\S+\s/, "")} desc={t.homeCardCommunityDesc} onClick={() => onGoView("community")} />
        <HomeServiceCard Illust={IllustSaju} bg="#F1ECFA" title={t.landingCardSajuTitle.replace(/^\S+\s/, "")} desc={t.homeCardSajuDesc} onClick={() => onGoView("saju")} />
        <HomeServiceCard Illust={IllustPetBti} bg="#E9F1FB" title={t.landingCardPetBtiTitle.replace(/^\S+\s/, "")} desc={t.homeCardPetBtiDesc} onClick={() => onGoView("petbti")} />
        <HomeServiceCard Illust={IllustTips} bg="#FBF3DC" title={t.landingCardTipsTitle.replace(/^\S+\s/, "")} desc={t.homeCardTipsDesc} onClick={() => onGoView("tips")} />
      </div>
    </div>
  );
}

// 모바일 "앱"(Capacitor 네이티브) 전용 하단 5탭 — 웹에서는 렌더되지 않아요
function AppBottomNav({ active, onNavigate }) {
  const t = useT();
  const items = [
    { key: "home", label: t.hamNavHome, Icon: HomeIcon },
    { key: "pets", label: t.appTabPetInfo, Icon: PawIcon },
    { key: "content", label: t.appTabPetContent, Icon: LightbulbIcon },
    { key: "community", label: t.communityNav, Icon: TalkIcon },
    { key: "my", label: t.hamNavMy, Icon: UserIcon },
  ];
  return (
    <nav className="app-bottom-nav">
      {items.map(({ key, label, Icon }) => (
        <button key={key} type="button" className={`app-bottom-nav-item ${active === key ? "active" : ""}`} onClick={() => onNavigate(key)}>
          <Icon style={{ width: 21, height: 21 }} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// Pet콘텐츠 (전체 | Pet사주 | PetBTI | Pet꿀팁) — 앱 하단탭에서만 진입하는 통합 콘텐츠 허브
function PetContentPage({ subTab, onSubTabChange, allPets, featurePet, onSelectFeaturePet, onGoRegister, onUpdatePetBti }) {
  const t = useT();
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 90px" }}>
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab-pill ${subTab === "all" ? "active" : ""}`} onClick={() => onSubTabChange("all")}>{t.contentTabAll}</button>
        <button type="button" className={`tab-pill ${subTab === "saju" ? "active" : ""}`} onClick={() => onSubTabChange("saju")}>{t.sajuNav}</button>
        <button type="button" className={`tab-pill ${subTab === "petbti" ? "active" : ""}`} onClick={() => onSubTabChange("petbti")}>{t.petBtiNav}</button>
        <button type="button" className={`tab-pill ${subTab === "tips" ? "active" : ""}`} onClick={() => onSubTabChange("tips")}>{t.tipsTitle}</button>
      </div>

      {subTab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <HomeServiceCard Illust={IllustSaju} bg="#F1ECFA" title={t.sajuNav} desc={t.homeCardSajuDesc} onClick={() => onSubTabChange("saju")} />
          <HomeServiceCard Illust={IllustPetBti} bg="#E9F1FB" title={t.petBtiNav} desc={t.homeCardPetBtiDesc} onClick={() => onSubTabChange("petbti")} />
          <HomeServiceCard Illust={IllustTips} bg="#FBF3DC" title={t.tipsTitle} desc={t.homeCardTipsDesc} onClick={() => onSubTabChange("tips")} />
        </div>
      )}
      {subTab === "saju" && (
        <>
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={onSelectFeaturePet} />
          <SajuPage pet={featurePet} onGoRegister={onGoRegister} />
        </>
      )}
      {subTab === "petbti" && (
        <>
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={onSelectFeaturePet} />
          <PetBtiPage pet={featurePet} onUpdatePetBti={onUpdatePetBti} onGoRegister={onGoRegister} />
        </>
      )}
      {subTab === "tips" && <TipsPage />}
    </div>
  );
}

function InfoGuidePage() {
  const t = useT();
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <HelpIcon style={{ width: 34, height: 34, color: "var(--primary)", margin: "0 auto 10px" }} />
        <h1 style={{ fontSize: 21 }}>{t.infoGuideTitle}</h1>
        <p className="bg-sub" style={{ fontSize: 13, marginTop: 6 }}>{t.infoGuideIntro}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {t.infoGuideSections.map((s) => (
          <div key={s.title} className="bg-surface-card">
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 5 }}>{s.title}</div>
            <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   /delete-account — 로그인 없이도 접근 가능한 독립 페이지 (Google Play 계정삭제 요건 대응)
   ============================================================ */
function DeleteAccountPage() {
  const t = useT();
  const [account, setAccount] = useState(null);
  const [checked, setChecked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      setAccount(await fetchMe());
      setChecked(true);
    })();
  }, []);

  const runDelete = async () => {
    setDeleting(true);
    const ok = await apiDeleteAccount();
    setDeleting(false);
    setConfirmOpen(false);
    if (ok) setDone(true);
  };

  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 24 }}>
          <PetGrowLogo style={{ width: 22, height: 22 }} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
            <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
          </span>
        </a>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>{t.deleteAccountPageTitle}</h1>
        <p className="bg-sub" style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 18 }}>{t.deleteAccountPageBody}</p>
        <ul className="bg-sub" style={{ fontSize: 13, lineHeight: 2, marginBottom: 26, paddingLeft: 18 }}>
          {t.deleteAccountItems.map((line) => <li key={line}>{line}</li>)}
        </ul>

        {done ? (
          <div className="bg-surface-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t.deleteAccountDoneTitle}</div>
            <div className="bg-sub" style={{ fontSize: 13, marginTop: 6 }}>{t.deleteAccountDoneBody}</div>
          </div>
        ) : !checked ? null : account ? (
          <div className="bg-surface-card">
            <div style={{ fontSize: 14, marginBottom: 12 }}>{t.deleteAccountLoggedInAs(account.name)}</div>
            <button type="button" className="bg-btn" style={{ background: "#C0392B", boxShadow: "0 5px 0 #922B21" }}
              onClick={() => setConfirmOpen(true)}>
              {t.accountDeleteBtn}
            </button>
          </div>
        ) : (
          <div className="bg-surface-card">
            <div style={{ fontSize: 14, marginBottom: 12 }}>{t.deleteAccountNeedLogin}</div>
            <button type="button" className="kakao-login-btn" onClick={goToKakaoLogin}>
              <KakaoIcon style={{ width: 20, height: 20 }} /> {t.loginContinueKakao}
            </button>
            <div className="bg-sub" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>
              {t.deleteAccountEmailFallback}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={t.deleteAccountConfirmTitle}
        message={t.deleteAccountConfirmBody}
        confirmLabel={deleting ? t.migrationSaving : t.accountDeleteBtn}
        onConfirm={runDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

/* ============================================================
   Pet톡 — 반려동물 중심 커뮤니티
   ============================================================ */
const COMMUNITY_CATEGORY_KEYS = ["daily", "brag", "question", "health", "info"];
const REPORT_REASON_KEYS = ["ad", "abuse", "sexual", "animal_abuse", "privacy", "misinformation", "spam", "other"];

function petSnapshot(pet) {
  return {
    id: pet.id,
    name: pet.profile.name,
    species: pet.species || pet.profile.species,
    breed: pet.profile.breedName || null,
    birthDate: pet.profile.birthDate || null,
    photo: pet.profile.profileImage || null,
  };
}

function CmPetAvatar({ pet, size = 34 }) {
  const style = { width: size, height: size };
  if (pet && pet.photo) {
    return <img src={pet.photo} alt="" className="cm-pet-avatar" style={style} />;
  }
  return (
    <span className="cm-pet-avatar-fallback" style={style}>
      {pet && pet.species === "cat" ? "🐱" : "🐶"}
    </span>
  );
}

function CmPetLine({ pet, lang, right }) {
  const t = useT();
  return (
    <div className="cm-pet-row">
      <CmPetAvatar pet={pet} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{pet.name}</div>
        <div className="bg-sub" style={{ fontSize: 11 }}>
          {[pet.breed, petAgeLabel(pet.birthDate, lang)].filter(Boolean).join(" · ")}
        </div>
      </div>
      {right}
    </div>
  );
}

function PostCard({ post, lang, onOpen }) {
  const t = useT();
  return (
    <div className="cm-card" onClick={onOpen}>
      {post.images && post.images[0] && <img src={post.images[0]} alt="" className="cm-card-img" />}
      <div className="cm-card-body">
        <CmPetLine pet={post.pet} lang={lang} right={<span className="bg-sub" style={{ fontSize: 11 }}>{timeAgoLabel(post.createdAt, lang)}</span>} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="cm-cat-chip" style={{ marginBottom: 0 }}>{t.communityCategoryLabels[post.category]}</span>
        {post.isOwner && (
          <span className="cm-cat-chip" style={{ marginBottom: 0, background: post.isPublic ? "#EAF6E4" : "#F1F1F1", color: post.isPublic ? "var(--primary)" : "var(--sub)" }}>
            {post.isPublic ? `🌐 ${t.communityVisibilityPublic}` : `🔒 ${t.communityVisibilityPrivate}`}
          </span>
        )}
      </div>
        <div className="cm-title">{post.title}</div>
        <div className="cm-content-preview">{post.content}</div>
        <div className="cm-meta-row">
          <span>{post.likedByMe ? "❤️" : "🤍"} {post.likeCount}</span>
          <span>💬 {post.commentCount}</span>
        </div>
      </div>
    </div>
  );
}

function ImagePickerGrid({ images, onAdd, onRemove, uploading }) {
  const t = useT();
  const fileRef = useRef(null);
  return (
    <div className="cm-photo-grid">
      {images.map((url, i) => (
        <div key={url + i} className="cm-photo-tile">
          <img src={url} alt="" />
          <button type="button" className="cm-photo-remove" onClick={() => onRemove(i)}>
            <PlusIcon style={{ width: 12, height: 12, transform: "rotate(45deg)" }} />
          </button>
        </div>
      ))}
      {images.length < 5 && (
        <button type="button" className="cm-photo-add" disabled={uploading} onClick={() => fileRef.current && fileRef.current.click()}>
          {uploading ? "..." : <PlusIcon style={{ width: 22, height: 22 }} />}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onAdd(f); e.target.value = ""; }} />
    </div>
  );
}

function PostComposer({ pets, initialPost, onCancel, onSaved }) {
  const t = useT();
  const lang = useLang();
  const isEdit = !!initialPost;
  const [petId, setPetId] = useState(initialPost ? initialPost.pet.id : (pets[0] && pets[0].id));
  const [category, setCategory] = useState(initialPost ? initialPost.category : "daily");
  const [title, setTitle] = useState(initialPost ? initialPost.title : "");
  const [content, setContent] = useState(initialPost ? initialPost.content : "");
  const [images, setImages] = useState(initialPost ? initialPost.images : []);
  const [isPublic, setIsPublic] = useState(initialPost ? initialPost.isPublic !== false : true);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleAddImage = async (file) => {
    if (images.length >= 5) { setErrors((e) => ({ ...e, images: t.communityImageTooMany })); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((e) => ({ ...e, images: t.communityImageInvalidType })); return;
    }
    setErrors((e) => ({ ...e, images: "" }));
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1600, 0.82);
      const url = await communityUploadImage(dataUrl);
      setImages((prev) => [...prev, url]);
    } catch {
      setErrors((e) => ({ ...e, images: t.communityUploadFailed }));
    }
    setUploading(false);
  };
  const handleRemoveImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    const next = {};
    if (!petId) next.pet = t.communityComposeErrPet;
    if (!title.trim()) next.title = t.communityComposeErrTitle;
    if (!content.trim()) next.content = t.communityComposeErrContent;
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true);
    try {
      const pet = pets.find((p) => p.id === petId);
      if (isEdit) {
        await communityUpdatePost(initialPost.id, { category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic });
      } else {
        await communityCreatePost({ pet: petSnapshot(pet), category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic });
      }
      onSaved();
    } catch {
      setErrors({ submit: t.communityUploadFailed });
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="bg-card">
        <label className="bg-label">{t.communityComposeTitlePet}</label>
        {!isEdit && <PetPicker pets={pets} activeId={petId} onSelect={setPetId} />}
        {isEdit && <CmPetLine pet={initialPost.pet} lang={lang} />}
        {errors.pet && <div className="field-error">{errors.pet}</div>}

        <label className="bg-label" style={{ marginTop: 14 }}>{t.communityComposeTitleCategory}</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMMUNITY_CATEGORY_KEYS.map((k) => (
            <button key={k} type="button" className={`bg-chip ${category === k ? "active" : ""}`} onClick={() => setCategory(k)}>
              {t.communityCategoryLabels[k]}
            </button>
          ))}
        </div>

        <label className="bg-label" style={{ marginTop: 14 }}>{t.communityComposeVisibility}</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className={`bg-chip ${isPublic ? "active" : ""}`} onClick={() => setIsPublic(true)}>
            🌐 {t.communityVisibilityPublic}
          </button>
          <button type="button" className={`bg-chip ${!isPublic ? "active" : ""}`} onClick={() => setIsPublic(false)}>
            🔒 {t.communityVisibilityPrivate}
          </button>
        </div>
        <div style={{ marginTop: 7, fontSize: 12, color: "#8a8278", lineHeight: 1.55 }}>
          {isPublic ? t.communityComposeVisibilityPublicHelp : t.communityComposeVisibilityPrivateHelp}
        </div>

        <label className="bg-label" style={{ marginTop: 14 }}>{t.communityComposeTitleTitle}</label>
        <input type="text" className={`bg-input ${errors.title ? "invalid" : ""}`} value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder={t.communityComposeTitlePlaceholder} maxLength={80} />
        {errors.title && <div className="field-error">{errors.title}</div>}

        <label className="bg-label" style={{ marginTop: 14 }}>{t.communityComposeTitleContent}</label>
        <textarea className={`bg-input ${errors.content ? "invalid" : ""}`} rows={6} value={content}
          onChange={(e) => setContent(e.target.value)} placeholder={t.communityComposeContentPlaceholder}
          style={{ resize: "vertical", fontFamily: "inherit" }} maxLength={2000} />
        {errors.content && <div className="field-error">{errors.content}</div>}

        <label className="bg-label" style={{ marginTop: 14 }}>{t.communityComposePhotos(images.length)}</label>
        <ImagePickerGrid images={images} onAdd={handleAddImage} onRemove={handleRemoveImage} uploading={uploading} />
        {errors.images && <div className="field-error">{errors.images}</div>}
        {errors.submit && <div className="field-error">{errors.submit}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <button type="button" className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{t.cancel}</button>
          <button type="button" className="bg-btn" style={{ flex: 2 }} disabled={submitting || uploading} onClick={submit}>
            {uploading ? t.communityComposeUploading : isEdit ? t.communityComposeSubmitEdit : t.communityComposeSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  if (!images || images.length === 0) return null;
  const go = (d) => setIdx((i) => Math.max(0, Math.min(images.length - 1, i + d)));
  return (
    <div className="cm-carousel"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 40) go(-1); else if (dx < -40) go(1);
        touchX.current = null;
      }}>
      <img src={images[idx]} alt="" />
      {images.length > 1 && (
        <>
          {idx > 0 && <button type="button" className="cm-carousel-btn" style={{ left: 8 }} onClick={() => go(-1)}>‹</button>}
          {idx < images.length - 1 && <button type="button" className="cm-carousel-btn" style={{ right: 8 }} onClick={() => go(1)}>›</button>}
          <div className="cm-carousel-dots">
            {images.map((_, i) => <span key={i} className={`cm-carousel-dot ${i === idx ? "active" : ""}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ReportModal({ open, onClose, targetType, targetId }) {
  const t = useT();
  const [reason, setReason] = useState(null);
  const [detail, setDetail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | already

  const submit = async () => {
    if (!reason) return;
    setState("sending");
    try {
      const res = await communityReport({ targetType, targetId, reason, detail: detail.trim() || undefined });
      setState(res.alreadyReported ? "already" : "done");
    } catch {
      setState("idle");
    }
  };
  const handleClose = () => { setReason(null); setDetail(""); setState("idle"); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} width={400}>
      {state === "done" || state === "already" ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🚨</div>
          <p style={{ fontSize: 14 }}>{state === "already" ? t.communityReportAlready : t.communityReportDone}</p>
          <button className="bg-btn" style={{ width: "100%", marginTop: 18 }} onClick={handleClose}>{t.guideConfirm}</button>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>{t.communityReportTitle}</h3>
          <label className="bg-label">{t.communityReportReasonLabel}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {REPORT_REASON_KEYS.map((k) => (
              <button key={k} type="button" className={`bg-chip ${reason === k ? "active" : ""}`}
                style={{ textAlign: "left", justifyContent: "flex-start" }} onClick={() => setReason(k)}>
                {t.communityReportReasons[k]}
              </button>
            ))}
          </div>
          <textarea className="bg-input" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder={t.communityReportDetailPlaceholder} style={{ resize: "vertical", fontFamily: "inherit" }} />
          <button className="bg-btn" style={{ width: "100%", marginTop: 16 }} disabled={!reason || state === "sending"} onClick={submit}>
            {t.communityReportSubmit}
          </button>
        </>
      )}
    </Modal>
  );
}

function CommentItem({ comment, lang, currentUserPetOwner, onDelete, onReport }) {
  const t = useT();
  return (
    <div className="cm-comment-row">
      <img src={comment.pet.photo || ""} alt="" className="cm-comment-avatar"
        style={{ display: comment.pet.photo ? "block" : "none" }} />
      {!comment.pet.photo && <span className="cm-pet-avatar-fallback" style={{ width: 26, height: 26, fontSize: 13 }}>🐾</span>}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 12 }}>{comment.pet.name}</span>
          <span className="bg-sub" style={{ fontSize: 11 }}>{timeAgoLabel(comment.createdAt, lang)}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{comment.content}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {comment.isOwner ? (
            <button type="button" onClick={onDelete}
              style={{ fontSize: 11, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}>
              {t.communityDeleteBtn}
            </button>
          ) : (
            <button type="button" onClick={onReport}
              style={{ fontSize: 11, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}>
              {t.communityReportBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PostDetail({ postId, pets, account, onBack, onDeleted, onEdit }) {
  const t = useT();
  const lang = useLang();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentPetId, setCommentPetId] = useState(pets[0] && pets[0].id);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null); // { type, id } | null
  const [liking, setLiking] = useState(false);
  const [changingVisibility, setChangingVisibility] = useState(false);

  const load = async () => {
    try {
      const p = await communityGetPost(postId);
      setPost(p);
      const c = await communityListComments(postId);
      setComments(c.comments);
    } catch {
      setPost(null);
    }
  };
  useEffect(() => { load(); }, [postId]);

  if (!post) return <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "40px 0" }} className="bg-sub">{t.communityLoading}</div>;

  const toggleLikeNow = async () => {
    if (liking) return;
    setLiking(true);
    setPost((prev) => ({ ...prev, likedByMe: !prev.likedByMe, likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1) }));
    try {
      await communityToggleLike(postId);
    } catch {
      load();
    }
    setLiking(false);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentPetId) return;
    const pet = pets.find((p) => p.id === commentPetId);
    try {
      const c = await communityAddComment(postId, { pet: petSnapshot(pet), content: commentText.trim() });
      setComments((prev) => [...prev, c]);
      setCommentText("");
      setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
    } catch {}
  };

  const confirmDeleteComment = async () => {
    if (!commentDeleteTarget) return;
    await communityDeleteComment(commentDeleteTarget).catch(() => {});
    setComments((prev) => prev.filter((c) => c.id !== commentDeleteTarget));
    setPost((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
    setCommentDeleteTarget(null);
  };

  const confirmDeletePost = async () => {
    await communityDeletePost(postId).catch(() => {});
    setDeleteConfirmOpen(false);
    onDeleted();
  };

  const toggleVisibility = async () => {
    if (changingVisibility || !post.isOwner) return;
    setChangingVisibility(true);
    try {
      const updated = await communitySetPostVisibility(postId, !post.isPublic);
      setPost(updated);
    } catch {}
    setChangingVisibility(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 60px" }}>
      <button type="button" onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 14, fontSize: 13, fontWeight: 700, color: "var(--sub)" }}>
        ← {t.communityBack}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <CmPetLine pet={post.pet} lang={lang} right={<span className="bg-sub" style={{ fontSize: 11 }}>{timeAgoLabel(post.createdAt, lang)}</span>} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="cm-cat-chip" style={{ marginBottom: 0 }}>{t.communityCategoryLabels[post.category]}</span>
        {post.isOwner && (
          <span className="cm-cat-chip" style={{ marginBottom: 0, background: post.isPublic ? "#EAF6E4" : "#F1F1F1", color: post.isPublic ? "var(--primary)" : "var(--sub)" }}>
            {post.isPublic ? `🌐 ${t.communityVisibilityPublic}` : `🔒 ${t.communityVisibilityPrivate}`}
          </span>
        )}
      </div>
      {post.category === "health" && (
        <div className="bg-surface-card" style={{ fontSize: 11, color: "var(--sub)", marginBottom: 12 }}>{t.communityHealthNotice}</div>
      )}
      <h1 style={{ fontSize: 19, marginBottom: 10 }}>{post.title}</h1>
      {post.images.length > 0 && <div style={{ marginBottom: 14 }}><PhotoCarousel images={post.images} /></div>}
      <p style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line" }}>{post.content}</p>

      <div className="cm-action-row">
        <button type="button" className={`cm-action-btn ${post.likedByMe ? "liked" : ""}`} onClick={toggleLikeNow}>
          {post.likedByMe ? "❤️" : "🤍"} {post.likeCount}
        </button>
        <span className="cm-action-btn" style={{ cursor: "default" }}>💬 {post.commentCount}</span>
        {!post.isOwner && (
          <button type="button" className="cm-action-btn" onClick={() => setReportTarget({ type: "post", id: post.id })}>
            🚨 {t.communityReportBtn}
          </button>
        )}
      </div>

      {post.isOwner && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 20 }}>
          <button type="button" className="bg-btn bg-btn-ghost" onClick={onEdit}>{t.communityEditBtn}</button>
          <button type="button" className="bg-btn bg-btn-ghost" disabled={changingVisibility} onClick={toggleVisibility}>
            {post.isPublic ? t.communityMakePrivate : t.communityMakePublic}
          </button>
          <button type="button" className="bg-btn bg-btn-ghost" style={{ color: "#C0392B" }} onClick={() => setDeleteConfirmOpen(true)}>
            {t.communityDeleteBtn}
          </button>
        </div>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>{t.communityCommentsTitle} ({post.commentCount})</h3>
      {comments.length === 0 ? (
        <p className="bg-sub" style={{ fontSize: 13 }}>{t.communityCommentEmpty}</p>
      ) : (
        comments.map((c) => (
          <CommentItem key={c.id} comment={c} lang={lang}
            onDelete={() => setCommentDeleteTarget(c.id)}
            onReport={() => setReportTarget({ type: "comment", id: c.id })} />
        ))
      )}

      {pets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <PetPicker pets={pets} activeId={commentPetId} onSelect={setCommentPetId} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" className="bg-input" style={{ flex: 1 }} value={commentText}
              onChange={(e) => setCommentText(e.target.value)} placeholder={t.communityCommentPlaceholder}
              onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }} />
            <button type="button" className="bg-btn" style={{ flexShrink: 0 }} onClick={submitComment}>{t.communityCommentSubmit}</button>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteConfirmOpen} title={t.communityDeleteConfirmTitle} message={t.communityDeleteConfirmBody}
        confirmLabel={t.communityDeleteBtn} onConfirm={confirmDeletePost} onCancel={() => setDeleteConfirmOpen(false)} />
      <ConfirmModal open={!!commentDeleteTarget} title={t.communityCommentDeleteConfirmTitle} message=""
        confirmLabel={t.communityDeleteBtn} onConfirm={confirmDeleteComment} onCancel={() => setCommentDeleteTarget(null)} />
      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)}
        targetType={reportTarget?.type} targetId={reportTarget?.id} />
    </div>
  );
}

function CommunityFeed({ pets, lang, onOpenPost, onWrite }) {
  const t = useT();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadPage = async (nextPage, replace) => {
    setLoading(true);
    try {
      const res = await communityListPosts({ category, sort, search, page: nextPage });
      setPosts((prev) => (replace ? res.posts : [...prev, ...res.posts]));
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadPage(1, true); }, [category, sort, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input type="text" className="cm-search-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t.communitySearchPlaceholder} />
        <button type="button" className="bg-btn" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }} onClick={onWrite}>
          <PlusIcon style={{ width: 14, height: 14 }} /> {t.communityWriteBtn}
        </button>
      </div>

      <div className="tab-bar" style={{ marginBottom: 10 }}>
        <button type="button" className={`tab-pill ${category === "all" ? "active" : ""}`} onClick={() => setCategory("all")}>
          {t.communityCategoryAll}
        </button>
        {COMMUNITY_CATEGORY_KEYS.map((k) => (
          <button key={k} type="button" className={`tab-pill ${category === k ? "active" : ""}`} onClick={() => setCategory(k)}>
            {t.communityCategoryLabels[k]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" className={`bg-chip ${sort === "latest" ? "active" : ""}`} onClick={() => setSort("latest")}>
          {t.communitySortLatest}
        </button>
        <button type="button" className={`bg-chip ${sort === "popular" ? "active" : ""}`} onClick={() => setSort("popular")}>
          {t.communitySortPopular}
        </button>
      </div>

      {posts.length === 0 && !loading ? (
        <p className="bg-sub" style={{ textAlign: "center", padding: "40px 0" }}>{t.communityEmptyFeed}</p>
      ) : (
        <div className="cm-feed-grid">
          {posts.map((p) => <PostCard key={p.id} post={p} lang={lang} onOpen={() => onOpenPost(p.id)} />)}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className="bg-btn bg-btn-ghost" disabled={loading} onClick={() => loadPage(page + 1, false)}>
            {loading ? t.communityLoading : t.communityLoadMore}
          </button>
        </div>
      )}
    </div>
  );
}

function MyActivityPage({ lang, onOpenPost, embedded = false }) {
  const t = useT();
  const [tab, setTab] = useState("posts"); // posts | comments | likes
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (p, replace) => {
    setLoading(true);
    try {
      const res = await communityMyActivity(tab, p);
      const list = tab === "comments" ? res.comments : res.posts;
      setItems((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(res.hasMore);
      setPage(p);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(1, true); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const emptyText = tab === "posts" ? t.communityMyEmptyPosts : tab === "comments" ? t.communityMyEmptyComments : t.communityMyEmptyLikes;

  return (
    <div style={embedded ? { maxWidth: 640, margin: "0 auto" } : { maxWidth: 640, margin: "0 auto", padding: "0 20px 60px" }}>
      {!embedded && <h1 style={{ fontSize: 20, marginBottom: 16 }}>{t.communityMyActivityNav}</h1>}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button type="button" className={`bg-chip ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>{t.communityMyPostsTab}</button>
        <button type="button" className={`bg-chip ${tab === "comments" ? "active" : ""}`} onClick={() => setTab("comments")}>{t.communityMyCommentsTab}</button>
        <button type="button" className={`bg-chip ${tab === "likes" ? "active" : ""}`} onClick={() => setTab("likes")}>{t.communityMyLikesTab}</button>
      </div>

      {items.length === 0 && !loading ? (
        <p className="bg-sub" style={{ textAlign: "center", padding: "30px 0" }}>{emptyText}</p>
      ) : tab === "comments" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((c) => (
            <div key={c.id} className="bg-surface-card" style={{ cursor: "pointer" }} onClick={() => onOpenPost(c.postId)}>
              <div className="bg-sub" style={{ fontSize: 11, marginBottom: 4 }}>{c.postTitle}</div>
              <div style={{ fontSize: 13 }}>{c.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cm-feed-grid">
          {items.map((p) => <PostCard key={p.id} post={p} lang={lang} onOpen={() => onOpenPost(p.id)} />)}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className="bg-btn bg-btn-ghost" disabled={loading} onClick={() => load(page + 1, false)}>
            {loading ? t.communityLoading : t.communityLoadMore}
          </button>
        </div>
      )}
    </div>
  );
}

function MyPage({ account, allPets, lang, onOpenAccount, onGoPets, onOpenPost }) {
  const t = useT();
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 70px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 18 }}>{t.myPageTitle}</h1>
      <div className="bg-card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {account?.profileImage ? (
            <img src={account.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", objectPosition: "center" }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserIcon style={{ width: 24, height: 24, color: "var(--primary)" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700 }}>{t.myPageAccountTitle}</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{account?.name || "PetGrow"}</div>
            <div className="bg-sub" style={{ fontSize: 11, marginTop: 2 }}>{t.accountKakaoTag}</div>
          </div>
          <button type="button" className="bg-btn bg-btn-ghost" style={{ fontSize: 12 }} onClick={onOpenAccount}>{t.myPageSettingsBtn}</button>
        </div>
      </div>

      <div className="bg-card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{t.myPagePetsTitle}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>{t.myPagePetsCount(allPets.length)}</div>
          </div>
          <button type="button" className="bg-btn bg-btn-ghost" onClick={onGoPets}>{t.myPageManagePetsBtn}</button>
        </div>
        {allPets.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 14, paddingBottom: 2 }}>
            {allPets.slice(0, 10).map((pet) => (
              <div key={pet.id} style={{ minWidth: 110, background: "var(--surface)", borderRadius: 16, padding: 10 }}>
                <CmPetAvatar pet={petSnapshot(pet)} size={34} />
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>{pet.profile.name}</div>
                <div className="bg-sub" style={{ fontSize: 10, marginTop: 2 }}>{petAgeLabel(pet.profile.birthDate, lang)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card">
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t.myPageActivityTitle}</div>
        <MyActivityPage lang={lang} onOpenPost={onOpenPost} embedded />
      </div>
    </div>
  );
}

// allPets: 강아지+고양이 통합 목록, onGoRegister: 등록된 아이가 없을 때 '우리 아이' 등록으로 보내는 콜백
function CommunityPage({ allPets, account, onGoRegister }) {
  const t = useT();
  const lang = useLang();
  const [sub, setSub] = useState("feed"); // feed | detail | compose | edit | my
  const [activePostId, setActivePostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const openPost = (id) => { setActivePostId(id); setSub("detail"); };
  const backToFeed = () => { setSub("feed"); setActivePostId(null); };

  if (sub === "compose" || sub === "edit") {
    if (sub === "compose" && allPets.length === 0) {
      return (
        <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }} className="bg-card">
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{t.communityNeedPetTitle}</p>
          <p className="bg-sub" style={{ fontSize: 13, marginBottom: 18 }}>{t.communityNeedPetBody}</p>
          <button className="bg-btn" style={{ width: "100%" }} onClick={onGoRegister}>{t.sajuGoRegisterBtn}</button>
        </div>
      );
    }
    return (
      <PostComposer pets={allPets} initialPost={sub === "edit" ? editingPost : null}
        onCancel={() => setSub(sub === "edit" ? "detail" : "feed")}
        onSaved={() => setSub("detail")} />
    );
  }

  if (sub === "detail" && activePostId) {
    return (
      <PostDetail postId={activePostId} pets={allPets} account={account}
        onBack={backToFeed} onDeleted={backToFeed}
        onEdit={async () => {
          const p = await communityGetPost(activePostId);
          setEditingPost(p);
          setSub("edit");
        }} />
    );
  }

  if (sub === "my") {
    return (
      <div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
          <button type="button" onClick={backToFeed}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 14, fontSize: 13, fontWeight: 700, color: "var(--sub)" }}>
            ← {t.communityBack}
          </button>
        </div>
        <MyActivityPage lang={lang} onOpenPost={openPost} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setSub("my")}
          style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6 }}>
          {t.communityMyActivityNav}
        </button>
      </div>
      <CommunityFeed pets={allPets} lang={lang} onOpenPost={openPost} onWrite={() => setSub("compose")} />
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
  const [welcomeBackOpen, setWelcomeBackOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} | null

  // 'about' | 'pets' | 'saju' | 'petbti' | 'tips' | 'guide' | 'privacy' | 'terms'
  const [view, setView] = useState("home");
  const GATED_VIEWS = ["pets", "saju", "petbti", "tips", "guide", "community", "content", "my"];

  // ---- 계정(카카오 로그인) ----
  const [account, setAccount] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [hamOpen, setHamOpen] = useState(false);
  const [contentSubTab, setContentSubTab] = useState("all");
  const isNativeApp = Capacitor.isNativePlatform();
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [pendingMigration, setPendingMigration] = useState(null); // { dogs, cats } | null
  const [migrating, setMigrating] = useState(false);
  const [loginToast, setLoginToast] = useState(null); // "success" | "error" | null
  const [updateConfig, setUpdateConfig] = useState(null);
  const [updateOpen, setUpdateOpen] = useState(false);

  // Pet사주 / 오늘의운세 / 보호자궁합 / PetBTI 에서 강아지·고양이 구분 없이 아이를 선택하기 위한 상태
  const [featurePetId, setFeaturePetId] = useState(null);

  // Play 스토어 업데이트가 실제 공개된 뒤 public/app-update.json의 enabled를 true로 바꾸면
  // 구버전 앱에서 업데이트 팝업이 표시돼요. 웹 브라우저에서는 표시되지 않습니다.
  useEffect(() => {
    if (!isNativeApp) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/app-update.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const cfg = await res.json();
        if (!cfg?.enabled || cancelled) return;

        const params = new URLSearchParams(window.location.search);
        const currentVersion = params.get("app_version");
        const needsUpdate = currentVersion
          ? compareVersions(currentVersion, cfg.latestVersion) < 0
          : cfg.legacyNeedsUpdate !== false;

        if (needsUpdate && !cancelled) {
          setUpdateConfig(cfg);
          setUpdateOpen(true);
        }
      } catch (e) {
        console.warn("App update check skipped:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [isNativeApp]);

  useEffect(() => {
    (async () => {
      // 카카오 로그인 콜백에서 돌아온 경우(/?login=success|error) 안내 후 URL 정리
      const params = new URLSearchParams(window.location.search);
      const loginResult = params.get("login");
      if (loginResult) {
        setLoginToast(loginResult === "success" ? "success" : "error");
        params.delete("login");
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "");
        window.history.replaceState({}, "", cleanUrl);
        setTimeout(() => setLoginToast(null), loginResult === "success" ? 2400 : 3600);
      }

      const me = await fetchMe();
      setAccount(me);
      setAuthChecked(true);
      // 로그인된 사용자는 새로 접속하거나 새로고침해도 홈에서 시작해요.
      if (me) {
        setView("home");
      }

      const dogsKey = "bboggl:dogs";
      const catsKey = "bboggl:cats";
      const activesKey = "bboggl:activeIds";

      let dogs = await safeGet(dogsKey, me);
      let cats = await safeGet(catsKey, me);
      const actives = await safeGet(activesKey, me);

      if (!me) {
        // 로그인 전(게스트) 상태에서만 예전 버전 로컬 데이터를 함께 확인해요
        if (!dogs || dogs.length === 0) {
          const guestDogs = await safeGet("bboggl:dogs:guest", me);
          if (guestDogs && guestDogs.length > 0) { dogs = guestDogs; safeSet(dogsKey, dogs, me); }
        }
        if (!cats || cats.length === 0) {
          const guestCats = await safeGet("bboggl:cats:guest", me);
          if (guestCats && guestCats.length > 0) { cats = guestCats; safeSet(catsKey, cats, me); }
        }
        if (!dogs || dogs.length === 0) {
          const legacyProfile = await safeGet("bboggl:profile", me);
          if (legacyProfile) {
            const legacyRecords = (await safeGet("bboggl:records", me)) || [{
              id: "initial", date: new Date().toISOString().slice(0, 10), weightKg: legacyProfile.initialWeightKg,
            }];
            const legacyPhotos = (await safeGet("bboggl:photos", me)) || {};
            dogs = [{
              id: "dog-legacy",
              profile: { ...legacyProfile, species: "dog" },
              records: legacyRecords,
              photos: normalizePhotos(legacyPhotos, legacyProfile.birthDate),
            }];
            safeSet(dogsKey, dogs, me);
          }
        }
      }

      dogs = (dogs || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));
      cats = (cats || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));

      // 비로그인 상태에서는 과거 localStorage 데이터를 화면 상태에 올리지 않아요.
      // 데이터 자체는 삭제하지 않아, 이후 로그인 시 기존 데이터 이전 안내에 사용할 수 있어요.
      if (!me) {
        dogs = [];
        cats = [];
      }

      setPets({ dog: dogs, cat: cats });
      setActiveId({
        dog: (actives && actives.dog) || (dogs[0] && dogs[0].id) || null,
        cat: (actives && actives.cat) || (cats[0] && cats[0].id) || null,
      });

      // 로그인된 계정인데 클라우드에 등록된 아이가 하나도 없다면, 로그인 전 이 기기에 남아있던
      // 데이터가 있는지 확인해서 계정으로 이전할지 물어봐요 (중복 이전 방지를 위해 클라우드가 비어있을 때만)
      if (me && dogs.length === 0 && cats.length === 0) {
        try {
          const localDogsRaw = window.localStorage.getItem(dogsKey);
          const localCatsRaw = window.localStorage.getItem(catsKey);
          const localDogs = localDogsRaw ? JSON.parse(localDogsRaw) : [];
          const localCats = localCatsRaw ? JSON.parse(localCatsRaw) : [];
          if ((localDogs && localDogs.length > 0) || (localCats && localCats.length > 0)) {
            setPendingMigration({ dogs: localDogs || [], cats: localCats || [] });
          }
        } catch {}
      }

      if (dogs.length > 0 || cats.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const lastWelcome = await safeGet("bboggl:lastWelcomeDate", me);
        if (lastWelcome !== today) {
          setWelcomeBackOpen(true);
          safeSet("bboggl:lastWelcomeDate", today, me);
        }
      }
      setLoaded(true);
      if (Capacitor.isNativePlatform()) {
        SplashScreen.hide().catch(() => {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AdMob 하단 배너 광고 — 실제 안드로이드/iOS 앱에서만 동작해요 (웹사이트는 그냥 넘어가요)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await AdMob.initialize();
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: false,
        });
      } catch (err) {
        console.warn("AdMob banner failed to load", err);
      }
    })();
    return () => {
      AdMob.removeBanner().catch(() => {});
    };
  }, []);

  const [saveToast, setSaveToast] = useState(null); // "ok" | "error" | null

  const persistPets = async (next) => {
    setPets(next);
    const ok1 = await safeSet("bboggl:dogs", next.dog, account);
    const ok2 = await safeSet("bboggl:cats", next.cat, account);
    flashSaveToast(ok1 && ok2);
  };
  const persistActive = (next) => {
    setActiveId(next);
    safeSet("bboggl:activeIds", next, account);
  };
  const flashSaveToast = (ok) => {
    setSaveToast(ok ? "ok" : "error");
    setTimeout(() => setSaveToast(null), ok ? 1600 : 3200);
  };

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  };

  const goView = (v) => { setView(v); scrollToTop(); };

  const currentList = pets[species];
  const currentPet = currentList.find((p) => p.id === activeId[species]) || null;
  const allPets = [
    ...pets.dog.map((p) => ({ ...p, species: "dog" })),
    ...pets.cat.map((p) => ({ ...p, species: "cat" })),
  ];
  const featurePet = allPets.find((p) => p.id === featurePetId) || currentPet || allPets[0] || null;

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
      safeSet("bboggl:guideSeen", true, account);
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
  // PetBTI는 현재 활성 반려동물이 아닌 다른 아이를 테스트할 수도 있어서, 강아지·고양이 목록 전체에서 id로 찾아 업데이트해요
  const handleUpdatePetBti = (petId, petBti) => {
    const nextDogs = pets.dog.map((p) => (p.id === petId ? { ...p, petBti } : p));
    const nextCats = pets.cat.map((p) => (p.id === petId ? { ...p, petBti } : p));
    persistPets({ dog: nextDogs, cat: nextCats });
  };

  const handleAddRecord = (record) => updateCurrentPet((p) => ({ ...p, records: [...p.records, record] }));
  const handleDeleteRecord = (recordId) => updateCurrentPet((p) => ({
    ...p, records: p.records.filter((r) => r.id !== recordId),
  }));
  const handleAddPhoto = (date, dataUrl) => updateCurrentPet((p) => ({
    ...p, photos: [...p.photos, { id: `${Date.now()}`, date, dataUrl }],
  }));
  const handleEditPhoto = (photoId, dataUrl) => updateCurrentPet((p) => ({
    ...p, photos: p.photos.map((ph) => (ph.id === photoId ? { ...ph, dataUrl } : ph)),
  }));
  const handleDeletePhoto = (photoId) => updateCurrentPet((p) => ({
    ...p, photos: p.photos.filter((ph) => ph.id !== photoId),
  }));

  // ---- 로그인 / 로그아웃 / 회원탈퇴 ----
  const handleLogout = async () => {
    // 로그아웃 후 전체 페이지를 강제로 새로고침하면 PWA/캐시 환경에서
    // 빈 화면이 남을 수 있어요. 세션을 종료한 뒤 React 상태를 즉시
    // 비로그인 홈으로 전환해서 웹/모바일 웹 모두 안정적으로 복귀시켜요.
    await apiLogout();
    setAccountModalOpen(false);
    setAccount(null);
    setPendingMigration(null);
    setFeaturePetId(null);
    setMode("view");

    // 로그아웃 즉시 화면의 반려동물 상태를 비워 개인정보가 남아 보이지 않게 해요.
    // 기존 localStorage 데이터는 삭제하지 않고 보관해, 다음 로그인 때 이전 안내에 사용할 수 있어요.
    setPets({ dog: [], cat: [] });
    setActiveId({ dog: null, cat: null });

    setView("home");
    scrollToTop();

    // 주소창에 로그인 콜백 파라미터 등이 남아 있더라도 홈 URL로 정리해요.
    if (window.location.pathname !== "/" || window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  };
  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    const ok = await apiDeleteAccount();
    setDeletingAccount(false);
    if (!ok) return;

    // 회원탈퇴 API가 성공하면 서버 세션 쿠키도 함께 만료돼요.
    // 로그아웃과 마찬가지로 전체 페이지를 강제 새로고침하지 않고
    // React 상태를 바로 비로그인 홈으로 전환해 PWA/모바일 웹의 흰 화면을 방지해요.
    setAccountModalOpen(false);
    setAccount(null);
    setPendingMigration(null);
    setFeaturePetId(null);
    setMode("view");
    setPets({ dog: [], cat: [] });
    setActiveId({ dog: null, cat: null });

    // 과거 버전에서 브라우저에 남았을 수 있는 계정 관련 로컬 데이터도 정리해요.
    // 탈퇴 후 예전 반려동물 정보가 다시 보이는 일을 막습니다.
    try {
      [
        "bboggl:dogs", "bboggl:cats", "bboggl:activeIds",
        "bboggl:dogs:guest", "bboggl:cats:guest", "bboggl:activeIds:guest",
        "bboggl:photos", "bboggl:profile", "bboggl:records"
      ].forEach((key) => window.localStorage.removeItem(key));
    } catch {}

    setView("home");
    scrollToTop();
    window.history.replaceState({}, "", "/");
  };
  const handleConfirmMigration = async () => {
    if (!pendingMigration) return;
    setMigrating(true);
    const ok1 = await safeSet("bboggl:dogs", pendingMigration.dogs, account);
    const ok2 = await safeSet("bboggl:cats", pendingMigration.cats, account);
    if (ok1 && ok2) {
      const dogs = (pendingMigration.dogs || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));
      const cats = (pendingMigration.cats || []).map((p) => ({ ...p, photos: normalizePhotos(p.photos, p.profile.birthDate) }));
      setPets({ dog: dogs, cat: cats });
      setActiveId({ dog: dogs[0]?.id || null, cat: cats[0]?.id || null });
      // 서버 저장이 확인된 뒤에만 이 기기의 옛 로컬 데이터를 정리해요
      try {
        window.localStorage.removeItem("bboggl:dogs");
        window.localStorage.removeItem("bboggl:cats");
        window.localStorage.removeItem("bboggl:activeIds");
      } catch {}
      setPendingMigration(null);
    } else {
      flashSaveToast(false);
    }
    setMigrating(false);
  };

  if (!loaded || !authChecked) return <div className="bboggl-root" style={{ minHeight: 300 }} />;

  const breedGroups = species === "dog" ? DOG_BREED_GROUPS : CAT_BREED_GROUPS;
  const sizeOptions = species === "dog" ? DOG_SIZE_OPTIONS : CAT_SIZE_OPTIONS;
  const showOnboarding = mode === "onboarding" || mode === "edit" || (mode === "view" && !currentPet);

  // 로그인이 필요한 화면인데 로그인이 안 되어 있으면 로그인 화면을 보여줘요
  const needsLogin = GATED_VIEWS.includes(view) && !account;
  const effectiveView = needsLogin ? "login" : view;

  return (
    <div className="bboggl-root" style={{ minHeight: "100vh", paddingBottom: isNativeApp ? 74 : 0 }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px 0" }}>
        {!isNativeApp && (
          <>
            {/* PC: 한 줄 상단 메뉴 (900px 이상) */}
            <div className="desktop-nav" style={{ alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button type="button" onClick={() => goView("home")}
                  aria-label="홈으로 이동"
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                  <PetGrowLogo style={{ width: 24, height: 24 }} />
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
                    <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
                  </span>
                </button>
                <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button type="button" className={`desktop-nav-link ${view === "home" ? "active" : ""}`} onClick={() => goView("home")}>{t.hamNavHome}</button>
                  <button type="button" className={`desktop-nav-link ${view === "about" ? "active" : ""}`} onClick={() => goView("about")}>{t.aboutNav}</button>
                  <button type="button" className={`desktop-nav-link ${view === "pets" ? "active" : ""}`} onClick={() => goView("pets")}>{t.myPetsNav}</button>
                  <button type="button" className={`desktop-nav-link ${view === "community" ? "active" : ""}`} onClick={() => goView("community")}>{t.communityNav}</button>
                  <button type="button" className={`desktop-nav-link ${view === "saju" ? "active" : ""}`} onClick={() => goView("saju")}>{t.sajuNav}</button>
                  <button type="button" className={`desktop-nav-link ${view === "petbti" ? "active" : ""}`} onClick={() => goView("petbti")}>{t.petBtiNav}</button>
                  <button type="button" className={`desktop-nav-link ${view === "tips" ? "active" : ""}`} onClick={() => goView("tips")}>{t.tipsTitle}</button>
                  <button type="button" className={`desktop-nav-link ${view === "guide" ? "active" : ""}`} onClick={() => goView("guide")}>{t.infoGuideTitle}</button>
                  {account && <button type="button" className={`desktop-nav-link ${view === "my" ? "active" : ""}`} onClick={() => goView("my")}>{t.hamNavMy}</button>}
                </nav>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                <LangToggle lang={lang} onChange={setLang} />
                <AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
              </div>
            </div>

            {/* 모바일 웹: ☰ | 로고 | KO/EN | 로그인/프로필 (900px 미만) */}
            <div className="mobile-topbar" style={{ alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
              <button type="button" className="icon-btn" aria-label={t.hamMenuAria} onClick={() => setHamOpen(true)}>
                <HamburgerIcon style={{ width: 20, height: 20 }} />
              </button>
              <button type="button" onClick={() => goView("home")}
                aria-label="홈으로 이동"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <PetGrowLogo style={{ width: 21, height: 21 }} />
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
                  <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
                </span>
              </button>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <LangToggle lang={lang} onChange={setLang} />
                <AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
              </div>
            </div>
          </>
        )}

        {/* 앱(Capacitor 네이티브): 하단 5탭이 내비게이션을 담당하므로 상단은 로고 한 줄만 */}
        {isNativeApp && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button type="button" onClick={() => goView("home")} aria-label="홈으로 이동"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <PetGrowLogo style={{ width: 21, height: 21 }} />
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
                <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
              </span>
            </button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <LangToggle lang={lang} onChange={setLang} />
              <AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
            </div>
          </div>
        )}

        {effectiveView === "pets" && (
          <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}
            onChange={(s) => { setSpecies(s); setMode("view"); }} />
        )}
      </div>

      {effectiveView === "login" ? (
        <LoginScreen onGoTerms={() => goView("terms")} onGoPrivacy={() => goView("privacy")} />
      ) : effectiveView === "privacy" ? (
        <PrivacyContent />
      ) : effectiveView === "terms" ? (
        <TermsContent />
      ) : effectiveView === "about" ? (
        <AboutPage onStart={() => goView("pets")} onNavigate={(v) => goView(v)} />
      ) : effectiveView === "home" ? (
        <HomePage account={account} pets={allPets} lang={lang}
          onGoPets={() => goView("pets")} onGoView={(v) => goView(v)} />
      ) : effectiveView === "content" ? (
        <PetContentPage subTab={contentSubTab} onSubTabChange={setContentSubTab}
          allPets={allPets} featurePet={featurePet} onSelectFeaturePet={setFeaturePetId}
          onUpdatePetBti={handleUpdatePetBti} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
      ) : effectiveView === "guide" ? (
        <InfoGuidePage />
      ) : effectiveView === "community" ? (
        <CommunityPage allPets={allPets} account={account} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
      ) : effectiveView === "my" ? (
        <MyPage account={account} allPets={allPets} lang={lang}
          onOpenAccount={() => setAccountModalOpen(true)} onGoPets={() => goView("pets")}
          onOpenPost={() => goView("community")} />
      ) : effectiveView === "tips" ? (
        <TipsPage />
      ) : effectiveView === "saju" ? (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={setFeaturePetId} />
          <SajuPage pet={featurePet} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
        </div>
      ) : effectiveView === "petbti" ? (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={setFeaturePetId} />
          <PetBtiPage pet={featurePet} onUpdatePetBti={handleUpdatePetBti} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
        </div>
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
            onDeleteRecord={handleDeleteRecord}
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

      {effectiveView !== "login" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" }}>
          <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 10 }}>
            help.petgrow@gmail.com
          </div>
          <div className="bg-sub" style={{ fontSize: 11, textAlign: "center", marginTop: 2 }}>
            Copyright ⓒ PetGrow. All rights reserved.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
            <button type="button" onClick={() => goView("terms")}
              style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {t.termsFooterLink}
            </button>
            <button type="button" onClick={() => goView("privacy")}
              style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {t.privacyFooterLink}
            </button>
            <a href="mailto:help.petgrow@gmail.com" style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
              {t.contactBtn}
            </a>
          </div>
        </div>
      )}

      {isNativeApp && (
        <AppBottomNav
          active={view === "home" ? "home" : view === "pets" ? "pets" : view === "content" ? "content" : view === "community" ? "community" : view === "my" ? "my" : ""}
          onNavigate={(key) => goView(key)}
        />
      )}
      <HamburgerMenu open={hamOpen} onClose={() => setHamOpen(false)} view={view} onNavigate={goView}
        account={account} onOpenAccount={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ConfirmModal
        open={!!deleteTarget}
        title={t.confirmDeleteTitle}
        message={deleteTarget ? t.confirmDeleteMsg(deleteTarget.name) : ""}
        confirmLabel={t.confirmDeleteBtn}
        onConfirm={confirmDeletePet}
        onCancel={() => setDeleteTarget(null)}
      />
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        account={account}
        onLogout={handleLogout}
        onRequestDelete={() => { setAccountModalOpen(false); setDeleteAccountConfirmOpen(true); }}
      />
      <ConfirmModal
        open={deleteAccountConfirmOpen}
        title={t.deleteAccountConfirmTitle}
        message={t.deleteAccountConfirmBody}
        confirmLabel={deletingAccount ? t.migrationSaving : t.accountDeleteBtn}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteAccountConfirmOpen(false)}
      />
      <MigrationModal
        open={!!pendingMigration}
        loading={migrating}
        onSkip={() => setPendingMigration(null)}
        onConfirm={handleConfirmMigration}
      />
      {saveToast && (
        <div className={`save-toast ${saveToast === "error" ? "error" : ""}`}>
          {saveToast === "ok" ? (
            <><CheckSquareIcon style={{ width: 16, height: 16 }} /> {t.saveToastOk}</>
          ) : (
            <>⚠️ {t.saveToastError}</>
          )}
        </div>
      )}
      {loginToast && (
        <div className={`save-toast ${loginToast === "error" ? "error" : ""}`}>
          {loginToast === "success" ? (
            <><CheckSquareIcon style={{ width: 16, height: 16 }} /> {t.loginToastSuccess}</>
          ) : (
            <>⚠️ {t.loginToastError}</>
          )}
        </div>
      )}
      <UpdateModal
        open={updateOpen}
        config={updateConfig}
        onLater={() => setUpdateOpen(false)}
      />
      <AlertModal
        open={welcomeBackOpen}
        message={t.welcomeBackMsg((pets.dog[0] || pets.cat[0] || {}).profile?.name || "")}
        onClose={() => setWelcomeBackOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("ko");
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPrivacyPage = path === "/privacy" || path === "/privacy/";
  const isTermsPage = path === "/terms" || path === "/terms/";
  const isDeleteAccountPage = path === "/delete-account" || path === "/delete-account/";
  return (
    <LangContext.Provider value={lang}>
      {isPrivacyPage ? <PrivacyPage />
        : isTermsPage ? <TermsPage />
        : isDeleteAccountPage ? <DeleteAccountPage />
        : <AppInner lang={lang} setLang={setLang} />}
    </LangContext.Provider>
  );
}
