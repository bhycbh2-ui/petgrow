Y��x-���jם��i��+��j[h��ܢ���m|�η��zo+^����םimport HomeInfoMusicSections from "./HomeInfoMusicSections.jsx";
import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";
import * as LeafletLib from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Label,
} from "recharts";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";
import { SplashScreen } from "@capacitor/splash-screen";
import { DailyFortunePanel, PetTarotPanel, TodayPetHomeCard, PetDailyHistory, PET_DAILY_CSS } from "./PetDailyWidgets.jsx";

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
    hamNavMy: "회원정보",
    hamNavSettings: "정보 수정",
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
    tipsTitle: "Pet정보",
    nearbyNav: "내 주변 Pet",
    nearbyTitle: "내 주변 Pet",
    nearbySubtitle: "검색한 주소 주변의 동물병원·동물약국·펫샵·미용·호텔을 찾아보고, 내 위치에서의 거리도 함께 확인해보세요.",
    nearbyLocateBtn: "내 위치 표시",
    nearbySearchPlaceholder: "지역명으로 검색 (예: 강동구 천호동)",
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
    tipCategoryLabels: { all: "전체보기", dog: "강아지", cat: "고양이", health: "건강", life: "생활", food: "식단·영양", training: "훈련", safety: "안전", grooming: "미용·위생" },
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
    infoGuideIntro: "PetGrow의 주요 메뉴와 기능을 실제 화면 흐름에 맞춰 한곳에 정리했어요.",
    infoGuideSections: [
      { title: "홈 · 앱 대시보드", body: "홈에서는 우리 아이, Pet음악, 내 주변 Pet, Pet톡, PetBTI 같은 자주 쓰는 기능으로 빠르게 이동할 수 있어요. 웹·모바일·앱 화면 크기에 맞춰 메뉴 구성이 자동으로 정리돼요." },
      { title: "카카오 간편로그인", body: "PetGrow는 카카오 계정으로 로그인해요. 별도 비밀번호를 만들지 않고 '카카오로 시작하기'로 이용할 수 있으며, 로그인한 계정 기준으로 저장 기능과 내 활동이 연결돼요." },
      { title: "우리 아이 · 성장 기록", body: "강아지와 고양이를 여러 마리 등록하고 아이별 프로필, 현재 체중, 성장 기록, 성장 그래프와 성장앨범을 관리할 수 있어요. 다른 기기에서도 같은 계정으로 로그인하면 저장된 정보를 이어서 볼 수 있어요." },
      { title: "PetBTI", body: "강아지와 고양이 각각 20개의 구체적인 행동 질문에 답하면 우리 아이의 성향을 16가지 유형으로 재미있게 확인할 수 있어요. 완료한 결과는 저장하고 다시 검사할 수도 있어요." },
      { title: "Pet사주", body: "등록한 우리 아이 정보를 바탕으로 기본 Pet사주, 오늘의 펫운세, 보호자 궁합을 재미로 즐길 수 있어요. Pet타로는 메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석하며, 각 주제별로 반려동물 1마리당 하루 1회만 뽑을 수 있어요. 실제 성격이나 미래를 판단하는 자료는 아니에요." },
      { title: "Pet정보", body: "강아지·고양이·건강·생활·식단·영양·훈련·안전·미용·위생 등 카테고리별 반려생활 정보를 확인할 수 있어요. 목록은 페이지 단위로 나뉘고 검색과 즐겨찾기를 이용할 수 있으며, 정보는 지속적으로 추가·점검돼요." },
      { title: "Pet음악", body: "강아지·고양이 음악을 재생하고 반복재생할 수 있어요. 인기 TOP5와 내가 좋아요 누른 음악을 따로 확인할 수 있고, 좋아요·댓글을 이용할 수 있어요. 본인 댓글은 수정·삭제할 수 있고 다른 이용자의 댓글은 신고할 수 있어요." },
      { title: "내 주변 Pet", body: "주소를 직접 입력해 검색하거나, 위치 권한을 허용해 현재 위치 주변의 동물병원·동물약국·펫샵·용품점·미용실·유치원·호텔 등을 찾을 수 있어요. 현재 위치는 이용자가 현재 위치 검색 또는 지도 표시를 사용할 때 주변 검색·거리 계산·지도 표시에 일시적으로 사용하며 계정에 저장하지 않아요. 로그인 회원은 별점·후기·좋아요를 남길 수 있고 본인 후기는 수정·삭제, 다른 후기는 신고할 수 있어요." },
      { title: "Pet톡", body: "일상·자랑·질문·건강·정보공유·산책·훈련·용품추천·자유수다 카테고리로 반려생활 이야기를 나누는 커뮤니티예요. 게시글과 댓글에 좋아요를 남길 수 있고, 본인이 작성한 글·댓글은 수정·삭제, 다른 이용자의 글·댓글은 신고할 수 있어요." },
      { title: "회원정보 · 내 활동", body: "닉네임과 계정 정보를 관리하고, 내가 작성한 Pet톡 활동과 내가 좋아요 누른 Pet음악 등 계정 기준 활동을 한곳에서 확인할 수 있어요." },
      { title: "고객지원", body: "공지사항, 공개 피드백, 내 문의, 문의하기를 이용할 수 있어요. 문의 공개 체크를 해제하면 운영진만 볼 수 있어요." },
      { title: "관리자센터", body: "관리자 권한이 있는 계정에만 표시돼요. 메뉴 이용 통계, 웹·모바일 웹·PWA·앱 접속 통계, 신고 관리, Pet음악 관리, 일일·주간·월간 보고서 등 운영 기능을 확인할 수 있어요." },
      { title: "로그아웃 · 회원탈퇴", body: "로그아웃해도 서버에 저장된 계정 정보는 유지돼요. 회원탈퇴를 진행하면 관계 법령에 따라 별도 보관해야 하는 정보를 제외하고 계정에 연결된 반려동물 정보, 저장 결과, 작성 콘텐츠 등 삭제 대상 데이터가 처리되며 복구할 수 없어요." },
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
    deleteAccountConfirmBody: "탈퇴하면 PetGrow 계정, 반려동물 정보·프로필 사진, 성장 기록, PetBTI 결과, Pet톡 게시글·댓글·좋아요 및 첨부 사진 등 계정에 연결된 데이터가 삭제되며 복구할 수 없습니다. 정말 회원탈퇴를 진행하시겠어요?",
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
    submitEdit: "저장하기",
    onboardingConfirmEditTitle: "저장하시겠습니까?",
    onboardingConfirmAddTitle: "이 정보로 등록하시겠습니까?",
    onboardingConfirmMessage: (name) => `수정한 ${name}의 정보를 저장합니다. 계속할까요?`,
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
    tabDog: (n) => `강아지 정보${n > 0 ? ` (${n})` : ""}`,
    tabCat: (n) => `고양이 정보${n > 0 ? ` (${n})` : ""}`,
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
    accountCloseBtn: "닫기",
    accountSettingsBtn: "계정 설정",
    accountSettingsTitle: "계정 설정",
    accountKakaoTag: "카카오 계정으로 로그인됨",
    accountCodeLabel: "카카오 계정 구분번호",
    accountNicknameLabel: "Pet톡 닉네임",
    accountNicknameHelp: "2~8자 · Pet톡 게시글과 댓글에 표시돼요.",
    accountNicknameSave: "저장하기",
    accountNicknameSaved: "닉네임이 변경됐어요.",
    accountNicknameError: "닉네임은 2~8자로 입력해주세요.",
    accountFreshLoginHelp: "로그아웃 후 다시 로그인하면 저장된 카카오 계정 중 원하는 계정을 선택할 수 있어요.",
    loginToastSuccess: "로그인됐어요",
    loginToastError: "로그인에 실패했어요. 다시 시도해주세요.",
    communityNav: "Pet톡",
    communityCategoryAll: "전체",
    communityCategoryLabels: { daily: "일상", brag: "자랑", question: "질문", health: "건강·식단", info: "정보공유", walk: "산책", training: "훈련·행동", shopping: "용품추천", free: "자유수다" },
    communitySortLatest: "최신순",
    communitySortPopular: "인기순",
    communitySearchPlaceholder: "제목이나 내용으로 검색해보세요",
    communityWriteBtn: "글쓰기",
    communityEmptyFeed: "아직 회원 게시글이 없어요. 위 예시처럼 첫 글을 남겨보세요 🐾",
    communityLoadMore: "더 보기",
    communityLoading: "불러오는 중...",
    communityHealthNotice: "회원이 작성한 내용은 개인적인 경험이나 의견일 수 있어요. 반려동물의 건강 문제는 반드시 수의사와 상담해주세요.",
    communityNeedPetTitle: "등록된 아이가 있어야 글을 쓸 수 있어요",
    communityNeedPetBody: "Pet톡은 '우리 아이'에 등록한 반려동물과 함께 글을 남기는 공간이에요. 먼저 반려동물을 등록해주세요.",
    communityComposeTitlePet: "함께 표시할 아이",
    communityComposeTitleCategory: "카테고리",
    communityComposeVisibility: "공개 설정",
    communityComposeVisibilityPublicHelp: "모든 PetGrow 이용자가 볼 수 있어요.",
    communityComposeVisibilityPrivateHelp: "나만 볼 수 있어요. 회원정보의 Pet톡 내 활동에서 확인할 수 있어요.",
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
    myPageTitle: "회원정보",
    myPageAccountTitle: "내 계정",
    myPagePetsTitle: "등록한 우리 아이",
    myPagePetsCount: (n) => `${n}마리`,
    myPageActivityTitle: "Pet톡 내 활동",
    myPageSettingsBtn: "정보 수정",
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
    saveToastOk: "저장되었습니다.",
    saveToastError: "저장에 실패했어요 — 저장 공간이 가득 찼을 수 있어요. 오래된 사진을 정리해보세요.",
    welcomeBackMsg: (name) => name ? `다시 오셨군요! 🐾 ${name}의 기록을 이어가볼까요?` : "다시 오셨군요! 🐾 기록을 이어가볼까요?",
    socialLabels: { youtube: "유튜브", instagram: "인스타그램", threads: "스레드", tiktok: "틱톡", blog: "네이버 블로그", clip: "네이버 클립", kakao: "카카오톡 채널" },
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
    landingCardTipsTitle: "💡 Pet정보",
    landingCardNearbyTitle: "📍 내 주변 Pet",
    landingCardNearbyDesc: "검색한 주소 주변의 병원·약국·펫샵·미용·호텔을 찾아보고 내 위치 거리도 확인해요.",
    homeCardNearbyDesc: "주소 검색 또는 현재 위치 검색으로 주변 업체를 찾고, 지도에서 내 위치와 업체까지의 거리를 함께 확인해요.",
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
    landingTipsGuideTitle: "Pet정보",
    landingTipsGuideDesc: "건강·식단·행동·성장·생활부터 훈련·안전·미용까지, 반려생활에 바로 활용할 수 있는 Pet정보를 모아봤어요.",
    landingTipsTeaserLabel: "Pet정보 보러가기",
    landingGuideTeaserLabel: "사용방법 보기",
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
    tipCategoryLabels: { all: "All", dog: "Dogs", cat: "Cats", health: "Health", life: "Lifestyle", food: "Food & Nutrition", training: "Training", safety: "Safety", grooming: "Grooming" },
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
    infoGuideTitle: "Guide",
    infoGuideIntro: "A practical guide to PetGrow's main menus and features, organized around the actual app flow.",
    infoGuideSections: [
      { title: "Home dashboard", body: "Use the home dashboard to jump quickly to My Pets, Pet Music, Nearby Pet, PetTalk, PetBTI and other frequently used features. The layout adapts automatically for web, mobile and app screens." },
      { title: "Kakao Login", body: "Sign in with your Kakao account without creating a separate password. Saved features and activity are linked to the signed-in account." },
      { title: "My Pets & growth records", body: "Register multiple dogs and cats and manage each pet's profile, weight records, growth chart and growth album. Sign in with the same account on another device to continue with saved data." },
      { title: "PetBTI", body: "Answer 20 detailed behavior questions for dogs or 20 for cats to get a fun 16-type personality result. Results can be saved and the test can be taken again." },
      { title: "Pet Saju", body: "A light entertainment feature based on your registered pet's information. It is not intended to determine a pet's actual personality or future." },
      { title: "Pet Info", body: "Browse pet-life information by categories such as dogs, cats, health, lifestyle, food & nutrition, training, safety and grooming. Lists are paginated, searchable and bookmarkable, and content is continuously added and reviewed." },
      { title: "Pet Music", body: "Play dog and cat music with repeat playback. See the Popular Top 5 and music you have liked, and use likes and comments. You can edit or delete your own comments and report other users' comments." },
      { title: "Nearby Pet", body: "Allow location access to find nearby animal hospitals, pharmacies, pet shops, groomers, daycare and hotels sorted by distance. See your location and business locations on the map together with business name, category, address, phone number and distance. Signed-in users can leave ratings, reviews and likes; their own reviews can be edited or deleted and other reviews can be reported. Your coordinates are used only for nearby search and are not saved to your account." },
      { title: "PetTalk", body: "Share pet-life stories in categories such as daily life, bragging, questions, health, information, walks, training, product recommendations and free chat. Users can like posts and comments; their own posts and comments can be edited or deleted, while other content can be reported." },
      { title: "Account & My Activity", body: "Manage your nickname and account details, and review account-based activity such as your PetTalk activity and Pet Music likes." },
      { title: "Customer Support", body: "Check notices, public feedback, your inquiries and the inquiry form. If public sharing is unchecked, the inquiry is visible only to the operations team." },
      { title: "Admin Center", body: "Visible only to authorized admin accounts. It includes menu usage analytics, web/mobile web/PWA/app platform statistics, reports and moderation tools, Pet Music management, and daily, weekly and monthly reports." },
      { title: "Log out & delete account", body: "Logging out keeps saved account data on the server. Account deletion processes account-linked pet data, saved results and user-created content as described in the privacy policy, except data that must be retained by law, and deleted data cannot be restored." },
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
    deleteAccountConfirmBody: "Deleting your account removes your PetGrow account, pet information and profile photos, growth records, PetBTI results, PetTalk posts, comments, likes, attached photos, and other account-linked data. This cannot be undone. Do you want to continue?",
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
    tabDog: (n) => `Dog profile${n > 0 ? ` (${n})` : ""}`,
    tabCat: (n) => `Cat profile${n > 0 ? ` (${n})` : ""}`,
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
    accountCloseBtn: "Close",
    accountSettingsBtn: "Account settings",
    accountSettingsTitle: "Account settings",
    accountKakaoTag: "Logged in with Kakao",
    accountCodeLabel: "Kakao account code",
    accountNicknameLabel: "Pet Talk nickname",
    accountNicknameHelp: "2–8 characters · Shown on Pet Talk posts and comments.",
    accountNicknameSave: "Save nickname",
    accountNicknameSaved: "Nickname updated.",
    accountNicknameError: "Please enter 2–20 characters.",
    accountFreshLoginHelp: "After logging out, Kakao login lets you choose from saved accounts again.",
    loginTagline: "Grow healthy together with your pet",
    loginGateTitle: "Please log in",
    loginGateBody: "Log in with Kakao to save your pet's info to your account — and pick up right where you left off on any device.",
    loginContinueKakao: "Start with Kakao",
    termsFooterLink: "Terms of Service",
    loginToastSuccess: "You're logged in",
    loginToastError: "Login failed. Please try again.",
    communityNav: "Pet Talk",
    communityCategoryAll: "All",
    communityCategoryLabels: { daily: "Daily", brag: "Brag", question: "Question", health: "Health & Diet", info: "Info", walk: "Walks", training: "Training", shopping: "Gear", free: "Chat" },
    communitySortLatest: "Latest",
    communitySortPopular: "Popular",
    communitySearchPlaceholder: "Search titles and posts",
    communityWriteBtn: "Write",
    communityEmptyFeed: "No member posts yet. Use the examples above and be the first to share 🐾",
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
    socialLabels: { youtube: "YouTube", instagram: "Instagram", threads: "Threads", tiktok: "TikTok", blog: "Naver Blog", clip: "Naver Clip", kakao: "KakaoTalk Channel" },
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
    landingCardNearbyTitle: "📍 Nearby Pet",
    landingCardNearbyDesc: "Find nearby clinics, pharmacies, pet shops, groomers, hotels and daycare.",
    homeCardNearbyDesc: "See distance, address and phone details together with the map.",
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
    landingTipsGuideDesc: "160 Pet info articles across 8 categories, organized into pages of 20 for easier browsing.",
    landingTipsTeaserLabel: "Browse Pet Tips",
    landingGuideTeaserLabel: "How to use",
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

STRINGS.ja={...STRINGS.en,cancel:"キャンセル",hamNavHome:"ホーム",myPetsNav:"うちの子",sajuNav:"Pet占い",petBtiNav:"PetBTI",tipsTitle:"Pet情報",communityNav:"Petトーク",nearbyNav:"近くのPet",nearbyTitle:"近くのPet",infoGuideTitle:"情報ガイド",myPageTitle:"マイページ",accountLoginBtn:"ログイン",accountLogoutBtn:"ログアウト",accountDeleteBtn:"退会",privacyFooterLink:"プライバシー",termsFooterLink:"利用規約",loginContinueKakao:"Kakaoで始める",homeGreeting:(n)=>`こんにちは、${n}さん！ 🐾`,submitEdit:"保存",onboardingConfirmEditTitle:"保存しますか？",onboardingConfirmMessage:(n)=>`${n}の情報を保存します。続けますか？`,saveToastOk:"保存しました。"};
STRINGS.zh={...STRINGS.en,cancel:"取消",hamNavHome:"首页",myPetsNav:"我的宠物",sajuNav:"Pet命理",petBtiNav:"PetBTI",tipsTitle:"Pet信息",communityNav:"Pet社区",nearbyNav:"附近Pet",nearbyTitle:"附近Pet",infoGuideTitle:"信息指南",myPageTitle:"我的页面",accountLoginBtn:"登录",accountLogoutBtn:"退出登录",accountDeleteBtn:"注销账号",privacyFooterLink:"隐私政策",termsFooterLink:"使用条款",loginContinueKakao:"使用Kakao开始",homeGreeting:(n)=>`你好，${n}！ 🐾`,submitEdit:"保存",onboardingConfirmEditTitle:"要保存吗？",onboardingConfirmMessage:(n)=>`将保存${n}的信息。是否继续？`,saveToastOk:"已保存。"};

function useT() {
  const lang = useLang();
  return STRINGS[lang] || STRINGS.ko;
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
function logPetActivity(payload={}) { try { fetch("/api/activity?action=log",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{}); } catch {} }

function goToKakaoLogin() {
  // 전체 페이지 이동으로 카카오 로그인 화면으로 리다이렉트해요 (실제 OAuth 인가 흐름).
  const client = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
    ? "?client=android"
    : "";
  window.location.href = `/api/auth/kakao/login${client}`;
}
const AUTH_ACCOUNT_CACHE_KEY = "petgrow:auth-account:v1";
function readCachedAccount() {
  try {
    const account = JSON.parse(window.sessionStorage.getItem(AUTH_ACCOUNT_CACHE_KEY) || "null");
    return account?.id ? account : null;
  } catch {
    return null;
  }
}
function cacheAccount(account) {
  try {
    if (account?.id) window.sessionStorage.setItem(AUTH_ACCOUNT_CACHE_KEY, JSON.stringify(account));
    else window.sessionStorage.removeItem(AUTH_ACCOUNT_CACHE_KEY);
  } catch {}
}
async function fetchMe(timeoutMs = 5000) {
  // 401만 실제 로그아웃으로 판단해요. 서버 cold start/DB 지연은 한 번 재시도해서
  // 로그인된 사용자가 UI에서 다시 "로그인"으로 보이는 현상을 막습니다.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.status === 401) {
        cacheAccount(null);
        return null;
      }
      if (!res.ok) throw new Error(`me_${res.status}`);
      const account = await res.json();
      cacheAccount(account);
      return account;
    } catch (err) {
      console.warn(`로그인 상태 확인 재시도 ${attempt + 1}/2:`, err);
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 300));
    } finally {
      window.clearTimeout(timer);
    }
  }
  // 일시적 서버 오류를 로그아웃으로 확정하지 않습니다. 다음 focus/visibility에서 다시 확인해요.
  return undefined;
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
async function apiUpdateNickname(nickname) {
  const res = await fetch("/api/account", {
    method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || "nickname update failed");
  return data;
}

/* ============================================================
   Pet톡 커뮤니티 — API 클라이언트 헬퍼
   ============================================================ */
function sendHealthEvent(kind,source,statusCode=null,latencyMs=null,detail=""){
 try{fetch("/api/health-event",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,source,statusCode,latencyMs,detail})}).catch(()=>{})}catch{}
}
async function apiJson(url, options) {
  const res = await fetch(url, { credentials: "include", ...options });
  let data = null;
  try { data = await res.json(); } catch {}
  if (data?.pointEvent?.awarded) window.dispatchEvent(new CustomEvent("petgrow:points", { detail:{ amount:data.pointEvent.awarded,balance:data.pointEvent.balance,label:data.pointEvent.label||"PetPoint 적립" } }));
  if (data?.pointEvent?.spent) window.dispatchEvent(new CustomEvent("petgrow:points", { detail:{ amount:-data.pointEvent.spent,balance:data.pointEvent.balance,label:data.pointEvent.label||"PetPoint 사용" } }));
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

function adminApi(action, options={}) { const tok=sessionStorage.getItem("petgrow_admin_token")||""; return apiJson(`/api/admin?action=${action}`, {...options,headers:{...(options.headers||{}),...(tok?{"X-PetGrow-Admin-Token":tok}:{})}}); }
function adminStatus(){return adminApi("status");}

let petgrowAdminStatusCache=null;
let petgrowAdminStatusPromise=null;
function adminStatusFast(force=false){
  if(!force&&petgrowAdminStatusCache)return Promise.resolve(petgrowAdminStatusCache);
  if(!force&&petgrowAdminStatusPromise)return petgrowAdminStatusPromise;
  petgrowAdminStatusPromise=adminStatus().then(s=>{petgrowAdminStatusCache=s;return s}).finally(()=>{petgrowAdminStatusPromise=null});
  return petgrowAdminStatusPromise;
}
function adminHealth(){return adminApi("health");}
function adsApi(action,options={}){return apiJson(`/api/ads?action=${action}`,options);}
function adTrack(id,type){return adsApi("track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,type})});}

function adminAdsRequest(action,options={}){
  const token=sessionStorage.getItem("petgrow_admin_token")||"";
  return adsApi(action,{...options,headers:{...(options.headers||{}),"X-PetGrow-Admin-Token":token}});
}
function adminListDirectAds(){return adminAdsRequest("admin-list");}
function adminListAdInquiries(){return adminAdsRequest("admin-inquiries");}
function adminSaveDirectAd(payload){return adminAdsRequest("admin-save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}
function adminToggleDirectAd(id,active){return adminAdsRequest("admin-toggle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,active})});}
function adminDeleteDirectAd(id){return adminAdsRequest("admin-delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});}
function adminSetAdInquiryStatus(id,status){return adminAdsRequest("admin-inquiry-status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});}
function submitAdInquiry(payload){return adsApi("inquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}
function supportApi(action,options={}){return apiJson(`/api/support?action=${action}`,options);}
function getPopupNotice(){return supportApi("notices").then(r=>({items:(r.items||r.notices||[]).filter(x=>x.popup)}));}
function supportNotices(page=1){return supportApi(`notices&page=${page}`);}
function supportInquiries(page=1,mine=false){return supportApi(`inquiries&page=${page}&mine=${mine?1:0}`);}
function supportCreateInquiry(payload){return supportApi("inquiry-create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}
function adminSetPin(pin){return adminApi("set-pin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin})});}
function adminListAdmins(){return adminApi("admin-list");}
function adminSearchUser(q){return adminApi(`admin-search&q=${encodeURIComponent(q)}`);}
function adminAddUser(userId,role){return adminApi("admin-add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,role})});}
function adminChangeRole(userId,role){return adminApi("admin-role",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,role})});}
function adminResetPin(userId){return adminApi("admin-reset-pin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})});}
function adminRemoveUser(userId){return adminApi("admin-remove",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})});}
function adminSupportInquiries(page=1){return supportApi(`admin-inquiries&page=${page}`,{headers:{"X-PetGrow-Admin-Token":sessionStorage.getItem("petgrow_admin_token")||""}});}
function adminReplyInquiry(id,reply,status="answered"){return supportApi("admin-reply",{method:"POST",headers:{"Content-Type":"application/json","X-PetGrow-Admin-Token":sessionStorage.getItem("petgrow_admin_token")||""},body:JSON.stringify({id,reply,status})});}
function adminCreateNotice(payload){return supportApi("admin-notice-create",{method:"POST",headers:{"Content-Type":"application/json","X-PetGrow-Admin-Token":sessionStorage.getItem("petgrow_admin_token")||""},body:JSON.stringify(payload)});}

function adminBootstrap(setupCode,pin){return adminApi("bootstrap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({setupCode,pin})});}
function adminRecover(setupCode,pin){return adminApi("recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({setupCode,pin})});}
function adminVerify(pin){return adminApi("verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin})});}
function adminListReports(){return adminApi("reports");}
function adminListPlaceReviewReports(){return adminApi("place-reports");}
function adminHidePlaceReview(reviewId,reportId){return adminApi("place-review-hide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviewId,reportId})});}
function adminResolvePlaceReviewReport(reportId){return adminApi("place-review-resolve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportId})});}
function adminListMusicCommentReports(){return adminApi("music-comment-reports");}
function adminHideMusicComment(commentId,reportId){return adminApi("music-comment-hide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId,reportId})});}
function adminResolveMusicCommentReport(reportId){return adminApi("music-comment-resolve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportId})});}
function adminRestrictUser(payload){return adminApi("restrict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}
function adminUnblockUser(userId,reportId){return adminApi("unblock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,reportId})});}
function adminResolveReport(reportId){return adminApi("resolve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportId})});}
function adminStats(){return adminApi("stats");}
function adminReportSummary(period="daily"){return adminApi(`report-summary&period=${encodeURIComponent(period)}`);}

function adminRestrict(targetUserId,duration,reportId){return adminApi("restrict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetUserId,duration,reportId})});}
function adminUnblock(targetUserId,reportId){return adminApi("unblock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetUserId,reportId})});}

function adminLogs(){return adminApi("logs");}

function musicApi(action,options={}){return apiJson(`/api/music?action=${action}`,options);}
function musicList(species="all",page=1){return musicApi(`list&species=${encodeURIComponent(species)}&page=${page}`);}
function musicLiked(){return musicApi("liked");}
function musicTrackPlay(id){return musicApi("play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});}
function musicToggleLike(id){return musicApi("like",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});}
function musicComments(id){return musicApi(`comments&id=${encodeURIComponent(id)}`);}
function musicAddComment(id,content){return musicApi("comment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,content})});}
function musicUpdateComment(commentId,content){return musicApi("comment-update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId,content})});}
function musicDeleteComment(commentId){return musicApi("comment-delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId})});}
function musicReportComment(commentId,detail){return musicApi("comment-report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId,reason:"other",detail})});}
function adminMusicRequest(action,options={}){const token=sessionStorage.getItem("petgrow_admin_token")||"";return musicApi(action,{...options,headers:{...(options.headers||{}),"X-PetGrow-Admin-Token":token}});}
function adminMusicList(){return adminMusicRequest("admin-list");}
function adminMusicSave(payload){return adminMusicRequest("admin-save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}
function adminMusicToggle(id,active){return adminMusicRequest("admin-toggle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,active})});}
function adminMusicDelete(id){return adminMusicRequest("admin-delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});}

function getAnonymousAnalyticsSessionId() {
  try {
    let id = sessionStorage.getItem("petgrow_analytics_session");
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem("petgrow_analytics_session", id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
function getAnalyticsPlatform() {
  if (Capacitor.isNativePlatform()) return Capacitor.getPlatform() === "ios" ? "ios" : "android";
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  if (standalone) return "pwa";
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  return mobile ? "mobile_web" : "web";
}
function analyticsEvent(event, page) {
  return fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      page,
      platform: getAnalyticsPlatform(),
      sessionId: getAnonymousAnalyticsSessionId(),
    }),
    keepalive: true,
  }).catch(() => null);
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
const MapPinIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 2.7c-4.2 0-7.5 3.3-7.5 7.5 0 5.6 7.5 11.2 7.5 11.2s7.5-5.6 7.5-11.2c0-4.2-3.3-7.5-7.5-7.5zm0 10.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
  </svg>
);
const MusicIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M9 4v11.2A3.4 3.4 0 1 0 11 18V8h8v7.2A3.4 3.4 0 1 0 21 18V4H9z"/>
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
const ClipIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
    <path d="M10 8.2v7.6l6-3.8-6-3.8z" fill="#fff" />
  </svg>
);
const KakaoChannelIcon = (p) => (
  <svg className="icon" viewBox="0 0 24 24" {...p}>
    <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.6l-1 3.6 4.2-2.7c.7.1 1.3.2 2 .2 5.5 0 10-3.5 10-7.7S17.5 3 12 3z" fill="currentColor" />
    <path d="M8 8.2v1.1h1.6v4.4h1.2V9.3h1.6V8.2H8zm5.1 0v5.5h3.5v-1.1h-2.3V8.2h-1.2z" fill="#241E1E" />
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
      <path d="M30 30c-8 0-13 6-13 14 0 7 4 12 9 15-3 6-2 13 2 18" stroke="#223027" strokeWidth="3.2" />
      <circle cx="20" cy="34" r="1.6" fill="#223027" />
      <path d="M55 38c8-2 15 3 17 11 2 8-2 15-8 19 2 6 0 12-4 16" stroke="#4F8A5B" strokeWidth="3.2" />
      <circle cx="65" cy="42" r="1.6" fill="#4F8A5B" />
      <path d="M32 60c4-5 10-5 14 0 4-5 10-5 14 0 0 6-7 12-14 16-7-4-14-10-14-16z" stroke="#4F8A5B" strokeWidth="3" />
      <path d="M46 58c0-4 2-6 6-7-1 4-2 6-6 7z" fill="#4F8A5B" stroke="none" />
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
function Modal({ open, onClose, children, width = 420, closeOnBackdrop = true, cardClassName = "" }) {
  if (!open) return null;
  const handleBackdropPointerDown = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  };
  return (
    <div className="modal-overlay" onPointerDown={handleBackdropPointerDown}>
      <div
        className={`modal-card ${cardClassName}`.trim()}
        style={{ maxWidth: width }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger = false, busy = false }) {
  const t = useT();
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel}>
      <h3 style={{ fontSize: 17, marginBottom: 10 }}>{title}</h3>
      <p className="bg-sub" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 22, whiteSpace: "pre-line" }}>{message}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="bg-btn bg-btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>{t.cancel}</button>
        <button className="bg-btn" style={danger ? { flex: 1, background: "#C0392B", boxShadow: "0 5px 0 #922B21" } : { flex: 1 }}
          onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
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
        <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 8 }}>🐾</div>
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
  const lang = useLang();
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
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{lang === "en" ? "10. 📍 Nearby Pet" : "10. 📍 내 주변 Pet"}</div>
          <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6 }}>주소를 직접 입력하거나 현재 위치를 기준으로 동물병원·동물약국·펫샵·용품점·미용·호텔·유치원을 검색할 수 있어요. 현재 위치 검색은 선택사항이며 위치 권한을 허용한 경우에만 사용할 수 있어요. 위치를 허용하지 않아도 주소 검색은 그대로 이용할 수 있고, 허용하면 지도에 내 위치와 각 업체까지의 거리도 함께 보여줘요. 로그인 회원은 별점·간단 후기·좋아요·신고를 남길 수 있어요.</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{lang === "en" ? "11. 🎵 Pet Music" : "11. 🎵 Pet음악"}</div>
          <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.6 }}>강아지·고양이 음악을 듣고 1곡 반복·전체 반복으로 재생할 수 있어요. 좋아요와 댓글로 반려동물의 반응을 남길 수 있고, 음악 목록은 20곡씩 페이지로 나뉘어요.</div>
        </div>
      </div>
      <button className="bg-btn" style={{ width: "100%", marginTop: 22 }} onClick={onClose}>{t.guideConfirm}</button>
    </Modal>
  );
}

/* ============================================================
   개인정보처리방침 (초안) — 법률 자문 아님, 배포 전 검토 필요
   ============================================================ */
const PRIVACY_SECTIONS_KO = [
  { title: "1. 개인정보의 처리 목적", body: "PetGrow는 카카오 간편로그인을 통한 회원 식별·계정 관리, 로그인 유지, 공지사항 제공, 문의·피드백 접수 및 답변 관리, 광고 문의 접수 및 상담(회사/브랜드명, 담당자명, 이메일, 선택 입력 연락처·예산), 직접광고 캠페인 운영 및 노출기간 관리, 반려동물 정보 저장 및 기기 간 동기화, PetBTI 등 서비스 결과 저장·다시보기, Pet음악 재생·반복재생·즐겨찾기·좋아요·댓글 제공, 보호자 궁합 계산, 고객 문의, 서비스 안정성·품질 개선, 광고 제공 및 성과 측정, 부정 이용 방지, 회원탈퇴 및 개인정보 삭제 처리, 이용자가 입력한 주소를 기준으로 주변 반려동물 시설을 검색하고, 이용자가 선택적으로 위치 권한을 허용한 경우 지도에 현재 위치를 표시하고 장소까지의 거리를 계산하기 위하여 필요한 범위에서 정보를 처리할 수 있습니다." },
  { title: "2. 처리하는 개인정보 항목", body: "가. 카카오 간편로그인\n- 카카오가 제공하는 사용자 고유 식별정보\n- 닉네임, 프로필 이미지 등은 실제로 동의받아 제공받고 서비스에서 사용하는 경우에만 처리\n- 이메일 등 추가 정보는 실제 구현상 필요한 경우에만 동의를 받아 처리\n\n나. 반려동물 및 서비스 정보\n- 반려동물 이름, 종류, 품종, 생년월일, 성별, 현재 체중 및 성장 관련 정보\n- 반려동물 프로필 사진\n- PetBTI 결과 및 검사일\n- Pet사주·오늘의 펫운세 및 Pet타로의 선택 주제·뽑은 카드·저장 여부 등 저장이 필요한 서비스 정보\n- Pet음악 좋아요·댓글 등 이용자가 직접 남긴 참여 기록\n\n다. 보호자 궁합 입력정보\n- 보호자 이름, 보호자 생년월일\n- 위 정보는 보호자 궁합 결과를 계산하기 위해 해당 화면에서만 일시적으로 사용하며, 현재 구현상 PetGrow 서버 또는 계정에 저장하지 않습니다.\n\n라. 광고·제휴 문의 정보\n- 필수: 회사/브랜드명, 담당자명, 이메일, 문의 내용\n- 선택: 연락처, 광고 유형, 예산 등 이용자가 직접 입력한 상담 정보\n- 처리 목적: 광고·제휴 상담, 견적·캠페인 협의 및 문의 이력 관리\n\n마. 자동으로 처리될 수 있는 정보\n- IP 주소, 기기·운영체제·브라우저 또는 앱 정보\n- 접속 및 서비스 이용기록, 오류·보안 관련 기록\n- Google Mobile Ads SDK 사용 시 광고 제공·분석·부정행위 방지를 위해 IP 주소, 앱 실행·탭·동영상 조회 등 이용 상호작용 정보, 앱/SDK 성능 관련 진단정보, Android 광고 ID·App Set ID 등 기기 또는 계정 식별자가 Google에 의해 자동으로 수집·공유될 수 있습니다. 광고 ID의 수집 여부는 앱 설정 및 SDK 구성에 따라 달라질 수 있습니다.\n\nPetGrow는 서비스 제공에 필요하지 않은 전화번호, 친구목록 등의 개인정보를 불필요하게 요청하지 않는 것을 원칙으로 합니다. 보호자 궁합에서 입력하는 보호자 이름·생년월일은 궁합 계산에만 일시적으로 사용되며 현재 구현상 서버로 전송하거나 계정에 저장하지 않습니다." },
  { title: "3. 개인정보의 저장 방식", body: "로그인 후 이용자가 등록하거나 생성한 정보는 단순히 '이 기기' 또는 '이 브라우저'에만 저장되는 구조를 원칙으로 하지 않으며, 로그인한 PetGrow 계정에 연결하여 서버 또는 클라우드 저장소에 저장·동기화될 수 있습니다. 동일한 카카오 계정으로 로그인하면 지원되는 다른 기기 또는 웹 환경에서 저장된 정보를 불러올 수 있습니다. 로그인 기능 도입 이전의 기존 기기 저장정보는 이용자의 선택에 따라 계정으로 이전될 수 있습니다." },
  { title: "4. 개인정보의 처리 및 보유기간", body: "회원계정 및 계정에 연결된 개인정보는 원칙적으로 회원탈퇴 시까지 보유·이용합니다. 회원탈퇴 시 관계 법령에 따라 별도로 보관할 필요가 있는 정보를 제외하고 계정 및 관련 개인정보를 삭제합니다. Pet음악 좋아요와 댓글 등 계정에 연결된 참여 기록도 회원탈퇴 또는 해당 댓글 삭제 시 함께 삭제될 수 있습니다. 광고·제휴 문의를 통해 입력된 회사/브랜드명, 담당자명, 이메일, 선택 연락처·예산 및 문의 내용은 상담·제휴 검토 등 처리 목적이 달성될 때까지 보유하며, 목적 달성 후 지체 없이 삭제하는 것을 원칙으로 합니다. 분쟁 대응이나 법령상 보관 의무가 있는 경우에는 필요한 범위와 기간에 한해 별도로 보관할 수 있습니다. 외부 인증·광고·호스팅 사업자가 자체적으로 처리하는 정보는 해당 사업자의 정책 및 실제 처리 구조에 따를 수 있습니다." },
  { title: "5. 카카오 간편로그인", body: "PetGrow는 이용 편의를 위해 카카오 간편로그인을 제공할 수 있습니다. 로그인 과정에서 카카오의 동의 화면을 통해 이용자가 동의한 범위의 정보만 PetGrow에 제공될 수 있습니다. 처리 목적은 회원 식별, 계정 생성·관리, 사용자별 데이터 저장·동기화, 회원탈퇴 및 고객지원 등입니다." },
  { title: "6. 반려동물 정보 및 프로필 사진", body: "이용자가 등록한 반려동물 정보와 프로필 사진은 해당 PetGrow 계정과 연결하여 저장될 수 있으며, 우리 아이, 성장정보, Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), Pet타로(주제별 하루 1회), PetBTI 등 반려동물별 기능 제공에 이용될 수 있습니다." },
  { title: "7. 기존 기기 저장정보의 계정 이전", body: "카카오 간편로그인 도입 이전에 기기 또는 브라우저에 저장되어 있던 반려동물 정보가 있는 경우 이용자의 선택과 동의에 따라 로그인 계정으로 이전할 수 있습니다. 서버 저장이 정상 완료되기 전에 기존 데이터를 임의로 삭제하지 않도록 운영합니다." },
  { title: "8. 개인정보의 제3자 제공·처리위탁 및 국외 이전", body: "PetGrow는 이용자의 개인정보를 임의로 판매하지 않습니다. 제3자 제공, 처리위탁 또는 국외 이전이 발생하는 경우 실제 데이터 흐름, 제공자, 처리 목적, 항목, 보유기간 및 관련 법령상 고지·동의 필요 여부를 확인하여 본 방침에 반영합니다. 실제 사용하는 DB, Storage 및 호스팅 사업자는 최종 배포 구조에 맞추어 구체적으로 기재합니다.\n\n현재 PetGrow는 회원 데이터 저장을 위해 Vercel(호스팅 및 서버리스 인프라), Vercel Postgres(데이터베이스, Neon 기반), Vercel Blob(Pet톡 게시글 사진 및 Pet음악 음원·커버 이미지 저장)을 사용하고 있으며, 이 과정에서 이용자의 반려동물 정보 및 Pet톡 게시물 등이 해당 사업자의 서버(국외 소재 가능)에 저장·처리될 수 있습니다." },
  { title: "9. 주소기반 주변 시설 검색 및 선택적 위치 권한", body: "PetGrow의 '내 주변 Pet'은 이용자가 직접 입력한 주소 또는 이용자가 선택한 현재 위치를 기준으로 주변 장소를 검색할 수 있습니다. 위치 권한은 선택사항이며, 허용한 경우 기기 또는 브라우저가 제공하는 현재 위치 좌표를 현재 위치 주변 검색, 지도 내 위치 표시, 각 장소까지의 거리 계산에 일시적으로 사용합니다. 현재 위치 좌표는 PetGrow 회원 계정 또는 장소 후기 DB에 별도로 저장하지 않습니다. 위치 권한을 허용하지 않아도 주소 검색은 그대로 이용할 수 있고, 권한은 언제든 기기 또는 브라우저 설정에서 철회할 수 있습니다. 장소명·주소·전화번호·업종 등 업체 정보는 카카오 장소검색 등 외부 장소정보를 검색 시점에 불러오므로 실제 영업정보와 차이가 있을 수 있습니다." },
  { title: "10. 외부 서비스 및 광고", body: "PetGrow는 서비스 운영을 위해 카카오(간편로그인), Google AdMob/Google Mobile Ads SDK(앱 광고), 데이터베이스·파일 저장·호스팅 제공업체 등을 사용할 수 있습니다. Google은 간편로그인 제공자가 아니라 광고 등 실제 사용하는 서비스의 제공자로만 기재합니다. Google Mobile Ads SDK는 광고 제공, 분석 및 부정행위 방지를 위해 IP 주소, 이용 상호작용, 진단정보, 기기·계정 식별자 등을 자동으로 처리할 수 있습니다. 개인 맞춤형 광고 여부와 광고 관련 선택권은 적용되는 지역의 법령, Google의 동의 관리 도구 설정 및 이용자의 기기·계정 설정에 따라 달라질 수 있습니다. 외부 사업자가 자체적으로 처리하는 개인정보에는 해당 사업자의 개인정보처리방침이 적용될 수 있습니다." },
  { title: "10. 쿠키·광고 식별자 및 이용자 선택권", body: "웹 서비스는 로그인 유지, 서비스 제공, 이용 현황 분석 또는 광고 제공 등을 위해 쿠키 및 유사 기술을 사용할 수 있습니다. 모바일 앱에서는 광고 ID 등 기기 식별자가 광고 SDK에 의해 사용될 수 있습니다. 이용자는 브라우저의 쿠키 설정, Android의 광고 개인정보 보호/광고 ID 설정 등 기기에서 제공하는 방법을 통해 일부 광고 관련 식별정보의 사용을 제한하거나 광고 ID를 재설정·삭제할 수 있습니다. 관련 법령상 동의가 필요한 지역에는 Google의 개인정보 보호 메시지 또는 동의 관리 절차가 표시될 수 있습니다. 일부 설정을 제한하면 맞춤형 광고가 제한되거나 서비스 일부 기능에 차이가 생길 수 있습니다." },
  { title: "11. 개인정보의 파기", body: "개인정보 처리 목적이 달성되거나 회원이 탈퇴한 경우 관계 법령상 보관 의무가 있는 정보를 제외하고 개인정보를 삭제합니다. 삭제 대상에는 PetGrow 계정, 카카오 인증 관련 식별정보, 반려동물 정보, 프로필 사진, 저장된 검사 및 서비스 결과, Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진 등이 포함될 수 있습니다." },
  { title: "12. 이용자의 권리", body: "이용자는 관련 법령에서 정한 범위에서 자신의 개인정보에 대한 열람, 정정, 삭제 또는 처리정지 등을 요청할 수 있습니다. 서비스 내 회원탈퇴 기능을 통해 계정 및 관련 데이터 삭제를 요청할 수 있으며, 앱 이용이 어려운 경우 help.petgrow@gmail.com으로 문의할 수 있습니다." },
  { title: "13. 회원탈퇴 및 계정 삭제", body: "회원은 언제든지 PetGrow의 회원정보/정보 수정 영역에서 회원탈퇴를 요청할 수 있습니다. 탈퇴 완료 시 법령상 별도 보관 의무가 있는 경우를 제외하고 계정과 연결된 개인정보 및 서비스 데이터를 삭제합니다.\n\n계정 삭제 안내: https://www.petgrow.co.kr/delete-account" },
  { title: "14. 아동의 개인정보", body: "PetGrow는 아동의 개인정보를 의도적으로 수집하는 것을 목적으로 하지 않습니다. 향후 아동을 대상으로 하는 기능을 제공하거나 아동의 개인정보를 처리하게 되는 경우 관련 법령 및 앱 마켓 정책에서 요구하는 보호조치를 적용합니다." },
  { title: "15. 개인정보의 안전성 확보조치", body: "PetGrow는 인증정보 및 비밀키 보호, 사용자별 데이터 접근권한 제한, 불필요한 접근 최소화, 서비스 보안 점검 등 합리적으로 필요한 기술적·관리적 보호조치를 적용하도록 노력합니다." },
  { title: "16. Pet톡(커뮤니티) 서비스와 개인정보", body: "PetGrow는 회원 간 반려동물 정보를 공유하는 커뮤니티 기능 'Pet톡'을 제공합니다. Pet톡 이용과 관련하여 다음 정보가 처리됩니다.\n- 게시글, 댓글, 좋아요 및 신고 내역\n- 게시글에 첨부한 사진(최대 5장)\n- 게시글·댓글에 표시되는 반려동물 정보(반려동물 이름, 품종, 생년월일 기반 나이, 프로필 사진)\n\n회원의 카카오 식별정보, 이메일 등 회원 개인정보는 다른 회원에게 공개되지 않습니다. Pet톡에는 회원이 직접 설정한 닉네임과, 게시글 작성 시 선택한 반려동물의 이름·품종·나이·프로필 사진이 표시될 수 있습니다. 작성자는 게시글 상세 화면에서 게시글을 공개 또는 비공개로 전환할 수 있으며, 비공개 게시글은 작성자 본인에게만 제공됩니다. 게시글 작성자 본인 여부는 서버에서만 확인하며 다른 회원에게 노출되지 않습니다." },
  { title: "17. Pet톡 게시물의 보유기간 및 삭제", body: "Pet톡의 게시글·댓글·좋아요·신고 내역은 게시글/댓글이 삭제되거나 회원이 탈퇴할 때까지 보유됩니다. 회원은 본인이 작성한 게시글과 댓글을 언제든지 직접 삭제할 수 있습니다. 회원탈퇴 시 해당 회원이 작성한 모든 게시글·댓글·좋아요 기록은 즉시 삭제되며, 첨부된 사진 파일도 함께 삭제됩니다. 신고 내역은 신고한 회원이 탈퇴하는 경우 함께 삭제됩니다.\n\nPetGrow는 신고된 게시물을 운영자가 검토한 후 게시글·댓글을 숨기거나 삭제할 수 있으며, 운영정책 위반 정도에 따라 Pet톡 이용을 1일·7일·30일 또는 영구 제한하거나 제한을 해제할 수 있습니다. 신고만으로 자동 이용제한되지는 않으며, 관리자 처리 이력은 운영·보안 및 오남용 방지를 위해 기록될 수 있습니다." },
  { title: "18. Pet톡 이미지 저장", body: "Pet톡에 첨부하는 사진은 Vercel Blob(파일 저장 서비스)에 저장되며, 데이터베이스에는 사진의 저장 위치(URL)만 저장됩니다. 업로드 시 허용된 이미지 형식(JPG/PNG/WebP) 및 용량 제한이 적용되며, 게시글이 삭제되면 저장된 사진 파일도 함께 삭제됩니다." },
  { title: "19. 익명·집계형 서비스 이용 통계 및 광고 성과", body: "PetGrow는 서비스 품질 및 운영 현황을 확인하기 위해 개인정보를 최소화한 자체 통계를 운영할 수 있습니다. 집계 항목에는 방문 세션 수, 최근 5분 내 활성 세션의 추정치, 메뉴별 페이지 조회 수, 앱·웹 이용 비중, 신규·활성 회원 수, 등록 반려동물 수, Pet톡 게시글·댓글·좋아요 수, 신고·이용제한 건수, 직접광고 노출·클릭 및 광고 표시 요청·성공·오류 건수 등이 포함될 수 있습니다.\n\nPetGrow 관리자 통계 화면에는 이용자의 이름, 이메일, 카카오 고유식별정보, IP 주소 또는 개인별 광고 이용내역을 표시하지 않는 것을 원칙으로 합니다. 익명 방문 세션 중복 집계를 위한 해시값은 최대 90일 동안 보관한 후 삭제할 수 있으며, 일자별 집계 통계는 서비스 운영 추이 확인을 위해 최대 24개월간 보관할 수 있습니다. '현재 접속 세션'은 최근 일정 시간 내 신호가 있었던 세션을 바탕으로 한 추정치이며 실제 동시접속자 수와 차이가 있을 수 있습니다. AdMob의 실제 광고 노출·클릭·수익 및 광고 식별자 등은 Google의 시스템에서 별도로 처리될 수 있으며, PetGrow의 자체 통계와 Google 광고 보고서는 서로 다른 데이터입니다." },
  { title: "19-2. 내 주변 Pet 이용후기·좋아요·신고", body: "회원이 내 주변 Pet의 장소에 별점과 이용후기를 작성·수정·삭제하거나 후기 좋아요·신고 기능을 사용하는 경우 장소 식별정보(카카오 장소 ID·장소명), 별점, 후기 내용, 좋아요 및 신고 내역, 작성·처리 시각과 회원 식별을 위한 내부 계정 ID가 처리될 수 있습니다. 다른 이용자에게는 후기 작성자의 서비스 닉네임이 표시될 수 있으나 카카오 고유 식별정보, 이메일 등 로그인 정보는 공개하지 않습니다. 후기 작성 단계에서는 욕설·비속어·음란·혐오 표현, 전화번호·이메일 등 개인정보 노출을 줄이기 위한 자동 필터를 적용할 수 있습니다. 신고된 후기는 운영진이 검토하여 숨김 또는 신고 종결 처리할 수 있으며, 신고 및 처리 이력은 서비스 운영·분쟁 대응·부정 이용 방지를 위해 필요한 기간 동안 보관될 수 있습니다. 회원탈퇴 시 작성 후기 및 후기 좋아요 등 계정에 직접 연결된 기록은 관계 법령상 별도 보관이 필요한 경우를 제외하고 삭제하는 것을 원칙으로 합니다." },
  { title: "20. 개인정보 관련 문의", body: "서비스명: PetGrow\n문의 이메일: help.petgrow@gmail.com" },
  { title: "21. 개인정보처리방침의 변경", body: "서비스 기능, 개인정보 처리 방식, 외부 서비스 또는 관련 법령·정책 변경에 따라 본 개인정보처리방침이 변경될 수 있습니다. 중요한 변경사항은 PetGrow 웹사이트 또는 애플리케이션을 통해 안내합니다.\n\n이번 개정에는 광고·제휴 문의 시 처리되는 정보와 Google AdMob/Google Mobile Ads SDK를 통한 광고 관련 자동 처리 항목 및 이용자 선택권에 관한 내용을 보다 구체적으로 반영했습니다.\n\n또한 카카오 간편로그인 전 필수 이용약관·개인정보 수집·이용 동의와 선택 광고·마케팅 수신 동의를 구분하여 받을 수 있으며, 광고·제휴 문의 제출 시에는 해당 문의를 위한 개인정보 수집·이용 동의를 별도로 받습니다.\n\n내 주변 Pet은 입력한 주소 또는 이용자가 선택한 현재 위치를 검색 기준으로 사용할 수 있고, 현재 위치 권한은 현재 위치 주변 검색·지도 표시·장소까지의 거리 계산을 위한 선택 기능임을 명확히 했습니다. 위치 권한을 거부해도 주소 검색은 이용할 수 있습니다.\n\n최종 업데이트: 2026년 8월 17일\n시행일: 2026년 8월 17일" },
];
const PRIVACY_SECTIONS_EN = [
  { title: "1. Purpose of Processing", body: "PetGrow may process personal information to the extent necessary for: member identification and account management via Kakao Login; keeping you logged in; storing and syncing pet information across devices; saving and re-viewing results such as PetBTI; providing Pet Music playback, likes, comments, and popularity rankings; customer support; improving service stability and quality; delivering ads and measuring ad performance; preventing fraud; and processing account deletion and related data removal." },
  { title: "2. Categories of Personal Information Processed", body: "a. Kakao Login\n- The unique user identifier provided by Kakao\n- Nickname and profile image are only processed where actually consented to and used by the service\n- Additional info such as email is only requested with consent where actually needed\n\nb. Pet & service information\n- Pet name, species, breed, birth date, sex, current weight, and growth-related information\n- Pet profile photo\n- PetBTI results and test date\n- Saju and other service results that need to be saved\n\nc. Guardian compatibility input\n- Guardian name and date of birth\n- These are used temporarily on the compatibility screen to calculate the result and, in the current implementation, are not sent to or stored on PetGrow servers or the account.\n\nd. Information that may be processed automatically\n- IP address, device/OS/browser or app info\n- Access and usage logs, error/security logs\n- Advertising identifiers and ad interaction data\n\nPetGrow's principle is not to request phone number, gender, birthday, friend list, or other information not needed for the service." },
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
  { title: "16. Pet Talk (Community) and Personal Information", body: "PetGrow provides 'Pet Talk,' a community feature for sharing pet information between members. The following is processed in connection with Pet Talk:\n- Posts, comments, likes, and reports\n- Photos attached to posts (up to 5 per post)\n- Pet information shown on posts/comments (pet name, breed, age derived from birth date, profile photo)\n\nA member's Kakao identifier, email, and other personal information are never shown to other members. Pet Talk may show the nickname chosen by the member together with the name, breed, age, and profile photo of the pet selected for the post. Authors can switch their own post between public and private on the post detail screen; private posts are available only to the author. Whether a member is the author of a post is checked only on the server and is never exposed to other members." },
  { title: "17. Retention and Deletion of Pet Talk Content", body: "Posts, comments, likes, and reports on Pet Talk are retained until the post/comment is deleted or the member withdraws. Members can delete their own posts and comments at any time. Upon account withdrawal, all posts, comments, and likes by that member are deleted immediately, along with any attached photo files. Report records are deleted if the reporting member withdraws.\n\nPetGrow may hide or delete reported posts/comments after operator review." },
  { title: "18. Pet Talk Image Storage", body: "Photos attached to Pet Talk posts are stored in Vercel Blob (a file storage service); only the storage location (URL) is stored in the database. Uploads are restricted to allowed image formats (JPG/PNG/WebP) and a size limit, and stored photo files are deleted when a post is deleted." },
  { title: "19. Contact", body: "Service: PetGrow\nContact email: help.petgrow@gmail.com" },
  { title: "21. Changes to This Policy", body: "This policy may change due to changes in service features, how personal information is processed, external services, or applicable laws/policies. Material changes will be announced via the PetGrow website or app.\n\nLast updated: August 16, 2026\nEffective date: August 16, 2026" },
];

const TERMS_SECTIONS_KO = [
  { title: "제1조 (목적)", body: "본 약관은 PetGrow가 제공하는 웹사이트, 모바일 애플리케이션 및 관련 서비스의 이용조건과 PetGrow 및 이용자의 권리·의무·책임사항을 정함을 목적으로 합니다." },
  { title: "제2조 (용어의 정의)", body: "① \"서비스\"란 PetGrow가 제공하는 반려동물 등록·성장정보·Pet사주·PetBTI·Pet정보 및 기타 관련 기능을 말합니다.\n② \"이용자\"란 PetGrow 서비스를 이용하는 모든 자를 말합니다.\n③ \"회원\"이란 카카오 간편로그인을 통해 계정을 생성하고 서비스를 이용하는 자를 말합니다.\n④ \"계정\"이란 회원 식별 및 사용자별 데이터 저장을 위해 생성되는 PetGrow 이용자 정보를 말합니다.\n⑤ \"반려동물 정보\"란 회원이 등록하는 반려동물의 이름, 종류, 품종, 생년월일, 성별, 체중, 프로필 사진 및 기타 관련 정보를 말합니다." },
  { title: "제3조 (약관의 효력 및 변경)", body: "본 약관은 서비스에 게시함으로써 효력이 발생합니다. PetGrow는 관련 법령을 위반하지 않는 범위에서 필요한 경우 약관을 변경할 수 있으며 중요한 변경사항은 서비스 내에서 안내합니다." },
  { title: "제4조 (회원가입 및 이용계약)", body: "이용자가 카카오 간편로그인 등 PetGrow가 제공하는 인증 절차를 완료하고 필요한 약관 및 개인정보 관련 절차에 동의하면 이용계약이 성립할 수 있습니다." },
  { title: "제5조 (카카오 간편로그인)", body: "① PetGrow는 회원 편의를 위해 카카오의 외부 인증 서비스를 이용한 간편로그인을 제공할 수 있습니다.\n② 회원은 카카오 계정을 이용하여 PetGrow에 로그인할 수 있습니다.\n③ 카카오 서비스의 장애, 정책 변경 또는 이용자의 카카오 계정 상태에 따라 로그인이 일시적으로 제한될 수 있습니다.\n④ 카카오 인증 서비스 자체에 대해서는 카카오의 이용약관 및 개인정보처리방침이 적용될 수 있습니다." },
  { title: "제6조 (계정 및 로그인 상태 관리)", body: "회원은 자신의 카카오 계정을 안전하게 관리해야 합니다. PetGrow의 주요 기능은 로그인한 회원에게 제공될 수 있으며, 로그아웃 시 서버에 저장된 계정 데이터는 삭제되지 않습니다. 동일한 카카오 계정으로 다시 로그인하면 저장된 정보를 불러올 수 있습니다." },
  { title: "제7조 (서비스 제공)", body: "PetGrow는 우리 아이 등록·관리, 성장 예상 및 성장정보, Pet사주, PetBTI, Pet음악(음원 재생·반복재생·즐겨찾기·좋아요·댓글), Pet정보, Pet톡 커뮤니티, 공지사항, 문의·피드백(공개/비공개 선택 및 운영진 답변), 광고 문의 및 제휴 광고 안내(직접광고 배너·사이트 내부 프로모션 모달 포함), 회원정보(계정·닉네임·활동 관리), 계정별 데이터 저장 및 기기 간 동기화 등의 서비스를 제공할 수 있습니다." },
  { title: "제8조 (데이터 저장 및 동기화)", body: "로그인 회원이 등록한 반려동물 정보와 일부 서비스 결과는 회원 계정에 연결하여 서버 또는 클라우드 저장소에 저장될 수 있습니다. 따라서 서비스 내에서 '이 기기에만 저장', '이 브라우저에만 저장'되는 것으로 안내하지 않습니다. 동일한 카카오 계정으로 로그인하면 지원되는 다른 기기 또는 웹 환경에서 저장된 정보를 불러올 수 있습니다. 다만 카카오 간편로그인 도입 이전의 기존 로컬 데이터는 별도의 이전 절차가 적용될 수 있습니다." },
  { title: "제9조 (이용자의 의무)", body: "이용자는 타인의 계정·정보 도용, 시스템의 정상 운영 방해, 취약점 악용, 불법적인 데이터 수집, PetGrow 또는 제3자의 권리 침해, 관계 법령 위반 등의 행위를 해서는 안 됩니다." },
  { title: "제10조 (서비스 이용 제한)", body: "이용자가 본 약관 또는 관계 법령을 위반하거나 서비스의 안정적인 운영을 방해하는 경우 PetGrow는 필요한 범위에서 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다. Pet톡 운영정책 위반의 경우 운영자가 신고 및 위반 내용을 검토하여 1일, 7일, 30일 또는 영구 이용제한을 적용하거나 해제할 수 있습니다. 신고 접수만을 이유로 자동 이용제한하지 않으며, 이용제한·해제·신고처리 등 관리자 조치는 운영 및 보안 목적으로 기록될 수 있습니다." },
  { title: "제10조의2 (Pet톡 닉네임 및 공개정보)", body: "회원은 계정의 회원정보 수정 기능에서 Pet톡에 표시할 닉네임을 설정·변경할 수 있습니다. Pet톡 게시글 및 댓글에는 회원이 설정한 닉네임과 선택한 반려동물의 일부 정보가 표시될 수 있습니다. 카카오 계정의 고유 식별정보나 로그인 정보는 다른 회원에게 공개되지 않습니다." },
  { title: "제11조 (회원탈퇴 및 이용계약 해지)", body: "회원은 언제든지 서비스 내 회원탈퇴 기능을 통해 이용계약을 해지할 수 있습니다. 회원탈퇴가 완료되면 관계 법령에 따라 별도로 보관해야 하는 정보가 있는 경우를 제외하고 회원계정 및 계정과 연결된 개인정보와 저장정보를 삭제합니다." },
  { title: "제12조 (반려동물 관련 정보 및 계산 결과)", body: "PetGrow의 성장 예상, 체중 계산 및 기타 반려동물 관련 정보는 일반적인 자료와 이용자가 입력한 정보를 기반으로 제공되는 참고용 정보이며 실제 결과를 보장하지 않습니다." },
  { title: "제13조 (건강 관련 정보)", body: "PetGrow에서 제공하는 건강, 식단, 영양 및 관리 정보는 일반적인 참고정보이며 수의사의 진료, 진단 또는 처방을 대신하지 않습니다. 반려동물에게 이상 증상이나 응급상황이 있는 경우 수의사 또는 동물병원의 진료를 받아야 합니다." },
  { title: "제14조 (Pet사주·PetBTI 등 재미 콘텐츠)", body: "기본 Pet사주, 오늘의 펫운세, 보호자 궁합, Pet타로(오늘의 Pet타로·보호자 궁합·우리 아이 마음·산책·활동·오늘의 조언) 및 PetBTI는 재미와 참고를 위한 콘텐츠이며 과학적 진단, 의학적 판단, 성격 진단 또는 미래 결과를 보장하는 자료가 아닙니다. 보호자 궁합을 위해 입력한 보호자 이름과 생년월일은 현재 구현상 결과 계산에만 일시적으로 사용되며 PetGrow 서버 또는 계정에 저장되지 않습니다." },
  { title: "제14조의2 (Pet음악)", body: "① PetGrow는 강아지·고양이 등을 위한 음원 재생, 1곡 반복·전체 반복, 좋아요, 댓글 및 인기순위 기능을 제공할 수 있으며, 인스트루멘탈·보컬 여부와 휴식·수면·놀이·자연 등 음악 특성 태그를 표시할 수 있습니다.\n② Pet음악은 서비스 내 스트리밍 재생을 원칙으로 하며 별도의 음원 다운로드 기능을 제공하지 않을 수 있습니다. 이용자는 서비스에서 제공되는 음원을 무단 추출·복제·재판매 또는 재배포해서는 안 됩니다.\n③ 즐겨찾기·좋아요·댓글 등 이용자 반응은 개인화된 이용 편의 제공 및 서비스 개선에 활용될 수 있습니다. 댓글에는 Pet톡 게시물과 동일하게 타인의 권리 침해, 불법·유해 콘텐츠 등 금지행위 기준이 적용될 수 있습니다.\n④ PetGrow가 직접 등록하는 음원은 서비스 운영에 필요한 이용 권한을 확인한 범위에서 제공하는 것을 원칙으로 합니다." },
  { title: "제14조의3 (내 주변 Pet 및 장소 이용후기)", body: "① PetGrow는 이용자가 직접 입력한 주소 또는 이용자가 선택한 현재 위치를 기준으로 동물병원·동물약국·펫샵·용품점·미용·호텔·유치원 등 주변 반려동물 관련 장소를 검색해 안내할 수 있습니다. 위치 권한은 선택사항이며, 허용한 경우 현재 위치는 주변 검색, 지도 표시와 각 장소까지의 거리 계산에 사용할 수 있습니다. 위치 권한을 허용하지 않아도 주소 검색은 이용할 수 있습니다. 장소명·업종·주소·전화번호·거리 등 장소정보는 외부 장소정보 제공자의 검색 결과를 기반으로 하며 PetGrow가 해당 업체의 영업상태·서비스 품질·정보 정확성을 보증하지 않습니다.\n② 현재 위치는 이용자가 위치 권한을 허용한 경우에만 현재 위치 주변 검색, 지도 표시와 장소까지의 거리 계산을 위해 일시적으로 사용하며, PetGrow는 현재 구현상 정확한 현재 위치 좌표를 회원 계정이나 장소 후기 DB에 저장하지 않습니다.\n③ 회원은 장소별로 1~5점의 별점과 간단한 이용후기를 작성하고 다른 후기의 좋아요 또는 신고 기능을 이용할 수 있습니다. 후기 내용에 대한 책임은 작성자에게 있으며 욕설·비속어·음란·혐오 표현, 타인의 개인정보, 광고·도배, 허위 또는 권리침해 내용 등 부적절한 내용을 작성해서는 안 됩니다.\n④ PetGrow는 일부 금지 표현과 개인정보 노출을 자동 필터링할 수 있으나 모든 부적절한 내용을 완전히 탐지하는 것을 보장하지 않습니다. 신고된 후기는 운영진 검토 후 숨김 또는 신고 종결 처리될 수 있으며 신고만으로 자동 삭제되지 않습니다.\n⑤ 장소 이용후기는 회원 개인의 경험과 의견이며 해당 업체 또는 PetGrow의 공식 평가·보증이 아닙니다. 진료·건강 관련 판단은 반드시 수의사 등 전문가의 안내를 확인해야 합니다." },
  { title: "제15조 (광고 및 외부 서비스)", body: "① PetGrow는 서비스의 유지·운영을 위해 직접광고, 제휴광고 및 Google AdMob 등 외부 광고 서비스를 제공할 수 있습니다.\n② Google Mobile Ads SDK 사용 시 광고 제공, 분석 및 부정행위 방지를 위해 IP 주소, 앱 실행·탭·동영상 조회 등 이용 상호작용, 앱/SDK 진단정보, Android 광고 ID·App Set ID 등 기기 또는 계정 식별자가 Google에 의해 자동으로 처리될 수 있습니다. 구체적인 처리 범위는 앱 버전, SDK 설정 및 이용자의 기기 설정에 따라 달라질 수 있습니다.\n③ 개인 맞춤형 광고가 제공되는 경우 적용 법령과 Google의 동의 관리 절차에 따라 필요한 안내·동의 또는 선택권을 제공합니다. 이용자는 기기 설정에서 광고 ID를 재설정·삭제하거나 광고 개인정보 보호 관련 설정을 변경할 수 있습니다.\n④ PetGrow는 직접광고의 노출·클릭 및 광고 표시 요청·성공·오류 등의 집계 통계를 운영할 수 있습니다. PetGrow 관리자 화면의 자체 통계는 Google AdMob의 실제 광고 노출수·클릭수·수익 보고서와 구분됩니다.\n⑤ 외부 광고 서비스에는 해당 제공자의 이용약관 및 개인정보처리방침이 적용될 수 있습니다." },
  { title: "제16조 (개인정보 보호 및 광고·제휴 문의)", body: "① 회원 및 이용자의 개인정보 처리에 관한 사항은 PetGrow 개인정보처리방침에 따릅니다.\n② 이용자가 광고·제휴 문의 기능을 사용하는 경우 회사/브랜드명, 담당자명, 이메일, 문의 내용과 선택 입력한 연락처·광고 유형·예산 등의 정보가 상담 및 제휴 검토를 위해 처리될 수 있습니다.\n③ 광고·제휴 문의 정보는 상담 목적 달성 후 삭제하는 것을 원칙으로 하며, 이용자는 help.petgrow@gmail.com을 통해 관련 정보의 열람·정정·삭제를 요청할 수 있습니다." },
  { title: "제17조 (지식재산권)", body: "PetGrow가 직접 제작한 로고, 디자인, 문구, 프로그램 및 콘텐츠에 대한 권리는 PetGrow 또는 정당한 권리자에게 귀속됩니다. 이용자는 권리자의 허락 없이 이를 영리 목적으로 복제·배포·판매 또는 변형해서는 안 됩니다." },
  { title: "제18조 (Pet톡 게시물의 작성 및 책임)", body: "① \"Pet톡\"이란 회원이 등록한 반려동물을 중심으로 사진과 글을 공유하는 PetGrow의 커뮤니티 기능을 말합니다.\n② 회원은 Pet톡에 게시글·댓글(이하 \"게시물\")을 작성할 때 자신이 등록한 반려동물 중 하나를 선택하여 함께 표시할 수 있습니다.\n③ 게시물의 내용에 대한 책임은 작성자 본인에게 있으며, 회원은 다음 각 호에 해당하는 게시물을 작성해서는 안 됩니다.\n1. 광고·홍보성 게시물\n2. 욕설·비방 등 타인을 모욕하거나 명예를 훼손하는 게시물\n3. 음란하거나 부적절한 콘텐츠\n4. 동물학대를 조장하거나 미화하는 콘텐츠\n5. 타인의 개인정보를 노출하는 게시물\n6. 허위 사실이나 반려동물에게 위험할 수 있는 정보를 사실인 것처럼 유포하는 게시물\n7. 동일하거나 유사한 내용을 반복적으로 게시(도배)하는 행위\n8. 그 밖에 관계 법령 또는 본 약관을 위반하는 게시물\n④ 건강·식단 카테고리에 게시되는 내용은 회원 개인의 경험이나 의견이며, PetGrow가 직접 작성하거나 검증한 전문 의료정보가 아닙니다. 반려동물의 건강 문제는 반드시 수의사와 상담해야 합니다." },
  { title: "제19조 (게시물의 저작권 및 이용허락)", body: "① 회원이 Pet톡에 게시한 글과 사진의 저작권은 원칙적으로 해당 게시물을 작성한 회원 본인에게 귀속됩니다.\n② 회원은 게시물을 PetGrow 서비스 내에서 게시·전시·전송하는 데 필요한 범위에서 PetGrow에게 무상으로 이용을 허락한 것으로 봅니다. 이는 게시물의 저작권을 PetGrow에 양도하는 것이 아닙니다.\n③ PetGrow는 게시물을 서비스 운영 목적을 벗어나 회원의 동의 없이 상업적으로 이용하지 않습니다.\n④ 회원은 자신이 작성한 Pet톡 게시글을 공개 또는 비공개로 전환할 수 있으며, 비공개 게시글은 작성자 본인에게만 표시됩니다." },
  { title: "제20조 (신고 및 게시물 관리)", body: "① 회원은 다른 회원의 게시물이 제18조 제3항 각 호에 해당한다고 판단되는 경우 서비스 내 신고 기능을 통해 신고할 수 있습니다.\n② 타인의 권리(저작권, 초상권, 개인정보 등)를 침해하는 게시물을 발견한 경우 help.petgrow@gmail.com으로 침해 사실을 구체적으로 알려 삭제 등 조치를 요청할 수 있습니다.\n③ PetGrow는 신고가 접수되거나 제18조 제3항을 위반한 것으로 확인되는 게시물에 대해 사전 통지 없이 게시물을 숨기거나 삭제할 수 있고, 반복적으로 위반하는 회원의 서비스 이용을 제한할 수 있습니다.\n④ 신고 내용 및 처리 이력은 서비스 운영 및 부정 이용 방지 목적으로 보관될 수 있습니다.\n⑤ 신고된 계정에 대한 이용제한은 운영자의 검토 후 1일·7일·30일 또는 영구 제한으로 적용될 수 있으며, 필요 시 제한을 해제할 수 있습니다. 신고만 접수되었다는 이유만으로 자동 제한하지 않습니다.\n⑥ PetGrow는 욕설·비속어·음란·혐오 표현, 개인정보 노출 등 일부 금지 표현에 대하여 게시글·댓글 작성 단계에서 자동 필터를 적용할 수 있으나 모든 부적절한 콘텐츠를 완전히 탐지하거나 차단하는 것을 보장하지 않습니다." },
  { title: "제21조 (회원탈퇴와 게시물)", body: "회원탈퇴 시 해당 회원이 Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진은 계정 삭제와 동시에 즉시 삭제되며, 삭제된 게시물은 복구할 수 없습니다. 다른 회원이 그 게시글에 남긴 댓글도 게시글과 함께 삭제됩니다." },
  { title: "제22조 (서비스 이용 통계)", body: "PetGrow는 서비스 개선 및 운영을 위해 개인정보를 최소화한 집계 통계를 생성할 수 있습니다. 방문 세션, 메뉴 조회, 앱·웹 이용 비중, 회원·반려동물·Pet톡 활동 및 광고 요청 상태 등 통계가 포함될 수 있으며 관리자 화면에는 개인의 이름·이메일·카카오 식별정보·IP 주소를 표시하지 않습니다. 현재 접속 세션과 일부 이용 통계는 기술적 특성상 추정값이며 정확한 실제 이용자 수를 보장하지 않습니다." },
  { title: "제23조 (서비스 변경 및 종료)", body: "PetGrow는 서비스 개선이나 기술적·운영상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다. 중요한 변경 또는 서비스 종료가 예정된 경우 가능한 범위에서 사전에 안내합니다." },
  { title: "제24조 (책임의 제한)", body: "천재지변, 통신장애, 카카오 인증 서비스 장애 또는 PetGrow가 합리적으로 통제하기 어려운 사유로 서비스 이용에 문제가 발생한 경우 관련 법령에서 허용하는 범위에서 책임이 제한될 수 있습니다. 본 조는 관련 법령상 PetGrow가 부담해야 하는 책임을 부당하게 배제하는 것으로 해석되지 않습니다." },
  { title: "제25조 (분쟁 해결 및 준거법)", body: "본 약관은 대한민국 법령을 준거법으로 합니다. PetGrow와 이용자 사이에 분쟁이 발생하는 경우 상호 원만한 해결을 위해 노력하며 관할법원은 관계 법령에서 정하는 바에 따릅니다." },
  { title: "부칙", body: "본 약관은 2026년 8월 17일부터 시행합니다.\n최종 업데이트: 2026년 8월 17일" },
];
const TERMS_SECTIONS_EN = [
  { title: "Article 1 (Purpose)", body: "These Terms set out the conditions of use for the website, mobile application, and related services provided by PetGrow, and the rights, obligations, and responsibilities of PetGrow and users." },
  { title: "Article 2 (Definitions)", body: "① \"Service\" means pet registration, growth info, Saju, PetBTI, Pet Info, and other related features provided by PetGrow.\n② \"User\" means anyone who uses the PetGrow service.\n③ \"Member\" means a person who creates an account via Kakao Login and uses the service.\n④ \"Account\" means PetGrow user information created to identify members and store per-user data.\n⑤ \"Pet Information\" means a pet's name, species, breed, date of birth, sex, weight, profile photo, and other related information registered by a member." },
  { title: "Article 3 (Effect and Amendment of Terms)", body: "These Terms take effect when posted on the service. PetGrow may amend these Terms as needed, within the bounds of applicable law, and will announce material changes within the service." },
  { title: "Article 4 (Membership and Service Agreement)", body: "A service agreement may be formed once a user completes an authentication procedure provided by PetGrow (such as Kakao Login) and agrees to the required terms and personal-information procedures." },
  { title: "Article 5 (Kakao Login)", body: "① PetGrow may provide Kakao Login, using Kakao's external authentication service, for member convenience.\n② Members may log in to PetGrow using their Kakao account.\n③ Login may be temporarily limited due to Kakao service outages, policy changes, or the status of a user's Kakao account.\n④ Kakao's own Terms of Service and Privacy Policy may apply to the Kakao authentication service itself." },
  { title: "Article 6 (Account and Login Session Management)", body: "Members must securely manage their own Kakao account. PetGrow's core features may be provided to logged-in members, and account data stored on the server is not deleted upon logout. Logging in again with the same Kakao account lets you retrieve your saved information." },
  { title: "Article 7 (Provision of Service)", body: "PetGrow may provide services including registering/managing pets, growth prediction and growth info, basic Pet Saju, Daily Pet Fortune, Guardian Compatibility, PetBTI, Pet Music (playback, looping, likes, comments, and popularity rankings), Pet Info, the Pet Talk community, member-info/nickname/activity management, and per-account data storage and cross-device sync." },
  { title: "Article 8 (Data Storage and Sync)", body: "Pet information and certain service results registered by a logged-in member may be stored on our servers or cloud storage, linked to the member's account. Accordingly, the service does not describe data as being stored 'only on this device' or 'only in this browser.' Logging in with the same Kakao account lets you retrieve saved information on other supported devices or the web. Local data predating Kakao Login may be subject to a separate migration process." },
  { title: "Article 9 (User Obligations)", body: "Users must not impersonate or misuse another person's account or information, interfere with normal system operation, exploit vulnerabilities, unlawfully collect data, infringe the rights of PetGrow or third parties, or violate applicable law." },
  { title: "Article 10 (Restriction of Service Use)", body: "If a user violates these Terms or applicable law, or interferes with stable operation, PetGrow may restrict use or terminate the service agreement to the necessary extent. For Pet Talk policy violations, an administrator may review the report and violation and apply or remove a 1-day, 7-day, 30-day, or permanent Pet Talk restriction. A report alone does not automatically restrict an account, and moderation actions may be logged for operational and security purposes." },
  { title: "Article 10-2 (Pet Talk Nickname and Public Information)", body: "Members may set or change the nickname displayed on Pet Talk from the member-info editing feature. Pet Talk posts and comments may display the member-selected nickname together with some information about the selected pet. Kakao account identifiers and login credentials are not disclosed to other members." },
  { title: "Article 11 (Withdrawal and Termination)", body: "Members may terminate the service agreement at any time via the in-service account withdrawal feature. Upon completion, the member account and connected personal information and stored data are deleted, except for information that must be separately retained under applicable law." },
  { title: "Article 12 (Pet-Related Information and Calculated Results)", body: "PetGrow's growth predictions, weight calculations, and other pet-related information are reference information based on general data and information entered by the user, and do not guarantee actual outcomes." },
  { title: "Article 13 (Health-Related Information)", body: "Health, diet, nutrition, and care information provided by PetGrow is general reference information and does not replace examination, diagnosis, or treatment by a veterinarian. If your pet shows abnormal symptoms or an emergency, please see a veterinarian or animal hospital." },
  { title: "Article 14 (Saju, PetBTI, and Other Entertainment Content)", body: "Saju and PetBTI are content for entertainment and reference purposes, and are not scientific diagnosis, medical judgment, or a guarantee of future outcomes." },
  { title: "Article 14-2 (Pet Music)", body: "① PetGrow may provide music playback for dogs, cats, and other pets, including single-track loop, all-track loop, likes, comments, and popularity rankings.\n② Pet Music is primarily provided for in-service streaming. A separate audio download feature may not be provided, and users must not extract, reproduce, resell, or redistribute the audio without authorization.\n③ Likes and comments may be used to calculate popularity rankings and improve the service. Music comments may be subject to the same prohibited-content and rights-protection standards that apply to Pet Talk content.\n④ Music uploaded directly by PetGrow is intended to be provided only where PetGrow has confirmed the rights necessary for service operation." },
  { title: "Article 14-3 (Nearby Pet and Place Reviews)", body: "PetGrow may show nearby pet-related places based on a user-authorized current location or a manually entered area. Place names, categories, addresses, phone numbers, and distances are based on external place-search data and are not guaranteed by PetGrow. Current precise coordinates are used transiently for nearby search and are not stored in the member account or place-review database in the current implementation. Members may submit 1–5 star ratings, short reviews, likes, and reports. Abusive, sexual, hateful, privacy-exposing, spam, misleading, or rights-infringing content is prohibited. PetGrow may apply automated filters and may hide reported reviews after administrator review. Reviews represent individual members' experiences and are not official ratings or guarantees by PetGrow or the business." },
  { title: "Article 15 (Advertising and External Services)", body: "PetGrow may use external services such as advertising, Kakao authentication, and Google AdMob to operate the service. Google is not provided as a login method; the terms and privacy policy of external providers apply only to services actually used, such as advertising. PetGrow may record aggregate counts of ad display requests, successful display requests, and errors for operational monitoring. These internal figures are not verified impressions, clicks, or revenue; official AdMob or advertising-platform reports remain the source for such figures." },
  { title: "Article 16 (Protection of Personal Information)", body: "Matters regarding processing of members' personal information follow the PetGrow Privacy Policy." },
  { title: "Article 17 (Intellectual Property)", body: "Rights to logos, designs, text, programs, and content created directly by PetGrow belong to PetGrow or its rightful owners. Users must not reproduce, distribute, sell, or modify these for commercial purposes without the rights holder's permission." },
  { title: "Article 18 (Posting and Responsibility on Pet Talk)", body: "① \"Pet Talk\" means PetGrow's community feature for sharing photos and posts centered on a member's registered pet.\n② When posting or commenting on Pet Talk (\"Content\"), members may select one of their registered pets to display alongside it.\n③ Members are responsible for their own Content and must not post Content that:\n1. Is advertising or promotional in nature\n2. Insults or defames others, including abusive language\n3. Is sexual or otherwise inappropriate\n4. Promotes or glorifies animal abuse\n5. Exposes another person's personal information\n6. Spreads false or potentially dangerous information as if it were fact\n7. Repeats the same or similar content excessively (spam)\n8. Otherwise violates applicable law or these Terms\n④ Content in the Health & Diet category reflects individual members' experience or opinions, not professional medical information written or verified by PetGrow. Always consult a veterinarian for your pet's health issues." },
  { title: "Article 19 (Copyright and License to Content)", body: "① Copyright in text and photos a member posts on Pet Talk belongs, in principle, to that member.\n② By posting, a member grants PetGrow a free license to display, exhibit, and transmit the Content to the extent necessary to operate the service within PetGrow. This is not a transfer of copyright to PetGrow.\n③ PetGrow will not use Content commercially beyond the purpose of operating the service without the member's consent.\n④ Members may switch their own Pet Talk posts between public and private; private posts are shown only to the author." },
  { title: "Article 20 (Reports and Content Moderation)", body: "① Members may report another member's Content believed to violate Article 18(3) using the in-service report feature.\n② If you find Content that infringes your rights (copyright, likeness, personal information, etc.), you may contact help.petgrow@gmail.com with specifics to request removal or other action.\n③ PetGrow may hide or delete reported Content, or Content confirmed to violate Article 18(3), without prior notice, and may restrict the service access of members who repeatedly violate these Terms.\n④ Report content and handling history may be retained for service operation and fraud-prevention purposes.\n⑤ Following administrator review, a reported account may receive a 1-day, 7-day, 30-day, or permanent Pet Talk restriction, which may later be removed. Reports do not trigger automatic restrictions.\n⑥ PetGrow may automatically filter certain prohibited expressions, including abusive, sexual, hateful, or privacy-exposing content, when posts or comments are submitted, but does not guarantee that every inappropriate item will be detected or blocked." },
  { title: "Article 21 (Account Withdrawal and Content)", body: "Upon account withdrawal, that member's Pet Talk posts, comments, likes, and attached photos are deleted immediately along with the account, and cannot be recovered. Other members' comments on a deleted post are also deleted along with that post." },
  { title: "Article 22 (Service Usage Analytics)", body: "PetGrow may create privacy-minimized aggregate analytics for service improvement and operations, including visit sessions, menu views, web/app platform share, membership/pet/Pet Talk activity, and ad-request status. The admin dashboard does not display individual names, email addresses, Kakao identifiers, or IP addresses. Current-session and certain usage metrics are estimates and do not guarantee an exact count of real users." },
  { title: "Article 23 (Changes to and Discontinuation of Service)", body: "PetGrow may change all or part of the service for improvement or operational/technical reasons. Where a material change or discontinuation is planned, PetGrow will provide advance notice where reasonably possible." },
  { title: "Article 24 (Limitation of Liability)", body: "Where an issue arises from force majeure, communication failure, a Kakao authentication service outage, or a cause PetGrow cannot reasonably control, PetGrow's liability may be limited to the extent permitted by applicable law. This article shall not be construed as unfairly excluding liability that PetGrow must bear under applicable law." },
  { title: "Article 25 (Dispute Resolution and Governing Law)", body: "These Terms are governed by the laws of the Republic of Korea. PetGrow and users will make good-faith efforts to resolve disputes amicably, and jurisdiction follows applicable law." },
  { title: "Addendum", body: "These Terms take effect on August 16, 2026.\nLast updated: August 16, 2026." },
];

function LegalContent({ title, intro, sections, contactExtra, showLogo = false }) {
  const t = useT();
  return (
    <div className="legal-page-shell">
      {showLogo && (
        <button type="button" onClick={() => { window.location.href = "/"; }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20 }}>
          <PetGrowLogo style={{ width: 22, height: 22 }} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Jua',sans-serif" }}>
            <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
          </span>
        </button>
      )}
      <h1 className="legal-page-title">{title}</h1>
      {intro && <p className="legal-page-intro">{intro}</p>}
      <div className="legal-section-list">
        {sections.map((s, index) => (
          <section className="legal-section-card" key={s.title}>
            <div className="legal-section-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="legal-section-content">
              <div className="legal-section-title">{s.title}</div>
              <div className="legal-section-body">{s.body}</div>
            </div>
          </section>
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

function PrivacyContent({ showLogo = false }) {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS_KO;
  return <LegalContent title={t.privacyTitle} intro={t.privacyIntro} sections={sections} showLogo={showLogo} />;
}

function TermsContent() {
  const lang = useLang();
  const t = useT();
  const sections = lang === "en" ? TERMS_SECTIONS_EN : TERMS_SECTIONS_KO;
  return <LegalContent title={t.termsTitle} intro={t.termsIntro} sections={sections} />;
}

// petgrow.co.kr/privacy, /terms 로 실제 배포됐을 때 직접 접속하는 경우를 위한 독립 페이지 (로그인 없이 접근 가능)
function PrivacyPage() {
  
<style>{`
/* PETGROW_UI_BATCH_20260818 */
:root{--pg-ink:#1f2a24;--pg-sub:#68736c;--pg-border:#e5e9e5;--pg-soft:#f7f9f7;--pg-accent:#467a56}
.petpoint-card,.petpoint-policy,.petpoint-about,.petpoint-guide-hero,.petpoint-admin,.petpoint-visible{background:#fff!important;background-image:none!important;border-color:var(--pg-border)!important;box-shadow:0 10px 28px rgba(31,42,36,.06)!important;color:var(--pg-ink)!important}
.petpoint-card p,.petpoint-guide-hero p,.petpoint-about p,.petpoint-policy p,.petpoint-visible p{color:var(--pg-sub)!important}
.petpoint-head h2,.petpoint-history-head b,.petpoint-card b,.petpoint-card strong{color:var(--pg-ink)}
.petpoint-head>strong{color:var(--pg-accent)!important}
.petpoint-live-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
.petpoint-live-stats>div,.petpoint-costs span,.petpoint-guide p,.petpoint-history-list,.petpoint-mini-grid span{background:#fff!important;border-color:var(--pg-border)!important}
.petpoint-costs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.petpoint-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.mypage-point-top{order:-20;width:100%;margin:0 0 16px}
.mypage-point-top .petpoint-card{max-width:none!important;margin:0 0 16px!important}
/* Ten-item menu / guide groups: two cards per row = 2 x 5 */
.info-guide-grid,.guide-grid,.petinfo-guide-grid,.menu-guide-grid,.service-guide-grid,.feature-guide-grid,.more-menu-grid.ten-items,.quick-menu-grid.ten-items{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;background:#fff!important}
.info-guide-grid>* ,.guide-grid>* ,.petinfo-guide-grid>* ,.menu-guide-grid>* ,.service-guide-grid>* ,.feature-guide-grid>*{background:#fff!important;border:1px solid var(--pg-border)!important;color:var(--pg-ink)!important;box-shadow:0 6px 20px rgba(31,42,36,.04)!important}
/* Our Pet title uses the same left edge and vertical rhythm as other main pages */
.pets-page .petgrow-unified-hero,.my-pets-page .petgrow-unified-hero,.pet-profile-page .petgrow-unified-hero{margin-top:0!important;text-align:left!important}
.pets-page .petgrow-unified-hero h1,.my-pets-page .petgrow-unified-hero h1,.pet-profile-page .petgrow-unified-hero h1{margin-left:0!important;text-align:left!important}
@media(max-width:760px){
  .petpoint-card{margin-left:0!important;margin-right:0!important;border-radius:18px!important;padding:16px!important}
  .petpoint-head{align-items:flex-start!important}.petpoint-head p{font-size:12px!important;line-height:1.55!important}.petpoint-head>strong{font-size:24px!important}
  .petpoint-live-stats,.petpoint-costs,.petpoint-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .info-guide-grid,.guide-grid,.petinfo-guide-grid,.menu-guide-grid,.service-guide-grid,.feature-guide-grid,.more-menu-grid.ten-items,.quick-menu-grid.ten-items{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
  .nearby-location-actions,.nearby-search-actions,.nearby-toolbar,.nearby-search-row,.nearby-location-row{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:8px!important;width:100%!important}
  .nearby-location-actions>button,.nearby-search-actions>button,.nearby-toolbar>button,.nearby-search-row>button,.nearby-location-row>button{flex:1 1 0!important;min-width:0!important;white-space:nowrap!important;padding-left:8px!important;padding-right:8px!important}
}

/* PETGROW_FINAL_TYPOGRAPHY_20260817 */
.bboggl-root,button,input,textarea,select{font-family:inherit}
.bboggl-root{font-synthesis:none;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
button,input,textarea,select{letter-spacing:inherit}
`}</style>
return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0" }}>
        <PrivacyContent showLogo />
      </div>
    </div>
  );
}
function TermsPage() {
  return (
    <div className="bboggl-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0" }}>
        <><TermsContent /><PetNewsTermsAddendum /><PetPointPolicyAddendum type="terms" /></>
      </div>
    </div>
  );
}

/* ============================================================
   로그인 / 회원가입 (데모 — Supabase Auth 연동 전 UI 목업)
   카카오 간편로그인 전용. 실제 인가 코드 교환/세션 발급은 서버(/api/auth/kakao/*)에서 처리해요.
   ============================================================ */
const CONSENT_VERSION = "2026-08-16-v2";
const CONSENT_STORAGE_KEY = "petgrow:consent";

function LoginScreen({ onGoTerms, onGoPrivacy }) {
  const t = useT();
  const [termsOk, setTermsOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [marketingOk, setMarketingOk] = useState(false);
  const [consentCompleted, setConsentCompleted] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [detail, setDetail] = useState(null);

  // 현재 약관 버전에 이미 필수 동의를 완료한 이용자는 다시 체크하지 않도록 해요.
  // 약관/개인정보처리방침의 중요한 내용이 바뀌어 CONSENT_VERSION을 올리면 자동으로 재동의를 받습니다.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const valid = saved?.version === CONSENT_VERSION && saved?.terms === true && saved?.privacy === true;
      if (valid) {
        setTermsOk(true);
        setPrivacyOk(true);
        setMarketingOk(!!saved.marketing);
        setConsentCompleted(true);
      }
    } catch {}
    setConsentChecked(true);
  }, []);

  const allChecked = termsOk && privacyOk && marketingOk;
  const setAll = (checked) => { setTermsOk(checked); setPrivacyOk(checked); setMarketingOk(checked); };
  const startLogin = () => {
    if (!consentCompleted && (!termsOk || !privacyOk)) {
      window.alert("필수 약관과 개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    // 최초 동의이거나 현재 화면에서 동의 내용을 변경한 경우에만 현재 버전으로 저장합니다.
    if (!consentCompleted) {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
          version: CONSENT_VERSION, terms: true, privacy: true, marketing: !!marketingOk,
          agreedAt: new Date().toISOString()
        }));
        setConsentCompleted(true);
      } catch {}
    }
    goToKakaoLogin();
  };
  return (
    <div style={{ maxWidth: 420, margin: "32px auto 0", textAlign: "center" }}>
      <PetGrowLogo style={{ width: 56, height: 56, margin: "0 auto 14px" }} />
      <h2 style={{ fontSize: 20, fontFamily: "'Jua',sans-serif", marginBottom: 6 }}>
        <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span> 🐾
      </h2>
      <p className="bg-sub" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>{t.loginTagline}</p>

      {consentChecked && !consentCompleted && <>
        <div className="consent-box">
          <label className="consent-all"><input type="checkbox" checked={allChecked} onChange={e=>setAll(e.target.checked)}/><strong>전체 동의</strong></label>
          <div className="consent-divider"/>
          <label className="consent-row"><input type="checkbox" checked={termsOk} onChange={e=>setTermsOk(e.target.checked)}/><span><b>[필수]</b> 이용약관 동의</span><button type="button" onClick={(e)=>{e.preventDefault();setDetail("terms")}}>보기</button></label>
          <label className="consent-row"><input type="checkbox" checked={privacyOk} onChange={e=>setPrivacyOk(e.target.checked)}/><span><b>[필수]</b> 개인정보 수집·이용 동의</span><button type="button" onClick={(e)=>{e.preventDefault();setDetail("privacy")}}>보기</button></label>
          <label className="consent-row"><input type="checkbox" checked={marketingOk} onChange={e=>setMarketingOk(e.target.checked)}/><span><em>[선택]</em> 광고·마케팅 정보 수신 동의</span><button type="button" onClick={(e)=>{e.preventDefault();setDetail("marketing")}}>보기</button></label>
        </div>
        <p className="bg-sub" style={{fontSize:11,lineHeight:1.5,marginTop:-4,marginBottom:10}}>선택 동의는 거부해도 PetGrow 기본 서비스를 이용할 수 있어요.</p>
      </>}

      {consentChecked && consentCompleted && <div className="consent-complete-note">✓ 필수 약관 동의 완료 · 다음 로그인부터는 다시 묻지 않아요.</div>}

      <button type="button" className="kakao-login-btn" onClick={startLogin} disabled={!consentChecked}>
        <KakaoIcon style={{ width: 20, height: 20 }} /> {t.loginContinueKakao}
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 18 }}>
        <button type="button" onClick={onGoTerms} style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.termsFooterLink}</button>
        <button type="button" onClick={onGoPrivacy} style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.privacyFooterLink}</button>
      </div>

      <Modal open={!!detail} onClose={()=>setDetail(null)} width={520}>
        {detail==="terms" && <><h3>이용약관 동의</h3><p className="consent-detail-text">PetGrow의 회원가입, 서비스 이용, 계정 및 데이터 저장·동기화, Pet톡 운영, 광고 및 외부서비스 등에 관한 이용약관에 동의합니다.</p><button className="bg-btn" onClick={()=>{setTermsOk(true);setDetail(null)}}>동의하고 닫기</button></>}
        {detail==="privacy" && <><h3>개인정보 수집·이용 동의</h3><div className="consent-detail-text"><b>수집 항목</b><br/>카카오 사용자 고유 식별정보, 실제 동의받아 제공되는 닉네임·프로필 이미지, 반려동물 이름·종류·품종·생년월일·성별·현재 체중·프로필 사진, PetBTI 결과, Pet사주·Pet타로 결과 및 이용자가 저장한 타로 기록 등 저장되는 서비스 정보, 내 주변 Pet 후기·별점·좋아요·신고 기록. <br/><br/><b>선택적 위치 권한</b><br/>현재 위치는 필수 회원정보가 아닙니다. 위치 권한을 허용한 경우에만 현재 위치 주변 검색, 지도에 내 위치 표시, 장소까지의 거리 계산을 위해 일시적으로 사용하며 계정에 저장하지 않습니다. 위치 권한을 거부해도 주소 검색과 회원 기능은 이용할 수 있습니다.<br/><br/><b>이용 목적</b><br/>회원 식별·계정 관리, 반려동물 프로필 및 PetGrow 서비스 제공, 계정별 데이터 저장·동기화<br/><br/><b>보유 기간</b><br/>회원 탈퇴 시까지 또는 처리 목적 달성 시까지. 관계 법령상 보관 의무가 있는 경우 해당 기간 동안 보관할 수 있습니다.<br/><br/><b>동의 거부권</b><br/>동의를 거부할 수 있으나 필수 정보이므로 회원 서비스 이용이 제한될 수 있습니다.</div><button className="bg-btn" onClick={()=>{setPrivacyOk(true);setDetail(null)}}>동의하고 닫기</button></>}
        {detail==="marketing" && <><h3>광고·마케팅 정보 수신 동의 (선택)</h3><div className="consent-detail-text">PetGrow의 이벤트, 새 기능, 제휴 또는 프로모션 관련 안내를 받을 수 있도록 선택 동의를 받습니다. 동의하지 않아도 기본 서비스 이용에는 제한이 없습니다. 실제 마케팅 발송 기능을 운영하는 경우 동의한 범위에서만 이용합니다.</div><button className="bg-btn" onClick={()=>{setMarketingOk(true);setDetail(null)}}>동의하고 닫기</button></>}
      </Modal>
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
  const t=useT(),lang=useLang();
  useEffect(()=>{if(!open)return;const prev=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=prev}},[open]);
  const groups=[
    {label:lang==="en"?"PET LIFE":"반려생활",items:[{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon},{key:"music",label:lang==="en"?"Pet Music":"Pet음악",Icon:MusicIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":"Pet뉴스",Icon:InfoIcon},{key:"about",label:t.aboutNav,Icon:InfoIcon}]}
  ];
  const Btn=({item})=>{const Icon=item.Icon;return <button type="button" className={`ham-nav-item ${view===item.key?"active":""}`} onClick={()=>{onNavigate(item.key);onClose()}}><Icon style={{width:18,height:18}}/><span>{item.label}</span></button>};
  return <><div className={`ham-overlay ${open?"open":""}`} onClick={onClose}/><div className={`ham-panel ${open?"open":""}`} role="dialog"><div className="ham-panel-header"><span style={{fontWeight:800,fontFamily:"'Jua',sans-serif",fontSize:16}}><span style={{color:"var(--text)"}}>Pet</span><span style={{color:"var(--primary)"}}>Grow</span></span><button type="button" className="icon-btn" onClick={onClose} aria-label={t.hamCloseAria}><CloseIcon style={{width:18,height:18}}/></button></div><nav className="ham-nav ham-nav-grouped"><Btn item={{key:"home",label:t.hamNavHome,Icon:HomeIcon}}/>{groups.map(g=><div className="ham-nav-group" key={g.label}><div className="ham-section-label">{g.label}</div>{g.items.map(x=><Btn key={x.key} item={x}/>)}</div>)}<div className="ham-divider"/><Btn item={{key:"my",label:t.hamNavMy,Icon:UserIcon}}/><button type="button" className="ham-nav-item" onClick={()=>{onOpenAccount();onClose()}}><SettingsIcon style={{width:18,height:18}}/><span>{t.hamNavSettings}</span></button></nav></div></>;
}

function normalizeNickname(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function validateNicknameLocal(value = "") {
  const nickname = normalizeNickname(value);
  const reserved = ["admin","administrator","manager","moderator","관리자","petgrow","펫그로우","공식","official","staff","support","고객센터"];
  const blocked = [
    /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐/i,
    /섹스|sex|야동|porn|포르노|자위|딸딸|보지|자지|음란/i,
    /혐오|나치|nazi/i
  ];

  if (!nickname) return { ok:false, reason:"empty", message:"닉네임을 입력해 주세요." };
  if (nickname.length < 2 || nickname.length > 8) {
    return { ok:false, reason:"length", message:"닉네임은 2~8자 이내로 입력해 주세요." };
  }
  if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(nickname) || /(?:01[016789])[-\s]?\d{3,4}[-\s]?\d{4}/.test(nickname)) {
    return { ok:false, reason:"private", message:"전화번호나 이메일은 닉네임으로 사용할 수 없어요." };
  }
  if (reserved.some((word) => nickname.toLowerCase().includes(word.toLowerCase()))) {
    return { ok:false, reason:"reserved", message:"운영자나 공식 계정으로 오해할 수 있는 닉네임은 사용할 수 없어요." };
  }
  const compact = nickname.replace(/\s/g, "");
  if (blocked.some((rule) => rule.test(compact))) {
    return { ok:false, reason:"blocked", message:"사용할 수 없는 표현이 포함된 닉네임이에요. 다른 닉네임을 사용해 주세요." };
  }
  return { ok:true, nickname };
}

function AccountModal({ open, onClose, account, onLogout, onRequestDelete, onNicknameUpdated, onOpenAdmin }) {
  const t = useT();
  const [nickname, setNickname] = useState(account?.name || "");
  const [saving, setSaving] = useState(false);
  const [adminEntry, setAdminEntry] = useState(null);

  useEffect(() => {
    setNickname(account?.name || "");
  }, [account?.name, open]);

  useEffect(() => {
    let alive = true;
    if (!open || !account) {
      setAdminEntry(null);
      return () => { alive = false; };
    }
    adminStatus()
      .then((s) => { if (alive) setAdminEntry(s); })
      .catch(() => { if (alive) setAdminEntry(null); });
    return () => { alive = false; };
  }, [open, account?.id]);

  async function saveNickname() {
    if (saving) return;
    const checked = validateNicknameLocal(nickname);
    if (!checked.ok) {
      window.alert(checked.message);
      return;
    }
    if (normalizeNickname(account?.name || "") === checked.nickname) {
        window.alert("현재 사용 중인 닉네임과 같아요.");
      return;
    }
    if (!window.confirm("닉네임을 변경하시겠습니까?")) return;

    setSaving(true);
    try {
      const result = await apiJson("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: checked.nickname }),
      });
      const savedName = result?.name || checked.nickname;
      setNickname(savedName);
      onNicknameUpdated?.(savedName);
        window.alert("닉네임이 저장되었어요.");
    } catch (e) {
      window.alert(e?.message || "닉네임 저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  const showAdminEntry = !!adminEntry && (!adminEntry.adminExists || adminEntry.isAdmin || adminEntry.recoveryAvailable);
  const adminLabel = adminEntry?.isAdmin
    ? "관리자센터"
    : (adminEntry?.adminExists ? "관리자 등록/복구" : "최초 관리자 등록");

  return (
    <Modal open={open} onClose={onClose} width={410} closeOnBackdrop={false} cardClassName="account-settings-modal">
      

      <div className="account-settings-header">
        <div className="account-settings-title">
          <UserIcon style={{ width: 20, height: 20, color: "var(--primary)" }} />
          <h3 style={{ fontSize: 18 }}>{t.accountSettingsTitle}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" title="닫기" className="account-modal-close">×</button>
      </div>

      {account && (<>
        <div className="bg-surface-card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {account.profileImage ? (
            <img src={account.profileImage} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserIcon style={{ width: 20, height: 20 }} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{account.name}</div>
            <div className="bg-sub" style={{ fontSize: 12 }}>{t.accountKakaoTag}</div>
            {account.accountCode && <div className="bg-sub" style={{ fontSize: 11, marginTop: 2 }}>{t.accountCodeLabel} · ••••{account.accountCode}</div>}
          </div>
        </div>

        <div className="bg-surface-card" style={{ marginBottom: 10 }}>
          <label className="bg-label">{t.accountNicknameLabel}</label>
          <input
            className="bg-input"
            value={nickname}
            maxLength={8}
            onChange={(e) => setNickname(e.target.value)}
          />
          <div className="bg-sub" style={{ fontSize: 11, marginTop: 6 }}>2~8자 · Pet톡 게시글과 댓글에 표시돼요.</div>

          <div className="nickname-action-row nickname-action-single">
            <button
              type="button"
              className="bg-btn nickname-change-btn"
              onClick={saveNickname}
              disabled={saving}
            >
              {saving ? "변경 중..." : "닉네임 변경하기"}
            </button>
          </div>
        </div>

        {adminEntry===null && account && (
          <button type="button" className="bg-btn admin-entry-account-btn admin-entry-loading" style={{width:"100%",marginBottom:12}} disabled>
            🛡️ 관리자 확인 중...
          </button>
        )}
        {showAdminEntry && (
          <button
            type="button"
            className="bg-btn admin-entry-account-btn"
            style={{ width: "100%", marginBottom: 12 }}
            onClick={() => { onClose(); onOpenAdmin?.(); }}
          >
            🛡️ {adminLabel}
          </button>
        )}

        <div className="bg-sub" style={{ fontSize: 10.5, lineHeight: 1.45, marginBottom: 8 }}>{t.accountFreshLoginHelp}</div>
      </>)}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button type="button" className="bg-btn bg-btn-ghost" onClick={()=>{onClose();window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:"support"}));}}>📢 공지사항 · 문의/피드백</button>
        <button type="button" className="bg-btn bg-btn-ghost" onClick={onLogout}>{t.accountLogoutBtn}</button>
        <button type="button" className="bg-btn bg-btn-ghost" style={{ color: "#C0392B" }} onClick={onRequestDelete}>{t.accountDeleteBtn}</button>
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
        {items.length > 0 && <�my��$z{-���jםrrentWeightKg={latest.weightKg} statusDiffGrams={latest.diffGrams} />
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
const ILLUST_GREEN = "#4F8A5B";
const ILLUST_GREEN_LIGHT = "#DCEED4";
const ILLUST_CREAM = "#FBF8F1";
const ILLUST_DARK = "#243229";

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
function CommunityMockCard({ Illust, photoSrc, name, breed, timeLabel, text, likeCount, commentCount, dim }) {
  return (
    <div className="cm-mock-card" style={dim ? { opacity: 0.55, transform: "scale(0.96)" } : undefined}>
      <div className="cm-mock-header">
        <span className="cm-mock-avatar"><Illust style={{ width: 22, height: 22 }} /></span>
        <div>
          <div className="cm-mock-name">{name} <span className="cm-mock-breed">· {breed}</span></div>
          <div className="cm-mock-time">{timeLabel}</div>
        </div>
      </div>
      <div className="cm-mock-photo">
        {photoSrc ? <img src={photoSrc} alt={`${name} Pet톡 게시글 예시`} loading="lazy" /> : <Illust style={{ width: 46, height: 46 }} />}
      </div>
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
        <polyline points="0,58 40,50 80,40 120,34 160,24 200,16 240,10" fill="none" stroke="#4F8A5B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="240" cy="10" r="5" fill="#4F8A5B" />
      </svg>
    </div>
  );
}
function MiniAlbumCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-label">성장앨범</div>
      <div className="mock-photos">
        <div className="mock-photo"><PawIcon style={{ width: 22, height: 22, color: "#4F8A5B" }} /></div>
        <div className="mock-photo mock-photo-alt"><CatIcon style={{ width: 22, height: 22, color: "#223027" }} /></div>
        <div className="mock-photo"><CameraIcon style={{ width: 20, height: 20, color: "#4F8A5B" }} /></div>
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
        <div className="mock-checklist-icon"><BowlIcon style={{ width: 16, height: 16, color: "#4F8A5B" }} /></div>
        <div className="mock-checklist-text">사료 급여량 참고</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ShieldIcon style={{ width: 16, height: 16, color: "#4F8A5B" }} /></div>
        <div className="mock-checklist-text">예방접종·건강관리</div>
      </div>
      <div className="mock-checklist-row">
        <div className="mock-checklist-icon"><ScaleIcon style={{ width: 16, height: 16, color: "#4F8A5B" }} /></div>
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
            <div className="cat-badge"><CatIcon style={{ width: 60, height: 60, color: "#4F8A5B" }} /></div>
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

      <section className="landing-section" style={{ paddingTop: 18, paddingBottom: 18 }}>
        <div className="landing-wrap">
          <button type="button" className="bg-card" onClick={()=>window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:"ad-inquiry"}))}
            style={{ width:"100%", border:"1px solid rgba(79,138,91,.22)", cursor:"pointer", textAlign:"left", padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <span><strong style={{display:"block",fontSize:16,marginBottom:4}}>🤝 PetGrow 광고 · 제휴</strong><small className="bg-sub">배너 광고, 브랜드 제휴, 스폰서십을 문의해보세요.</small></span>
            <span style={{fontSize:24,color:"var(--primary)"}}>›</span>
          </button>
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
              <span style={{ color: "#fff" }}>Pet</span><span style={{ color: "#A9C8AE" }}>Grow</span>
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
      <button className="footer-ad-inquiry" onClick={()=>window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:"ad-inquiry"}))}>광고·제휴 문의</button></footer>
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
const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_TLyxaX";
const KAKAO_CHAT_URL = `${KAKAO_CHANNEL_URL}/chat`;
const SOCIAL_LINKS = [
  { id: "youtube", url: "https://www.youtube.com/@petgrow_official", icon: YoutubeIcon, color: "#FF0000" },
  { id: "instagram", url: "https://www.instagram.com/petgrow_official", icon: InstagramIcon, color: "#E1306C" },
  { id: "threads", url: "https://www.threads.com/@petgrow_official", icon: ThreadsIcon, color: "#223027" },
  { id: "tiktok", url: "https://www.tiktok.com/@petgrow_official", icon: TiktokIcon, color: "#223027" },
  { id: "blog", url: "https://blog.naver.com/petgrow", icon: BlogIcon, color: "#03C75A" },
  { id: "clip", url: "https://naver.me/FORGDLhE", icon: ClipIcon, color: "#03C75A" },
  { id: "kakao", url: KAKAO_CHANNEL_URL, icon: KakaoChannelIcon, color: "#FEE500" },
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
  const lang = useLang();
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
            <div className="cat-badge"><CatIcon style={{ width: 72, height: 72, color: "#4F8A5B" }} /></div>
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

      {/* 핵심 기능 한눈에 보기 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{t.landingCoreFeaturesTitle}</h2>
          <p style={{ textAlign: "center", color: "#89928C", fontSize: 15, marginBottom: 8 }}>{t.landingCoreFeaturesSubtitle}</p>
          <div className="landing-features">
            <LandingFeatureCard Illust={IllustMyPets} title={t.landingCardMyPetsTitle} desc={t.landingCardMyPetsDesc} />
            <LandingFeatureCard Illust={IllustGrowth} title={t.landingCardGrowthTitle} desc={t.landingCardGrowthDesc} />
            <LandingFeatureCard Illust={IllustSaju} title={t.landingCardSajuTitle} desc={t.landingCardSajuDesc} />
            <LandingFeatureCard Illust={SajuIcon} title={lang === "en" ? "🃏 Pet Tarot" : "🃏 Pet타로"} desc={lang === "en" ? "Draw one Major Arcana card per topic each day and save the reading." : "오늘·궁합·마음·산책·조언 주제별로 하루 한 장을 뽑고 결과를 저장해요."} />
            <LandingFeatureCard Illust={IllustPetBti} title={t.landingCardPetBtiTitle} desc={t.landingCardPetBtiDesc} />
            <LandingFeatureCard Illust={MusicIcon} title={lang === "en" ? "🎵 Pet Music" : "🎵 Pet음악"} desc={lang === "en" ? "Music for dogs and cats with loop playback, likes, comments and a live Top 5." : "강아지·고양이 음악을 반복재생하고 좋아요·댓글로 인기 TOP5를 함께 만들어요."} />
            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />
            <LandingFeatureCard Illust={InfoIcon} title={lang === "en" ? "📰 Pet News" : "📰 Pet뉴스"} desc={lang === "en" ? "Recent pet-related news with direct links to original publishers." : "반려동물 관련 최신 뉴스를 사진·요약과 함께 PetGrow 안에서 먼저 읽고, 필요할 때 원문을 확인해요."} />
            <LandingFeatureCard Illust={MapPinIcon} title={t.landingCardNearbyTitle} desc={t.landingCardNearbyDesc} />
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
          <p style={{ textAlign: "center", color: "#89928C", fontSize: 15, marginBottom: 8 }}>{t.landingCommunitySubtitle}</p>
          <div className="landing-community-wrap">
            <div className="landing-community-text">
              <p className="landing-community-desc">{t.landingCommunityDesc}</p>
              <button type="button" className="landing-cta landing-community-cta" onClick={() => go("community")}>
                {t.landingCommunityCta}
              </button>
            </div>
            <div className="cm-mock-feed">
              <CommunityMockCard Illust={IllustMyPets} photoSrc="/pettalk-demo-dog.webp" name={t.landingMockPost1Name} breed={t.landingMockPost1Breed}
                timeLabel={t.landingMockPost1Time} text={t.landingMockPost1Text} likeCount={24} commentCount={7} />
              <CommunityMockCard Illust={IllustPetBti} photoSrc="/pettalk-demo-cat.webp" name={t.landingMockPost2Name} breed={t.landingMockPost2Breed}
                timeLabel={t.landingMockPost2Time} text={t.landingMockPost2Text} likeCount={12} commentCount={3} />
            </div>
          </div>
        </div>
      </section>

      {/* Pet음악 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{lang === "en" ? "Pet Music" : "Pet음악"}</h2>
          <p style={{ textAlign:"center",color:"#89928C",fontSize:15,maxWidth:560,margin:"0 auto 18px" }}>{lang === "en" ? "Discover music for dogs and cats, loop favorites, and help shape the Top 5 with likes and comments." : "강아지·고양이를 위한 음악을 듣고 반복재생해보세요. 좋아요와 댓글 반응을 모아 인기 TOP5를 함께 만들어요."}</p>
          <div className="landing-mini-teaser"><button type="button" className="landing-mini-teaser-item" onClick={() => go("music")}><span className="landing-mini-teaser-icon"><MusicIcon style={{width:20,height:20}}/></span><span className="landing-mini-teaser-label">{lang === "en" ? "Open Pet Music" : "Pet음악 들으러 가기"}</span></button></div>
        </div>
      </section>

      {/* Pet정보 */}
      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{t.landingTipsGuideTitle}</h2>
          <p style={{ textAlign: "center", color: "#89928C", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>{t.landingTipsGuideDesc}</p>
          <div className="landing-mini-teaser">
            <button type="button" className="landing-mini-teaser-item" onClick={() => go("tips")}>
              <span className="landing-mini-teaser-icon"><IllustTips style={{ width: 20, height: 20 }} /></span>
              <span className="landing-mini-teaser-label">{t.landingTipsTeaserLabel}</span>
            </button>

          </div>
        </div>
      </section>

      {/* 내 주변 Pet */}
      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <h2 className="landing-section-title" style={{ marginBottom: 6 }}>{lang === "en" ? "Nearby Pet" : "내 주변 Pet"}</h2>
          <p style={{ textAlign:"center",color:"#89928C",fontSize:15,maxWidth:620,margin:"0 auto 18px" }}>{lang === "en" ? "Search pet places around an address and also see the distance from your current location." : "검색한 주소 주변의 동물병원·동물약국·펫샵·미용·유치원/호텔을 찾고, 지도에서 내 위치와 업체까지의 거리도 확인해요."}</p>
          <div className="landing-mini-teaser"><button type="button" className="landing-mini-teaser-item" onClick={() => go("nearby")}><span className="landing-mini-teaser-icon"><MapPinIcon style={{width:20,height:20}}/></span><span className="landing-mini-teaser-label">{lang === "en" ? "Find nearby pet places" : "내 주변 Pet 찾기"}</span></button></div>
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

      {/* 신뢰 배지 — 공식 SNS는 모든 화면의 공통 푸터에서 노출 */}
      <section className="landing-section landing-section-white">
        <div className="landing-wrap">
          <div className="landing-trust">
            <span className="landing-trust-item"><ShieldIcon style={{ width: 14, height: 14 }} />{t.landingTrust1}</span>
            <span className="landing-trust-item"><PlusIcon style={{ width: 14, height: 14 }} />{t.landingTrust2}</span>
            <span className="landing-trust-item"><LeafIcon style={{ width: 14, height: 14 }} />{t.landingTrust3}</span>
            <span className="landing-trust-item"><InfoIcon style={{ width: 14, height: 14 }} />{t.landingTrust4}</span>
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


function NearbyPetPage(){
  const t=useT();
  const mapRef=useRef(null);
  const mapObj=useRef(null);
  const overlays=useRef([]);
  const [pos,setPos]=useState(null);
  const [items,setItems]=useState([]);
  const [page,setPage]=useState(1);
  const pageSize=10;
  const [cat,setCat]=useState("all");
  const [area,setArea]=useState("");
  const [searchMode,setSearchMode]=useState("address");
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [searchRadius,setSearchRadius]=useState(1000);
  const searchCenterRef=useRef(null);
  const [positionAccuracy,setPositionAccuracy]=useState(null);
  const [within1km,setWithin1km]=useState(0);
  const [selected,setSelected]=useState(null);
  const [reviews,setReviews]=useState({items:[],summary:{count:0,avg:0}});
  const [reviewOpen,setReviewOpen]=useState(false);
  const [reviewRating,setReviewRating]=useState(5);
  const [reviewText,setReviewText]=useState("");
  const [reviewBusy,setReviewBusy]=useState(false);
  const [editingReviewId,setEditingReviewId]=useState(null);
  const [editingRating,setEditingRating]=useState(5);
  const [editingText,setEditingText]=useState("");
  const locationRequested=useRef(false);
  const nearbyCache=useRef(new Map());
  const requestSeq=useRef(0);
  const [followMyLocation,setFollowMyLocation]=useState(true);
  const locationWatchId=useRef(null);

  const loadReviews=async(place)=>{
    if(!place?.id){setReviews({items:[],summary:{count:0,avg:0}});return;}
    try{const r=await fetch(`/api/nearby-reviews?action=list&placeId=${encodeURIComponent(place.id)}`);const j=await r.json();if(r.ok)setReviews(j);}catch{}
  };

  useEffect(()=>{loadReviews(selected)},[selected?.id]);

  // 다른 메뉴로 이동할 때 Leaflet 인스턴스를 즉시 제거해 지도가 다른 화면 위에 남는 현상을 방지합니다.
  useEffect(()=>()=>{
    overlays.current.forEach(o=>{try{o?.setMap?.(null)}catch{}try{mapObj.current?.removeLayer?.(o)}catch{}});
    overlays.current=[];
    if(mapObj.current){try{mapObj.current.off?.();mapObj.current.remove?.();}catch{}mapObj.current=null;}
    if(mapRef.current) mapRef.current.innerHTML="";
  },[]);

  const loadMap=async(center,places,userPos=pos,showSearchPin=true)=>{
    if(!mapRef.current)return;
    const mobileNearby=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(max-width: 700px)").matches;
    if(mobileNearby){
      const within2km=(places||[]).filter((p)=>{
        const d=Number(p?.distance ?? p?.userDistance);
        return !Number.isFinite(d)||d<=2000;
      });
      places=within2km.slice(0,25);
    }
    const kakaoJsKey=String(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY||"").trim();
    if(kakaoJsKey){
      try{
        if(!window.kakao?.maps){
          await new Promise((resolve,reject)=>{
            const old=document.getElementById("petgrow-kakao-map-sdk");
            const done=()=>window.kakao?.maps?.load?window.kakao.maps.load(resolve):resolve();
            if(old){if(window.kakao?.maps)return done();old.addEventListener("load",done,{once:true});old.addEventListener("error",reject,{once:true});return;}
            const sc=document.createElement("script");sc.id="petgrow-kakao-map-sdk";sc.async=true;sc.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoJsKey)}&autoload=false`;sc.onload=done;sc.onerror=reject;document.head.appendChild(sc);
          });
        }else if(window.kakao?.maps?.load){await new Promise(resolve=>window.kakao.maps.load(resolve));}
        const K=window.kakao?.maps;if(K){
          mapRef.current.innerHTML="";
          overlays.current.forEach(o=>{try{o?.setMap?.(null)}catch{}});overlays.current=[];
          const centerPos=new K.LatLng(center.lat,center.lng);
          const map=new K.Map(mapRef.current,{center:centerPos,level:5});mapObj.current=map;mapObj.current.__engine="kakao";
          window.setTimeout(()=>{try{map.relayout();map.setCenter(centerPos);map.setLevel(5)}catch{}},80);
          const makeOverlay=(lat,lng,html,z=3,click)=>{const el=document.createElement("div");el.innerHTML=html;const node=el.firstElementChild;if(click)node.addEventListener("click",click);const ov=new K.CustomOverlay({position:new K.LatLng(lat,lng),content:node,yAnchor:1,zIndex:z});ov.setMap(map);overlays.current.push(ov);return ov;};
          if(showSearchPin)makeOverlay(center.lat,center.lng,'<div class="nearby-search-pin"><span>⌖</span><b>검색 주소</b></div>',8);
          if(userPos&&Number.isFinite(Number(userPos.lat))&&Number.isFinite(Number(userPos.lng)))makeOverlay(userPos.lat,userPos.lng,'<div class="nearby-me-pin"><span></span><b>내 위치</b></div>',9);
          const bounds=new K.LatLngBounds();bounds.extend(centerPos);
          places.forEach((p,i)=>{
            const html=`<button type="button" class="nearby-map-marker nearby-map-marker--${p.typeKey||"other"}"><span>${p.typeIcon||"🐾"}</span><i>${i+1}</i></button>`;
            makeOverlay(p.lat,p.lng,html,5,()=>{setSelected(p);document.getElementById(`nearby-place-${p.id}`)?.scrollIntoView({behavior:"smooth",block:"center"});});
            bounds.extend(new K.LatLng(p.lat,p.lng));
          });
          if(places.length){map.setCenter(centerPos);map.setLevel(5);}
          window.setTimeout(()=>{try{map.relayout?.();map.setCenter(centerPos);map.setLevel(5)}catch{}},80);
          return;
        }
      }catch(e){console.warn("Kakao map load failed; using fallback map",e);}
    }
    if(!window.L) window.L=LeafletLib;
    if(!window.L){
      if(!document.getElementById("petgrow-leaflet-css")){
        const link=document.createElement("link");link.id="petgrow-leaflet-css";link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(link);
      }
      await new Promise((resolve,reject)=>{
        const old=document.getElementById("petgrow-leaflet-sdk");
        if(old){if(window.L)return resolve();old.addEventListener("load",resolve,{once:true});old.addEventListener("error",reject,{once:true});return;}
        const sc=document.createElement("script");sc.id="petgrow-leaflet-sdk";sc.async=true;sc.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";sc.onload=resolve;sc.onerror=reject;document.head.appendChild(sc);
      });
    }
    const L=window.L;if(!L)return;
    if(mapRef.current.querySelector(".nearby-map-fallback")) mapRef.current.innerHTML="";
    const c=[center.lat,center.lng];
    const map=mapObj.current||L.map(mapRef.current,{zoomControl:true,attributionControl:true}).setView(c,14);
    mapObj.current=map;
    if(!map.__petgrowTiles){L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);map.__petgrowTiles=true;}
    map.setView(c,14);
    overlays.current.forEach(o=>{try{map.removeLayer(o)}catch{}});overlays.current=[];
    if(showSearchPin){const searchIcon=L.divIcon({className:"petgrow-leaflet-search",html:'<div class="nearby-search-pin"><span>⌖</span><b>검색 주소</b></div>',iconSize:[72,52],iconAnchor:[36,36]});
    const searchMarker=L.marker(c,{icon:searchIcon,zIndexOffset:900}).addTo(map);overlays.current.push(searchMarker);}
    if(userPos&&Number.isFinite(Number(userPos.lat))&&Number.isFinite(Number(userPos.lng))){
      const meIcon=L.divIcon({className:"petgrow-leaflet-me",html:'<div class="nearby-me-pin"><span></span><b>내 위치</b></div>',iconSize:[64,52],iconAnchor:[32,36]});
      const me=L.marker([userPos.lat,userPos.lng],{icon:meIcon,zIndexOffset:1000}).addTo(map);overlays.current.push(me);
    }
    const bounds=L.latLngBounds([c]);
    places.forEach((p,i)=>{
      const icon=L.divIcon({className:"petgrow-leaflet-place",html:`<button type="button" class="nearby-map-marker nearby-map-marker--${p.typeKey||"other"}"><span>${p.typeIcon||"🐾"}</span><i>${i+1}</i></button>`,iconSize:[32,36],iconAnchor:[16,32]});
      const m=L.marker([p.lat,p.lng],{icon}).addTo(map);
      m.on("click",()=>{setSelected(p);document.getElementById(`nearby-place-${p.id}`)?.scrollIntoView({behavior:"smooth",block:"center"});});
      const popup=`<div style="min-width:200px"><div style="font-size:11px;font-weight:800;color:#4F8A5B;margin-bottom:5px">${String(p.typeIcon||"🐾")} ${String(p.typeLabel||"반려동물 관련")}</div><b style="font-size:14px">${String(p.name||"").replace(/[<>&]/g,"")}</b><div style="margin-top:5px;font-size:12px;font-weight:800;color:#4F8A5B">${p.userDistance!=null?`내 위치에서 ${p.userDistance<1000?`${p.userDistance}m`:`${(p.userDistance/1000).toFixed(1)}km`}`:(p.distance==null?"":`검색 주소에서 ${p.distance<1000?`${p.distance}m`:`${(p.distance/1000).toFixed(1)}km`}`)}</div><div style="margin-top:4px;font-size:11px;line-height:1.45">${String(p.address||"").replace(/[<>&]/g,"")}</div>${p.phone?`<div style="margin-top:4px;font-size:11px">☎ ${String(p.phone).replace(/[<>&]/g,"")}</div>`:""}</div>`;
      m.bindPopup(popup);overlays.current.push(m);bounds.extend([p.lat,p.lng]);
    });
    map.setView(c,14,{animate:false});
    window.setTimeout(()=>{try{map.invalidateSize({pan:false});map.setView(c,14,{animate:false})}catch{}},80);
  };

  useEffect(()=>{
    let disposed=false;
    const timer=window.setTimeout(()=>{
      if(disposed||!mapRef.current||mapObj.current)return;
      loadMap({lat:37.5665,lng:126.9780},[],null,false).catch(e=>console.warn("Initial nearby map load failed",e));
    },100);
    return()=>{disposed=true;window.clearTimeout(timer);};
  },[]);

  const mergeNearbyRows=(groups)=>{
    const seen=new Map();
    const rank={public:0,kakao:1,osm:2,nominatim:3};
    const norm=v=>String(v||"").replace(/[^0-9A-Za-z가-힣]/g,"").toLowerCase();
    for(const row of groups.flat().filter(Boolean)){
      const key=`${norm(row.name)}|${Number(row.lat||0).toFixed(4)}|${Number(row.lng||0).toFixed(4)}`;
      const prev=seen.get(key);
      if(!prev || (rank[row.source]??9)<(rank[prev.source]??9)) seen.set(key,{...prev,...row});
      else if(prev){ if(!prev.phone&&row.phone)prev.phone=row.phone;if(!prev.address&&row.address)prev.address=row.address;if(!prev.url&&row.url)prev.url=row.url; }
    }
    return [...seen.values()].sort((a,b)=>(Number(a.distance)||1e12)-(Number(b.distance)||1e12));
  };
  const fetchNearbyCategory=async(nextCat,coords,manualArea,userCoords=pos)=>{
    const q=new URLSearchParams({category:nextCat});
    if(coords){q.set("lat",coords.lat);q.set("lng",coords.lng);}
    if(userCoords){q.set("userLat",userCoords.lat);q.set("userLng",userCoords.lng);}
    if(manualArea.trim())q.set("area",manualArea.trim());
    const r=await fetch(`/api/nearby?${q}`);const j=await r.json();
    if(!r.ok) throw new Error(j.error||"주변 정보를 불러오지 못했어요.");
    return j;
  };
  const search=async(nextCat=cat,coords=pos,manualArea=area,{background=false,mode=null,userCoords=null}={})=>{
    if(!coords&&!manualArea.trim()) return;
    const activeMode=mode||(manualArea.trim()?"address":"current");
    const distanceOrigin=userCoords||(activeMode==="current"?coords:pos);
    setSearchMode(activeMode);
    const cacheKey=`${activeMode}|${coords?`${Number(coords.lat).toFixed(4)},${Number(coords.lng).toFixed(4)}`:manualArea.trim()}|${nextCat}`;
    const cached=nearbyCache.current.get(cacheKey);
    if(cached){
      const cachedItemsRaw=distanceOrigin?(cached.items||[]).map(x=>({...x,userDistance:calcClientDistance(distanceOrigin.lat,distanceOrigin.lng,Number(x.lat),Number(x.lng))})).sort((a,b)=>(a.userDistance??1e12)-(b.userDistance??1e12)):(cached.items||[]);
      const cachedItems=cachedItemsRaw.filter(x=>Number(x.distance)<=1000);
      setItems(cachedItems);setPage(1);setSelected(cachedItems[0]||null);setSearchRadius(1000);setWithin1km(cachedItems.length);
      if(cached.searchCenter){searchCenterRef.current=cached.searchCenter;loadMap(cached.searchCenter,cachedItems.slice(0,30),distanceOrigin).catch(()=>{});}
      if(!background)return;
    }
    const seq=++requestSeq.current;
    if(!background&&!cached)setLoading(true);setMsg("");
    try{
      let j;
      if(nextCat==="all"){
        // '전체'는 각 카테고리를 실제로 각각 조회해 합칩니다. 개별 탭에서 보이는 장소가 전체에서 빠지지 않게 해요.
        const keys=["hospital","pharmacy","shop","grooming","hotel"];
        const settled=await Promise.allSettled(keys.map(k=>fetchNearbyCategory(k,coords,manualArea,distanceOrigin)));
        const good=settled.map((x,i)=>x.status==="fulfilled"?{key:keys[i],data:x.value}:null).filter(Boolean);
        for(const x of good){nearbyCache.current.set(`${coords?`${Number(coords.lat).toFixed(4)},${Number(coords.lng).toFixed(4)}`:manualArea.trim()}|${x.key}`,x.data);}
        const merged=mergeNearbyRows(good.map(x=>x.data.items||[]));
        const within=merged.filter(x=>Number(x.distance)<=1000).length;
        j={items:merged.filter(x=>Number(x.distance)<=1000),within1km:within,searchRadius:1000,searchCenter:good[0]?.data?.searchCenter||null};
      }else j=await fetchNearbyCategory(nextCat,coords,manualArea,distanceOrigin);
      if(Array.isArray(j.items)){
        let nextItems=j.items.filter(x=>Number(x.distance)<=1000);
        if(distanceOrigin)nextItems=nextItems.map(x=>({...x,userDistance:calcClientDistance(distanceOrigin.lat,distanceOrigin.lng,Number(x.lat),Number(x.lng))})).sort((a,b)=>(a.userDistance??1e12)-(b.userDistance??1e12));
        j={...j,items:nextItems,within1km:nextItems.length,searchRadius:1000};
      }
      nearbyCache.current.set(cacheKey,j);
      if(seq!==requestSeq.current && !background)return;
      setItems(j.items||[]);setPage(1);setSelected(j.items?.[0]||null);setSearchRadius(1000);setWithin1km(Number(j.within1km)||0);
      if(j.searchCenter){searchCenterRef.current=j.searchCenter;loadMap(j.searchCenter,(j.items||[]).slice(0,30),distanceOrigin).catch(()=>{});}
      if(j.warning)setMsg(j.warning); else if(!(j.items||[]).length)setMsg("검색 결과가 없어요. 주소는 인식했지만 주변 업체 정보를 찾지 못했어요. 다른 카테고리를 눌러보거나 주소를 조금 더 구체적으로 입력해 주세요.");
    }catch(e){if(!cached)setMsg(e.message)}finally{if(seq===requestSeq.current)setLoading(false)}
  };
  const locate=()=>{
    if(!navigator.geolocation){setMsg("이 기기에서는 현재 위치를 사용할 수 없어요. 주소 검색은 그대로 이용할 수 있어요.");return;}
    setMsg("지도에 내 위치를 표시하고 있어요…");
    navigator.geolocation.getCurrentPosition(
      p=>{
        const c={lat:p.coords.latitude,lng:p.coords.longitude};
        setPositionAccuracy(Math.round(Number(p.coords.accuracy)||0));
        setPos(c);setMsg("");
        if(items.length){
          const updated=items.map(x=>({...x,userDistance:calcClientDistance(c.lat,c.lng,Number(x.lat),Number(x.lng))})).sort((a,b)=>(a.userDistance??1e12)-(b.userDistance??1e12));
          setItems(updated);setPage(1);
          const mc=mapObj.current?.getCenter?.();if(mc)loadMap({lat:mc.lat,lng:mc.lng},updated,c).catch(()=>{});
        } else { loadMap(c,[],c,false).catch(()=>{}); }
      },
      err=>{
        if(err?.code===1)setMsg("위치 권한이 꺼져 있어요. 주소 검색은 사용할 수 있고, 권한을 허용하면 지도에 내 위치와 업체까지의 거리가 표시돼요.");
        else setMsg("현재 위치를 확인하지 못했어요. 주소 검색은 그대로 이용할 수 있어요.");
      },
      {enableHighAccuracy:true,timeout:5000,maximumAge:60000}
    );
  };
  const searchCurrentLocation=()=>{
    if(!navigator.geolocation){setMsg("이 기기에서는 현재 위치를 사용할 수 없어요. 주소 검색을 이용해 주세요.");return;}
    setLoading(true);setMsg("현재 위치 주변을 찾고 있어요…");
    navigator.geolocation.getCurrentPosition(
      p=>{
        const c={lat:p.coords.latitude,lng:p.coords.longitude};
        setPositionAccuracy(Math.round(Number(p.coords.accuracy)||0));setPos(c);setArea("");
        search(cat,c,"",{mode:"current",userCoords:c}).finally(()=>setLoading(false));
      },
      err=>{setLoading(false);if(err?.code===1)setMsg("현재 위치 검색을 사용하려면 위치 권한을 허용해 주세요. 주소 검색은 그대로 이용할 수 있어요.");else setMsg("현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");},
      {enableHighAccuracy:true,timeout:7000,maximumAge:30000}
    );
  };
  const calcClientDistance=(a,b,c,d)=>{const rad=Math.PI/180,R=6371000,x=(c-a)*rad,y=(d-b)*rad,aa=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(aa)));};
  useEffect(()=>{
    if(!followMyLocation||!navigator.geolocation)return;
    locationWatchId.current=navigator.geolocation.watchPosition(p=>{
      const c={lat:p.coords.latitude,lng:p.coords.longitude};
      setPositionAccuracy(Math.round(Number(p.coords.accuracy)||0));
      setPos(c);
      setItems(prev=>{
        const updated=(prev||[]).map(x=>({...x,userDistance:calcClientDistance(c.lat,c.lng,Number(x.lat),Number(x.lng))})).sort((a,b)=>(a.userDistance??1e12)-(b.userDistance??1e12));
        loadMap(c,updated,c,false).catch(()=>{});
        return updated;
      });
    },()=>{}, {enableHighAccuracy:true,maximumAge:15000,timeout:10000});
    return()=>{if(locationWatchId.current!=null){navigator.geolocation.clearWatch(locationWatchId.current);locationWatchId.current=null;}};
  },[followMyLocation]);
    useEffect(()=>{ if(!locationRequested.current){locationRequested.current=true;locate();} },[]);
  useEffect(()=>{
    if(searchMode==="address"&&area.trim())search(cat,null,area,{background:false,mode:"address"});
    else if(searchMode==="current"&&pos)search(cat,pos,"",{background:false,mode:"current",userCoords:pos});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cat]);
  const cats=[["all","전체"],["hospital","동물병원"],["pharmacy","동물약국"],["shop","펫샵·용품"],["grooming","펫미용"],["hotel","호텔·유치원"]];
  const fmt=d=>d==null?"거리 확인 불가":Number(d)<1000?`${Math.max(0,Math.round(Number(d)))}m`:`${(Number(d)/1000).toFixed(1)}km`;
  const submitReview=async()=>{
    if(!selected)return;
    const text=reviewText.trim();if(!text)return window.alert("간단한 이용후기를 입력해 주세요.");
    setReviewBusy(true);
    try{const r=await fetch('/api/nearby-reviews?action=write',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId:selected.id,placeName:selected.name,rating:reviewRating,content:text})});const j=await r.json();if(!r.ok)throw new Error(j.error||'후기를 등록하지 못했어요.');setReviewText("");setReviewRating(5);setReviewOpen(false);await loadReviews(selected);}catch(e){window.alert(e.message)}finally{setReviewBusy(false)}
  };
  const likeReview=async(rvw)=>{try{const r=await fetch('/api/nearby-reviews?action=like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewId:rvw.id})});const j=await r.json();if(!r.ok)throw new Error(j.error||'좋아요를 처리하지 못했어요.');await loadReviews(selected);}catch(e){window.alert(e.message)}};
  const startEditReview=(rvw)=>{setEditingReviewId(rvw.id);setEditingRating(Number(rvw.rating)||5);setEditingText(rvw.content||"");};
  const cancelEditReview=()=>{setEditingReviewId(null);setEditingText("");setEditingRating(5);};
  const saveEditReview=async()=>{const text=editingText.trim();if(!editingReviewId||!text)return window.alert("후기 내용을 입력해 주세요.");setReviewBusy(true);try{const r=await fetch('/api/nearby-reviews?action=update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewId:editingReviewId,rating:editingRating,content:text})});const j=await r.json();if(!r.ok)throw new Error(j.error||'후기를 수정하지 못했어요.');cancelEditReview();await loadReviews(selected);}catch(e){window.alert(e.message)}finally{setReviewBusy(false)}};
  const deleteReview=async(rvw)=>{if(!window.confirm("이 후기를 삭제할까요? 삭제한 후기는 복구할 수 없어요."))return;setReviewBusy(true);try{const r=await fetch('/api/nearby-reviews?action=delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewId:rvw.id})});const j=await r.json();if(!r.ok)throw new Error(j.error||'후기를 삭제하지 못했어요.');if(editingReviewId===rvw.id)cancelEditReview();await loadReviews(selected);}catch(e){window.alert(e.message)}finally{setReviewBusy(false)}};
  const reportReview=async(rvw)=>{const reason=window.prompt("신고 사유를 간단히 입력해주세요. (욕설·광고·개인정보·허위정보 등)","부적절한 내용");if(reason===null)return;try{const r=await fetch('/api/nearby-reviews?action=report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewId:rvw.id,reason:'other',detail:reason})});const j=await r.json();if(!r.ok)throw new Error(j.error||'신고하지 못했어요.');window.alert(j.already?"이미 신고한 후기예요.":"신고가 접수됐어요. 운영진이 확인할게요.");}catch(e){window.alert(e.message)}};
  const totalPages=Math.max(1,Math.ceil(items.length/pageSize));
  const safePage=Math.min(page,totalPages);
  const pageItems=items.slice((safePage-1)*pageSize,safePage*pageSize);

  return <div className="nearby-page">
    <section className="nearby-hero bg-card">
      <div><span className="nearby-eyebrow">PETGROW LOCAL</span><h1>{t.nearbyTitle}</h1><p>{t.nearbySubtitle}</p><small className="nearby-search-help">📍 주소로 검색하거나 현재 위치 주변을 바로 검색할 수 있어요. 위치를 허용하면 현재 위치 주변 검색과 지도 표시, 업체까지의 거리 확인도 할 수 있어요.</small></div>
    </section>
    <div className="nearby-search-row"><input className="bg-input" value={area} onChange={e=>setArea(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(area.trim())search(cat,null,area,{mode:"address"});else setMsg("검색할 주소를 입력해 주세요.");}}} placeholder="구·동·도로명·지번 검색 (예: 강남구, 역삼동, 역삼동 695-26)"/><button className="bg-btn nearby-address-search-btn" onClick={()=>area.trim()?search(cat,null,area,{mode:"address"}):setMsg("검색할 주소를 입력해 주세요.")}>{loading?"검색 중…":"주소 검색"}</button><button type="button" className="nearby-current-search-btn" onClick={searchCurrentLocation} disabled={loading}><MapPinIcon/>{loading&&searchMode==="current"?"찾는 중…":"현재 위치로 검색"}</button></div>
    <ResponsiveCategoryMenu className="nearby-responsive-categories" primaryCount={3} items={cats.map(([id,label])=>({id,label}))} activeId={cat} onSelect={setCat} lang={"ko"} />
    <section className="nearby-map-card bg-card modern-nearby-map">
      <div className="nearby-map-head"><div><b>{searchMode==="current"?"현재 위치 주변":"검색한 주소 주변"}</b><small className="nearby-map-description">{pos?"빨간 점은 실시간 내 위치예요. 장소를 누르면 상세 정보를 확인할 수 있어요.":"위치 권한을 허용하면 지도에 내 위치와 장소까지의 거리를 함께 표시해요."}</small></div>{pos&&<span className="nearby-live-pill">LIVE</span>}</div>
      <div className="nearby-map-shell"><div ref={mapRef} className="nearby-map"><div className="nearby-map-fallback"><MapPinIcon/><b>지도를 불러오는 중이에요</b><span>가까운 반려동물 장소를 간결하게 표시해요.</span></div></div><div className="nearby-map-floating-controls"><button type="button" className="nearby-map-icon-btn" onClick={locate} aria-label={pos?"현재 위치 새로고침":"현재 위치 표시"} title={pos?"현재 위치 새로고침":"현재 위치 표시"}><MapPinIcon/></button><button type="button" className={`nearby-map-icon-btn follow ${followMyLocation?'active':''}`} onClick={()=>setFollowMyLocation(v=>!v)} aria-label="실시간 위치 따라가기" title="실시간 위치 따라가기">◎</button></div></div>
    </section>
    {msg&&<div className="nearby-message">{msg}</div>}
    <div className="nearby-results-head"><div><h2>{searchMode==="current"?"현재 위치 주변":"검색 주소 주변"}</h2><span>{items.length}곳</span></div><small className="nearby-results-detail">{searchMode==="current"?`내 위치에서 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`:pos?`내 위치에서 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`:`검색 주소 기준 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`}</small></div>
    <div className="nearby-list">
      {loading&&!items.length?<div className="bg-card nearby-empty">주변 Pet 정보를 찾는 중…</div>:
      pageItems.map((p,i)=><article id={`nearby-place-${p.id}`} key={p.id} className={`bg-card nearby-place ${selected?.id===p.id?"selected":""}`} onClick={()=>{setSelected(p);window.setTimeout(()=>loadMap({lat:Number(p.lat),lng:Number(p.lng)},[p],null,false).catch(()=>{}),0);}}>
        <div className="nearby-rank">{(safePage-1)*pageSize+i+1}</div>
        <div className="nearby-place-main">
          <div className="nearby-type-row"><span className={`nearby-type-badge nearby-type-${p.typeKey||"other"}`}>{p.typeIcon||"🐾"} {p.typeLabel||"반려동물 관련"}</span></div>
          <div className="nearby-place-title"><h3>{p.name}</h3><strong>{searchMode==="current"?`내 위치에서 ${fmt(p.userDistance ?? p.distance)}`:pos?`내 위치에서 ${fmt(p.userDistance ?? p.distance)}`:`주소에서 ${fmt(p.distance)}`}</strong></div>
          <div className="nearby-place-meta">{p.address&&<span>📍 {p.address}</span>}{p.phone&&<span>☎ {p.phone}</span>}</div>
          <small>{p.category}</small>
        </div>
        <div className="nearby-place-actions"><div className="nearby-place-action-buttons">{p.phone&&<a href={`tel:${p.phone}`} onClick={e=>e.stopPropagation()}>전화</a>}{p.url&&<a href={p.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>카카오맵</a>}</div><strong className="nearby-desktop-distance">{searchMode==="current"?`내 위치에서 ${fmt(p.userDistance ?? p.distance)}`:pos?`내 위치에서 ${fmt(p.userDistance ?? p.distance)}`:`주소에서 ${fmt(p.distance)}`}</strong></div>
      </article>)}
    </div>
    {items.length>pageSize&&<nav className="nearby-pagination" aria-label="내 주변 Pet 페이지">
      <button type="button" disabled={safePage<=1} onClick={()=>{setPage(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:"smooth"})}}>이전</button>
      {Array.from({length:totalPages},(_,i)=>i+1).slice(Math.max(0,safePage-3),Math.max(0,safePage-3)+5).map(n=><button type="button" key={n} className={n===safePage?"active":""} onClick={()=>setPage(n)}>{n}</button>)}
      <button type="button" disabled={safePage>=totalPages} onClick={()=>{setPage(p=>Math.min(totalPages,p+1));window.scrollTo({top:0,behavior:"smooth"})}}>다음</button>
    </nav>}

    {selected&&<section className="bg-card nearby-review-panel">
      <div className="nearby-review-head"><div><span className={`nearby-type-badge nearby-type-${selected.typeKey||"other"}`}>{selected.typeIcon||"🐾"} {selected.typeLabel||"반려동물 관련"}</span><h2>{selected.name} 이용후기</h2><p><b>★ {Number(reviews.summary?.avg||0).toFixed(1)}</b> · 후기 {Number(reviews.summary?.count||0)}개</p></div><button className="bg-btn" onClick={()=>setReviewOpen(v=>!v)}>{reviewOpen?"작성 닫기":"후기 남기기"}</button></div>
      {reviewOpen&&<div className="nearby-review-compose"><div className="nearby-stars" aria-label="별점 선택">{[1,2,3,4,5].map(n=><button key={n} className={n<=reviewRating?"active":""} onClick={()=>setReviewRating(n)}>★</button>)}</div><textarea className="bg-input" maxLength={300} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="시설·서비스 이용 경험을 간단히 남겨주세요. 비속어·개인정보·광고성 내용은 등록할 수 없어요."/><div className="nearby-review-compose-foot"><small>{reviewText.length}/300 · 후기는 로그인 후 작성할 수 있어요.</small><button className="bg-btn" disabled={reviewBusy} onClick={submitReview}>{reviewBusy?"저장 중…":"후기 저장"}</button></div></div>}
      <div className="nearby-review-list">{reviews.items?.length?reviews.items.map(r=><div className={`nearby-review-item ${r.is_owner?"mine":""}`} key={r.id}><div className="nearby-review-meta"><b>{r.nickname}{r.is_owner&&<em>내 후기</em>}</b><span>{"★".repeat(Number(r.rating)||0)}{"☆".repeat(5-(Number(r.rating)||0))}</span><small>{new Date(r.created_at).toLocaleDateString("ko-KR")}{r.updated_at&&r.updated_at!==r.created_at?" · 수정됨":""}</small></div>{editingReviewId===r.id?<div className="nearby-review-edit"><div className="nearby-stars" aria-label="별점 수정">{[1,2,3,4,5].map(n=><button key={n} className={n<=editingRating?"active":""} onClick={()=>setEditingRating(n)}>★</button>)}</div><textarea className="bg-input" maxLength={300} value={editingText} onChange={e=>setEditingText(e.target.value)}/><div className="nearby-review-edit-actions"><button className="bg-btn bg-btn-ghost" onClick={cancelEditReview}>취소</button><button className="bg-btn" disabled={reviewBusy} onClick={saveEditReview}>{reviewBusy?"저장 중…":"저장"}</button></div></div>:<p>{r.content}</p>}<div className="nearby-review-actions"><button className={r.liked?"liked":""} onClick={()=>likeReview(r)}>{r.liked?"♥":"♡"} {Number(r.like_count)||0}</button>{r.is_owner?<><button onClick={()=>startEditReview(r)}>✏️ 수정</button><button className="danger" onClick={()=>deleteReview(r)}>🗑 삭제</button></>:<button onClick={()=>reportReview(r)}>🚩 신고</button>}</div></div>):<div className="nearby-review-empty">아직 후기가 없어요. 첫 이용후기를 남겨보세요 🐾</div>}</div>
    </section>}
    <p className="nearby-disclaimer">업체 정보는 공공데이터포털의 공식 인허가 정보와 카카오 장소정보를 함께 사용해 검색 시점에 불러옵니다. 공식 인허가 정보를 우선 확인하고 전화번호·지도 링크 등은 카카오 정보로 보완할 수 있으며, 실제 영업 여부·주소·연락처는 방문 전 업체에 한 번 더 확인해주세요. 이용후기는 PetGrow 회원이 작성한 의견으로 업체의 공식 정보가 아닙니다.</p>
  </div>;
}

function normalizePetDisplayText(value, fallback="") {
  try {
    return String(value ?? fallback).normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, "").replace(/\uFFFD/g, "").trim() || fallback;
  } catch { return String(value ?? fallback).trim() || fallback; }
}


/* PETGROW_FINAL_UX_20260817 */
function UnifiedMenuHero({ view, lang='ko' }) {
  const meta={
    pets:{eyebrow:'MY PET',ko:'우리 아이',en:'My Pet',koDesc:'반려동물의 기본정보부터 성장기록, 사진, 건강정보까지 한곳에서 관리해요.',enDesc:'Keep profiles, growth records, photos and care information together.'},
    community:{eyebrow:'PETGROW TALK',ko:'Pet톡',en:'Pet Talk',koDesc:'우리 아이의 일상과 궁금한 점, 반려생활 정보를 회원들과 편하게 나눠보세요.',enDesc:'Share everyday moments, questions and useful pet-life tips.'},
    tips:{eyebrow:'PETGROW INFO',ko:'Pet정보',en:'Pet Info',koDesc:'건강·식단·생활·훈련 등 반려생활에 바로 활용할 수 있는 정보를 모아봤어요.',enDesc:'Browse practical information for health, food, daily care and training.'},
    saju:{eyebrow:'PETGROW CONTENT',ko:'Pet사주',en:'Pet Saju',koDesc:'우리 아이의 생년월일을 바탕으로 재미로 즐기는 특별한 이야기를 만나보세요.',enDesc:'Enjoy a lighthearted pet fortune story based on your pet profile.'},
    tarot:{eyebrow:'PETGROW TAROT',ko:'Pet타로',en:'Pet Tarot',koDesc:'22장의 메이저 아르카나에서 오늘·궁합·마음·산책·조언 주제별로 하루 한 장의 메시지를 만나보세요.',enDesc:'Draw one Major Arcana card per topic each day for a lighthearted pet-life message.'},
    petbti:{eyebrow:'PETGROW CONTENT',ko:'PetBTI',en:'PetBTI',koDesc:'강아지와 고양이의 행동 성향을 질문으로 살펴보고 우리 아이의 개성을 알아봐요.',enDesc:'Explore your pet personality through a simple behavior questionnaire.'},
    guide:{eyebrow:'PETGROW GUIDE',ko:'정보가이드',en:'Guide',koDesc:'PetGrow의 주요 기능과 이용 방법을 한곳에서 쉽고 빠르게 확인해요.',enDesc:'See how PetGrow features work and how to use them.'},
    my:{eyebrow:'PETGROW MY',ko:'마이페이지',en:'My Page',koDesc:'회원정보와 내가 남긴 활동, 좋아요한 콘텐츠를 한곳에서 관리해요.',enDesc:'Manage your account, activity and saved favorites.'},
    more:{eyebrow:'PETGROW MENU',ko:'더보기',en:'More',koDesc:'PetGrow의 다양한 기능과 고객지원 메뉴를 한곳에서 확인해요.',enDesc:'Find additional PetGrow features and support options.'},
    nearby:{eyebrow:'PETGROW NEARBY',ko:'내 주변 Pet',en:'Nearby Pet',koDesc:'주소나 현재 위치를 기준으로 가까운 반려동물 시설을 찾아보세요.',enDesc:'Find nearby pet hospitals, shops, grooming and care services.'},
    music:{eyebrow:'PETGROW SOUND',ko:'Pet음악',en:'Pet Music',koDesc:'강아지와 고양이를 위한 음악을 듣고 좋아요·댓글로 반응을 나눠보세요.',enDesc:'Listen to music for dogs and cats and save your favorites.'},
    news:{eyebrow:'PETGROW NEWS',ko:'Pet뉴스',en:'Pet News',koDesc:'반려견·반려묘·건강·정책 등 최신 반려동물 뉴스를 보기 좋게 모아봐요.',enDesc:'Browse recent pet news with clear summaries and publisher links.'},
    support:{eyebrow:'PETGROW SUPPORT',ko:'고객지원',en:'Support',koDesc:'서비스 이용 중 궁금한 점이나 도움이 필요한 내용을 남겨주세요.',enDesc:'Ask questions or get help using PetGrow.'},
    'ad-inquiry':{eyebrow:'PETGROW PARTNERS',ko:'광고 문의',en:'Advertising',koDesc:'PetGrow와 함께할 광고·제휴 문의를 편하게 남겨주세요.',enDesc:'Contact PetGrow about advertising and partnership opportunities.'}
  };
  const x=meta[view]; if(!x)return null;
  return <section className="nearby-hero bg-card petgrow-unified-hero" style={{width:'100%',maxWidth:'none',margin:'0 0 18px'}}><div><span className="nearby-eyebrow">{x.eyebrow}</span><h1>{lang==='en'?x.en:x.ko}</h1><p>{lang==='en'?x.enDesc:x.koDesc}</p>{view==='pets'&&<small className="nearby-search-help">🐾 {lang==='en'?'Register dogs and cats separately and keep their changes organized over time.':'강아지와 고양이 정보를 각각 등록하고 우리 아이의 변화를 차곡차곡 기록해보세요.'}</small>}</div></section>;
}

function HomePage({ account, pets = [], lang, onGoPets, onGoView }) {
  const t = useT();
  const visiblePets = account ? pets : [];
  const pet = visiblePets[0] || null;
  const petName = pet ? normalizePetDisplayText(pet.profile?.name, lang === "en" ? "My Pet" : "우리 아이") : "";
  const accountName = normalizePetDisplayText(account?.name, "");
  const weight = pet?.records?.length ? pet.records[pet.records.length - 1]?.weightKg : pet?.profile?.initialWeightKg;
  const allQuick = [
    ["pets", "🐾", lang === "en" ? "My Pet" : "우리 아이"],
    ["music", "🎵", lang === "en" ? "Pet Music" : "Pet음악"],
    ["news", "📰", lang === "en" ? "Pet News" : "Pet뉴스"],
    ["nearby", "📍", lang === "en" ? "Nearby Pet" : "내 주변 Pet"],
    ["community", "💬", lang === "en" ? "Pet Talk" : "Pet톡"],
    ["petbti", "🧠", "PetBTI"],
    ["saju", "🔮", lang === "en" ? "Pet Saju" : "Pet사주"],
    ["tarot", "🃏", lang === "en" ? "Pet Tarot" : "Pet타로"],
    ["tips", "💡", lang === "en" ? "Pet Info" : "Pet정보"],
    ["guide", "📚", lang === "en" ? "Guide" : "정보가이드"]
  ];
  const defaultQuickKeys=["pets","music","news","nearby","community","petbti"];
  const quickStorageKey=account?.id?`petgrow_quick_${account.id}`:"petgrow_quick_guest";
  const [quickKeys,setQuickKeys]=useState(()=>{try{const v=JSON.parse(localStorage.getItem(quickStorageKey)||"null");return Array.isArray(v)&&v.length?v.slice(0,6):defaultQuickKeys;}catch{return defaultQuickKeys;}});
  const [quickEditing,setQuickEditing]=useState(false);
  const [homeNews,setHomeNews]=useState([]);
  useEffect(()=>{
    let cancelled=false;
    fetch('/api/news').then(r=>r.ok?r.json():null).then(j=>{if(cancelled)return;const items=Array.isArray(j?.items)?j.items:[];const score=x=>{const h=(x.title+' '+x.description);let n=0;if(/정책|법|제도|정부|지자체|동물보호법/.test(h))n+=4;if(/건강|질병|감염|백신|병원|수의|안전|주의|리콜/.test(h))n+=5;if(/유기|보호|입양|학대/.test(h))n+=3;return n;};setHomeNews([...items].sort((a,b)=>score(b)-score(a)||new Date(b.publishedAt||0)-new Date(a.publishedAt||0)).slice(0,3));}).catch(()=>{});
    return()=>{cancelled=true};
  },[]);
  useEffect(()=>{
    let cancelled=false;
    if(!account?.id)return;
    fetch('/api/state?key=home_quick_menu').then(r=>r.ok?r.json():null).then(j=>{if(cancelled)return;const v=j?.value;if(Array.isArray(v)&&v.length)setQuickKeys(v.filter(k=>allQuick.some(x=>x[0]===k)).slice(0,6));}).catch(()=>{});
    return()=>{cancelled=true};
  },[account?.id]);
  const saveQuick=(next)=>{const clean=next.filter(k=>allQuick.some(x=>x[0]===k)).slice(0,6);setQuickKeys(clean);try{localStorage.setItem(quickStorageKey,JSON.stringify(clean));}catch{}if(account?.id)fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'home_quick_menu',value:clean})}).catch(()=>{});};
  const toggleQuick=(key)=>{if(quickKeys.includes(key))saveQuick(quickKeys.filter(k=>k!==key));else if(quickKeys.length<6)saveQuick([...quickKeys,key]);};
  const moveQuick=(key,dir)=>{const i=quickKeys.indexOf(key);if(i<0)return;const j=dir==='first'?0:dir==='last'?quickKeys.length-1:i+(dir==='left'?-1:1);if(j<0||j>=quickKeys.length||j===i)return;const next=[...quickKeys];next.splice(i,1);next.splice(j,0,key);saveQuick(next);};
  const [quickDragKey,setQuickDragKey]=useState(null);
  const reorderQuick=(fromKey,toKey)=>{if(!fromKey||!toKey||fromKey===toKey)return;const from=quickKeys.indexOf(fromKey),to=quickKeys.indexOf(toKey);if(from<0||to<0)return;const next=[...quickKeys];const [moved]=next.splice(from,1);next.splice(to,0,moved);saveQuick(next);};
  const beginQuickPointerDrag=(e,key)=>{setQuickDragKey(key);try{e.currentTarget.setPointerCapture?.(e.pointerId)}catch{}};
  const moveQuickPointer=(e)=>{if(!quickDragKey)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-quick-key]');const over=el?.dataset?.quickKey;if(over&&over!==quickDragKey){reorderQuick(quickDragKey,over);setQuickDragKey(over);}};
  const endQuickPointerDrag=()=>setQuickDragKey(null);
  const quick=quickKeys.map(k=>allQuick.find(x=>x[0]===k)).filter(Boolean);
  return (
    <div className="legal-page-shell petgrow-dashboard-home">
      <section className="dash-welcome">
        <div><span className="dash-eyebrow">PetGrow</span><h1>{accountName ? t.homeGreeting(accountName) : (lang === "en" ? "Welcome to PetGrow! 🐾" : "오늘도 우리 아이와 행복한 하루 🐾")}</h1><p>{lang === "en" ? "Everything your pet needs, in one simple dashboard." : "우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요."}</p></div>
        <button type="button" className="dash-profile-dot" onClick={() => onGoView(account ? "my" : "pets")} aria-label="마이페이지">{"MY"}</button>
      </section>

      <section className={`dash-pet-spotlight ${pet ? "has-pet" : "empty"}`} onClick={onGoPets}>
        {pet ? <>
          <div className="dash-pet-photo">{pet.profile.profileImage ? <img src={pet.profile.profileImage} alt={`${petName || "반려동물"} 프로필`} fetchPriority="high" /> : <span>{pet.species === "cat" ? "🐱" : "🐶"}</span>}</div>
          <div className="dash-pet-copy"><small>{lang === "en" ? "TODAY WITH MY PET" : "오늘의 우리 아이"}</small><h2 className="pet-user-name">{petName}</h2><p>{[pet.profile.breedName, petAgeLabel(pet.profile.birthDate, lang)].filter(Boolean).join(" · ")}</p><div className="dash-pet-metrics"><span><b>{weight ? `${Number(weight).toFixed(1)}kg` : "—"}</b><small>{lang === "en" ? "Weight" : "현재 체중"}</small></span><span><b>{pet.profile.gender === "male" ? "♂" : pet.profile.gender === "female" ? "♀" : "—"}</b><small>{lang === "en" ? "Gender" : "성별"}</small></span><span><b>{pet.species === "cat" ? "CAT" : "DOG"}</b><small>{lang === "en" ? "Type" : "구분"}</small></span></div></div>
          <div className="dash-pet-arrow">›</div>
        </> : <><div className="dash-empty-icon">＋</div><div><h2>{lang === "en" ? "Add your pet" : "우리 아이를 등록해보세요"}</h2><p>{lang === "en" ? "Start growth records and personalized features." : "성장 기록과 맞춤 기능을 바로 시작할 수 있어요."}</p></div><div className="dash-pet-arrow">›</div></>}
      </section>

      <TodayPetHomeCard account={account} onOpenSaju={()=>onGoView("saju")} onOpenTarot={()=>onGoView("tarot")} lang={lang} />

      <section className="dash-section"><div className="dash-section-head"><h2>{lang === "en" ? "Quick access" : "자주 사용하는 메뉴"}</h2><button type="button" className="bg-chip" onClick={()=>setQuickEditing(v=>!v)}>{quickEditing?(lang==='en'?'Done':'완료'):(lang==='en'?'Edit':'편집')}</button></div>{quickEditing&&<div className="bg-card" style={{padding:14,marginBottom:12}}><p className="bg-sub" style={{fontSize:12,margin:'0 0 10px'}}>{lang==='en'?'Choose up to six shortcuts, then reorder them below. Signed-in choices sync to your account.':'원하는 메뉴를 최대 6개까지 선택한 뒤 아래에서 순서를 바꿀 수 있어요. 로그인하면 계정에 저장돼 다른 기기에서도 그대로 보여요.'}</p><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{allQuick.map(([key,icon,label])=><button type="button" key={key} className={`bg-chip ${quickKeys.includes(key)?'active':''}`} onClick={()=>toggleQuick(key)}>{icon} {label}</button>)}</div><div className="quick-order-list">{quick.map(([key,icon,label])=><div className={`quick-order-row ${quickDragKey===key?'dragging':''}`} data-quick-key={key} key={key} draggable onDragStart={()=>setQuickDragKey(key)} onDragOver={e=>{e.preventDefault();if(quickDragKey&&quickDragKey!==key){reorderQuick(quickDragKey,key);setQuickDragKey(key)}}} onDragEnd={endQuickPointerDrag}><span><i>{icon}</i><b>{label}</b></span><button type="button" className="quick-drag-handle" aria-label={`${label} 순서 이동`} title={lang==='en'?'Drag to reorder':'끌어서 순서 변경'} onPointerDown={e=>beginQuickPointerDrag(e,key)} onPointerMove={moveQuickPointer} onPointerUp={endQuickPointerDrag} onPointerCancel={endQuickPointerDrag}>≡</button></div>)}</div></div>}<div className="dash-quick-grid">{quick.map(([key,icon,label])=><button type="button" key={key} onClick={()=>key==="pets"?onGoPets():onGoView(key)}><i>{icon}</i><span>{label}</span></button>)}</div>
      {/* HOME_INFO_MUSIC_SAFE_20260819 */}
      <HomeInfoMusicSections lang={lang} onGoView={onGoView} tips={TIPS_DATA} /></section>

      {homeNews.length>0&&<section className="dash-section"><div className="dash-section-head"><h2>{lang==='en'?'Important Pet News':'주요 Pet뉴스'}</h2><button type="button" className="bg-chip" onClick={()=>onGoView('news')}>{lang==='en'?'View all':'전체보기'}</button></div><div style={{display:'grid',gap:10}}>{homeNews.map(n=><button key={n.id} type="button" className="bg-card" onClick={()=>onGoView('news')} style={{padding:'15px 16px',textAlign:'left',border:'1px solid var(--border)',cursor:'pointer'}}><small style={{fontWeight:800,color:'var(--primary)'}}>{n.category||'Pet뉴스'} · {n.source||''}</small><div style={{fontWeight:800,fontSize:15,lineHeight:1.5,marginTop:5}}>{n.title}</div><small className="bg-sub">{n.publishedAt?new Date(n.publishedAt).toLocaleDateString('ko-KR'):''}</small></button>)}</div></section>}

      <section className="dash-widget-grid">
        <button type="button" className="dash-widget dash-widget-music" onClick={()=>onGoView("music")}><div className="dash-widget-icon">🎵</div><div><small>{lang === "en" ? "PET MUSIC" : "PET MUSIC"}</small><h3>{lang === "en" ? "Popular TOP5 & my likes" : "인기 TOP5 · 내가 좋아요한 음악"}</h3><p>{lang === "en" ? "Play, loop and keep your favorites close." : "좋아하는 음악을 바로 듣고 반복재생해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-nearby" onClick={()=>onGoView("nearby")}><div className="dash-widget-icon">📍</div><div><small>{lang === "en" ? "NEARBY PET" : "내 주변 PET"}</small><h3>{lang === "en" ? "Find pet places near me" : "가까운 반려동물 시설 찾기"}</h3><p>{lang === "en" ? "Hospitals, shops, grooming and daycare." : "병원·약국·펫샵·미용·유치원을 거리순으로 확인해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-talk" onClick={()=>onGoView("community")}><div className="dash-widget-icon">💬</div><div><small>PET TALK</small><h3>{lang === "en" ? "Share everyday moments" : "우리 아이 이야기를 나눠요"}</h3><p>{lang === "en" ? "Questions, tips and cute moments." : "질문·정보·일상 이야기를 편하게 공유해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-content" onClick={()=>onGoView("petbti")}><div className="dash-widget-icon">🧠</div><div><small>PET CONTENT</small><h3>{lang === "en" ? "Pet personality test" : "우리 아이 PetBTI"}</h3><p>{lang === "en" ? "A 20-question personality test for dogs and cats." : "강아지·고양이 각 20문항으로 성향을 알아봐요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-saju" onClick={()=>onGoView("saju")}><div className="dash-widget-icon">🔮</div><div><small>PET SAJU</small><h3>{lang === "en" ? "Fun pet fortune" : "Pet사주"}</h3><p>{lang === "en" ? "Enjoy a lighthearted fortune story for your pet." : "우리 아이의 특별한 이야기를 재미로 만나보세요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-guide" onClick={()=>onGoView("guide")}><div className="dash-widget-icon">📚</div><div><small>GUIDE</small><h3>{lang === "en" ? "PetGrow guide" : "정보가이드"}</h3><p>{lang === "en" ? "See how each PetGrow feature works." : "PetGrow의 주요 기능 사용법을 한곳에서 확인해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-news" onClick={()=>onGoView("news")}><div className="dash-widget-icon">📰</div><div><small>PET NEWS</small><h3>{lang === "en" ? "Pet news at a glance" : "최신 Pet뉴스"}</h3><p>{lang === "en" ? "Read clear titles and short summaries." : "반려동물 주요 소식을 제목과 핵심 요약으로 확인해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-tarot" onClick={()=>onGoView("tarot")}><div className="dash-widget-icon">🃏</div><div><small>PET TAROT</small><h3>{lang === "en" ? "Daily Pet Tarot" : "오늘의 Pet타로"}</h3><p>{lang === "en" ? "Draw one card for each daily topic." : "오늘·궁합·마음·산책·조언 카드 메시지를 만나보세요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-info" onClick={()=>onGoView("tips")}><div className="dash-widget-icon">💡</div><div><small>PET INFO</small><h3>{lang === "en" ? "Practical pet info" : "Pet정보"}</h3><p>{lang === "en" ? "Health, food, training and daily care." : "건강·식단·훈련·생활 정보를 쉽고 빠르게 찾아봐요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-pets" onClick={onGoPets}><div className="dash-widget-icon">🐾</div><div><small>MY PET</small><h3>{lang === "en" ? "Manage my pets" : "우리 아이 관리"}</h3><p>{lang === "en" ? "Profiles, growth records and photos." : "프로필·성장기록·사진과 건강정보를 한곳에서 관리해요."}</p></div><b>›</b></button>
      </section>
    </div>
  );
}

// 모바일 앱 하단 6탭 — 핵심 기능 5개 + 더보기로 단순하게 유지해요.
function AppBottomNav({ active, onNavigate }) {
  const t = useT();
  const items = [
    { key: "home", label: t.hamNavHome, Icon: HomeIcon },
    { key: "pets", label: t.appTabPetInfo, Icon: PawIcon },
    { key: "music", label: "Pet음악", Icon: MusicIcon },
    { key: "nearby", label: "내 주변 Pet", Icon: MapPinIcon },
    { key: "community", label: "Pet톡", Icon: TalkIcon },
    { key: "more", label: "더보기", Icon: PlusIcon },
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

function MoreMenuPage({ lang, onNavigate }) {
  const items = [
    ["news","📰","Pet뉴스",lang==="en"?"Latest pet news":"반려견·반려묘·건강·정책 등 최신 뉴스"],
    ["saju","🔮","Pet사주",lang==="en"?"Fun pet fortune content":"우리 아이의 재미있는 Pet사주"],
    ["tarot","🃏","Pet타로",lang==="en"?"One card per topic each day":"오늘·궁합·마음·산책·조언 주제별 하루 한 장"],
    ["petbti","🧠","PetBTI",lang==="en"?"20-question personality test":"강아지·고양이 20문항 성향 테스트"],
    ["tips","💡","Pet정보",lang==="en"?"Health and daily pet guides":"건강·식단·훈련·생활 정보"],
    ["my","👤",lang==="en"?"My page":"회원정보",lang==="en"?"Account and my activity":"계정·좋아요·내 활동 관리"],
    ["support","💬",lang==="en"?"Support":"고객지원",lang==="en"?"Notices and feedback":"공지·문의·피드백"],
    ["about","ℹ️",lang==="en"?"About PetGrow":"소개",lang==="en"?"Learn about PetGrow":"PetGrow 서비스 소개"],
    ["guide","📚",lang==="en"?"Guide":"정보가이드",lang==="en"?"How to use each feature":"전체 기능 사용 가이드"],
  ];
  return <div className="legal-page-shell more-menu-page"><div className="more-menu-head"><span>MORE</span><h1>{lang==="en"?"More PetGrow features":"더 많은 PetGrow 기능"}</h1><p>{lang==="en"?"Choose the feature you need.":"자주 쓰는 기능은 하단에, 나머지 기능은 여기서 깔끔하게 찾아보세요."}</p></div><div className="more-menu-grid">{items.map(([key,icon,title,desc])=><button type="button" key={key} className={`more-menu-card more-menu-${key}`} onClick={()=>onNavigate(key)}><i>{icon}</i><div><b>{title}</b><span>{desc}</span></div><em>›</em></button>)}</div></div>;
}

// Pet콘텐츠 (전체 | Pet사주 | PetBTI | Pet정보) — 앱 하단탭에서만 진입하는 통합 콘텐츠 허브
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
          <HomeServiceCard Illust={IllustSaju} bg="#F1F5F1" title={t.sajuNav} desc={t.homeCardSajuDesc} onClick={() => onSubTabChange("saju")} />
          <HomeServiceCard Illust={IllustPetBti} bg="#EEF5EF" title={t.petBtiNav} desc={t.homeCardPetBtiDesc} onClick={() => onSubTabChange("petbti")} />
          <HomeServiceCard Illust={IllustTips} bg="#F3F7F3" title={t.tipsTitle} desc={t.homeCardTipsDesc} onClick={() => onSubTabChange("tips")} />
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

function PetPointVisibleCard({account,compact=false}){
  const [summary,setSummary]=useState(null);
  const load=()=>{if(!account?.id){setSummary(null);return}apiJson('/api/points?action=summary').then(setSummary).catch(()=>{})};
  useEffect(()=>{if(!account?.id){setSummary(null);return};let alive=true;apiJson('/api/points?action=summary').then(j=>{if(alive)setSummary(j)}).catch(()=>{});const h=e=>{const ev=e.detail||{};setSummary(v=>v?{...v,balance:ev.balance??v.balance}:v);setTimeout(()=>{if(alive)load()},180)};window.addEventListener('petgrow:points',h);const poll=setInterval(()=>{if(alive)load()},5000);return()=>{alive=false;clearInterval(poll);window.removeEventListener('petgrow:points',h)}},[account?.id]);
  const balance=summary?.balance;
  return <section className={'petpoint-visible '+(compact?'compact':'about')}><div className="petpoint-visible-icon">🪙</div><div className="petpoint-visible-copy"><small>PETPOINT · LIVE</small><h2>{compact?'현재 PetPoint를 바로 확인하세요':'PetPoint로 PetGrow를 더 재미있게'}</h2><p>{account?.id?(balance==null?'포인트를 불러오는 중이에요.':`현재 ${Number(balance).toLocaleString()}P · 적립과 사용이 바로 반영돼요.`):'처음 로그인하면 1,000P가 지급돼요. 하루 첫 접속·Pet톡 활동으로 더 모을 수 있어요.'}</p></div><div className="petpoint-visible-actions"><b>{account?.id&&balance!=null?`${Number(balance).toLocaleString()}P`:'시작 1,000P'}</b><span>오늘 운세 20P · 기본 사주 50P · 궁합 40P</span></div></section>;
}

function InfoGuidePage() {
  const [guideSearch,setGuideSearch]=useState("");
  const [activeKey,setActiveKey]=useState("pets");
  const guides=[
    {key:"pets",icon:"🐾",title:"우리 아이",sub:"프로필과 기본정보를 한곳에서",tone:"mint",intro:"반려동물 정보를 먼저 등록하면 PetGrow의 다른 기능을 더 편하게 이용할 수 있어요.",steps:["우리 아이 메뉴에서 강아지 또는 고양이를 선택해요.","이름·생년월일·품종·성별·현재 체중과 사진을 입력해요.","등록 후 성장기록과 각 콘텐츠에서 우리 아이를 선택해 이용해요."],faq:"여러 마리를 등록해도 아이 선택 메뉴에서 바로 바꿀 수 있어요.",tip:"처음이라면 가장 먼저 우리 아이 등록부터 시작해 보세요."},
    {key:"growth",icon:"📈",title:"성장 기록",sub:"사진과 체중 변화를 차곡차곡",tone:"sage",intro:"하루하루 달라지는 모습을 사진과 체중 기록으로 모아볼 수 있어요.",steps:["우리 아이에서 성장 기록을 열어요.","날짜와 체중을 입력하고 필요하면 사진을 추가해요.","누적된 기록과 그래프로 변화 흐름을 확인해요."],faq:"사진은 성장앨범에서 수정하거나 삭제할 수 있어요.",tip:"같은 시간대와 비슷한 조건으로 체중을 기록하면 변화 비교가 쉬워요."},
    {key:"saju",icon:"🔮",title:"Pet사주",sub:"재미로 보는 우리 아이 이야기",tone:"cream",intro:"등록한 생년월일을 바탕으로 성격·인연·놀이 스타일과 오늘의 운세를 재미로 살펴봐요.",steps:["등록된 우리 아이를 선택해요.","기본 Pet사주·오늘의 펫운세·보호자 궁합 중 원하는 메뉴를 골라요.","필요한 PetPoint를 확인한 뒤 결과를 읽어봐요."],faq:"Pet사주는 재미와 참고용 콘텐츠이며 실제 미래를 판단하는 자료가 아니에요.",tip:"결과는 우리 아이의 실제 행동과 함께 가볍게 참고해 주세요."},
    {key:"tarot",icon:"🃏",title:"Pet타로",sub:"22장 중 마음이 가는 카드 한 장",tone:"gold",intro:"카드를 천천히 섞고 펼친 뒤 마음이 가는 한 장을 골라 오늘의 메시지를 확인해요.",steps:["오늘·궁합·마음·산책·조언 중 주제를 선택해요.","카드가 섞이고 펼쳐지는 동안 우리 아이를 떠올려요.","22장 중 한 장을 선택하고 상세 해석을 확인해요."],faq:"같은 아이·같은 주제의 오늘 카드는 하루 동안 바뀌지 않아요.",tip:"카드 한 장보다 결과의 ‘오늘의 실천 포인트’를 가볍게 활용해 보세요."},
    {key:"petbti",icon:"🧠",title:"PetBTI",sub:"20문항으로 알아보는 행동 성향",tone:"blue",intro:"평소 행동을 기준으로 질문에 답하면 우리 아이의 성향을 재미있게 확인할 수 있어요.",steps:["검사할 우리 아이를 선택해요.","20개 질문에 평소 행동을 떠올리며 답해요.","완료 후 성향 결과와 세부 특징을 확인해요."],faq:"전문 행동진단이 아니라 반려생활 이해를 돕는 재미 콘텐츠예요.",tip:"특별한 날보다 평소 모습에 가까운 답을 고르는 게 좋아요."},
    {key:"music",icon:"🎵",title:"Pet음악",sub:"강아지·고양이 음악을 편하게",tone:"rose",intro:"휴식·수면·놀이 등에 어울리는 음악을 듣고 좋아요와 댓글로 반응을 남길 수 있어요.",steps:["전체·강아지·고양이 탭에서 음악을 찾아요.","원하는 곡을 눌러 재생하고 반복 방식을 선택해요.","좋아하는 음악은 좋아요를 눌러 회원정보에서 다시 확인해요."],faq:"관리자가 등록한 음악과 커버는 관리자센터에서 수정할 수 있어요.",tip:"음악은 반려동물의 반응을 보면서 편안한 볼륨으로 들려주세요."},
    {key:"nearby",icon:"📍",title:"내 주변 Pet",sub:"1km 안의 가까운 업체를 가볍게",tone:"mint",intro:"주소나 현재 위치를 기준으로 가까운 동물병원·약국·미용·펫샵 등을 찾아볼 수 있어요.",steps:["주소를 검색하거나 현재 위치 검색을 선택해요.","1km 안의 가까운 업체를 목록과 지도에서 확인해요.","목록에서 업체를 누르면 지도에서 해당 위치를 집중해서 볼 수 있어요."],faq:"현재 위치는 주변 검색과 거리 계산에 일시적으로만 사용돼요.",tip:"업체 정보와 영업시간은 방문 전에 전화나 지도 원문에서 한 번 더 확인해 주세요."},
    {key:"community",icon:"💬",title:"Pet톡",sub:"반려생활 이야기를 나누는 커뮤니티",tone:"sage",intro:"일상·질문·건강·산책 등 다양한 주제로 다른 보호자들과 이야기를 나눌 수 있어요.",steps:["Pet톡에서 원하는 카테고리나 글을 찾아봐요.","글쓰기에서 우리 아이와 제목·내용·사진을 등록해요.","댓글과 좋아요로 소통하고 회원정보에서 내 활동을 확인해요."],faq:"글과 댓글 활동으로 PetPoint를 모을 수 있으며 일일 적립 한도가 있어요.",tip:"개인정보나 타인의 권리를 침해하는 내용은 게시하지 말아 주세요."},
    {key:"news",icon:"📰",title:"Pet뉴스",sub:"최신 반려동물 소식을 보기 쉽게",tone:"cream",intro:"반려견·반려묘·건강·정책 등 최신 뉴스를 요약과 함께 확인할 수 있어요.",steps:["Pet뉴스 목록에서 관심 있는 기사를 선택해요.","PetGrow 안에서 핵심 요약을 먼저 확인해요.","자세한 내용은 원문 전체보기를 통해 언론사 페이지에서 확인해요."],faq:"뉴스는 기사 전문을 복사하지 않고 검색 결과의 설명을 바탕으로 요약해 보여줘요.",tip:"의료·정책 관련 내용은 기사 작성일과 원문을 함께 확인해 주세요."},
    {key:"points",icon:"🪙",title:"PetPoint",sub:"활동하고 모아서 재미 콘텐츠 이용",tone:"gold",intro:"현금 결제가 아닌 PetGrow 내부 무료 활동 포인트예요. Pet톡 활동과 하루 첫 접속으로 모을 수 있어요.",steps:["처음 이용하면 기본 1,000P가 지급돼요.","Pet톡 글·댓글·좋아요 받기와 하루 첫 접속으로 포인트를 모아요.","Pet사주·오늘의 운세·보호자 궁합·Pet타로 이용 시 안내된 포인트가 차감돼요."],faq:"현금 구매·환전·출금·양도는 지원하지 않아요.",tip:"회원정보와 홈에서 현재 포인트를 실시간으로 확인할 수 있어요."},
    {key:"my",icon:"👤",title:"회원정보",sub:"계정·내 활동·저장 기록 관리",tone:"blue",intro:"닉네임과 계정 정보, Pet톡 활동, 좋아요한 음악과 저장 기록을 한곳에서 관리해요.",steps:["회원정보에서 현재 계정과 PetPoint를 확인해요.","Pet톡 내 활동과 좋아요한 콘텐츠를 펼쳐 확인해요.","필요하면 정보 수정·로그아웃·회원탈퇴 메뉴를 이용해요."],faq:"동일한 카카오 계정으로 로그인하면 서버에 저장된 지원 데이터가 동기화돼요.",tip:"회원탈퇴 전 필요한 기록이 남아 있는지 먼저 확인해 주세요."}
  ];
  const filtered=guides;
  const active=guides.find(g=>g.key===activeKey)||guides[0];
  const quick=["pets","growth","saju","tarot","petbti","music","nearby","community","news","my"];
  return <div className="guide-premium-page">
    <section className="guide-search-only bg-card"><div className="guide-search-box"><span>⌕</span><input value={guideSearch} onChange={e=>setGuideSearch(e.target.value)} placeholder="무엇을 도와드릴까요? 예: 타로, 음악, 포인트" /></div></section>
    {!q&&<section className="guide-start-card"><div className="guide-section-title"><div><small>START HERE</small><h2>처음 시작 3단계</h2></div><span>처음이라면 이 순서대로 해보세요</span></div><div className="guide-start-grid"><article><b>1</b><span>🐾</span><h3>우리 아이 등록</h3><p>기본 정보를 입력하고 프로필을 만들어보세요.</p></article><article><b>2</b><span>▦</span><h3>기능 선택</h3><p>필요한 기능을 골라 PetGrow를 둘러보세요.</p></article><article><b>3</b><span>💬</span><h3>기록 · 커뮤니티</h3><p>기록을 남기고 Pet톡에서 함께 소통해보세요.</p></article></div></section>}
    {!q&&<section className="guide-quick-section"><div className="guide-section-title"><div><small>POPULAR</small><h2>자주 찾는 기능</h2></div><span>카드를 누르면 바로 설명을 볼 수 있어요</span></div><div className="guide-quick-grid">{quick.map(k=>{const g=guides.find(x=>x.key===k);return <button key={k} type="button" className={`guide-quick-card tone-${g.tone} ${activeKey===k?"active":""}`} onClick={()=>{setActiveKey(k);document.getElementById("guide-detail")?.scrollIntoView({behavior:"smooth",block:"start"})}}><span>{g.icon}</span><b>{g.title}</b><small>{g.sub}</small></button>})}</div></section>}
    {q&&<section className="guide-search-results"><div className="guide-section-title"><div><small>SEARCH</small><h2>검색 결과 {filtered.length}개</h2></div></div><div className="guide-search-result-grid">{filtered.map(g=><button key={g.key} type="button" onClick={()=>{setActiveKey(g.key);setGuideSearch("");setTimeout(()=>document.getElementById("guide-detail")?.scrollIntoView({behavior:"smooth",block:"start"}),30)}}><span>{g.icon}</span><div><b>{g.title}</b><small>{g.sub}</small></div><em>›</em></button>)}</div>{!filtered.length&&<div className="guide-empty">검색 결과가 없어요. 다른 단어로 검색해보세요.</div>}</section>}
    <section id="guide-detail" className={`guide-detail-card tone-${active.tone}`}><div className="guide-detail-visual"><div className="guide-detail-orb">{active.icon}</div><span>PetGrow</span><i>✦</i></div><div className="guide-detail-main"><small>FEATURE GUIDE</small><h2>{active.title}</h2><p className="guide-detail-intro">{active.intro}</p><div className="guide-detail-tabs"><span className="active">이용 방법</span><span>초보자 팁</span><span>꼭 알아두기</span></div><div className="guide-step-list">{active.steps.map((step,i)=><article key={i}><b>{i+1}</b><div><h3>{i===0?"시작하기":i===1?"이용하기":"확인하기"}</h3><p>{step}</p></div></article>)}</div><div className="guide-note-grid"><div><b>💡 초보자 TIP</b><p>{active.tip}</p></div><div><b>✓ 꼭 알아두기</b><p>{active.faq}</p></div></div></div></section>
  </div>;
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

function CmPetLine({ pet, lang, right, authorNickname }) {
  const t = useT();
  return (
    <div className="cm-pet-row">
      <CmPetAvatar pet={pet} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{authorNickname || pet.name}</div>
        <div className="bg-sub" style={{ fontSize: 11 }}>
          {[pet.name, pet.breed, petAgeLabel(pet.birthDate, lang)].filter(Boolean).join(" · ")}
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
        <CmPetLine pet={post.pet} lang={lang} authorNickname={post.authorNickname} right={<span className="bg-sub" style={{ fontSize: 11 }}>{timeAgoLabel(post.createdAt, lang)}</span>} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="cm-cat-chip" style={{ marginBottom: 0 }}>{t.communityCategoryLabels[post.category]}</span>
        {post.isOwner && (
          <span className="cm-cat-chip" style={{ marginBottom: 0, background: post.isPublic ? "#EDF5EE" : "#F1F1F1", color: post.isPublic ? "var(--primary)" : "var(--sub)" }}>
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
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
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
    // iPhone 사진은 HEIC/HEIF로 전달되는 경우가 있어 원본 MIME만으로 차단하지 않아요.
    // 브라우저가 읽을 수 있는 이미지라면 canvas에서 JPEG로 변환·축소한 뒤 서버에 업로드합니다.
    if (!file || !(file.type || "").startsWith("image/")) {
      setErrors((e) => ({ ...e, images: t.communityImageInvalidType })); return;
    }
    setErrors((e) => ({ ...e, images: "" }));
    setUploading(true);
    try {
      let uploadDataUrl = await fileToCompressedDataUrl(file, 1280, 0.74);
      // 서버리스 요청/DB 대체 저장 모두 안정적으로 처리되도록 단계적으로 압축해요.
      if (uploadDataUrl.length > 1_600_000) uploadDataUrl = await fileToCompressedDataUrl(file, 960, 0.64);
      if (uploadDataUrl.length > 900_000) uploadDataUrl = await fileToCompressedDataUrl(file, 720, 0.56);
      const url = await communityUploadImage(uploadDataUrl);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      console.error("community image upload failed", err);
      const msg = String(err?.message || "");
      const friendly = msg.includes("too large") ? "사진 용량이 너무 커요. 다른 사진을 선택해주세요."
        : msg.includes("unauthenticated") ? "로그인 상태를 확인한 뒤 다시 시도해주세요."
        : msg.includes("invalid") ? "이 사진 형식을 읽지 못했어요. JPG 또는 PNG 사진으로 다시 시도해주세요."
        : t.communityUploadFailed;
      setErrors((e) => ({ ...e, images: friendly }));
    }
    setUploading(false);
  };
  const handleRemoveImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    const next = {};
    if (!petId) next.pet = t.communityComposeErrPet;
    if (!title.trim()) next.title = t.communityComposeErrTitle;
    if (!content.trim()) next.content = t.communityComposeErrContent;
    const blockedMessage = validatePetTalkText(title, content);
    if (blockedMessage) next.submit = blockedMessage;
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
    } catch (err) {
      setErrors({ submit: err?.message || t.communityUploadFailed });
      if (err?.message) window.alert(err.message);
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
          <span style={{ fontWeight: 800, fontSize: 12 }}>{comment.authorNickname || comment.pet.name}</span>
          <span className="bg-sub" style={{ fontSize: 11 }}>· {comment.pet.name}</span>
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
    const blockedMessage = validatePetTalkText(commentText);
    if (blockedMessage) { window.alert(blockedMessage); return; }
    const pet = pets.find((p) => p.id === commentPetId);
    try {
      const c = await communityAddComment(postId, { pet: petSnapshot(pet), content: commentText.trim() });
      setComments((prev) => [...prev, c]);
      setCommentText("");
      setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
    } catch (err) { if (err?.message) window.alert(err.message); }
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
        <CmPetLine pet={post.pet} lang={lang} authorNickname={post.authorNickname} right={<span className="bg-sub" style={{ fontSize: 11 }}>{timeAgoLabel(post.createdAt, lang)}</span>} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="cm-cat-chip" style={{ marginBottom: 0 }}>{t.communityCategoryLabels[post.category]}</span>
        {post.isOwner && (
          <span className="cm-cat-chip" style={{ marginBottom: 0, background: post.isPublic ? "#EDF5EE" : "#F1F1F1", color: post.isPublic ? "var(--primary)" : "var(--sub)" }}>
            {post.isPublic ? `🌐 ${t.communityVisibilityPublic}` : `🔒 ${t.communityVisibilityPrivate}`}
          </span>
        )}
      </div>
      {post.category === "health" && (
        <div className="bg-surface-card" style={{ fontSize: 11, color: "var(--sub)", marginBottom: 12 }}>{t.communityHealthNotice}</div>
      )}
      <div className="cm-detail-body-card">
        <h1 style={{ fontSize: 19, marginBottom: 10 }}>{post.title}</h1>
        {post.images.length > 0 && <div style={{ marginBottom: 14 }}><PhotoCarousel images={post.images} /></div>}
        <p className="cm-detail-content">{post.content}</p>
      </div>

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
        <div className="cm-owner-actions">
          <button type="button" className="cm-owner-action-btn" onClick={onEdit}>{t.communityEditBtn}</button>
          <button type="button" className="cm-owner-action-btn" disabled={changingVisibility} onClick={toggleVisibility}>
            {post.isPublic ? t.communityMakePrivate : t.communityMakePublic}
          </button>
          <button type="button" className="cm-owner-action-btn danger" onClick={() => setDeleteConfirmOpen(true)}>
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

function CommunityFeed({ pets, lang, onOpenPost, onWrite, onMyActivity }) {
  const t = useT();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError,setLoadError]=useState("");

  const loadPage = async (nextPage) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await communityListPosts({ category, sort, search, page: nextPage });
      setPosts(res.posts || []);
      setHasMore(!!res.hasMore);
      setPage(nextPage);
      if (nextPage > 1 && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) { setLoadError(e?.message||"Pet톡을 불러오지 못했어요."); }
    setLoading(false);
  };

  useEffect(() => { loadPage(1); }, [category, sort, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="legal-page-shell pettalk-feed-shell">
      {loadError&&<div className="pettalk-inline-error"><span>Pet톡 접속 시 오류가 발생했어요. {loadError}</span><button type="button" className="bg-chip" onClick={()=>loadPage(1)}>다시 시도</button></div>}
      <div className="cm-search-actions">
        <input type="text" className="cm-search-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")setSearch(searchInput.trim());}} placeholder={t.communitySearchPlaceholder} />
        <button type="button" className="bg-btn bg-btn-ghost cm-search-btn" onClick={()=>setSearch(searchInput.trim())}><SearchIcon style={{width:14,height:14}}/> 검색</button>
        <button type="button" className="bg-btn cm-write-btn" onClick={onWrite}><PlusIcon style={{ width: 14, height: 14 }} /> {t.communityWriteBtn}</button>
      </div>

      <ResponsiveCategoryMenu
        className="community-responsive-categories"
        items={[{ id: "all", label: t.communityCategoryAll }, ...COMMUNITY_CATEGORY_KEYS.map((k) => ({ id: k, label: t.communityCategoryLabels[k] }))]}
        activeId={category}
        lang={lang}
        onSelect={setCategory}
      />

      <div className="cm-sort-row">
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={`bg-chip ${sort === "latest" ? "active" : ""}`} onClick={() => setSort("latest")}>
            {t.communitySortLatest}
          </button>
          <button type="button" className={`bg-chip ${sort === "popular" ? "active" : ""}`} onClick={() => setSort("popular")}>
            {t.communitySortPopular}
          </button>
        </div>
        <button type="button" className="cm-my-activity-btn" onClick={onMyActivity}>
          <UserIcon style={{ width: 15, height: 15 }} /> {t.communityMyActivityNav}
        </button>
      </div>

      <div className="cm-sample-showcase">
        <div className="cm-sample-head"><div><span>PET TALK PREVIEW</span><b>{lang === "en" ? "See sample posts first" : "카테고리별 Pet톡 예시"}</b></div><small>{lang === "en" ? "One sample for every category." : "카테고리마다 예시글 1개씩 바로 확인할 수 있어요."}</small></div>
        <div className="cm-demo-grid">
          {[
            ["daily","mint","🐶","버터네 보호자","말티푸 · 4개월","오늘 첫 산책 다녀왔어요 🐾","처음엔 조금 긴장하더니 마지막에는 꼬리도 살랑살랑 흔들었어요. 천천히 익숙해지는 모습이 너무 기특하네요!",8,2],
            ["brag","coral","🐱","모모네 가족","코리안숏헤어 · 1살","우리 집 모델 포즈 자랑해요 📸","창가에 앉아 있길래 사진 찍었는데 표정이 너무 근엄해서 자랑하러 왔어요. 오늘도 귀여움 한도 초과예요!",13,3],
            ["question","blue","🐶","두부네 보호자","비숑 · 7개월","산책 중 갑자기 멈춰요, 괜찮을까요?","요즘 산책하다가 몇 분씩 가만히 서 있을 때가 있어요. 냄새 맡는 건지 쉬는 건지 비슷한 경험 있으셨나요?",5,6],
            ["health","rose","🐱","구름네 집사","랙돌 · 2살","물을 평소보다 자주 마셔요","며칠 전부터 물 마시는 횟수가 늘어난 것 같아서 기록 중이에요. 계속되면 병원 상담도 받아보려고 해요.",7,4],
            ["info","teal","🐶","콩이네 보호자","푸들 · 3살","여름 산책 전 바닥 온도 체크 팁","손등을 바닥에 잠깐 대보고 너무 뜨거우면 시간을 늦춰 산책하고 있어요. 물도 꼭 챙겨가요!",18,5],
            ["walk","olive","🐶","보리네 보호자","말티푸 · 1살","오늘은 천천히 냄새 산책 🌿","평소보다 짧게 걷고 냄새 맡는 시간을 충분히 줬더니 집에 와서 편안하게 쉬네요.",11,2],
            ["training","violet","🐶","밤이네 보호자","토이푸들 · 10개월","기다려 연습 5초 성공했어요!","간식 앞에서 1초부터 시작해서 오늘 처음 5초까지 성공했어요. 짧게 자주 연습하니 조금씩 늘고 있어요.",16,5],
            ["shopping","amber","🐱","나비네 집사","코리안숏헤어 · 3살","털 날림 적은 방석 추천 부탁해요","세탁하기 쉽고 털이 너무 달라붙지 않는 방석을 찾고 있어요. 직접 써보신 제품이 있다면 알려주세요!",6,7],
            ["free","slate","🐱","호두네 가족","브리티시숏헤어 · 2살","오늘도 박스가 제일 좋은 호두 📦","새 장난감보다 택배 박스에 먼저 들어가네요. 다들 우리 아이만의 최애 장소가 있나요?",12,4],
          ].filter(([key])=>category==="all"||key===category).map(([key,tone,emoji,author,pet,title,body,likes,comments]) => (
            <div className="cm-demo-card" data-tone={tone} key={key}>
              <span className="cm-demo-badge">{lang === "en" ? "Sample" : "예시"}</span>
              <div className="cm-pet-row"><span className="cm-pet-avatar-fallback">{emoji}</span><div><div style={{fontWeight:800,fontSize:13}}>{author}</div><div className="bg-sub" style={{fontSize:11}}>{pet}</div></div></div>
              <div className="cm-cat-chip">{t.communityCategoryLabels[key]}</div>
              <div className="cm-title">{title}</div>
              <div className="cm-content-preview">{body}</div>
              <div className="cm-meta-row"><span>♡ {likes}</span><span>💬 {comments}</span></div>
            </div>
          ))}
        </div>
      </div>

      {posts.length === 0 && !loading ? (
        <p className="bg-sub" style={{ textAlign: "center", padding: "18px 0 14px" }}>{t.communityEmptyFeed}</p>
      ) : (
        <div className="cm-feed-grid">
          {posts.map((p) => <PostCard key={p.id} post={p} lang={lang} onOpen={() => onOpenPost(p.id)} />)}
        </div>
      )}

      {(page > 1 || hasMore) && <ResponsivePagination page={page} totalPages={Math.max(page, hasMore ? page + 1 : page)} lang={lang} disabled={loading} onChange={loadPage} />}
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
      <div className="my-activity-tabs" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
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





function PublicNoticePopup(){
 const [notice,setNotice]=useState(null);
 useEffect(()=>{let live=true;getPopupNotice().then(r=>{
   if(!live)return;
   const list=(r.items||[]).sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||new Date(b.created_at)-new Date(a.created_at));
   const n=list[0]; if(!n)return;
   const key=`petgrow_notice_hide_${n.id}_${new Date().toISOString().slice(0,10)}`;
   if(localStorage.getItem(key)!=="1")setNotice(n);
 }).catch(()=>{});return()=>{live=false}},[]);
 if(!notice)return null;
 const hideToday=()=>{const key=`petgrow_notice_hide_${notice.id}_${new Date().toISOString().slice(0,10)}`;localStorage.setItem(key,"1");setNotice(null)};
 return <div className="notice-popup-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setNotice(null)}}>
   <div className="notice-popup-card" onMouseDown={e=>e.stopPropagation()}>
     <button className="notice-popup-x" onClick={()=>setNotice(null)}>×</button>
     <div className="notice-popup-badge">{notice.pinned?"중요 공지":"공지사항"}</div>
     <h2>{notice.title}</h2><div className="notice-popup-content">{notice.content}</div>
     <div className="notice-popup-actions"><button onClick={hideToday}>오늘 하루 보지 않기</button><button className="primary" onClick={()=>setNotice(null)}>확인</button></div>
   </div>
 </div>;
}


function PublicDirectAds(){
 const [banner,setBanner]=useState(null),[modal,setModal]=useState(null);
 useEffect(()=>{let live=true;adsApi("active").then(r=>{
   if(!live)return;const items=r.items||[];
   const b=items.find(x=>x.placement==="banner");
   const m=items.find(x=>x.placement==="promo_modal");
   if(b){setBanner(b);adTrack(b.id,"impression").catch(()=>{})}
   if(m&&!sessionStorage.getItem(`petgrow_ad_seen_${m.id}`)){sessionStorage.setItem(`petgrow_ad_seen_${m.id}`,"1");setModal(m);adTrack(m.id,"impression").catch(()=>{})}
 }).catch(()=>{});return()=>{live=false}},[]);
 const go=a=>{adTrack(a.id,"click").catch(()=>{});if(a.target_url)window.open(a.target_url,"_blank","noopener,noreferrer")};
 return <>
  {banner&&<div className="public-ad-banner"><button onClick={()=>go(banner)}>{banner.image_url?<img src={banner.image_url} alt={banner.name||"광고"}/>:<span>{banner.name}</span>}</button><small>광고</small></div>}
  {modal&&<div className="direct-ad-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="direct-ad-modal" onMouseDown={e=>e.stopPropagation()}><button className="notice-popup-x" onClick={()=>setModal(null)}>×</button><small>광고</small><button className="direct-ad-creative" onClick={()=>go(modal)}>{modal.image_url?<img src={modal.image_url} alt={modal.name||"프로모션"}/>:<strong>{modal.name}</strong>}</button></div></div>}
 </>;
}

function AdInquiryPage({onBack}){
 const [f,setF]=useState({companyName:"",contactName:"",email:"",phone:"",campaignType:"banner",budget:"",message:""});
 const [privacyAgree,setPrivacyAgree]=useState(false),[privacyOpen,setPrivacyOpen]=useState(false);
 const submit=async()=>{if(!privacyAgree){window.alert("광고·제휴 문의를 위한 개인정보 수집·이용에 동의해 주세요.");return}if(!window.confirm("광고 문의를 전송할까요?"))return;try{await submitAdInquiry({...f,privacyConsent:true,privacyConsentAt:new Date().toISOString()});window.alert("광고 문의가 접수됐어요. 확인 후 연락드릴게요.");setF({companyName:"",contactName:"",email:"",phone:"",campaignType:"banner",budget:"",message:""});setPrivacyAgree(false)}catch(e){window.alert(e.message)}};
 return <div className="support-page ad-inquiry-page"><div className="support-head ad-inquiry-head"><div><h1>광고 문의</h1><p>PetGrow 배너·팝업·제휴 광고를 문의할 수 있어요.</p></div><button className="bg-btn bg-btn-ghost ad-inquiry-back" onClick={onBack}>← 돌아가기</button></div><div className="bg-card support-write">
 <input className="bg-input" placeholder="회사/브랜드명 *" value={f.companyName} onChange={e=>setF({...f,companyName:e.target.value})}/>
 <input className="bg-input" placeholder="담당자명 *" value={f.contactName} onChange={e=>setF({...f,contactName:e.target.value})}/>
 <input className="bg-input" type="email" placeholder="이메일 *" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
 <input className="bg-input" placeholder="연락처 (선택)" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
 <select className="bg-input" value={f.campaignType} onChange={e=>setF({...f,campaignType:e.target.value})}><option value="banner">배너 광고</option><option value="popup">팝업 광고</option><option value="sponsor">제휴/스폰서십</option><option value="other">기타</option></select>
 <input className="bg-input" placeholder="예상 예산 (선택)" value={f.budget} onChange={e=>setF({...f,budget:e.target.value})}/>
 <textarea className="bg-input support-textarea" placeholder="광고 내용, 희망 기간, 랜딩페이지 등을 적어주세요. *" value={f.message} onChange={e=>setF({...f,message:e.target.value})}/>
 <label className="support-public-toggle"><input type="checkbox" checked={privacyAgree} onChange={e=>setPrivacyAgree(e.target.checked)}/><span><b>[필수] 광고·제휴 문의 개인정보 수집·이용 동의</b><small>회사/브랜드명, 담당자명, 이메일, 문의 내용(필수)과 연락처·광고유형·예산(선택)을 상담 및 제휴 검토 목적으로 처리합니다.</small></span><button type="button" className="consent-view-btn" onClick={(e)=>{e.preventDefault();setPrivacyOpen(true)}}>보기</button></label>
 <small>접수된 정보는 광고 문의 상담과 계약 검토 목적으로만 사용됩니다.</small><button className="bg-btn" onClick={submit}>광고 문의 보내기</button></div>
 <Modal open={privacyOpen} onClose={()=>setPrivacyOpen(false)} width={520}><h3>광고·제휴 문의 개인정보 수집·이용 동의</h3><div className="consent-detail-text"><b>필수 항목</b><br/>회사/브랜드명, 담당자명, 이메일, 문의 내용<br/><br/><b>선택 항목</b><br/>연락처, 광고 유형, 예산 등 이용자가 직접 입력한 정보<br/><br/><b>이용 목적</b><br/>광고·제휴 상담, 견적·캠페인 협의 및 문의 이력 관리<br/><br/><b>보유 기간</b><br/>상담·제휴 검토 등 처리 목적 달성 시까지. 관계 법령상 보관이 필요한 경우 해당 기간 동안 보관합니다.<br/><br/>동의를 거부할 수 있으나, 필수 정보 수집에 동의하지 않으면 광고·제휴 문의 접수가 어렵습니다.</div><button className="bg-btn" onClick={()=>{setPrivacyAgree(true);setPrivacyOpen(false)}}>동의하고 닫기</button></Modal>
 </div>
}


function PetMusicPage({ account, lang }) {
  const [species,setSpecies]=useState("all"),[page,setPage]=useState(1),[data,setData]=useState({items:[],top5:[],pages:1,total:0}),[loading,setLoading]=useState(true);
  const [current,setCurrent]=useState(null),[playing,setPlaying]=useState(false),[repeatMode,setRepeatMode]=useState("one"),[openComments,setOpenComments]=useState(null),[comments,setComments]=useState({}),[commentText,setCommentText]=useState("");
  const [editingMusicCommentId,setEditingMusicCommentId]=useState(null),[editingMusicCommentText,setEditingMusicCommentText]=useState("");
  const audioRef=useRef(null);
  const musicCacheRef=useRef(window.__petgrowMusicCache||(window.__petgrowMusicCache=new Map()));
  const load=async(sp=species,pg=page)=>{
    const key=`${sp}:${pg}`;
    const cached=musicCacheRef.current.get(key);
    if(cached){setData(cached);setLoading(false);return;}
    setLoading(true);
    try{const next=await musicList(sp,pg);if((next?.items||[]).length||Number(next?.total||0)>0)musicCacheRef.current.set(key,next);else musicCacheRef.current.delete(key);setData(next)}catch(e){console.error(e);musicCacheRef.current.delete(key);setData({items:[],top5:[],pages:1,total:0})}finally{setLoading(false)}
  };
  useEffect(()=>{load(species,page)},[species,page]);
  const playTrack=async(track)=>{setCurrent(track);setPlaying(true);musicTrackPlay(track.id).catch(()=>{});setTimeout(()=>audioRef.current?.play().catch(()=>setPlaying(false)),0)};
  const togglePlay=track=>{if(current?.id!==track.id)return playTrack(track);const a=audioRef.current;if(!a)return;if(a.paused){a.play().then(()=>setPlaying(true)).catch(()=>{})}else{a.pause();setPlaying(false)}};
  const onEnded=()=>{if(!current)return;if(repeatMode==="one"){audioRef.current.currentTime=0;audioRef.current.play().catch(()=>{});return;}if(repeatMode==="all"&&data.items.length){const i=data.items.findIndex(x=>x.id===current.id),next=data.items[(i+1+data.items.length)%data.items.length];if(next)playTrack(next);return;}setPlaying(false)};
  const cycleRepeat=()=>setRepeatMode(x=>x==="one"?"all":x==="all"?"off":"one");
  const likedTracks=data.items.filter(x=>x.liked);
  const doLike=async(track)=>{if(!account){window.alert(lang==="en"?"Please log in to like a track.":"좋아요는 로그인 후 이용할 수 있어요.");return;}const before=!!track.liked;const patch=x=>x.id===track.id?{...x,liked:!before,like_count:Math.max(0,Number(x.like_count||0)+(before?-1:1))}:x;setData(d=>({...d,items:d.items.map(patch),top5:d.top5.map(patch)}));try{const r=await musicToggleLike(track.id);setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,liked:!!r.liked}:x),top5:d.top5.map(x=>x.id===track.id?{...x,liked:!!r.liked}:x)}))}catch(e){setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,liked:before,like_count:Number(track.like_count||0)}:x),top5:d.top5.map(x=>x.id===track.id?{...x,liked:before,like_count:Number(track.like_count||0)}:x)}));window.alert(e.message)}};
  const toggleComments=async(track)=>{if(openComments===track.id){setOpenComments(null);return;}setOpenComments(track.id);try{const r=await musicComments(track.id);setComments(c=>({...c,[track.id]:r.items||[]}))}catch{setComments(c=>({...c,[track.id]:[]}))}};
  const addComment=async(track)=>{const text=commentText.trim();if(!account){window.alert(lang==="en"?"Please log in to comment.":"댓글은 로그인 후 이용할 수 있어요.");return;}if(!text)return;const temp={id:`temp-${Date.now()}`,nickname:account?.name||"나",content:text,is_owner:true,created_at:new Date().toISOString()};setCommentText("");setComments(c=>({...c,[track.id]:[...(c[track.id]||[]),temp]}));setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,comment_count:Number(x.comment_count||0)+1}:x),top5:d.top5.map(x=>x.id===track.id?{...x,comment_count:Number(x.comment_count||0)+1}:x)}));try{await musicAddComment(track.id,text);const r=await musicComments(track.id);setComments(c=>({...c,[track.id]:r.items||[]}))}catch(e){setComments(c=>({...c,[track.id]:(c[track.id]||[]).filter(x=>x.id!==temp.id)}));setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,comment_count:Math.max(0,Number(x.comment_count||0)-1)}:x),top5:d.top5.map(x=>x.id===track.id?{...x,comment_count:Math.max(0,Number(x.comment_count||0)-1)}:x)}));window.alert(e.message)}};
  const startEditMusicComment=(c)=>{setEditingMusicCommentId(c.id);setEditingMusicCommentText(c.content||"");};
  const cancelEditMusicComment=()=>{setEditingMusicCommentId(null);setEditingMusicCommentText("");};
  const saveMusicComment=async(track,c)=>{const text=editingMusicCommentText.trim();if(!text)return;const old=c.content;setComments(x=>({...x,[track.id]:(x[track.id]||[]).map(v=>v.id===c.id?{...v,content:text,updated_at:new Date().toISOString()}:v)}));cancelEditMusicComment();try{await musicUpdateComment(c.id,text)}catch(e){setComments(x=>({...x,[track.id]:(x[track.id]||[]).map(v=>v.id===c.id?{...v,content:old}:v)}));window.alert(e.message)}};
  const deleteMusicComment=async(track,c)=>{if(!window.confirm("이 댓글을 삭제할까요?"))return;const before=comments[track.id]||[];setComments(x=>({...x,[track.id]:(x[track.id]||[]).filter(v=>v.id!==c.id)}));setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,comment_count:Math.max(0,Number(x.comment_count||0)-1)}:x),top5:d.top5.map(x=>x.id===track.id?{...x,comment_count:Math.max(0,Number(x.comment_count||0)-1)}:x)}));try{await musicDeleteComment(c.id)}catch(e){setComments(x=>({...x,[track.id]:before}));setData(d=>({...d,items:d.items.map(x=>x.id===track.id?{...x,comment_count:Number(x.comment_count||0)+1}:x),top5:d.top5.map(x=>x.id===track.id?{...x,comment_count:Number(x.comment_count||0)+1}:x)}));window.alert(e.message)}};
  const reportMusicComment=async(c)=>{if(!account){window.alert("신고는 로그인 후 이용할 수 있어요.");return;}const detail=window.prompt("신고 사유를 간단히 입력해 주세요. (욕설·광고·개인정보·허위정보 등)","부적절한 내용");if(detail===null)return;try{const r=await musicReportComment(c.id,detail);window.alert(r.already?"이미 신고한 댓글이에요.":"신고가 접수됐어요. 운영진이 확인할게요.")}catch(e){window.alert(e.message)}};
  const speciesLabel=x=>x==="dog"?(lang==="en"?"Dog":"강아지"):x==="cat"?(lang==="en"?"Cat":"고양이"):(lang==="en"?"All":"전체");
  const vocalLabel=x=>x==="vocal"?(lang==="en"?"Vocal":"🎤 보컬"):(lang==="en"?"Instrumental":"🎼 인스트루멘탈");
  const moodLabel=x=>({relax:lang==="en"?"Relax":"😌 휴식",sleep:lang==="en"?"Sleep":"🌙 수면",play:lang==="en"?"Play":"🐾 놀이",nature:lang==="en"?"Nature":"🌿 자연"}[x]||(lang==="en"?"Relax":"😌 휴식"));
  return <div className="petmusic-page">
    <section className="petmusic-hero"><small style={{fontWeight:900,color:"var(--primary)"}}>PETGROW SOUND</small><h1>{lang==="en"?"Pet Music":"Pet음악"}</h1><p className="bg-sub">{lang==="en"?"Music for dogs and cats. Loop favorites and share your pet's reaction with likes and comments.":"강아지·고양이를 위한 음악을 편하게 듣고 반복재생해보세요. 인스트루멘탈을 중심으로 제공하고 좋아요와 댓글로 우리 아이의 반응도 함께 남겨요."}</p></section>
    <div className="petmusic-tabs">{["all","dog","cat"].map(x=><button key={x} className={species===x?"active":""} onClick={()=>{setSpecies(x);setPage(1)}}>{x==="dog"?"🐶 ":x==="cat"?"🐱 ":"🎧 "}{speciesLabel(x)}</button>)}</div>
    {!!likedTracks.length&&<><h2 style={{fontSize:18,margin:"0 0 12px"}}>❤️ {lang==="en"?"My liked music":"내가 좋아요 누른 음악"}</h2><div className="petmusic-top5">{likedTracks.slice(0,5).map(x=><button key={x.id} className="petmusic-rank" onClick={()=>playTrack(x)}><div>{x.cover_url?<img src={x.cover_url} alt="" loading="lazy"/>:<div className="petmusic-rank-cover">🎵</div>}</div><b>{x.title}</b><small>♥ {Number(x.like_count)||0} · 💬 {Number(x.comment_count)||0}</small></button>)}</div></>}
    {!!data.top5.length&&<><h2 style={{fontSize:18,margin:"0 0 12px"}}>🏆 {lang==="en"?"Popular TOP 5":"인기 TOP 5"}</h2><div className="petmusic-top5">{data.top5.map((x,i)=><button key={x.id} className="petmusic-rank" onClick={()=>playTrack(x)}><div style={{position:"relative"}}>{x.cover_url?<img src={x.cover_url} alt=""/>:<div className="petmusic-rank-cover">🎵</div>}<span style={{position:"absolute",left:7,top:7,width:24,height:24,borderRadius:99,display:"grid",placeItems:"center",background:"rgba(255,255,255,.93)",fontSize:11,fontWeight:900}}>#{i+1}</span></div><b>{x.title}</b><small>♥ {Number(x.like_count)||0} · 💬 {Number(x.comment_count)||0}</small></button>)}</div></>}
    {current&&<div className="bg-card" style={{display:"flex",gap:12,alignItems:"center",marginBottom:18,padding:12,position:"sticky",top:8,zIndex:4}}>{current.cover_url?<img src={current.cover_url} alt="" style={{width:52,height:52,borderRadius:13,objectFit:"cover"}}/>:<div className="petmusic-rank-cover" style={{width:52,height:52,flex:"0 0 52px",fontSize:22}}>🎵</div>}<div style={{flex:1,minWidth:0}}><b style={{display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{current.title}</b><small className="bg-sub">{playing?(lang==="en"?"Playing now":"재생 중"):(lang==="en"?"Paused":"일시정지")}</small></div><button className="petmusic-play" onClick={()=>togglePlay(current)}>{playing?"Ⅱ":"▶"}</button><button className={`petmusic-loop ${repeatMode!=="off"?"active":""}`} onClick={cycleRepeat}>{repeatMode==="one"?"🔂 1곡":repeatMode==="all"?"🔁 전체":"↪ 반복 OFF"}</button></div>}
    <audio ref={audioRef} src={current?.audio_url||""} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={onEnded}/>
    {loading?<div className="bg-card" style={{textAlign:"center"}}>음악을 불러오는 중...</div>:data.items.length?<div className="petmusic-grid">{data.items.map(track=><article className="petmusic-card" key={track.id}>{track.cover_url?<img className="petmusic-cover" src={track.cover_url} alt={`${track.title} cover`}/>:<div className="petmusic-cover">🎵</div>}<div style={{minWidth:0}}><div className="petmusic-title">{track.title}</div><div className="petmusic-date">{speciesLabel(track.species)} · {new Date(track.created_at).toLocaleDateString(lang==="en"?"en-US":"ko-KR")}</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}><span className="cm-cat-chip" style={{margin:0,fontSize:10}}>{vocalLabel(track.vocal_type)}</span><span className="cm-cat-chip" style={{margin:0,fontSize:10}}>{moodLabel(track.mood)}</span></div>{track.description&&<div className="bg-sub" style={{fontSize:11,marginTop:5,lineHeight:1.45}}>{track.description}</div>}<div className="petmusic-player"><button className="petmusic-play" onClick={()=>togglePlay(track)}>{current?.id===track.id&&playing?"Ⅱ":"▶"}</button><span className="bg-sub" style={{fontSize:10}}>▶ {Number(track.play_count)||0}</span></div><div className="petmusic-actions"><button className={track.liked?"liked":""} onClick={()=>doLike(track)}>♥ {Number(track.like_count)||0}</button><button onClick={()=>toggleComments(track)}>💬 {Number(track.comment_count)||0}</button></div>{openComments===track.id&&<div className="petmusic-comments">{(comments[track.id]||[]).slice(0,20).map(c=><div className={`petmusic-comment-row ${c.is_owner?"mine":""}`} key={c.id}><div className="petmusic-comment-head"><b>{c.nickname||"PetGrow"}</b><small>{c.updated_at&&c.updated_at!==c.created_at?"수정됨":""}</small></div>{editingMusicCommentId===c.id?<div className="petmusic-comment-edit"><input value={editingMusicCommentText} onChange={e=>setEditingMusicCommentText(e.target.value)} maxLength={300}/><div><button onClick={cancelEditMusicComment}>취소</button><button onClick={()=>saveMusicComment(track,c)}>저장</button></div></div>:<p>{c.content}</p>}<div className="petmusic-comment-actions">{c.is_owner?<><button onClick={()=>startEditMusicComment(c)}>수정</button><button className="danger" onClick={()=>deleteMusicComment(track,c)}>삭제</button></>:<button onClick={()=>reportMusicComment(c)}>🚩 신고</button>}</div></div>)}<div className="petmusic-comment-form"><input value={commentText} onChange={e=>setCommentText(e.target.value)} maxLength={300} placeholder={lang==="en"?"How did your pet react?":"우리 아이 반응을 남겨주세요"}/><button onClick={()=>addComment(track)}>등록</button></div></div>}</div></article>)}</div>:<div className="bg-card" style={{textAlign:"center",padding:32}}><div style={{fontSize:36,marginBottom:8}}>🎵</div><b>{lang==="en"?"No music has been uploaded yet.":"아직 등록된 음악이 없어요."}</b></div>}
    <ResponsivePagination page={page} totalPages={data.pages} lang={lang} onChange={(n)=>{setPage(n);window.scrollTo({top:0,behavior:"smooth"})}} />
  </div>;
}

function AdminMusicPanel(){
  const [items,setItems]=useState([]),[busy,setBusy]=useState(false),[editing,setEditing]=useState(null);
  const blank={title:"",description:"",species:"all",vocalType:"instrumental",mood:"relax",active:true,audioFile:null,coverFile:null,audioUrl:"",coverUrl:""};
  const [form,setForm]=useState(blank),[uploadStage,setUploadStage]=useState("");
  const load=async()=>{try{const r=await adminMusicList();setItems(r.items||[])}catch(e){window.alert(e.message)}};
  useEffect(()=>{load()},[]);
  const pickAudio=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>12*1024*1024){window.alert("음원 파일은 12MB 이하로 올려주세요.");e.target.value="";return;}setForm(x=>({...x,audioFile:f}))};
  const pickCover=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>4*1024*1024){window.alert("커버 이미지는 4MB 이하로 올려주세요.");e.target.value="";return;}setForm(x=>({...x,coverFile:f}))};
  const uploadDirect=async(file,kind)=>{const {upload}=await import("@vercel/blob/client");const ext=(file.name.split(".").pop()||(kind==="cover"?"jpg":"mp3")).toLowerCase();const path=`petmusic/${kind==="cover"?"covers/":""}${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;return await upload(path,file,{access:"public",handleUploadUrl:"/api/music?action=upload",clientPayload:JSON.stringify({adminToken:sessionStorage.getItem("petgrow_admin_token")||"",kind})})};
  const save=async()=>{if(!form.title.trim())return window.alert("노래 제목을 입력해 주세요.");if(!editing&&!form.audioFile)return window.alert("음원 파일을 선택해 주세요.");setBusy(true);try{let audioUrl=editing?.audio_url||form.audioUrl||"",coverUrl=editing?.cover_url||form.coverUrl||"/petmusic/covers/blank-white.svg";if(form.audioFile){setUploadStage("음원을 빠르게 업로드하는 중…");try{audioUrl=(await uploadDirect(form.audioFile,"audio")).url}catch{setUploadStage("음원을 안전하게 업로드하는 중…");const d=await fileToDataUrl(form.audioFile);const r=await adminMusicSave({title:form.title,description:form.description,species:form.species,vocalType:form.vocalType,mood:form.mood,active:form.active,id:editing?.id||undefined,audioDataUrl:d,audioUrl,coverUrl});audioUrl=r.audioUrl||audioUrl;}}if(form.coverFile){setUploadStage("새 커버 이미지를 업로드하는 중…");try{coverUrl=(await uploadDirect(form.coverFile,"cover")).url}catch{setUploadStage("새 커버 이미지를 안전하게 적용하는 중…");const d=await fileToCompressedDataUrl(form.coverFile,760,.78);const r=await adminMusicSave({title:form.title,description:form.description,species:form.species,vocalType:form.vocalType,mood:form.mood,active:form.active,id:editing?.id||undefined,coverDataUrl:d,audioUrl,coverUrl});coverUrl=r.coverUrl||coverUrl;}}setUploadStage("등록 정보를 저장하는 중…");await adminMusicSave({title:form.title,description:form.description,species:form.species,vocalType:form.vocalType,mood:form.mood,active:form.active,id:editing?.id||undefined,audioUrl,coverUrl});window.alert(editing?"Pet음악을 수정했어요.":"Pet음악을 등록했어요.");setEditing(null);setForm(blank);await load()}catch(e){window.alert(e.message)}finally{setBusy(false);setUploadStage("")}};
  const edit=x=>{setEditing(x);setForm({title:x.title||"",description:x.description||"",species:x.species||"all",vocalType:x.vocal_type||"instrumental",mood:x.mood||"relax",active:x.active!==false,audioFile:null,coverFile:null,audioUrl:x.audio_url||"",coverUrl:x.cover_url||""});window.scrollTo({top:0,behavior:"smooth"});};
  return <div className="admin-report-list"><div className="bg-card"><h2>🎵 Pet음악 관리</h2><p className="bg-sub">음원을 등록하면 제목·설명과 함께 사용자 Pet음악 메뉴에 연결돼요. 새 음악의 커버는 기본 흰색으로 등록되고, 이후 수정에서 원하는 사진으로 교체할 수 있어요. 보컬 여부와 분위기 태그도 지정할 수 있고, 업로드일은 자동 기록되며 좋아요·댓글·재생수로 인기 TOP5가 계산됩니다.</p><div className="admin-music-form" style={{marginTop:14}}><input className="bg-input" placeholder="노래 제목" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="bg-input" value={form.species} onChange={e=>setForm({...form,species:e.target.value})}><option value="all">🐾 공용</option><option value="dog">🐶 강아지</option><option value="cat">🐱 고양이</option></select><select className="bg-input" value={form.vocalType} onChange={e=>setForm({...form,vocalType:e.target.value})}><option value="instrumental">🎼 인스트루멘탈</option><option value="vocal">🎤 보컬 있음</option></select><select className="bg-input" value={form.mood} onChange={e=>setForm({...form,mood:e.target.value})}><option value="relax">😌 휴식</option><option value="sleep">🌙 수면</option><option value="play">🐾 놀이</option><option value="nature">🌿 자연</option></select><textarea className="bg-input support-textarea full" placeholder="간단한 설명 (선택)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><label className="bg-card" style={{padding:12}}><b style={{fontSize:12}}>음원 파일 {editing?"(교체할 때만 선택)":""}</b><input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac" onChange={pickAudio} style={{display:"block",marginTop:8,width:"100%"}}/><small className="bg-sub">MP3/WAV/M4A · 최대 12MB</small></label><label className="bg-card" style={{padding:12}}><b style={{fontSize:12}}>커버/로고 이미지 {editing?"(새 사진을 선택하면 바로 교체)":""}</b>{editing&&form.coverUrl&&<img src={form.coverUrl} alt="현재 커버" style={{display:"block",width:72,height:72,objectFit:"cover",borderRadius:14,marginTop:8,border:"1px solid var(--border)"}}/>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickCover} style={{display:"block",marginTop:8,width:"100%"}}/><small className="bg-sub">{form.coverFile?`새 커버 선택됨: ${form.coverFile.name}`:"정사각형 이미지 권장 · JPG/PNG/WebP · 기존 음악도 수정에서 교체 가능"}</small></label><label className="full" style={{fontSize:12,fontWeight:700}}><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> 사용자에게 공개</label><div className="full" style={{display:"flex",gap:8}}><button className="bg-btn" disabled={busy} onClick={save}>{busy?(uploadStage||"업로드 중…"):editing?"수정 저장":"음악 등록"}</button>{editing&&<button className="bg-btn bg-btn-ghost" onClick={()=>{setEditing(null);setForm(blank)}}>취소</button>}</div></div></div><div className="bg-card"><h3>등록된 음악 {items.length}곡</h3><div className="admin-music-list">{items.length?items.map(x=><div className="admin-music-row" key={x.id}>{x.cover_url?<img className="admin-music-thumb" src={x.cover_url} alt=""/>:<div className="admin-music-thumb">🎵</div>}<div><b>{x.title}</b><small>{x.species==="dog"?"강아지":x.species==="cat"?"고양이":"공용"} · {x.vocal_type==="vocal"?"보컬":"인스트루멘탈"} · {({relax:"휴식",sleep:"수면",play:"놀이",nature:"자연"}[x.mood]||"휴식")} · {new Date(x.created_at).toLocaleDateString("ko-KR")} · ▶ {Number(x.play_count)||0} · ♥ {Number(x.like_count)||0} · 💬 {Number(x.comment_count)||0}</small></div><div className="admin-music-actions"><button onClick={()=>edit(x)}>수정</button><button onClick={async()=>{await adminMusicToggle(x.id,!x.active);await load()}}>{x.active?"비공개":"공개"}</button><button onClick={async()=>{if(!window.confirm(`'${x.title}' 음악을 삭제할까요?`))return;await adminMusicDelete(x.id);await load()}}>삭제</button></div></div>):<p className="bg-sub">등록된 음악이 없어요.</p>}</div></div></div>;
}

function SupportPage({account,onBack,lang="ko"}){
  const [section,setSection]=useState("notices"),[page,setPage]=useState(1),[data,setData]=useState({items:[],total:0}),[open,setOpen]=useState(null);
  const [form,setForm]=useState({category:"inquiry",title:"",body:"",isPublic:false});
  const load=async()=>{try{const r=section==="notices"?await supportNotices(page):await supportInquiries(page,section==="mine");setData(r)}catch(e){window.alert(e.message)}};
  useEffect(()=>{load()},[section,page]);
  const submit=async()=>{if(!account){window.alert(lang==="en"?"Please log in to submit an inquiry.":"로그인 후 문의를 작성할 수 있어요.");return}if(!form.title.trim()||!form.body.trim()){window.alert(lang==="en"?"Please enter a title and message.":"제목과 내용을 입력해 주세요.");return}if(!window.confirm(lang==="en"?`Submit this ${form.isPublic?"public":"private"} inquiry?`:`${form.isPublic?"공개":"비공개"} 문의로 등록할까요?`))return;try{await supportCreateInquiry(form);setForm({category:"inquiry",title:"",body:"",isPublic:false});setSection("mine");setPage(1);await load();window.alert(lang==="en"?"Your inquiry was submitted.":"문의/피드백이 등록됐어요.")}catch(e){window.alert(e.message)}};
  const pages=Math.max(1,Math.ceil((data.total||0)/20));
  return <div className="support-page">
    <div className="support-head"><div><h1>고객지원</h1><p>공지사항과 문의/피드백을 확인할 수 있어요.</p></div><button className="bg-btn bg-btn-ghost support-back-right" onClick={onBack}>← 돌아가기</button></div>
    <div className="bg-card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,marginBottom:14,background:"#FFFBE8",borderColor:"#F2DE62"}}><div><b>카카오톡 빠른 상담</b><p className="bg-sub" style={{margin:"4px 0 0"}}>펫그로우 채널의 1:1 채팅창으로 바로 연결돼요.</p></div><a className="kakao-chat-cta" style={{marginTop:0,flex:"0 0 auto"}} href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer"><KakaoChannelIcon style={{width:18,height:18}} />채팅하기</a></div>
    <div className="support-tabs">
      <button className={section==="notices"?"active":""} onClick={()=>{setSection("notices");setPage(1)}}>📢 공지사항</button>
      <button className={section==="public"?"active":""} onClick={()=>{setSection("public");setPage(1)}}>💬 공개 피드백</button>
      {account&&<button className={section==="mine"?"active":""} onClick={()=>{setSection("mine");setPage(1)}}>🔒 내 문의</button>}
      <button className={section==="write"?"active":""} onClick={()=>setSection("write")}>✍️ 문의하기</button>
    </div>
    {section==="write"?<div className="bg-card support-write">
      <h2>문의/피드백 작성</h2>
      <select className="bg-input" aria-label={lang==="en"?"Inquiry category":"문의 유형"} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="inquiry">문의</option><option value="bug">오류신고</option><option value="suggestion">기능제안</option><option value="other">기타</option></select>
      <input className="bg-input" name="support-title" required aria-label={lang==="en"?"Inquiry title":"문의 제목"} maxLength={80} placeholder="제목" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <textarea className="bg-input support-textarea" name="support-body" required aria-label={lang==="en"?"Inquiry message":"문의 내용"} maxLength={3000} placeholder="내용을 입력해 주세요." value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
      <label className="support-public-toggle"><input type="checkbox" checked={form.isPublic} onChange={e=>setForm({...form,isPublic:e.target.checked})}/><span><b>다른 회원에게 공개</b><small>체크 해제하면 운영진만 볼 수 있어요.</small></span></label>
      <button className="bg-btn" disabled={!form.title.trim()||!form.body.trim()} onClick={submit}>등록하기</button>
    </div>:<div className="support-list">
      {(data.items||[]).length===0?<div className="bg-card">아직 등록된 내용이 없어요.</div>:(data.items||[]).map(x=><button className="bg-card support-row" key={x.id} onClick={()=>setOpen(open===x.id?null:x.id)}>
        <div><span className="support-badge">{x.category==="suggestion"?"기능제안":x.category==="bug"?"오류신고":x.category==="notice"?"공지":x.category||"문의"}</span>{x.pinned&&<span className="support-pin">중요</span>}<b>{x.title}</b></div>
        <div className="support-meta">{x.nickname&&<span>{x.nickname}</span>}<span>{x.status==="answered"?"답변완료":x.status==="checking"?"확인중":x.status==="waiting"?"답변대기":""}</span><span>{new Date(x.created_at).toLocaleDateString("ko-KR")}</span></div>
        {open===x.id&&<div className="support-detail"><p>{x.body}</p>{x.admin_reply&&<div className="support-reply"><b>PetGrow 운영팀 답변</b><p>{x.admin_reply}</p></div>}</div>}
      </button>)}
      <ResponsivePagination page={page} totalPages={pages} lang="ko" onChange={setPage} />
    </div>}
  </div>
}


/* PETNEWS_FINAL_INLINE_20260818 */
function PetNewsPage({lang="ko"}){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [category,setCategory]=useState("전체"),[query,setQuery]=useState(""),[page,setPage]=useState(1),[total,setTotal]=useState(0),[totalPages,setTotalPages]=useState(1),[selected,setSelected]=useState(null),[localized,setLocalized]=useState({}),[detail,setDetail]=useState(null),[reaction,setReaction]=useState({likeCount:0,likedByMe:false,comments:[]}),[commentText,setCommentText]=useState(""),[busy,setBusy]=useState(false);
  const detailRef=React.useRef(null),PAGE=20,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];
  const ui={ko:["새로고침","뉴스 검색","기사 자세히 보기 →","기사 핵심 요약","원문 전체보기","좋아요","댓글을 남겨보세요","등록","조건에 맞는 뉴스가 없어요."],en:["Refresh","Search news","Read summary →","Article summary","Open original","Like","Write a comment","Post","No matching news."],ja:["更新","ニュース検索","要約を見る →","記事の要約","原文を見る","いいね","コメントを書く","投稿","該当するニュースがありません。"],zh:["刷新","搜索新闻","查看摘要 →","文章摘要","查看原文","点赞","发表评论","发布","没有符合条件的新闻。"]}[lang]||[];
  const catLabel=c=>({en:{"전체":"All","반려견":"Dogs","반려묘":"Cats","건강":"Health","정책·제도":"Policy","입양·보호":"Adoption","산업·서비스":"Industry","반려동물":"Pets"},ja:{"전체":"すべて","반려견":"犬","반려묘":"猫","건강":"健康","정책·제도":"制度","입양·보호":"保護・譲渡","산업·서비스":"サービス","반려동물":"ペット"},zh:{"전체":"全部","반려견":"犬","반려묘":"猫","건강":"健康","정책·제도":"政策","입양·보호":"领养保护","산업·서비스":"产业服务","반려동물":"宠物"}}[lang]?.[c]||c);
  const clean=v=>String(v||'').replace(/&nbsp;|&#160;|&#xA0;/gi,' ').replace(/\s+/g,' ').trim();
  const summary=v=>{const t=clean(v);return t?t.slice(0,260):(lang==='en'?'Open the original for details.':'자세한 내용은 원문에서 확인해 주세요.')};
  const load=async()=>{setLoading(true);setError('');try{const params=new URLSearchParams({page:String(page),pageSize:String(PAGE),category,query:query.trim()});const j=await apiJson(`/api/news?${params}`);const next=Array.isArray(j.items)?j.items:[];setItems(next);setTotal(Number(j.total)||0);setTotalPages(Math.max(1,Number(j.pages)||1));if(!next.length)setError(j.message||'조건에 맞는 뉴스가 없어요.')}catch(e){setError(e.message||'뉴스를 불러오지 못했어요.')}finally{setLoading(false)}};
  useEffect(()=>{const timer=window.setTimeout(load,query.trim()?280:0);return()=>window.clearTimeout(timer)},[page,category,query]);
  const pages=totalPages,safe=Math.min(page,pages),pageItems=items;
  useEffect(()=>{setPage(1)},[category,query]);
  useEffect(()=>{if(lang==='ko'){setLocalized({});return}const b=pageItems.map(x=>({id:String(x.id||x.link),title:x.title,description:x.description}));if(!b.length)return;fetch('/api/news-localize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang,items:b})}).then(r=>r.ok?r.json():null).then(j=>{if(j?.items){const m={};j.items.forEach(x=>m[x.id]=x);setLocalized(m)}}).catch(()=>{})},[lang,safe,category,query,items.length]);
  const key=n=>String(n?.id||n?.link||n?.title||'');
  const open=n=>{setSelected(n);setDetail(null);setCommentText('');logPetActivity({section:'news',action:'article_view',title:n.title,refKey:key(n)});setTimeout(()=>detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),60)};
  useEffect(()=>{if(!selected)return;let alive=true;const loc=localized[key(selected)]||selected;Promise.all([fetch(`/api/news-detail?url=${encodeURIComponent(selected.link||selected.naverLink||'')}&title=${encodeURIComponent(loc.title||'')}&description=${encodeURIComponent(loc.description||'')}&lang=${lang}`).then(r=>r.ok?r.json():null).catch(()=>null),fetch(`/api/news-community?action=detail&articleKey=${encodeURIComponent(key(selected))}`,{credentials:'include'}).then(r=>r.ok?r.json():null).catch(()=>null)]).then(([d,r])=>{if(alive){setDetail(d||{title:loc.title,summary:summary(loc.description)});if(r)setReaction(r)}});return()=>{alive=false}},[selected,lang,localized]);
  const like=async()=>{if(!selected||busy)return;setBusy(true);try{const r=await apiJson(`/api/news-community?action=like&articleKey=${encodeURIComponent(key(selected))}`,{method:'POST'});setReaction(v=>({...v,likedByMe:r.liked,likeCount:r.likeCount}))}catch(e){window.alert(e.message)}finally{setBusy(false)}};
  const comment=async()=>{const text=commentText.trim();if(!selected||!text||busy)return;setBusy(true);try{const r=await apiJson(`/api/news-community?action=comment&articleKey=${encodeURIComponent(key(selected))}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:text})});setReaction(v=>({...v,comments:[...(v.comments||[]),r.comment]}));setCommentText('')}catch(e){window.alert(e.message)}finally{setBusy(false)}};
  const del=async id=>{if(!window.confirm('댓글을 삭제할까요?'))return;try{await apiJson(`/api/news-community?action=comment&id=${encodeURIComponent(id)}&articleKey=${encodeURIComponent(key(selected))}`,{method:'DELETE'});setReaction(v=>({...v,comments:(v.comments||[]).filter(x=>x.id!==id)}))}catch(e){window.alert(e.message)}};
  const fallback=n=>/고양이|반려묘/.test(`${n.title} ${n.category}`)?'🐱':/강아지|반려견/.test(`${n.title} ${n.category}`)?'🐶':/병원|건강|수의/.test(`${n.title} ${n.category}`)?'🏥':'🐾';
  return <div className="petnews-v10"><div className="petnews-refresh-row"><span>{total?`${total} ${lang==='ko'?'개의 최신 기사':''}`:''}</span><button className="bg-chip" onClick={load}>{ui[0]}</button></div><div className="petnews-tools"><div className="petnews-cats">{cats.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{catLabel(c)}</button>)}</div><div className="petnews-search"><span>⌕</span><input className="bg-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder={ui[1]}/></div></div><div className="petnews-result-count">{total} {lang==='ko'?'건':''}</div>
  {loading?<div className="petnews-state">…</div>:error&&!items.length?<div className="petnews-state error"><b>{error}</b><button className="bg-btn" onClick={load}>{ui[0]}</button></div>:<><div className="petnews-grid">{pageItems.map((n,i)=>{const loc=localized[key(n)]||n;return <article className="petnews-card-v10" key={key(n)||i} onClick={()=>open(n)}><div className="petnews-media">{n.image&&<img src={n.image} alt="" loading="lazy" onError={e=>e.currentTarget.style.display='none'}/>}<div className={`petnews-image-fallback ${n.image?'':'show'}`}><span>{fallback(n)}</span><small>{catLabel(n.category||'반려동물')}</small></div></div><div className="petnews-card-body"><div className="petnews-meta"><span>{catLabel(n.category||'반려동물')}</span><small>{n.source||'Media'}{n.publishedAt?` · ${new Date(n.publishedAt).toLocaleDateString()}`:''}</small></div><h2>{clean(loc.title||n.title)}</h2><p>{summary(loc.description||n.description)}</p><button type="button">{ui[2]}</button></div></article>})}</div>{!pageItems.length&&<div className="petnews-state">{ui[8]}</div>}{pages>1&&<ResponsivePagination page={safe} totalPages={pages} lang={lang} onChange={setPage}/>}</>}
  {selected&&<section ref={detailRef} className="bg-card petnews-inline-detail"><div className="petnews-inline-head"><div><small>{catLabel(selected.category||'반려동물')} · {selected.source||'Media'}</small><h2>{detail?.title||localized[key(selected)]?.title||clean(selected.title)}</h2></div><button className="petnews-inline-close" onClick={()=>setSelected(null)}>×</button></div><div className="petnews-inline-body"><div><div className="petnews-summary-box"><b>{ui[3]}</b><p>{detail?.summary||summary(localized[key(selected)]?.description||selected.description)}</p></div><p className="petnews-source-note">{lang==='en'?'PetGrow provides a concise overview based on the public article description. Open the original for full details.':lang==='ja'?'公開されている記事説明をもとに要点を短くまとめます。詳細は原文をご確認ください。':lang==='zh'?'根据公开的新闻简介整理简短要点，详细内容请查看原文。':'PetGrow는 공개된 기사 설명을 바탕으로 핵심 내용을 짧게 정리해 보여줘요. 세부 내용은 원문에서 확인해 주세요.'}</p><a className="bg-btn" href={selected.link||selected.naverLink} target="_blank" rel="noreferrer">{ui[4]}</a></div>{selected.image&&<img src={selected.image} alt=""/>}</div><div className="petnews-reactions"><div className="petnews-reaction-toolbar"><button className={`petnews-like-btn ${reaction.likedByMe?'active':''}`} disabled={busy} onClick={like}>{reaction.likedByMe?'♥':'♡'} {ui[5]} {Number(reaction.likeCount)||0}</button><span className="bg-sub">💬 {(reaction.comments||[]).length}</span></div><div className="petnews-comment-compose"><input className="bg-input" maxLength={500} value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={ui[6]}/><button className="bg-btn" disabled={busy||!commentText.trim()} onClick={comment}>{ui[7]}</button></div><div className="petnews-comment-list">{(reaction.comments||[]).map(c=><div className="petnews-comment" key={c.id}><div><b>{c.authorNickname}</b><p>{c.content}</p><small>{c.createdAt?new Date(c.createdAt).toLocaleString():''}</small></div>{c.isOwner&&<button onClick={()=>del(c.id)}>삭제</button>}</div>)}</div></div></section>}</div>
}

function PetNewsPrivacyAddendum(){return <section className="bg-card" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}><h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 관련 개인정보 안내</h2><p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 공개 뉴스 검색 API를 이용합니다. 뉴스 조회를 위해 이용자의 이름, 계정정보, 반려동물 정보 등 개인정보를 뉴스 검색 제공자에게 전송하지 않습니다. 원문 보기를 선택하면 외부 언론사 페이지로 이동하며 이후 개인정보 처리는 해당 서비스의 정책이 적용됩니다.</p></section>}
function PetNewsTermsAddendum(){return <section className="bg-card" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}><h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 서비스 이용조건</h2><p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 외부 검색 API 기반의 뉴스 탐색 기능입니다. 기사 내용과 저작권은 각 기사 제공자에게 있으며, 건강·의료·정책 관련 뉴스는 전문적인 진단이나 법률·행정 자문을 대체하지 않습니다.</p></section>}
function AdminReportsPage({onBack}){
 const onClose=onBack;
 const adminAutofillTrap=<div className="admin-autofill-trap" aria-hidden="true">
   <input type="text" name="username" autoComplete="username" tabIndex={-1}/>
   <input type="password" name="password" autoComplete="current-password" tabIndex={-1}/>
 </div>;

 const [status,setStatus]=useState(null),[pin,setPin]=useState(""),[setupCode,setSetupCode]=useState(""),[setupPin,setSetupPin]=useState("");
 const clearAdminPin=()=>{setPin("");setSetupPin("");};
 useEffect(()=>{clearAdminPin();const h=()=>{if(document.visibilityState==="hidden")clearAdminPin()};document.addEventListener("visibilitychange",h);return()=>document.removeEventListener("visibilitychange",h)},[]);
 const [unlocked,setUnlocked]=useState(false),[tab,setTab]=useState("dashboard"),[stats,setStats]=useState(null),[health,setHealth]=useState(null),[reports,setReports]=useState([]),[placeReports,setPlaceReports]=useState([]),[musicCommentReports,setMusicCommentReports]=useState([]),[logs,setLogs]=useState([]);
 const [reportPeriod,setReportPeriod]=useState("daily"),[reportData,setReportData]=useState(null),[reportLoading,setReportLoading]=useState(false);
 const [admins,setAdmins]=useState([]),[directAds,setDirectAds]=useState([]),[adInquiries,setAdInquiries]=useState([]),[adForm,setAdForm]=useState({name:"",placement:"banner",imageUrl:"",targetUrl:"",startsAt:"",endsAt:"",active:false,priority:0}),[query,setQuery]=useState(""),[found,setFound]=useState([]),[inq,setInq]=useState([]),[reply,setReply]=useState({}),[notice,setNotice]=useState({title:"",body:"",category:"notice",pinned:false,popup:false});
 useEffect(()=>{sessionStorage.removeItem("petgrow_admin_token");adminStatus().then(setStatus).catch(e=>window.alert(e.message));return()=>sessionStorage.removeItem("petgrow_admin_token")},[]);
 const role=status?.role,can=x=>role==="superadmin"||role==="operator"||role===x;
 const loadAll=async({background=false}={})=>{
   const tasks=[];
   if(can("dashboard")){
     tasks.push(adminStats().then(setStats).catch(()=>null));
     if(typeof adminHealth==="function")tasks.push(adminHealth().then(setHealth).catch(()=>null));
   }
   if(can("report")){tasks.push(adminListReports().then(x=>setReports(x.reports||[])).catch(()=>null));tasks.push(adminListPlaceReviewReports().then(x=>setPlaceReports(x.reports||[])).catch(()=>null));tasks.push(adminListMusicCommentReports().then(x=>setMusicCommentReports(x.reports||[])).catch(()=>null));}
   if(can("logs"))tasks.push(adminLogs().then(x=>setLogs(x.logs||[])).catch(()=>null));
   if(role==="superadmin")tasks.push(adminListAdmins().then(x=>setAdmins(x.admins||[])).catch(()=>null));
   if(role==="superadmin"||role==="operator"){
     if(typeof adminSupportInquiries==="function")tasks.push(adminSupportInquiries().then(x=>setInq(x.items||[])).catch(()=>null));
   }
   if(role==="superadmin"||role==="operator"||role==="ads"){
     if(typeof adminListDirectAds==="function")tasks.push(adminListDirectAds().then(x=>setDirectAds(x.items||[])).catch(()=>null));
     if(typeof adminListAdInquiries==="function")tasks.push(adminListAdInquiries().then(x=>setAdInquiries(x.items||[])).catch(()=>null));
   }
   if(!background)setUnlocked(true);
   await Promise.allSettled(tasks);
 };
 const unlock=async()=>{
   const enteredPin=String(pin||"");
   setPin("");
   if(!/^\d{6}$/.test(enteredPin)){window.alert("PIN은 숫자 6자리로 입력해 주세요.");return;}
   try{
     const r=await adminVerify(enteredPin);
     sessionStorage.setItem("petgrow_admin_token",r.token);
     setStatus(s=>({...s,role:r.role,roleLabel:r.roleLabel}));
     // 관리자 화면은 즉시 열고, 데이터는 뒤에서 병렬 로딩합니다.
     setUnlocked(true);
     loadAll({background:true});
   }catch(e){
     setPin("");
     if(e.message==="PIN_SETUP_REQUIRED")setStatus(s=>({...s,pinSetupRequired:true}));
     else window.alert(e.message);
   }
 };
 const setNewPin=async()=>{if(!/^\d{6}$/.test(setupPin))return window.alert("PIN은 숫자 6자리로 입력해 주세요.");try{await adminSetPin(setupPin);setStatus(s=>({...s,pinSetupRequired:false}));setSetupPin("");window.alert("관리자 PIN을 설정했어요.")}catch(e){window.alert(e.message)}};
 const bootstrap=async()=>{if(!/^\d{6}$/.test(setupPin))return window.alert("PIN은 숫자 6자리로 입력해 주세요.");try{await adminBootstrap(setupCode,setupPin);setStatus({adminExists:true,isAdmin:true,role:"superadmin",roleLabel:"최고관리자"});setSetupPin("");setSetupCode("");window.alert("최고관리자 등록이 완료됐어요.")}catch(e){window.alert(e.message)}};
 const restrict=async(r,d)=>{const lab={ "1d":"1일","7d":"7일","30d":"30일",permanent:"영구"}[d];if(!window.confirm(`${r.authorNickname} 계정을 ${lab} 이용제한할까요?\n확인 시 즉시 Pet톡 글/댓글 작성이 제한됩니다.`))return;try{await adminRestrict(r.targetUserId,d,r.id);window.alert("이용제한을 적용했어요.");await loadAll()}catch(e){window.alert(e.message)}};
 const unblock=async r=>{if(!window.confirm(`${r.authorNickname} 계정의 이용제한을 해제할까요?`))return;try{await adminUnblock(r.targetUserId,r.id);window.alert("제한을 해제했어요.");await loadAll()}catch(e){window.alert(e.message)}};
 const resolve=async r=>{if(!window.confirm("이 신고를 검토 완료 처리할까요?"))return;try{await adminResolveReport(r.id);await loadAll()}catch(e){window.alert(e.message)}};
 const hidePlaceReview=async r=>{if(!window.confirm(`'${r.place_name}'의 신고된 후기를 숨길까요?`))return;try{await adminHidePlaceReview(r.review_id,r.id);window.alert("후기를 숨기고 신고를 처리했어요.");await loadAll()}catch(e){window.alert(e.message)}};
 const resolvePlaceReview=async r=>{if(!window.confirm("이 장소 후기 신고를 검토 완료 처리할까요? 후기는 계속 공개됩니다."))return;try{await adminResolvePlaceReviewReport(r.id);await loadAll()}catch(e){window.alert(e.message)}};
 const hideMusicComment=async r=>{if(!window.confirm(`'${r.track_title}'의 신고된 댓글을 숨길까요?`))return;try{await adminHideMusicComment(r.comment_id,r.id);window.alert("음악 댓글을 숨기고 신고를 처리했어요.");await loadAll()}catch(e){window.alert(e.message)}};
 const resolveMusicComment=async r=>{if(!window.confirm("이 음악 댓글 신고를 문제없음으로 처리할까요? 댓글은 계속 공개됩니다."))return;try{await adminResolveMusicCommentReport(r.id);await loadAll()}catch(e){window.alert(e.message)}};

 const loadReport=async(period=reportPeriod)=>{
   setReportPeriod(period);setReportData(null);setReportLoading(true);
   try{const next=await adminReportSummary(period);setReportData(next);}catch(e){window.alert(e.message)}finally{setReportLoading(false)}
 };
 const reportRangeLabel=(data)=>{
   if(!data?.start||!data?.end)return "";
   const start=String(data.start).slice(0,10);
   const endDate=new Date(`${String(data.end).slice(0,10)}T00:00:00`);endDate.setDate(endDate.getDate()-1);
   const end=`${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,"0")}-${String(endDate.getDate()).padStart(2,"0")}`;
   const kind={daily:"전날",weekly:"최근 7일 · 오늘 제외",monthly:"지난달"}[data.period]||"집계 기간";
   return `${start} ~ ${end} · ${kind}`;
 };
 useEffect(()=>{if(unlocked&&tab==="reporting"&&!reportData&&!reportLoading)loadReport("daily");},[unlocked,tab]);
 const reportText=()=>{
   if(!reportData)return "";const r=reportData.summary||{},pm={daily:"일일",weekly:"주간",monthly:"월간"}[reportData.period]||"운영";
   const menu=(reportData.topMenus||[]).slice(0,5).map((x,i)=>`${i+1}. ${x.dimension} ${Number(x.count)||0}회`).join("\n")||"데이터 없음";
   const plat=(reportData.platforms||[]).map(x=>`${x.platform}: ${Number(x.count)||0}`).join(" / ")||"데이터 없음";
   return `[PetGrow] ${pm} 운영보고\n기간: ${String(reportData.start).slice(0,10)} ~ ${String(reportData.end).slice(0,10)} (종료일 전까지)\n\n방문 세션: ${r.sessions||0}\n신규 회원: ${r.newMembers||0}\nPet톡: 게시글 ${r.posts||0} / 댓글 ${r.comments||0}\nPet음악: 누적 재생 ${r.musicPlays||0} / 기간 좋아요 ${r.musicLikes||0} / 댓글 ${r.musicComments||0}\n내 주변 Pet: 후기 ${r.placeReviews||0} / 평균 ★${r.placeAvgRating||0}\n신고 접수: ${r.reports||0}\n\n[접속 환경]\n${plat}\n\n[이용 메뉴 TOP5]\n${menu}`;
 };
 const getAdStatus=(a)=>{
   const now=Date.now(),start=a?.starts_at?new Date(a.starts_at).getTime():null,end=a?.ends_at?new Date(a.ends_at).getTime():null;
   if(!a?.active)return {key:"off",label:"OFF"};
   if(start&&start>now)return {key:"scheduled",label:"대기"};
   if(end&&end<now)return {key:"ended",label:"종료"};
   return {key:"live",label:"게시중"};
 };
 const adRemaining=(a)=>{
   if(!a?.ends_at)return "종료일 없음";
   const ms=new Date(a.ends_at).getTime()-Date.now();
   if(ms<=0)return "종료됨";
   const d=Math.ceil(ms/86400000);
   if(d>=2)return `${d}일 남음`;
   return `${Math.max(1,Math.ceil(ms/3600000))}시간 남음`;
 };
 if(!status)return <><div className="admin-autofill-trap">{adminAutofillTrap}</div><div className="bg-card admin-gate">관리자 정보를 확인하는 중...</div></>;
 if(!status.adminExists)return <div className="admin-reports-page"><div className="bg-card admin-gate"><h2>🛡️ 최초 관리자 등록</h2><input className="bg-input" type="password" placeholder="ADMIN_SETUP_CODE" value={setupCode} onChange={e=>setSetupCode(e.target.value)}/><input name="petgrow-pin-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" data-lpignore="true" data-1p-ignore="true" data-form-type="other" spellCheck={false} className="bg-input admin-pin-input admin-pin-no-save" type="text" placeholder="관리자 PIN 6자리" value={setupPin} onChange={e=>setSetupPin(e.target.value.replace(/\D/g,"").slice(0,6))}/><button className="bg-btn" onClick={bootstrap}>현재 계정을 최고관리자로 등록</button></div></div>;
 if(!status.isAdmin)return <div className="admin-reports-page"><div className="bg-card admin-gate"><h2>관리자 전용</h2><p>현재 계정에는 관리자 권한이 없어요.</p><button className="bg-btn bg-btn-ghost" onClick={onBack}>돌아가기</button></div></div>;
 if(status.pinSetupRequired)return <div className="admin-reports-page"><div className="bg-card admin-gate"><h2>🔐 관리자 PIN 최초 설정</h2><p>본인만 사용할 숫자 6자리 PIN을 설정하세요.</p><input name="petgrow-pin-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" data-lpignore="true" data-1p-ignore="true" data-form-type="other" spellCheck={false} className="bg-input admin-pin-input admin-pin-no-save" type="text" value={setupPin} onChange={e=>setSetupPin(e.target.value.replace(/\D/g,"").slice(0,6))}/><button className="bg-btn" onClick={setNewPin}>PIN 설정</button></div></div>;
 if(!unlocked)return <div className="admin-reports-page"><div className="bg-card admin-gate"><h2>🔐 {status.roleLabel||"관리자"} PIN</h2><input name="petgrow-pin-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" data-lpignore="true" data-1p-ignore="true" data-form-type="other" spellCheck={false} className="bg-input admin-pin-input admin-pin-no-save" type="text" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="PIN 6자리"/><button className="bg-btn admin-open-center-btn" disabled={pin.length!==6} onClick={unlock}>관리자센터 열기</button></div></div>;
 const tabs=role==="superadmin"?[["dashboard","대시보드"],["reporting","보고서"],["service","서비스상태"],["reports","신고관리"],["inquiries","문의관리"],["notices","공지관리"],["music","Pet음악"],["ads","광고운영"],["logs","운영로그"],["admins","관리자관리"]]:
 role==="operator"?[["dashboard","대시보드"],["reporting","보고서"],["service","서비스상태"],["reports","신고관리"],["inquiries","문의관리"],["notices","공지관리"],["music","Pet음악"],["ads","광고운영"],["logs","운영로그"]]:
 role==="report"?[["reports","신고관리"]]:[["music","Pet음악"],["ads","광고운영"]];
 const c=stats?.cards||{};
 return <div className="admin-reports-page">
   <div className="admin-hero admin-hero-toolbar admin-mobile-safe-header">
  <div><small>{status.roleLabel}</small><h1>PetGrow 관리자센터</h1><p className="bg-sub">서비스 운영·신고·문의·광고를 한 곳에서 관리해요.</p></div>
  <button className="bg-btn bg-btn-ghost admin-exit-btn" onClick={onBack}>← 회원정보</button>
</div>
   <div className="admin-tabs">{tabs.map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</div>
   {tab==="dashboard"&&<>
     <PetPointAdminOverview />
     <div className="admin-stat-grid">{[["미처리 신고",c.openReports||0],["답변대기 문의",c.waitingInquiries||0],["이용제한 중",c.restricted||0],["오늘 방문",c.todaySessions||0],["현재 접속 추정",c.onlineSessions5m||0],["7일 활성회원",c.active7d||0],["7일 신규회원",c.new7d||0],["오늘 Pet톡 글",c.postsToday||0]].map(([a,b])=><div className="admin-stat-card" key={a}><strong>{b}</strong><small>{a}</small></div>)}</div>
     <div className="bg-card admin-menu-analytics">
       <div className="admin-menu-analytics-head"><div><h3>메뉴 이용 통계</h3><small>페이지 진입 기준 · 오늘 / 7일 / 30일 이용량을 확인해요.</small></div><span className="bg-chip active admin-menu-period-chip">30일</span></div>
       {(()=>{const labels={home:"홈",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",my:"회원정보",support:"고객지원",admin:"관리자"};const rows=(stats?.menuUsage||[]).filter(x=>labels[x.dimension]);const max=Math.max(1,...rows.map(x=>Number(x.d30)||0));return rows.length?<><div className="admin-menu-top">🏆 가장 자주 이용 <span>{labels[rows[0]?.dimension]||rows[0]?.dimension}</span></div>{rows.map((x,i)=><div className="admin-menu-row" key={x.dimension}><div className="admin-menu-name">{i<3?["🥇 ","🥈 ","🥉 "][i]:""}{labels[x.dimension]||x.dimension}</div><div className="admin-menu-bar"><i style={{width:`${Math.max(3,Math.round((Number(x.d30)||0)/max*100))}%`}}/></div><div className="admin-menu-value"><b>{Number(x.d30)||0}회</b><br/><small>7일 {Number(x.d7)||0} · 오늘 {Number(x.today)||0}</small></div></div>)}</>:<div className="bg-sub" style={{padding:"10px 0"}}>아직 메뉴 이용 데이터가 충분하지 않아요. 배포 후 방문부터 자동 집계됩니다.</div>})()}
     </div>
     <div className="bg-card admin-menu-analytics">
       <div className="admin-menu-analytics-head"><div><h3>Pet사주 · Pet타로 이용 현황</h3><small>주제별 결과 생성 및 저장 이용량 · 오늘 / 7일 / 30일</small></div></div>
       {(()=>{const labels={saju_daily:"오늘의 펫운세",tarot_daily:"오늘의 Pet타로",tarot_bond:"보호자 궁합 타로",tarot_heart:"우리 아이 마음 타로",tarot_activity:"산책·활동 타로",tarot_advice:"오늘의 조언 타로",saju_tarot_save:"타로 저장"};const rows=stats?.featureUsage||[];return rows.length?rows.map(x=><div className="admin-menu-row" key={x.feature}><div className="admin-menu-name">{labels[x.feature]||x.feature}</div><div className="admin-menu-value"><b>{Number(x.d30)||0}회</b><br/><small>7일 {Number(x.d7)||0} · 오늘 {Number(x.today)||0}</small></div></div>):<div className="bg-sub" style={{padding:"10px 0"}}>아직 Pet타로·운세 이용 데이터가 없어요.</div>})()}
     </div>
   </>}
   {tab==="reporting"&&<div className="admin-reporting-page">
     <div className="bg-card admin-reporting-head"><div><h2>📊 운영 보고서</h2><p className="bg-sub">일일은 어제, 주간은 오늘을 제외한 최근 7일, 월간은 지난달 전체를 집계해요.</p>{reportData&&<div className="admin-report-period">집계기간 <b>{reportRangeLabel(reportData)}</b></div>}</div><div className="admin-reporting-tabs">{[["daily","일일보고"],["weekly","주간보고"],["monthly","월간보고"]].map(([k,l])=><button type="button" disabled={reportLoading} className={reportPeriod===k?"active":""} key={k} onClick={()=>loadReport(k)}>{l}</button>)}</div></div>
     {!reportData&&!reportLoading?<div className="bg-card admin-report-empty"><b>보고서 종류를 선택해 주세요.</b><p className="bg-sub">일일보고는 어제, 주간보고는 최근 7일(오늘 제외), 월간보고는 지난달 기준이에요.</p><button className="bg-btn" onClick={()=>loadReport("daily")}>일일보고 불러오기</button></div>:reportLoading?<div className="bg-card admin-report-empty">보고서를 계산하는 중...</div>:<>{(()=>{const r=reportData?.summary||{};return <><div className="admin-report-kpi-grid">{[["방문 세션",r.sessions||0,"👥"],["신규 회원",r.newMembers||0,"✨"],["Pet톡 글",r.posts||0,"💬"],["Pet톡 댓글",r.comments||0,"🗨️"],["음악 좋아요",r.musicLikes||0,"♥"],["음악 댓글",r.musicComments||0,"🎵"],["주변 Pet 후기",r.placeReviews||0,"📍"],["신고 접수",r.reports||0,"🚨"]].map(([l,v,ic])=><div className="bg-card admin-report-kpi" key={l}><span>{ic}</span><strong>{v}</strong><small>{l}</small></div>)}</div><div className="admin-reporting-grid"><div className="bg-card"><h3>🏆 이용 메뉴 TOP</h3>{(reportData.topMenus||[]).length?(reportData.topMenus||[]).slice(0,8).map((x,i)=><div className="admin-report-rank" key={x.dimension}><b>{i+1}. {({home:"홈",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",my:"회원정보",support:"고객지원",admin:"관리자센터"}[x.dimension]||x.dimension)}</b><span>{Number(x.count)||0}회</span></div>):<p className="bg-sub">집계 데이터가 없어요.</p>}</div><div className="bg-card"><h3>📱 접속 환경</h3>{(reportData.platforms||[]).length?(reportData.platforms||[]).map(x=><div className="admin-report-rank" key={x.platform}><b>{{web:"웹사이트",mobile_web:"모바일 웹",pwa:"PWA",android:"Android 앱",ios:"iOS 앱"}[x.platform]||x.platform}</b><span>{Number(x.count)||0}</span></div>):<p className="bg-sub">집계 데이터가 없어요.</p>}<hr/><p className="bg-sub">내 주변 Pet 후기 평균 <b>★ {r.placeAvgRating||0}</b></p></div></div></>})()}</>}
   </div>}
   {tab==="service"&&<div className="service-health-wrap">
 <div className={`service-health-hero ${health?.level||"healthy"}`}><div className="service-health-dot">{health?.level==="down"?"🔴":health?.level==="warning"?"🟡":"🟢"}</div><div><small>현재 서비스 상태</small><h2>{health?.level==="down"?"장애":health?.level==="warning"?"주의":"정상"}</h2>{health?.reason && !["정상","주의","장애"].includes(health.reason) ? <p>{health.reason}</p> : <p className="service-health-subtext">{health?.level==="healthy"?"모든 주요 기능이 정상적으로 동작하고 있어요.":health?.level==="warning"?"일부 요청 지연이나 오류가 감지됐어요.":"서비스 장애 징후가 감지됐어요."}</p>}</div><button className="bg-btn bg-btn-ghost" onClick={async()=>{try{setHealth(await adminHealth())}catch(e){window.alert(e.message)}}}>새로고침</button></div>
 <div className="service-health-grid">{[["최근 15분 오류",health?.metrics?.errors15m||0],["1시간 DB 오류",health?.metrics?.dbErrors1h||0],["1시간 느린 요청",health?.metrics?.slow1h||0],["1시간 요청제한",health?.metrics?.rateLimits1h||0],["15분 평균 응답",`${health?.metrics?.avgLatency15m||0}ms`],["1시간 최대 응답",`${health?.metrics?.maxLatency1h||0}ms`],["5분 접속 추정",health?.traffic?.online5m||0],["오늘 방문",health?.traffic?.today||0]].map(([k,v])=><div className="bg-card service-health-card" key={k}><strong>{v}</strong><span>{k}</span></div>)}</div>
 <div className="bg-card"><h3>트래픽 대비</h3><p className="bg-sub">일시적 429/502/503/504는 GET 요청을 한 번 재시도하고, 8초 이상 응답이 없으면 무한 로딩을 중단해요. 접속 급증 시에는 관리자 화면에서 접속 추정치와 오류·응답 지연을 함께 확인하세요.</p></div>
 </div>}{tab==="reports"&&<div className="admin-report-list"><div className="bg-card"><h3 style={{marginTop:0}}>💬 Pet톡 신고</h3>{reports.length?reports.map(r=><div className="admin-report-card" key={r.id}><div><b>{r.postTitle}</b><small>{r.authorNickname} · 신고자 {r.reporterNickname}</small></div><p>{r.targetContent}</p><p><b>신고사유:</b> {r.reason} {r.detail}</p><div className="admin-report-actions"><button onClick={()=>restrict(r,"1d")}>1일</button><button onClick={()=>restrict(r,"7d")}>7일</button><button onClick={()=>restrict(r,"30d")}>30일</button><button onClick={()=>restrict(r,"permanent")}>영구 제한</button><button onClick={()=>unblock(r)}>제한 해제</button><button onClick={()=>resolve(r)}>검토 완료</button></div></div>):<p className="bg-sub">Pet톡 신고가 없어요.</p>}</div><div className="bg-card"><h3 style={{marginTop:0}}>📍 내 주변 Pet 후기 신고</h3>{placeReports.length?placeReports.map(r=><div className="admin-report-card" key={r.id}><div><b>{r.place_name} · ★ {r.rating}</b><small>{r.author_nickname} 작성 · 신고자 {r.reporter_nickname}</small></div><p>{r.content}</p><p><b>신고사유:</b> {r.detail||r.reason}</p><div className="admin-report-actions"><button onClick={()=>hidePlaceReview(r)}>후기 숨김</button><button onClick={()=>resolvePlaceReview(r)}>문제없음·완료</button></div></div>):<p className="bg-sub">장소 후기 신고가 없어요.</p>}</div><div className="bg-card"><h3 style={{marginTop:0}}>🎵 Pet음악 댓글 신고</h3>{musicCommentReports.length?musicCommentReports.map(r=><div className="admin-report-card" key={r.id}><div><b>{r.track_title}</b><small>{r.author_nickname} 작성 · 신고자 {r.reporter_nickname}</small></div><p>{r.content}</p><p><b>신고사유:</b> {r.detail||r.reason}</p><div className="admin-report-actions"><button onClick={()=>hideMusicComment(r)}>댓글 숨김</button><button onClick={()=>resolveMusicComment(r)}>문제없음·완료</button></div></div>):<p className="bg-sub">Pet음악 댓글 신고가 없어요.</p>}</div></div>}
   {tab==="inquiries"&&<div className="admin-report-list">{inq.length?inq.map(x=><div className="bg-card admin-report-card" key={x.id}><b>{x.title}</b><small>{x.nickname} · {x.is_public?"공개":"비공개"} · {x.status}</small><p>{x.body}</p><textarea className="bg-input support-textarea" value={reply[x.id]??x.admin_reply??""} onChange={e=>setReply({...reply,[x.id]:e.target.value})}/><button className="bg-btn" onClick={async()=>{if(!window.confirm("이 답변을 등록할까요?"))return;try{await adminReplyInquiry(x.id,reply[x.id]??x.admin_reply??"");window.alert("답변을 등록했어요.");await loadAll()}catch(e){window.alert(e.message)}}}>답변 등록</button></div>):<div className="bg-card">문의가 없어요.</div>}</div>}
   {tab==="notices"&&<div className="bg-card admin-notice-form"><h2>공지 작성</h2><input className="bg-input admin-notice-input" placeholder="공지 제목" value={notice.title} onChange={e=>setNotice({...notice,title:e.target.value})}/><textarea className="bg-input support-textarea admin-notice-input admin-notice-textarea" placeholder="공지 내용" value={notice.body} onChange={e=>setNotice({...notice,body:e.target.value})}/><label><input type="checkbox" checked={notice.pinned} onChange={e=>setNotice({...notice,pinned:e.target.checked})}/> 중요공지 상단 고정</label><label><input type="checkbox" checked={notice.popup} onChange={e=>setNotice({...notice,popup:e.target.checked})}/> 팝업 공지</label><button className="bg-btn" onClick={async()=>{if(!window.confirm("이 공지를 게시할까요?"))return;try{await adminCreateNotice(notice);setNotice({title:"",body:"",category:"notice",pinned:false,popup:false});window.alert("공지를 게시했어요.")}catch(e){window.alert(e.message)}}}>공지 게시</button></div>}
   {tab==="music"&&<AdminMusicPanel/>}
   {tab==="ads"&&<div className="admin-adops-page">
  <div className="ad-overview-grid" aria-label="광고 현황 요약">
    <span className="sr-only">광고 현황 요약</span>
    {[
      ["게시중",directAds.filter(a=>getAdStatus(a).key==="live").length,"live"],
      ["대기",directAds.filter(a=>getAdStatus(a).key==="scheduled").length,"scheduled"],
      ["OFF",directAds.filter(a=>getAdStatus(a).key==="off").length,"off"],
      ["종료",directAds.filter(a=>getAdStatus(a).key==="ended").length,"ended"]
    ].map(([label,value,key])=><div className={`bg-card ad-overview-card ${key}`} key={label}><strong>{value}</strong><span>{label}</span></div>)}
  </div>

  <div className="admin-adops-grid">
    <div className="bg-card">
      <h2>📣 Google 광고</h2>
      <p><b>웹:</b> AdSense · <b>앱:</b> AdMob</p>
      <p className="bg-sub">승인 후 광고 단위 ID를 연결하는 영역이에요. Google 광고는 정식 광고 슬롯에서만 사용하고 프로모션 모달에는 넣지 않아요.</p>
      <div className="ad-policy-safe">✅ Google 광고 → AdSense/AdMob 정식 광고 슬롯</div>
    </div>
    <div className="bg-card">
      <h2>🤝 직접광고 / 제휴</h2>
      <p>업체와 직접 계약한 광고는 배너 또는 사이트 내부 프로모션 모달로 운영할 수 있어요.</p>
      <div className="ad-policy-safe">✅ 배너 · 직접광고 프로모션 모달</div>
      <div className="ad-policy-warn">⚠️ 프로모션 모달에는 Google 광고 코드를 사용하지 않아요.</div>
    </div>
  </div>

  <div className="bg-card admin-direct-ad-form">
    <h2>➕ 직접광고 등록</h2>
    <p className="bg-sub">광고명, 소재 URL, 이동 링크, 기간을 입력해서 배너/프로모션을 등록해요.</p><div className="ad-operation-tip">💡 <b>운영 추천</b> · 홈 배너 동시 활성 최대 3개 · 프로모션 모달 최대 1개 · 우선순위 숫자가 클수록 먼저 노출 · 같은 우선순위면 최신 광고 우선</div>
    <div className="admin-form-grid">
      <input className="bg-input" placeholder="광고명 *" value={adForm.name} onChange={e=>setAdForm({...adForm,name:e.target.value})}/>
      <select className="bg-input" value={adForm.placement} onChange={e=>setAdForm({...adForm,placement:e.target.value})}><option value="banner">배너</option><option value="promo_modal">프로모션 모달</option></select>
      <input className="bg-input admin-grid-span-2" placeholder="광고 이미지 URL" value={adForm.imageUrl} onChange={e=>setAdForm({...adForm,imageUrl:e.target.value})}/>
      <input className="bg-input admin-grid-span-2" placeholder="클릭 시 이동 URL" value={adForm.targetUrl} onChange={e=>setAdForm({...adForm,targetUrl:e.target.value})}/>
      <label><span>시작일</span><input className="bg-input" type="datetime-local" value={adForm.startsAt} onChange={e=>setAdForm({...adForm,startsAt:e.target.value})}/></label>
      <label><span>종료일</span><input className="bg-input" type="datetime-local" value={adForm.endsAt} onChange={e=>setAdForm({...adForm,endsAt:e.target.value})}/></label>
      <label><span>우선순위</span><input className="bg-input" type="number" min="0" max="99" value={adForm.priority} onChange={e=>setAdForm({...adForm,priority:Number(e.target.value)||0})}/></label>
      <label className="admin-checkbox-field"><input type="checkbox" checked={adForm.active} onChange={e=>setAdForm({...adForm,active:e.target.checked})}/><span>등록 즉시 ON</span></label>
    </div>
    <button className="bg-btn admin-save-ad-btn" onClick={async()=>{
      if(!adForm.name.trim())return window.alert("광고명을 입력해 주세요.");
      if(!window.confirm(`${adForm.placement==="promo_modal"?"프로모션 모달":"배너"} 광고를 등록할까요?`))return;
      try{
        await adminSaveDirectAd({...adForm,network:"direct"});
        setAdForm({name:"",placement:"banner",imageUrl:"",targetUrl:"",startsAt:"",endsAt:"",active:false,priority:0});
        setDirectAds((await adminListDirectAds()).items||[]);
        window.alert("직접광고를 등록했어요.");
      }catch(e){window.alert(e.message||"광고 등록에 실패했어요.")}
    }}>광고 등록</button>
 <div className="ad-preview-wrap">
   <div className="ad-preview-head"><div><b>👀 광고 미리보기</b><small>실제 노출 비율을 간단히 확인해요.</small></div><span>{adForm.placement==="promo_modal"?"프로모션 모달":"홈 배너"}</span></div>
   {adForm.placement==="promo_modal"?
     <div className="ad-preview-modal-stage"><div className="ad-preview-modal-card"><small>광고</small>{adForm.imageUrl?<img src={adForm.imageUrl} alt="프로모션 미리보기" onError={e=>{e.currentTarget.style.display="none"}}/>:<div className="ad-preview-empty">권장 1080 × 1080 px<br/>1:1 정사각형</div>}<b>{adForm.name||"광고명 미리보기"}</b></div></div>
     :
     <div className="ad-preview-home"><div className="ad-preview-home-title">PetGrow 홈 지정 광고영역</div><div className="ad-preview-banner">{adForm.imageUrl?<img src={adForm.imageUrl} alt="배너 미리보기" onError={e=>{e.currentTarget.style.display="none"}}/>:<div className="ad-preview-empty">권장 1200 × 300 px<br/>4:1 가로형 배너</div>}</div><small>광고 · 배너 클릭 시 등록한 링크로 이동</small></div>
   }
   <div className="ad-preview-guide"><span><b>홈 배너</b> 1200×300px · 4:1</span><span><b>프로모션 모달</b> 1080×1080px · 1:1</span><span><b>권장 용량</b> 500KB 이하 · JPG/PNG/WebP</span></div>
 </div>
  </div>

  <div className="bg-card">
    <h2>🗂️ 등록된 직접광고</h2>
    {directAds.length===0?<p className="bg-sub">등록된 직접광고가 아직 없어요.</p>:<div className="admin-direct-ad-list">{directAds.map(a=><div className="admin-direct-ad-row" key={a.id}>
      <div><div className="admin-ad-title-line"><b>{a.name}</b><span className={`ad-status-badge ${getAdStatus(a).key}`}>{getAdStatus(a).label}</span></div><small>{a.placement==="promo_modal"?"프로모션 모달":"배너"} · 우선순위 {a.priority||0}</small><small>{a.starts_at?new Date(a.starts_at).toLocaleString("ko-KR"):"즉시"} ~ {a.ends_at?new Date(a.ends_at).toLocaleString("ko-KR"):"종료일 없음"} · <b>{adRemaining(a)}</b></small><div className="ad-metrics"><span>노출 <b>{Number(a.impressions||0).toLocaleString()}</b></span><span>클릭 <b>{Number(a.clicks||0).toLocaleString()}</b></span><span>CTR <b>{Number(a.impressions||0)>0?((Number(a.clicks||0)/Number(a.impressions))*100).toFixed(1):"0.0"}%</b></span></div></div>
      <div className="admin-direct-ad-actions">
        <button onClick={async()=>{if(!window.confirm(`${a.name} 광고를 ${a.active?"OFF":"ON"} 할까요?`))return;try{await adminToggleDirectAd(a.id,!a.active);setDirectAds((await adminListDirectAds()).items||[])}catch(e){window.alert(e.message)}}}>{a.active?"ON → OFF":"OFF → ON"}</button>
        <button className="danger" onClick={async()=>{if(!window.confirm(`${a.name} 광고를 삭제할까요?`))return;try{await adminDeleteDirectAd(a.id);setDirectAds((await adminListDirectAds()).items||[])}catch(e){window.alert(e.message)}}}>삭제</button>
      </div>
    </div>)}</div>}
  </div>

  <div className="bg-card">
    <h2>📨 광고 문의</h2>
    {adInquiries.length===0?<p className="bg-sub">접수된 광고 문의가 없어요.</p>:<div className="admin-ad-inquiry-list">{adInquiries.map(q=><div className="admin-ad-inquiry-row" key={q.id}>
      <div><b>{q.company_name}</b><small>{q.contact_name} · {q.email}{q.phone?` · ${q.phone}`:""}</small><small>{q.campaign_type} · 예산 {q.budget||"미정"} · {new Date(q.created_at).toLocaleString("ko-KR")}</small><p>{q.message}</p></div>
      <select value={q.status} onChange={async e=>{const status=e.target.value;if(!window.confirm(`문의 상태를 '${status}'로 변경할까요?`))return;try{await adminSetAdInquiryStatus(q.id,status);setAdInquiries((await adminListAdInquiries()).items||[])}catch(err){window.alert(err.message)}}}><option value="new">신규</option><option value="contacted">연락함</option><option value="closed">종료</option></select>
    </div>)}</div>}
  </div>
</div>}
   {tab==="logs"&&<div className="admin-log-list">{logs.map((l,i)=><div className="admin-log-row" key={l.id||i}><div><b>{l.action}</b><small>{l.admin_nickname}{l.target_nickname?` → ${l.target_nickname}`:""}</small></div><span>{new Date(l.created_at).toLocaleString("ko-KR")}</span></div>)}</div>}
   {tab==="admins"&&role==="superadmin"&&<div className="admin-manage">
     <div className="bg-card"><h2>관리자 추가</h2><div className="admin-search-row"><input className="bg-input" placeholder="정확한 닉네임 검색" value={query} onChange={e=>setQuery(e.target.value)}/><button className="bg-btn" onClick={async()=>{try{setFound((await adminSearchUser(query)).users||[])}catch(e){window.alert(e.message)}}}>검색</button></div>{found.map(x=><div className="admin-found" key={x.id}><span><b>{x.nickname}</b><small>{new Date(x.created_at).toLocaleDateString("ko-KR")}</small></span>{x.is_admin?<em>이미 관리자</em>:<select defaultValue="operator" onChange={e=>x._role=e.target.value}><option value="operator">운영관리자</option><option value="report">신고관리자</option><option value="ads">광고관리자</option></select>} {!x.is_admin&&<button onClick={async()=>{const rr=x._role||"operator";if(!window.confirm(`${x.nickname}님을 관리자로 추가할까요?`))return;try{await adminAddUser(x.id,rr);window.alert("관리자를 추가했어요. 해당 관리자는 첫 접속 시 자기 PIN을 설정합니다.");await loadAll()}catch(e){window.alert(e.message)}}}>추가</button>}</div>)}</div>
     <div className="bg-card"><h2>관리자 목록</h2>{admins.map(a=><div className="admin-member-row" key={a.user_id}><div><b>{a.nickname}</b><small>{({superadmin:"최고관리자",operator:"운영관리자",report:"신고관리자",ads:"광고관리자"}[a.role])} · PIN {a.pin_set?"설정":"재설정 필요"} · 최근접속 {a.last_admin_login_at?new Date(a.last_admin_login_at).toLocaleString("ko-KR"):"없음"}</small></div>{a.role!=="superadmin"&&<div><select value={a.role} onChange={async e=>{if(!window.confirm("관리자 권한을 변경할까요?"))return;await adminChangeRole(a.user_id,e.target.value);await loadAll()}}><option value="operator">운영관리자</option><option value="report">신고관리자</option><option value="ads">광고관리자</option></select><button onClick={async()=>{if(!window.confirm(`${a.nickname}님의 관리자 PIN을 초기화할까요?\n다음 접속 때 새 PIN을 설정해야 합니다.`))return;await adminResetPin(a.user_id);await loadAll()}}>PIN 초기화</button><button onClick={async()=>{if(!window.confirm(`${a.nickname}님의 관리자 권한을 삭제할까요?`))return;await adminRemoveUser(a.user_id);await loadAll()}}>관리자 삭제</button></div>}</div>)}</div>
   </div>}
 </div>
}

async function petPointSummary(){return apiJson("/api/points?action=summary");}
const petPointKstDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
async function petPointSpend(feature,refKey=null){const r=await apiJson("/api/points?action=spend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({feature,refKey})});if(r?.spent)window.dispatchEvent(new CustomEvent("petgrow:points",{detail:{amount:-r.spent,balance:r.balance,label:r.label||"PetPoint 사용"}}));return r;}
function PetPointDashboard({compact=false}){
  const [d,setD]=useState(null),[toast,setToast]=useState(null),[helpOpen,setHelpOpen]=useState(false);
  const toastTimer=React.useRef(null);
  const load=async()=>{try{const x=await petPointSummary();setD(x);if(x?.pointEvent?.awarded){setToast({amount:x.pointEvent.awarded,label:x.pointEvent.label,balance:x.pointEvent.balance});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2600)}}catch{}};
  useEffect(()=>{load();const h=e=>{const ev=e.detail||{};setToast(ev);setD(v=>v?{...v,balance:ev.balance??v.balance}:v);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2600);setTimeout(load,180)};window.addEventListener("petgrow:points",h);const poll=setInterval(load,5000);return()=>{window.removeEventListener("petgrow:points",h);clearInterval(poll);clearTimeout(toastTimer.current)}},[]);
  if(!d)return <div className="petpoint-card petpoint-loading">🐾 PetPoint 확인 중…</div>;
  return <section className={`petpoint-card petpoint-dashboard-simple ${compact?"compact":""}`}><button type="button" className="petpoint-help-btn" aria-label="포인트 적립 방법" title="포인트 적립 방법" onClick={()=>setHelpOpen(v=>!v)}>?</button><div className="petpoint-head"><div className="petpoint-balance-wrap"><small>PETPOINT · LIVE</small><h2>현재 포인트</h2></div><strong className="petpoint-big-balance">{Number(d.balance||0).toLocaleString()}<em>P</em></strong></div>{!compact&&<><div className="petpoint-mini-stats"><div className="plus"><small>오늘 적립</small><b>+{Number(d.todayEarned||0).toLocaleString()}P</b></div><div className="minus"><small>오늘 사용</small><b>-{Number(d.todaySpent||0).toLocaleString()}P</b></div></div><div className="petpoint-costs-simple"><span>🌤️ 운세 <b>{d.costs?.saju_daily||20}P</b></span><span>🔮 사주 <b>{d.costs?.saju_basic||50}P</b></span><span>🫶 궁합 <b>{d.costs?.saju_compat||40}P</b></span><span>🃏 타로 <b>{d.costs?.tarot||30}P</b></span></div>{helpOpen&&<div className="petpoint-help-panel"><h3>포인트는 어떻게 모아요?</h3>{(d.earnGuide||[]).map((x,i)=><p key={i}><b>+{x.points}P</b><span>{x.label}</span><small>{x.limit}</small></p>)}</div>}</>}{toast&&<div className={`petpoint-toast ${Number(toast.amount)>=0?"plus":"minus"}`}><b>{Number(toast.amount)>=0?`+${Number(toast.amount).toLocaleString()}P 적립`:`${Number(toast.amount).toLocaleString()}P 사용`}</b><span>{toast.label||"PetPoint"}{toast.balance!=null?` · 잔액 ${Number(toast.balance).toLocaleString()}P`:""}</span></div>}</section>
}
function PetPointPolicyAddendum({type}){return <section className="bg-card petpoint-policy"><h2>🐾 PetPoint 운영 안내</h2><p>PetPoint는 PetGrow 서비스 안에서만 사용하는 무료 활동 포인트이며 현금으로 구매·환전·출금하거나 다른 사람에게 양도할 수 없어요. 첫 이용 시 기본 포인트가 지급되고 Pet톡 글·댓글·좋아요 받기·하루 첫 접속 등 정상적인 활동에 따라 포인트가 적립될 수 있어요.</p><p>Pet사주·오늘의 펫운세·보호자 궁합 등 일부 재미 콘텐츠 이용 시 안내된 포인트가 차감됩니다. 반복 도배·좋아요 취소 후 재좋아요 등 비정상 활동으로는 중복 적립되지 않으며, 부정 적립은 지급 취소 또는 회수될 수 있어요. 같은 게시글의 댓글 적립과 같은 글·같은 이용자의 좋아요 보상은 최초 1회만 인정돼요.</p>{type==="privacy"&&<p className="bg-sub">포인트 운영을 위해 회원 내부 식별자, 적립·사용 사유, 증감 포인트, 처리 시각과 활동 참조값을 계정에 연결해 저장하며 회원탈퇴 시 관계 법령상 보관 의무가 있는 경우를 제외하고 삭제합니다.</p>}</section>}
function PetPointAboutCard(){return <section className="bg-card petpoint-about"><span>🐾</span><div><small>COMMUNITY REWARD</small><h2>활동이 혜택이 되는 PetPoint</h2><p>Pet톡에서 이야기를 나누고 댓글을 남기며 포인트를 모아 Pet사주·운세 같은 재미 콘텐츠를 즐길 수 있어요. 유료 충전 없이 PetGrow 안의 건강한 참여를 보상하는 방식이에요.</p></div></section>}
function PetPointGuideCard(){return <section className="bg-card petpoint-guide-hero"><div><small>PETPOINT GUIDE</small><h2>🐾 활동하고, 모으고, 즐겨요</h2><p>처음 1,000P로 시작하고 Pet톡 활동과 하루 첫 접속으로 포인트를 모을 수 있어요. 포인트는 PetGrow 재미 콘텐츠에서만 사용돼요.</p></div><div className="petpoint-mini-grid"><span><b>+50P</b> 글 작성</span><span><b>+20P</b> 댓글</span><span><b>+5P</b> 좋아요 받기</span><span><b>+30P</b> 하루 첫 접속</span></div></section>}
function PetPointAdminOverview(){const [d,setD]=useState(null);useEffect(()=>{apiJson("/api/points?action=admin").then(setD).catch(()=>{})},[]);if(!d)return null;return <section className="bg-card petpoint-admin"><h2>🐾 PetPoint 운영 현황</h2><div><span><small>포인트 회원</small><b>{Number(d.users||0).toLocaleString()}</b></span><span><small>현재 잔액 합계</small><b>{Number(d.balance||0).toLocaleString()}P</b></span><span><small>누적 적립</small><b>+{Number(d.earned||0).toLocaleString()}P</b></span><span><small>누적 사용·회수</small><b>-{Number(d.spent||0).toLocaleString()}P</b></span></div></section>}

function AccountActivityHub({lang}){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const j=await apiJson("/api/activity?action=timeline");setItems(j.items||[])}catch{setItems([])}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const icon=t=>String(t||"").startsWith("news")?"📰":String(t||"").startsWith("music")?"🎵":String(t||"").startsWith("pettalk")?"💬":String(t||"").startsWith("support")?"✉️":String(t||"").startsWith("report")?"🚩":String(t||"").startsWith("tarot")?"🃏":String(t||"").startsWith("saju")?"🔮":String(t||"").startsWith("nearby")?"📍":"🐾";
  const title=lang==="ja"?"最近のアクティビティ":lang==="zh"?"最近活动":lang==="en"?"Recent activity":"전체 활동내역";
  return <section className="my-activity-hub"><div className="my-activity-hub-head"><div><h2>{title}</h2><small className="bg-sub">PetGrow 메뉴 이용·글·댓글·좋아요·신고·문의 등을 최근순으로 확인해요.</small></div><button onClick={load}>{loading?"…":"새로고침"}</button></div>{loading&&!items.length?<div className="bg-sub">활동내역을 불러오는 중…</div>:items.length?<div className="my-activity-timeline">{items.slice(0,40).map((x,i)=><div className="my-activity-row" key={`${x.type}-${x.createdAt}-${i}`}><span>{icon(x.type)}</span><div><b>{x.title||"PetGrow 활동"}</b>{x.detail&&<small>{x.detail}</small>}</div><time>{x.createdAt?new Date(x.createdAt).toLocaleString(lang==="ja"?"ja-JP":lang==="zh"?"zh-CN":lang==="en"?"en-US":"ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):""}</time></div>)}</div>:<div className="bg-sub">아직 기록된 활동이 없어요. 앞으로 이용한 메뉴와 활동이 여기에 쌓여요.</div>}</section>
}

function MyPage({account,allPets,lang,onOpenAccount,onGoPets,onOpenPost,onOpenAdmin,onLogout,onDeleteAccount,onGoSupport}){
  const [adminEntry,setAdminEntry]=useState(null),[likedMusic,setLikedMusic]=useState([]),[likedMusicLoaded,setLikedMusicLoaded]=useState(false),[likedMusicLoading,setLikedMusicLoading]=useState(false),[openActivity,setOpenActivity]=useState(null);
  const loadLikedMusic=async(force=false)=>{if(!account){setLikedMusic([]);setLikedMusicLoaded(true);return}if(likedMusicLoading||(likedMusicLoaded&&!force))return;setLikedMusicLoading(true);try{const r=await musicLiked();setLikedMusic(r.items||[]);setLikedMusicLoaded(true)}catch{}finally{setLikedMusicLoading(false)}};
  useEffect(()=>{setLikedMusic([]);setLikedMusicLoaded(false);setOpenActivity(null)},[account?.id]);
  useEffect(()=>{let alive=true;if(!account){setAdminEntry(null);return()=>{alive=false}}adminStatus().then(st=>{if(alive)setAdminEntry(st)}).catch(()=>{if(alive)setAdminEntry(null)});return()=>{alive=false}},[account?.id]);
  const togglePetTalk=()=>setOpenActivity(v=>v==="pettalk"?null:"pettalk");
  const toggleMusic=()=>{const x=openActivity!=="music";setOpenActivity(x?"music":null);if(x)loadLikedMusic(true)};
  return <div style={{maxWidth:760,margin:"0 auto",padding:"0 20px 70px"}}>
    <div className="my-page-head"><div><div className="my-page-kicker">MY PETGROW</div><h1>{lang==="ja"?"マイページ":lang==="zh"?"我的页面":lang==="en"?"My Page":"마이페이지"}</h1><p style={{fontSize:13}}>{lang==="en"?"Your PetGrow account and activity hub.":"계정·우리 아이·포인트·활동내역을 한곳에서 관리해요."}</p></div><span className="my-page-head-icon" style={{fontSize:16,fontWeight:950}}>MY</span></div>
    <section className="mypage-petpoint-section"><PetPointDashboard /></section>
    <div className="my-menu-grid my-menu-grid-top"><button type="button" className="my-menu-card my-menu-pink" onClick={onOpenAccount}><span className="my-menu-card-icon">✏️</span><span className="my-menu-card-copy"><strong>정보 수정</strong><small>닉네임과 계정 정보를 관리해요.</small></span><span className="my-menu-card-arrow">›</span></button><button type="button" className="my-menu-card my-menu-blue" onClick={onGoPets}><span className="my-menu-card-icon">🐾</span><span className="my-menu-card-copy"><strong>반려동물 관리</strong><small>등록한 아이 {allPets.length}마리를 관리해요.</small></span><span className="my-menu-card-arrow">›</span></button></div>
    <div className="my-activity-stack"><button type="button" className={`my-menu-card my-menu-purple my-menu-card-wide${openActivity==="pettalk"?" is-open":""}`} onClick={togglePetTalk}><span className="my-menu-card-icon">💬</span><span className="my-menu-card-copy"><strong>Pet톡 내 활동</strong><small>내 글·댓글·좋아요를 확인해요.</small></span><span className="my-menu-card-arrow">{openActivity==="pettalk"?"⌃":"›"}</span></button>
      {openActivity==="pettalk"&&<div className="bg-card my-activity-card my-accordion-panel"><MyActivityPage lang={lang} onOpenPost={onOpenPost} embedded /></div>}
      <button type="button" className={`my-menu-card my-menu-mint my-menu-card-wide${openActivity==="music"?" is-open":""}`} onClick={toggleMusic}><span className="my-menu-card-icon">❤️</span><span className="my-menu-card-copy"><strong>좋아요한 Pet음악</strong><small>내가 좋아요한 음악을 확인해요.</small></span><span className="my-menu-card-arrow">{openActivity==="music"?"⌃":"›"}</span></button>
      {openActivity==="music"&&<div className="bg-card my-activity-card my-accordion-panel">{likedMusicLoading&&!likedMusicLoaded?<div className="bg-sub">불러오는 중…</div>:likedMusic.length?<div style={{display:"grid",gap:8}}>{likedMusic.slice(0,20).map(x=><div key={x.id} className="my-liked-music-row">{x.cover_url?<img src={x.cover_url} alt="" loading="lazy"/>:<span>🎵</span>}<div><b>{x.title}</b><small>♥ {Number(x.like_count)||0}</small></div></div>)}</div>:<div className="bg-sub">아직 좋아요한 음악이 없어요.</div>}</div>}
      <PetDailyHistory account={account} lang={lang} />
    </div>
    <AccountActivityHub lang={lang}/>
    {adminEntry&&(!adminEntry.adminExists||adminEntry.isAdmin||adminEntry.recoveryAvailable)&&<button type="button" className="my-admin-below-activity" onClick={onOpenAdmin}><span>🛡️</span><div><b>{adminEntry.isAdmin?"관리자센터":(adminEntry.adminExists?"관리자 등록/복구":"최초 관리자 등록")}</b><small>운영 데이터는 PIN 인증 후 확인할 수 있어요.</small></div><em>›</em></button>}
    <section className="my-account-manage"><h2>계정 관리</h2><div className="my-account-actions"><button type="button" className="logout" onClick={onLogout}>로그아웃</button><button type="button" className="delete" onClick={onDeleteAccount}>회원탈퇴</button></div>{onGoSupport&&<button type="button" className="bg-btn bg-btn-ghost" style={{width:"100%",marginTop:8}} onClick={onGoSupport}>내 문의 · 고객지원 확인</button>}</section>
  </div>
}

class PetTalkErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:false};}
  static getDerivedStateFromError(){return {error:true};}
  componentDidCatch(err){console.error("PetTalk render error",err);}
  render(){return this.state.error?<PetTalkFallback/>:this.props.children;}
}
function PetTalkFallback(){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=()=>{setLoading(true);setError("");fetch("/api/community?action=posts&category=all&sort=latest&page=1",{credentials:"include"}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j?.message||j?.error||`Pet톡 접속 오류 (${r.status})`);return j;}).then(j=>setItems(j.posts||[])).catch(e=>setError(e.message||"Pet톡을 불러오지 못했어요.")).finally(()=>setLoading(false));};
  useEffect(()=>{load()},[]);
  return <div className="legal-page-shell pettalk-safe-fallback"><div className="pettalk-fallback-toolbar"><span>게시글을 다시 불러올 수 있어요.</span><button className="bg-chip" onClick={load}>새로고침</button></div>{loading?<div className="pettalk-state">Pet톡을 불러오는 중…</div>:error?<div className="pettalk-state error"><b>Pet톡 접속에 문제가 있어요.</b><span>{error}</span><button className="bg-btn" onClick={load}>다시 시도</button></div>:<div className="pettalk-fallback-list">{items.length?items.map(p=><div key={p.id} className="bg-card pettalk-fallback-item"><small>{p.authorNickname||'PetGrow 회원'} · {p.pet?.name||'우리 아이'}</small><b>{p.title}</b><p>{String(p.content||'').slice(0,180)}</p></div>):<div className="pettalk-state">아직 등록된 Pet톡이 없어요.</div>}</div>}</div>;
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
      <CommunityFeed pets={allPets} lang={lang} onOpenPost={openPost} onWrite={() => setSub("compose")} onMyActivity={() => setSub("my")} />
    </div>
  );
}

const MENU_HELP = {
  home: { icon: "🏠", koTitle: "홈", koBody: "우리 아이와 PetGrow의 주요 기능을 한눈에 보고 원하는 메뉴로 바로 이동할 수 있어요.", enTitle: "Home", enBody: "See your pets and jump into PetGrow features from one place." },
  about: { icon: "🌱", koTitle: "PetGrow 소개", koBody: "PetGrow가 어떤 서비스인지, 어떤 기능을 제공하는지 한눈에 살펴볼 수 있어요.", enTitle: "About PetGrow", enBody: "See what PetGrow is and what you can do here." },
  pets: { icon: "🐾", koTitle: "우리 아이", koBody: "반려동물 정보를 등록하고 체중·성장기록·사진을 꾸준히 관리해보세요.", enTitle: "My Pets", enBody: "Register your pets and manage growth, weight, and photos." },
  community: { icon: "💬", koTitle: "Pet톡", koBody: "다른 보호자들과 일상·질문·건강·산책·훈련 이야기를 나눠요. 닉네임은 회원정보에서 바꿀 수 있어요.", enTitle: "Pet Talk", enBody: "Share daily life, questions, health, walks and training with other pet guardians." },
  saju: { icon: "🔮", koTitle: "Pet사주", koBody: "기본 Pet사주, 오늘의 펫운세, 보호자 궁합을 재미로 즐겨보세요.", enTitle: "Pet Saju", enBody: "Enjoy Pet Saju, today's fortune, Pet Tarot, or guardian compatibility for fun." },
  tarot: { icon: "🃏", koTitle: "Pet타로", koBody: "22장의 메이저 아르카나에서 주제별로 하루 한 장을 뽑고 오늘의 메시지를 저장해보세요.", enTitle: "Pet Tarot", enBody: "Draw one card per topic each day and save the reading to your account." },
  petbti: { icon: "🧩", koTitle: "PetBTI", koBody: "강아지·고양이별 20개 행동 질문으로 우리 아이의 성향을 더 구체적으로 알아봐요.", enTitle: "PetBTI", enBody: "Answer behavior questions and discover a fun personality type for your pet." },
  music: { icon: "🎵", koTitle: "Pet음악", koBody: "강아지·고양이를 위한 음악을 듣고 반복재생하며 좋아요와 댓글로 우리 아이의 반응을 나눠보세요.", enTitle: "Pet Music", enBody: "Listen to pet-friendly music, loop favorites, and share reactions with likes and comments." },
  tips: { icon: "💡", koTitle: "Pet정보", koBody: "건강·식단·생활·훈련 등 반려생활에 바로 써먹기 좋은 정보를 모아봤어요.", enTitle: "Pet Tips", enBody: "Browse practical tips for health, food, daily care and training." },
  my: { icon: "👤", koTitle: "회원정보", koBody: "닉네임과 계정 정보를 수정하고, 반려동물 관리와 Pet톡 내 활동을 확인할 수 있어요.", enTitle: "Member info", enBody: "Edit your nickname and account, manage pets, and review your Pet Talk activity." },
  content: { icon: "✨", koTitle: "Pet 콘텐츠", koBody: "Pet사주·PetBTI·Pet정보을 한곳에서 골라 이용할 수 있어요.", enTitle: "Pet Content", enBody: "Choose Pet Saju, PetBTI and Pet Tips in one place." },
};

function MenuHelpCoach({ view, lang, open, onClose, onOpen }) {
  const data = MENU_HELP[view];
  if (!data) return null;
  const title = lang === "en" ? data.enTitle : data.koTitle;
  const body = lang === "en" ? data.enBody : data.koBody;
  return (
    <>
      <button type="button" className="menu-help-fab" onClick={onOpen} aria-label={lang === "en" ? "Open page guide" : "이 페이지 설명 보기"}>?</button>
      <div className={`menu-help-dim ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`menu-help-coach ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="menu-help-top">
          <span className="menu-help-emoji">{data.icon}</span>
          <button type="button" className="menu-help-close" onClick={onClose} aria-label="close">×</button>
        </div>
        <div className="menu-help-kicker">PETGROW HELP</div>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="menu-help-actions">
          <button type="button" className="menu-help-primary" onClick={onClose}>{lang === "en" ? "Close" : "닫기"}</button>
        </div>
      </aside>
    </>
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
  const [menuHelpOpen, setMenuHelpOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} | null

  // 'about' | 'pets' | 'saju' | 'petbti' | 'tips' | 'guide' | 'privacy' | 'terms'
  const viewFromUrl=()=>{try{const value=new URLSearchParams(window.location.search).get("view")||"home";return ["home","about","pets","nearby","community","saju","tarot","petbti","music","tips","news","guide","my","support","ad-inquiry"].includes(value)?value:"home"}catch{return "home"}};
  const [view, setView] = useState(viewFromUrl);
  const GATED_VIEWS = ["pets", "saju", "petbti", "content", "my", "admin"];

  // ---- 계정(카카오 로그인) ----
  const [account, setAccount] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 로그인 필요 화면 여부는 모든 effect보다 먼저 계산해야 해요.
  // 아래 통계/광고 effect에서 effectiveView를 참조하므로 TDZ(선언 전 접근) 오류를 방지합니다.
  const needsLogin = authChecked && GATED_VIEWS.includes(view) && !account;
  const effectiveView = needsLogin ? "login" : view;
  useEffect(()=>{
    const ko={home:"PetGrow",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",news:"Pet뉴스",guide:"정보가이드",my:"회원정보",support:"고객지원",login:"로그인"};
    const en={home:"PetGrow",about:"About",pets:"My Pet",nearby:"Nearby Pet",community:"Pet Talk",saju:"Pet Saju",tarot:"Pet Tarot",petbti:"PetBTI",music:"Pet Music",tips:"Pet Info",news:"Pet News",guide:"Guide",my:"Account",support:"Support",login:"Login"};
    const label=(lang==="en"?en:ko)[effectiveView]||"PetGrow";
    document.title=label==="PetGrow"?"PetGrow | 반려동물 성장·생활 플랫폼":`${label} | PetGrow`;
  },[effectiveView,lang]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  useEffect(()=>{if(account?.id)adminStatusFast().catch(()=>{})},[account?.id]);
  useEffect(()=>{const h=e=>goView(e.detail);window.addEventListener("petgrow:navigate",h);return()=>window.removeEventListener("petgrow:navigate",h)},[]);
  useEffect(()=>{const h=()=>setView(viewFromUrl());window.addEventListener("popstate",h);return()=>window.removeEventListener("popstate",h)},[]);

  const [hamOpen, setHamOpen] = useState(false);
  const [contentSubTab, setContentSubTab] = useState("all");
  const isNativeApp = Capacitor.isNativePlatform();
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountDoneOpen, setDeleteAccountDoneOpen] = useState(false);
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

      let meResult = await fetchMe(loginResult === "success" ? 6500 : 5000);
      if (meResult === undefined && loginResult === "success") {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        meResult = await fetchMe(6500);
      }
      const cachedAccount = readCachedAccount();
      const me = meResult === undefined ? cachedAccount : meResult;
      if (meResult !== undefined) setAccount(meResult);
      else if (cachedAccount) setAccount(cachedAccount);
      setAuthChecked(true);
      // 로그인 확인만 끝나면 홈부터 먼저 보여주고, 반려동물 데이터는 아래에서 비동기로 채워요.
      setLoaded(true);
      // 로그인 직전에 받은 약관/개인정보 동의 기록을 계정 상태에도 저장해요.
      if (me) {
        try {
          const rawConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
          const consent = rawConsent ? JSON.parse(rawConsent) : null;
          if (consent?.version === CONSENT_VERSION && consent?.terms && consent?.privacy) {
            await safeSet("petgrow:consent", consent, me);
          }
        } catch {}
        setView("home");
      }

      const dogsKey = "bboggl:dogs";
      const catsKey = "bboggl:cats";
      const activesKey = "bboggl:activeIds";

      let [dogs, cats, actives] = await Promise.all([
        safeGet(dogsKey, me),
        safeGet(catsKey, me),
        safeGet(activesKey, me),
      ]);

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

      dogs = (dogs || []).map((p) => ({ ...p, profile: { ...p.profile, name: normalizePetDisplayText(p.profile?.name, "") }, photos: normalizePhotos(p.photos, p.profile.birthDate) }));
      cats = (cats || []).map((p) => ({ ...p, profile: { ...p.profile, name: normalizePetDisplayText(p.profile?.name, "") }, photos: normalizePhotos(p.photos, p.profile.birthDate) }));

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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 확인이 늦게 끝난 경우에도 계정의 저장 데이터를 공통 React 상태로 다시 불러옵니다.
  // 홈 전용 빠른 동기화와 메뉴 화면의 상태가 서로 달라지는 일을 막습니다.
  useEffect(() => {
    if (!authChecked || !account?.id) return;
    let cancelled = false;
    (async () => {
      const [dogsRaw, catsRaw, actives] = await Promise.all([
        cloudGet("bboggl:dogs"),
        cloudGet("bboggl:cats"),
        cloudGet("bboggl:activeIds"),
      ]);
      if (cancelled) return;
      const normalizeList = (items) => (items || []).map((pet) => ({
        ...pet,
        profile: { ...pet.profile, name: normalizePetDisplayText(pet.profile?.name, "") },
        photos: normalizePhotos(pet.photos, pet.profile?.birthDate),
      }));
      const dogs = normalizeList(dogsRaw);
      const cats = normalizeList(catsRaw);
      setPets({ dog: dogs, cat: cats });
      setActiveId({
        dog: actives?.dog || dogs[0]?.id || null,
        cat: actives?.cat || cats[0]?.id || null,
      });
    })().catch((error) => console.warn("계정 저장 데이터 새로고침 실패:", error));
    return () => { cancelled = true; };
  }, [account?.id, authChecked]);

  // 네이티브 앱의 정적 시작 화면이 준비되면 바로 웹 스플래시로 넘겨
  // 회전 로딩 애니메이션이 실제 초기화가 끝날 때까지 보이도록 해요.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const timer = window.setTimeout(() => {
      SplashScreen.hide().catch(() => {});
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  // 브라우저/앱이 다시 활성화될 때 세션을 조용히 재확인해요.
  // 서버가 잠깐 느려 account가 비어 보였던 경우 로그인 버튼이 자동으로 정상 복구됩니다.
  useEffect(() => {
    let busy = false;
    const refreshAccount = async () => {
      if (busy) return;
      busy = true;
      try {
        const me = await fetchMe();
        if (me !== undefined) setAccount(me);
      } finally {
        busy = false;
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") refreshAccount(); };
    window.addEventListener("focus", refreshAccount);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshAccount);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // React가 올라오면 홈 스켈레톤이 이미 준비된 상태이므로 스플래시를 너무 오래 붙잡지 않아요.
  // 데이터가 느려도 "스플래시 → 스켈레톤 → 실제 홈"으로 이어져 흰 화면이 보이지 않습니다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (typeof window.__hidePetGrowSplash === "function") window.__hidePetGrowSplash();
    }, 1150);
    return () => window.clearTimeout(timer);
  }, []);

  // React가 홈 스켈레톤을 그릴 준비가 되면 스플래시를 먼저 내려요.
  // 로그인/DB 응답을 기다리며 흰 화면이 보이지 않고 "스플래시 → 홈 스켈레톤 → 실제 홈"으로 이어집니다.
  useEffect(() => {
    const toSkeleton = window.setTimeout(() => {
      if (typeof window.__hidePetGrowSplash === "function") window.__hidePetGrowSplash();
    }, 520);
    return () => window.clearTimeout(toSkeleton);
  }, []);

  // 실제 데이터 준비가 빠르게 끝난 경우에도 스플래시 종료 요청을 한 번 더 보장해요.
  useEffect(() => {
    if (!loaded || !authChecked) return;
    if (typeof window.__hidePetGrowSplash === "function") window.__hidePetGrowSplash();
  }, [loaded, authChecked]);

  // 네트워크가 지연돼도 스플래시는 오래 붙잡지 않고 스켈레톤이 대신 로딩 상태를 보여줍니다.
  useEffect(() => {
    const fallback = window.setTimeout(() => {
      if (typeof window.__hidePetGrowSplash === "function") window.__hidePetGrowSplash();
    }, 1800);
    return () => window.clearTimeout(fallback);
  }, []);

  // 개인정보 최소화 운영 통계: 세션은 임의 ID를 서버에서 해시해 집계합니다.
  useEffect(() => {
    if (!loaded || !authChecked) return;
    analyticsEvent("session", effectiveView || "home");
    const timer = window.setInterval(() => analyticsEvent("heartbeat", effectiveView || "home"), 60000);
    return () => window.clearInterval(timer);
  }, [loaded, authChecked]);

  useEffect(() => {
    if (!loaded || !authChecked) return;
    analyticsEvent("pageview", effectiveView || "home");
  }, [effectiveView, loaded, authChecked]);

  // AdMob 하단 배너 광고 — 실제 안드로이드/iOS 앱에서만 동작해요 (웹사이트는 그냥 넘어가요)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await AdMob.initialize();
        analyticsEvent("ad_request", effectiveView || "home");
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: false,
        });
        analyticsEvent("ad_ready", effectiveView || "home");
      } catch (err) {
        analyticsEvent("ad_error", effectiveView || "home");
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

  const goView = async (v) => {
    const next=(v==="talk"||v==="pettalk"||v==="pet-talk")?"community":v;
    let currentAccount = account;
    if (GATED_VIEWS.includes(next) && !currentAccount) {
      setAuthChecked(false);
      const refreshed = await fetchMe(6500);
      setAuthChecked(true);
      if (refreshed === undefined) return;
      currentAccount = refreshed;
      setAccount(refreshed);
    }
    setView(next);
    try{
      const url=new URL(window.location.href),current=url.searchParams.get("view")||"home";
      if(next==="home")url.searchParams.delete("view");else url.searchParams.set("view",next);
      if(current!==next)window.history.pushState({petgrowView:next},"",`${url.pathname}${url.search}${url.hash}`);
    }catch{}
    if(currentAccount?.id)logPetActivity({section:next,action:"view",title:({home:"홈",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",news:"Pet뉴스",guide:"정보가이드",my:"마이페이지",support:"고객지원"}[next]||next)});
    scrollToTop();
  };

  // 도움말은 자동으로 열지 않아요. 사용자가 각 화면의 ? 버튼을 눌렀을 때만 표시합니다.
  useEffect(() => {
    setMenuHelpOpen(false);
  }, [view, account]);

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
  const handleAddPhoto = (date, dataUrls) => updateCurrentPet((p) => {
    const list = Array.isArray(dataUrls) ? dataUrls : [dataUrls];
    const stamp = Date.now();
    return { ...p, photos: [...p.photos, ...list.map((dataUrl, index) => ({ id: `${stamp}-${index}`, date, dataUrl }))] };
  });
  const handleEditPhoto = (photoId, changes) => updateCurrentPet((p) => ({
    ...p,
    photos: p.photos.map((ph) => (ph.id === photoId ? { ...ph, ...(changes || {}) } : ph)),
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
    // 확인 팝업을 닫고 완료 안내를 보여준 뒤 비로그인 홈 상태로 전환해요.
    setDeleteAccountConfirmOpen(false);
    setDeleteAccountDoneOpen(true);
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

  if (!loaded || !authChecked) return (
    <div className="bboggl-root petgrow-boot-skeleton" style={{ minHeight: "100vh", padding: "22px" }}>
      <GlobalStyle />
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="boot-skel-head"><i/><div><b/><span/></div></div>
        <div className="boot-skel-hero"><b/><span/><span/></div>
        <div className="boot-skel-grid">{[0,1,2,3,4,5].map(i=><div className="boot-skel-card" key={i}><i/><b/><span/></div>)}</div>
      </div>
      <style>{`
        .petgrow-boot-skeleton{background:#F8FAF7;color:var(--text);box-sizing:border-box}
        .boot-skel-head{display:flex;align-items:center;gap:12px;margin-bottom:26px}.boot-skel-head>i{width:42px;height:42px;border-radius:15px}.boot-skel-head div{display:grid;gap:7px}.boot-skel-head b{width:105px;height:14px;border-radius:8px}.boot-skel-head span{width:155px;height:9px;border-radius:8px}
        .boot-skel-hero{padding:28px;border-radius:25px;background:#fff;border:1px solid #E3EBE4;margin-bottom:18px;display:grid;gap:10px}.boot-skel-hero b{width:min(330px,70%);height:22px;border-radius:10px}.boot-skel-hero span{height:11px;border-radius:8px}.boot-skel-hero span:nth-child(2){width:min(500px,90%)}.boot-skel-hero span:nth-child(3){width:min(370px,72%)}
        .boot-skel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.boot-skel-card{min-height:120px;padding:18px;border-radius:22px;background:#fff;border:1px solid #E3EBE4;display:grid;align-content:start;gap:11px}.boot-skel-card i{width:38px;height:38px;border-radius:13px}.boot-skel-card b{width:44%;height:14px;border-radius:8px}.boot-skel-card span{width:78%;height:10px;border-radius:8px}
        .boot-skel-head i,.boot-skel-head b,.boot-skel-head span,.boot-skel-hero b,.boot-skel-hero span,.boot-skel-card i,.boot-skel-card b,.boot-skel-card span{display:block;background:linear-gradient(90deg,#EDF3ED 25%,#F8FBF8 45%,#EDF3ED 65%);background-size:240% 100%;animation:petgrowBootShimmer 1.15s ease-in-out infinite}
        @keyframes petgrowBootShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
        @media(max-width:760px){.petgrow-boot-skeleton{padding:18px 14px!important}.boot-skel-grid{grid-template-columns:1fr 1fr;gap:10px}.boot-skel-card{min-height:104px;padding:14px;border-radius:18px}.boot-skel-hero{padding:22px 18px;border-radius:21px}}
        @media(prefers-reduced-motion:reduce){.boot-skel-head i,.boot-skel-head b,.boot-skel-head span,.boot-skel-hero b,.boot-skel-hero span,.boot-skel-card i,.boot-skel-card b,.boot-skel-card span{animation:none}}
    
  /* PETPOINT_DASHBOARD_FINAL_20260817 */
  .petpoint-live-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:15px 0}.petpoint-live-stats>div{padding:13px;border:1px solid #e5eadf;border-radius:14px;background:#fff}.petpoint-live-stats small{display:block;font-size:10px;color:var(--sub)}.petpoint-live-stats b{display:block;margin-top:4px;font-size:17px}.petpoint-live-stats .plus b,.petpoint-history-row strong.plus{color:#2f7a4a}.petpoint-live-stats .minus b,.petpoint-history-row strong.minus{color:#8b6135}.petpoint-history-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:17px;padding-top:15px;border-top:1px solid #e9e5dc}.petpoint-history-head>div b{display:block;font-size:14px}.petpoint-history-head>div small{display:block;margin-top:3px;font-size:9.5px;color:var(--sub)}.petpoint-history-tabs{display:flex;gap:7px;margin:11px 0}.petpoint-history-tabs button{border:1px solid #dde6dc;background:#fff;border-radius:999px;padding:7px 11px;font-size:10px;font-weight:800;cursor:pointer}.petpoint-history-tabs button.active{background:#315f40;color:#fff;border-color:#315f40}.petpoint-history-list{border:1px solid #e6ebe3;border-radius:16px;overflow:hidden;background:#fff}.petpoint-history-row{display:grid;grid-template-columns:45px 1fr auto;gap:10px;align-items:center;padding:12px 13px;border-bottom:1px solid #eef0ec}.petpoint-history-row:last-child{border-bottom:0}.petpoint-history-row>span{display:grid;place-items:center;height:27px;border-radius:999px;font-size:9px;font-weight:900}.petpoint-history-row>span.earn{background:#edf7ef;color:#327148}.petpoint-history-row>span.spend{background:#faf2e8;color:#835e35}.petpoint-history-row>div b{display:block;font-size:11px}.petpoint-history-row>div small{display:block;margin-top:3px;font-size:9px;color:var(--sub)}.petpoint-history-row>strong{font-size:12px;white-space:nowrap}.petpoint-history-empty{text-align:center;padding:22px;font-size:11px;color:var(--sub)}.petpoint-dashboard-final .petpoint-toast{display:flex;flex-direction:column;gap:2px}.petpoint-dashboard-final .petpoint-toast b{font-size:11px}.petpoint-dashboard-final .petpoint-toast span{font-size:9px;opacity:.86}@media(max-width:700px){.petpoint-live-stats{grid-template-columns:1fr 1fr}.petpoint-history-row{grid-template-columns:40px 1fr auto}.petpoint-history-head{align-items:flex-start}.petpoint-history-head button{flex:none}}

  /* PETGROW_UI_POLISH_20260817 */
  .petpoint-visible{max-width:1120px;margin:16px auto 20px;padding:22px 24px;border:1px solid #d9e6d7;border-radius:24px;background:linear-gradient(135deg,#fffdf7,#eef7ed);display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;box-shadow:0 14px 34px rgba(55,75,58,.07)}.petpoint-visible-icon{width:58px;height:58px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:30px;border:1px solid #e4eadf}.petpoint-visible-copy small{font-size:10px;font-weight:900;letter-spacing:.14em;color:#4f8a5b}.petpoint-visible-copy h2{margin:4px 0 5px;font-size:20px}.petpoint-visible-copy p{margin:0;color:var(--sub);font-size:12px;line-height:1.65}.petpoint-visible-actions{text-align:right;max-width:320px}.petpoint-visible-actions b{display:block;color:#315f40;font-size:26px}.petpoint-visible-actions span{display:block;margin-top:4px;color:#7a806f;font-size:10px;line-height:1.5}.petpoint-visible.compact{padding:16px 20px;border-radius:20px}.petpoint-visible.compact .petpoint-visible-icon{width:46px;height:46px;font-size:24px}.petpoint-visible.compact .petpoint-visible-copy h2{font-size:16px}
  .about-feature-grid,.about-features-grid,.intro-feature-grid,.intro-features-grid,.about-grid,.about-feature-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}.about-feature-grid>*,.about-features-grid>*,.intro-feature-grid>*,.intro-features-grid>*,.about-grid>*,.about-feature-cards>*{min-height:220px!important;border:1px solid #dde8da!important;box-shadow:0 12px 30px rgba(55,75,58,.06)!important}.about-feature-grid>*:nth-child(4n+1),.about-features-grid>*:nth-child(4n+1),.intro-feature-grid>*:nth-child(4n+1),.intro-features-grid>*:nth-child(4n+1),.about-grid>*:nth-child(4n+1){background:#eef7ef!important}.about-feature-grid>*:nth-child(4n+2),.about-features-grid>*:nth-child(4n+2),.intro-feature-grid>*:nth-child(4n+2),.intro-features-grid>*:nth-child(4n+2),.about-grid>*:nth-child(4n+2){background:#f8f6ec!important}.about-feature-grid>*:nth-child(4n+3),.about-features-grid>*:nth-child(4n+3),.intro-feature-grid>*:nth-child(4n+3),.intro-features-grid>*:nth-child(4n+3),.about-grid>*:nth-child(4n+3){background:#edf6f6!important}.about-feature-grid>*:nth-child(4n),.about-features-grid>*:nth-child(4n),.intro-feature-grid>*:nth-child(4n),.intro-features-grid>*:nth-child(4n),.about-grid>*:nth-child(4n){background:#fbf1ec!important}
  .pet-tarot-stage,.feature-module-shell .bg-card{border-radius:22px}.pet-tarot-stage>h2,.pet-daily-fortune-card>h2{font-family:inherit!important;font-size:24px!important;font-weight:900!important;letter-spacing:-.035em!important;color:var(--text)!important;margin:6px 0 12px!important}.pet-tarot-topic-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.pet-tarot-topic{min-height:92px!important;padding:14px 16px!important;border-radius:16px!important}.pet-tarot-topic b{font-family:inherit!important;font-size:13px!important}.pet-tarot-topic small{font-size:10.5px!important;line-height:1.5!important}.pet-tarot-intro{font-family:inherit!important}.pet-tarot-back-link{font-family:inherit!important}
  .petnews-v10{max-width:1120px;margin:0 auto;padding:0 0 36px}.petnews-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:28px;border:1px solid #e0e8dc;border-radius:24px;background:linear-gradient(135deg,#fffdf8,#eef6ec);margin-bottom:14px}.petnews-hero small{font-size:10px;font-weight:900;letter-spacing:.14em;color:#4f8a5b}.petnews-hero h1{margin:4px 0 7px;font-size:28px}.petnews-hero p{margin:0;color:var(--sub);font-size:12px}.petnews-tools{display:grid;grid-template-columns:1fr 280px;gap:12px;margin-bottom:14px}.petnews-cats{display:flex;gap:7px;overflow:auto;padding-bottom:3px}.petnews-cats button{white-space:nowrap;border:1px solid #dde5d9;background:#fff;border-radius:999px;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}.petnews-cats button.active{background:#315f40;color:#fff;border-color:#315f40}.petnews-result-count{font-size:10.5px;color:var(--sub);margin:-4px 0 12px}.petnews-search{position:relative;display:flex;align-items:center}.petnews-search>span{position:absolute;left:12px;z-index:1;color:#758178}.petnews-search input{width:100%;padding-left:34px!important;padding-right:34px!important}.petnews-search>button{position:absolute;right:8px;border:0;background:#eef3ed;width:25px;height:25px;border-radius:50%;cursor:pointer;color:#607066}.petnews-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.petnews-card-v10{overflow:hidden;border:1px solid #e4e8e0;border-radius:20px;background:#fff;cursor:pointer;display:block;box-shadow:0 10px 28px rgba(55,75,58,.05)}.petnews-media{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#eef4ee}.petnews-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:2}.petnews-image-fallback{position:absolute;inset:0;background:linear-gradient(145deg,#edf5ea,#f8f3e7);display:none;flex-direction:column;align-items:center;justify-content:center;font-size:38px}.petnews-image-fallback.show{display:flex}.petnews-image-fallback small{font-size:9px;margin-top:7px;color:#78917d}.petnews-card-body{padding:17px}.petnews-meta{display:flex;justify-content:space-between;gap:10px;align-items:center}.petnews-meta span{font-size:10px;font-weight:900;color:#4f8a5b}.petnews-meta small{font-size:9px;color:var(--sub)}.petnews-card-body h2{font-size:16px;line-height:1.4;margin:8px 0}.petnews-card-body p{font-size:11.5px;line-height:1.65;color:#667168;margin:0}.petnews-card-body button{border:0;background:transparent;color:#4f8a5b;font-size:10.5px;font-weight:900;padding:10px 0 0;cursor:pointer}.petnews-state{padding:46px;text-align:center;border:1px solid #e4e8e0;border-radius:20px;background:#fff;color:var(--sub)}.petnews-state.error{display:grid;gap:8px;justify-items:center}.petnews-pages{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:18px}.petnews-pages button{border:1px solid #dce5d8;background:#fff;border-radius:12px;padding:8px 13px}.petnews-modal-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(20,35,26,.42);display:grid;place-items:center;padding:18px}.petnews-modal{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;border-radius:24px;background:#fff;padding:28px;box-shadow:0 25px 80px rgba(0,0,0,.2)}.petnews-modal>img{width:100%;max-height:300px;object-fit:cover;border-radius:16px;margin:12px 0}.petnews-close{position:absolute;right:16px;top:14px;border:0;background:#f2f4f1;border-radius:50%;width:34px;height:34px;font-size:22px}.petnews-summary-box{background:#f5f8f3;border:1px solid #e2e9df;border-radius:16px;padding:16px}.petnews-summary-box p,.petnews-source-note{font-size:12px;line-height:1.75;color:#616d64}.petnews-source-note{margin:12px 0}
  @media(max-width:760px){.petpoint-visible{margin:12px;padding:16px;grid-template-columns:auto 1fr}.petpoint-visible-actions{grid-column:1/-1;text-align:left;max-width:none}.about-feature-grid,.about-features-grid,.intro-feature-grid,.intro-features-grid,.about-grid,.about-feature-cards{grid-template-columns:1fr!important}.pet-tarot-topic-grid{grid-template-columns:1fr!important}.petnews-v10{padding:0 12px 28px}.petnews-hero{padding:20px;align-items:flex-start}.petnews-tools{grid-template-columns:1fr}.petnews-grid{grid-template-columns:1fr}.petnews-card-v10{display:block}.petnews-media{aspect-ratio:16/9}.petnews-modal{padding:22px}}
  `}
  </style>
    </div>
  );

  const breedGroups = species === "dog" ? DOG_BREED_GROUPS : CAT_BREED_GROUPS;
  const sizeOptions = species === "dog" ? DOG_SIZE_OPTIONS : CAT_SIZE_OPTIONS;
  const showOnboarding = mode === "onboarding" || mode === "edit" || (mode === "view" && !currentPet);

  return (
    <div className={`bboggl-root ${!isNativeApp ? "petgrow-web-layout" : ""} ${effectiveView === "admin" ? "admin-entry-root" : ""}`} style={{ minHeight: effectiveView === "admin" ? "auto" : "100vh", paddingBottom: isNativeApp ? 74 : 0 }}>
      <GlobalStyle />
      {!isNativeApp && (
        <aside className="petgrow-sidebar">
          <button type="button" className="petgrow-sidebar-brand" onClick={() => goView("home")}><img src="/petgrow-splash-logo.png" alt="" /><span><strong>Pet<b>Grow</b></strong><small>{lang === "en" ? "Healthy growth, together" : "우리 아이의 건강한 성장을 함께"}</small></span></button>
          <nav className="petgrow-sidebar-nav petgrow-sidebar-nav-grouped">
            <button className={view === "home" ? "active" : ""} onClick={() => goView("home")}><HomeIcon /><span>{t.hamNavHome}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "PET LIFE" : "반려생활"}</div>
            <button className={view === "pets" ? "active" : ""} onClick={() => goView("pets")}><HeartOutlineIcon /><span>{t.myPetsNav}</span></button>
            <button className={view === "nearby" ? "active" : ""} onClick={() => goView("nearby")}><MapPinIcon /><span>{t.nearbyNav}</span></button>
            <button className={view === "music" ? "active" : ""} onClick={() => goView("music")}><MusicIcon /><span>{lang === "en" ? "Pet Music" : "Pet음악"}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "COMMUNITY · CONTENT" : "커뮤니티 · 콘텐츠"}</div>
            <button className={view === "community" ? "active" : ""} onClick={() => goView("community")}><TalkIcon /><span>{t.communityNav}</span></button>
            <button className={view === "petbti" ? "active" : ""} onClick={() => goView("petbti")}><PetBtiIcon /><span>{t.petBtiNav}</span></button>
            <button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{t.sajuNav}</span></button>
            <button className={`tarot-nav ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span className="sidebar-tarot-mark">🃏</span><span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "INFO · SUPPORT" : "정보 · 지원"}</div>
            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>
            <button className={view === "news" ? "active" : ""} onClick={() => goView("news")}><InfoIcon /><span>{lang === "en" ? "Pet News" : "Pet뉴스"}</span></button>
            <button className={view === "about" ? "active" : ""} onClick={() => goView("about")}><InfoIcon /><span>{t.aboutNav}</span></button>
          </nav>
          <div className="petgrow-sidebar-bottom"><div className="petgrow-sidebar-message">♡ <span>{lang === "en" ? "A happier day with your pet" : "우리 아이와 더 행복한 하루"}</span></div><LangToggle lang={lang} onChange={setLang} /><AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} /></div>
        </aside>
      )}
      <div className={`petgrow-page-top ${effectiveView === "pets" ? "pets-page-top" : ""}`} style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px 0" }}>
        {!isNativeApp && (
          <>
            {/* PC: 프리미엄 글래스 상단 메뉴 (900px 이상) */}
            <div className="desktop-nav desktop-nav-shell">
              <button type="button" className="desktop-brand" onClick={() => goView("home")} aria-label="홈으로 이동">
                <img className="desktop-brand-logo" src="/petgrow-splash-logo.png" alt="" />
                <span className="desktop-brand-copy">
                  <span className="desktop-brand-name">Pet<b>Grow</b></span>
                  <span className="desktop-brand-tagline">{lang === "en" ? "Growing together, every day" : "우리 아이의 건강한 성장을 함께"}</span>
                </span>
              </button>

              <nav className="desktop-nav-links" aria-label={lang === "en" ? "Main navigation" : "주요 메뉴"}>
                <button type="button" className={`desktop-nav-link ${view === "home" ? "active" : ""}`} onClick={() => goView("home")}><HomeIcon />{t.hamNavHome}</button>
                <button type="button" className={`desktop-nav-link ${view === "about" ? "active" : ""}`} onClick={() => goView("about")}><InfoIcon />{t.aboutNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "pets" ? "active" : ""}`} onClick={() => goView("pets")}><HeartOutlineIcon />{t.myPetsNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "nearby" ? "active" : ""}`} onClick={() => goView("nearby")}><MapPinIcon />{t.nearbyNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "community" ? "active" : ""}`} onClick={() => goView("community")}><TalkIcon />{t.communityNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "saju" ? "active" : ""}`} onClick={() => goView("saju")}><SajuIcon />{t.sajuNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span style={{fontSize:15}}>🃏</span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</button>
                <button type="button" className={`desktop-nav-link ${view === "petbti" ? "active" : ""}`} onClick={() => goView("petbti")}><PetBtiIcon />{t.petBtiNav}</button>
                <button type="button" className={`desktop-nav-link ${view === "music" ? "active" : ""}`} onClick={() => goView("music")}><MusicIcon />{lang === "en" ? "Pet Music" : "Pet음악"}</button>
                <button type="button" className={`desktop-nav-link ${view === "tips" ? "active" : ""}`} onClick={() => goView("tips")}><LightbulbIcon />{t.tipsTitle}</button>
                <button type="button" className={`desktop-nav-link ${view === "news" ? "active" : ""}`} onClick={() => goView("news")}><InfoIcon />{lang === "en" ? "Pet News" : "Pet뉴스"}</button>
              </nav>

              <div className="desktop-nav-actions">
                <LangToggle lang={lang} onChange={setLang} />
                <AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
              </div>
            </div>

            {/* 모바일 웹: ☰ | 로고 | KO/EN | 로그인/프로필 (900px 미만) */}
            <div className="mobile-topbar mobile-topbar-premium" style={{ alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
              <button type="button" className="icon-btn" aria-label={t.hamMenuAria} onClick={() => setHamOpen(true)}>
                <HamburgerIcon style={{ width: 20, height: 20 }} />
              </button>
              <button type="button" onClick={() => goView("home")}
                aria-label="홈으로 이동"
                style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <img className="mobile-brand-logo" src="/petgrow-splash-logo.png" alt="" />
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Jua',sans-serif", letterSpacing: "-.02em" }}>
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

        {/* 앱(Capacitor 네이티브): 하단 6탭이 내비게이션을 담당하므로 상단은 로고 한 줄만 */}
        {isNativeApp && (
          <div className="native-app-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button type="button" onClick={() => goView("home")} aria-label="홈으로 이동"
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <img className="mobile-brand-logo" src="/petgrow-splash-logo.png" alt="" />
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Jua',sans-serif", letterSpacing: "-.02em" }}>
                <span style={{ color: "var(--text)" }}>Pet</span><span style={{ color: "var(--primary)" }}>Grow</span>
              </span>
            </button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <LangToggle lang={lang} onChange={setLang} />
              <AccountButton account={account} onOpen={() => (account ? setAccountModalOpen(true) : goView("pets"))} />
            </div>
          </div>
        )}

        {effectiveView === "pets" && <>
          <UnifiedMenuHero view="pets" lang={lang} />
          <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}
            onChange={(s) => { setSpecies(s); setMode("view"); }} />
        </>}
      </div>

      <div className="petgrow-content-stage">
      {["community","tips","saju","tarot","petbti","guide","my","more","support","ad-inquiry","nearby","music","news"].includes(effectiveView) && <UnifiedMenuHero view={effectiveView} lang={lang} />}
      {effectiveView === "login" ? (
        <LoginScreen onGoTerms={() => goView("terms")} onGoPrivacy={() => goView("privacy")} />
      ) : effectiveView === "privacy" ? (
        <><PrivacyContent /><PetNewsPrivacyAddendum /><PetPointPolicyAddendum type="privacy" /></>
      ) : effectiveView === "terms" ? (
        <><TermsContent /><PetNewsTermsAddendum /><PetPointPolicyAddendum type="terms" /></>
      ) : effectiveView === "about" ? (
        <><AboutPage onStart={() => goView("pets")} onNavigate={(v) => goView(v)} /><PetPointAboutCard /></>
      ) : effectiveView === "home" ? (
        <HomePage account={account} pets={allPets} lang={lang}
          onGoPets={() => goView("pets")} onGoView={(v) => goView(v)} />
      ) : effectiveView === "more" ? (
        <MoreMenuPage lang={lang} onNavigate={(v)=>goView(v)} />
      ) : effectiveView === "guide" ? (
        <InfoGuidePage />
      ) : effectiveView === "nearby" ? (
        <NearbyPetPage />
      ) : effectiveView === "music" ? (
        <PetMusicPage account={account} lang={lang} />
      ) : effectiveView === "content" ? (
        <PetContentPage subTab={contentSubTab} onSubTabChange={setContentSubTab}
          allPets={allPets} featurePet={featurePet} onSelectFeaturePet={setFeaturePetId}
          onUpdatePetBti={handleUpdatePetBti} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
      ) : effectiveView === "community" ? (
        <PetTalkErrorBoundary key={`pettalk-${account?.id||"guest"}`}><CommunityPage allPets={allPets} account={account} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} /></PetTalkErrorBoundary>
      ) : effectiveView === "my" ? (
        <MyPage account={account} allPets={allPets} lang={lang}
          onOpenAccount={() => setAccountModalOpen(true)} onGoPets={() => goView("pets")}
          onOpenPost={() => goView("community")} onOpenAdmin={() => goView("admin")}
          onLogout={handleLogout} onDeleteAccount={() => setDeleteAccountConfirmOpen(true)} onGoSupport={() => goView("support")} />
      ) : effectiveView === "admin" ? (
        <AdminReportsPage onBack={() => goView("my")} />
      ) : effectiveView === "support" ? (
        <SupportPage account={account} lang={lang} onBack={() => goView("my")} />
      ) : effectiveView === "ad-inquiry" ? (
        <AdInquiryPage onBack={() => goView("home")} />
      ) : effectiveView === "news" ? (
        <PetNewsPage lang={lang} />
      ) : effectiveView === "tips" ? (
        <TipsPage />
      ) : effectiveView === "saju" ? (
        <div className="legal-page-shell feature-page-shell feature-page-saju">
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={setFeaturePetId} />
          <SajuPage pet={featurePet} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />
        </div>
      ) : effectiveView === "tarot" ? (
        <div className="legal-page-shell feature-page-shell feature-page-tarot">
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={setFeaturePetId} />
          {featurePet ? <PetTarotPanel pet={featurePet} lang={lang} /> : <div className="feature-empty-wrap"><div className="bg-card feature-empty-card"><span className="feature-empty-icon">🃏</span><h2>등록된 아이가 아직 없어요</h2><p className="bg-sub">Pet타로는 '우리 아이'에 등록한 반려동물만 이용할 수 있어요. 먼저 반려동물을 등록해 주세요.</p><button className="bg-btn" onClick={()=>{setMode("onboarding");goView("pets")}}>우리 아이 등록하러 가기</button></div></div>}
        </div>
      ) : effectiveView === "petbti" ? (
        <div className="legal-page-shell feature-page-shell feature-page-petbti">
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
      </div>

      {effectiveView !== "login" && (
        <footer className="petgrow-footer">
          <div className="petgrow-footer-social-title">{t.socialTitle}</div>
          <SocialLinks />
          <nav className="petgrow-footer-links" aria-label={lang==="en"?"Footer links":"하단 메뉴"}>
            <button type="button" onClick={()=>goView("privacy")}>{t.privacyFooterLink}</button>
            <button type="button" onClick={()=>goView("terms")}>{t.termsFooterLink}</button>
            <button type="button" onClick={()=>goView("guide")}>{lang==="en"?"Guide":"정보가이드"}</button>
            <button type="button" onClick={()=>goView("ad-inquiry")}>{lang==="en"?"Partnerships":"광고·제휴 문의"}</button>
            <button type="button" onClick={()=>goView("support")}>{lang==="en"?"Support":"고객지원"}</button>
          </nav>
          <div className="petgrow-footer-meta">
            <span>아우리녹</span>
            <span>사업자등록번호 297-32-01792</span>
            <a href="mailto:help.petgrow@gmail.com">help.petgrow@gmail.com</a>
          </div>
          <div className="petgrow-footer-copy">© PetGrow. All rights reserved.</div>
        </footer>
      )}

      {isNativeApp && (
        <AppBottomNav
          active={view === "home" ? "home" : view === "pets" ? "pets" : view === "music" ? "music" : view === "nearby" ? "nearby" : view === "community" ? "community" : view === "more" ? "more" : ""}
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
      <PublicNoticePopup/>
      <PublicDirectAds/>
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        account={account}
        onLogout={handleLogout}
        onRequestDelete={() => { setAccountModalOpen(false); setDeleteAccountConfirmOpen(true); }}
        onNicknameUpdated={(name) => setAccount((prev) => prev ? { ...prev, name } : prev)}
        onOpenAdmin={() => goView("admin")}
      />
      <ConfirmModal
        open={deleteAccountConfirmOpen}
        title={t.deleteAccountConfirmTitle}
        message={t.deleteAccountConfirmBody}
        confirmLabel={deletingAccount ? t.migrationSaving : t.accountDeleteBtn}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteAccountConfirmOpen(false)}
        danger
        busy={deletingAccount}
      />
      <Modal open={deleteAccountDoneOpen} onClose={() => setDeleteAccountDoneOpen(false)} width={360}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{t.deleteAccountDoneTitle}</div>
          <div className="bg-sub" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{t.deleteAccountDoneBody}</div>
          <button type="button" className="bg-btn" style={{ width: "100%" }} onClick={() => setDeleteAccountDoneOpen(false)}>확인</button>
        </div>
      </Modal>
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
      {effectiveView !== "admin" && <a className="kakao-chat-fab" href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" aria-label="펫그로우 카카오톡 1:1 상담"><KakaoChannelIcon /><span>카카오톡 상담</span></a>}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(()=>{try{const v=localStorage.getItem("petgrow:lang");return ["ko","en","ja","zh"].includes(v)?v:"ko"}catch{return "ko"}});
  useEffect(()=>{try{localStorage.setItem("petgrow:lang",lang)}catch{}},[lang]);
  useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":lang},[lang]);
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

/* PETGROW_FINAL_UX_APPLIED_20260818 */
