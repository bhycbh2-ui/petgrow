YªçŠx-®éÜj×¢ëiºÚ+Š§j[h‘éÜ¢éíãm6Ó¾·Ûnvo+^²‰¢¶×import HomeInfoMusicSections from "./HomeInfoMusicSections.jsx";
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

// AdMob ì•±/ê´‘ê³  ë‹¨ìœ„ ID â€” ì‹¤ì œ ì•±(Android/iOS)ì—ì„œë§Œ ë™ìž‘í•´ìš”, ì›¹ì‚¬ì´íŠ¸ì—ì„œëŠ” ê´‘ê³ ê°€ ì•ˆ ë– ìš”
const ADMOB_ANDROID_APP_ID = "ca-app-pub-9699974051273244~1293517862";
const ADMOB_BANNER_ID = "ca-app-pub-9699974051273244/9809518314";
// ê°œë°œ ì¤‘ í…ŒìŠ¤íŠ¸í•  ë•ŒëŠ” ì‹¤ì œ ê´‘ê³  ëŒ€ì‹  êµ¬ê¸€ ê³µì‹ í…ŒìŠ¤íŠ¸ IDë¥¼ ì“°ëŠ” ê²Œ ì•ˆì „í•´ìš”(ì‹¤ìˆ˜ë¡œ ìžê¸° ê´‘ê³ ë¥¼ í´ë¦­í•˜ë©´ ê³„ì • ì •ì§€ ìœ„í—˜ì´ ìžˆì–´ìš”).
// í…ŒìŠ¤íŠ¸í•˜ë ¤ë©´ ì•„ëž˜ ì¤„ì˜ ì£¼ì„ì„ í’€ê³ , ìœ„ ADMOB_BANNER_ID ëŒ€ì‹  ì´ ê°’ì„ ì“°ì„¸ìš”.
// const ADMOB_BANNER_ID_TEST = "ca-app-pub-3940256099942544/6300978111";

/* ============================================================
   data/growthCurves.js ì—­í• 
   ============================================================ */
const ALL_CURVES = {
  "dog-small": { points: { 1: 0.10, 2: 0.25, 3: 0.40, 4: 0.51, 5: 0.62, 6: 0.69, 7: 0.75, 8: 0.81, 9: 0.87, 10: 0.91, 11: 0.95, 12: 0.98, 15: 1.0, 18: 1.0, 24: 1.0 } },
  "dog-medium": { points: { 1: 0.08, 2: 0.18, 3: 0.30, 4: 0.40, 5: 0.50, 6: 0.58, 7: 0.65, 8: 0.71, 9: 0.77, 10: 0.82, 11: 0.86, 12: 0.90, 15: 0.97, 18: 1.0, 24: 1.0 } },
  "dog-large": { points: { 1: 0.05, 2: 0.12, 3: 0.20, 4: 0.28, 5: 0.35, 6: 0.42, 7: 0.49, 8: 0.55, 9: 0.61, 10: 0.66, 11: 0.71, 12: 0.75, 15: 0.86, 18: 0.94, 24: 1.0 } },
  "cat-standard": { points: { 1: 0.15, 2: 0.30, 3: 0.45, 4: 0.58, 5: 0.68, 6: 0.76, 7: 0.82, 8: 0.87, 9: 0.91, 10: 0.94, 11: 0.97, 12: 0.99, 15: 1.0, 18: 1.0, 24: 1.0 } },
  "cat-giant": { points: { 1: 0.08, 2: 0.16, 3: 0.24, 4: 0.32, 5: 0.40, 6: 0.47, 7: 0.53, 8: 0.59, 9: 0.64, 10: 0.69, 11: 0.73, 12: 0.77, 15: 0.85, 18: 0.90, 24: 1.0 } },
};

/* ============================================================
   ê²¬ì¢… / ë¬˜ì¢… ë°ì´í„°ë² ì´ìŠ¤ (name = í•œêµ­ì–´, nameEn = ì˜ì–´)
   ============================================================ */
const DOG_BREED_GROUPS = [
  {
    size: "small", label: "ì†Œí˜•ê²¬", labelEn: "Small breeds",
    breeds: [
      { id: "chihuahua", name: "ì¹˜ì™€ì™€", nameEn: "Chihuahua", avgAdultKg: 2.3 },
      { id: "pomeranian", name: "í¬ë©”ë¼ë‹ˆì•ˆ", nameEn: "Pomeranian", avgAdultKg: 2.0 },
      { id: "yorkshire", name: "ìš”í¬ì…”í…Œë¦¬ì–´", nameEn: "Yorkshire Terrier", avgAdultKg: 2.8 },
      { id: "maltese", name: "ëª°í‹°ì¦ˆ", nameEn: "Maltese", avgAdultKg: 3.2 },
      { id: "shihtzu", name: "ì‹œì¸„", nameEn: "Shih Tzu", avgAdultKg: 4.5 },
      { id: "pekingese", name: "íŽ˜í‚¤ë‹ˆì¦ˆ", nameEn: "Pekingese", avgAdultKg: 5.0 },
      { id: "papillon", name: "íŒŒí”¼ìš©", nameEn: "Papillon", avgAdultKg: 4.0 },
      { id: "min-pin", name: "ë¯¸ë‹ˆì–´ì²˜í•€ì…”", nameEn: "Miniature Pinscher", avgAdultKg: 4.5 },
      { id: "bichon", name: "ë¹„ìˆ‘í”„ë¦¬ì œ", nameEn: "Bichon Frise", avgAdultKg: 3.5 },
      { id: "maltipoo", name: "ë§í‹°í‘¸", nameEn: "Maltipoo", avgAdultKg: 3.0 },
      { id: "toy-poodle", name: "í‘¸ë“¤(í† ì´)", nameEn: "Poodle (Toy)", avgAdultKg: 2.5 },
      { id: "mini-poodle", name: "í‘¸ë“¤(ë¯¸ë‹ˆì–´ì²˜)", nameEn: "Poodle (Miniature)", avgAdultKg: 6.0 },
      { id: "jack-russell", name: "ìž­ëŸ¬ì…€í…Œë¦¬ì–´", nameEn: "Jack Russell Terrier", avgAdultKg: 7.0 },
      { id: "silky-terrier", name: "ì‹¤í‚¤í…Œë¦¬ì–´", nameEn: "Silky Terrier", avgAdultKg: 4.5 },
      { id: "cavalier", name: "ì¹´ë°œë¦¬ì— í‚¹ ì°°ìŠ¤ ìŠ¤íŒ¨ë‹ˆì–¼", nameEn: "Cavalier King Charles Spaniel", avgAdultKg: 7.5 },
      { id: "mini-schnauzer", name: "ë¯¸ë‹ˆì–´ì²˜ ìŠˆë‚˜ìš°ì €", nameEn: "Miniature Schnauzer", avgAdultKg: 6.5 },
      { id: "lhasa-apso", name: "ë¼ì‚¬ì••ì†Œ", nameEn: "Lhasa Apso", avgAdultKg: 6.5 },
      { id: "italian-greyhound", name: "ì´íƒˆë¦¬ì•ˆ ê·¸ë ˆì´í•˜ìš´ë“œ", nameEn: "Italian Greyhound", avgAdultKg: 4.5 },
      { id: "brussels-griffon", name: "ë¸Œë¤¼ì…€ê·¸ë¦¬íŽ€", nameEn: "Brussels Griffon", avgAdultKg: 4.5 },
      { id: "japanese-chin", name: "ìž¬íŒ¨ë‹ˆì¦ˆì¹œ", nameEn: "Japanese Chin", avgAdultKg: 3.5 },
      { id: "boston-terrier", name: "ë³´ìŠ¤í„´í…Œë¦¬ì–´", nameEn: "Boston Terrier", avgAdultKg: 8.0 },
      { id: "dachshund-mini", name: "ë¯¸ë‹ˆì–´ì²˜ ë‹¥ìŠ¤í›ˆíŠ¸", nameEn: "Miniature Dachshund", avgAdultKg: 5.0 },
      { id: "pug", name: "í¼ê·¸", nameEn: "Pug", avgAdultKg: 7.5 },
    ],
  },
  {
    size: "medium", label: "ì¤‘í˜•ê²¬", labelEn: "Medium breeds",
    breeds: [
      { id: "corgi", name: "ì›°ì‹œì½”ê¸°", nameEn: "Welsh Corgi", avgAdultKg: 12 },
      { id: "beagle", name: "ë¹„ê¸€", nameEn: "Beagle", avgAdultKg: 11 },
      { id: "cocker-spaniel", name: "ì½”ì¹´ìŠ¤íŒ¨ë‹ˆì–¼", nameEn: "Cocker Spaniel", avgAdultKg: 13 },
      { id: "shiba", name: "ì‹œë°”ê²¬", nameEn: "Shiba Inu", avgAdultKg: 10 },
      { id: "jindo", name: "ì§„ë—ê°œ", nameEn: "Jindo", avgAdultKg: 19 },
      { id: "border-collie", name: "ë³´ë”ì½œë¦¬", nameEn: "Border Collie", avgAdultKg: 18 },
      { id: "french-bulldog", name: "í”„ë Œì¹˜ë¶ˆë…", nameEn: "French Bulldog", avgAdultKg: 11 },
      { id: "bulldog", name: "ë¶ˆë…", nameEn: "Bulldog", avgAdultKg: 20 },
      { id: "basset-hound", name: "ë°”ì…‹í•˜ìš´ë“œ", nameEn: "Basset Hound", avgAdultKg: 25 },
      { id: "sheltie", name: "ì…°í‹€ëžœë“œì‰½ë…", nameEn: "Shetland Sheepdog", avgAdultKg: 9 },
      { id: "westie", name: "ì›¨ìŠ¤íŠ¸í•˜ì´ëžœë“œí™”ì´íŠ¸í…Œë¦¬ì–´", nameEn: "West Highland White Terrier", avgAdultKg: 9 },
      { id: "bull-terrier", name: "ë¶ˆí…Œë¦¬ì–´", nameEn: "Bull Terrier", avgAdultKg: 24 },
      { id: "am-staffordshire", name: "ì•„ë©”ë¦¬ì¹¸ ìŠ¤íƒœí¼ë“œì…” í…Œë¦¬ì–´", nameEn: "American Staffordshire Terrier", avgAdultKg: 25 },
      { id: "dalmatian", name: "ë‹¬ë§ˆì‹œì•ˆ", nameEn: "Dalmatian", avgAdultKg: 24 },
      { id: "chow-chow", name: "ì°¨ìš°ì°¨ìš°", nameEn: "Chow Chow", avgAdultKg: 25 },
      { id: "australian-shepherd", name: "ì˜¤ìŠ¤íŠ¸ë ˆì¼ë¦¬ì•ˆ ì…°í¼ë“œ", nameEn: "Australian Shepherd", avgAdultKg: 23 },
      { id: "brittany", name: "ë¸Œë¦¬íƒ€ë‹ˆ ìŠ¤íŒ¨ë‹ˆì–¼", nameEn: "Brittany Spaniel", avgAdultKg: 17 },
    ],
  },
  {
    size: "large", label: "ëŒ€í˜•ê²¬", labelEn: "Large breeds",
    breeds: [
      { id: "golden-retriever", name: "ê³¨ë“ ë¦¬íŠ¸ë¦¬ë²„", nameEn: "Golden Retriever", avgAdultKg: 30 },
      { id: "labrador", name: "ëž˜ë¸Œë¼ë„ë¦¬íŠ¸ë¦¬ë²„", nameEn: "Labrador Retriever", avgAdultKg: 30 },
      { id: "german-shepherd", name: "ì €ë¨¼ì…°í¼ë“œ", nameEn: "German Shepherd", avgAdultKg: 32 },
      { id: "doberman", name: "ë„ë² ë¥´ë§Œí•€ì…”", nameEn: "Doberman Pinscher", avgAdultKg: 35 },
      { id: "rottweiler", name: "ë¡œíŠ¸ì™€ì¼ëŸ¬", nameEn: "Rottweiler", avgAdultKg: 45 },
      { id: "great-dane", name: "ê·¸ë ˆì´íŠ¸ë°ì¸", nameEn: "Great Dane", avgAdultKg: 60 },
      { id: "st-bernard", name: "ì„¸ì¸íŠ¸ë²„ë‚˜ë“œ", nameEn: "Saint Bernard", avgAdultKg: 65 },
      { id: "bernese", name: "ë²„ë‹ˆì¦ˆë§ˆìš´í‹´ë…", nameEn: "Bernese Mountain Dog", avgAdultKg: 40 },
      { id: "malamute", name: "ì•Œëž˜ìŠ¤ì¹¸ ë§ë¼ë®¤íŠ¸", nameEn: "Alaskan Malamute", avgAdultKg: 38 },
      { id: "husky", name: "ì‹œë² ë¦¬ì•ˆí—ˆìŠ¤í‚¤", nameEn: "Siberian Husky", avgAdultKg: 23 },
      { id: "boxer", name: "ë³µì„œ", nameEn: "Boxer", avgAdultKg: 28 },
      { id: "mastiff", name: "ë§ˆìŠ¤í‹°í”„", nameEn: "Mastiff", avgAdultKg: 70 },
      { id: "newfoundland", name: "ë‰´íŽ€ë“¤ëžœë“œ", nameEn: "Newfoundland", avgAdultKg: 60 },
      { id: "greyhound", name: "ê·¸ë ˆì´í•˜ìš´ë“œ", nameEn: "Greyhound", avgAdultKg: 30 },
      { id: "standard-poodle", name: "í‘¸ë“¤(ìŠ¤íƒ ë‹¤ë“œ)", nameEn: "Poodle (Standard)", avgAdultKg: 27 },
      { id: "samoyed", name: "ì‚¬ëª¨ì˜ˆë“œ", nameEn: "Samoyed", avgAdultKg: 25 },
      { id: "pointer", name: "í¬ì¸í„°", nameEn: "Pointer", avgAdultKg: 28 },
    ],
  },
];

const CAT_BREED_GROUPS = [
  {
    size: "standard", label: "ì¼ë°˜ ì²´êµ¬", labelEn: "Standard size",
    breeds: [
      { id: "korean-shorthair", name: "ì½”ë¦¬ì•ˆìˆí—¤ì–´", nameEn: "Korean Shorthair", avgAdultKg: 4.0 },
      { id: "russian-blue", name: "ëŸ¬ì‹œì•ˆë¸”ë£¨", nameEn: "Russian Blue", avgAdultKg: 4.3 },
      { id: "british-shorthair", name: "ë¸Œë¦¬í‹°ì‹œìˆí—¤ì–´", nameEn: "British Shorthair", avgAdultKg: 5.0 },
      { id: "scottish-fold", name: "ìŠ¤ì½”í‹°ì‹œí´ë“œ", nameEn: "Scottish Fold", avgAdultKg: 4.0 },
      { id: "scottish-straight", name: "ìŠ¤ì½”í‹°ì‹œìŠ¤íŠ¸ë ˆì´íŠ¸", nameEn: "Scottish Straight", avgAdultKg: 4.0 },
      { id: "persian", name: "íŽ˜ë¥´ì‹œì•ˆ", nameEn: "Persian", avgAdultKg: 4.3 },
      { id: "american-shorthair", name: "ì•„ë©”ë¦¬ì¹¸ìˆí—¤ì–´", nameEn: "American Shorthair", avgAdultKg: 4.5 },
      { id: "munchkin", name: "ë¨¼ì¹˜í‚¨", nameEn: "Munchkin", avgAdultKg: 3.0 },
      { id: "sphynx", name: "ìŠ¤í•‘í¬ìŠ¤", nameEn: "Sphynx", avgAdultKg: 4.0 },
      { id: "abyssinian", name: "ì•„ë¹„ì‹œë‹ˆì•ˆ", nameEn: "Abyssinian", avgAdultKg: 3.8 },
      { id: "bengal", name: "ë²µê°ˆ", nameEn: "Bengal", avgAdultKg: 5.0 },
      { id: "siamese", name: "ìƒ´", nameEn: "Siamese", avgAdultKg: 4.0 },
      { id: "turkish-angora", name: "í„°í‚¤ì‹œì•™ê³ ë¼", nameEn: "Turkish Angora", avgAdultKg: 3.8 },
      { id: "exotic-shorthair", name: "ì—‘ì¡°í‹±ìˆí—¤ì–´", nameEn: "Exotic Shorthair", avgAdultKg: 4.3 },
      { id: "himalayan", name: "ížˆë§ë¼ì–€", nameEn: "Himalayan", avgAdultKg: 4.5 },
      { id: "burmese", name: "ë²„ë¯¸ì¦ˆ", nameEn: "Burmese", avgAdultKg: 4.0 },
      { id: "oriental-shorthair", name: "ì˜¤ë¦¬ì—”íƒˆìˆí—¤ì–´", nameEn: "Oriental Shorthair", avgAdultKg: 3.6 },
      { id: "devon-rex", name: "ë°ë³¸ë ‰ìŠ¤", nameEn: "Devon Rex", avgAdultKg: 3.5 },
      { id: "cornish-rex", name: "ì½”ë‹ˆì‹œë ‰ìŠ¤", nameEn: "Cornish Rex", avgAdultKg: 3.3 },
    ],
  },
  {
    size: "giant", label: "ëŒ€í˜• í’ˆì¢… (ì„±ìž¥ì´ ëŠë ¤ìš”)", labelEn: "Large breeds (slow growth)",
    breeds: [
      { id: "ragdoll", name: "ëž™ëŒ", nameEn: "Ragdoll", avgAdultKg: 7.0 },
      { id: "maine-coon", name: "ë©”ì¸ì¿¤", nameEn: "Maine Coon", avgAdultKg: 8.0 },
      { id: "norwegian-forest", name: "ë…¸ë¥´ì›¨ì´ìˆ²", nameEn: "Norwegian Forest Cat", avgAdultKg: 6.5 },
      { id: "siberian-cat", name: "ì‹œë² ë¦¬ì•ˆ", nameEn: "Siberian", avgAdultKg: 6.0 },
      { id: "turkish-van", name: "í„°í‚¤ì‹œë°˜", nameEn: "Turkish Van", avgAdultKg: 6.0 },
    ],
  },
];

const DOG_SIZE_OPTIONS = [
  { id: "small", name: "ì†Œí˜• (~9kg ë‚´ì™¸)", nameEn: "Small (~9kg)", avgAdultKg: 4.0 },
  { id: "medium", name: "ì¤‘í˜• (9~25kg ë‚´ì™¸)", nameEn: "Medium (9-25kg)", avgAdultKg: 15 },
  { id: "large", name: "ëŒ€í˜• (25kg ì´ìƒ)", nameEn: "Large (25kg+)", avgAdultKg: 35 },
];
const CAT_SIZE_OPTIONS = [
  { id: "standard", name: "ì¼ë°˜ ì²´êµ¬ (ëŒ€ë¶€ë¶„ì˜ í’ˆì¢…)", nameEn: "Standard size (most breeds)", avgAdultKg: 4.3 },
  { id: "giant", name: "ëŒ€í˜• í’ˆì¢… (ë©”ì¸ì¿¤Â·ëž™ëŒ ë“±, ì„±ìž¥ì´ ëŠë ¤ìš”)", nameEn: "Large breed (Maine Coon, Ragdoll, etc. â€” grows slowly)", avgAdultKg: 7.0 },
];

const BODY_CONDITIONS = [
  { id: "thin", name: "ë§ˆë¥¸ íŽ¸", nameEn: "Thin" },
  { id: "normal", name: "ë³´í†µ", nameEn: "Average" },
  { id: "chubby", name: "í†µí†µí•œ íŽ¸", nameEn: "Chubby" },
];

/* ============================================================
   i18n â€” ì–¸ì–´ ì»¨í…ìŠ¤íŠ¸ + ë¬¸ìžì—´ ì‚¬ì „
   ============================================================ */
const LangContext = createContext("ko");
function useLang() {
  return useContext(LangContext);
}

const STRINGS = {
  ko: {
    privacyFooter: "ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•˜ë©´ ë“±ë¡í•œ ìš°ë¦¬ ì•„ì´ ì •ë³´ëŠ” ë¡œê·¸ì¸í•œ ê³„ì •ì— ì•ˆì „í•˜ê²Œ ì €ìž¥ë˜ê³ , ë‹¤ë¥¸ ê¸°ê¸°ì—ì„œë„ ë¡œê·¸ì¸ë§Œ í•˜ë©´ ê·¸ëŒ€ë¡œ ë¶ˆëŸ¬ì˜¬ ìˆ˜ ìžˆì–´ìš”.",
    cancel: "ì·¨ì†Œ",
    helpAria: "ì´ìš© ê°€ì´ë“œ ë³´ê¸°",
    hamMenuAria: "ë©”ë‰´ ì—´ê¸°",
    hamCloseAria: "ë©”ë‰´ ë‹«ê¸°",
    hamNavHome: "í™ˆ",
    aboutNav: "ì†Œê°œ",
    hamNavMy: "íšŒì›ì •ë³´",
    hamNavSettings: "ì •ë³´ ìˆ˜ì •",
    appTabPetInfo: "Petì •ë³´",
    appTabPetContent: "Petì½˜í…ì¸ ",
    contentTabAll: "ì „ì²´",
    confirmDeleteTitle: "ì •ë§ ì‚­ì œí• ê¹Œìš”?",
    confirmDeleteMsg: (name) => `${name}ì˜ ëª¨ë“  ê¸°ë¡Â·ì‚¬ì§„ì´ ì‚¬ë¼ì§€ê³  ë˜ëŒë¦´ ìˆ˜ ì—†ì–´ìš”.`,
    confirmDeleteBtn: "ì‚­ì œ",
    guideTitle: "ì´ìš© ê°€ì´ë“œ",
    guideConfirm: "í™•ì¸í–ˆì–´ìš”",
    privacyTitle: "ê°œì¸ì •ë³´ì²˜ë¦¬ë°©ì¹¨",
    privacyIntro: "PetGrow(ì´í•˜ \"ì„œë¹„ìŠ¤\")ëŠ” ì´ìš©ìžì˜ ê°œì¸ì •ë³´ë¥¼ ì¤‘ìš”í•˜ê²Œ ìƒê°í•˜ë©° ã€Œê°œì¸ì •ë³´ ë³´í˜¸ë²•ã€ ë“± ê´€ë ¨ ë²•ë ¹ì„ ì¤€ìˆ˜í•˜ê¸° ìœ„í•´ ë…¸ë ¥í•©ë‹ˆë‹¤. ë³¸ ê°œì¸ì •ë³´ì²˜ë¦¬ë°©ì¹¨ì€ PetGrow ì›¹ì‚¬ì´íŠ¸ ë° ëª¨ë°”ì¼ ì• í”Œë¦¬ì¼€ì´ì…˜ì— ì ìš©ë©ë‹ˆë‹¤.",
    termsTitle: "ì´ìš©ì•½ê´€",
    termsIntro: "ë³¸ ì•½ê´€ì€ PetGrowê°€ ì œê³µí•˜ëŠ” ì›¹ì‚¬ì´íŠ¸, ëª¨ë°”ì¼ ì• í”Œë¦¬ì¼€ì´ì…˜ ë° ê´€ë ¨ ì„œë¹„ìŠ¤ì˜ ì´ìš©ì¡°ê±´ê³¼ PetGrow ë° ì´ìš©ìžì˜ ê¶Œë¦¬Â·ì˜ë¬´Â·ì±…ìž„ì‚¬í•­ì„ ì •í•©ë‹ˆë‹¤.",
    contactBtn: "ë¬¸ì˜í•˜ê¸°",
    contactFallback: "ë©”ì¼ ì•±ì´ ì•ˆ ì—´ë¦¬ë©´ help.petgrow@gmail.comìœ¼ë¡œ ì§ì ‘ ë³´ë‚´ì£¼ì„¸ìš”. ê¸°ëŠ¥ ê°œì„  ì œì•ˆì´ë‚˜ ë²„ê·¸ ì œë³´ë„ ì–¸ì œë“  í™˜ì˜ì´ì—ìš”!",
    feedbackBtn: "ê°œì„  ìš”ì²­í•˜ê¸°",
    tipsTitle: "Petì •ë³´",
    nearbyNav: "ë‚´ ì£¼ë³€ Pet",
    nearbyTitle: "ë‚´ ì£¼ë³€ Pet",
    nearbySubtitle: "ê²€ìƒ‰í•œ ì£¼ì†Œ ì£¼ë³€ì˜ ë™ë¬¼ë³‘ì›Â·ë™ë¬¼ì•½êµ­Â·íŽ«ìƒµÂ·ë¯¸ìš©Â·í˜¸í…”ì„ ì°¾ì•„ë³´ê³ , ë‚´ ìœ„ì¹˜ì—ì„œì˜ ê±°ë¦¬ë„ í•¨ê»˜ í™•ì¸í•´ë³´ì„¸ìš”.",
    nearbyLocateBtn: "ë‚´ ìœ„ì¹˜ í‘œì‹œ",
    nearbySearchPlaceholder: "ì§€ì—­ëª…ìœ¼ë¡œ ê²€ìƒ‰ (ì˜ˆ: ê°•ë™êµ¬ ì²œí˜¸ë™)",
    myPetsNav: "ìš°ë¦¬ ì•„ì´",
    petgrowTagline: "ìš°ë¦¬ ì•„ì´ì˜ ê±´ê°•í•œ ì„±ìž¥ì„ í•¨ê»˜",
    badgesTitle: "ì„±ìž¥ ë°°ì§€",
    badgeInfo: {
      record_first: { title: "ì²« ê¸°ë¡", desc: "ì²´ì¤‘ ê¸°ë¡ì„ ì²˜ìŒ ì¶”ê°€í–ˆì–´ìš”" },
      records_3: { title: "ê¸°ë¡ 3íšŒ", desc: "ì²´ì¤‘ ê¸°ë¡ì„ 3ë²ˆ ë‚¨ê²¼ì–´ìš”" },
      records_10: { title: "ê¸°ë¡ 10íšŒ", desc: "ì²´ì¤‘ ê¸°ë¡ì„ 10ë²ˆ ë‚¨ê²¼ì–´ìš”" },
      records_20: { title: "ê¸°ë¡ 20íšŒ", desc: "ì²´ì¤‘ ê¸°ë¡ì„ 20ë²ˆ ë‚¨ê²¼ì–´ìš”" },
      first_photo: { title: "ì²« ì‚¬ì§„", desc: "ì„±ìž¥ì•¨ë²”ì— ì‚¬ì§„ì„ ì²˜ìŒ ë“±ë¡í–ˆì–´ìš”" },
      photos_5: { title: "ì‚¬ì§„ 5ìž¥", desc: "ì„±ìž¥ì•¨ë²”ì— ì‚¬ì§„ 5ìž¥ì„ ëª¨ì•˜ì–´ìš”" },
      photos_10: { title: "ì‚¬ì§„ 10ìž¥", desc: "ì„±ìž¥ì•¨ë²”ì— ì‚¬ì§„ 10ìž¥ì„ ëª¨ì•˜ì–´ìš”" },
      photos_20: { title: "ì‚¬ì§„ 20ìž¥", desc: "ì„±ìž¥ì•¨ë²”ì— ì‚¬ì§„ 20ìž¥ì„ ëª¨ì•˜ì–´ìš”" },
      age_3m: { title: "3ê°œì›” í•¨ê»˜", desc: "ìƒí›„ 3ê°œì›”ì„ í•¨ê»˜í–ˆì–´ìš”" },
      age_6m: { title: "6ê°œì›” í•¨ê»˜", desc: "ìƒí›„ 6ê°œì›”ì„ í•¨ê»˜í–ˆì–´ìš”" },
      one_year: { title: "í•¨ê»˜í•œ 1ë…„", desc: "ë“±ë¡ í›„ 1ë…„(ìƒí›„ 12ê°œì›”)ì„ í•¨ê»˜í–ˆì–´ìš”" },
      vaccine_progress: { title: "ì ‘ì¢… ê´€ë¦¬ ì¤‘", desc: "ì˜ˆë°©ì ‘ì¢… ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ 3ê°œ ì´ìƒ ì²´í¬í–ˆì–´ìš”" },
    },
    badgeNext: (name) => `ë‹¤ìŒ ë°°ì§€: "${name}" â€” ì¡°ê¸ˆë§Œ ë” ê¸°ë¡í•´ë³´ì„¸ìš”!`,
    breedInfoNotice: "í’ˆì¢… íŠ¹ì„±ì€ ì¼ë°˜ì ì¸ ê²½í–¥ì„ ì°¸ê³ ìš©ìœ¼ë¡œ ì •ë¦¬í•œ ê²ƒì´ë©°, ê°œì²´ë§ˆë‹¤ ì°¨ì´ê°€ í´ ìˆ˜ ìžˆì–´ìš”.",
    breedInfoAvgWeight: "í‰ê·  ì„±ì²´ ì²´ì¤‘",
    breedInfoLifespan: "í‰ê·  ìˆ˜ëª…",
    breedInfoActivity: "í™œë™ëŸ‰",
    breedInfoGrooming: "í„¸ ê´€ë¦¬",
    breedInfoBtn: "í’ˆì¢… ì •ë³´ ë³´ê¸°",
    vaccineChecklistTitle: "ì˜ˆë°©ì ‘ì¢… ì²´í¬ë¦¬ìŠ¤íŠ¸",
    vaccineChecklistNote: "ì‹¤ì œ ì ‘ì¢… ì‹œê¸°Â·ì¢…ë¥˜ëŠ” ë°˜ë ¤ë™ë¬¼ê³¼ ì§€ì—­ì— ë”°ë¼ ë‹¤ë¥¼ ìˆ˜ ìžˆì–´ìš”. ì •í™•í•œ ì¼ì •ì€ ë™ë¬¼ë³‘ì›ê³¼ ìƒë‹´í•´ì£¼ì„¸ìš”.",
    vaccineChecklistItems: {
      dog: [
        { age: "ìƒí›„ 6~8ì£¼", label: "ì¢…í•©ë°±ì‹  1ì°¨" },
        { age: "ìƒí›„ 9~11ì£¼", label: "ì¢…í•©ë°±ì‹  2ì°¨" },
        { age: "ìƒí›„ 12~14ì£¼", label: "ì¢…í•©ë°±ì‹  3ì°¨ + ê´‘ê²¬ë³‘ 1ì°¨" },
        { age: "ìƒí›„ 15~17ì£¼", label: "ì¢…í•©ë°±ì‹  4ì°¨" },
        { age: "ìƒí›„ 6ê°œì›” ì „í›„", label: "ì¤‘ì„±í™” ìƒë‹´" },
        { age: "ìƒí›„ 12ê°œì›” ì „í›„", label: "ì¢…í•©ë°±ì‹ Â·ê´‘ê²¬ë³‘ ì—° 1íšŒ ì¶”ê°€ì ‘ì¢…" },
      ],
      cat: [
        { age: "ìƒí›„ 6~8ì£¼", label: "ì¼“íŠ¸ë¦¬í”Œ(FVRCP) 1ì°¨" },
        { age: "ìƒí›„ 9~11ì£¼", label: "ì¼“íŠ¸ë¦¬í”Œ 2ì°¨" },
        { age: "ìƒí›„ 12~14ì£¼", label: "ì¼“íŠ¸ë¦¬í”Œ 3ì°¨ + ë°±í˜ˆë³‘(FeLV)" },
        { age: "ìƒí›„ 6ê°œì›” ì „í›„", label: "ì¤‘ì„±í™” ìƒë‹´" },
        { age: "ìƒí›„ 12ê°œì›” ì „í›„", label: "ì¼“íŠ¸ë¦¬í”Œ ì—° 1íšŒ ì¶”ê°€ì ‘ì¢…" },
      ],
    },
    shareCardTitle: "ì„±ìž¥ ë¦¬í¬íŠ¸ ê³µìœ  ì¹´ë“œ",
    shareCardLoading: "ì¹´ë“œë¥¼ ë§Œë“¤ê³  ìžˆì–´ìš”...",
    shareCardDownload: "ì´ë¯¸ì§€ ì €ìž¥",
    shareCardShare: "ê³µìœ í•˜ê¸°",
    shareCardManualHint: "ì €ìž¥Â·ê³µìœ ê°€ ì•ˆ ë˜ë©´ ì´ë¯¸ì§€ë¥¼ ê¸¸ê²Œ ëˆŒëŸ¬ ì§ì ‘ ì €ìž¥í•´ë³´ì„¸ìš”.",
    shareCardBtn: "ê³µìœ  ì¹´ë“œ ë§Œë“¤ê¸°",
    tipsAria: "ê¿€íŒ ë³´ê¸°",
    tipSearchPlaceholder: "ê¶ê¸ˆí•œ ë‚´ìš©ì„ ê²€ìƒ‰í•´ë³´ì„¸ìš”",
    tipFeaturedTitle: "ì˜¤ëŠ˜ì˜ ì¶”ì²œ",
    tipAllTitle: "ì „ì²´ ê¿€íŒ",
    tipBookmarkedFilter: "ì¦ê²¨ì°¾ê¸°",
    tipBookmarkAria: "ì¦ê²¨ì°¾ê¸° ì¶”ê°€/í•´ì œ",
    tipEmptyResult: "ì¡°ê±´ì— ë§žëŠ” ê¿€íŒì´ ì—†ì–´ìš”.",
    optional: "ì„ íƒ",
    sajuNav: "Petì‚¬ì£¼",
    petBtiNav: "PetBTI",
    petBtiMainTitle: "ìš°ë¦¬ ì•„ì´ëŠ” ì–´ë–¤ ì„±ê²©ì¼ê¹Œ?",
    petBtiMainDesc: "í‰ì†Œ í–‰ë™ ëª‡ ê°€ì§€ë§Œ ì•Œë ¤ì£¼ì„¸ìš”.\nPetGrowê°€ ìš°ë¦¬ ì•„ì´ì˜ ì„±ê²© ìœ í˜•ì„ ì°¾ì•„ë“œë¦´ê²Œìš” ðŸ¶ðŸ’•",
    petBtiStartBtn: "PetBTI ì‹œìž‘í•˜ê¸° ðŸ¾",
    petBtiRestartBtn: "ë‹¤ì‹œ í…ŒìŠ¤íŠ¸í•˜ê¸°",
    petBtiNoPet: "ë¨¼ì € 'ìš°ë¦¬ ì•„ì´'ì— ë°˜ë ¤ë™ë¬¼ì„ ë“±ë¡í•´ì£¼ì„¸ìš”.",
    petBtiPreviousResult: (name) => `${name}ì˜ ì €ìž¥ëœ PetBTI`,
    petBtiResultHeading: (name) => `${name}ì˜ PetBTIëŠ”?`,
    petBtiStatsTitle: "PetBTI ëŠ¥ë ¥ì¹˜",
    petBtiStatAffection: "ì• êµë ¥", petBtiStatCuriosity: "í˜¸ê¸°ì‹¬", petBtiStatFood: "ë¨¹ë°©ë ¥",
    petBtiStatSocial: "ì¹œí™”ë ¥", petBtiStatControl: "ì§‘ì‚¬ì¡°ì¢…ë ¥",
    petBtiSectionTitle: {
      personality: "ê¸°ë³¸ ì„±ê²©", bond: "ë³´í˜¸ìžì™€ì˜ ê´€ê³„", friends: "ì¹œêµ¬ ê´€ê³„", play: "ë†€ì´ ìŠ¤íƒ€ì¼", walk: "ì‚°ì±… ìŠ¤íƒ€ì¼",
      food: "ê°„ì‹ ì•žì—ì„œëŠ”?", alone: "í˜¼ìž ìžˆì„ ë•Œ", mischief: "ì‚¬ê³ ë­‰ì¹˜ ëª¨ë¨¼íŠ¸", affection: "ì• ì • í‘œí˜„ë²•", hidden: "ìˆ¨ê²¨ì§„ ë§¤ë ¥",
    },
    petBtiOneWordTitle: (name) => `${name}ë¥¼ í•œë§ˆë””ë¡œ í‘œí˜„í•˜ë©´?`,
    petBtiCompatTitle: (name) => `ðŸ’• ${name}ì™€ ìž˜ ë§žëŠ” ì¹œêµ¬`,
    petBtiCompatGood: (name) => `${name}ì—ê²Œ ì—†ëŠ” ë§¤ë ¥ì„ ê°€ì§„ ìƒëŒ€ë¼, ì„œë¡œ ë‹¤ë¥¸ ì ì´ ì˜¤ížˆë ¤ ì¢‹ì€ ì¼€ë¯¸ê°€ ë  ìˆ˜ ìžˆì–´ìš”. í•¨ê»˜ ìžˆìœ¼ë©´ ì„œë¡œì˜ ë¶€ì¡±í•œ ë¶€ë¶„ì„ ìžì—°ìŠ¤ëŸ½ê²Œ ì±„ì›Œì¤„ ê°€ëŠ¥ì„±ì´ ë†’ì•„ìš”.`,
    petBtiCompatChaosTitle: "ë§Œë‚˜ë©´ ì •ì‹ ì—†ëŠ” ì¡°í•©",
    petBtiCompatChaos: (name) => `${name}ì™€ ì„±í–¥ì´ ì•„ì£¼ ë¹„ìŠ·í•œ ì¹œêµ¬ì˜ˆìš”. ë§Œë‚˜ë©´ ë‘˜ ë‹¤ ì‹ ë‚˜ì„œ ì •ì‹ ì—†ì´ ë†€ ìˆ˜ë„ ìžˆì–´ìš” â€” ë‚˜ì˜ë‹¤ëŠ” ê²Œ ì•„ë‹ˆë¼ ê·¸ë§Œí¼ í…ì…˜ì´ ë‘ ë°°ê°€ ëœë‹¤ëŠ” ëœ»ì´ì—ìš” ðŸ˜†`,
    petBtiShareBtn: "ë‚´ PetBTI ê³µìœ í•˜ê¸° ðŸ¾",
    petBtiShareTitle: "PetBTI ì¹´ë“œ ê³µìœ ",
    petBtiShareHeading: (name) => `${name}ì˜ PetBTI`,
    petBtiDisclaimer: "ìž¬ë¯¸ë¡œ ì•Œì•„ë³´ëŠ” PetGrow ë°˜ë ¤ë™ë¬¼ ì„±ê²© í…ŒìŠ¤íŠ¸ì˜ˆìš”. í–‰ë™í•™ì Â·ì˜í•™ì  ì§„ë‹¨ì„ ëŒ€ì‹ í•˜ì§€ ì•Šì•„ìš”.",
    sajuFormTitle: "ìš°ë¦¬ ì•„ì´ ì‚¬ì£¼ ðŸ¾",
    sajuFormSub: "ì •ë³´ë¥¼ ìž…ë ¥í•˜ë©´ ìž¬ë¯¸ë¡œ ë³´ëŠ” ìš°ë¦¬ ì•„ì´ ìš´ëª…ì„ ì•Œë ¤ë“œë ¤ìš”.",
    sajuNameLabel: "ì´ë¦„",
    sajuNamePlaceholder: "ëª½ì¹˜",
    sajuSpeciesLabel: "ê°•ì•„ì§€ / ê³ ì–‘ì´",
    sajuBirthLabel: "ìƒë…„ì›”ì¼",
    sajuGenderLabel: "ì„±ë³„",
    sajuTimeLabel: "íƒœì–´ë‚œ ì‹œê°„",
    sajuBreedLabel: "í’ˆì¢…",
    sajuBreedPlaceholder: "ë§í‹°ì¦ˆ",
    sajuGenerateBtn: "ìš°ë¦¬ ì•„ì´ ìš´ëª… ì•Œì•„ë³´ê¸° ðŸ¾",
    sajuErrName: "ì´ë¦„ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    sajuErrBirth: "ìƒë…„ì›”ì¼ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    sajuIntroTitle: (name) => `${name}ì˜ ì‚¬ì£¼ë¥¼ ë³¼ê¹Œìš”?`,
    sajuNeedPetTitle: "ë“±ë¡ëœ ì•„ì´ê°€ ì•„ì§ ì—†ì–´ìš”",
    sajuNeedPetBody: "Petì‚¬ì£¼ëŠ” 'ìš°ë¦¬ ì•„ì´'ì— ë“±ë¡í•œ ë°˜ë ¤ë™ë¬¼ë§Œ ë³¼ ìˆ˜ ìžˆì–´ìš”. ë¨¼ì € ë°˜ë ¤ë™ë¬¼ì„ ë“±ë¡í•´ì£¼ì„¸ìš”.",
    sajuGoRegisterBtn: "ìš°ë¦¬ ì•„ì´ ë“±ë¡í•˜ëŸ¬ ê°€ê¸°",
    sajuIntroSub: "ë“±ë¡ëœ ì •ë³´ë¡œ ë°”ë¡œ ê²°ê³¼ë¥¼ ë³¼ ìˆ˜ ìžˆì–´ìš”.",
    sajuUseOtherInfo: "ë‹¤ë¥¸ ì •ë³´ë¡œ ë³´ê¸°",
    sajuResultHeading: (name) => `${name}ì˜ íƒ€ê³ ë‚œ ìš´ëª…`,
    sajuCategoryTitle: {
      personality: "íƒ€ê³ ë‚œ ì„±ê²©", bond: "ë³´í˜¸ìžì™€ì˜ ì¸ì—°", friends: "ì¹œêµ¬ ê´€ê³„", food: "ë¨¹ì„ ë³µ",
      play: "ë†€ì´Â·ì‚°ì±… ìŠ¤íƒ€ì¼", affection: "ì• êµ ìŠ¤íƒ€ì¼", mischief: "ì‚¬ê³ ë­‰ì¹˜ ì§€ìˆ˜", luck: "íƒ€ê³ ë‚œ ë³µ",
    },
    sajuOneWordTitle: (name) => `${name}ë¥¼ í•œë§ˆë””ë¡œ í‘œí˜„í•˜ë©´?`,
    sajuTodayTitle: "ì˜¤ëŠ˜ì˜ í•œë§ˆë””",
    sajuShareBtn: "ìš°ë¦¬ ì•„ì´ ì‚¬ì£¼ ê³µìœ í•˜ê¸°",
    sajuShareTitle: "ì‚¬ì£¼ ì¹´ë“œ ê³µìœ ",
    sajuShareHeading: (name) => `${name}ì˜ íƒ€ê³ ë‚œ ìš´ëª…`,
    sajuComingCompat: "ë³´í˜¸ìžì™€ ê¶í•© ë³´ê¸°",
    sajuComingDaily: "ì˜¤ëŠ˜ì˜ ìš´ì„¸ ë³´ê¸°",
    sajuComingSoon: "ê³§ ë§Œë‚˜ìš”! ì¤€ë¹„ ì¤‘ì´ì—ìš”",
    sajuRestartBtn: "ë‹¤ì‹œ ë³´ê¸°",
    sajuDisclaimer: "ìž¬ë¯¸ë¡œ ë³´ëŠ” PetGrow ì½˜í…ì¸ ì˜ˆìš” ðŸ¾ ì‹¤ì œ ì„±ê²©ì´ë‚˜ ë¯¸ëž˜ë¥¼ íŒë‹¨í•˜ëŠ” ìžë£Œê°€ ì•„ë‹ˆì—ìš”.",
    tipCategoryLabels: { all: "ì „ì²´ë³´ê¸°", dog: "ê°•ì•„ì§€", cat: "ê³ ì–‘ì´", health: "ê±´ê°•", life: "ìƒí™œ", food: "ì‹ë‹¨Â·ì˜ì–‘", training: "í›ˆë ¨", safety: "ì•ˆì „", grooming: "ë¯¸ìš©Â·ìœ„ìƒ" },
    privacyFooterLink: "ê°œì¸ì •ë³´ì²˜ë¦¬ë°©ì¹¨",
    guideSections: [
      { title: "1. ì•„ì´ ë“±ë¡í•˜ê¸°", body: "ì´ë¦„Â·í’ˆì¢…Â·ìƒë…„ì›”ì¼Â·í˜„ìž¬ ì²´ì¤‘ì„ ìž…ë ¥í•˜ë©´ ì˜ˆìƒ ì„±ì²´ ì²´ì¤‘ê³¼ ì„±ìž¥ ê·¸ëž˜í”„ê°€ ë°”ë¡œ ë‚˜ì™€ìš”. ëŒ€í‘œ ì‚¬ì§„ë„ ë“±ë¡í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "2. ì„±ìž¥ ê¸°ë¡", body: "ì²´ì¤‘ì„ ìž° ë‚ ì§œì™€ í•¨ê»˜ ë‚¨ê¸°ë©´, ì˜ˆìƒë³´ë‹¤ ë¹ ë¥´ê²Œ í¬ëŠ”ì§€ ëŠë¦¬ê²Œ í¬ëŠ”ì§€ ìžë™ìœ¼ë¡œ ë¹„êµí•´ì¤˜ìš”." },
      { title: "3. ì„±ìž¥ì•¨ë²”", body: "ì‚¬ì§„ê³¼ ì´¬ì˜ì¼ì„ ì–¸ì œë“  ì¶”ê°€í•  ìˆ˜ ìžˆì–´ìš”. ì›”ë ¹ë³„ë¡œ ì •ë¦¬ë¼ì„œ ì„±ìž¥ ê³¼ì •ì„ í•œëˆˆì— ë³¼ ìˆ˜ ìžˆê³ , ìŠ¬ë¼ì´ë“œì‡¼ë¡œë„ ë³¼ ìˆ˜ ìžˆì–´ìš”." },
      { title: "4. ë˜ëž˜ ë¹„êµ Â· ì°¸ê³  ì •ë³´", body: "ë¹„ìŠ·í•œ ë˜ëž˜ì™€ ë¹„êµí•˜ê±°ë‚˜ ì‚¬ë£ŒëŸ‰Â·ì˜ˆë°©ì ‘ì¢… ì‹œê¸° ê°™ì€ ì°¸ê³  ì •ë³´ë¥¼ í™•ì¸í•´ë³´ì„¸ìš”. í™•ì • ìˆ˜ì¹˜ê°€ ì•„ë‹ˆë‹ˆ ë³‘ì› ìƒë‹´ì€ ê¼­ í•¨ê»˜ í•´ì£¼ì„¸ìš”." },
      { title: "5. ì„±ìž¥ ë°°ì§€ Â· ì˜ˆë°©ì ‘ì¢… ì²´í¬ë¦¬ìŠ¤íŠ¸", body: "ê¸°ë¡Â·ì‚¬ì§„ì„ ë‚¨ê¸¸ìˆ˜ë¡ ë°°ì§€ê°€ í•˜ë‚˜ì”© ì±„ì›Œì ¸ìš”. ì˜ˆë°©ì ‘ì¢… ì¼ì •ì€ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¡œ ì§ì ‘ ì²´í¬í•˜ë©° ê´€ë¦¬í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "6. í’ˆì¢… ì •ë³´ Â· ê³µìœ  ì¹´ë“œ", body: "ì´ë¦„ ì•„ëž˜ í’ˆì¢…ì„ ëˆ„ë¥´ë©´ í’ˆì¢…ë³„ ì°¸ê³  ì •ë³´ê°€ ëœ¨ê³ , ì˜ˆì¸¡ ê²°ê³¼ ìœ„ ë²„íŠ¼ìœ¼ë¡œ ì˜ˆìœ ê³µìœ  ì¹´ë“œ ì´ë¯¸ì§€ë¥¼ ë§Œë“¤ì–´ SNSì— ê³µìœ í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "7. ê¿€íŒ", body: "í—¤ë”ì˜ 'ê¿€íŒ' ë²„íŠ¼ì„ ëˆ„ë¥´ë©´ ê±´ê°•Â·ìƒí™œ ê¿€íŒì„ ê²€ìƒ‰í•˜ê³  ì¦ê²¨ì°¾ê¸°í•  ìˆ˜ ìžˆì–´ìš”. ì˜¤ëŠ˜ì˜ ì¶”ì²œì€ ë§¤ì¼ ìžë™ìœ¼ë¡œ ë°”ë€Œì–´ìš”." },
      { title: "8. ì—¬ëŸ¬ ë§ˆë¦¬ ê´€ë¦¬", body: "ìƒë‹¨ íƒ­ì—ì„œ ê°•ì•„ì§€Â·ê³ ì–‘ì´ë¥¼ ë‚˜ëˆ„ê³ , ì´ë¦„ ì¹©ì„ ëˆŒëŸ¬ ìµœëŒ€ 10ë§ˆë¦¬ê¹Œì§€ ê°ìž ë”°ë¡œ ê´€ë¦¬í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "9. ì„±ìž¥ ê·¸ëž˜í”„ ì½ëŠ” ë²•", body: "ë¹¨ê°„ ì ì´ ìš°ë¦¬ ì•„ì´ì˜ í˜„ìž¬ ìœ„ì¹˜ì˜ˆìš”. ì—°ë‘ìƒ‰ ë°´ë“œëŠ” ì°¸ê³ ìš© ì •ìƒ ë²”ìœ„(ì˜ˆìƒì¹˜ì˜ Â±15%)ì´ê³ , ì´ ë²”ìœ„ë¥¼ ë²—ì–´ë‚˜ë©´ ê·¸ëž˜í”„ì— ì„¸ë¡œì„ ê³¼ ê²½ê³  ë¬¸êµ¬ê°€ í•¨ê»˜ ë– ìš”." },
    ],
    infoGuideTitle: "ì •ë³´ê°€ì´ë“œ",
    infoGuideIntro: "PetGrowì˜ ì£¼ìš” ë©”ë‰´ì™€ ê¸°ëŠ¥ì„ ì‹¤ì œ í™”ë©´ íë¦„ì— ë§žì¶° í•œê³³ì— ì •ë¦¬í–ˆì–´ìš”.",
    infoGuideSections: [
      { title: "í™ˆ Â· ì•± ëŒ€ì‹œë³´ë“œ", body: "í™ˆì—ì„œëŠ” ìš°ë¦¬ ì•„ì´, PetìŒì•…, ë‚´ ì£¼ë³€ Pet, Petí†¡, PetBTI ê°™ì€ ìžì£¼ ì“°ëŠ” ê¸°ëŠ¥ìœ¼ë¡œ ë¹ ë¥´ê²Œ ì´ë™í•  ìˆ˜ ìžˆì–´ìš”. ì›¹Â·ëª¨ë°”ì¼Â·ì•± í™”ë©´ í¬ê¸°ì— ë§žì¶° ë©”ë‰´ êµ¬ì„±ì´ ìžë™ìœ¼ë¡œ ì •ë¦¬ë¼ìš”." },
      { title: "ì¹´ì¹´ì˜¤ ê°„íŽ¸ë¡œê·¸ì¸", body: "PetGrowëŠ” ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•´ìš”. ë³„ë„ ë¹„ë°€ë²ˆí˜¸ë¥¼ ë§Œë“¤ì§€ ì•Šê³  'ì¹´ì¹´ì˜¤ë¡œ ì‹œìž‘í•˜ê¸°'ë¡œ ì´ìš©í•  ìˆ˜ ìžˆìœ¼ë©°, ë¡œê·¸ì¸í•œ ê³„ì • ê¸°ì¤€ìœ¼ë¡œ ì €ìž¥ ê¸°ëŠ¥ê³¼ ë‚´ í™œë™ì´ ì—°ê²°ë¼ìš”." },
      { title: "ìš°ë¦¬ ì•„ì´ Â· ì„±ìž¥ ê¸°ë¡", body: "ê°•ì•„ì§€ì™€ ê³ ì–‘ì´ë¥¼ ì—¬ëŸ¬ ë§ˆë¦¬ ë“±ë¡í•˜ê³  ì•„ì´ë³„ í”„ë¡œí•„, í˜„ìž¬ ì²´ì¤‘, ì„±ìž¥ ê¸°ë¡, ì„±ìž¥ ê·¸ëž˜í”„ì™€ ì„±ìž¥ì•¨ë²”ì„ ê´€ë¦¬í•  ìˆ˜ ìžˆì–´ìš”. ë‹¤ë¥¸ ê¸°ê¸°ì—ì„œë„ ê°™ì€ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•˜ë©´ ì €ìž¥ëœ ì •ë³´ë¥¼ ì´ì–´ì„œ ë³¼ ìˆ˜ ìžˆì–´ìš”." },
      { title: "PetBTI", body: "ê°•ì•„ì§€ì™€ ê³ ì–‘ì´ ê°ê° 20ê°œì˜ êµ¬ì²´ì ì¸ í–‰ë™ ì§ˆë¬¸ì— ë‹µí•˜ë©´ ìš°ë¦¬ ì•„ì´ì˜ ì„±í–¥ì„ 16ê°€ì§€ ìœ í˜•ìœ¼ë¡œ ìž¬ë¯¸ìžˆê²Œ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”. ì™„ë£Œí•œ ê²°ê³¼ëŠ” ì €ìž¥í•˜ê³  ë‹¤ì‹œ ê²€ì‚¬í•  ìˆ˜ë„ ìžˆì–´ìš”." },
      { title: "Petì‚¬ì£¼", body: "ë“±ë¡í•œ ìš°ë¦¬ ì•„ì´ ì •ë³´ë¥¼ ë°”íƒ•ìœ¼ë¡œ ê¸°ë³¸ Petì‚¬ì£¼, ì˜¤ëŠ˜ì˜ íŽ«ìš´ì„¸, ë³´í˜¸ìž ê¶í•©ì„ ìž¬ë¯¸ë¡œ ì¦ê¸¸ ìˆ˜ ìžˆì–´ìš”. Petíƒ€ë¡œëŠ” ë©”ì´ì € ì•„ë¥´ì¹´ë‚˜ 22ìž¥ì˜ ì „í†µì ì¸ ìƒì§•ì„ PetGrowì‹ ë°˜ë ¤ìƒí™œ ë©”ì‹œì§€ë¡œ ìž¬í•´ì„í•˜ë©°, ê° ì£¼ì œë³„ë¡œ ë°˜ë ¤ë™ë¬¼ 1ë§ˆë¦¬ë‹¹ í•˜ë£¨ 1íšŒë§Œ ë½‘ì„ ìˆ˜ ìžˆì–´ìš”. ì‹¤ì œ ì„±ê²©ì´ë‚˜ ë¯¸ëž˜ë¥¼ íŒë‹¨í•˜ëŠ” ìžë£ŒëŠ” ì•„ë‹ˆì—ìš”." },
      { title: "Petì •ë³´", body: "ê°•ì•„ì§€Â·ê³ ì–‘ì´Â·ê±´ê°•Â·ìƒí™œÂ·ì‹ë‹¨Â·ì˜ì–‘Â·í›ˆë ¨Â·ì•ˆì „Â·ë¯¸ìš©Â·ìœ„ìƒ ë“± ì¹´í…Œê³ ë¦¬ë³„ ë°˜ë ¤ìƒí™œ ì •ë³´ë¥¼ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”. ëª©ë¡ì€ íŽ˜ì´ì§€ ë‹¨ìœ„ë¡œ ë‚˜ë‰˜ê³  ê²€ìƒ‰ê³¼ ì¦ê²¨ì°¾ê¸°ë¥¼ ì´ìš©í•  ìˆ˜ ìžˆìœ¼ë©°, ì •ë³´ëŠ” ì§€ì†ì ìœ¼ë¡œ ì¶”ê°€Â·ì ê²€ë¼ìš”." },
      { title: "PetìŒì•…", body: "ê°•ì•„ì§€Â·ê³ ì–‘ì´ ìŒì•…ì„ ìž¬ìƒí•˜ê³  ë°˜ë³µìž¬ìƒí•  ìˆ˜ ìžˆì–´ìš”. ì¸ê¸° TOP5ì™€ ë‚´ê°€ ì¢‹ì•„ìš” ëˆ„ë¥¸ ìŒì•…ì„ ë”°ë¡œ í™•ì¸í•  ìˆ˜ ìžˆê³ , ì¢‹ì•„ìš”Â·ëŒ“ê¸€ì„ ì´ìš©í•  ìˆ˜ ìžˆì–´ìš”. ë³¸ì¸ ëŒ“ê¸€ì€ ìˆ˜ì •Â·ì‚­ì œí•  ìˆ˜ ìžˆê³  ë‹¤ë¥¸ ì´ìš©ìžì˜ ëŒ“ê¸€ì€ ì‹ ê³ í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "ë‚´ ì£¼ë³€ Pet", body: "ì£¼ì†Œë¥¼ ì§ì ‘ ìž…ë ¥í•´ ê²€ìƒ‰í•˜ê±°ë‚˜, ìœ„ì¹˜ ê¶Œí•œì„ í—ˆìš©í•´ í˜„ìž¬ ìœ„ì¹˜ ì£¼ë³€ì˜ ë™ë¬¼ë³‘ì›Â·ë™ë¬¼ì•½êµ­Â·íŽ«ìƒµÂ·ìš©í’ˆì Â·ë¯¸ìš©ì‹¤Â·ìœ ì¹˜ì›Â·í˜¸í…” ë“±ì„ ì°¾ì„ ìˆ˜ ìžˆì–´ìš”. í˜„ìž¬ ìœ„ì¹˜ëŠ” ì´ìš©ìžê°€ í˜„ìž¬ ìœ„ì¹˜ ê²€ìƒ‰ ë˜ëŠ” ì§€ë„ í‘œì‹œë¥¼ ì‚¬ìš©í•  ë•Œ ì£¼ë³€ ê²€ìƒ‰Â·ê±°ë¦¬ ê³„ì‚°Â·ì§€ë„ í‘œì‹œì— ì¼ì‹œì ìœ¼ë¡œ ì‚¬ìš©í•˜ë©° ê³„ì •ì— ì €ìž¥í•˜ì§€ ì•Šì•„ìš”. ë¡œê·¸ì¸ íšŒì›ì€ ë³„ì Â·í›„ê¸°Â·ì¢‹ì•„ìš”ë¥¼ ë‚¨ê¸¸ ìˆ˜ ìžˆê³  ë³¸ì¸ í›„ê¸°ëŠ” ìˆ˜ì •Â·ì‚­ì œ, ë‹¤ë¥¸ í›„ê¸°ëŠ” ì‹ ê³ í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "Petí†¡", body: "ì¼ìƒÂ·ìžëž‘Â·ì§ˆë¬¸Â·ê±´ê°•Â·ì •ë³´ê³µìœ Â·ì‚°ì±…Â·í›ˆë ¨Â·ìš©í’ˆì¶”ì²œÂ·ìžìœ ìˆ˜ë‹¤ ì¹´í…Œê³ ë¦¬ë¡œ ë°˜ë ¤ìƒí™œ ì´ì•¼ê¸°ë¥¼ ë‚˜ëˆ„ëŠ” ì»¤ë®¤ë‹ˆí‹°ì˜ˆìš”. ê²Œì‹œê¸€ê³¼ ëŒ“ê¸€ì— ì¢‹ì•„ìš”ë¥¼ ë‚¨ê¸¸ ìˆ˜ ìžˆê³ , ë³¸ì¸ì´ ìž‘ì„±í•œ ê¸€Â·ëŒ“ê¸€ì€ ìˆ˜ì •Â·ì‚­ì œ, ë‹¤ë¥¸ ì´ìš©ìžì˜ ê¸€Â·ëŒ“ê¸€ì€ ì‹ ê³ í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "íšŒì›ì •ë³´ Â· ë‚´ í™œë™", body: "ë‹‰ë„¤ìž„ê³¼ ê³„ì • ì •ë³´ë¥¼ ê´€ë¦¬í•˜ê³ , ë‚´ê°€ ìž‘ì„±í•œ Petí†¡ í™œë™ê³¼ ë‚´ê°€ ì¢‹ì•„ìš” ëˆ„ë¥¸ PetìŒì•… ë“± ê³„ì • ê¸°ì¤€ í™œë™ì„ í•œê³³ì—ì„œ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "ê³ ê°ì§€ì›", body: "ê³µì§€ì‚¬í•­, ê³µê°œ í”¼ë“œë°±, ë‚´ ë¬¸ì˜, ë¬¸ì˜í•˜ê¸°ë¥¼ ì´ìš©í•  ìˆ˜ ìžˆì–´ìš”. ë¬¸ì˜ ê³µê°œ ì²´í¬ë¥¼ í•´ì œí•˜ë©´ ìš´ì˜ì§„ë§Œ ë³¼ ìˆ˜ ìžˆì–´ìš”." },
      { title: "ê´€ë¦¬ìžì„¼í„°", body: "ê´€ë¦¬ìž ê¶Œí•œì´ ìžˆëŠ” ê³„ì •ì—ë§Œ í‘œì‹œë¼ìš”. ë©”ë‰´ ì´ìš© í†µê³„, ì›¹Â·ëª¨ë°”ì¼ ì›¹Â·PWAÂ·ì•± ì ‘ì† í†µê³„, ì‹ ê³  ê´€ë¦¬, PetìŒì•… ê´€ë¦¬, ì¼ì¼Â·ì£¼ê°„Â·ì›”ê°„ ë³´ê³ ì„œ ë“± ìš´ì˜ ê¸°ëŠ¥ì„ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”." },
      { title: "ë¡œê·¸ì•„ì›ƒ Â· íšŒì›íƒˆí‡´", body: "ë¡œê·¸ì•„ì›ƒí•´ë„ ì„œë²„ì— ì €ìž¥ëœ ê³„ì • ì •ë³´ëŠ” ìœ ì§€ë¼ìš”. íšŒì›íƒˆí‡´ë¥¼ ì§„í–‰í•˜ë©´ ê´€ê³„ ë²•ë ¹ì— ë”°ë¼ ë³„ë„ ë³´ê´€í•´ì•¼ í•˜ëŠ” ì •ë³´ë¥¼ ì œì™¸í•˜ê³  ê³„ì •ì— ì—°ê²°ëœ ë°˜ë ¤ë™ë¬¼ ì •ë³´, ì €ìž¥ ê²°ê³¼, ìž‘ì„± ì½˜í…ì¸  ë“± ì‚­ì œ ëŒ€ìƒ ë°ì´í„°ê°€ ì²˜ë¦¬ë˜ë©° ë³µêµ¬í•  ìˆ˜ ì—†ì–´ìš”." },
    ],
    migrationTitle: "ê¸°ì¡´ì— ë“±ë¡í•œ ìš°ë¦¬ ì•„ì´ ì •ë³´ê°€ ìžˆì–´ìš” ðŸ¾",
    migrationBody: "ì´ ì •ë³´ë¥¼ ë‚´ PetGrow ê³„ì •ì— ì €ìž¥í• ê¹Œìš”? ì €ìž¥í•˜ë©´ ë‹¤ë¥¸ ê¸°ê¸°ì—ì„œë„ ë¡œê·¸ì¸ë§Œ í•˜ë©´ ì´ì–´ì„œ ë³¼ ìˆ˜ ìžˆì–´ìš”.",
    migrationLater: "ë‚˜ì¤‘ì—",
    migrationConfirm: "ë‚´ ê³„ì •ì— ì €ìž¥í•˜ê¸°",
    migrationSaving: "ì €ìž¥ ì¤‘...",
    deleteAccountPageTitle: "íšŒì›íƒˆí‡´",
    deleteAccountPageBody: "íšŒì›íƒˆí‡´ë¥¼ ì§„í–‰í•˜ë©´ ê´€ê³„ ë²•ë ¹ì— ë”°ë¼ ë³„ë„ë¡œ ë³´ê´€í•´ì•¼ í•˜ëŠ” ì •ë³´ë¥¼ ì œì™¸í•˜ê³  ì•„ëž˜ ë°ì´í„°ê°€ ì‚­ì œë˜ë©°, ì‚­ì œ í›„ì—ëŠ” ë³µêµ¬í•  ìˆ˜ ì—†ì–´ìš”.",
    deleteAccountItems: [
      "PetGrow ê³„ì • ë° ì¹´ì¹´ì˜¤ ì¸ì¦ ì—°ë™ ì •ë³´",
      "ë“±ë¡í•œ ë°˜ë ¤ë™ë¬¼ ì •ë³´ì™€ í”„ë¡œí•„ ì‚¬ì§„",
      "ì„±ìž¥ ê¸°ë¡ ë“± ì €ìž¥ëœ ë°ì´í„°",
      "PetBTI ê²°ê³¼",
      "Petí†¡ì— ìž‘ì„±í•œ ê²Œì‹œê¸€Â·ëŒ“ê¸€Â·ì¢‹ì•„ìš” ê¸°ë¡ ë° ì²¨ë¶€ ì‚¬ì§„",
      "ê¸°íƒ€ ê³„ì •ì— ì—°ê²°ëœ ì €ìž¥ ì •ë³´ ë° ë¡œê·¸ì¸ ì„¸ì…˜",
    ],
    deleteAccountLoggedInAs: (name) => `í˜„ìž¬ ${name} ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸ë˜ì–´ ìžˆì–´ìš”.`,
    deleteAccountNeedLogin: "íšŒì›íƒˆí‡´ë¥¼ ì§„í–‰í•˜ë ¤ë©´ ë¨¼ì € ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•´ì£¼ì„¸ìš”.",
    deleteAccountEmailFallback: "ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•  ìˆ˜ ì—†ëŠ” ê²½ìš° help.petgrow@gmail.com ìœ¼ë¡œ ë¬¸ì˜í•´ì£¼ì‹œë©´ í™•ì¸ í›„ ì²˜ë¦¬í•´ë“œë¦´ê²Œìš”.",
    deleteAccountConfirmTitle: "ì •ë§ íƒˆí‡´í•˜ì‹œê² ì–´ìš”?",
    deleteAccountConfirmBody: "íƒˆí‡´í•˜ë©´ PetGrow ê³„ì •, ë°˜ë ¤ë™ë¬¼ ì •ë³´Â·í”„ë¡œí•„ ì‚¬ì§„, ì„±ìž¥ ê¸°ë¡, PetBTI ê²°ê³¼, Petí†¡ ê²Œì‹œê¸€Â·ëŒ“ê¸€Â·ì¢‹ì•„ìš” ë° ì²¨ë¶€ ì‚¬ì§„ ë“± ê³„ì •ì— ì—°ê²°ëœ ë°ì´í„°ê°€ ì‚­ì œë˜ë©° ë³µêµ¬í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤. ì •ë§ íšŒì›íƒˆí‡´ë¥¼ ì§„í–‰í•˜ì‹œê² ì–´ìš”?",
    deleteAccountDoneTitle: "íƒˆí‡´ê°€ ì™„ë£Œëì–´ìš”",
    deleteAccountDoneBody: "ê·¸ë™ì•ˆ PetGrowë¥¼ ì´ìš©í•´ì£¼ì…”ì„œ ê°ì‚¬í•´ìš”. ê³„ì •ê³¼ ê´€ë ¨ ì •ë³´ê°€ ëª¨ë‘ ì‚­ì œëì–´ìš”.",
    speciesLabel: { dog: "ê°•ì•„ì§€", cat: "ê³ ì–‘ì´" },
    adultWord: { dog: "ì„±ê²¬", cat: "ì„±ë¬˜" },
    otherLabel: { dog: "ê²¬ì¢…", cat: "ë¬˜ì¢…" },
    mixLabel: { dog: "ë¯¹ìŠ¤ê²¬ (ë¶€ëª¨ê²¬ ê¸°ë°˜)", cat: "ë¯¹ìŠ¤ë¬˜ (í’ˆì¢… ë¯¸ìƒ)" },
    customLabel: (otherLabel) => `ëª©ë¡ì— ì—†ëŠ” ${otherLabel} (ì§ì ‘ ìž…ë ¥)`,
    searchPlaceholder: (otherLabel, example) => `${otherLabel} ê²€ìƒ‰ (ì˜ˆ: ${example})`,
    searchExample: { dog: "ë§í‹°ì¦ˆ", cat: "ì½”ë¦¬ì•ˆìˆí—¤ì–´" },
    otherGroupLabel: "ê¸°íƒ€",
    noResultsText: (customLabel) => `ê²€ìƒ‰ ê²°ê³¼ê°€ ì—†ì–´ìš”. "${customLabel}"ë¥¼ ì„ íƒí•´ë³´ì„¸ìš”.`,
    introEdit: (nameOrLabel) => `${nameOrLabel}ì˜ ì •ë³´ë¥¼ ìˆ˜ì •í•´ìš”.`,
    introNew: (speciesLabel, adultWord) => `ìš°ë¦¬ ${speciesLabel}, ë‹¤ í¬ë©´ ì–¼ë§ˆë‚˜ ë ê¹Œ? ê¸°ë³¸ ì •ë³´ë§Œ ìž…ë ¥í•˜ë©´ ì˜ˆìƒ ${adultWord} ì²´ì¤‘ê³¼ ì„±ìž¥ ê³¡ì„ ì„ ë°”ë¡œ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”.`,
    formAlertMissing: "ìž…ë ¥ì´ ëˆ„ë½ëœ í•­ëª©ì´ ìžˆì–´ìš”. ì•„ëž˜ í‘œì‹œëœ í•­ëª©ì„ ì±„ì›Œì£¼ì„¸ìš”.",
    errName: "ì´ë¦„ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    errBirthDate: "ìƒë…„ì›”ì¼ì„ ì„ íƒí•´ì£¼ì„¸ìš”",
    errWeight: "í˜„ìž¬ ì²´ì¤‘ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    errCustomBreed: (otherLabel) => `${otherLabel} ì´ë¦„ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”`,
    labelPetName: (speciesLabel) => `${speciesLabel} ì´ë¦„`,
    labelProfileImage: "ëŒ€í‘œ ì‚¬ì§„ (ì„ íƒ)",
    profileImagePickBtn: "ì‚¬ì§„ ì„ íƒ",
    profileImageRemoveBtn: "ì‚­ì œ",
    profileHeaderBirth: (dateText) => `${dateText}ìƒ`,
    placeholderPetName: { dog: "ì˜ˆ: ë­‰ì¹˜", cat: "ì˜ˆ: ë‚˜ë¹„" },
    defaultPetName: { dog: "ë­‰ì¹˜", cat: "ë‚˜ë¹„" },
    labelBreedField: (otherLabel) => otherLabel,
    customBreedPlaceholder: (otherLabel) => `${otherLabel} ì´ë¦„ì„ ìž…ë ¥í•´ ì£¼ì„¸ìš”`,
    sizeCategoryPrompt: "ê°€ìž¥ ê°€ê¹Œìš´ ì„±ì²´ í¬ê¸°ë¥¼ ê³¨ë¼ì£¼ì„¸ìš”",
    labelBirthDate: "ìƒë…„ì›”ì¼",
    labelWeight: "í˜„ìž¬ ì²´ì¤‘ (kg)",
    placeholderWeight: { dog: "ì˜ˆ: 1.1", cat: "ì˜ˆ: 0.6" },
    labelGender: "ì„±ë³„",
    genderFemale: "ì—¬ì•„",
    genderMale: "ë‚¨ì•„",
    labelNeutered: "ì¤‘ì„±í™” ì—¬ë¶€",
    neuteredNo: "ì•ˆ í•¨",
    neuteredYes: "ì™„ë£Œ",
    labelBodyCondition: "í˜„ìž¬ ì²´í˜•",
    submitNew: (adultWord) => `ì˜ˆìƒ ${adultWord} ì²´ì¤‘ í™•ì¸í•˜ê¸°`,
    submitEdit: "ì €ìž¥í•˜ê¸°",
    onboardingConfirmEditTitle: "ì €ìž¥í•˜ì‹œê² ìŠµë‹ˆê¹Œ?",
    onboardingConfirmAddTitle: "ì´ ì •ë³´ë¡œ ë“±ë¡í•˜ì‹œê² ìŠµë‹ˆê¹Œ?",
    onboardingConfirmMessage: (name) => `ìˆ˜ì •í•œ ${name}ì˜ ì •ë³´ë¥¼ ì €ìž¥í•©ë‹ˆë‹¤. ê³„ì†í• ê¹Œìš”?`,
    onboardingConfirmBtn: "ë“±ë¡í•˜ê¸°",
    ageUnder1Month: "1ê°œì›” ë¯¸ë§Œ",
    ageAbout: (n) => `ì•½ ${n}ê°œì›”`,
    heroAgeLabel: (breedName, ageText) => `${breedName} Â· í˜„ìž¬ ${ageText}ë ¹`,
    heroLabel: (adultWord) => `ì˜ˆìƒ ${adultWord} ì²´ì¤‘`,
    heroLikelyPrefix: "ê°€ìž¥ ê°€ëŠ¥ì„±ì´ ë†’ì€ ë²”ìœ„ ì•½",
    heroDisclaimer: "ì„±ìž¥ ì†ë„ëŠ” ê°œì²´ì°¨ê°€ ì»¤ìš”. í™•ì • ìˆ˜ì¹˜ê°€ ì•„ë‹Œ ì°¸ê³ ìš© ì˜ˆì¸¡ì¹˜ì˜ˆìš”.",
    chartTitle: "ì›”ë ¹ë³„ ì„±ìž¥ ê·¸ëž˜í”„",
    chartLegend: "ì§„í•œ ì  = í˜„ìž¬ ìœ„ì¹˜",
    chartBandLegend: "ì—°ë‘ìƒ‰ ë°´ë“œ = ì°¸ê³ ìš© ì •ìƒ ë²”ìœ„ (ì˜ˆìƒì¹˜ì˜ Â±15%)",
    chartOutsideBand: "âš  í˜„ìž¬ ì²´ì¤‘ì´ ì •ìƒ ë²”ìœ„ë¥¼ ë²—ì–´ë‚¬ì–´ìš”. ê±´ê°•ì´ ê±±ì •ë˜ì‹œë©´ ìˆ˜ì˜ì‚¬ì™€ ìƒë‹´í•´ë³´ì„¸ìš”.",
    chartCurrentLabel: "í˜„ìž¬",
    tooltipWeight: "ì˜ˆìƒ ì²´ì¤‘",
    monthLabel: (n) => `${n}ê°œì›”`,
    monthLabelAge: (n) => `${n}ê°œì›”ë ¹`,
    tableTitle: "ì›”ë ¹ë³„ ì˜ˆìƒ ì„±ìž¥í‘œ",
    recordTitle: "ì„±ìž¥ ê¸°ë¡",
    recordDateLabel: "ì¸¡ì •ì¼",
    recordWeightLabel: "ì²´ì¤‘ (kg)",
    recordAddBtn: "ê¸°ë¡ ì¶”ê°€",
    recordErrDate: "ì¸¡ì •ì¼ì„ ì„ íƒí•´ì£¼ì„¸ìš”",
    recordErrWeight: "ì²´ì¤‘ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    recordFirst: "ì²« ê¸°ë¡ì´ì—ìš”",
    recordDeleteBtn: "ì‚­ì œ",
    recordDeleteTitle: "ê¸°ë¡ì„ ì‚­ì œí• ê¹Œìš”?",
    recordDeleteMsg: (date, weight) => `${date} Â· ${weight}kg ê¸°ë¡ì„ ì‚­ì œí•´ìš”. ì´ ìž‘ì—…ì€ ë˜ëŒë¦´ ìˆ˜ ì—†ì–´ìš”.`,
    recordUpdated: (prev, next) => `ì„±ì²´ ì˜ˆìƒì¹˜ ${prev}kg â†’ ${next}kgìœ¼ë¡œ ì—…ë°ì´íŠ¸`,
    diffUp: (g) => `ì˜ˆìƒë³´ë‹¤ +${g}g ë¹ ë¥´ê²Œ ì„±ìž¥ ì¤‘`,
    diffDown: (g) => `ì˜ˆìƒë³´ë‹¤ ${g}g ëŠë¦¬ê²Œ ì„±ìž¥ ì¤‘`,
    diffFlat: "ì˜ˆìƒê³¼ ë¹„ìŠ·í•˜ê²Œ ì„±ìž¥ ì¤‘",
    peerTitle: (speciesLabel) => `ìš°ë¦¬ ${speciesLabel}ëŠ” ìž‘ì€ íŽ¸ì¼ê¹Œ?`,
    peerSubtitle: (speciesLabel) => `ê°™ì€ í’ˆì¢…Â·ì›”ë ¹ ${speciesLabel}ë“¤ê³¼ ë¹„êµí•œ ì°¸ê³  ìˆ˜ì¹˜ì˜ˆìš”.`,
    peerBelow: (pct) => `ë˜ëž˜ ëŒ€ë¹„ ì²´ì¤‘ í•˜ìœ„ ${pct}%`,
    peerAbove: (pct) => `ë˜ëž˜ ëŒ€ë¹„ ì²´ì¤‘ ìƒìœ„ ${pct}%`,
    peerDesc: {
      muchBelow: "ë˜ëž˜ë³´ë‹¤ ë§Žì´ ìž‘ì€ íŽ¸",
      below: "í‰ê· ë³´ë‹¤ ì•½ê°„ ìž‘ì€ íŽ¸",
      similar: "ë˜ëž˜ì™€ ë¹„ìŠ·í•œ íŽ¸",
      above: "í‰ê· ë³´ë‹¤ ì•½ê°„ í° íŽ¸",
      muchAbove: "ë˜ëž˜ë³´ë‹¤ ë§Žì´ í° íŽ¸",
    },
    peerFootnote: "ê°™ì€ í’ˆì¢…ì˜ ê¸°ë¡ì´ ìŒ“ì¼ìˆ˜ë¡ ë” ì •í™•í•´ì§€ëŠ” ì°¸ê³ ìš© ë¹„êµì˜ˆìš”.",
    albumTitle: "ì„±ìž¥ì•¨ë²”",
    albumSubtitle: "ìƒê°ë‚  ë•Œë§ˆë‹¤ ì‚¬ì§„ì„ ë‚¨ê²¨ë³´ì„¸ìš”. ì´¬ì˜ì¼ì„ ìž…ë ¥í•˜ë©´ ìžë™ìœ¼ë¡œ ê°œì›”ìˆ˜ì™€ í•¨ê»˜ ì‹œê°„ìˆœìœ¼ë¡œ ì •ë¦¬ë¼ìš”.",
    photoDateLabel: "ì´¬ì˜ì¼",
    photoLabel: "ì‚¬ì§„",
    photoPickBtn: "ì‚¬ì§„ ì„ íƒ",
    photoAddBtn: "ì•¨ë²”ì— ì¶”ê°€",
    photoErrDate: "ì´¬ì˜ì¼ì„ ì„ íƒí•´ì£¼ì„¸ìš”",
    photoErrPhoto: "ì‚¬ì§„ì„ ì„ íƒí•´ì£¼ì„¸ìš”",
    photoSaveError: "ì‚¬ì§„ì„ ì €ìž¥í•˜ì§€ ëª»í–ˆì–´ìš”. íŒŒì¼ì´ ë„ˆë¬´ í¬ê±°ë‚˜ ì €ìž¥ ê³µê°„ì´ ë¶€ì¡±í•  ìˆ˜ ìžˆì–´ìš”. ë‹¤ë¥¸ ì‚¬ì§„ìœ¼ë¡œ ë‹¤ì‹œ ì‹œë„í•´ì£¼ì„¸ìš”.",
    albumEmpty: "ì•„ì§ ë“±ë¡ëœ ì‚¬ì§„ì´ ì—†ì–´ìš”. ì²« ì‚¬ì§„ì„ ë‚¨ê²¨ë³´ì„¸ìš”!",
    photoCountLabel: (n) => `${n}ìž¥`,
    slideshowBtn: "ìŠ¬ë¼ì´ë“œì‡¼ë¡œ ë³´ê¸°",
    photoEditAria: "ì‚¬ì§„ ìˆ˜ì •",
    photoDeleteAria: "ì‚¬ì§„ ì‚­ì œ",
    infoTitle: "ì°¸ê³  ì •ë³´",
    feedingTitle: "ì‚¬ë£Œ ê¸‰ì—¬ëŸ‰ ì°¸ê³ ",
    feedingBody: (low, high, bodyLabel) => `í•˜ë£¨ ì•½ ${low}~${high}kcal ì •ë„ê°€ ì°¸ê³  ë²”ìœ„ì˜ˆìš”. í™œë™ëŸ‰, ì²´í˜•(${bodyLabel}), ì‚¬ë£Œ ì¢…ë¥˜ì— ë”°ë¼ ë‹¬ë¼ì§€ë‹ˆ ì‹¤ì œ ê¸‰ì—¬ëŸ‰ì€ ì‚¬ë£Œ í¬ìž¥ì§€ì˜ ê¶Œìž¥ëŸ‰ê³¼ ìˆ˜ì˜ì‚¬ ìƒë‹´ì„ ê¸°ì¤€ìœ¼ë¡œ ì¡°ì ˆí•´ì£¼ì„¸ìš”.`,
    humanAgeTitle: "ì‚¬ëžŒ ë‚˜ì´ë¡œ í™˜ì‚°í•˜ë©´?",
    humanAgeWithAge: (age) => `ì§€ê¸ˆì€ ì‚¬ëžŒ ë‚˜ì´ë¡œ ì•½ ${age}ì‚´ ì •ë„ì˜ˆìš”.`,
    humanAgeNoAge: "ì•„ì§ 1ì‚´ì´ ì•ˆ ë¼ì„œ ì‚¬ëžŒ ë‚˜ì´ë³´ë‹¤ëŠ” 'í•œì°½ í¬ëŠ” ì‹œê¸°'ë¡œ ë³´ëŠ” ê²Œ ë” ë§žì•„ìš”. ë³´í†µ 1ì‚´ ë¬´ë µì—” ì‚¬ëžŒ ë‚˜ì´ë¡œ ì•½ 15ì‚´ ì •ë„ê°€ ë¼ìš”.",
    humanAgeNote: "í’ˆì¢…Â·í¬ê¸°ì— ë”°ë¼ ì°¨ì´ê°€ ìžˆëŠ” ì°¸ê³ ìš© í™˜ì‚°ì´ì—ìš”.",
    ddayTitle: "ë‹¤ìŒ ìƒì¼ê¹Œì§€",
    ddayBody: (days) => `ë‹¤ìŒ ìƒì¼ê¹Œì§€ D-${days} ë‚¨ì•˜ì–´ìš” ðŸŽ‚`,
    vaccineTitle: "ì˜ˆë°©ì ‘ì¢…Â·ê±´ê°•ê´€ë¦¬",
    vaccineNote: "ì •í™•í•œ ì ‘ì¢… ìŠ¤ì¼€ì¤„ê³¼ ê±´ê°• ê´€ë¦¬ëŠ” ë°˜ë“œì‹œ ë™ë¬¼ë³‘ì›ê³¼ ìƒë‹´í•´ì£¼ì„¸ìš”.",
    vaccineText: {
      dog: [
        "ìƒí›„ 6~8ì£¼ë¶€í„° 1ì°¨ ì ‘ì¢…ì„ ì‹œìž‘í•´ìš”. ì ‘ì¢… ì „ì´ë¼ë©´ ì™¸ë¶€ ì‚°ì±…Â·ë‹¤ë¥¸ ê°•ì•„ì§€ì™€ì˜ ì ‘ì´‰ì€ í”¼í•´ì£¼ì„¸ìš”.",
        "ì¢…í•©ë°±ì‹ Â·ê´‘ê²¬ë³‘ ë“± ê¸°ì´ˆ ì ‘ì¢…ì„ ì´ì–´ê°€ëŠ” ì‹œê¸°ì˜ˆìš”. ì •í™•í•œ ìŠ¤ì¼€ì¤„ì€ ë³‘ì›ë§ˆë‹¤ ë‹¤ë¥´ë‹ˆ ìƒë‹´ í›„ ì§„í–‰í•˜ì„¸ìš”.",
        "ì¤‘ì„±í™” ìƒë‹´, ì‹¬ìž¥ì‚¬ìƒì¶©Â·êµ¬ì¶© ì˜ˆë°©ì„ ì‹œìž‘í•˜ê¸° ì¢‹ì€ ì‹œê¸°ì˜ˆìš”.",
        "ì˜êµ¬ì¹˜ê°€ ë‚˜ëŠ” ì‹œê¸°ë¼ ì¹˜ì•„ ê´€ë¦¬ê°€ ì¤‘ìš”í•´ìš”. ì •ê¸° ê²€ì§„ë„ ì±™ê²¨ì£¼ì„¸ìš”.",
        "ì„±ê²¬ì— ê°€ê¹Œì›Œì§€ëŠ” ì‹œê¸°ì˜ˆìš”. ì—° 1íšŒ ì •ê¸° ê±´ê°•ê²€ì§„ì„ ì¶”ì²œí•´ìš”.",
      ],
      cat: [
        "ìƒí›„ 6~8ì£¼ë¶€í„° ì¼“íŠ¸ë¦¬í”Œ(FVRCP) 1ì°¨ ì ‘ì¢…ì„ ì‹œìž‘í•´ìš”. ì ‘ì¢… ì „ì´ë¼ë©´ ì™¸ì¶œÂ·ë‹¤ë¥¸ ê³ ì–‘ì´ì™€ì˜ ì ‘ì´‰ì€ í”¼í•´ì£¼ì„¸ìš”.",
        "ì¼“íŠ¸ë¦¬í”Œ 2~3ì°¨ ì ‘ì¢…ê³¼ ë°±í˜ˆë³‘(FeLV) ì ‘ì¢…ì„ ì´ì–´ê°€ëŠ” ì‹œê¸°ì˜ˆìš”. ì •í™•í•œ ìŠ¤ì¼€ì¤„ì€ ë³‘ì›ë§ˆë‹¤ ë‹¤ë¥´ë‹ˆ ìƒë‹´ í›„ ì§„í–‰í•˜ì„¸ìš”.",
        "ì¤‘ì„±í™” ìƒë‹´ì„ ì‹œìž‘í•˜ê¸° ì¢‹ì€ ì‹œê¸°ì˜ˆìš”. ì‹¬ìž¥ì‚¬ìƒì¶©Â·êµ¬ì¶© ì˜ˆë°©ë„ í•¨ê»˜ ì±™ê²¨ì£¼ì„¸ìš”.",
        "ì˜êµ¬ì¹˜ê°€ ë‚˜ëŠ” ì‹œê¸°ë¼ ì¹˜ì•„ ê´€ë¦¬ê°€ ì¤‘ìš”í•´ìš”. ì •ê¸° ê²€ì§„ë„ ì±™ê²¨ì£¼ì„¸ìš”.",
        "ì„±ë¬˜ì— ê°€ê¹Œì›Œì§€ëŠ” ì‹œê¸°ì˜ˆìš”. ì—° 1íšŒ ì •ê¸° ê±´ê°•ê²€ì§„ì„ ì¶”ì²œí•´ìš”.",
      ],
    },
    sizeTitle: { dog: "ì˜· ì‚¬ì´ì¦ˆ ì°¸ê³ ", cat: "í•˜ë„¤ìŠ¤/ì´ë™ìž¥ ì‚¬ì´ì¦ˆ ì°¸ê³ " },
    sizeBody: (size, neck, chest) => `í˜„ìž¬ ì²´ì¤‘ ê¸°ì¤€ ì°¸ê³  ì‚¬ì´ì¦ˆëŠ” ${size} (ëª©ë‘˜ë ˆ ${neck} / ê°€ìŠ´ë‘˜ë ˆ ${chest}) ëŒ€ì˜ˆìš”.`,
    sizeNote: "ë¸Œëžœë“œë§ˆë‹¤ ì‚¬ì´ì¦ˆ ê¸°ì¤€ì´ ë‹¬ë¼ ì‹¤ì œ êµ¬ë§¤ ì „ì—ëŠ” ì‹¤ì¸¡ì„ í™•ì¸í•´ì£¼ì„¸ìš”.",
    tabDog: (n) => `ê°•ì•„ì§€ ì •ë³´${n > 0 ? ` (${n})` : ""}`,
    tabCat: (n) => `ê³ ì–‘ì´ ì •ë³´${n > 0 ? ` (${n})` : ""}`,
    addPetLabel: { dog: "ê°•ì•„ì§€ ì¶”ê°€", cat: "ê³ ì–‘ì´ ì¶”ê°€" },
    maxPetsReached: "ìµœëŒ€ 10ë§ˆë¦¬ê¹Œì§€ ë“±ë¡í•  ìˆ˜ ìžˆì–´ìš”",
    reportTitle: (name) => `${name}ì˜ ì„±ìž¥ ë¦¬í¬íŠ¸`,
    editBtn: "ì •ë³´ ìˆ˜ì •",
    deleteBtn: "ì‚­ì œ",
    footerNote1: "AI ì±—ë´‡, ì§€ë„, ì‹¤ì œ í‘¸ì‹œ ì•Œë¦¼ì²˜ëŸ¼",
    footerNoteStrong: "API í‚¤Â·ë°±ì—”ë“œê°€ í•„ìš”í•œ ê¸°ëŠ¥",
    footerNote2: "ì€ ì›í•˜ì‹¤ ë•Œ ë§ì”€í•´ì£¼ì‹œë©´ ìˆœì„œëŒ€ë¡œ ë¶™ì—¬ë“œë¦´ê²Œìš”.",
    accountLoginBtn: "ë¡œê·¸ì¸",
    accountLogoutBtn: "ë¡œê·¸ì•„ì›ƒ",
    accountDeleteBtn: "íšŒì›íƒˆí‡´",
    accountCloseBtn: "ë‹«ê¸°",
    accountSettingsBtn: "ê³„ì • ì„¤ì •",
    accountSettingsTitle: "ê³„ì • ì„¤ì •",
    accountKakaoTag: "ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸ë¨",
    accountCodeLabel: "ì¹´ì¹´ì˜¤ ê³„ì • êµ¬ë¶„ë²ˆí˜¸",
    accountNicknameLabel: "Petí†¡ ë‹‰ë„¤ìž„",
    accountNicknameHelp: "2~8ìž Â· Petí†¡ ê²Œì‹œê¸€ê³¼ ëŒ“ê¸€ì— í‘œì‹œë¼ìš”.",
    accountNicknameSave: "ì €ìž¥í•˜ê¸°",
    accountNicknameSaved: "ë‹‰ë„¤ìž„ì´ ë³€ê²½ëì–´ìš”.",
    accountNicknameError: "ë‹‰ë„¤ìž„ì€ 2~8ìžë¡œ ìž…ë ¥í•´ì£¼ì„¸ìš”.",
    accountFreshLoginHelp: "ë¡œê·¸ì•„ì›ƒ í›„ ë‹¤ì‹œ ë¡œê·¸ì¸í•˜ë©´ ì €ìž¥ëœ ì¹´ì¹´ì˜¤ ê³„ì • ì¤‘ ì›í•˜ëŠ” ê³„ì •ì„ ì„ íƒí•  ìˆ˜ ìžˆì–´ìš”.",
    loginToastSuccess: "ë¡œê·¸ì¸ëì–´ìš”",
    loginToastError: "ë¡œê·¸ì¸ì— ì‹¤íŒ¨í–ˆì–´ìš”. ë‹¤ì‹œ ì‹œë„í•´ì£¼ì„¸ìš”.",
    communityNav: "Petí†¡",
    communityCategoryAll: "ì „ì²´",
    communityCategoryLabels: { daily: "ì¼ìƒ", brag: "ìžëž‘", question: "ì§ˆë¬¸", health: "ê±´ê°•Â·ì‹ë‹¨", info: "ì •ë³´ê³µìœ ", walk: "ì‚°ì±…", training: "í›ˆë ¨Â·í–‰ë™", shopping: "ìš©í’ˆì¶”ì²œ", free: "ìžìœ ìˆ˜ë‹¤" },
    communitySortLatest: "ìµœì‹ ìˆœ",
    communitySortPopular: "ì¸ê¸°ìˆœ",
    communitySearchPlaceholder: "ì œëª©ì´ë‚˜ ë‚´ìš©ìœ¼ë¡œ ê²€ìƒ‰í•´ë³´ì„¸ìš”",
    communityWriteBtn: "ê¸€ì“°ê¸°",
    communityEmptyFeed: "ì•„ì§ ê²Œì‹œê¸€ì´ ì—†ì–´ìš”. ì²« ê¸€ì„ ë‚¨ê²¨ë³´ì„¸ìš” ðŸ¾",
    communityLoadMore: "ë” ë³´ê¸°",
    communityLoading: "ë¶ˆëŸ¬ì˜¤ëŠ” ì¤‘...",
    communityHealthNotice: "íšŒì›ì´ ìž‘ì„±í•œ ë‚´ìš©ì€ ê°œì¸ì ì¸ ê²½í—˜ì´ë‚˜ ì˜ê²¬ì¼ ìˆ˜ ìžˆì–´ìš”. ë°˜ë ¤ë™ë¬¼ì˜ ê±´ê°• ë¬¸ì œëŠ” ë°˜ë“œì‹œ ìˆ˜ì˜ì‚¬ì™€ ìƒë‹´í•´ì£¼ì„¸ìš”.",
    communityNeedPetTitle: "ë“±ë¡ëœ ì•„ì´ê°€ ìžˆì–´ì•¼ ê¸€ì„ ì“¸ ìˆ˜ ìžˆì–´ìš”",
    communityNeedPetBody: "Petí†¡ì€ 'ìš°ë¦¬ ì•„ì´'ì— ë“±ë¡í•œ ë°˜ë ¤ë™ë¬¼ê³¼ í•¨ê»˜ ê¸€ì„ ë‚¨ê¸°ëŠ” ê³µê°„ì´ì—ìš”. ë¨¼ì € ë°˜ë ¤ë™ë¬¼ì„ ë“±ë¡í•´ì£¼ì„¸ìš”.",
    communityComposeTitlePet: "í•¨ê»˜ í‘œì‹œí•  ì•„ì´",
    communityComposeTitleCategory: "ì¹´í…Œê³ ë¦¬",
    communityComposeVisibility: "ê³µê°œ ì„¤ì •",
    communityComposeVisibilityPublicHelp: "ëª¨ë“  PetGrow ì´ìš©ìžê°€ ë³¼ ìˆ˜ ìžˆì–´ìš”.",
    communityComposeVisibilityPrivateHelp: "ë‚˜ë§Œ ë³¼ ìˆ˜ ìžˆì–´ìš”. íšŒì›ì •ë³´ì˜ Petí†¡ ë‚´ í™œë™ì—ì„œ í™•ì¸í•  ìˆ˜ ìžˆì–´ìš”.",
    communityComposeTitleTitle: "ì œëª©",
    communityComposeTitlePlaceholder: "ì œëª©ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    communityComposeTitleContent: "ë‚´ìš©",
    communityComposeContentPlaceholder: "ìš°ë¦¬ ì•„ì´ ì´ì•¼ê¸°ë¥¼ ë“¤ë ¤ì£¼ì„¸ìš”",
    communityComposePhotos: (n) => `ì‚¬ì§„ (ìµœëŒ€ 5ìž¥, ${n}/5)`,
    communityComposeSubmit: "ë“±ë¡í•˜ê¸°",
    communityComposeSubmitEdit: "ìˆ˜ì • ì™„ë£Œ",
    communityComposeUploading: "ì—…ë¡œë“œ ì¤‘...",
    communityComposeErrTitle: "ì œëª©ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    communityComposeErrContent: "ë‚´ìš©ì„ ìž…ë ¥í•´ì£¼ì„¸ìš”",
    communityComposeErrPet: "í•¨ê»˜í•  ì•„ì´ë¥¼ ì„ íƒí•´ì£¼ì„¸ìš”",
    communityBack: "ë’¤ë¡œ",
    communityEditBtn: "ìˆ˜ì •",
    communityDeleteBtn: "ì‚­ì œ",
    communityVisibilityPublic: "ê³µê°œ",
    communityVisibilityPrivate: "ë¹„ê³µê°œ",
    communityMakePrivate: "ë¹„ê³µê°œë¡œ ì „í™˜",
    communityMakePublic: "ê³µê°œë¡œ ì „í™˜",
    communityVisibilityChanged: "ê³µê°œ ì„¤ì •ì´ ë³€ê²½ëì–´ìš”.",
    communityDeleteConfirmTitle: "ê²Œì‹œê¸€ì„ ì‚­ì œí• ê¹Œìš”?",
    communityDeleteConfirmBody: "ì‚­ì œí•˜ë©´ ë˜ëŒë¦´ ìˆ˜ ì—†ì–´ìš”.",
    communityCommentsTitle: "ëŒ“ê¸€",
    communityCommentPlaceholder: "ëŒ“ê¸€ì„ ë‚¨ê²¨ë³´ì„¸ìš”",
    communityCommentSubmit: "ë“±ë¡",
    communityCommentEmpty: "ì•„ì§ ëŒ“ê¸€ì´ ì—†ì–´ìš”. ì²« ëŒ“ê¸€ì„ ë‚¨ê²¨ë³´ì„¸ìš”!",
    communityCommentDeleteConfirmTitle: "ëŒ“ê¸€ì„ ì‚­ì œí• ê¹Œìš”?",
    communityReportBtn: "ì‹ ê³ ",
    communityReportTitle: "ì‹ ê³ í•˜ê¸°",
    communityReportReasonLabel: "ì‹ ê³  ì‚¬ìœ ë¥¼ ì„ íƒí•´ì£¼ì„¸ìš”",
    communityReportDetailPlaceholder: "ì¶”ê°€ë¡œ ë‚¨ê¸°ê³  ì‹¶ì€ ë‚´ìš©ì´ ìžˆë‹¤ë©´ ì ì–´ì£¼ì„¸ìš” (ì„ íƒ)",
    communityReportSubmit: "ì‹ ê³  ì ‘ìˆ˜",
    communityReportDone: "ì‹ ê³ ê°€ ì ‘ìˆ˜ëì–´ìš”. í™•ì¸ í›„ ì¡°ì¹˜í• ê²Œìš”.",
    communityReportAlready: "ì´ë¯¸ ì‹ ê³ í•œ ê²Œì‹œê¸€/ëŒ“ê¸€ì´ì—ìš”.",
    communityReportReasons: {
      ad: "ê´‘ê³ /í™ë³´", abuse: "ìš•ì„¤/ë¹„ë°©", sexual: "ìŒëž€í•˜ê±°ë‚˜ ë¶€ì ì ˆí•œ ì½˜í…ì¸ ", animal_abuse: "ë™ë¬¼í•™ëŒ€ ê´€ë ¨ ì½˜í…ì¸ ",
      privacy: "ê°œì¸ì •ë³´ ë…¸ì¶œ", misinformation: "í—ˆìœ„/ìœ„í—˜ ì •ë³´", spam: "ë„ë°°", other: "ê¸°íƒ€",
    },
    communityMyActivityNav: "ë‚´ í™œë™",
    communityMyPostsTab: "ë‚´ê°€ ì“´ ê¸€",
    communityMyCommentsTab: "ë‚´ê°€ ì“´ ëŒ“ê¸€",
    communityMyLikesTab: "ì¢‹ì•„ìš”í•œ ê¸€",
    communityMyEmptyPosts: "ì•„ì§ ìž‘ì„±í•œ ê¸€ì´ ì—†ì–´ìš”.",
    communityMyEmptyComments: "ì•„ì§ ìž‘ì„±í•œ ëŒ“ê¸€ì´ ì—†ì–´ìš”.",
    communityMyEmptyLikes: "ì•„ì§ ì¢‹ì•„ìš”í•œ ê¸€ì´ ì—†ì–´ìš”.",
    myPageTitle: "íšŒì›ì •ë³´",
    myPageAccountTitle: "ë‚´ ê³„ì •",
    myPagePetsTitle: "ë“±ë¡í•œ ìš°ë¦¬ ì•„ì´",
    myPagePetsCount: (n) => `${n}ë§ˆë¦¬`,
    myPageActivityTitle: "Petí†¡ ë‚´ í™œë™",
    myPageSettingsBtn: "ì •ë³´ ìˆ˜ì •",
    myPageManagePetsBtn: "ìš°ë¦¬ ì•„ì´ ê´€ë¦¬",
    communityImageTooMany: "ì‚¬ì§„ì€ ìµœëŒ€ 5ìž¥ê¹Œì§€ ë“±ë¡í•  ìˆ˜ ìžˆì–´ìš”.",
    communityImageInvalidType: "JPG, PNG, WebP í˜•ì‹ì˜ ì‚¬ì§„ë§Œ ë“±ë¡í•  ìˆ˜ ìžˆì–´ìš”.",
    communityUploadFailed: "ì‚¬ì§„ ì—…ë¡œë“œì— ì‹¤íŒ¨í–ˆì–´ìš”. ìž ì‹œ í›„ ë‹¤ì‹œ ì‹œë„í•´ì£¼ì„¸ìš”.",
    loginTagline: "ìš°ë¦¬ ì•„ì´ì˜ ê±´ê°•í•œ ì„±ìž¥ì„ í•¨ê»˜í•´ìš”",
    loginGateTitle: "ë¡œê·¸ì¸ì´ í•„ìš”í•´ìš”",
    loginGateBody: "ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ë¡œê·¸ì¸í•˜ë©´ ë°˜ë ¤ë™ë¬¼ ì •ë³´ê°€ ì´ ê³„ì •ì— ì•ˆì „í•˜ê²Œ ì €ìž¥ë˜ê³ , ë‹¤ë¥¸ ê¸°ê¸°ì—ì„œë„ ë¡œê·¸ì¸ë§Œ í•˜ë©´ ê·¸ëŒ€ë¡œ ë¶ˆëŸ¬ì˜¬ ìˆ˜ ìžˆì–´ìš”.",
    loginContinueKakao: "ì¹´ì¹´ì˜¤ë¡œ ì‹œìž‘í•˜ê¸°",
    termsFooterLink: "ì´ìš©ì•½ê´€",
    loggedInGreeting: (name) => `${name}ë‹˜, ì•ˆë…•í•˜ì„¸ìš”`,
    homeGreeting: (name) => `ì•ˆë…•í•˜ì„¸ìš”, ${name} ë³´í˜¸ìžë‹˜! ðŸ¾`,
    homeSubGreeting: "ì˜¤ëŠ˜ë„ ìš°ë¦¬ ì•„ì´ì™€ í–‰ë³µí•œ í•˜ë£¨ ë³´ë‚´ì„¸ìš”.",
    homePetCardBtn: "ì•„ì´ ì •ë³´ ë³´ê¸°",
    homeAddPetBtn: "ìš°ë¦¬ ì•„ì´ ë“±ë¡í•˜ê¸°",
    homeServicesTitle: "PetGrowì™€ í•¨ê»˜ ì„±ìž¥í•´ìš”",
    homeCardGrowthTitle: "ìš°ë¦¬ ì•„ì´",
    homeCardGrowthDesc: "ë‚˜ì´Â·ì²´ì¤‘Â·ì˜ˆë°©ì ‘ì¢… ë“± ìš°ë¦¬ ì•„ì´ ì„±ìž¥ ê¸°ë¡",
    homeCardSajuDesc: "ìƒë…„ì›”ì¼ë¡œ ë³´ëŠ” ìš°ë¦¬ ì•„ì´ì˜ ìš´ì„¸",
    homeCardPetBtiDesc: "ì„±ê²© ìœ í˜• ê²€ì‚¬ë¡œ ìš°ë¦¬ ì•„ì´ ì´í•´í•˜ê¸°",
    homeCardTipsDesc: "ê±´ê°•Â·ì‹ë‹¨Â·ìƒí™œ ë“± ìœ ìš©í•œ ì •ë³´ ëª¨ìŒ",
    homeCardCommunityDesc: "ë³´í˜¸ìžë“¤ê³¼ ì†Œí†µí•˜ëŠ” ì»¤ë®¤ë‹ˆí‹° ê³µê°„",
    notifAria: "ì•Œë¦¼ ë³´ê¸°",
    notifEmpty: "ìƒˆë¡œìš´ ì•Œë¦¼ì´ ì—†ì–´ìš”",
    notifBirthdayToday: (name) => `${name}ì˜ ìƒì¼ì´ì—ìš”! ðŸŽ‰`,
    notifBirthdaySoon: (name, days) => `${name}ì˜ ìƒì¼ì´ ${days}ì¼ ë‚¨ì•˜ì–´ìš” ðŸŽ‚`,
    notifRecordStale: (name) => `${name}ì˜ ì„±ìž¥ ê¸°ë¡ì„ ë‚¨ê¸´ ì§€ ì¢€ ëì–´ìš”. ìµœê·¼ ì²´ì¤‘ì„ ê¸°ë¡í•´ë³´ì„¸ìš”`,
    notifPhotoStale: (name) => `${name}ì˜ ì„±ìž¥ì•¨ë²”ì— ì‚¬ì§„ì„ ì¶”ê°€í•´ë³´ì„¸ìš”`,
    pushEnableBtn: "ë¸Œë¼ìš°ì € ì•Œë¦¼ ì¼œê¸°",
    pushGranted: "ë¸Œë¼ìš°ì € ì•Œë¦¼ì´ ì¼œì¡Œì–´ìš”. (ì´ ë¯¸ë¦¬ë³´ê¸° í™”ë©´ ì•ˆì—ì„œëŠ” ì‹¤ì œ ì•Œë¦¼ì´ ì˜¤ì§€ ì•Šì„ ìˆ˜ ìžˆì–´ìš”)",
    pushDenied: "ì•Œë¦¼ì´ ì°¨ë‹¨ëì–´ìš”. ë¸Œë¼ìš°ì € ì„¤ì •ì—ì„œ í—ˆìš©í•´ì£¼ì„¸ìš”.",
    pushUnsupported: "ì´ í™”ë©´ì—ì„œëŠ” ë¸Œë¼ìš°ì € ì•Œë¦¼ì„ ì§€ì›í•˜ì§€ ì•Šì•„ìš”.",
    pushNote: "ì‹¤ì œë¡œ íœ´ëŒ€í°ì— í‘¸ì‹œ ì•Œë¦¼ì„ ë³´ë‚´ë ¤ë©´ Firebase Cloud Messaging(FCM)ê³¼ ì•Œë¦¼ì„ ë³´ë‚¼ ì„œë²„ê°€ í•„ìš”í•´ìš”.",
    landingTagline: "ìš°ë¦¬ ì•„ì´ì˜ ê±´ê°•í•œ ì„±ìž¥ì„ í•¨ê»˜",
    landingHeadline1: "ìš°ë¦¬ ì•„ì´ì˜ ëª¨ë“  ìˆœê°„ì„",
    landingGreeting: "ì•ˆë…•í•˜ì„¸ìš”, íŽ«ê·¸ë¡œìš°ìž…ë‹ˆë‹¤ ðŸ¾",
    socialTitle: "PetGrow ê³µì‹ ì±„ë„",
    saveToastOk: "ì €ìž¥ë˜ì—ˆìŠµë‹ˆë‹¤.",
    saveToastError: "ì €ìž¥ì— ì‹¤íŒ¨í–ˆì–´ìš” â€” ì €ìž¥ ê³µê°„ì´ ê°€ë“ ì°¼ì„ ìˆ˜ ìžˆì–´ìš”. ì˜¤ëž˜ëœ ì‚¬ì§„ì„ ì •ë¦¬í•´ë³´ì„¸ìš”.",
    welcomeBackMsg: (name) => name ? `ë‹¤ì‹œ ì˜¤ì…¨êµ°ìš”! ðŸ¾ ${name}ì˜ ê¸°ë¡ì„ ì´ì–´ê°€ë³¼ê¹Œìš”?` : "ë‹¤ì‹œ ì˜¤ì…¨êµ°ìš”! ðŸ¾ ê¸°ë¡ì„ ì´ì–´ê°€ë³¼ê¹Œìš”?",
    socialLabels: { youtube: "ìœ íŠœë¸Œ", instagram: "ì¸ìŠ¤íƒ€ê·¸ëž¨", threads: "ìŠ¤ë ˆë“œ", tiktok: "í‹±í†¡", blog: "ë„¤ì´ë²„ ë¸”ë¡œê·¸", clip: "ë„¤ì´ë²„ í´ë¦½", kakao: "ì¹´ì¹´ì˜¤í†¡ ì±„ë„" },
    introVideoMute: "ì†Œë¦¬ ë„ê¸°",
    introVideoUnmute: "ì†Œë¦¬ ì¼œê¸°",
    landingHeadlineHighlight: "PetGrow",
    landingHeadline2: "ì™€ í•¨ê»˜",
    landingSubtitle: "ì„±ìž¥ ê¸°ë¡ë¶€í„° PetBTI, Petì‚¬ì£¼, ë§žì¶¤ ì •ë³´ì™€ Petí†¡ê¹Œì§€ â€” ë°˜ë ¤ë™ë¬¼ê³¼ í•¨ê»˜í•˜ëŠ” ë§¤ì¼ì„ ë” íŠ¹ë³„í•˜ê²Œ ê¸°ë¡í•´ë³´ì„¸ìš”.",
    landingFeature1Title: "ì„±ìž¥ ì˜ˆì¸¡",
    landingFeature1Desc: "ì˜ˆì¸¡ ì²´ì¤‘ê³¼ ì›”ë ¹ë³„ ì„±ìž¥ ê³¡ì„ ì„ ë³´ì—¬ë“œë ¤ìš”",
    landingFeature2Title: "ì„±ìž¥ ê¸°ë¡ Â· ì•¨ë²”",
    landingFeature2Desc: "ì²´ì¤‘ê³¼ ì‚¬ì§„ì„ ë‚ ì§œì™€ í•¨ê»˜ ì°¨ê³¡ì°¨ê³¡ ê¸°ë¡í•´ìš”",
    landingFeature3Title: "ì°¸ê³  ì •ë³´ ê°€ì´ë“œ",
    landingFeature3Desc: "ë˜ëž˜ ë¹„êµ, ì‚¬ë£ŒÂ·ì˜ˆë°©ì ‘ì¢… ì°¸ê³  ì •ë³´ë¥¼ í™•ì¸í•´ìš”",
    landingCta: "ì§€ê¸ˆ ì‹œìž‘í•˜ê¸°",
    landingTrust1: "ì°¸ê³ ìš© ì„±ìž¥ ë°ì´í„°",
    landingTrust2: "ê°„íŽ¸í•œ ì‹œìž‘",
    landingTrust3: "ì¹´ì¹´ì˜¤ ê³„ì •ìœ¼ë¡œ ì•ˆì „í•˜ê²Œ ì €ìž¥",
    landingTrust4: "ì§€ì†ì ì¸ ì—…ë°ì´íŠ¸",
    landingPreviewLabel: "ì˜ˆì¸¡ ì„±ì²´ ì²´ì¤‘",
    landingBackHome: "í™ˆìœ¼ë¡œ",
    landingHowTitle: "PetGrow ì‹œìž‘ì€ ê°„ë‹¨í•´ìš”",
    landingStep1Title: "ì¹´ì¹´ì˜¤ë¡œ ì‹œìž‘í•˜ê¸°",
    landingStep1Desc: "ê°„íŽ¸í•˜ê²Œ ë¡œê·¸ì¸í•´ìš”.",
    landingStep2Title: "ìš°ë¦¬ ì•„ì´ ë“±ë¡í•˜ê¸°",
    landingStep2Desc: "ì‚¬ì§„ê³¼ ê¸°ë³¸ ì •ë³´ë¥¼ ë“±ë¡í•´ìš”.",
    landingStep3Title: "ìš°ë¦¬ ì•„ì´ì™€ PetGrow ì¦ê¸°ê¸°",
    landingStep3Desc: "ì„±ìž¥ê¸°ë¡, Petì‚¬ì£¼, PetBTI, Petí†¡ ë“± ë‹¤ì–‘í•œ ê¸°ëŠ¥ì„ ì´ìš©í•´ìš”.",
    landingFeaturesTitle: "PetGrowê°€ ë„ì™€ë“œë¦¬ëŠ” ê²ƒë“¤",
    landingAboutTitle: "PetGrowëŠ” ì´ëŸ° ì„œë¹„ìŠ¤ì˜ˆìš”",
    landingAboutBody: "PetGrowëŠ” ê°•ì•„ì§€ì™€ ê³ ì–‘ì´ì˜ ê²¬ì¢…Â·ë¬˜ì¢…, ìƒë…„ì›”ì¼, ì²´ì¤‘ ì •ë³´ë¥¼ ë°”íƒ•ìœ¼ë¡œ ì˜ˆìƒ ì„±ì²´ ì²´ì¤‘ê³¼ ì›”ë ¹ë³„ ì„±ìž¥ ê³¡ì„ ì„ ë³´ì—¬ì£¼ëŠ” ë°˜ë ¤ë™ë¬¼ ì„±ìž¥ ê¸°ë¡ ì„œë¹„ìŠ¤ì˜ˆìš”. ë³‘ì›ì—ì„œ ìž° ì²´ì¤‘ì„ ë‚ ì§œì™€ í•¨ê»˜ ê¸°ë¡í•˜ë©´ ì˜ˆìƒë³´ë‹¤ ë¹ ë¥´ê²Œ í¬ëŠ”ì§€ ëŠë¦¬ê²Œ í¬ëŠ”ì§€ ìžë™ìœ¼ë¡œ ë¹„êµí•´ì£¼ê³ , ì‚¬ì§„ì„ ì´¬ì˜ì¼ê³¼ í•¨ê»˜ ë‚¨ê¸°ë©´ ì‹œê°„ìˆœìœ¼ë¡œ ì •ë¦¬ëœ ì„±ìž¥ì•¨ë²”ì´ ë§Œë“¤ì–´ì ¸ìš”. ëª¨ë“  ì˜ˆì¸¡ì€ ì°¸ê³ ìš© ë°ì´í„°ì´ë©°, ì •í™•í•œ ê±´ê°• ê´€ë¦¬ëŠ” ë°˜ë“œì‹œ ìˆ˜ì˜ì‚¬ì™€ ìƒë‹´í•´ì£¼ì„¸ìš”.",
    landingCoreFeaturesTitle: "ìš°ë¦¬ ì•„ì´ì™€ í•¨ê»˜í•˜ëŠ” ëª¨ë“  ìˆœê°„",
    landingCoreFeaturesSubtitle: "ê¸°ë¡í•˜ê³ , ì•Œì•„ê°€ê³ , ì´ì•¼ê¸°í•˜ëŠ” ë°˜ë ¤ìƒí™œì„ PetGrow í•˜ë‚˜ë¡œ",
    landingCardMyPetsTitle: "ðŸ¾ ìš°ë¦¬ ì•„ì´",
    landingCardMyPetsDesc: "ìš°ë¦¬ ì•„ì´ì˜ í”„ë¡œí•„ê³¼ ì„±ìž¥ ê¸°ë¡ì„ í•œê³³ì—ì„œ. ì‚¬ì§„, ìƒë…„ì›”ì¼, í’ˆì¢…, ëª¸ë¬´ê²Œ ë“± ë°˜ë ¤ë™ë¬¼ ì •ë³´ë¥¼ ê´€ë¦¬í•´ìš”.",
    landingCardGrowthTitle: "ðŸ“ˆ ì„±ìž¥ ê¸°ë¡",
    landingCardGrowthDesc: "í•˜ë£¨í•˜ë£¨ ë‹¬ë¼ì§€ëŠ” ëª¨ìŠµì„ ê¸°ë¡í•´ìš”. ëª¸ë¬´ê²Œì™€ ì‚¬ì§„ì„ ê¸°ë¡í•˜ê³  ì„±ìž¥ ë³€í™”ë¥¼ í™•ì¸í•´ìš”.",
    landingCardSajuTitle: "ðŸ”® Petì‚¬ì£¼",
    landingCardSajuDesc: "ìš°ë¦¬ ì•„ì´ì—ê²Œ ìˆ¨ê²¨ì§„ íŠ¹ë³„í•œ ì´ì•¼ê¸°ë¥¼ ë§Œë‚˜ë³´ì„¸ìš”. ë“±ë¡ëœ ì •ë³´ë¥¼ ë°”íƒ•ìœ¼ë¡œ ìž¬ë¯¸ìžˆê²Œ ì¦ê¸°ëŠ” ë°˜ë ¤ë™ë¬¼ ì‚¬ì£¼ ì½˜í…ì¸ ì˜ˆìš”.",
    landingCardPetBtiTitle: "ðŸ¶ PetBTI",
    landingCardPetBtiDesc: "ìš°ë¦¬ ì•„ì´ëŠ” ì–´ë–¤ ì„±ê²©ì¼ê¹Œìš”? í–‰ë™ê³¼ ì„±í–¥ì— ê´€í•œ ì§ˆë¬¸ìœ¼ë¡œ ìš°ë¦¬ ì•„ì´ì˜ PetBTIë¥¼ ì•Œì•„ë´ìš”.",
    landingCardFortuneTitle: "ðŸ’š ì˜¤ëŠ˜ì˜ ìš´ì„¸",
    landingCardFortuneDesc: "ì˜¤ëŠ˜ ìš°ë¦¬ ì•„ì´ì˜ í•˜ë£¨ëŠ” ì–´ë–¨ê¹Œìš”? ë§¤ì¼ ê°€ë³ê²Œ í™•ì¸í•˜ëŠ” ìš°ë¦¬ ì•„ì´ì˜ ì˜¤ëŠ˜ì˜ ìš´ì„¸ë¥¼ ì œê³µí•´ìš”.",
    landingCardCompatTitle: "ðŸ«¶ ë³´í˜¸ìž ê¶í•©",
    landingCardCompatDesc: "ë‚˜ì™€ ìš°ë¦¬ ì•„ì´ëŠ” ì–¼ë§ˆë‚˜ ìž˜ ë§žì„ê¹Œìš”? ë³´í˜¸ìžì™€ ë°˜ë ¤ë™ë¬¼ì˜ ìž¬ë¯¸ìžˆëŠ” ê¶í•© ê²°ê³¼ë¥¼ í™•ì¸í•´ìš”.",
    landingCardTipsTitle: "ðŸ’¡ Petì •ë³´",
    landingCardNearbyTitle: "ðŸ“ ë‚´ ì£¼ë³€ Pet",
    landingCardNearbyDesc: "ê²€ìƒ‰í•œ ì£¼ì†Œ ì£¼ë³€ì˜ ë³‘ì›Â·ì•½êµ­Â·íŽ«ìƒµÂ·ë¯¸ìš©Â·í˜¸í…”ì„ ì°¾ì•„ë³´ê³  ë‚´ ìœ„ì¹˜ ê±°ë¦¬ë„ í™•ì¸í•´ìš”.",
    homeCardNearbyDesc: "ì£¼ì†Œ ê²€ìƒ‰ ë˜ëŠ” í˜„ìž¬ ìœ„ì¹˜ ê²€ìƒ‰ìœ¼ë¡œ ì£¼ë³€ ì—…ì²´ë¥¼ ì°¾ê³ , ì§€ë„ì—ì„œ ë‚´ ìœ„ì¹˜ì™€ ì—…ì²´ê¹Œì§€ì˜ ê±°ë¦¬ë¥¼ í•¨ê»˜ í™•ì¸í•´ìš”.",
    landingCardTipsDesc: "ë°˜ë ¤ìƒí™œì— í•„ìš”í•œ ì •ë³´ë¥¼ ì‰½ê³  ë¹ ë¥´ê²Œ. ê±´ê°•, ì‹ë‹¨, í–‰ë™, ì„±ìž¥, ìƒí™œ ì •ë³´ë¥¼ í™•ì¸í•´ìš”.",
    landingCardCommunityTitle: "ðŸ’¬ Petí†¡",
    landingCardCommunityDesc: "ìš°ë¦¬ ì•„ì´ ì´ì•¼ê¸°ë¥¼ í•¨ê»˜ ë‚˜ëˆ ìš”. ë‹¤ë¥¸ ë³´í˜¸ìžë“¤ê³¼ ë°˜ë ¤ë™ë¬¼ì˜ ì¼ìƒê³¼ ì‚¬ì§„, ì§ˆë¬¸ê³¼ ì •ë³´ë¥¼ ê³µìœ í•˜ëŠ” ì»¤ë®¤ë‹ˆí‹°ì˜ˆìš”.",
    landingFunTitle: "ìš°ë¦¬ ì•„ì´ë¥¼ ë” ì•Œì•„ê°€ëŠ” ìž¬ë¯¸",
    landingSajuEyebrow: "Petì‚¬ì£¼",
    landingSajuHighlightTitle: "ìš°ë¦¬ ì•„ì´ì—ê²Œë„ íƒ€ê³ ë‚œ ë§¤ë ¥ì´ ìžˆì„ê¹Œìš”? ðŸ”®",
    landingSajuHighlightDesc: "ìš°ë¦¬ ì•„ì´ì˜ ì •ë³´ë¡œ ë§Œë‚˜ëŠ” íŠ¹ë³„í•œ ì´ì•¼ê¸°ì˜ˆìš”.",
    landingSajuHighlightCta: "Petì‚¬ì£¼ ë§Œë‚˜ë³´ê¸°",
    landingPetBtiEyebrow: "PetBTI",
    landingPetBtiHighlightTitle: "ìš°ë¦¬ ì•„ì´ì˜ ì§„ì§œ ì„±ê²©ì€? ðŸ¾",
    landingPetBtiHighlightDesc: "í–‰ë™ê³¼ ì„±í–¥ì„ í†µí•´ ì•Œì•„ë³´ëŠ” ìš°ë¦¬ ì•„ì´ë§Œì˜ PetBTIì˜ˆìš”.",
    landingPetBtiHighlightCta: "PetBTI ì•Œì•„ë³´ê¸°",
    landingFunDisclaimer: "Petì‚¬ì£¼Â·PetBTIëŠ” ìž¬ë¯¸ì™€ ì°¸ê³ ë¥¼ ìœ„í•œ ì½˜í…ì¸ ì´ë©° ê³¼í•™ì ìœ¼ë¡œ ê²€ì¦ëœ ì§„ë‹¨ì´ ì•„ë‹ˆì—ìš”.",
    landingCommunityTitle: "ìš°ë¦¬ ì•„ì´ ì´ì•¼ê¸°ë¥¼ í•¨ê»˜ ë‚˜ëˆ ìš”",
    landingCommunitySubtitle: "Petí†¡ì—ì„œ ë‹¤ë¥¸ ë³´í˜¸ìžë“¤ê³¼ ë°˜ë ¤ìƒí™œì„ ê³µìœ í•´ë³´ì„¸ìš”.",
    landingCommunityDesc: "ì¼ìƒ, ìžëž‘, ì§ˆë¬¸, ê±´ê°•Â·ì‹ë‹¨, ì •ë³´ê³µìœ ê¹Œì§€ â€” ìš°ë¦¬ ì•„ì´ì™€ í•¨ê»˜í•œ ìˆœê°„ì„ ë‹¤ë¥¸ ë³´í˜¸ìžë“¤ê³¼ ë‚˜ëˆ„ê³  ì¢‹ì•„ìš”ì™€ ëŒ“ê¸€ë¡œ ì†Œí†µí•´ë³´ì„¸ìš”.",
    landingCommunityCta: "Petí†¡ ë‘˜ëŸ¬ë³´ê¸°",
    landingMockPost1Name: "ëª½ì´", landingMockPost1Breed: "ë§í‹°í‘¸", landingMockPost1Time: "10ë¶„ ì „",
    landingMockPost1Text: "ì˜¤ëŠ˜ ì‚°ì±…í•˜ë‹¤ê°€ ì¹œêµ¬ë¥¼ ë§Œë‚¬ì–´ìš” ðŸ¾",
    landingMockPost2Name: "ë‚˜ë¹„", landingMockPost2Breed: "ì½”ë¦¬ì•ˆìˆí—¤ì–´", landingMockPost2Time: "1ì‹œê°„ ì „",
    landingMockPost2Text: "ì°½ê°€ì—ì„œ ë‚®ìž  ìžëŠ” ì¤‘... ë°©í•´ ê¸ˆì§€ ðŸ±",
    landingTipsGuideTitle: "Petì •ë³´",
    landingTipsGuideDesc: "ê±´ê°•Â·ì‹ë‹¨Â·í–‰ë™Â·ì„±ìž¥Â·ìƒí™œë¶€í„° í›ˆë ¨Â·ì•ˆì „Â·ë¯¸ìš©ê¹Œì§€, ë°˜ë ¤ìƒí™œì— ë°”ë¡œ í™œìš©í•  ìˆ˜ ìžˆëŠ” Petì •ë³´ë¥¼ ëª¨ì•„ë´¤ì–´ìš”.",
    landingTipsTeaserLabel: "Petì •ë³´ ë³´ëŸ¬ê°€ê¸°",
    landingGuideTeaserLabel: "ì‚¬ìš©ë°©ë²• ë³´ê¸°",
    landingFinalCtaLine1: "ìš°ë¦¬ ì•„ì´ì™€ í•¨ê»˜í•œ ì˜¤ëŠ˜,",
    landingFinalCtaLine2: "PetGrowì— ë‚¨ê²¨ë³´ì„¸ìš” ðŸ¾",
    landingFinalCtaDesc: "ì„±ìž¥í•˜ëŠ” ìˆœê°„ë¶€í„° ì†Œì†Œí•œ ì¼ìƒê¹Œì§€\nPetGrowê°€ ìš°ë¦¬ ì•„ì´ì™€ í•¨ê»˜í•©ë‹ˆë‹¤.",
    landingFinalCtaBtn: "PetGrow ì‹œìž‘í•˜ê¸°",
    landingPricingTitle: "ì²´í—˜íŒê³¼ íšŒì›, ë¬´ì—‡ì´ ë‹¤ë¥¼ê¹Œìš”?",
    landingTierTrialName: "ì²´í—˜íŒ",
    landingTierTrialPrice: "ë¬´ë£Œ Â· ë¡œê·¸ì¸ ë¶ˆí•„ìš”",
    landingTierTrial1: "ë°˜ë ¤ë™ë¬¼ 1ë§ˆë¦¬ ë“±ë¡",
    landingTierTrial2: "ì„±ìž¥ ì˜ˆì¸¡ Â· ê·¸ëž˜í”„ Â· ê¸°ë¡ Â· ë˜ëž˜ ë¹„êµ",
    landingTierTrial3: "ì°¸ê³  ì •ë³´ ê°€ì´ë“œ",
    landingTierMemberName: "íšŒì›",
    landingTierMemberPrice: "ë¬´ë£Œ Â· ì¹´ì¹´ì˜¤ ê°„íŽ¸ë¡œê·¸ì¸",
    landingTierMember1: "ë°˜ë ¤ë™ë¬¼ ìµœëŒ€ 10ë§ˆë¦¬ ë“±ë¡",
    landingTierMember2: "ì²´í—˜íŒì˜ ëª¨ë“  ê¸°ëŠ¥ í¬í•¨",
    landingTierMember3: "ì„±ìž¥ì•¨ë²”(ì‚¬ì§„) ë“±ë¡Â·ìŠ¬ë¼ì´ë“œì‡¼",
  },
  en: {
    privacyFooter: "Once you log in with Kakao, everything you register for your pet is safely saved to your account â€” log in on any device to pick up right where you left off.",
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
    confirmDeleteMsg: (name) => `All of ${name}'s records and photos will be gone for good â€” this can't be undone.`,
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
    badgeNext: (name) => `Next badge: "${name}" â€” keep logging to earn it!`,
    breedInfoNotice: "These traits are general tendencies for reference only â€” individual pets can vary a lot.",
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
    petBtiMainDesc: "Just answer a few questions about their everyday behavior.\nPetGrow will find their personality type ðŸ¶ðŸ’•",
    petBtiStartBtn: "Start PetBTI ðŸ¾",
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
    petBtiCompatTitle: (name) => `ðŸ’• A friend who'd suit ${name}`,
    petBtiCompatGood: (name) => `A personality with charms ${name} doesn't have â€” their differences could actually make for a great pairing, each filling in where the other doesn't.`,
    petBtiCompatChaosTitle: "The chaos combo",
    petBtiCompatChaos: (name) => `A friend with a very similar personality to ${name}. Put them together and it might get delightfully chaotic â€” not a bad thing, just double the energy ðŸ˜†`,
    petBtiShareBtn: "Share my PetBTI ðŸ¾",
    petBtiShareTitle: "Share PetBTI card",
    petBtiShareHeading: (name) => `${name}'s PetBTI`,
    petBtiDisclaimer: "A fun PetGrow personality quiz â€” not a behavioral or medical assessment.",
    sajuFormTitle: "Pet Fortune ðŸ¾",
    sajuFormSub: "Enter a few details for a fun look at your pet's fortune.",
    sajuNameLabel: "Name",
    sajuNamePlaceholder: "Bella",
    sajuSpeciesLabel: "Dog / Cat",
    sajuBirthLabel: "Birth date",
    sajuGenderLabel: "Gender",
    sajuTimeLabel: "Birth time",
    sajuBreedLabel: "Breed",
    sajuBreedPlaceholder: "Maltese",
    sajuGenerateBtn: "Reveal my pet's fortune ðŸ¾",
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
    sajuDisclaimer: "A fun PetGrow feature ðŸ¾ not a real assessment of personality or the future.",
    tipCategoryLabels: { all: "All", dog: "Dogs", cat: "Cats", health: "Health", life: "Lifestyle", food: "Food & Nutrition", training: "Training", safety: "Safety", grooming: "Grooming" },
    privacyFooterLink: "Privacy Policy",
    guideSections: [
      { title: "1. Register your pet", body: "Enter a name, breed, birth date, and current weight to instantly see the predicted adult weight and growth chart. You can add a profile photo too." },
      { title: "2. Growth records", body: "Log weight along with the date you measured it â€” PetGrow automatically compares it to the prediction and tells you if growth is running fast or slow." },
      { title: "3. Growth album", body: "Add photos with the date taken, anytime. They're grouped by age in months so you can see the whole growth story at a glance, and you can view them as a slideshow." },
      { title: "4. Peer comparison & reference info", body: "Compare with similar-aged pets, and check reference info like feeding amounts and vaccination timing. These are estimates, not prescriptions â€” always check with a vet." },
      { title: "5. Growth badges & vaccine checklist", body: "Badges fill in as you log records and photos. Track vaccinations with a checklist you can tick off yourself." },
      { title: "6. Breed info & share cards", body: "Tap the breed name under your pet's name for breed reference info, and use the button above the prediction to create a shareable image card for social media." },
      { title: "7. Tips", body: "Tap the 'Tips' button in the header to search and bookmark health and lifestyle tips. Today's picks rotate automatically each day." },
      { title: "8. Managing multiple pets", body: "Switch between dogs and cats with the top tabs, and tap a name chip to switch pets â€” up to 10 per species." },
      { title: "9. Reading the growth chart", body: "The red dot marks your pet's current spot. The green band is a reference healthy range (Â±15% of the prediction) â€” stepping outside it adds a vertical line and a warning note to the chart." },
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
    migrationTitle: "Looks like you had pets registered before ðŸ¾",
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
    heroAgeLabel: (breedName, ageText) => `${breedName} Â· currently ${ageText}`,
    heroLabel: (adultWord) => `Predicted ${adultWord} weight`,
    heroLikelyPrefix: "Most likely range: about",
    heroDisclaimer: "Individual growth rates vary a lot â€” this is a reference estimate, not a fixed number.",
    chartTitle: "Growth chart by age",
    chartLegend: "Bold dot = current point",
    chartBandLegend: "Green band = reference healthy range (Â±15% of prediction)",
    chartOutsideBand: "âš  Current weight is outside the healthy range. If you're concerned, please consult a vet.",
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
    recordDeleteMsg: (date, weight) => `This will delete the ${date} Â· ${weight}kg record. This can't be undone.`,
    recordUpdated: (prev, next) => `Adult estimate updated: ${prev}kg â†’ ${next}kg`,
    diffUp: (g) => `Growing +${g}g faster than predicted`,
    diffDown: (g) => `Growing ${g}g slower than predicted`,
    diffFlat: "Growing about as predicted"Û]µçkh‘éì¶»§q«^vÊTˆÑ¥Ñ±”ô‹¶>³²vã¶*àƒ²‚®šôƒ®Â§®ÊTˆ½¹±¥¬õì ¤ôùÍ•Ñ!•±Á=Á•¸¡Øôø…Ø¥ôøüð½‰ÕÑÑ½¸øñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµ¡•…ˆøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµ‰…±…¹”µÝÉ…ÀˆøñÍµ…±°ùAQA=%9Pƒ
Ü1%Yð½Íµ…±°øñ Èû¶b²z°ƒ¶>³²vã¶*àð½ Èøð½‘¥ØøñÍÑÉ½¹œ±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµ‰¥œµ‰…±…¹”ˆùí9Õµ‰•È¡¹‰…±…¹•ñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥ôñ•´ù@ð½•´øð½ÍÑÉ½¹œøð½‘¥Øùì…½µÁ…Ð˜˜ðøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµµ¥¹¤µÍÑ…ÑÌˆøñ‘¥Ø±…ÍÍ9…µ”ô‰Á±ÕÌˆøñÍµ…±°û²b“®*`ƒ²‚®šôð½Íµ…±°øñˆø­í9Õµ‰•È¡¹Ñ½‘…å…É¹•‘ñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ð½ˆøð½‘¥Øøñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¹ÕÌˆøñÍµ…±°û²b“®*`ƒ²
³²j¤ð½Íµ…±°øñˆøµí9Õµ‰•È¡¹Ñ½‘…åMÁ•¹ÑñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ð½ˆøð½‘¥Øøð½‘¥Øøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµ½ÍÑÌµÍ¥µÁ±”ˆøñÍÁ…¸ûÂ~2“¾â<ƒ²jÓ²à€ñˆùí¹½ÍÑÌü¹Í…©Õ}‘…¥±åñðÈÁõ@ð½ˆøð½ÍÁ…¸øñÍÁ…¸ûÂ~R¸ƒ²
³²Žð€ñˆùí¹½ÍÑÌü¹Í…©Õ}‰…Í¥ñðÔÁõ@ð½ˆøð½ÍÁ…¸øñÍÁ…¸ûÂ~®ØƒªÚ¶V¤€ñˆùí¹½ÍÑÌü¹Í…©Õ}½µÁ…ÑñðÐÁõ@ð½ˆøð½ÍÁ…¸øñÍÁ…¸ûÂ~<ƒ¶®†p€ñˆùí¹½ÍÑÌü¹Ñ…É½ÑñðÌÁõ@ð½ˆøð½ÍÁ…¸øð½‘¥Øùí¡•±Á=Á•¸˜˜ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµ¡•±ÀµÁ…¹•°ˆøñ Ìû¶>³²vã¶*ã®*Pƒ²ZÓ®ZïªÊ0ƒ®ª£²V²jPüð½ Ìùì¡¹•…É¹Õ¥‘•ññmt¤¹µ…À ¡à±¤¤ôøñÀ­•äõí¥ôøñˆø­íà¹Á½¥¹ÑÍõ@ð½ˆøñÍÁ…¸ùíà¹±…‰•±ôð½ÍÁ…¸øñÍµ…±°ùíà¹±¥µ¥Ñôð½Íµ…±°øð½Àø¥ôð½‘¥Øùôð¼ùõíÑ½…ÍÐ˜˜ñ‘¥Ø±…ÍÍ9…µ”õíÁ•ÑÁ½¥¹ÐµÑ½…ÍÐ€‘í9Õµ‰•È¡Ñ½…ÍÐ¹…µ½Õ¹Ð¤øôÀü‰Á±ÕÌˆè‰µ¥¹ÕÌ‰õôøñˆùí9Õµ‰•È¡Ñ½…ÍÐ¹…µ½Õ¹Ð¤øôÀý€¬‘í9Õµ‰•È¡Ñ½…ÍÐ¹…µ½Õ¹Ð¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ƒ²‚®šõ€é€‘í9Õµ‰•È¡Ñ½…ÍÐ¹…µ½Õ¹Ð¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ƒ²
³²j¥ôð½ˆøñÍÁ…¸ùíÑ½…ÍÐ¹±…‰•±ñð‰A•ÑA½¥¹Ð‰õíÑ½…ÍÐ¹‰…±…¹”„õ¹Õ±°ý€ƒ
Üƒ²zS²V„€‘í9Õµ‰•È¡Ñ½…ÍÐ¹‰…±…¹”¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õA€èˆ‰ôð½ÍÁ…¸øð½‘¥Øùôð½Í•Ñ¥½¸ø)ô)™Õ¹Ñ¥½¸A•ÑA½¥¹ÑA½±¥å‘‘•¹‘Õ´¡íÑåÁ•ô¥íÉ•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰‰œµ…ÉÁ•ÑÁ½¥¹ÐµÁ½±¥äˆøñ ÈûÂ~BøA•ÑA½¥¹Ðƒ²jÓ²bƒ²V#®
Ðð½ ÈøñÀùA•ÑA½¥¹Ó®*PA•ÑÉ½Üƒ²s®æ²*ƒ²V#²^C²s®ž0ƒ²
³²j§¶Vc®*Pƒ®²Ó®Ž0ƒ¶fs®>dƒ¶>³²vã¶*ã²vÓ®¦Àƒ¶bªâ#²ró®†pƒªÖ³®ž“
ß¶fc²‚
ß²Úsªâ#¶VcªÆÃ®
`ƒ®.“®–àƒ²
³®z3²^CªÊ0ƒ²ZG®>¶V€ƒ²"`ƒ²^²ZÓ²jP¸ƒ²Ê¬ƒ²vÓ²j¤ƒ².pƒªâÃ®Îàƒ¶>³²vã¶*ãªÂ ƒ²žªâ'®BcªÎ€A•Ó¶„ƒªâ
ß®2Oªâ
ß²Š/²V²jPƒ®ÂoªâÃ
ß¶Vc®Ž ƒ²Ê¬ƒ²‚G²4ƒ®NÄƒ²‚W²²‚²vàƒ¶fs®>g²^@ƒ®RÃ®vðƒ¶>³²vã¶*ãªÂ ƒ²‚®š÷®B€ƒ²"`ƒ²z#²ZÓ²jP¸ð½ÀøñÀùA•Ó²
³²Žó
ß²b“®*c²v`ƒ¶:¯²jÓ²ã
ß®ÎÓ¶bã²z@ƒªÚ¶V¤ƒ®NÄƒ²vó®Ú ƒ²z³®¾àƒ²öc¶C²â€ƒ²vÓ²j¤ƒ².pƒ²V#®
Ó®Bpƒ¶>³²vã¶*ãªÂ ƒ²Â£ªÂC®B§®.#®.¸ƒ®Âc®ÎÔƒ®>®ÂÃ
ß²Š/²V²jPƒ²Þ£²0ƒ¶nƒ²z³²Š/²V²jPƒ®NÄƒ®æ²‚W²ƒ¶fs®>g²ró®†s®*Pƒ²’G®ÎÔƒ²‚®š÷®Bc²ž ƒ²V+²ró®¦À°ƒ®Ú²‚Tƒ²‚®š÷²v ƒ²žªâ$ƒ²Þ£²0ƒ®bC®*Pƒ¶j3²"c®B€ƒ²"`ƒ²z#²ZÓ²jP¸ƒªÂg²v ƒªÊ3².sªâ²v`ƒ®2Oªâ ƒ²‚®š÷ªÎðƒªÂg²v ƒªâ
ßªÂg²v ƒ²vÓ²j§²zC²v`ƒ²Š/²V²jPƒ®ÎÓ²²v ƒ²Ös²Ò €Ç¶j3®ž0ƒ²vã²‚W®>ó²jP¸ð½ÀùíÑåÁ”ôôô‰ÁÉ¥Ù…äˆ˜˜ñÀ±…ÍÍ9…µ”ô‰‰œµÍÕˆˆû¶>³²vã¶*àƒ²jÓ²b²vƒ²r¶VÐƒ¶j3²n@ƒ®
Ó®Ú ƒ².w®Î²z@°ƒ²‚®š÷
ß²
³²j¤ƒ²
³²r€°ƒ²šwªÂ@ƒ¶>³²vã¶*à°ƒ²Êc®š°ƒ².sªÂªÎðƒ¶fs®>dƒ²Âã²†ÃªÂK²vƒªÎ²‚W²^@ƒ²^ÃªÊÃ¶VÐƒ²‚²z—¶Vc®¦Àƒ¶j3²nC¶#¶Ðƒ².pƒªÒªÎƒ®ÊW®‚ç²ƒ®ÎÓªÒ ƒ²vc®²ÓªÂ ƒ²z#®*PƒªÊ÷²jÃ®–ðƒ²‚s²fã¶VcªÎ€ƒ²
·²‚s¶V§®.#®.¸ð½Àùôð½Í•Ñ¥½¸ùô)™Õ¹Ñ¥½¸A•ÑA½¥¹Ñ‰½ÕÑ…É ¥íÉ•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰‰œµ…ÉÁ•ÑÁ½¥¹Ðµ…‰½ÕÐˆøñÍÁ…¸ûÂ~Bøð½ÍÁ…¸øñ‘¥ØøñÍµ…±°ù=55U9%QdI]Ið½Íµ…±°øñ Èû¶fs®>g²vÐƒ¶bs¶w²vÐƒ®Bc®*PA•ÑA½¥¹Ðð½ ÈøñÀùA•Ó¶‡²^C²pƒ²vÓ²VóªâÃ®–ðƒ®
c®"ªÎ€ƒ®2Oªâ²vƒ®
£ªâÃ®¦Àƒ¶>³²vã¶*ã®–ðƒ®ª£²VA•Ó²
³²Žó
ß²jÓ²àƒªÂg²v ƒ²z³®¾àƒ²öc¶C²âƒ®–ðƒ²šCªâàƒ²"`ƒ²z#²ZÓ²jP¸ƒ²rƒ®Ž0ƒ²Ú§²‚ƒ²^²vÐA•ÑÉ½Üƒ²V#²v`ƒªÆÓªÂW¶Vpƒ²Âã²^³®–ðƒ®ÎÓ²¶Vc®*Pƒ®Â§².w²vÓ²^C²jP¸ð½Àøð½‘¥Øøð½Í•Ñ¥½¸ùô)™Õ¹Ñ¥½¸A•ÑA½¥¹ÑÕ¥‘•…É ¥íÉ•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰‰œµ…ÉÁ•ÑÁ½¥¹ÐµÕ¥‘”µ¡•É¼ˆøñ‘¥ØøñÍµ…±°ùAQA=%9PU%ð½Íµ…±°øñ ÈûÂ~Bøƒ¶fs®>g¶VcªÎ€°ƒ®ª£²róªÎ€°ƒ²šCªÊ£²jPð½ ÈøñÀû²Êc²v0€Ä°ÀÀÁC®†pƒ².s²zG¶VcªÎ€A•Ó¶„ƒ¶fs®>gªÎðƒ¶Vc®Ž ƒ²Ê¬ƒ²‚G²7²ró®†pƒ¶>³²vã¶*ã®–ðƒ®ª£²vƒ²"`ƒ²z#²ZÓ²jP¸ƒ¶>³²vã¶*ã®*PA•ÑÉ½Üƒ²z³®¾àƒ²öc¶C²âƒ²^C²s®ž0ƒ²
³²j§®>ó²jP¸ð½Àøð½‘¥Øøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÁ½¥¹Ðµµ¥¹¤µÉ¥ˆøñÍÁ…¸øñˆø¬ÔÁ@ð½ˆøƒªâ ƒ²zG²Äð½ÍÁ…¸øñÍÁ…¸øñˆø¬ÈÁ@ð½ˆøƒ®2Oªâ ð½ÍÁ…¸øñÍÁ…¸øñˆø¬Õ@ð½ˆøƒ²Š/²V²jPƒ®ÂoªâÀð½ÍÁ…¸øñÍÁ…¸øñˆø¬ÌÁ@ð½ˆøƒ¶Vc®Ž ƒ²Ê¬ƒ²‚G²4ð½ÍÁ…¸øð½‘¥Øøð½Í•Ñ¥½¸ùô)™Õ¹Ñ¥½¸A•ÑA½¥¹Ñ‘µ¥¹=Ù•ÉÙ¥•Ü ¥í½¹ÍÐm±Í•ÑtõÕÍ•MÑ…Ñ”¡¹Õ±°¤íÕÍ•™™•Ð  ¤ôùí…Á¥)Í½¸ ˆ½…Á¤½Á½¥¹ÑÌý…Ñ¥½¸õ…‘µ¥¸ˆ¤¹Ñ¡•¸¡Í•Ñ¤¹…Ñ   ¤ôùíô¥ô±mt¤í¥˜ …¥É•ÑÕÉ¸¹Õ±°íÉ•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰‰œµ…ÉÁ•ÑÁ½¥¹Ðµ…‘µ¥¸ˆøñ ÈûÂ~BøA•ÑA½¥¹Ðƒ²jÓ²bƒ¶b¶f¤ð½ Èøñ‘¥ØøñÍÁ…¸øñÍµ…±°û¶>³²vã¶*àƒ¶j3²n@ð½Íµ…±°øñˆùí9Õµ‰•È¡¹ÕÍ•ÉÍñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥ôð½ˆøð½ÍÁ…¸øñÍÁ…¸øñÍµ…±°û¶b²z°ƒ²zS²V„ƒ¶V§ªÎð½Íµ…±°øñˆùí9Õµ‰•È¡¹‰…±…¹•ñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ð½ˆøð½ÍÁ…¸øñÍÁ…¸øñÍµ…±°û®"²‚ƒ²‚®šôð½Íµ…±°øñˆø­í9Õµ‰•È¡¹•…É¹•‘ñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ð½ˆøð½ÍÁ…¸øñÍÁ…¸øñÍµ…±°û®"²‚ƒ²
³²j§
ß¶j3²"`ð½Íµ…±°øñˆøµí9Õµ‰•È¡¹ÍÁ•¹ÑñðÀ¤¹Ñ½1½…±•MÑÉ¥¹œ ¥õ@ð½ˆøð½ÍÁ…¸øð½‘¥Øøð½Í•Ñ¥½¸ùô()™Õ¹Ñ¥½¸½Õ¹ÑÑ¥Ù¥Ñå!Õˆ¡í±…¹ô¥ì(€½¹ÍÐm¥Ñ•µÌ±Í•Ñ%Ñ•µÍtõÕÍ•MÑ…Ñ”¡mt¤±m±½…‘¥¹œ±Í•Ñ1½…‘¥¹tõÕÍ•MÑ…Ñ”¡ÑÉÕ”¤ì(€½¹ÍÐ±½…õ…Íå¹Œ ¤ôùíÍ•Ñ1½…‘¥¹œ¡ÑÉÕ”¤íÑÉåí½¹ÍÐ¨õ…Ý…¥Ð…Á¥)Í½¸ ˆ½…Á¤½…Ñ¥Ù¥Ñäý…Ñ¥½¸õÑ¥µ•±¥¹”ˆ¤íÍ•Ñ%Ñ•µÌ¡¨¹¥Ñ•µÍññmt¥õ…Ñ¡íÍ•Ñ%Ñ•µÌ¡mt¥õ™¥¹…±±åíÍ•Ñ1½…‘¥¹œ¡™…±Í”¥õôì(€ÕÍ•™™•Ð  ¤ôùí±½… ¥ô±mt¤ì(€½¹ÍÐ¥½¸õÐôùMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰¹•ÝÌˆ¤ü‹Â~NÀˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰µÕÍ¥Œˆ¤ü‹Â~:ÔˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰Á•ÑÑ…±¬ˆ¤ü‹Â~J°ˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰ÍÕÁÁ½ÉÐˆ¤ü‹Šr'¾â<ˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰É•Á½ÉÐˆ¤ü‹Â~j¤ˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰Ñ…É½Ðˆ¤ü‹Â~<ˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰Í…©Ôˆ¤ü‹Â~R¸ˆéMÑÉ¥¹œ¡Ññðˆˆ¤¹ÍÑ…ÉÑÍ]¥Ñ  ‰¹•…É‰äˆ¤ü‹Â~N4ˆè‹Â~Bøˆì(€½¹ÍÐÑ¥Ñ±”õ±…¹œôôô‰©„ˆü‹šr¢þGŽ»Ž
‹Ž
¿ŽŽ
ŽOŽŽ
Œˆé±…¹œôôô‰é ˆü‹šr¢þGšÒï–* ˆé±…¹œôôô‰•¸ˆü‰I••¹Ð…Ñ¥Ù¥Ñäˆè‹²‚²ÊÐƒ¶fs®>g®
Ó²^´ˆì(€É•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰µäµ…Ñ¥Ù¥Ñäµ¡Õˆˆøñ‘¥Ø±…ÍÍ9…µ”ô‰µäµ…Ñ¥Ù¥Ñäµ¡Õˆµ¡•…ˆøñ‘¥Øøñ ÈùíÑ¥Ñ±•ôð½ ÈøñÍµ…±°±…ÍÍ9…µ”ô‰‰œµÍÕˆˆùA•ÑÉ½Üƒ®¦S®&Ðƒ²vÓ²j§
ßªâ
ß®2Oªâ
ß²Š/²V²jS
ß².ƒªÎƒ
ß®²ã²v`ƒ®NÇ²vƒ²ÖsªÞó²"s²ró®†pƒ¶fW²vã¶VÓ²jP¸ð½Íµ…±°øð½‘¥Øøñ‰ÕÑÑ½¸½¹±¥¬õí±½…‘ôùí±½…‘¥¹œü‹Š˜ˆè‹²#®†sªÎƒ²æ ‰ôð½‰ÕÑÑ½¸øð½‘¥Øùí±½…‘¥¹œ˜˜…¥Ñ•µÌ¹±•¹Ñ üñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµÍÕˆˆû¶fs®>g®
Ó²^·²vƒ®Ú#®~³²b“®*Pƒ²’GŠ˜ð½‘¥Øøé¥Ñ•µÌ¹±•¹Ñ üñ‘¥Ø±…ÍÍ9…µ”ô‰µäµ…Ñ¥Ù¥ÑäµÑ¥µ•±¥¹”ˆùí¥Ñ•µÌ¹Í±¥” À°ÐÀ¤¹µ…À ¡à±¤¤ôøñ‘¥Ø±…ÍÍ9…µ”ô‰µäµ…Ñ¥Ù¥ÑäµÉ½Üˆ­•äõí€‘íà¹ÑåÁ•ô´‘íà¹É•…Ñ•‘Ñô´‘í¥õôøñÍÁ…¸ùí¥½¸¡à¹ÑåÁ”¥ôð½ÍÁ…¸øñ‘¥Øøñˆùíà¹Ñ¥Ñ±•ñð‰A•ÑÉ½Üƒ¶fs®>d‰ôð½ˆùíà¹‘•Ñ…¥°˜˜ñÍµ…±°ùíà¹‘•Ñ…¥±ôð½Íµ…±°ùôð½‘¥ØøñÑ¥µ”ùíà¹É•…Ñ•‘Ðý¹•Ü…Ñ”¡à¹É•…Ñ•‘Ð¤¹Ñ½1½…±•MÑÉ¥¹œ¡±…¹œôôô‰©„ˆü‰©„µ)@ˆé±…¹œôôô‰é ˆü‰é µ8ˆé±…¹œôôô‰•¸ˆü‰•¸µULˆè‰­¼µ-Hˆ±íµ½¹Ñ è‰¹Õµ•É¥Œˆ±‘…äè‰¹Õµ•É¥Œˆ±¡½ÕÈèˆÈµ‘¥¥Ðˆ±µ¥¹ÕÑ”èˆÈµ‘¥¥Ð‰ô¤èˆ‰ôð½Ñ¥µ”øð½‘¥Øø¥ôð½‘¥Øøèñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµÍÕˆˆû²V²žƒªâÃ®†w®Bpƒ¶fs®>g²vÐƒ²^²ZÓ²jP¸ƒ²V{²ró®†pƒ²vÓ²j§¶Vpƒ®¦S®&Ó²f ƒ¶fs®>g²vÐƒ²^³ªâÃ²^@ƒ²2O²^³²jP¸ð½‘¥Øùôð½Í•Ñ¥½¸ø)ô()™Õ¹Ñ¥½¸5åA…”¡í…½Õ¹Ð±…±±A•ÑÌ±±…¹œ±½¹=Á•¹½Õ¹Ð±½¹½A•ÑÌ±½¹=Á•¹A½ÍÐ±½¹=Á•¹‘µ¥¸±½¹1½½ÕÐ±½¹•±•Ñ•½Õ¹Ð±½¹½MÕÁÁ½ÉÑô¥ì(€½¹ÍÐm…‘µ¥¹¹ÑÉä±Í•Ñ‘µ¥¹¹ÑÉåtõÕÍ•MÑ…Ñ”¡¹Õ±°¤±m±¥­•‘5ÕÍ¥Œ±Í•Ñ1¥­•‘5ÕÍ¥tõÕÍ•MÑ…Ñ”¡mt¤±m±¥­•‘5ÕÍ¥1½…‘•±Í•Ñ1¥­•‘5ÕÍ¥1½…‘•‘tõÕÍ•MÑ…Ñ”¡™…±Í”¤±m±¥­•‘5ÕÍ¥1½…‘¥¹œ±Í•Ñ1¥­•‘5ÕÍ¥1½…‘¥¹tõÕÍ•MÑ…Ñ”¡™…±Í”¤±m½Á•¹Ñ¥Ù¥Ñä±Í•Ñ=Á•¹Ñ¥Ù¥ÑåtõÕÍ•MÑ…Ñ”¡¹Õ±°¤ì(€½¹ÍÐ±½…‘1¥­•‘5ÕÍ¥Œõ…Íå¹Œ¡™½É”õ™…±Í”¤ôùí¥˜ ……½Õ¹Ð¥íÍ•Ñ1¥­•‘5ÕÍ¥Œ¡mt¤íÍ•Ñ1¥­•‘5ÕÍ¥1½…‘•¡ÑÉÕ”¤íÉ•ÑÕÉ¹õ¥˜¡±¥­•‘5ÕÍ¥1½…‘¥¹ñð¡±¥­•‘5ÕÍ¥1½…‘•˜˜…™½É”¤¥É•ÑÕÉ¸íÍ•Ñ1¥­•‘5ÕÍ¥1½…‘¥¹œ¡ÑÉÕ”¤íÑÉåí½¹ÍÐÈõ…Ý…¥ÐµÕÍ¥1¥­• ¤íÍ•Ñ1¥­•‘5ÕÍ¥Œ¡È¹¥Ñ•µÍññmt¤íÍ•Ñ1¥­•‘5ÕÍ¥1½…‘•¡ÑÉÕ”¥õ…Ñ¡íõ™¥¹…±±åíÍ•Ñ1¥­•‘5ÕÍ¥1½…‘¥¹œ¡™…±Í”¥õôì(€ÕÍ•™™•Ð  ¤ôùíÍ•Ñ1¥­•‘5ÕÍ¥Œ¡mt¤íÍ•Ñ1¥­•‘5ÕÍ¥1½…‘•¡™…±Í”¤íÍ•Ñ=Á•¹Ñ¥Ù¥Ñä¡¹Õ±°¥ô±m…½Õ¹Ðü¹¥‘t¤ì(€ÕÍ•™™•Ð  ¤ôùí±•Ð…±¥Ù”õÑÉÕ”í¥˜ ……½Õ¹Ð¥íÍ•Ñ‘µ¥¹¹ÑÉä¡¹Õ±°¤íÉ•ÑÕÉ¸ ¤ôùí…±¥Ù”õ™…±Í•õõ…‘µ¥¹MÑ…ÑÕÌ ¤¹Ñ¡•¸¡ÍÐôùí¥˜¡…±¥Ù”¥Í•Ñ‘µ¥¹¹ÑÉä¡ÍÐ¥ô¤¹…Ñ   ¤ôùí¥˜¡…±¥Ù”¥Í•Ñ‘µ¥¹¹ÑÉä¡¹Õ±°¥ô¤íÉ•ÑÕÉ¸ ¤ôùí…±¥Ù”õ™…±Í•õô±m…½Õ¹Ðü¹¥‘t¤ì(€½¹ÍÐÑ½±•A•ÑQ…±¬ô ¤ôùÍ•Ñ=Á•¹Ñ¥Ù¥Ñä¡ØôùØôôô‰Á•ÑÑ…±¬ˆý¹Õ±°è‰Á•ÑÑ…±¬ˆ¤ì(€½¹ÍÐÑ½±•5ÕÍ¥Œô ¤ôùí½¹ÍÐàõ½Á•¹Ñ¥Ù¥Ñä„ôô‰µÕÍ¥ŒˆíÍ•Ñ=Á•¹Ñ¥Ù¥Ñä¡àü‰µÕÍ¥Œˆé¹Õ±°¤í¥˜¡à¥±½…‘1¥­•‘5ÕÍ¥Œ¡ÑÉÕ”¥ôì(€É•ÑÕÉ¸€ñ‘¥ØÍÑå±”õííµ…á]¥‘Ñ èÜØÀ±µ…É¥¸èˆÀ…ÕÑ¼ˆ±Á…‘‘¥¹œèˆÀ€ÈÁÁà€ÜÁÁà‰õôø(€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µäµÁ…”µ¡•…ˆøñ‘¥Øøñ‘¥Ø±…ÍÍ9…µ”ô‰µäµÁ…”µ­¥­•Èˆù5dAQI=\ð½‘¥Øøñ Äùí±…¹œôôô‰©„ˆü‹Ž{Ž
“ŽkŽóŽ
àˆé±…¹œôôô‰é ˆü‹š"Gžj¦†×¦vˆˆé±…¹œôôô‰•¸ˆü‰5äA…”ˆè‹®ž#²vÓ¶:c²vÓ²ž ‰ôð½ ÄøñÀÍÑå±”õíí™½¹ÑM¥é”èÄÍõôùí±…¹œôôô‰•¸ˆü‰e½ÕÈA•ÑÉ½Ü…½Õ¹Ð…¹…Ñ¥Ù¥Ñä¡Õˆ¸ˆè‹ªÎ²‚W
ß²jÃ®š°ƒ²V²vÓ
ß¶>³²vã¶*ã
ß¶fs®>g®
Ó²^·²vƒ¶VsªÎÏ²^C²pƒªÒ®š³¶VÓ²jP¸‰ôð½Àøð½‘¥ØøñÍÁ…¸±…ÍÍ9…µ”ô‰µäµÁ…”µ¡•…µ¥½¸ˆÍÑå±”õíí™½¹ÑM¥é”èÄØ±™½¹Ñ]•¥¡ÐèäÔÁõôù5dð½ÍÁ…¸øð½‘¥Øø(€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰µåÁ…”µÁ•ÑÁ½¥¹ÐµÍ•Ñ¥½¸ˆøñA•ÑA½¥¹Ñ…Í¡‰½…É€¼øð½Í•Ñ¥½¸ø(€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µäµµ•¹ÔµÉ¥µäµµ•¹ÔµÉ¥µÑ½Àˆøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµäµµ•¹ÔµÁ¥¹¬ˆ½¹±¥¬õí½¹=Á•¹½Õ¹ÑôøñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ¥½¸ˆûŠr?¾â<ð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ½ÁäˆøñÍÑÉ½¹œû²‚W®ÎÐƒ²"c²‚Tð½ÍÑÉ½¹œøñÍµ…±°û®.'®“²zªÎðƒªÎ²‚Tƒ²‚W®ÎÓ®–ðƒªÒ®š³¶VÓ²jP¸ð½Íµ…±°øð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ…ÉÉ½ÜˆûŠèð½ÍÁ…¸øð½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµäµµ•¹Ôµ‰±Õ”ˆ½¹±¥¬õí½¹½A•ÑÍôøñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ¥½¸ˆûÂ~Bøð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ½ÁäˆøñÍÑÉ½¹œû®Âc®‚“®>g®²ðƒªÒ®š°ð½ÍÑÉ½¹œøñÍµ…±°û®NÇ®†w¶Vpƒ²V²vÐí…±±A•ÑÌ¹±•¹Ñ¡÷®ž#®š³®–ðƒªÒ®š³¶VÓ²jP¸ð½Íµ…±°øð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ…ÉÉ½ÜˆûŠèð½ÍÁ…¸øð½‰ÕÑÑ½¸øð½‘¥Øø(€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µäµ…Ñ¥Ù¥ÑäµÍÑ…¬ˆøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õíµäµµ•¹Ôµ…Éµäµµ•¹ÔµÁÕÉÁ±”µäµµ•¹Ôµ…ÉµÝ¥‘”‘í½Á•¹Ñ¥Ù¥Ñäôôô‰Á•ÑÑ…±¬ˆüˆ¥Ìµ½Á•¸ˆèˆ‰õô½¹±¥¬õíÑ½±•A•ÑQ…±­ôøñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ¥½¸ˆûÂ~J°ð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ½ÁäˆøñÍÑÉ½¹œùA•Ó¶„ƒ®
Ðƒ¶fs®>dð½ÍÑÉ½¹œøñÍµ…±°û®
Ðƒªâ
ß®2Oªâ
ß²Š/²V²jS®–ðƒ¶fW²vã¶VÓ²jP¸ð½Íµ…±°øð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ…ÉÉ½Üˆùí½Á•¹Ñ¥Ù¥Ñäôôô‰Á•ÑÑ…±¬ˆü‹Š2ˆè‹Šè‰ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€í½Á•¹Ñ¥Ù¥Ñäôôô‰Á•ÑÑ…±¬ˆ˜˜ñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµ…Éµäµ…Ñ¥Ù¥Ñäµ…Éµäµ…½É‘¥½¸µÁ…¹•°ˆøñ5åÑ¥Ù¥ÑåA…”±…¹œõí±…¹ô½¹=Á•¹A½ÍÐõí½¹=Á•¹A½ÍÑô•µ‰•‘‘•€¼øð½‘¥Øùô(€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õíµäµµ•¹Ôµ…Éµäµµ•¹Ôµµ¥¹Ðµäµµ•¹Ôµ…ÉµÝ¥‘”‘í½Á•¹Ñ¥Ù¥Ñäôôô‰µÕÍ¥Œˆüˆ¥Ìµ½Á•¸ˆèˆ‰õô½¹±¥¬õíÑ½±•5ÕÍ¥ôøñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ¥½¸ˆûŠv“¾â<ð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ½ÁäˆøñÍÑÉ½¹œû²Š/²V²jS¶VpA•Ó²v3²Vð½ÍÑÉ½¹œøñÍµ…±°û®
ÓªÂ ƒ²Š/²V²jS¶Vpƒ²v3²V²vƒ¶fW²vã¶VÓ²jP¸ð½Íµ…±°øð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”ô‰µäµµ•¹Ôµ…Éµ…ÉÉ½Üˆùí½Á•¹Ñ¥Ù¥Ñäôôô‰µÕÍ¥Œˆü‹Š2ˆè‹Šè‰ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€í½Á•¹Ñ¥Ù¥Ñäôôô‰µÕÍ¥Œˆ˜˜ñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµ…Éµäµ…Ñ¥Ù¥Ñäµ…Éµäµ…½É‘¥½¸µÁ…¹•°ˆùí±¥­•‘5ÕÍ¥1½…‘¥¹œ˜˜…±¥­•‘5ÕÍ¥1½…‘•üñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµÍÕˆˆû®Ú#®~³²b“®*Pƒ²’GŠ˜ð½‘¥Øøé±¥­•‘5ÕÍ¥Œ¹±•¹Ñ üñ‘¥ØÍÑå±”õíí‘¥ÍÁ±…äè‰É¥ˆ±…Àèáõôùí±¥­•‘5ÕÍ¥Œ¹Í±¥” À°ÈÀ¤¹µ…À¡àôøñ‘¥Ø­•äõíà¹¥‘ô±…ÍÍ9…µ”ô‰µäµ±¥­•µµÕÍ¥ŒµÉ½Üˆùíà¹½Ù•É}ÕÉ°üñ¥µœÍÉŒõíà¹½Ù•É}ÕÉ±ô…±Ðôˆˆ±½…‘¥¹œô‰±…éäˆ¼øèñÍÁ…¸ûÂ~:Ôð½ÍÁ…¸ùôñ‘¥Øøñˆùíà¹Ñ¥Ñ±•ôð½ˆøñÍµ…±°ûŠf”í9Õµ‰•È¡à¹±¥­•}½Õ¹Ð¥ñðÁôð½Íµ…±°øð½‘¥Øøð½‘¥Øø¥ôð½‘¥Øøèñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµÍÕˆˆû²V²žƒ²Š/²V²jS¶Vpƒ²v3²V²vÐƒ²^²ZÓ²jP¸ð½‘¥Øùôð½‘¥Øùô(€€€€€€ñA•Ñ…¥±å!¥ÍÑ½Éä…½Õ¹Ðõí…½Õ¹Ñô±…¹œõí±…¹ô€¼ø(€€€€ð½‘¥Øø(€€€€ñ½Õ¹ÑÑ¥Ù¥Ñå!Õˆ±…¹œõí±…¹ô¼ø(€€€í…‘µ¥¹¹ÑÉä˜˜ ……‘µ¥¹¹ÑÉä¹…‘µ¥¹á¥ÍÑÍññ…‘µ¥¹¹ÑÉä¹¥Í‘µ¥¹ññ…‘µ¥¹¹ÑÉä¹É•½Ù•ÉåÙ…¥±…‰±”¤˜˜ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µäµ…‘µ¥¸µ‰•±½Üµ…Ñ¥Ù¥Ñäˆ½¹±¥¬õí½¹=Á•¹‘µ¥¹ôøñÍÁ…¸ûÂ~n‡¾â<ð½ÍÁ…¸øñ‘¥Øøñˆùí…‘µ¥¹¹ÑÉä¹¥Í‘µ¥¸ü‹ªÒ®š³²zC²ó¶Àˆè¡…‘µ¥¹¹ÑÉä¹…‘µ¥¹á¥ÍÑÌü‹ªÒ®š³²z@ƒ®NÇ®†t¿®Î×ªÖ°ˆè‹²Ös²Ò ƒªÒ®š³²z@ƒ®NÇ®†tˆ¥ôð½ˆøñÍµ…±°û²jÓ²bƒ®6Ã²vÓ¶Ã®*PA%8ƒ²vã²štƒ¶nƒ¶fW²vã¶V€ƒ²"`ƒ²z#²ZÓ²jP¸ð½Íµ…±°øð½‘¥Øøñ•´ûŠèð½•´øð½‰ÕÑÑ½¸ùô(€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰µäµ…½Õ¹Ðµµ…¹…”ˆøñ ÈûªÎ²‚TƒªÒ®š°ð½ Èøñ‘¥Ø±…ÍÍ9…µ”ô‰µäµ…½Õ¹Ðµ…Ñ¥½¹Ìˆøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰±½½ÕÐˆ½¹±¥¬õí½¹1½½ÕÑôû®†sªÞã²V²nð½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰‘•±•Ñ”ˆ½¹±¥¬õí½¹•±•Ñ•½Õ¹Ñôû¶j3²nC¶#¶Ðð½‰ÕÑÑ½¸øð½‘¥Øùí½¹½MÕÁÁ½ÉÐ˜˜ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰‰œµ‰Ñ¸‰œµ‰Ñ¸µ¡½ÍÐˆÍÑå±”õííÝ¥‘Ñ èˆÄÀÀ”ˆ±µ…É¥¹Q½Àèáõô½¹±¥¬õí½¹½MÕÁÁ½ÉÑôû®
Ðƒ®²ã²v`ƒ
ÜƒªÎƒªÂw²ž²n@ƒ¶fW²vàð½‰ÕÑÑ½¸ùôð½Í•Ñ¥½¸ø(€€ð½‘¥Øø)ô()±…ÍÌA•ÑQ…±­ÉÉ½É	½Õ¹‘…Éä•áÑ•¹‘ÌI•…Ð¹½µÁ½¹•¹Ðì(€½¹ÍÑÉÕÑ½È¡ÁÉ½ÁÌ¥íÍÕÁ•È¡ÁÉ½ÁÌ¤íÑ¡¥Ì¹ÍÑ…Ñ”õí•ÉÉ½Èé™…±Í•ôíô(€ÍÑ…Ñ¥Œ•Ñ•É¥Ù•‘MÑ…Ñ•É½µÉÉ½È ¥íÉ•ÑÕÉ¸í•ÉÉ½ÈéÑÉÕ•ôíô(€½µÁ½¹•¹Ñ¥‘…Ñ ¡•ÉÈ¥í½¹Í½±”¹•ÉÉ½È ‰A•ÑQ…±¬É•¹‘•È•ÉÉ½Èˆ±•ÉÈ¤íô(€É•¹‘•È ¥íÉ•ÑÕÉ¸Ñ¡¥Ì¹ÍÑ…Ñ”¹•ÉÉ½ÈüñA•ÑQ…±­…±±‰…¬¼øéÑ¡¥Ì¹ÁÉ½ÁÌ¹¡¥±‘É•¸íô)ô)™Õ¹Ñ¥½¸A•ÑQ…±­…±±‰…¬ ¥ì(€½¹ÍÐm¥Ñ•µÌ±Í•Ñ%Ñ•µÍtõÕÍ•MÑ…Ñ”¡mt¤±m±½…‘¥¹œ±Í•Ñ1½…‘¥¹tõÕÍ•MÑ…Ñ”¡ÑÉÕ”¤±m•ÉÉ½È±Í•ÑÉÉ½ÉtõÕÍ•MÑ…Ñ” ˆˆ¤ì(€½¹ÍÐ±½…ô ¤ôùíÍ•Ñ1½…‘¥¹œ¡ÑÉÕ”¤íÍ•ÑÉÉ½È ˆˆ¤í™•Ñ  ˆ½…Á¤½½µµÕ¹¥Ñäý…Ñ¥½¸õÁ½ÍÑÌ™…Ñ•½Éäõ…±°™Í½ÉÐõ±…Ñ•ÍÐ™Á…”ôÄˆ±íÉ•‘•¹Ñ¥…±Ìè‰¥¹±Õ‘”‰ô¤¹Ñ¡•¸¡…Íå¹ŒÈôùí½¹ÍÐ¨õ…Ý…¥ÐÈ¹©Í½¸ ¤¹…Ñ   ¤ôø¡íô¤¤í¥˜ …È¹½¬¥Ñ¡É½Ü¹•ÜÉÉ½È¡¨ü¹µ•ÍÍ…•ññ¨ü¹•ÉÉ½ÉññA•Ó¶„ƒ²‚G²4ƒ²b“®–`€ ‘íÈ¹ÍÑ…ÑÕÍô¥€¤íÉ•ÑÕÉ¸¨íô¤¹Ñ¡•¸¡¨ôùÍ•Ñ%Ñ•µÌ¡¨¹Á½ÍÑÍññmt¤¤¹…Ñ ¡”ôùÍ•ÑÉÉ½È¡”¹µ•ÍÍ…•ñð‰A•Ó¶‡²vƒ®Ú#®~³²b“²ž ƒ®ªï¶Z#²ZÓ²jP¸ˆ¤¤¹™¥¹…±±ä  ¤ôùÍ•Ñ1½…‘¥¹œ¡™…±Í”¤¤íôì(€ÕÍ•™™•Ð  ¤ôùí±½… ¥ô±mt¤ì(€É•ÑÕÉ¸€ñ‘¥Ø±…ÍÍ9…µ”ô‰±•…°µÁ…”µÍ¡•±°Á•ÑÑ…±¬µÍ…™”µ™…±±‰…¬ˆøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÑ…±¬µ™…±±‰…¬µÑ½½±‰…ÈˆøñÍÁ…¸ûªÊ3².sªâ²vƒ®.“².pƒ®Ú#®~³²b°ƒ²"`ƒ²z#²ZÓ²jP¸ð½ÍÁ…¸øñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰œµ¡¥Àˆ½¹±¥¬õí±½…‘ôû²#®†sªÎƒ²æ ð½‰ÕÑÑ½¸øð½‘¥Øùí±½…‘¥¹œüñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÑ…±¬µÍÑ…Ñ”ˆùA•Ó¶‡²vƒ®Ú#®~³²b“®*Pƒ²’GŠ˜ð½‘¥Øøé•ÉÉ½Èüñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÑ…±¬µÍÑ…Ñ”•ÉÉ½ÈˆøñˆùA•Ó¶„ƒ²‚G²7²^@ƒ®²ã²‚sªÂ ƒ²z#²ZÓ²jP¸ð½ˆøñÍÁ…¸ùí•ÉÉ½Éôð½ÍÁ…¸øñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰œµ‰Ñ¸ˆ½¹±¥¬õí±½…‘ôû®.“².pƒ².s®>ð½‰ÕÑÑ½¸øð½‘¥Øøèñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÑ…±¬µ™…±±‰…¬µ±¥ÍÐˆùí¥Ñ•µÌ¹±•¹Ñ ý¥Ñ•µÌ¹µ…À¡Àôøñ‘¥Ø­•äõíÀ¹¥‘ô±…ÍÍ9…µ”ô‰‰œµ…ÉÁ•ÑÑ…±¬µ™…±±‰…¬µ¥Ñ•´ˆøñÍµ…±°ùíÀ¹…ÕÑ¡½É9¥­¹…µ•ñðA•ÑÉ½Üƒ¶j3²n@ôƒ
ÜíÀ¹Á•Ðü¹¹…µ•ñðŸ²jÃ®š°ƒ²V²vÐôð½Íµ…±°øñˆùíÀ¹Ñ¥Ñ±•ôð½ˆøñÀùíMÑÉ¥¹œ¡À¹½¹Ñ•¹Ññðœœ¤¹Í±¥” À°ÄàÀ¥ôð½Àøð½‘¥Øø¤èñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÑ…±¬µÍÑ…Ñ”ˆû²V²žƒ®NÇ®†w®BpA•Ó¶‡²vÐƒ²^²ZÓ²jP¸ð½‘¥Øùôð½‘¥Øùôð½‘¥Øøì)ô((¼¼…±±A•ÑÌèƒªÂW²V²ž ¯ªÎƒ²ZG²vÐƒ¶×¶V¤ƒ®ª§®†t°½¹½I•¥ÍÑ•Èèƒ®NÇ®†w®Bpƒ²V²vÓªÂ ƒ²^²vƒ®V0€Ÿ²jÃ®š°ƒ²V²vÐœƒ®NÇ®†w²ró®†pƒ®ÎÓ®
Ó®*Pƒ²ös®ÂÄ)™Õ¹Ñ¥½¸½µµÕ¹¥ÑåA…”¡ì…±±A•ÑÌ°…½Õ¹Ð°½¹½I•¥ÍÑ•Èô¤ì(€½¹ÍÐÐ€ôÕÍ•P ¤ì(€½¹ÍÐ±…¹œ€ôÕÍ•1…¹œ ¤ì(€½¹ÍÐmÍÕˆ°Í•ÑMÕ‰t€ôÕÍ•MÑ…Ñ” ‰™••ˆ¤ì€¼¼™••ð‘•Ñ…¥°ð½µÁ½Í”ð•‘¥Ððµä(€½¹ÍÐm…Ñ¥Ù•A½ÍÑ%°Í•ÑÑ¥Ù•A½ÍÑ%‘t€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì(€½¹ÍÐm•‘¥Ñ¥¹A½ÍÐ°Í•Ñ‘¥Ñ¥¹A½ÍÑt€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì((€½¹ÍÐ½Á•¹A½ÍÐ€ô€¡¥¤€ôøìÍ•ÑÑ¥Ù•A½ÍÑ%¡¥¤ìÍ•ÑMÕˆ ‰‘•Ñ…¥°ˆ¤ìôì(€½¹ÍÐ‰…­Q½••€ô€ ¤€ôøìÍ•ÑMÕˆ ‰™••ˆ¤ìÍ•ÑÑ¥Ù•A½ÍÑ%¡¹Õ±°¤ìôì((€¥˜€¡ÍÕˆ€ôôô€‰½µÁ½Í”ˆñðÍÕˆ€ôôô€‰•‘¥Ðˆ¤ì(€€€¥˜€¡ÍÕˆ€ôôô€‰½µÁ½Í”ˆ€˜˜…±±A•ÑÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€É•ÑÕÉ¸€ (€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…á]¥‘Ñ è€ÐÈÀ°µ…É¥¸è€ˆÀ…ÕÑ¼ˆ°Ñ•áÑ±¥¸è€‰•¹Ñ•Èˆõô±…ÍÍ9…µ”ô‰‰œµ…Éˆø(€€€€€€€€€€ñÀÍÑå±”õíì™½¹ÑM¥é”è€ÄÔ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€àõôùíÐ¹½µµÕ¹¥Ñå9••‘A•ÑQ¥Ñ±•ôð½Àø(€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰‰œµÍÕˆˆÍÑå±”õíì™½¹ÑM¥é”è€ÄÌ°µ…É¥¹	½ÑÑ½´è€ÄàõôùíÐ¹½µµÕ¹¥Ñå9••‘A•Ñ	½‘åôð½Àø(€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰œµ‰Ñ¸ˆÍÑå±”õíìÝ¥‘Ñ è€ˆÄÀÀ”ˆõô½¹±¥¬õí½¹½I•¥ÍÑ•ÉôùíÐ¹Í…©Õ½I•¥ÍÑ•É	Ñ¹ôð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€¤ì(€€€ô(€€€É•ÑÕÉ¸€ (€€€€€€ñA½ÍÑ½µÁ½Í•ÈÁ•ÑÌõí…±±A•ÑÍô¥¹¥Ñ¥…±A½ÍÐõíÍÕˆ€ôôô€‰•‘¥Ðˆ€ü•‘¥Ñ¥¹A½ÍÐ€è¹Õ±±ô(€€€€€€€½¹…¹•°õì ¤€ôøÍ•ÑMÕˆ¡ÍÕˆ€ôôô€‰•‘¥Ðˆ€ü€‰‘•Ñ…¥°ˆ€è€‰™••ˆ¥ô(€€€€€€€½¹M…Ù•õì ¤€ôøÍ•ÑMÕˆ ‰‘•Ñ…¥°ˆ¥ô€¼ø(€€€€¤ì(€ô((€¥˜€¡ÍÕˆ€ôôô€‰‘•Ñ…¥°ˆ€˜˜…Ñ¥Ù•A½ÍÑ%¤ì(€€€É•ÑÕÉ¸€ (€€€€€€ñA½ÍÑ•Ñ…¥°Á½ÍÑ%õí…Ñ¥Ù•A½ÍÑ%‘ôÁ•ÑÌõí…±±A•ÑÍô…½Õ¹Ðõí…½Õ¹Ñô(€€€€€€€½¹	…¬õí‰…­Q½••‘ô½¹•±•Ñ•õí‰…­Q½••‘ô(€€€€€€€½¹‘¥Ðõí…Íå¹Œ€ ¤€ôøì(€€€€€€€€€½¹ÍÐÀ€ô…Ý…¥Ð½µµÕ¹¥Ñå•ÑA½ÍÐ¡…Ñ¥Ù•A½ÍÑ%¤ì(€€€€€€€€€Í•Ñ‘¥Ñ¥¹A½ÍÐ¡À¤ì(€€€€€€€€€Í•ÑMÕˆ ‰•‘¥Ðˆ¤ì(€€€€€€€õô€¼ø(€€€€¤ì(€ô((€¥˜€¡ÍÕˆ€ôôô€‰µäˆ¤ì(€€€É•ÑÕÉ¸€ (€€€€€€ñ‘¥Øø(€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…á]¥‘Ñ è€äÀÀ°µ…É¥¸è€ˆÀ…ÕÑ¼ˆ°Á…‘‘¥¹œè€ˆÀ€ÈÁÁàˆõôø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí‰…­Q½••‘ô(€€€€€€€€€€€ÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°…Àè€Ð°‰…­É½Õ¹è€‰¹½¹”ˆ°‰½É‘•Èè€‰¹½¹”ˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•Èˆ°Á…‘‘¥¹œè€À°µ…É¥¹	½ÑÑ½´è€ÄÐ°™½¹ÑM¥é”è€ÄÌ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°½±½Èè€‰Ù…È ´µÍÕˆ¤ˆõôø(€€€€€€€€€€€ƒŠ@íÐ¹½µµÕ¹¥Ñå	…­ô(€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñ5åÑ¥Ù¥ÑåA…”±…¹œõí±…¹ô½¹=Á•¹A½ÍÐõí½Á•¹A½ÍÑô€¼ø(€€€€€€ð½‘¥Øø(€€€€¤ì(€ô((€É•ÑÕÉ¸€ (€€€€ñ‘¥Øø(€€€€€€ñ½µµÕ¹¥Ñå••Á•ÑÌõí…±±A•ÑÍô±…¹œõí±…¹ô½¹=Á•¹A½ÍÐõí½Á•¹A½ÍÑô½¹]É¥Ñ”õì ¤€ôøÍ•ÑMÕˆ ‰½µÁ½Í”ˆ¥ô½¹5åÑ¥Ù¥Ñäõì ¤€ôøÍ•ÑMÕˆ ‰µäˆ¥ô€¼ø(€€€€ð½‘¥Øø(€€¤ì)ô()½¹ÍÐ59U}!1@€ôì(€¡½µ”èì¥½¸è€‹Â~>€ˆ°­½Q¥Ñ±”è€‹¶f ˆ°­½	½‘äè€‹²jÃ®š°ƒ²V²vÓ²f A•ÑÉ½ß²v`ƒ²Žó²jPƒªâÃ®*—²vƒ¶Vs®"#²^@ƒ®ÎÓªÎ€ƒ²nC¶Vc®*Pƒ®¦S®&Ó®†pƒ®ÂS®†pƒ²vÓ®>g¶V€ƒ²"`ƒ²z#²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰!½µ”ˆ°•¹	½‘äè€‰M•”å½ÕÈÁ•ÑÌ…¹©ÕµÀ¥¹Ñ¼A•ÑÉ½Ü™•…ÑÕÉ•Ì™É½´½¹”Á±…”¸ˆô°(€…‰½ÕÐèì¥½¸è€‹Â~2Äˆ°­½Q¥Ñ±”è€‰A•ÑÉ½Üƒ²3ªÂpˆ°­½	½‘äè€‰A•ÑÉ½ßªÂ ƒ²ZÓ®Zƒ²s®æ²*“²vã²ž °ƒ²ZÓ®ZƒªâÃ®*—²vƒ²‚sªÎ×¶Vc®*S²ž ƒ¶Vs®"#²^@ƒ²
Ó¶:Ó®Îðƒ²"`ƒ²z#²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰‰½ÕÐA•ÑÉ½Üˆ°•¹	½‘äè€‰M•”Ý¡…ÐA•ÑÉ½Ü¥Ì…¹Ý¡…Ðå½Ô…¸‘¼¡•É”¸ˆô°(€Á•ÑÌèì¥½¸è€‹Â~Bøˆ°­½Q¥Ñ±”è€‹²jÃ®š°ƒ²V²vÐˆ°­½	½‘äè€‹®Âc®‚“®>g®²ðƒ²‚W®ÎÓ®–ðƒ®NÇ®†w¶VcªÎ€ƒ²ÊÓ²’G
ß²Ç²z—ªâÃ®†w
ß²
³²ž²vƒªúã²’¶z ƒªÒ®š³¶VÓ®ÎÓ²ã²jP¸ˆ°•¹Q¥Ñ±”è€‰5äA•ÑÌˆ°•¹	½‘äè€‰I•¥ÍÑ•Èå½ÕÈÁ•ÑÌ…¹µ…¹…”É½ÝÑ °Ý•¥¡Ð°…¹Á¡½Ñ½Ì¸ˆô°(€½µµÕ¹¥Ñäèì¥½¸è€‹Â~J°ˆ°­½Q¥Ñ±”è€‰A•Ó¶„ˆ°­½	½‘äè€‹®.“®–àƒ®ÎÓ¶bã²zC®N“ªÎðƒ²vó²
ß²ž#®²ã
ßªÆÓªÂW
ß²
Ã²Æ
ß¶n#®‚ ƒ²vÓ²VóªâÃ®–ðƒ®
c®"ƒ²jP¸ƒ®.'®“²z²v ƒ¶j3²nC²‚W®ÎÓ²^C²pƒ®ÂSªþ ƒ²"`ƒ²z#²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰A•ÐQ…±¬ˆ°•¹	½‘äè€‰M¡…É”‘…¥±ä±¥™”°ÅÕ•ÍÑ¥½¹Ì°¡•…±Ñ °Ý…±­Ì…¹ÑÉ…¥¹¥¹œÝ¥Ñ ½Ñ¡•ÈÁ•ÐÕ…É‘¥…¹Ì¸ˆô°(€Í…©Ôèì¥½¸è€‹Â~R¸ˆ°­½Q¥Ñ±”è€‰A•Ó²
³²Žðˆ°­½	½‘äè€‹ªâÃ®ÎàA•Ó²
³²Žð°ƒ²b“®*c²v`ƒ¶:¯²jÓ²à°ƒ®ÎÓ¶bã²z@ƒªÚ¶V§²vƒ²z³®¾ã®†pƒ²šCªÊ£®ÎÓ²ã²jP¸ˆ°•¹Q¥Ñ±”è€‰A•ÐM…©Ôˆ°•¹	½‘äè€‰¹©½äA•ÐM…©Ô°Ñ½‘…äÌ™½ÉÑÕ¹”°A•ÐQ…É½Ð°½ÈÕ…É‘¥…¸½µÁ…Ñ¥‰¥±¥Ñä™½È™Õ¸¸ˆô°(€Ñ…É½Ðèì¥½¸è€‹Â~<ˆ°­½Q¥Ñ±”è€‰A•Ó¶®†pˆ°­½	½‘äè€ˆÈË²z—²v`ƒ®¦S²vÓ²‚ ƒ²V®–Ó²æÓ®
c²^C²pƒ²Žó²‚s®Î®†pƒ¶Vc®Ž ƒ¶Vpƒ²z—²vƒ®öGªÎ€ƒ²b“®*c²v`ƒ®¦S².s²ž®–ðƒ²‚²z—¶VÓ®ÎÓ²ã²jP¸ˆ°•¹Q¥Ñ±”è€‰A•ÐQ…É½Ðˆ°•¹	½‘äè€‰É…Ü½¹”…ÉÁ•ÈÑ½Á¥Œ•… ‘…ä…¹Í…Ù”Ñ¡”É•…‘¥¹œÑ¼å½ÕÈ…½Õ¹Ð¸ˆô°(€Á•Ñ‰Ñ¤èì¥½¸è€‹Â~ž¤ˆ°­½Q¥Ñ±”è€‰A•Ñ	Q$ˆ°­½	½‘äè€‹ªÂW²V²ž
ßªÎƒ²ZG²vÓ®Î€ÈÃªÂpƒ¶Z'®>dƒ²ž#®²ã²ró®†pƒ²jÃ®š°ƒ²V²vÓ²v`ƒ²Ç¶Z—²vƒ®6PƒªÖ³²ÊÓ²‚²ró®†pƒ²V3²V®ÒC²jP¸ˆ°•¹Q¥Ñ±”è€‰A•Ñ	Q$ˆ°•¹	½‘äè€‰¹ÍÝ•È‰•¡…Ù¥½ÈÅÕ•ÍÑ¥½¹Ì…¹‘¥Í½Ù•È„™Õ¸Á•ÉÍ½¹…±¥ÑäÑåÁ”™½Èå½ÕÈÁ•Ð¸ˆô°(€µÕÍ¥Œèì¥½¸è€‹Â~:Ôˆ°­½Q¥Ñ±”è€‰A•Ó²v3²Vˆ°­½	½‘äè€‹ªÂW²V²ž
ßªÎƒ²ZG²vÓ®–ðƒ²r¶Vpƒ²v3²V²vƒ®NªÎ€ƒ®Âc®Î×²z³²w¶Vc®¦Àƒ²Š/²V²jS²f ƒ®2Oªâ®†pƒ²jÃ®š°ƒ²V²vÓ²v`ƒ®Âc²vG²vƒ®
c®"ƒ®ÎÓ²ã²jP¸ˆ°•¹Q¥Ñ±”è€‰A•Ð5ÕÍ¥Œˆ°•¹	½‘äè€‰1¥ÍÑ•¸Ñ¼Á•Ðµ™É¥•¹‘±äµÕÍ¥Œ°±½½À™…Ù½É¥Ñ•Ì°…¹Í¡…É”É•…Ñ¥½¹ÌÝ¥Ñ ±¥­•Ì…¹½µµ•¹ÑÌ¸ˆô°(€Ñ¥ÁÌèì¥½¸è€‹Â~J„ˆ°­½Q¥Ñ±”è€‰A•Ó²‚W®ÎÐˆ°­½	½‘äè€‹ªÆÓªÂW
ß².w®.£
ß²w¶fs
ß¶n#®‚ ƒ®NÄƒ®Âc®‚“²w¶fs²^@ƒ®ÂS®†pƒ²6£®¢çªâÀƒ²Š/²v ƒ²‚W®ÎÓ®–ðƒ®ª£²V®Ò“²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰A•ÐQ¥ÁÌˆ°•¹	½‘äè€‰	É½ÝÍ”ÁÉ…Ñ¥…°Ñ¥ÁÌ™½È¡•…±Ñ °™½½°‘…¥±ä…É”…¹ÑÉ…¥¹¥¹œ¸ˆô°(€µäèì¥½¸è€‹Â~Fˆ°­½Q¥Ñ±”è€‹¶j3²nC²‚W®ÎÐˆ°­½	½‘äè€‹®.'®“²zªÎðƒªÎ²‚Tƒ²‚W®ÎÓ®–ðƒ²"c²‚W¶VcªÎ€°ƒ®Âc®‚“®>g®²ðƒªÒ®š³²f A•Ó¶„ƒ®
Ðƒ¶fs®>g²vƒ¶fW²vã¶V€ƒ²"`ƒ²z#²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰5•µ‰•È¥¹™¼ˆ°•¹	½‘äè€‰‘¥Ðå½ÕÈ¹¥­¹…µ”…¹…½Õ¹Ð°µ…¹…”Á•ÑÌ°…¹É•Ù¥•Üå½ÕÈA•ÐQ…±¬…Ñ¥Ù¥Ñä¸ˆô°(€½¹Ñ•¹Ðèì¥½¸è€‹Šr ˆ°­½Q¥Ñ±”è€‰A•Ðƒ²öc¶C²â€ˆ°­½	½‘äè€‰A•Ó²
³²Žó
ÝA•Ñ	Q'
ÝA•Ó²‚W®ÎÓ²vƒ¶VsªÎÏ²^C²pƒªÎ£®vðƒ²vÓ²j§¶V€ƒ²"`ƒ²z#²ZÓ²jP¸ˆ°•¹Q¥Ñ±”è€‰A•Ð½¹Ñ•¹Ðˆ°•¹	½‘äè€‰¡½½Í”A•ÐM…©Ô°A•Ñ	Q$…¹A•ÐQ¥ÁÌ¥¸½¹”Á±…”¸ˆô°)ôì()™Õ¹Ñ¥½¸5•¹Õ!•±Á½… ¡ìÙ¥•Ü°±…¹œ°½Á•¸°½¹±½Í”°½¹=Á•¸ô¤ì(€½¹ÍÐ‘…Ñ„€ô59U}!1AmÙ¥•Ýtì(€¥˜€ …‘…Ñ„¤É•ÑÕÉ¸¹Õ±°ì(€½¹ÍÐÑ¥Ñ±”€ô±…¹œ€ôôô€‰•¸ˆ€ü‘…Ñ„¹•¹Q¥Ñ±”€è‘…Ñ„¹­½Q¥Ñ±”ì(€½¹ÍÐ‰½‘ä€ô±…¹œ€ôôô€‰•¸ˆ€ü‘…Ñ„¹•¹	½‘ä€è‘…Ñ„¹­½	½‘äì(€É•ÑÕÉ¸€ (€€€€ðø(€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±Àµ™…ˆˆ½¹±¥¬õí½¹=Á•¹ô…É¥„µ±…‰•°õí±…¹œ€ôôô€‰•¸ˆ€ü€‰=Á•¸Á…”Õ¥‘”ˆ€è€‹²vÐƒ¶:c²vÓ²ž ƒ²“®ªƒ®ÎÓªâÀ‰ôøüð½‰ÕÑÑ½¸ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíµ•¹Ôµ¡•±Àµ‘¥´€‘í½Á•¸€ü€‰½Á•¸ˆ€è€ˆ‰õô½¹±¥¬õí½¹±½Í•ô€¼ø(€€€€€€ñ…Í¥‘”±…ÍÍ9…µ”õíµ•¹Ôµ¡•±Àµ½… €‘í½Á•¸€ü€‰½Á•¸ˆ€è€ˆ‰õô…É¥„µ¡¥‘‘•¸õì…½Á•¹ôø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±ÀµÑ½Àˆø(€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±Àµ•µ½©¤ˆùí‘…Ñ„¹¥½¹ôð½ÍÁ…¸ø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±Àµ±½Í”ˆ½¹±¥¬õí½¹±½Í•ô…É¥„µ±…‰•°ô‰±½Í”ˆû\ð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±Àµ­¥­•ÈˆùAQI=\!1@ð½‘¥Øø(€€€€€€€€ñ ÌùíÑ¥Ñ±•ôð½ Ìø(€€€€€€€€ñÀùí‰½‘åôð½Àø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±Àµ…Ñ¥½¹Ìˆø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰µ•¹Ôµ¡•±ÀµÁÉ¥µ…Éäˆ½¹±¥¬õí½¹±½Í•ôùí±…¹œ€ôôô€‰•¸ˆ€ü€‰±½Í”ˆ€è€‹®.¯ªâÀ‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½…Í¥‘”ø(€€€€ð¼ø(€€¤ì)ô()™Õ¹Ñ¥½¸ÁÁ%¹¹•È¡ì±…¹œ°Í•Ñ1…¹œô¤ì(€½¹ÍÐÐ€ôÕÍ•P ¤ì(€½¹ÍÐmÍÁ•¥•Ì°Í•ÑMÁ•¥•Ít€ôÕÍ•MÑ…Ñ” ‰‘½œˆ¤ì(€½¹ÍÐmÁ•ÑÌ°Í•ÑA•ÑÍt€ôÕÍ•MÑ…Ñ”¡ì‘½œèmt°…Ðèmtô¤ì(€½¹ÍÐm…Ñ¥Ù•%°Í•ÑÑ¥Ù•%‘t€ôÕÍ•MÑ…Ñ”¡ì‘½œè¹Õ±°°…Ðè¹Õ±°ô¤ì(€½¹ÍÐmµ½‘”°Í•Ñ5½‘•t€ôÕÍ•MÑ…Ñ” ‰Ù¥•Üˆ¤ì€¼¼€Ù¥•Üœð€½¹‰½…É‘¥¹œœð€•‘¥Ðœ(€½¹ÍÐm±½…‘•°Í•Ñ1½…‘•‘t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐmÝ•±½µ•	…­=Á•¸°Í•Ñ]•±½µ•	…­=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐmÕ¥‘•=Á•¸°Í•ÑÕ¥‘•=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐmµ•¹Õ!•±Á=Á•¸°Í•Ñ5•¹Õ!•±Á=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐm‘•±•Ñ•Q…É•Ð°Í•Ñ•±•Ñ•Q…É•Ñt€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì€¼¼í¥°¹…µ•ôð¹Õ±°((€€¼¼€…‰½ÕÐœð€Á•ÑÌœð€Í…©Ôœð€Á•Ñ‰Ñ¤œð€Ñ¥ÁÌœð€Õ¥‘”œð€ÁÉ¥Ù…äœð€Ñ•ÉµÌœ(€½¹ÍÐmÙ¥•Ü°Í•ÑY¥•Ýt€ôÕÍ•MÑ…Ñ” ‰¡½µ”ˆ¤ì(€½¹ÍÐQ}Y%]L€ôl‰Á•ÑÌˆ°€‰Í…©Ôˆ°€‰Á•Ñ‰Ñ¤ˆ°€‰Ñ¥ÁÌˆ°€‰Õ¥‘”ˆ°€‰½¹Ñ•¹Ðˆ°€‰µäˆ°€‰…‘µ¥¸‰tì((€€¼¼€´´´´ƒªÎ²‚T£²æÓ²æÓ²bƒ®†sªÞã²và¤€´´´´(€½¹ÍÐm…½Õ¹Ð°Í•Ñ½Õ¹Ñt€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì(€½¹ÍÐm…ÕÑ¡¡•­•°Í•ÑÕÑ¡¡•­•‘t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì((€€¼¼ƒ®†sªÞã²vàƒ¶V²jPƒ¶fS®¦Ðƒ²^³®Ú®*Pƒ®ª£®N€•™™•Ó®ÎÓ®.ƒ®¢ó²‚ ƒªÎ²
Ã¶VÓ²Vðƒ¶VÓ²jP¸(€€¼¼ƒ²V®z`ƒ¶×ªÎ¿ªÒGªÎ€•™™•Ó²^C²p•™™•Ñ¥Ù•Y¥•ß®–ðƒ²Âã²†Ã¶Vc®¾®†pQh£²ƒ²Zàƒ²‚ƒ²‚GªÞð¤ƒ²b“®–c®–ðƒ®Â§²ž¶V§®.#®.¸(€½¹ÍÐ¹••‘Í1½¥¸€ôQ}Y%]L¹¥¹±Õ‘•Ì¡Ù¥•Ü¤€˜˜€……½Õ¹Ðì(€½¹ÍÐ•™™•Ñ¥Ù•Y¥•Ü€ô¹••‘Í1½¥¸€ü€‰±½¥¸ˆ€èÙ¥•Üì(€½¹ÍÐm…½Õ¹Ñ5½‘…±=Á•¸°Í•Ñ½Õ¹Ñ5½‘…±=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€ÕÍ•™™•Ð  ¤ôùí¥˜¡…½Õ¹Ðü¹¥¥…‘µ¥¹MÑ…ÑÕÍ…ÍÐ ¤¹…Ñ   ¤ôùíô¥ô±m…½Õ¹Ðü¹¥‘t¤ì(€ÕÍ•™™•Ð  ¤ôùí½¹ÍÐ õ”ôù½Y¥•Ü¡”¹‘•Ñ…¥°¤íÝ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á•ÑÉ½Üé¹…Ù¥…Ñ”ˆ± ¤íÉ•ÑÕÉ¸ ¤ôùÝ¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á•ÑÉ½Üé¹…Ù¥…Ñ”ˆ± ¥ô±mt¤ì((€½¹ÍÐm¡…µ=Á•¸°Í•Ñ!…µ=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐm½¹Ñ•¹ÑMÕ‰Q…ˆ°Í•Ñ½¹Ñ•¹ÑMÕ‰Q…‰t€ôÕÍ•MÑ…Ñ” ‰…±°ˆ¤ì(€½¹ÍÐ¥Í9…Ñ¥Ù•ÁÀ€ô…Á…¥Ñ½È¹¥Í9…Ñ¥Ù•A±…Ñ™½É´ ¤ì(€½¹ÍÐm‘•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¸°Í•Ñ•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐm‘•±•Ñ¥¹½Õ¹Ð°Í•Ñ•±•Ñ¥¹½Õ¹Ñt€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐm‘•±•Ñ•½Õ¹Ñ½¹•=Á•¸°Í•Ñ•±•Ñ•½Õ¹Ñ½¹•=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐmÁ•¹‘¥¹5¥É…Ñ¥½¸°Í•ÑA•¹‘¥¹5¥É…Ñ¥½¹t€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì€¼¼ì‘½Ì°…ÑÌôð¹Õ±°(€½¹ÍÐmµ¥É…Ñ¥¹œ°Í•Ñ5¥É…Ñ¥¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì(€½¹ÍÐm±½¥¹Q½…ÍÐ°Í•Ñ1½¥¹Q½…ÍÑt€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì€¼¼€‰ÍÕ•ÍÌˆð€‰•ÉÉ½Èˆð¹Õ±°(€½¹ÍÐmÕÁ‘…Ñ•½¹™¥œ°Í•ÑUÁ‘…Ñ•½¹™¥t€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì(€½¹ÍÐmÕÁ‘…Ñ•=Á•¸°Í•ÑUÁ‘…Ñ•=Á•¹t€ôÕÍ•MÑ…Ñ”¡™…±Í”¤ì((€€¼¼A•Ó²
³²Žð€¼ƒ²b“®*c²vc²jÓ²à€¼ƒ®ÎÓ¶bã²zCªÚ¶V¤€¼A•Ñ	Q$ƒ²^C²pƒªÂW²V²ž
ßªÎƒ²ZG²vÐƒªÖ³®Úƒ²^²vÐƒ²V²vÓ®–ðƒ²ƒ¶w¶VcªâÀƒ²r¶Vpƒ²¶p(€½¹ÍÐm™•…ÑÕÉ•A•Ñ%°Í•Ñ•…ÑÕÉ•A•Ñ%‘t€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì((€€¼¼A±…äƒ²*“¶ƒ²ZÐƒ²^®6Ã²vÓ¶*ãªÂ ƒ².“²‚pƒªÎ×ªÂs®Bpƒ®JÁÕ‰±¥Œ½…ÁÀµÕÁ‘…Ñ”¹©Í½»²v`•¹…‰±•“®–ðÑÉÕ—®†pƒ®ÂSªúã®¦Ð(€€¼¼ƒªÖ³®Ê²‚ƒ²VÇ²^C²pƒ²^®6Ã²vÓ¶*àƒ¶2w²^²vÐƒ¶Fs².s®>ó²jP¸ƒ²näƒ®â3®vó²jÃ²‚²^C²s®*Pƒ¶Fs².s®Bc²ž ƒ²V+²*×®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ …¥Í9…Ñ¥Ù•ÁÀ¤É•ÑÕÉ¸ì(€€€±•Ð…¹•±±•€ô™…±Í”ì(€€€€¡…Íå¹Œ€ ¤€ôøì(€€€€€ÑÉäì(€€€€€€€½¹ÍÐÉ•Ì€ô…Ý…¥Ð™•Ñ ¡€½…ÁÀµÕÁ‘…Ñ”¹©Í½¸ýÐô‘í…Ñ”¹¹½Ü ¥õ€°ì…¡”è€‰¹¼µÍÑ½É”ˆô¤ì(€€€€€€€¥˜€ …É•Ì¹½¬¤É•ÑÕÉ¸ì(€€€€€€€½¹ÍÐ™œ€ô…Ý…¥ÐÉ•Ì¹©Í½¸ ¤ì(€€€€€€€¥˜€ …™œü¹•¹…‰±•ñð…¹•±±•¤É•ÑÕÉ¸ì((€€€€€€€½¹ÍÐÁ…É…µÌ€ô¹•ÜUI1M•…É¡A…É…µÌ¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹Í•…É ¤ì(€€€€€€€½¹ÍÐÕÉÉ•¹ÑY•ÉÍ¥½¸€ôÁ…É…µÌ¹•Ð ‰…ÁÁ}Ù•ÉÍ¥½¸ˆ¤ì(€€€€€€€½¹ÍÐ¹••‘ÍUÁ‘…Ñ”€ôÕÉÉ•¹ÑY•ÉÍ¥½¸(€€€€€€€€€€ü½µÁ…É•Y•ÉÍ¥½¹Ì¡ÕÉÉ•¹ÑY•ÉÍ¥½¸°™œ¹±…Ñ•ÍÑY•ÉÍ¥½¸¤€ð€À(€€€€€€€€€€è™œ¹±•…å9••‘ÍUÁ‘…Ñ”€„ôô™…±Í”ì((€€€€€€€¥˜€¡¹••‘ÍUÁ‘…Ñ”€˜˜€……¹•±±•¤ì(€€€€€€€€€Í•ÑUÁ‘…Ñ•½¹™¥œ¡™œ¤ì(€€€€€€€€€Í•ÑUÁ‘…Ñ•=Á•¸¡ÑÉÕ”¤ì(€€€€€€€ô(€€€€€ô…Ñ €¡”¤ì(€€€€€€€½¹Í½±”¹Ý…É¸ ‰ÁÀÕÁ‘…Ñ”¡•¬Í­¥ÁÁ•èˆ°”¤ì(€€€€€ô(€€€ô¤ ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøì…¹•±±•€ôÑÉÕ”ìôì(€ô°m¥Í9…Ñ¥Ù•ÁÁt¤ì((€ÕÍ•™™•Ð  ¤€ôøì(€€€€¡…Íå¹Œ€ ¤€ôøì(€€€€€€¼¼ƒ²æÓ²æÓ²bƒ®†sªÞã²vàƒ²ös®ÂÇ²^C²pƒ®>3²V²b ƒªÊ÷²jÀ ¼ý±½¥¸õÍÕ•ÍÍñ•ÉÉ½È¤ƒ²V#®
Ðƒ¶nUI0ƒ²‚W®š°(€€€€€½¹ÍÐÁ…É…µÌ€ô¹•ÜUI1M•…É¡A…É…µÌ¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹Í•…É ¤ì(€€€€€½¹ÍÐ±½¥¹I•ÍÕ±Ð€ôÁ…É…µÌ¹•Ð ‰±½¥¸ˆ¤ì(€€€€€¥˜€¡±½¥¹I•ÍÕ±Ð¤ì(€€€€€€€Í•Ñ1½¥¹Q½…ÍÐ¡±½¥¹I•ÍÕ±Ð€ôôô€‰ÍÕ•ÍÌˆ€ü€‰ÍÕ•ÍÌˆ€è€‰•ÉÉ½Èˆ¤ì(€€€€€€€Á…É…µÌ¹‘•±•Ñ” ‰±½¥¸ˆ¤ì(€€€€€€€½¹ÍÐ±•…¹UÉ°€ôÝ¥¹‘½Ü¹±½…Ñ¥½¸¹Á…Ñ¡¹…µ”€¬€¡Á…É…µÌ¹Ñ½MÑÉ¥¹œ ¤€ü€ü‘íÁ…É…µÍõ€€è€ˆˆ¤ì(€€€€€€€Ý¥¹‘½Ü¹¡¥ÍÑ½Éä¹É•Á±…•MÑ…Ñ”¡íô°€ˆˆ°±•…¹UÉ°¤ì(€€€€€€€Í•ÑQ¥µ•½ÕÐ  ¤€ôøÍ•Ñ1½¥¹Q½…ÍÐ¡¹Õ±°¤°±½¥¹I•ÍÕ±Ð€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÐÀÀ€è€ÌØÀÀ¤ì(€€€€€ô((€€€€€½¹ÍÐµ•I•ÍÕ±Ð€ô…Ý…¥Ð™•Ñ¡5” ¤ì(€€€€€½¹ÍÐµ”€ôµ•I•ÍÕ±Ð€ôôôÕ¹‘•™¥¹•€ü¹Õ±°€èµ•I•ÍÕ±Ðì(€€€€€¥˜€¡µ•I•ÍÕ±Ð€„ôôÕ¹‘•™¥¹•¤Í•Ñ½Õ¹Ð¡µ•I•ÍÕ±Ð¤ì(€€€€€Í•ÑÕÑ¡¡•­•¡ÑÉÕ”¤ì(€€€€€€¼¼ƒ®†sªÞã²vàƒ¶fW²vã®ž0ƒ®w®
c®¦Ðƒ¶f#®Ú¶Àƒ®¢ó²‚ ƒ®ÎÓ²^³²ŽóªÎ€°ƒ®Âc®‚“®>g®²ðƒ®6Ã²vÓ¶Ã®*Pƒ²V®zc²^C²pƒ®æ®>gªâÃ®†pƒ²Æ²n3²jP¸(€€€€€Í•Ñ1½…‘•¡ÑÉÕ”¤ì(€€€€€€¼¼ƒ®†sªÞã²vàƒ²ž²‚²^@ƒ®Âo²v ƒ²V÷ªÒ ¿ªÂs²vã²‚W®ÎÐƒ®>g²v`ƒªâÃ®†w²vƒªÎ²‚Tƒ²¶s²^C®>ƒ²‚²z—¶VÓ²jP¸(€€€€€¥˜€¡µ”¤ì(€€€€€€€ÑÉäì(€€€€€€€€€½¹ÍÐÉ…Ý½¹Í•¹Ð€ôÝ¥¹‘½Ü¹±½…±MÑ½É…”¹•Ñ%Ñ•´¡=9M9Q}MQ=I}-d¤ì(€€€€€€€€€½¹ÍÐ½¹Í•¹Ð€ôÉ…Ý½¹Í•¹Ð€ü)M=8¹Á…ÉÍ”¡É…Ý½¹Í•¹Ð¤€è¹Õ±°ì(€€€€€€€€€¥˜€¡½¹Í•¹Ðü¹Ù•ÉÍ¥½¸€ôôô=9M9Q}YIM%=8€˜˜½¹Í•¹Ðü¹Ñ•ÉµÌ€˜˜½¹Í•¹Ðü¹ÁÉ¥Ù…ä¤ì(€€€€€€€€€€€…Ý…¥ÐÍ…™•M•Ð ‰Á•ÑÉ½Üé½¹Í•¹Ðˆ°½¹Í•¹Ð°µ”¤ì(€€€€€€€€€ô(€€€€€€€ô…Ñ íô(€€€€€€€Í•ÑY¥•Ü ‰¡½µ”ˆ¤ì(€€€€€ô((€€€€€½¹ÍÐ‘½Í-•ä€ô€‰‰‰½°é‘½Ìˆì(€€€€€½¹ÍÐ…ÑÍ-•ä€ô€‰‰‰½°é…ÑÌˆì(€€€€€½¹ÍÐ…Ñ¥Ù•Í-•ä€ô€‰‰‰½°é…Ñ¥Ù•%‘Ìˆì((€€€€€±•Ðm‘½Ì°…ÑÌ°…Ñ¥Ù•Ít€ô…Ý…¥ÐAÉ½µ¥Í”¹…±°¡l(€€€€€€€Í…™••Ð¡‘½Í-•ä°µ”¤°(€€€€€€€Í…™••Ð¡…ÑÍ-•ä°µ”¤°(€€€€€€€Í…™••Ð¡…Ñ¥Ù•Í-•ä°µ”¤°(€€€€€t¤ì((€€€€€¥˜€ …µ”¤ì(€€€€€€€€¼¼ƒ®†sªÞã²vàƒ²‚£ªÊ3²*“¶*à¤ƒ²¶s²^C²s®ž0ƒ²b#²‚ƒ®Ê²‚ƒ®†s²î°ƒ®6Ã²vÓ¶Ã®–ðƒ¶V£ªî`ƒ¶fW²vã¶VÓ²jP(€€€€€€€¥˜€ …‘½Ìñð‘½Ì¹±•¹Ñ €ôôô€À¤ì(€€€€€€€€€½¹ÍÐÕ•ÍÑ½Ì€ô…Ý…¥ÐÍ…™••Ð ‰‰‰½°é‘½ÌéÕ•ÍÐˆ°µ”¤ì(€€€€€€€€€¥˜€¡Õ•ÍÑ½Ì€˜˜Õ•ÍÑ½Ì¹±•¹Ñ €ø€À¤ì‘½Ì€ôÕ•ÍÑ½ÌìÍ…™•M•Ð¡‘½Í-•ä°‘½Ì°µ”¤ìô(€€€€€€€ô(€€€€€€€¥˜€ ……ÑÌñð…ÑÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€€€€€½¹ÍÐÕ•ÍÑ…ÑÌ€ô…Ý…¥ÐÍ…™••Ð ‰‰‰½°é…ÑÌéÕ•ÍÐˆ°µ”¤ì(€€€€€€€€€¥˜€¡Õ•ÍÑ…ÑÌ€˜˜Õ•ÍÑ…ÑÌ¹±•¹Ñ €ø€À¤ì…ÑÌ€ôÕ•ÍÑ…ÑÌìÍ…™•M•Ð¡…ÑÍ-•ä°…ÑÌ°µ”¤ìô(€€€€€€€ô(€€€€€€€¥˜€ …‘½Ìñð‘½Ì¹±•¹Ñ €ôôô€À¤ì(€€€€€€€€€½¹ÍÐ±•…åAÉ½™¥±”€ô…Ý…¥ÐÍ…™••Ð ‰‰‰½°éÁÉ½™¥±”ˆ°µ”¤ì(€€€€€€€€€¥˜€¡±•…åAÉ½™¥±”¤ì(€€€€€€€€€€€½¹ÍÐ±•…åI•½É‘Ì€ô€¡…Ý…¥ÐÍ…™••Ð ‰‰‰½°éÉ•½É‘Ìˆ°µ”¤¤ñðmì(€€€€€€€€€€€€€¥è€‰¥¹¥Ñ¥…°ˆ°‘…Ñ”è¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤°Ý•¥¡Ñ-œè±•…åAÉ½™¥±”¹¥¹¥Ñ¥…±]•¥¡Ñ-œ°(€€€€€€€€€€€õtì(€€€€€€€€€€€½¹ÍÐ±•…åA¡½Ñ½Ì€ô€¡…Ý…¥ÐÍ…™••Ð ‰‰‰½°éÁ¡½Ñ½Ìˆ°µ”¤¤ñðíôì(€€€€€€€€€€€‘½Ì€ômì(€€€€€€€€€€€€€¥è€‰‘½œµ±•…äˆ°(€€€€€€€€€€€€€ÁÉ½™¥±”èì€¸¸¹±•…åAÉ½™¥±”°ÍÁ•¥•Ìè€‰‘½œˆô°(€€€€€€€€€€€€€É•½É‘Ìè±•…åI•½É‘Ì°(€€€€€€€€€€€€€Á¡½Ñ½Ìè¹½Éµ…±¥é•A¡½Ñ½Ì¡±•…åA¡½Ñ½Ì°±•…åAÉ½™¥±”¹‰¥ÉÑ¡…Ñ”¤°(€€€€€€€€€€€õtì(€€€€€€€€€€€Í…™•M•Ð¡‘½Í-•ä°‘½Ì°µ”¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô((€€€€€‘½Ì€ô€¡‘½Ìñðmt¤¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°ÁÉ½™¥±”èì€¸¸¹À¹ÁÉ½™¥±”°¹…µ”è¹½Éµ…±¥é•A•Ñ¥ÍÁ±…åQ•áÐ¡À¹ÁÉ½™¥±”ü¹¹…µ”°€ˆˆ¤ô°Á¡½Ñ½Ìè¹½Éµ…±¥é•A¡½Ñ½Ì¡À¹Á¡½Ñ½Ì°À¹ÁÉ½™¥±”¹‰¥ÉÑ¡…Ñ”¤ô¤¤ì(€€€€€…ÑÌ€ô€¡…ÑÌñðmt¤¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°ÁÉ½™¥±”èì€¸¸¹À¹ÁÉ½™¥±”°¹…µ”è¹½Éµ…±¥é•A•Ñ¥ÍÁ±…åQ•áÐ¡À¹ÁÉ½™¥±”ü¹¹…µ”°€ˆˆ¤ô°Á¡½Ñ½Ìè¹½Éµ…±¥é•A¡½Ñ½Ì¡À¹Á¡½Ñ½Ì°À¹ÁÉ½™¥±”¹‰¥ÉÑ¡…Ñ”¤ô¤¤ì((€€€€€€¼¼ƒ®æ®†sªÞã²vàƒ²¶s²^C²s®*PƒªÎóªÆÀ±½…±MÑ½É…”ƒ®6Ã²vÓ¶Ã®–ðƒ¶fS®¦Ðƒ²¶s²^@ƒ²b³®š³²ž ƒ²V+²V²jP¸(€€€€€€¼¼ƒ®6Ã²vÓ¶Àƒ²zC²ÊÓ®*Pƒ²
·²‚s¶Vc²ž ƒ²V+²V°ƒ²vÓ¶nƒ®†sªÞã²vàƒ².pƒªâÃ²†Ðƒ®6Ã²vÓ¶Àƒ²vÓ²‚ƒ²V#®
Ó²^@ƒ²
³²j§¶V€ƒ²"`ƒ²z#²ZÓ²jP¸(€€€€€¥˜€ …µ”¤ì(€€€€€€€‘½Ì€ômtì(€€€€€€€…ÑÌ€ômtì(€€€€€ô((€€€€€Í•ÑA•ÑÌ¡ì‘½œè‘½Ì°…Ðè…ÑÌô¤ì(€€€€€Í•ÑÑ¥Ù•%¡ì(€€€€€€€‘½œè€¡…Ñ¥Ù•Ì€˜˜…Ñ¥Ù•Ì¹‘½œ¤ñð€¡‘½ÍlÁt€˜˜‘½ÍlÁt¹¥¤ñð¹Õ±°°(€€€€€€€…Ðè€¡…Ñ¥Ù•Ì€˜˜…Ñ¥Ù•Ì¹…Ð¤ñð€¡…ÑÍlÁt€˜˜…ÑÍlÁt¹¥¤ñð¹Õ±°°(€€€€€ô¤ì((€€€€€€¼¼ƒ®†sªÞã²vã®BpƒªÎ²‚W²vã®6Àƒ¶Ó®vó²jÃ®Ns²^@ƒ®NÇ®†w®Bpƒ²V²vÓªÂ ƒ¶Vc®
c®>ƒ²^®.“®¦Ð°ƒ®†sªÞã²vàƒ²‚ƒ²vÐƒªâÃªâÃ²^@ƒ®
£²V²z#®6`(€€€€€€¼¼ƒ®6Ã²vÓ¶ÃªÂ ƒ²z#®*S²ž ƒ¶fW²vã¶VÓ²pƒªÎ²‚W²ró®†pƒ²vÓ²‚¶Vƒ²ž ƒ®²ó²ZÓ®ÒC²jP€£²’G®ÎÔƒ²vÓ²‚ƒ®Â§²ž®–ðƒ²r¶VÐƒ¶Ó®vó²jÃ®NsªÂ ƒ®æ²ZÓ²z#²vƒ®V3®ž0¤(€€€€€¥˜€¡µ”€˜˜‘½Ì¹±•¹Ñ €ôôô€À€˜˜…ÑÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€€€ÑÉäì(€€€€€€€€€½¹ÍÐ±½…±½ÍI…Ü€ôÝ¥¹‘½Ü¹±½…±MÑ½É…”¹•Ñ%Ñ•´¡‘½Í-•ä¤ì(€€€€€€€€€½¹ÍÐ±½…±…ÑÍI…Ü€ôÝ¥¹‘½Ü¹±½…±MÑ½É…”¹•Ñ%Ñ•´¡…ÑÍ-•ä¤ì(€€€€€€€€€½¹ÍÐ±½…±½Ì€ô±½…±½ÍI…Ü€ü)M=8¹Á…ÉÍ”¡±½…±½ÍI…Ü¤€èmtì(€€€€€€€€€½¹ÍÐ±½…±…ÑÌ€ô±½…±…ÑÍI…Ü€ü)M=8¹Á…ÉÍ”¡±½…±…ÑÍI…Ü¤€èmtì(€€€€€€€€€¥˜€ ¡±½…±½Ì€˜˜±½…±½Ì¹±•¹Ñ €ø€À¤ñð€¡±½…±…ÑÌ€˜˜±½…±…ÑÌ¹±•¹Ñ €ø€À¤¤ì(€€€€€€€€€€€Í•ÑA•¹‘¥¹5¥É…Ñ¥½¸¡ì‘½Ìè±½…±½Ìñðmt°…ÑÌè±½…±…ÑÌñðmtô¤ì(€€€€€€€€€ô(€€€€€€€ô…Ñ íô(€€€€€ô((€€€€€¥˜€¡‘½Ì¹±•¹Ñ €ø€Àñð…ÑÌ¹±•¹Ñ €ø€À¤ì(€€€€€€€½¹ÍÐÑ½‘…ä€ô¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ì(€€€€€€€½¹ÍÐ±…ÍÑ]•±½µ”€ô…Ý…¥ÐÍ…™••Ð ‰‰‰½°é±…ÍÑ]•±½µ•…Ñ”ˆ°µ”¤ì(€€€€€€€¥˜€¡±…ÍÑ]•±½µ”€„ôôÑ½‘…ä¤ì(€€€€€€€€€Í•Ñ]•±½µ•	…­=Á•¸¡ÑÉÕ”¤ì(€€€€€€€€€Í…™•M•Ð ‰‰‰½°é±…ÍÑ]•±½µ•…Ñ”ˆ°Ñ½‘…ä°µ”¤ì(€€€€€€€ô(€€€€€ô(€€€ô¤ ¤ì(€€€€¼¼•Í±¥¹Ðµ‘¥Í…‰±”µ¹•áÐµ±¥¹”É•…Ðµ¡½½­Ì½•á¡…ÕÍÑ¥Ù”µ‘•ÁÌ(€ô°mt¤ì((€€¼¼ƒ®“²vÓ¶.Ã®â0ƒ²VÇ²v`ƒ²‚W²‚ƒ².s²zDƒ¶fS®¦Ó²vÐƒ²’®æ®Bc®¦Ðƒ®ÂS®†pƒ²näƒ²*“¶R3®zc².s®†pƒ®cªÊ (€€¼¼ƒ¶j3²‚ƒ®†s®R¤ƒ²Vƒ®.#®¦S²vÓ²c²vÐƒ².“²‚pƒ²Ò#ªâÃ¶fSªÂ ƒ®w®
€ƒ®V3ªæ3²ž ƒ®ÎÓ²vÓ®>®†tƒ¶VÓ²jP¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ ……Á…¥Ñ½È¹¥Í9…Ñ¥Ù•A±…Ñ™½É´ ¤¤É•ÑÕÉ¸ì(€€€½¹ÍÐÑ¥µ•È€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€MÁ±…Í¡MÉ••¸¹¡¥‘” ¤¹…Ñ   ¤€ôøíô¤ì(€€€ô°€àÀ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøÝ¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡Ñ¥µ•È¤ì(€ô°mt¤ì((€€¼¼ƒ®â3®vó²jÃ²‚ ¿²VÇ²vÐƒ®.“².pƒ¶fs²Ç¶fS®B€ƒ®V0ƒ²ã²c²vƒ²†Ã²j§¶z ƒ²z³¶fW²vã¶VÓ²jP¸(€€¼¼ƒ²s®ÊªÂ ƒ²zƒªæ@ƒ®*C®‚…½Õ¹ÓªÂ ƒ®æ²ZÐƒ®ÎÓ²b®6`ƒªÊ÷²jÀƒ®†sªÞã²vàƒ®Ê¶*ó²vÐƒ²zC®>g²ró®†pƒ²‚W²ƒ®Î×ªÖ³®B§®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€±•Ð‰ÕÍä€ô™…±Í”ì(€€€½¹ÍÐÉ•™É•Í¡½Õ¹Ð€ô…Íå¹Œ€ ¤€ôøì(€€€€€¥˜€¡‰ÕÍä¤É•ÑÕÉ¸ì(€€€€€‰ÕÍä€ôÑÉÕ”ì(€€€€€ÑÉäì(€€€€€€€½¹ÍÐµ”€ô…Ý…¥Ð™•Ñ¡5” ¤ì(€€€€€€€¥˜€¡µ”€„ôôÕ¹‘•™¥¹•¤Í•Ñ½Õ¹Ð¡µ”¤ì(€€€€€ô™¥¹…±±äì(€€€€€€€‰ÕÍä€ô™…±Í”ì(€€€€€ô(€€€ôì(€€€½¹ÍÐ½¹Y¥Í¥‰¥±¥Ñä€ô€ ¤€ôøì¥˜€¡‘½Õµ•¹Ð¹Ù¥Í¥‰¥±¥ÑåMÑ…Ñ”€ôôô€‰Ù¥Í¥‰±”ˆ¤É•™É•Í¡½Õ¹Ð ¤ìôì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÌˆ°É•™É•Í¡½Õ¹Ð¤ì(€€€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Ù¥Í¥‰¥±¥Ñå¡…¹”ˆ°½¹Y¥Í¥‰¥±¥Ñä¤ì(€€€É•ÑÕÉ¸€ ¤€ôøì(€€€€€Ý¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÌˆ°É•™É•Í¡½Õ¹Ð¤ì(€€€€€‘½Õµ•¹Ð¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Ù¥Í¥‰¥±¥Ñå¡…¹”ˆ°½¹Y¥Í¥‰¥±¥Ñä¤ì(€€€ôì(€ô°mt¤ì((€€¼¼I•…ÓªÂ ƒ²b³®vó²b“®¦Ðƒ¶f ƒ²*“²ò#®‚#¶“²vÐƒ²vÓ®¾àƒ²’®æ®Bpƒ²¶s²vÓ®¾®†pƒ²*“¶R3®zc².s®–ðƒ®#®²Ðƒ²b“®z`ƒ®Úg²z‡²ž ƒ²V+²V²jP¸(€€¼¼ƒ®6Ã²vÓ¶ÃªÂ ƒ®*C®‚“®>€‹²*“¶R3®zc².pƒŠHƒ²*“²ò#®‚#¶ƒŠHƒ².“²‚pƒ¶f ‹²ró®†pƒ²vÓ²ZÓ²‚àƒ¶vÀƒ¶fS®¦Ó²vÐƒ®ÎÓ²vÓ²ž ƒ²V+²*×®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€½¹ÍÐÑ¥µ•È€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€¥˜€¡ÑåÁ•½˜Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í €ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í  ¤ì(€€€ô°€ÄÄÔÀ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøÝ¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡Ñ¥µ•È¤ì(€ô°mt¤ì((€€¼¼I•…ÓªÂ ƒ¶f ƒ²*“²ò#®‚#¶“²vƒªÞã®šÐƒ²’®æªÂ ƒ®Bc®¦Ðƒ²*“¶R3®zc².s®–ðƒ®¢ó²‚ ƒ®
Ó®‚“²jP¸(€€¼¼ƒ®†sªÞã²và½ƒ²vG®.×²vƒªâÃ®.“®š³®¦Àƒ¶vÀƒ¶fS®¦Ó²vÐƒ®ÎÓ²vÓ²ž ƒ²V+ªÎ€€‹²*“¶R3®zc².pƒŠHƒ¶f ƒ²*“²ò#®‚#¶ƒŠHƒ².“²‚pƒ¶f ‹²ró®†pƒ²vÓ²ZÓ²žG®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€½¹ÍÐÑ½M­•±•Ñ½¸€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€¥˜€¡ÑåÁ•½˜Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í €ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í  ¤ì(€€€ô°€ÔÈÀ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøÝ¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡Ñ½M­•±•Ñ½¸¤ì(€ô°mt¤ì((€€¼¼ƒ².“²‚pƒ®6Ã²vÓ¶Àƒ²’®æªÂ ƒ®æƒ®–ÓªÊ0ƒ®w®
pƒªÊ÷²jÃ²^C®>ƒ²*“¶R3®zc².pƒ²Š®Ž0ƒ²jS²Ê·²vƒ¶Vpƒ®Ê ƒ®6Pƒ®ÎÓ²z—¶VÓ²jP¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ …±½…‘•ñð€……ÕÑ¡¡•­•¤É•ÑÕÉ¸ì(€€€¥˜€¡ÑåÁ•½˜Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í €ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í  ¤ì(€ô°m±½…‘•°…ÕÑ¡¡•­•‘t¤ì((€€¼¼ƒ®“¶*ã²n3¶³ªÂ ƒ²ž²^Ã®>ó®>ƒ²*“¶R3®zc².s®*Pƒ²b“®z`ƒ®Úg²z‡²ž ƒ²V+ªÎ€ƒ²*“²ò#®‚#¶“²vÐƒ®2².€ƒ®†s®R¤ƒ²¶s®–ðƒ®ÎÓ²^³²’7®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€½¹ÍÐ™…±±‰…¬€ôÝ¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€¥˜€¡ÑåÁ•½˜Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í €ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ý¥¹‘½Ü¹}}¡¥‘•A•ÑÉ½ÝMÁ±…Í  ¤ì(€€€ô°€ÄàÀÀ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøÝ¥¹‘½Ü¹±•…ÉQ¥µ•½ÕÐ¡™…±±‰…¬¤ì(€ô°mt¤ì((€€¼¼ƒªÂs²vã²‚W®ÎÐƒ²Ös²3¶fPƒ²jÓ²bƒ¶×ªÎèƒ²ã²c²v ƒ²z²v`%®–ðƒ²s®Ê²^C²pƒ¶VÓ².s¶VÐƒ²žGªÎ¶V§®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ …±½…‘•ñð€……ÕÑ¡¡•­•¤É•ÑÕÉ¸ì(€€€…¹…±åÑ¥ÍÙ•¹Ð ‰Í•ÍÍ¥½¸ˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤ì(€€€½¹ÍÐÑ¥µ•È€ôÝ¥¹‘½Ü¹Í•Ñ%¹Ñ•ÉÙ…°  ¤€ôø…¹…±åÑ¥ÍÙ•¹Ð ‰¡•…ÉÑ‰•…Ðˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤°€ØÀÀÀÀ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøÝ¥¹‘½Ü¹±•…É%¹Ñ•ÉÙ…°¡Ñ¥µ•È¤ì(€ô°m±½…‘•°…ÕÑ¡¡•­•‘t¤ì((€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ …±½…‘•ñð€……ÕÑ¡¡•­•¤É•ÑÕÉ¸ì(€€€…¹…±åÑ¥ÍÙ•¹Ð ‰Á…•Ù¥•Üˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤ì(€ô°m•™™•Ñ¥Ù•Y¥•Ü°±½…‘•°…ÕÑ¡¡•­•‘t¤ì((€€¼¼‘5½ˆƒ¶Vc®. ƒ®ÂÃ® ƒªÒGªÎ€ƒŠPƒ².“²‚pƒ²V#®Ns®†s²vÓ®Np½¥=Lƒ²VÇ²^C²s®ž0ƒ®>g²zG¶VÓ²jP€£²nç²
³²vÓ¶*ã®*PƒªÞã®”ƒ®c²ZÓªÂ²jP¤(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ ……Á…¥Ñ½È¹¥Í9…Ñ¥Ù•A±…Ñ™½É´ ¤¤É•ÑÕÉ¸ì(€€€€¡…Íå¹Œ€ ¤€ôøì(€€€€€ÑÉäì(€€€€€€€…Ý…¥Ð‘5½ˆ¹¥¹¥Ñ¥…±¥é” ¤ì(€€€€€€€…¹…±åÑ¥ÍÙ•¹Ð ‰…‘}É•ÅÕ•ÍÐˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤ì(€€€€€€€…Ý…¥Ð‘5½ˆ¹Í¡½Ý	…¹¹•È¡ì(€€€€€€€€€…‘%è5=	}	99I}%°(€€€€€€€€€…‘M¥é”è	…¹¹•É‘M¥é”¹AQ%Y}	99H°(€€€€€€€€€Á½Í¥Ñ¥½¸è	…¹¹•É‘A½Í¥Ñ¥½¸¹	=QQ=5}9QH°(€€€€€€€€€¥ÍQ•ÍÑ¥¹œè™…±Í”°(€€€€€€€ô¤ì(€€€€€€€…¹…±åÑ¥ÍÙ•¹Ð ‰…‘}É•…‘äˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤ì(€€€€€ô…Ñ €¡•ÉÈ¤ì(€€€€€€€…¹…±åÑ¥ÍÙ•¹Ð ‰…‘}•ÉÉ½Èˆ°•™™•Ñ¥Ù•Y¥•Üñð€‰¡½µ”ˆ¤ì(€€€€€€€½¹Í½±”¹Ý…É¸ ‰‘5½ˆ‰…¹¹•È™…¥±•Ñ¼±½…ˆ°•ÉÈ¤ì(€€€€€ô(€€€ô¤ ¤ì(€€€É•ÑÕÉ¸€ ¤€ôøì(€€€€€‘5½ˆ¹É•µ½Ù•	…¹¹•È ¤¹…Ñ   ¤€ôøíô¤ì(€€€ôì(€ô°mt¤ì((€½¹ÍÐmÍ…Ù•Q½…ÍÐ°Í•ÑM…Ù•Q½…ÍÑt€ôÕÍ•MÑ…Ñ”¡¹Õ±°¤ì€¼¼€‰½¬ˆð€‰•ÉÉ½Èˆð¹Õ±°((€½¹ÍÐÁ•ÉÍ¥ÍÑA•ÑÌ€ô…Íå¹Œ€¡¹•áÐ¤€ôøì(€€€Í•ÑA•ÑÌ¡¹•áÐ¤ì(€€€½¹ÍÐ½¬Ä€ô…Ý…¥ÐÍ…™•M•Ð ‰‰‰½°é‘½Ìˆ°¹•áÐ¹‘½œ°…½Õ¹Ð¤ì(€€€½¹ÍÐ½¬È€ô…Ý…¥ÐÍ…™•M•Ð ‰‰‰½°é…ÑÌˆ°¹•áÐ¹…Ð°…½Õ¹Ð¤ì(€€€™±…Í¡M…Ù•Q½…ÍÐ¡½¬Ä€˜˜½¬È¤ì(€ôì(€½¹ÍÐÁ•ÉÍ¥ÍÑÑ¥Ù”€ô€¡¹•áÐ¤€ôøì(€€€Í•ÑÑ¥Ù•%¡¹•áÐ¤ì(€€€Í…™•M•Ð ‰‰‰½°é…Ñ¥Ù•%‘Ìˆ°¹•áÐ°…½Õ¹Ð¤ì(€ôì(€½¹ÍÐ™±…Í¡M…Ù•Q½…ÍÐ€ô€¡½¬¤€ôøì(€€€Í•ÑM…Ù•Q½…ÍÐ¡½¬€ü€‰½¬ˆ€è€‰•ÉÉ½Èˆ¤ì(€€€Í•ÑQ¥µ•½ÕÐ  ¤€ôøÍ•ÑM…Ù•Q½…ÍÐ¡¹Õ±°¤°½¬€ü€ÄØÀÀ€è€ÌÈÀÀ¤ì(€ôì((€½¹ÍÐÍÉ½±±Q½Q½À€ô€ ¤€ôøì(€€€¥˜€¡ÑåÁ•½˜Ý¥¹‘½Ü€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸ì(€€€É•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”  ¤€ôøÝ¥¹‘½Ü¹ÍÉ½±±Q¼¡ìÑ½Àè€À°±•™Ðè€À°‰•¡…Ù¥½Èè€‰…ÕÑ¼ˆô¤¤ì(€ôì((€½¹ÍÐ½Y¥•Ü€ô€¡Ø¤€ôøì½¹ÍÐ¹•áÐô¡Øôôô‰Ñ…±¬‰ññØôôô‰Á•ÑÑ…±¬‰ññØôôô‰Á•ÐµÑ…±¬ˆ¤ü‰½µµÕ¹¥ÑäˆéØìÍ•ÑY¥•Ü¡¹•áÐ¤ì¥˜¡…½Õ¹Ðü¹¥¥±½A•ÑÑ¥Ù¥Ñä¡íÍ•Ñ¥½¸é¹•áÐ±…Ñ¥½¸è‰Ù¥•Üˆ±Ñ¥Ñ±”è¡í¡½µ”è‹¶f ˆ±…‰½ÕÐè‹²3ªÂpˆ±Á•ÑÌè‹²jÃ®š°ƒ²V²vÐˆ±¹•…É‰äè‹®
Ðƒ²Žó®Î A•Ðˆ±½µµÕ¹¥Ñäè‰A•Ó¶„ˆ±Í…©Ôè‰A•Ó²
³²Žðˆ±Ñ…É½Ðè‰A•Ó¶®†pˆ±Á•Ñ‰Ñ¤è‰A•Ñ	Q$ˆ±µÕÍ¥Œè‰A•Ó²v3²Vˆ±Ñ¥ÁÌè‰A•Ó²‚W®ÎÐˆ±¹•ÝÌè‰A•Ó®&Ó²*ˆ±Õ¥‘”è‹²‚W®ÎÓªÂ²vÓ®Npˆ±µäè‹®ž#²vÓ¶:c²vÓ²ž ˆ±ÍÕÁÁ½ÉÐè‹ªÎƒªÂw²ž²n@‰õm¹•áÑuññ¹•áÐ¥ô¤ìÍÉ½±±Q½Q½À ¤ìôì((€€¼¼ƒ®>²n®žC²v ƒ²zC®>g²ró®†pƒ²^Ó²ž ƒ²V+²V²jP¸ƒ²
³²j§²zCªÂ ƒªÂƒ¶fS®¦Ó²v`€üƒ®Ê¶*ó²vƒ®"3®‚²vƒ®V3®ž0ƒ¶Fs².s¶V§®.#®.¸(€ÕÍ•™™•Ð  ¤€ôøì(€€€Í•Ñ5•¹Õ!•±Á=Á•¸¡™…±Í”¤ì(€ô°mÙ¥•Ü°…½Õ¹Ñt¤ì((€½¹ÍÐÕÉÉ•¹Ñ1¥ÍÐ€ôÁ•ÑÍmÍÁ•¥•Ítì(€½¹ÍÐÕÉÉ•¹ÑA•Ð€ôÕÉÉ•¹Ñ1¥ÍÐ¹™¥¹ ¡À¤€ôøÀ¹¥€ôôô…Ñ¥Ù•%‘mÍÁ•¥•Ít¤ñð¹Õ±°ì(€½¹ÍÐ…±±A•ÑÌ€ôl(€€€€¸¸¹Á•ÑÌ¹‘½œ¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°ÍÁ•¥•Ìè€‰‘½œˆô¤¤°(€€€€¸¸¹Á•ÑÌ¹…Ð¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°ÍÁ•¥•Ìè€‰…Ðˆô¤¤°(€tì(€½¹ÍÐ™•…ÑÕÉ•A•Ð€ô…±±A•ÑÌ¹™¥¹ ¡À¤€ôøÀ¹¥€ôôô™•…ÑÕÉ•A•Ñ%¤ñðÕÉÉ•¹ÑA•Ðñð…±±A•ÑÍlÁtñð¹Õ±°ì((€½¹ÍÐ¡…¹‘±•‘‘A•Ð€ô€¡ÁÉ½™¥±•…Ñ„¤€ôøì(€€€½¹ÍÐ¥Í¥ÉÍÑÙ•È€ôÁ•ÑÌ¹‘½œ¹±•¹Ñ €¬Á•ÑÌ¹…Ð¹±•¹Ñ €ôôô€Àì(€€€½¹ÍÐ¹•ÝA•Ð€ôì(€€€€€¥è€‘íÍÁ•¥•Íô´‘í…Ñ”¹¹½Ü ¥õ€°(€€€€€ÁÉ½™¥±”èÁÉ½™¥±•…Ñ„°(€€€€€É•½É‘Ìèmì¥è€‰¥¹¥Ñ¥…°ˆ°‘…Ñ”è¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤°Ý•¥¡Ñ-œèÁÉ½™¥±•…Ñ„¹¥¹¥Ñ¥…±]•¥¡Ñ-œõt°(€€€€€Á¡½Ñ½Ìèmt°(€€€€€Ù…¥¹•¡•­±¥ÍÐèíô°(€€€ôì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôl¸¸¹ÕÉÉ•¹Ñ1¥ÍÐ°¹•ÝA•Ñtì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€€€Á•ÉÍ¥ÍÑÑ¥Ù”¡ì€¸¸¹…Ñ¥Ù•%°mÍÁ•¥•Ítè¹•ÝA•Ð¹¥ô¤ì(€€€Í•Ñ5½‘” ‰Ù¥•Üˆ¤ì(€€€ÍÉ½±±Q½Q½À ¤ì(€€€¥˜€¡¥Í¥ÉÍÑÙ•È¤ì(€€€€€Í•ÑÕ¥‘•=Á•¸¡ÑÉÕ”¤ì(€€€€€Í…™•M•Ð ‰‰‰½°éÕ¥‘•M••¸ˆ°ÑÉÕ”°…½Õ¹Ð¤ì(€€€ô(€ôì((€½¹ÍÐ¡…¹‘±•‘¥ÑAÉ½™¥±”€ô€¡ÁÉ½™¥±•…Ñ„¤€ôøì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôÕÉÉ•¹Ñ1¥ÍÐ¹µ…À ¡À¤€ôø€¡À¹¥€ôôôÕÉÉ•¹ÑA•Ð¹¥€üì€¸¸¹À°ÁÉ½™¥±”èÁÉ½™¥±•…Ñ„ô€èÀ¤¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€€€Í•Ñ5½‘” ‰Ù¥•Üˆ¤ì(€€€ÍÉ½±±Q½Q½À ¤ì(€ôì((€½¹ÍÐ¡…¹‘±•UÁ‘…Ñ•AÉ½™¥±•%µ…”€ô€¡‘…Ñ…UÉ°¤€ôøì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôÕÉÉ•¹Ñ1¥ÍÐ¹µ…À ¡À¤€ôø€¡À¹¥€ôôôÕÉÉ•¹ÑA•Ð¹¥€üì€¸¸¹À°ÁÉ½™¥±”èì€¸¸¹À¹ÁÉ½™¥±”°ÁÉ½™¥±•%µ…”è‘…Ñ…UÉ°ôô€èÀ¤¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€ôì((€½¹ÍÐ¡…¹‘±•Q½±•Y…¥¹•%Ñ•´€ô€¡¥¹‘•à¤€ôøì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôÕÉÉ•¹Ñ1¥ÍÐ¹µ…À ¡À¤€ôøì(€€€€€¥˜€¡À¹¥€„ôôÕÉÉ•¹ÑA•Ð¹¥¤É•ÑÕÉ¸Àì(€€€€€½¹ÍÐ¹•áÑ¡•­±¥ÍÐ€ôì€¸¸¸¡À¹Ù…¥¹•¡•­±¥ÍÐñðíô¤ôì(€€€€€¹•áÑ¡•­±¥ÍÑm¥¹‘•át€ô€…¹•áÑ¡•­±¥ÍÑm¥¹‘•átì(€€€€€É•ÑÕÉ¸ì€¸¸¹À°Ù…¥¹•¡•­±¥ÍÐè¹•áÑ¡•­±¥ÍÐôì(€€€ô¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€ôì((€½¹ÍÐÉ•ÅÕ•ÍÑ•±•Ñ•A•Ð€ô€ ¤€ôøì(€€€¥˜€ …ÕÉÉ•¹ÑA•Ð¤É•ÑÕÉ¸ì(€€€Í•Ñ•±•Ñ•Q…É•Ð¡ì¥èÕÉÉ•¹ÑA•Ð¹¥°¹…µ”èÕÉÉ•¹ÑA•Ð¹ÁÉ½™¥±”¹¹…µ”ô¤ì(€ôì(€½¹ÍÐ½¹™¥Éµ•±•Ñ•A•Ð€ô€ ¤€ôøì(€€€¥˜€ …‘•±•Ñ•Q…É•Ð¤É•ÑÕÉ¸ì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôÕÉÉ•¹Ñ1¥ÍÐ¹™¥±Ñ•È ¡À¤€ôøÀ¹¥€„ôô‘•±•Ñ•Q…É•Ð¹¥¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€€€Á•ÉÍ¥ÍÑÑ¥Ù”¡ì€¸¸¹…Ñ¥Ù•%°mÍÁ•¥•Ítè¹•áÑ1¥ÍÑlÁt€ü¹•áÑ1¥ÍÑlÁt¹¥€è¹Õ±°ô¤ì(€€€Í•Ñ•±•Ñ•Q…É•Ð¡¹Õ±°¤ì(€ôì((€½¹ÍÐÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð€ô€¡ÕÁ‘…Ñ•È¤€ôøì(€€€½¹ÍÐ¹•áÑ1¥ÍÐ€ôÕÉÉ•¹Ñ1¥ÍÐ¹µ…À ¡À¤€ôø€¡À¹¥€ôôôÕÉÉ•¹ÑA•Ð¹¥€üÕÁ‘…Ñ•È¡À¤€èÀ¤¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì€¸¸¹Á•ÑÌ°mÍÁ•¥•Ítè¹•áÑ1¥ÍÐô¤ì(€ôì(€€¼¼A•Ñ	Q'®*Pƒ¶b²z°ƒ¶fs²Äƒ®Âc®‚“®>g®²ó²vÐƒ²V®.0ƒ®.“®–àƒ²V²vÓ®–ðƒ¶3²*“¶*ã¶V€ƒ²"c®>ƒ²z#²ZÓ²p°ƒªÂW²V²ž
ßªÎƒ²ZG²vÐƒ®ª§®†tƒ²‚²ÊÓ²^C²p¥“®†pƒ²Âû²Vƒ²^®6Ã²vÓ¶*ã¶VÓ²jP(€½¹ÍÐ¡…¹‘±•UÁ‘…Ñ•A•Ñ	Ñ¤€ô€¡Á•Ñ%°Á•Ñ	Ñ¤¤€ôøì(€€€½¹ÍÐ¹•áÑ½Ì€ôÁ•ÑÌ¹‘½œ¹µ…À ¡À¤€ôø€¡À¹¥€ôôôÁ•Ñ%€üì€¸¸¹À°Á•Ñ	Ñ¤ô€èÀ¤¤ì(€€€½¹ÍÐ¹•áÑ…ÑÌ€ôÁ•ÑÌ¹…Ð¹µ…À ¡À¤€ôø€¡À¹¥€ôôôÁ•Ñ%€üì€¸¸¹À°Á•Ñ	Ñ¤ô€èÀ¤¤ì(€€€Á•ÉÍ¥ÍÑA•ÑÌ¡ì‘½œè¹•áÑ½Ì°…Ðè¹•áÑ…ÑÌô¤ì(€ôì((€½¹ÍÐ¡…¹‘±•‘‘I•½É€ô€¡É•½É¤€ôøÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð ¡À¤€ôø€¡ì€¸¸¹À°É•½É‘Ìèl¸¸¹À¹É•½É‘Ì°É•½É‘tô¤¤ì(€½¹ÍÐ¡…¹‘±••±•Ñ•I•½É€ô€¡É•½É‘%¤€ôøÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð ¡À¤€ôø€¡ì(€€€€¸¸¹À°É•½É‘ÌèÀ¹É•½É‘Ì¹™¥±Ñ•È ¡È¤€ôøÈ¹¥€„ôôÉ•½É‘%¤°(€ô¤¤ì(€½¹ÍÐ¡…¹‘±•‘‘A¡½Ñ¼€ô€¡‘…Ñ”°‘…Ñ…UÉ±Ì¤€ôøÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð ¡À¤€ôøì(€€€½¹ÍÐ±¥ÍÐ€ôÉÉ…ä¹¥ÍÉÉ…ä¡‘…Ñ…UÉ±Ì¤€ü‘…Ñ…UÉ±Ì€èm‘…Ñ…UÉ±Ítì(€€€½¹ÍÐÍÑ…µÀ€ô…Ñ”¹¹½Ü ¤ì(€€€É•ÑÕÉ¸ì€¸¸¹À°Á¡½Ñ½Ìèl¸¸¹À¹Á¡½Ñ½Ì°€¸¸¹±¥ÍÐ¹µ…À ¡‘…Ñ…UÉ°°¥¹‘•à¤€ôø€¡ì¥è€‘íÍÑ…µÁô´‘í¥¹‘•áõ€°‘…Ñ”°‘…Ñ…UÉ°ô¤¥tôì(€ô¤ì(€½¹ÍÐ¡…¹‘±•‘¥ÑA¡½Ñ¼€ô€¡Á¡½Ñ½%°¡…¹•Ì¤€ôøÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð ¡À¤€ôø€¡ì(€€€€¸¸¹À°(€€€Á¡½Ñ½ÌèÀ¹Á¡½Ñ½Ì¹µ…À ¡Á ¤€ôø€¡Á ¹¥€ôôôÁ¡½Ñ½%€üì€¸¸¹Á °€¸¸¸¡¡…¹•Ìñðíô¤ô€èÁ ¤¤°(€ô¤¤ì(€½¹ÍÐ¡…¹‘±••±•Ñ•A¡½Ñ¼€ô€¡Á¡½Ñ½%¤€ôøÕÁ‘…Ñ•ÕÉÉ•¹ÑA•Ð ¡À¤€ôø€¡ì(€€€€¸¸¹À°Á¡½Ñ½ÌèÀ¹Á¡½Ñ½Ì¹™¥±Ñ•È ¡Á ¤€ôøÁ ¹¥€„ôôÁ¡½Ñ½%¤°(€ô¤¤ì((€€¼¼€´´´´ƒ®†sªÞã²và€¼ƒ®†sªÞã²V²n€¼ƒ¶j3²nC¶#¶Ð€´´´´(€½¹ÍÐ¡…¹‘±•1½½ÕÐ€ô…Íå¹Œ€ ¤€ôøì(€€€€¼¼ƒ®†sªÞã²V²nƒ¶nƒ²‚²ÊÐƒ¶:c²vÓ²ž®–ðƒªÂW²‚s®†pƒ²#®†sªÎƒ²æ£¶Vc®¦ÐA]¿²êC².pƒ¶fcªÊ÷²^C²p(€€€€¼¼ƒ®æ ƒ¶fS®¦Ó²vÐƒ®
£²vƒ²"`ƒ²z#²ZÓ²jP¸ƒ²ã²c²vƒ²Š®Ž3¶Vpƒ®JI•…Ðƒ²¶s®–ðƒ²š'².p(€€€€¼¼ƒ®æ®†sªÞã²vàƒ¶f#²ró®†pƒ²‚¶fc¶VÓ²pƒ²nä¿®ª£®ÂS²vðƒ²näƒ®ª£®F@ƒ²V#²‚W²‚²ró®†pƒ®Î×ªÞ².s²òs²jP¸(€€€…Ý…¥Ð…Á¥1½½ÕÐ ¤ì(€€€Í•Ñ½Õ¹Ñ5½‘…±=Á•¸¡™…±Í”¤ì(€€€Í•Ñ½Õ¹Ð¡¹Õ±°¤ì(€€€Í•ÑA•¹‘¥¹5¥É…Ñ¥½¸¡¹Õ±°¤ì(€€€Í•Ñ•…ÑÕÉ•A•Ñ%¡¹Õ±°¤ì(€€€Í•Ñ5½‘” ‰Ù¥•Üˆ¤ì((€€€€¼¼ƒ®†sªÞã²V²nƒ²š'².pƒ¶fS®¦Ó²v`ƒ®Âc®‚“®>g®²ðƒ²¶s®–ðƒ®æ²n0ƒªÂs²vã²‚W®ÎÓªÂ ƒ®
£²Vƒ®ÎÓ²vÓ²ž ƒ²V+ªÊ0ƒ¶VÓ²jP¸(€€€€¼¼ƒªâÃ²†Ð±½…±MÑ½É…”ƒ®6Ã²vÓ¶Ã®*Pƒ²
·²‚s¶Vc²ž ƒ²V+ªÎ€ƒ®ÎÓªÒ¶VÐ°ƒ®.“²v0ƒ®†sªÞã²vàƒ®V0ƒ²vÓ²‚ƒ²V#®
Ó²^@ƒ²
³²j§¶V€ƒ²"`ƒ²z#²ZÓ²jP¸(€€€Í•ÑA•ÑÌ¡ì‘½œèmt°…Ðèmtô¤ì(€€€Í•ÑÑ¥Ù•%¡ì‘½œè¹Õ±°°…Ðè¹Õ±°ô¤ì((€€€Í•ÑY¥•Ü ‰¡½µ”ˆ¤ì(€€€ÍÉ½±±Q½Q½À ¤ì((€€€€¼¼ƒ²Žó²3²Â÷²^@ƒ®†sªÞã²vàƒ²ös®ÂÄƒ¶23®vó®¾ã¶Àƒ®NÇ²vÐƒ®
£²Vƒ²z#®6S®vó®>ƒ¶f UI3®†pƒ²‚W®š³¶VÓ²jP¸(€€€¥˜€¡Ý¥¹‘½Ü¹±½…Ñ¥½¸¹Á…Ñ¡¹…µ”€„ôô€ˆ¼ˆñðÝ¥¹‘½Ü¹±½…Ñ¥½¸¹Í•…É ¤ì(€€€€€Ý¥¹‘½Ü¹¡¥ÍÑ½Éä¹É•Á±…•MÑ…Ñ”¡íô°€ˆˆ°€ˆ¼ˆ¤ì(€€€ô(€ôì(€½¹ÍÐ¡…¹‘±•½¹™¥Éµ•±•Ñ•½Õ¹Ð€ô…Íå¹Œ€ ¤€ôøì(€€€Í•Ñ•±•Ñ¥¹½Õ¹Ð¡ÑÉÕ”¤ì(€€€½¹ÍÐ½¬€ô…Ý…¥Ð…Á¥•±•Ñ•½Õ¹Ð ¤ì(€€€Í•Ñ•±•Ñ¥¹½Õ¹Ð¡™…±Í”¤ì(€€€¥˜€ …½¬¤É•ÑÕÉ¸ì((€€€€¼¼ƒ¶j3²nC¶#¶ÐA'ªÂ ƒ²ÇªÎ×¶Vc®¦Ðƒ²s®Êƒ²ã²`ƒ²þƒ¶
“®>ƒ¶V£ªî`ƒ®ž3®Ž3®>ó²jP¸(€€€€¼¼ƒ¶fW²vàƒ¶2w²^²vƒ®.¯ªÎ€ƒ²f®Ž0ƒ²V#®
Ó®–ðƒ®ÎÓ²^³²’ ƒ®Jƒ®æ®†sªÞã²vàƒ¶f ƒ²¶s®†pƒ²‚¶fc¶VÓ²jP¸(€€€Í•Ñ•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¸¡™…±Í”¤ì(€€€Í•Ñ•±•Ñ•½Õ¹Ñ½¹•=Á•¸¡ÑÉÕ”¤ì(€€€Í•Ñ½Õ¹Ñ5½‘…±=Á•¸¡™…±Í”¤ì(€€€Í•Ñ½Õ¹Ð¡¹Õ±°¤ì(€€€Í•ÑA•¹‘¥¹5¥É…Ñ¥½¸¡¹Õ±°¤ì(€€€Í•Ñ•…ÑÕÉ•A•Ñ%¡¹Õ±°¤ì(€€€Í•Ñ5½‘” ‰Ù¥•Üˆ¤ì(€€€Í•ÑA•ÑÌ¡ì‘½œèmt°…Ðèmtô¤ì(€€€Í•ÑÑ¥Ù•%¡ì‘½œè¹Õ±°°…Ðè¹Õ±°ô¤ì((€€€€¼¼ƒªÎóªÆÀƒ®Ê²‚²^C²pƒ®â3®vó²jÃ²‚²^@ƒ®
£²Vc²vƒ²"`ƒ²z#®*PƒªÎ²‚TƒªÒ®‚ ƒ®†s²î°ƒ®6Ã²vÓ¶Ã®>ƒ²‚W®š³¶VÓ²jP¸(€€€€¼¼ƒ¶#¶Ðƒ¶nƒ²b#²‚ƒ®Âc®‚“®>g®²ðƒ²‚W®ÎÓªÂ ƒ®.“².pƒ®ÎÓ²vÓ®*Pƒ²vó²vƒ®ž'²*×®.#®.¸(€€€ÑÉäì(€€€€€l(€€€€€€€€‰‰‰½°é‘½Ìˆ°€‰‰‰½°é…ÑÌˆ°€‰‰‰½°é…Ñ¥Ù•%‘Ìˆ°(€€€€€€€€‰‰‰½°é‘½ÌéÕ•ÍÐˆ°€‰‰‰½°é…ÑÌéÕ•ÍÐˆ°€‰‰‰½°é…Ñ¥Ù•%‘ÌéÕ•ÍÐˆ°(€€€€€€€€‰‰‰½°éÁ¡½Ñ½Ìˆ°€‰‰‰½°éÁÉ½™¥±”ˆ°€‰‰‰½°éÉ•½É‘Ìˆ(€€€€€t¹™½É…  ¡­•ä¤€ôøÝ¥¹‘½Ü¹±½…±MÑ½É…”¹É•µ½Ù•%Ñ•´¡­•ä¤¤ì(€€€ô…Ñ íô((€€€Í•ÑY¥•Ü ‰¡½µ”ˆ¤ì(€€€ÍÉ½±±Q½Q½À ¤ì(€€€Ý¥¹‘½Ü¹¡¥ÍÑ½Éä¹É•Á±…•MÑ…Ñ”¡íô°€ˆˆ°€ˆ¼ˆ¤ì(€ôì(€½¹ÍÐ¡…¹‘±•½¹™¥Éµ5¥É…Ñ¥½¸€ô…Íå¹Œ€ ¤€ôøì(€€€¥˜€ …Á•¹‘¥¹5¥É…Ñ¥½¸¤É•ÑÕÉ¸ì(€€€Í•Ñ5¥É…Ñ¥¹œ¡ÑÉÕ”¤ì(€€€½¹ÍÐ½¬Ä€ô…Ý…¥ÐÍ…™•M•Ð ‰‰‰½°é‘½Ìˆ°Á•¹‘¥¹5¥É…Ñ¥½¸¹‘½Ì°…½Õ¹Ð¤ì(€€€½¹ÍÐ½¬È€ô…Ý…¥ÐÍ…™•M•Ð ‰‰‰½°é…ÑÌˆ°Á•¹‘¥¹5¥É…Ñ¥½¸¹…ÑÌ°…½Õ¹Ð¤ì(€€€¥˜€¡½¬Ä€˜˜½¬È¤ì(€€€€€½¹ÍÐ‘½Ì€ô€¡Á•¹‘¥¹5¥É…Ñ¥½¸¹‘½Ìñðmt¤¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°Á¡½Ñ½Ìè¹½Éµ…±¥é•A¡½Ñ½Ì¡À¹Á¡½Ñ½Ì°À¹ÁÉ½™¥±”¹‰¥ÉÑ¡…Ñ”¤ô¤¤ì(€€€€€½¹ÍÐ…ÑÌ€ô€¡Á•¹‘¥¹5¥É…Ñ¥½¸¹…ÑÌñðmt¤¹µ…À ¡À¤€ôø€¡ì€¸¸¹À°Á¡½Ñ½Ìè¹½Éµ…±¥é•A¡½Ñ½Ì¡À¹Á¡½Ñ½Ì°À¹ÁÉ½™¥±”¹‰¥ÉÑ¡…Ñ”¤ô¤¤ì(€€€€€Í•ÑA•ÑÌ¡ì‘½œè‘½Ì°…Ðè…ÑÌô¤ì(€€€€€Í•ÑÑ¥Ù•%¡ì‘½œè‘½ÍlÁtü¹¥ñð¹Õ±°°…Ðè…ÑÍlÁtü¹¥ñð¹Õ±°ô¤ì(€€€€€€¼¼ƒ²s®Êƒ²‚²z—²vÐƒ¶fW²vã®Bpƒ®J“²^C®ž0ƒ²vÐƒªâÃªâÃ²v`ƒ²blƒ®†s²î°ƒ®6Ã²vÓ¶Ã®–ðƒ²‚W®š³¶VÓ²jP(€€€€€ÑÉäì(€€€€€€€Ý¥¹‘½Ü¹±½…±MÑ½É…”¹É•µ½Ù•%Ñ•´ ‰‰‰½°é‘½Ìˆ¤ì(€€€€€€€Ý¥¹‘½Ü¹±½…±MÑ½É…”¹É•µ½Ù•%Ñ•´ ‰‰‰½°é…ÑÌˆ¤ì(€€€€€€€Ý¥¹‘½Ü¹±½…±MÑ½É…”¹É•µ½Ù•%Ñ•´ ‰‰‰½°é…Ñ¥Ù•%‘Ìˆ¤ì(€€€€€ô…Ñ íô(€€€€€Í•ÑA•¹‘¥¹5¥É…Ñ¥½¸¡¹Õ±°¤ì(€€€ô•±Í”ì(€€€€€™±…Í¡M…Ù•Q½…ÍÐ¡™…±Í”¤ì(€€€ô(€€€Í•Ñ5¥É…Ñ¥¹œ¡™…±Í”¤ì(€ôì((€¥˜€ …±½…‘•ñð€……ÕÑ¡¡•­•¤É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰‰½°µÉ½½ÐÁ•ÑÉ½Üµ‰½½ÐµÍ­•±•Ñ½¸ˆÍÑå±”õíìµ¥¹!•¥¡Ðè€ˆÄÀÁÙ ˆ°Á…‘‘¥¹œè€ˆÈÉÁàˆõôø(€€€€€€ñ±½‰…±MÑå±”€¼ø(€€€€€€ñ‘¥ØÍÑå±”õíìµ…á]¥‘Ñ è€ÄÄàÀ°µ…É¥¸è€ˆÀ…ÕÑ¼ˆõôø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰½½ÐµÍ­•°µ¡•…ˆøñ¤¼øñ‘¥Øøñˆ¼øñÍÁ…¸¼øð½‘¥Øøð½‘¥Øø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰½½ÐµÍ­•°µ¡•É¼ˆøñˆ¼øñÍÁ…¸¼øñÍÁ…¸¼øð½‘¥Øø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰½½ÐµÍ­•°µÉ¥ˆùílÀ°Ä°È°Ì°Ð°Õt¹µ…À¡¤ôøñ‘¥Ø±…ÍÍ9…µ”ô‰‰½½ÐµÍ­•°µ…Éˆ­•äõí¥ôøñ¤¼øñˆ¼øñÍÁ…¸¼øð½‘¥Øø¥ôð½‘¥Øø(€€€€€€ð½‘¥Øø(€€€€€€ñÍÑå±”ùí€(€€€€€€€€¹Á•ÑÉ½Üµ‰½½ÐµÍ­•±•Ñ½¹í‰…­É½Õ¹èáÜí½±½ÈéÙ…È ´µÑ•áÐ¤í‰½àµÍ¥é¥¹œé‰½É‘•Èµ‰½áô(€€€€€€€€¹‰½½ÐµÍ­•°µ¡•…‘í‘¥ÍÁ±…äé™±•àí…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí…ÀèÄÉÁàíµ…É¥¸µ‰½ÑÑ½´èÈÙÁáô¹‰½½ÐµÍ­•°µ¡•…ù¥íÝ¥‘Ñ èÐÉÁàí¡•¥¡ÐèÐÉÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄÕÁáô¹‰½½ÐµÍ­•°µ¡•…‘¥Ùí‘¥ÍÁ±…äéÉ¥í…ÀèÝÁáô¹‰½½ÐµÍ­•°µ¡•…‰íÝ¥‘Ñ èÄÀÕÁàí¡•¥¡ÐèÄÑÁàí‰½É‘•ÈµÉ…‘¥ÕÌèáÁáô¹‰½½ÐµÍ­•°µ¡•…ÍÁ…¹íÝ¥‘Ñ èÄÔÕÁàí¡•¥¡ÐèåÁàí‰½É‘•ÈµÉ…‘¥ÕÌèáÁáô(€€€€€€€€¹‰½½ÐµÍ­•°µ¡•É½íÁ…‘‘¥¹œèÈáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÈÕÁàí‰…­É½Õ¹è™™˜í‰½É‘•ÈèÅÁàÍ½±¥€Í	Ðíµ…É¥¸µ‰½ÑÑ½´èÄáÁàí‘¥ÍÁ±…äéÉ¥í…ÀèÄÁÁáô¹‰½½ÐµÍ­•°µ¡•É¼‰íÝ¥‘Ñ éµ¥¸ ÌÌÁÁà°ÜÀ”¤í¡•¥¡ÐèÈÉÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄÁÁáô¹‰½½ÐµÍ­•°µ¡•É¼ÍÁ…¹í¡•¥¡ÐèÄÅÁàí‰½É‘•ÈµÉ…‘¥ÕÌèáÁáô¹‰½½ÐµÍ­•°µ¡•É¼ÍÁ…¸é¹Ñ µ¡¥± È¥íÝ¥‘Ñ éµ¥¸ ÔÀÁÁà°äÀ”¥ô¹‰½½ÐµÍ­•°µ¡•É¼ÍÁ…¸é¹Ñ µ¡¥± Ì¥íÝ¥‘Ñ éµ¥¸ ÌÜÁÁà°ÜÈ”¥ô(€€€€€€€€¹‰½½ÐµÍ­•°µÉ¥‘í‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌéÉ•Á•…Ð Ì±µ¥¹µ…à À°Å™È¤¤í…ÀèÄÑÁáô¹‰½½ÐµÍ­•°µ…É‘íµ¥¸µ¡•¥¡ÐèÄÈÁÁàíÁ…‘‘¥¹œèÄáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÈÉÁàí‰…­É½Õ¹è™™˜í‰½É‘•ÈèÅÁàÍ½±¥€Í	Ðí‘¥ÍÁ±…äéÉ¥í…±¥¸µ½¹Ñ•¹ÐéÍÑ…ÉÐí…ÀèÄÅÁáô¹‰½½ÐµÍ­•°µ…É¥íÝ¥‘Ñ èÌáÁàí¡•¥¡ÐèÌáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄÍÁáô¹‰½½ÐµÍ­•°µ…É‰íÝ¥‘Ñ èÐÐ”í¡•¥¡ÐèÄÑÁàí‰½É‘•ÈµÉ…‘¥ÕÌèáÁáô¹‰½½ÐµÍ­•°µ…ÉÍÁ…¹íÝ¥‘Ñ èÜà”í¡•¥¡ÐèÄÁÁàí‰½É‘•ÈµÉ…‘¥ÕÌèáÁáô(€€€€€€€€¹‰½½ÐµÍ­•°µ¡•…¤°¹‰½½ÐµÍ­•°µ¡•…ˆ°¹‰½½ÐµÍ­•°µ¡•…ÍÁ…¸°¹‰½½ÐµÍ­•°µ¡•É¼ˆ°¹‰½½ÐµÍ­•°µ¡•É¼ÍÁ…¸°¹‰½½ÐµÍ­•°µ…É¤°¹‰½½ÐµÍ­•°µ…Éˆ°¹‰½½ÐµÍ­•°µ…ÉÍÁ…¹í‘¥ÍÁ±…äé‰±½¬í‰…­É½Õ¹é±¥¹•…ÈµÉ…‘¥•¹Ð äÁ‘•œ°Í€ÈÔ”°á	à€ÐÔ”°Í€ØÔ”¤í‰…­É½Õ¹µÍ¥é”èÈÐÀ”€ÄÀÀ”í…¹¥µ…Ñ¥½¸éÁ•ÑÉ½Ý	½½ÑM¡¥µµ•È€Ä¸ÄÕÌ•…Í”µ¥¸µ½ÕÐ¥¹™¥¹¥Ñ•ô(€€€€€€€­•å™É…µ•ÌÁ•ÑÉ½Ý	½½ÑM¡¥µµ•ÉìÀ•í‰…­É½Õ¹µÁ½Í¥Ñ¥½¸èÄÀÀ”€ÁôÄÀÀ•í‰…­É½Õ¹µÁ½Í¥Ñ¥½¸è´ÄÀÀ”€Áõô(€€€€€€€µ•‘¥„¡µ…àµÝ¥‘Ñ èÜØÁÁà¥ì¹Á•ÑÉ½Üµ‰½½ÐµÍ­•±•Ñ½¹íÁ…‘‘¥¹œèÄáÁà€ÄÑÁà…¥µÁ½ÉÑ…¹Ñô¹‰½½ÐµÍ­•°µÉ¥‘íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È€Å™Èí…ÀèÄÁÁáô¹‰½½ÐµÍ­•°µ…É‘íµ¥¸µ¡•¥¡ÐèÄÀÑÁàíÁ…‘‘¥¹œèÄÑÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄáÁáô¹‰½½ÐµÍ­•°µ¡•É½íÁ…‘‘¥¹œèÈÉÁà€ÄáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÈÅÁáõô(€€€€€€€µ•‘¥„¡ÁÉ•™•ÉÌµÉ•‘Õ•µµ½Ñ¥½¸éÉ•‘Õ”¥ì¹‰½½ÐµÍ­•°µ¡•…¤°¹‰½½ÐµÍ­•°µ¡•…ˆ°¹‰½½ÐµÍ­•°µ¡•…ÍÁ…¸°¹‰½½ÐµÍ­•°µ¡•É¼ˆ°¹‰½½ÐµÍ­•°µ¡•É¼ÍÁ…¸°¹‰½½ÐµÍ­•°µ…É¤°¹‰½½ÐµÍ­•°µ…Éˆ°¹‰½½ÐµÍ­•°µ…ÉÍÁ…¹í…¹¥µ…Ñ¥½¸é¹½¹•õô(€€€€(€€¼¨AQA=%9Q}M!	=I}%91|ÈÀÈØÀàÄÜ€¨¼(€€¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÍí‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌéÉ•Á•…Ð Ð°Å™È¤í…ÀèåÁàíµ…É¥¸èÄÕÁà€Áô¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÌù‘¥ÙíÁ…‘‘¥¹œèÄÍÁàí‰½É‘•ÈèÅÁàÍ½±¥€”Õ•…‘˜í‰½É‘•ÈµÉ…‘¥ÕÌèÄÑÁàí‰…­É½Õ¹è™™™ô¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÌÍµ…±±í‘¥ÍÁ±…äé‰±½¬í™½¹ÐµÍ¥é”èÄÁÁàí½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÌ‰í‘¥ÍÁ±…äé‰±½¬íµ…É¥¸µÑ½ÀèÑÁàí™½¹ÐµÍ¥é”èÄÝÁáô¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÌ€¹Á±ÕÌˆ°¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜÍÑÉ½¹œ¹Á±ÕÍí½±½ÈèŒÉ˜Ý„Ñ…ô¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÌ€¹µ¥¹ÕÌˆ°¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜÍÑÉ½¹œ¹µ¥¹ÕÍí½±½ÈèŒáˆØÄÌÕô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ¡•…‘í‘¥ÍÁ±…äé™±•àí©ÕÍÑ¥™äµ½¹Ñ•¹ÐéÍÁ…”µ‰•ÑÝ••¸í…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí…ÀèÄÉÁàíµ…É¥¸µÑ½ÀèÄÝÁàíÁ…‘‘¥¹œµÑ½ÀèÄÕÁàí‰½É‘•ÈµÑ½ÀèÅÁàÍ½±¥€”å”Õ‘ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ¡•…ù‘¥Ø‰í‘¥ÍÁ±…äé‰±½¬í™½¹ÐµÍ¥é”èÄÑÁáô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ¡•…ù‘¥ØÍµ…±±í‘¥ÍÁ±…äé‰±½¬íµ…É¥¸µÑ½ÀèÍÁàí™½¹ÐµÍ¥é”èä¸ÕÁàí½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÑ…‰Íí‘¥ÍÁ±…äé™±•àí…ÀèÝÁàíµ…É¥¸èÄÅÁà€Áô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÑ…‰Ì‰ÕÑÑ½¹í‰½É‘•ÈèÅÁàÍ½±¥€‘‘”Ù‘Œí‰…­É½Õ¹è™™˜í‰½É‘•ÈµÉ…‘¥ÕÌèääåÁàíÁ…‘‘¥¹œèÝÁà€ÄÅÁàí™½¹ÐµÍ¥é”èÄÁÁàí™½¹ÐµÝ•¥¡ÐèàÀÀíÕÉÍ½ÈéÁ½¥¹Ñ•Éô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÑ…‰Ì‰ÕÑÑ½¸¹…Ñ¥Ù•í‰…­É½Õ¹èŒÌÄÕ˜ÐÀí½±½Èè™™˜í‰½É‘•Èµ½±½ÈèŒÌÄÕ˜ÐÁô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ±¥ÍÑí‰½É‘•ÈèÅÁàÍ½±¥€”Ù•‰”Ìí‰½É‘•ÈµÉ…‘¥ÕÌèÄÙÁàí½Ù•É™±½Üé¡¥‘‘•¸í‰…­É½Õ¹è™™™ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½Ýí‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÐÕÁà€Å™È…ÕÑ¼í…ÀèÄÁÁàí…±¥¸µ¥Ñ•µÌé•¹Ñ•ÈíÁ…‘‘¥¹œèÄÉÁà€ÄÍÁàí‰½É‘•Èµ‰½ÑÑ½´èÅÁàÍ½±¥€••˜Á•ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½Üé±…ÍÐµ¡¥±‘í‰½É‘•Èµ‰½ÑÑ½´èÁô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜùÍÁ…¹í‘¥ÍÁ±…äéÉ¥íÁ±…”µ¥Ñ•µÌé•¹Ñ•Èí¡•¥¡ÐèÈÝÁàí‰½É‘•ÈµÉ…‘¥ÕÌèääåÁàí™½¹ÐµÍ¥é”èåÁàí™½¹ÐµÝ•¥¡ÐèäÀÁô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜùÍÁ…¸¹•…É¹í‰…­É½Õ¹è•‘˜Ý•˜í½±½ÈèŒÌÈÜÄÐáô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜùÍÁ…¸¹ÍÁ•¹‘í‰…­É½Õ¹è™…˜É”àí½±½ÈèŒàÌÕ”ÌÕô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½Üù‘¥Ø‰í‘¥ÍÁ±…äé‰±½¬í™½¹ÐµÍ¥é”èÄÅÁáô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½Üù‘¥ØÍµ…±±í‘¥ÍÁ±…äé‰±½¬íµ…É¥¸µÑ½ÀèÍÁàí™½¹ÐµÍ¥é”èåÁàí½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÜùÍÑÉ½¹í™½¹ÐµÍ¥é”èÄÉÁàíÝ¡¥Ñ”µÍÁ…”é¹½ÝÉ…Áô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ•µÁÑåíÑ•áÐµ…±¥¸é•¹Ñ•ÈíÁ…‘‘¥¹œèÈÉÁàí™½¹ÐµÍ¥é”èÄÅÁàí½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•ÑÁ½¥¹Ðµ‘…Í¡‰½…Éµ™¥¹…°€¹Á•ÑÁ½¥¹ÐµÑ½…ÍÑí‘¥ÍÁ±…äé™±•àí™±•àµ‘¥É•Ñ¥½¸é½±Õµ¸í…ÀèÉÁáô¹Á•ÑÁ½¥¹Ðµ‘…Í¡‰½…Éµ™¥¹…°€¹Á•ÑÁ½¥¹ÐµÑ½…ÍÐ‰í™½¹ÐµÍ¥é”èÄÅÁáô¹Á•ÑÁ½¥¹Ðµ‘…Í¡‰½…Éµ™¥¹…°€¹Á•ÑÁ½¥¹ÐµÑ½…ÍÐÍÁ…¹í™½¹ÐµÍ¥é”èåÁàí½Á…¥Ñäè¸àÙõµ•‘¥„¡µ…àµÝ¥‘Ñ èÜÀÁÁà¥ì¹Á•ÑÁ½¥¹Ðµ±¥Ù”µÍÑ…ÑÍíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È€Å™Éô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½ÉäµÉ½ÝíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÐÁÁà€Å™È…ÕÑ½ô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ¡•…‘í…±¥¸µ¥Ñ•µÌé™±•àµÍÑ…ÉÑô¹Á•ÑÁ½¥¹Ðµ¡¥ÍÑ½Éäµ¡•…‰ÕÑÑ½¹í™±•àé¹½¹•õô((€€¼¨AQI=]}U%}A=1%M!|ÈÀÈØÀàÄÜ€¨¼(€€¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±•íµ…àµÝ¥‘Ñ èÄÄÈÁÁàíµ…É¥¸èÄÙÁà…ÕÑ¼€ÈÁÁàíÁ…‘‘¥¹œèÈÉÁà€ÈÑÁàí‰½É‘•ÈèÅÁàÍ½±¥€å”ÙÜí‰½É‘•ÈµÉ…‘¥ÕÌèÈÑÁàí‰…­É½Õ¹é±¥¹•…ÈµÉ…‘¥•¹Ð ÄÌÕ‘•œ°™™™‘˜Ü°••˜Ý•¤í‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹Ìé…ÕÑ¼€Å™È…ÕÑ¼í…ÀèÄáÁàí…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí‰½àµÍ¡…‘½ÜèÀ€ÄÑÁà€ÌÑÁàÉ‰„ ÔÔ°ÜÔ°Ôà°¸ÀÜ¥ô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ¥½¹íÝ¥‘Ñ èÔáÁàí¡•¥¡ÐèÔáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄáÁàí‰…­É½Õ¹è™™˜í‘¥ÍÁ±…äéÉ¥íÁ±…”µ¥Ñ•µÌé•¹Ñ•Èí™½¹ÐµÍ¥é”èÌÁÁàí‰½É‘•ÈèÅÁàÍ½±¥€”Ñ•…‘™ô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ½ÁäÍµ…±±í™½¹ÐµÍ¥é”èÄÁÁàí™½¹ÐµÝ•¥¡ÐèäÀÀí±•ÑÑ•ÈµÍÁ…¥¹œè¸ÄÑ•´í½±½ÈèŒÑ˜á„Õ‰ô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ½Áä Éíµ…É¥¸èÑÁà€À€ÕÁàí™½¹ÐµÍ¥é”èÈÁÁáô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ½ÁäÁíµ…É¥¸èÀí½±½ÈéÙ…È ´µÍÕˆ¤í™½¹ÐµÍ¥é”èÄÉÁàí±¥¹”µ¡•¥¡ÐèÄ¸ØÕô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ…Ñ¥½¹ÍíÑ•áÐµ…±¥¸éÉ¥¡Ðíµ…àµÝ¥‘Ñ èÌÈÁÁáô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ…Ñ¥½¹Ì‰í‘¥ÍÁ±…äé‰±½¬í½±½ÈèŒÌÄÕ˜ÐÀí™½¹ÐµÍ¥é”èÈÙÁáô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ…Ñ¥½¹ÌÍÁ…¹í‘¥ÍÁ±…äé‰±½¬íµ…É¥¸µÑ½ÀèÑÁàí½±½ÈèŒÝ„àÀÙ˜í™½¹ÐµÍ¥é”èÄÁÁàí±¥¹”µ¡•¥¡ÐèÄ¸Õô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”¹½µÁ…ÑíÁ…‘‘¥¹œèÄÙÁà€ÈÁÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÈÁÁáô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”¹½µÁ…Ð€¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ¥½¹íÝ¥‘Ñ èÐÙÁàí¡•¥¡ÐèÐÙÁàí™½¹ÐµÍ¥é”èÈÑÁáô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”¹½µÁ…Ð€¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ½Áä Éí™½¹ÐµÍ¥é”èÄÙÁáô(€€¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥°¹…‰½ÕÐµÉ¥°¹…‰½ÕÐµ™•…ÑÕÉ”µ…É‘ÍíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌéÉ•Á•…Ð È±µ¥¹µ…à À°Å™È¤¤…¥µÁ½ÉÑ…¹Ðí…ÀèÄáÁà…¥µÁ½ÉÑ…¹Ñô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥ø¨°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥ø¨°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥ø¨°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥ø¨°¹…‰½ÕÐµÉ¥ø¨°¹…‰½ÕÐµ™•…ÑÕÉ”µ…É‘Ìø©íµ¥¸µ¡•¥¡ÐèÈÈÁÁà…¥µÁ½ÉÑ…¹Ðí‰½É‘•ÈèÅÁàÍ½±¥€‘‘”á‘„…¥µÁ½ÉÑ…¹Ðí‰½àµÍ¡…‘½ÜèÀ€ÄÉÁà€ÌÁÁàÉ‰„ ÔÔ°ÜÔ°Ôà°¸ÀØ¤…¥µÁ½ÉÑ…¹Ñô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ä¤°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ä¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ä¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ä¤°¹…‰½ÕÐµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ä¥í‰…­É½Õ¹è••˜Ý•˜…¥µÁ½ÉÑ…¹Ñô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬È¤°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬È¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬È¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬È¤°¹…‰½ÕÐµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬È¥í‰…­É½Õ¹è˜á˜Ù•Œ…¥µÁ½ÉÑ…¹Ñô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ì¤°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ì¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ì¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ì¤°¹…‰½ÕÐµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¬Ì¥í‰…­É½Õ¹è•‘˜Ù˜Ø…¥µÁ½ÉÑ…¹Ñô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¤°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¤°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¤°¹…‰½ÕÐµÉ¥ø¨é¹Ñ µ¡¥± Ñ¸¥í‰…­É½Õ¹è™‰˜Å•Œ…¥µÁ½ÉÑ…¹Ñô(€€¹Á•ÐµÑ…É½ÐµÍÑ…”°¹™•…ÑÕÉ”µµ½‘Õ±”µÍ¡•±°€¹‰œµ…É‘í‰½É‘•ÈµÉ…‘¥ÕÌèÈÉÁáô¹Á•ÐµÑ…É½ÐµÍÑ…”ù È°¹Á•Ðµ‘…¥±äµ™½ÉÑÕ¹”µ…Éù Éí™½¹Ðµ™…µ¥±äé¥¹¡•É¥Ð…¥µÁ½ÉÑ…¹Ðí™½¹ÐµÍ¥é”èÈÑÁà…¥µÁ½ÉÑ…¹Ðí™½¹ÐµÝ•¥¡ÐèäÀÀ…¥µÁ½ÉÑ…¹Ðí±•ÑÑ•ÈµÍÁ…¥¹œè´¸ÀÌÕ•´…¥µÁ½ÉÑ…¹Ðí½±½ÈéÙ…È ´µÑ•áÐ¤…¥µÁ½ÉÑ…¹Ðíµ…É¥¸èÙÁà€À€ÄÉÁà…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½ÐµÑ½Á¥ŒµÉ¥‘íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌéÉ•Á•…Ð È±µ¥¹µ…à À°Å™È¤¤…¥µÁ½ÉÑ…¹Ðí…ÀèÄÁÁà…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½ÐµÑ½Á¥íµ¥¸µ¡•¥¡ÐèäÉÁà…¥µÁ½ÉÑ…¹ÐíÁ…‘‘¥¹œèÄÑÁà€ÄÙÁà…¥µÁ½ÉÑ…¹Ðí‰½É‘•ÈµÉ…‘¥ÕÌèÄÙÁà…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½ÐµÑ½Á¥Œ‰í™½¹Ðµ™…µ¥±äé¥¹¡•É¥Ð…¥µÁ½ÉÑ…¹Ðí™½¹ÐµÍ¥é”èÄÍÁà…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½ÐµÑ½Á¥ŒÍµ…±±í™½¹ÐµÍ¥é”èÄÀ¸ÕÁà…¥µÁ½ÉÑ…¹Ðí±¥¹”µ¡•¥¡ÐèÄ¸Ô…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½Ðµ¥¹ÑÉ½í™½¹Ðµ™…µ¥±äé¥¹¡•É¥Ð…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½Ðµ‰…¬µ±¥¹­í™½¹Ðµ™…µ¥±äé¥¹¡•É¥Ð…¥µÁ½ÉÑ…¹Ñô(€€¹Á•Ñ¹•ÝÌµØÄÁíµ…àµÝ¥‘Ñ èÄÄÈÁÁàíµ…É¥¸èÀ…ÕÑ¼íÁ…‘‘¥¹œèÀ€À€ÌÙÁáô¹Á•Ñ¹•ÝÌµ¡•É½í‘¥ÍÁ±…äé™±•àí©ÕÍÑ¥™äµ½¹Ñ•¹ÐéÍÁ…”µ‰•ÑÝ••¸í…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí…ÀèÈÁÁàíÁ…‘‘¥¹œèÈáÁàí‰½É‘•ÈèÅÁàÍ½±¥€”Á”á‘Œí‰½É‘•ÈµÉ…‘¥ÕÌèÈÑÁàí‰…­É½Õ¹é±¥¹•…ÈµÉ…‘¥•¹Ð ÄÌÕ‘•œ°™™™‘˜à°••˜Ù•Œ¤íµ…É¥¸µ‰½ÑÑ½´èÄÑÁáô¹Á•Ñ¹•ÝÌµ¡•É¼Íµ…±±í™½¹ÐµÍ¥é”èÄÁÁàí™½¹ÐµÝ•¥¡ÐèäÀÀí±•ÑÑ•ÈµÍÁ…¥¹œè¸ÄÑ•´í½±½ÈèŒÑ˜á„Õ‰ô¹Á•Ñ¹•ÝÌµ¡•É¼ Åíµ…É¥¸èÑÁà€À€ÝÁàí™½¹ÐµÍ¥é”èÈáÁáô¹Á•Ñ¹•ÝÌµ¡•É¼Áíµ…É¥¸èÀí½±½ÈéÙ…È ´µÍÕˆ¤í™½¹ÐµÍ¥é”èÄÉÁáô¹Á•Ñ¹•ÝÌµÑ½½±Íí‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È€ÈàÁÁàí…ÀèÄÉÁàíµ…É¥¸µ‰½ÑÑ½´èÄÑÁáô¹Á•Ñ¹•ÝÌµ…ÑÍí‘¥ÍÁ±…äé™±•àí…ÀèÝÁàí½Ù•É™±½Üé…ÕÑ¼íÁ…‘‘¥¹œµ‰½ÑÑ½´èÍÁáô¹Á•Ñ¹•ÝÌµ…ÑÌ‰ÕÑÑ½¹íÝ¡¥Ñ”µÍÁ…”é¹½ÝÉ…Àí‰½É‘•ÈèÅÁàÍ½±¥€‘‘”Õäí‰…­É½Õ¹è™™˜í‰½É‘•ÈµÉ…‘¥ÕÌèääåÁàíÁ…‘‘¥¹œèåÁà€ÄÉÁàí™½¹ÐµÍ¥é”èÄÅÁàí™½¹ÐµÝ•¥¡ÐèàÀÀíÕÉÍ½ÈéÁ½¥¹Ñ•Éô¹Á•Ñ¹•ÝÌµ…ÑÌ‰ÕÑÑ½¸¹…Ñ¥Ù•í‰…­É½Õ¹èŒÌÄÕ˜ÐÀí½±½Èè™™˜í‰½É‘•Èµ½±½ÈèŒÌÄÕ˜ÐÁô¹Á•Ñ¹•ÝÌµÉ•ÍÕ±Ðµ½Õ¹Ñí™½¹ÐµÍ¥é”èÄÀ¸ÕÁàí½±½ÈéÙ…È ´µÍÕˆ¤íµ…É¥¸è´ÑÁà€À€ÄÉÁáô¹Á•Ñ¹•ÝÌµÍ•…É¡íÁ½Í¥Ñ¥½¸éÉ•±…Ñ¥Ù”í‘¥ÍÁ±…äé™±•àí…±¥¸µ¥Ñ•µÌé•¹Ñ•Éô¹Á•Ñ¹•ÝÌµÍ•…É ùÍÁ…¹íÁ½Í¥Ñ¥½¸é…‰Í½±ÕÑ”í±•™ÐèÄÉÁàíèµ¥¹‘•àèÄí½±½ÈèŒÜÔàÄÜáô¹Á•Ñ¹•ÝÌµÍ•…É ¥¹ÁÕÑíÝ¥‘Ñ èÄÀÀ”íÁ…‘‘¥¹œµ±•™ÐèÌÑÁà…¥µÁ½ÉÑ…¹ÐíÁ…‘‘¥¹œµÉ¥¡ÐèÌÑÁà…¥µÁ½ÉÑ…¹Ñô¹Á•Ñ¹•ÝÌµÍ•…É ù‰ÕÑÑ½¹íÁ½Í¥Ñ¥½¸é…‰Í½±ÕÑ”íÉ¥¡ÐèáÁàí‰½É‘•ÈèÀí‰…­É½Õ¹è••˜Í•íÝ¥‘Ñ èÈÕÁàí¡•¥¡ÐèÈÕÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÔÀ”íÕÉÍ½ÈéÁ½¥¹Ñ•Èí½±½ÈèŒØÀÜÀØÙô¹Á•Ñ¹•ÝÌµÉ¥‘í‘¥ÍÁ±…äéÉ¥íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È€Å™Èí…ÀèÄÑÁáô¹Á•Ñ¹•ÝÌµ…ÉµØÄÁí½Ù•É™±½Üé¡¥‘‘•¸í‰½É‘•ÈèÅÁàÍ½±¥€”Ñ”á”Àí‰½É‘•ÈµÉ…‘¥ÕÌèÈÁÁàí‰…­É½Õ¹è™™˜íÕÉÍ½ÈéÁ½¥¹Ñ•Èí‘¥ÍÁ±…äé‰±½¬í‰½àµÍ¡…‘½ÜèÀ€ÄÁÁà€ÈáÁàÉ‰„ ÔÔ°ÜÔ°Ôà°¸ÀÔ¥ô¹Á•Ñ¹•ÝÌµµ•‘¥…íÁ½Í¥Ñ¥½¸éÉ•±…Ñ¥Ù”íÝ¥‘Ñ èÄÀÀ”í…ÍÁ•ÐµÉ…Ñ¥¼èÄØ¼äí½Ù•É™±½Üé¡¥‘‘•¸í‰…­É½Õ¹è••˜Ñ••ô¹Á•Ñ¹•ÝÌµµ•‘¥„ù¥µíÁ½Í¥Ñ¥½¸é…‰Í½±ÕÑ”í¥¹Í•ÐèÀíÝ¥‘Ñ èÄÀÀ”í¡•¥¡ÐèÄÀÀ”í½‰©•Ðµ™¥Ðé½Ù•Èí‘¥ÍÁ±…äé‰±½¬íèµ¥¹‘•àèÉô¹Á•Ñ¹•ÝÌµ¥µ…”µ™…±±‰…­íÁ½Í¥Ñ¥½¸é…‰Í½±ÕÑ”í¥¹Í•ÐèÀí‰…­É½Õ¹é±¥¹•…ÈµÉ…‘¥•¹Ð ÄÐÕ‘•œ°•‘˜Õ•„°˜á˜Í”Ü¤í‘¥ÍÁ±…äé¹½¹”í™±•àµ‘¥É•Ñ¥½¸é½±Õµ¸í…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí©ÕÍÑ¥™äµ½¹Ñ•¹Ðé•¹Ñ•Èí™½¹ÐµÍ¥é”èÌáÁáô¹Á•Ñ¹•ÝÌµ¥µ…”µ™…±±‰…¬¹Í¡½Ýí‘¥ÍÁ±…äé™±•áô¹Á•Ñ¹•ÝÌµ¥µ…”µ™…±±‰…¬Íµ…±±í™½¹ÐµÍ¥é”èåÁàíµ…É¥¸µÑ½ÀèÝÁàí½±½ÈèŒÜàäÄÝ‘ô¹Á•Ñ¹•ÝÌµ…Éµ‰½‘åíÁ…‘‘¥¹œèÄÝÁáô¹Á•Ñ¹•ÝÌµµ•Ñ…í‘¥ÍÁ±…äé™±•àí©ÕÍÑ¥™äµ½¹Ñ•¹ÐéÍÁ…”µ‰•ÑÝ••¸í…ÀèÄÁÁàí…±¥¸µ¥Ñ•µÌé•¹Ñ•Éô¹Á•Ñ¹•ÝÌµµ•Ñ„ÍÁ…¹í™½¹ÐµÍ¥é”èÄÁÁàí™½¹ÐµÝ•¥¡ÐèäÀÀí½±½ÈèŒÑ˜á„Õ‰ô¹Á•Ñ¹•ÝÌµµ•Ñ„Íµ…±±í™½¹ÐµÍ¥é”èåÁàí½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•Ñ¹•ÝÌµ…Éµ‰½‘ä Éí™½¹ÐµÍ¥é”èÄÙÁàí±¥¹”µ¡•¥¡ÐèÄ¸Ðíµ…É¥¸èáÁà€Áô¹Á•Ñ¹•ÝÌµ…Éµ‰½‘äÁí™½¹ÐµÍ¥é”èÄÄ¸ÕÁàí±¥¹”µ¡•¥¡ÐèÄ¸ØÔí½±½ÈèŒØØÜÄØàíµ…É¥¸èÁô¹Á•Ñ¹•ÝÌµ…Éµ‰½‘ä‰ÕÑÑ½¹í‰½É‘•ÈèÀí‰…­É½Õ¹éÑÉ…¹ÍÁ…É•¹Ðí½±½ÈèŒÑ˜á„Õˆí™½¹ÐµÍ¥é”èÄÀ¸ÕÁàí™½¹ÐµÝ•¥¡ÐèäÀÀíÁ…‘‘¥¹œèÄÁÁà€À€ÀíÕÉÍ½ÈéÁ½¥¹Ñ•Éô¹Á•Ñ¹•ÝÌµÍÑ…Ñ•íÁ…‘‘¥¹œèÐÙÁàíÑ•áÐµ…±¥¸é•¹Ñ•Èí‰½É‘•ÈèÅÁàÍ½±¥€”Ñ”á”Àí‰½É‘•ÈµÉ…‘¥ÕÌèÈÁÁàí‰…­É½Õ¹è™™˜í½±½ÈéÙ…È ´µÍÕˆ¥ô¹Á•Ñ¹•ÝÌµÍÑ…Ñ”¹•ÉÉ½Éí‘¥ÍÁ±…äéÉ¥í…ÀèáÁàí©ÕÍÑ¥™äµ¥Ñ•µÌé•¹Ñ•Éô¹Á•Ñ¹•ÝÌµÁ…•Íí‘¥ÍÁ±…äé™±•àí©ÕÍÑ¥™äµ½¹Ñ•¹Ðé•¹Ñ•Èí…±¥¸µ¥Ñ•µÌé•¹Ñ•Èí…ÀèÄÉÁàíµ…É¥¸µÑ½ÀèÄáÁáô¹Á•Ñ¹•ÝÌµÁ…•Ì‰ÕÑÑ½¹í‰½É‘•ÈèÅÁàÍ½±¥€‘”Õàí‰…­É½Õ¹è™™˜í‰½É‘•ÈµÉ…‘¥ÕÌèÄÉÁàíÁ…‘‘¥¹œèáÁà€ÄÍÁáô¹Á•Ñ¹•ÝÌµµ½‘…°µ‰…­‘É½ÁíÁ½Í¥Ñ¥½¸é™¥á•í¥¹Í•ÐèÀíèµ¥¹‘•àèääääí‰…­É½Õ¹éÉ‰„ ÈÀ°ÌÔ°ÈØ°¸ÐÈ¤í‘¥ÍÁ±…äéÉ¥íÁ±…”µ¥Ñ•µÌé•¹Ñ•ÈíÁ…‘‘¥¹œèÄáÁáô¹Á•Ñ¹•ÝÌµµ½‘…±íÁ½Í¥Ñ¥½¸éÉ•±…Ñ¥Ù”íÝ¥‘Ñ éµ¥¸ ØàÁÁà°ÄÀÀ”¤íµ…àµ¡•¥¡ÐèàáÙ í½Ù•É™±½Üé…ÕÑ¼í‰½É‘•ÈµÉ…‘¥ÕÌèÈÑÁàí‰…­É½Õ¹è™™˜íÁ…‘‘¥¹œèÈáÁàí‰½àµÍ¡…‘½ÜèÀ€ÈÕÁà€àÁÁàÉ‰„ À°À°À°¸È¥ô¹Á•Ñ¹•ÝÌµµ½‘…°ù¥µíÝ¥‘Ñ èÄÀÀ”íµ…àµ¡•¥¡ÐèÌÀÁÁàí½‰©•Ðµ™¥Ðé½Ù•Èí‰½É‘•ÈµÉ…‘¥ÕÌèÄÙÁàíµ…É¥¸èÄÉÁà€Áô¹Á•Ñ¹•ÝÌµ±½Í•íÁ½Í¥Ñ¥½¸é…‰Í½±ÕÑ”íÉ¥¡ÐèÄÙÁàíÑ½ÀèÄÑÁàí‰½É‘•ÈèÀí‰…­É½Õ¹è˜É˜Ñ˜Äí‰½É‘•ÈµÉ…‘¥ÕÌèÔÀ”íÝ¥‘Ñ èÌÑÁàí¡•¥¡ÐèÌÑÁàí™½¹ÐµÍ¥é”èÈÉÁáô¹Á•Ñ¹•ÝÌµÍÕµµ…Éäµ‰½áí‰…­É½Õ¹è˜Õ˜á˜Ìí‰½É‘•ÈèÅÁàÍ½±¥€”É”å‘˜í‰½É‘•ÈµÉ…‘¥ÕÌèÄÙÁàíÁ…‘‘¥¹œèÄÙÁáô¹Á•Ñ¹•ÝÌµÍÕµµ…Éäµ‰½àÀ°¹Á•Ñ¹•ÝÌµÍ½ÕÉ”µ¹½Ñ•í™½¹ÐµÍ¥é”èÄÉÁàí±¥¹”µ¡•¥¡ÐèÄ¸ÜÔí½±½ÈèŒØÄÙØÑô¹Á•Ñ¹•ÝÌµÍ½ÕÉ”µ¹½Ñ•íµ…É¥¸èÄÉÁà€Áô(€µ•‘¥„¡µ…àµÝ¥‘Ñ èÜØÁÁà¥ì¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±•íµ…É¥¸èÄÉÁàíÁ…‘‘¥¹œèÄÙÁàíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹Ìé…ÕÑ¼€Å™Éô¹Á•ÑÁ½¥¹ÐµÙ¥Í¥‰±”µ…Ñ¥½¹ÍíÉ¥µ½±Õµ¸èÄ¼´ÄíÑ•áÐµ…±¥¸é±•™Ðíµ…àµÝ¥‘Ñ é¹½¹•ô¹…‰½ÕÐµ™•…ÑÕÉ”µÉ¥°¹…‰½ÕÐµ™•…ÑÕÉ•ÌµÉ¥°¹¥¹ÑÉ¼µ™•…ÑÕÉ”µÉ¥°¹¥¹ÑÉ¼µ™•…ÑÕÉ•ÌµÉ¥°¹…‰½ÕÐµÉ¥°¹…‰½ÕÐµ™•…ÑÕÉ”µ…É‘ÍíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È…¥µÁ½ÉÑ…¹Ñô¹Á•ÐµÑ…É½ÐµÑ½Á¥ŒµÉ¥‘íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™È…¥µÁ½ÉÑ…¹Ñô¹Á•Ñ¹•ÝÌµØÄÁíÁ…‘‘¥¹œèÀ€ÄÉÁà€ÈáÁáô¹Á•Ñ¹•ÝÌµ¡•É½íÁ…‘‘¥¹œèÈÁÁàí…±¥¸µ¥Ñ•µÌé™±•àµÍÑ…ÉÑô¹Á•Ñ¹•ÝÌµÑ½½±ÍíÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™Éô¹Á•Ñ¹•ÝÌµÉ¥‘íÉ¥µÑ•µÁ±…Ñ”µ½±Õµ¹ÌèÅ™Éô¹Á•Ñ¹•ÝÌµ…ÉµØÄÁí‘¥ÍÁ±…äé‰±½­ô¹Á•Ñ¹•ÝÌµµ•‘¥…í…ÍÁ•ÐµÉ…Ñ¥¼èÄØ¼åô¹Á•Ñ¹•ÝÌµµ½‘…±íÁ…‘‘¥¹œèÈÉÁáõô(€ô(€€ð½ÍÑå±”ø(€€€€ð½‘¥Øø(€€¤ì((€½¹ÍÐ‰É••‘É½ÕÁÌ€ôÍÁ•¥•Ì€ôôô€‰‘½œˆ€ü=}	I}I=UAL€èQ}	I}I=UALì(€½¹ÍÐÍ¥é•=ÁÑ¥½¹Ì€ôÍÁ•¥•Ì€ôôô€‰‘½œˆ€ü=}M%i}=AQ%=9L€èQ}M%i}=AQ%=9Lì(€½¹ÍÐÍ¡½Ý=¹‰½…É‘¥¹œ€ôµ½‘”€ôôô€‰½¹‰½…É‘¥¹œˆñðµ½‘”€ôôô€‰•‘¥Ðˆñð€¡µ½‘”€ôôô€‰Ù¥•Üˆ€˜˜€…ÕÉÉ•¹ÑA•Ð¤ì((€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”õí‰‰½°µÉ½½Ð€‘ì…¥Í9…Ñ¥Ù•ÁÀ€ü€‰Á•ÑÉ½ÜµÝ•ˆµ±…å½ÕÐˆ€è€ˆ‰ô€‘í•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰…‘µ¥¸ˆ€ü€‰…‘µ¥¸µ•¹ÑÉäµÉ½½Ðˆ€è€ˆ‰õôÍÑå±”õíìµ¥¹!•¥¡Ðè•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰…‘µ¥¸ˆ€ü€‰…ÕÑ¼ˆ€è€ˆÄÀÁÙ ˆ°Á…‘‘¥¹	½ÑÑ½´è¥Í9…Ñ¥Ù•ÁÀ€ü€ÜÐ€è€Àõôø(€€€€€€ñ±½‰…±MÑå±”€¼ø(€€€€€ì…¥Í9…Ñ¥Ù•ÁÀ€˜˜€ (€€€€€€€€ñ…Í¥‘”±…ÍÍ9…µ”ô‰Á•ÑÉ½ÜµÍ¥‘•‰…Èˆø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰Á•ÑÉ½ÜµÍ¥‘•‰…Èµ‰É…¹ˆ½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ôøñ¥µœÍÉŒôˆ½Á•ÑÉ½ÜµÍÁ±…Í µ±½¼¹Á¹œˆ…±Ðôˆˆ€¼øñÍÁ…¸øñÍÑÉ½¹œùA•ÐñˆùÉ½Üð½ˆøð½ÍÑÉ½¹œøñÍµ…±°ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰!•…±Ñ¡äÉ½ÝÑ °Ñ½•Ñ¡•Èˆ€è€‹²jÃ®š°ƒ²V²vÓ²v`ƒªÆÓªÂW¶Vpƒ²Ç²z—²vƒ¶V£ªî`‰ôð½Íµ…±°øð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€ñ¹…Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½ÜµÍ¥‘•‰…Èµ¹…ØÁ•ÑÉ½ÜµÍ¥‘•‰…Èµ¹…ØµÉ½ÕÁ•ˆø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰¡½µ”ˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ôøñ!½µ•%½¸€¼øñÍÁ…¸ùíÐ¹¡…µ9…Ù!½µ•ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í¥‘•‰…ÈµÍ•Ñ¥½¸µ±…‰•°ˆùí±…¹œ€ôôô€‰•¸ˆ€ü€‰AP1%ˆ€è€‹®Âc®‚“²w¶fp‰ôð½‘¥Øø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰Á•ÑÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Á•ÑÌˆ¥ôøñ!•…ÉÑ=ÕÑ±¥¹•%½¸€¼øñÍÁ…¸ùíÐ¹µåA•ÑÍ9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰¹•…É‰äˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¹•…É‰äˆ¥ôøñ5…ÁA¥¹%½¸€¼øñÍÁ…¸ùíÐ¹¹•…É‰å9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰µÕÍ¥Œˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰µÕÍ¥Œˆ¥ôøñ5ÕÍ¥%½¸€¼øñÍÁ…¸ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•Ð5ÕÍ¥Œˆ€è€‰A•Ó²v3²V‰ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í¥‘•‰…ÈµÍ•Ñ¥½¸µ±…‰•°ˆùí±…¹œ€ôôô€‰•¸ˆ€ü€‰=55U9%Qdƒ
Ü=9Q9Pˆ€è€‹²î“®º“®.#¶.Àƒ
Üƒ²öc¶C²â€‰ôð½‘¥Øø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰½µµÕ¹¥Ñäˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰½µµÕ¹¥Ñäˆ¥ôøñQ…±­%½¸€¼øñÍÁ…¸ùíÐ¹½µµÕ¹¥Ñå9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰Á•Ñ‰Ñ¤ˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Á•Ñ‰Ñ¤ˆ¥ôøñA•Ñ	Ñ¥%½¸€¼øñÍÁ…¸ùíÐ¹Á•Ñ	Ñ¥9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰Í…©Ôˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Í…©Ôˆ¥ôøñM…©Õ%½¸€¼øñÍÁ…¸ùíÐ¹Í…©Õ9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÑ…É½Ðµ¹…Ø€‘íÙ¥•Ü€ôôô€‰Ñ…É½Ðˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Ñ…É½Ðˆ¥ôøñÍÁ…¸±…ÍÍ9…µ”ô‰Í¥‘•‰…ÈµÑ…É½Ðµµ…É¬ˆûÂ~<ð½ÍÁ…¸øñÍÁ…¸ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•ÐQ…É½Ðˆ€è€‰A•Ó¶®†p‰ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í¥‘•‰…ÈµÍ•Ñ¥½¸µ±…‰•°ˆùí±…¹œ€ôôô€‰•¸ˆ€ü€‰%9<ƒ
ÜMUAA=IPˆ€è€‹²‚W®ÎÐƒ
Üƒ²ž²n@‰ôð½‘¥Øø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰Ñ¥ÁÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Ñ¥ÁÌˆ¥ôøñ1¥¡Ñ‰Õ±‰%½¸€¼øñÍÁ…¸ùíÐ¹Ñ¥ÁÍQ¥Ñ±•ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰¹•ÝÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¹•ÝÌˆ¥ôøñ%¹™½%½¸€¼øñÍÁ…¸ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•Ð9•ÝÌˆ€è€‰A•Ó®&Ó²*‰ôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÙ¥•Ü€ôôô€‰…‰½ÕÐˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰…‰½ÕÐˆ¥ôøñ%¹™½%½¸€¼øñÍÁ…¸ùíÐ¹…‰½ÕÑ9…Ùôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½¹…Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½ÜµÍ¥‘•‰…Èµ‰½ÑÑ½´ˆøñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½ÜµÍ¥‘•‰…Èµµ•ÍÍ…”ˆûŠf„€ñÍÁ…¸ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰¡…ÁÁ¥•È‘…äÝ¥Ñ å½ÕÈÁ•Ðˆ€è€‹²jÃ®š°ƒ²V²vÓ²f ƒ®6Pƒ¶Z'®Î×¶Vpƒ¶Vc®Ž ‰ôð½ÍÁ…¸øð½‘¥Øøñ1…¹Q½±”±…¹œõí±…¹ô½¹¡…¹”õíÍ•Ñ1…¹ô€¼øñ½Õ¹Ñ	ÕÑÑ½¸…½Õ¹Ðõí…½Õ¹Ñô½¹=Á•¸õì ¤€ôø€¡…½Õ¹Ð€üÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¤€è½Y¥•Ü ‰Á•ÑÌˆ¤¥ô€¼øð½‘¥Øø(€€€€€€€€ð½…Í¥‘”ø(€€€€€€¥ô(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÁ•ÑÉ½ÜµÁ…”µÑ½À€‘í•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Á•ÑÌˆ€ü€‰Á•ÑÌµÁ…”µÑ½Àˆ€è€ˆ‰õôÍÑå±”õíìµ…á]¥‘Ñ è€äÀÀ°µ…É¥¸è€ˆÀ…ÕÑ¼ˆ°Á…‘‘¥¹œè€ˆÄÙÁà€ÈÁÁà€Àˆõôø(€€€€€€€ì…¥Í9…Ñ¥Ù•ÁÀ€˜˜€ (€€€€€€€€€€ðø(€€€€€€€€€€€ì¼¨Aèƒ¶R®š³®¾ã²^ƒªâ®zc²*ƒ²®. ƒ®¦S®&Ð€ äÀÁÁàƒ²vÓ²¤€¨½ô(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ¹…Ø‘•Í­Ñ½Àµ¹…ØµÍ¡•±°ˆø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ‰É…¹ˆ½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ô…É¥„µ±…‰•°ô‹¶f#²ró®†pƒ²vÓ®>dˆø(€€€€€€€€€€€€€€€€ñ¥µœ±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ‰É…¹µ±½¼ˆÍÉŒôˆ½Á•ÑÉ½ÜµÍÁ±…Í µ±½¼¹Á¹œˆ…±Ðôˆˆ€¼ø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ‰É…¹µ½Áäˆø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ‰É…¹µ¹…µ”ˆùA•ÐñˆùÉ½Üð½ˆøð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ‰É…¹µÑ…±¥¹”ˆùí±…¹œ€ôôô€‰•¸ˆ€ü€‰É½Ý¥¹œÑ½•Ñ¡•È°•Ù•Éä‘…äˆ€è€‹²jÃ®š°ƒ²V²vÓ²v`ƒªÆÓªÂW¶Vpƒ²Ç²z—²vƒ¶V£ªî`‰ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø((€€€€€€€€€€€€€€ñ¹…Ø±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ¹…Øµ±¥¹­Ìˆ…É¥„µ±…‰•°õí±…¹œ€ôôô€‰•¸ˆ€ü€‰5…¥¸¹…Ù¥…Ñ¥½¸ˆ€è€‹²Žó²jPƒ®¦S®&Ð‰ôø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰¡½µ”ˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ôøñ!½µ•%½¸€¼ùíÐ¹¡…µ9…Ù!½µ•ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰…‰½ÕÐˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰…‰½ÕÐˆ¥ôøñ%¹™½%½¸€¼ùíÐ¹…‰½ÕÑ9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰Á•ÑÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Á•ÑÌˆ¥ôøñ!•…ÉÑ=ÕÑ±¥¹•%½¸€¼ùíÐ¹µåA•ÑÍ9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰¹•…É‰äˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¹•…É‰äˆ¥ôøñ5…ÁA¥¹%½¸€¼ùíÐ¹¹•…É‰å9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰½µµÕ¹¥Ñäˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰½µµÕ¹¥Ñäˆ¥ôøñQ…±­%½¸€¼ùíÐ¹½µµÕ¹¥Ñå9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰Í…©Ôˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Í…©Ôˆ¥ôøñM…©Õ%½¸€¼ùíÐ¹Í…©Õ9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰Ñ…É½Ðˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Ñ…É½Ðˆ¥ôøñÍÁ…¸ÍÑå±”õíí™½¹ÑM¥é”èÄÕõôûÂ~<ð½ÍÁ…¸ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•ÐQ…É½Ðˆ€è€‰A•Ó¶®†p‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰Á•Ñ‰Ñ¤ˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Á•Ñ‰Ñ¤ˆ¥ôøñA•Ñ	Ñ¥%½¸€¼ùíÐ¹Á•Ñ	Ñ¥9…Ùôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰µÕÍ¥Œˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰µÕÍ¥Œˆ¥ôøñ5ÕÍ¥%½¸€¼ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•Ð5ÕÍ¥Œˆ€è€‰A•Ó²v3²V‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰Ñ¥ÁÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰Ñ¥ÁÌˆ¥ôøñ1¥¡Ñ‰Õ±‰%½¸€¼ùíÐ¹Ñ¥ÁÍQ¥Ñ±•ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”õí‘•Í­Ñ½Àµ¹…Øµ±¥¹¬€‘íÙ¥•Ü€ôôô€‰¹•ÝÌˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰õô½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¹•ÝÌˆ¥ôøñ%¹™½%½¸€¼ùí±…¹œ€ôôô€‰•¸ˆ€ü€‰A•Ð9•ÝÌˆ€è€‰A•Ó®&Ó²*‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ð½¹…Øø((€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘•Í­Ñ½Àµ¹…Øµ…Ñ¥½¹Ìˆø(€€€€€€€€€€€€€€€€ñ1…¹Q½±”±…¹œõí±…¹ô½¹¡…¹”õíÍ•Ñ1…¹ô€¼ø(€€€€€€€€€€€€€€€€ñ½Õ¹Ñ	ÕÑÑ½¸…½Õ¹Ðõí…½Õ¹Ñô½¹=Á•¸õì ¤€ôø€¡…½Õ¹Ð€üÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¤€è½Y¥•Ü ‰Á•ÑÌˆ¤¥ô€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€ì¼¨ƒ®ª£®ÂS²vðƒ²näèƒŠbÀðƒ®†sªÎ€ð-<½8ðƒ®†sªÞã²và¿¶R®†s¶V€ äÀÁÁàƒ®¾ã®ž0¤€¨½ô(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ½‰¥±”µÑ½Á‰…Èµ½‰¥±”µÑ½Á‰…ÈµÁÉ•µ¥Õ´ˆÍÑå±”õíì…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°©ÕÍÑ¥™å½¹Ñ•¹Ðè€‰ÍÁ…”µ‰•ÑÝ••¸ˆ°…Àè€à°µ…É¥¹	½ÑÑ½´è€ÄÐõôø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰¥½¸µ‰Ñ¸ˆ…É¥„µ±…‰•°õíÐ¹¡…µ5•¹ÕÉ¥…ô½¹±¥¬õì ¤€ôøÍ•Ñ!…µ=Á•¸¡ÑÉÕ”¥ôø(€€€€€€€€€€€€€€€€ñ!…µ‰ÕÉ•É%½¸ÍÑå±”õíìÝ¥‘Ñ è€ÈÀ°¡•¥¡Ðè€ÈÀõô€¼ø(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ô(€€€€€€€€€€€€€€€…É¥„µ±…‰•°ô‹¶f#²ró®†pƒ²vÓ®>dˆ(€€€€€€€€€€€€€€€ÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°…Àè€Ü°‰…­É½Õ¹è€‰¹½¹”ˆ°‰½É‘•Èè€‰¹½¹”ˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•Èˆ°Á…‘‘¥¹œè€Àõôø(€€€€€€€€€€€€€€€€ñ¥µœ±…ÍÍ9…µ”ô‰µ½‰¥±”µ‰É…¹µ±½¼ˆÍÉŒôˆ½Á•ÑÉ½ÜµÍÁ±…Í µ±½¼¹Á¹œˆ…±Ðôˆˆ€¼ø(€€€€€€€€€€€€€€€€ñÍÁ…¸ÍÑå±”õíì™½¹ÑM¥é”è€ÄØ°™½¹Ñ]•¥¡Ðè€àÀÀ°™½¹Ñ…µ¥±äè€ˆ)Õ„œ±Í…¹ÌµÍ•É¥˜ˆ°±•ÑÑ•ÉMÁ…¥¹œè€ˆ´¸ÀÉ•´ˆõôø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ÍÑå±”õíì½±½Èè€‰Ù…È ´µÑ•áÐ¤ˆõôùA•Ðð½ÍÁ…¸øñÍÁ…¸ÍÑå±”õíì½±½Èè€‰Ù…È ´µÁÉ¥µ…Éä¤ˆõôùÉ½Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆõôø(€€€€€€€€€€€€€€€€ñ1…¹Q½±”±…¹œõí±…¹ô½¹¡…¹”õíÍ•Ñ1…¹ô€¼ø(€€€€€€€€€€€€€€€€ñ½Õ¹Ñ	ÕÑÑ½¸…½Õ¹Ðõí…½Õ¹Ñô½¹=Á•¸õì ¤€ôø€¡…½Õ¹Ð€üÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¤€è½Y¥•Ü ‰Á•ÑÌˆ¤¥ô€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð¼ø(€€€€€€€€¥ô((€€€€€€€ì¼¨ƒ²VÄ¡…Á…¥Ñ½Èƒ®“²vÓ¶.Ã®â0¤èƒ¶Vc®. €Û¶·²vÐƒ®
Ó®æªÊ3²vÓ²c²vƒ®.Ó®.ç¶Vc®¾®†pƒ²®.£²v ƒ®†sªÎ€ƒ¶Vpƒ²’®ž0€¨½ô(€€€€€€€í¥Í9…Ñ¥Ù•ÁÀ€˜˜€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¹…Ñ¥Ù”µ…ÁÀµÑ½Á‰…ÈˆÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°©ÕÍÑ¥™å½¹Ñ•¹Ðè€‰ÍÁ…”µ‰•ÑÝ••¸ˆ°µ…É¥¹	½ÑÑ½´è€ÄÐõôø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ô…É¥„µ±…‰•°ô‹¶f#²ró®†pƒ²vÓ®>dˆ(€€€€€€€€€€€€€ÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°…Àè€Ü°‰…­É½Õ¹è€‰¹½¹”ˆ°‰½É‘•Èè€‰¹½¹”ˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•Èˆ°Á…‘‘¥¹œè€Àõôø(€€€€€€€€€€€€€€ñ¥µœ±…ÍÍ9…µ”ô‰µ½‰¥±”µ‰É…¹µ±½¼ˆÍÉŒôˆ½Á•ÑÉ½ÜµÍÁ±…Í µ±½¼¹Á¹œˆ…±Ðôˆˆ€¼ø(€€€€€€€€€€€€€€ñÍÁ…¸ÍÑå±”õíì™½¹ÑM¥é”è€ÄØ°™½¹Ñ]•¥¡Ðè€àÀÀ°™½¹Ñ…µ¥±äè€ˆ)Õ„œ±Í…¹ÌµÍ•É¥˜ˆ°±•ÑÑ•ÉMÁ…¥¹œè€ˆ´¸ÀÉ•´ˆõôø(€€€€€€€€€€€€€€€€ñÍÁ…¸ÍÑå±”õíì½±½Èè€‰Ù…È ´µÑ•áÐ¤ˆõôùA•Ðð½ÍÁ…¸øñÍÁ…¸ÍÑå±”õíì½±½Èè€‰Ù…È ´µÁÉ¥µ…Éä¤ˆõôùÉ½Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆõôø(€€€€€€€€€€€€€€ñ1…¹Q½±”±…¹œõí±…¹ô½¹¡…¹”õíÍ•Ñ1…¹ô€¼ø(€€€€€€€€€€€€€€ñ½Õ¹Ñ	ÕÑÑ½¸…½Õ¹Ðõí…½Õ¹Ñô½¹=Á•¸õì ¤€ôø€¡…½Õ¹Ð€üÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¤€è½Y¥•Ü ‰Á•ÑÌˆ¤¥ô€¼ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô((€€€€€€€í•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Á•ÑÌˆ€˜˜€ðø(€€€€€€€€€€ñU¹¥™¥•‘5•¹Õ!•É¼Ù¥•Üô‰Á•ÑÌˆ±…¹œõí±…¹ô€¼ø(€€€€€€€€€€ñMÁ•¥•ÍQ…‰	…ÈÍÁ•¥•ÌõíÍÁ•¥•Íô‘½½Õ¹ÐõíÁ•ÑÌ¹‘½œ¹±•¹Ñ¡ô…Ñ½Õ¹ÐõíÁ•ÑÌ¹…Ð¹±•¹Ñ¡ô(€€€€€€€€€€€½¹¡…¹”õì¡Ì¤€ôøìÍ•ÑMÁ•¥•Ì¡Ì¤ìÍ•Ñ5½‘” ‰Ù¥•Üˆ¤ìõô€¼ø(€€€€€€€€ð¼ùô(€€€€€€ð½‘¥Øø((€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ½¹Ñ•¹ÐµÍÑ…”ˆø(€€€€€íl‰½µµÕ¹¥Ñäˆ°‰Ñ¥ÁÌˆ°‰Í…©Ôˆ°‰Ñ…É½Ðˆ°‰Á•Ñ‰Ñ¤ˆ°‰Õ¥‘”ˆ°‰µäˆ°‰µ½É”ˆ°‰ÍÕÁÁ½ÉÐˆ°‰…µ¥¹ÅÕ¥Éäˆ°‰¹•…É‰äˆ°‰µÕÍ¥Œˆ°‰¹•ÝÌ‰t¹¥¹±Õ‘•Ì¡•™™•Ñ¥Ù•Y¥•Ü¤€˜˜€ñU¹¥™¥•‘5•¹Õ!•É¼Ù¥•Üõí•™™•Ñ¥Ù•Y¥•Ýô±…¹œõí±…¹ô€¼ùô(€€€€€í•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰±½¥¸ˆ€ü€ (€€€€€€€€ñ1½¥¹MÉ••¸½¹½Q•ÉµÌõì ¤€ôø½Y¥•Ü ‰Ñ•ÉµÌˆ¥ô½¹½AÉ¥Ù…äõì ¤€ôø½Y¥•Ü ‰ÁÉ¥Ù…äˆ¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰ÁÉ¥Ù…äˆ€ü€ (€€€€€€€€ðøñAÉ¥Ù…å½¹Ñ•¹Ð€¼øñA•Ñ9•ÝÍAÉ¥Ù…å‘‘•¹‘Õ´€¼øñA•ÑA½¥¹ÑA½±¥å‘‘•¹‘Õ´ÑåÁ”ô‰ÁÉ¥Ù…äˆ€¼øð¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Ñ•ÉµÌˆ€ü€ (€€€€€€€€ðøñQ•ÉµÍ½¹Ñ•¹Ð€¼øñA•Ñ9•ÝÍQ•ÉµÍ‘‘•¹‘Õ´€¼øñA•ÑA½¥¹ÑA½±¥å‘‘•¹‘Õ´ÑåÁ”ô‰Ñ•ÉµÌˆ€¼øð¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰…‰½ÕÐˆ€ü€ (€€€€€€€€ðøñ‰½ÕÑA…”½¹MÑ…ÉÐõì ¤€ôø½Y¥•Ü ‰Á•ÑÌˆ¥ô½¹9…Ù¥…Ñ”õì¡Ø¤€ôø½Y¥•Ü¡Ø¥ô€¼øñA•ÑA½¥¹Ñ‰½ÕÑ…É€¼øð¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰¡½µ”ˆ€ü€ (€€€€€€€€ñ!½µ•A…”…½Õ¹Ðõí…½Õ¹ÑôÁ•ÑÌõí…±±A•ÑÍô±…¹œõí±…¹ô(€€€€€€€€€½¹½A•ÑÌõì ¤€ôø½Y¥•Ü ‰Á•ÑÌˆ¥ô½¹½Y¥•Üõì¡Ø¤€ôø½Y¥•Ü¡Ø¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰µ½É”ˆ€ü€ (€€€€€€€€ñ5½É•5•¹ÕA…”±…¹œõí±…¹ô½¹9…Ù¥…Ñ”õì¡Ø¤ôù½Y¥•Ü¡Ø¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Õ¥‘”ˆ€ü€ (€€€€€€€€ñ%¹™½Õ¥‘•A…”€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰¹•…É‰äˆ€ü€ (€€€€€€€€ñ9•…É‰åA•ÑA…”€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰µÕÍ¥Œˆ€ü€ (€€€€€€€€ñA•Ñ5ÕÍ¥A…”…½Õ¹Ðõí…½Õ¹Ñô±…¹œõí±…¹ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰½¹Ñ•¹Ðˆ€ü€ (€€€€€€€€ñA•Ñ½¹Ñ•¹ÑA…”ÍÕ‰Q…ˆõí½¹Ñ•¹ÑMÕ‰Q…‰ô½¹MÕ‰Q…‰¡…¹”õíÍ•Ñ½¹Ñ•¹ÑMÕ‰Q…‰ô(€€€€€€€€€…±±A•ÑÌõí…±±A•ÑÍô™•…ÑÕÉ•A•Ðõí™•…ÑÕÉ•A•Ñô½¹M•±•Ñ•…ÑÕÉ•A•ÐõíÍ•Ñ•…ÑÕÉ•A•Ñ%‘ô(€€€€€€€€€½¹UÁ‘…Ñ•A•Ñ	Ñ¤õí¡…¹‘±•UÁ‘…Ñ•A•Ñ	Ñ¥ô½¹½I•¥ÍÑ•Èõì ¤€ôøìÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¤ì½Y¥•Ü ‰Á•ÑÌˆ¤ìõô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰½µµÕ¹¥Ñäˆ€ü€ (€€€€€€€€ñA•ÑQ…±­ÉÉ½É	½Õ¹‘…Éä­•äõíÁ•ÑÑ…±¬´‘í…½Õ¹Ðü¹¥‘ñð‰Õ•ÍÐ‰õôøñ½µµÕ¹¥ÑåA…”…±±A•ÑÌõí…±±A•ÑÍô…½Õ¹Ðõí…½Õ¹Ñô½¹½I•¥ÍÑ•Èõì ¤€ôøìÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¤ì½Y¥•Ü ‰Á•ÑÌˆ¤ìõô€¼øð½A•ÑQ…±­ÉÉ½É	½Õ¹‘…Éäø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰µäˆ€ü€ (€€€€€€€€ñ5åA…”…½Õ¹Ðõí…½Õ¹Ñô…±±A•ÑÌõí…±±A•ÑÍô±…¹œõí±…¹ô(€€€€€€€€€½¹=Á•¹½Õ¹Ðõì ¤€ôøÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¥ô½¹½A•ÑÌõì ¤€ôø½Y¥•Ü ‰Á•ÑÌˆ¥ô(€€€€€€€€€½¹=Á•¹A½ÍÐõì ¤€ôø½Y¥•Ü ‰½µµÕ¹¥Ñäˆ¥ô½¹=Á•¹‘µ¥¸õì ¤€ôø½Y¥•Ü ‰…‘µ¥¸ˆ¥ô(€€€€€€€€€½¹1½½ÕÐõí¡…¹‘±•1½½ÕÑô½¹•±•Ñ•½Õ¹Ðõì ¤€ôøÍ•Ñ•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¸¡ÑÉÕ”¥ô½¹½MÕÁÁ½ÉÐõì ¤€ôø½Y¥•Ü ‰ÍÕÁÁ½ÉÐˆ¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰…‘µ¥¸ˆ€ü€ (€€€€€€€€ñ‘µ¥¹I•Á½ÉÑÍA…”½¹	…¬õì ¤€ôø½Y¥•Ü ‰µäˆ¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰ÍÕÁÁ½ÉÐˆ€ü€ (€€€€€€€€ñMÕÁÁ½ÉÑA…”…½Õ¹Ðõí…½Õ¹Ñô½¹	…¬õì ¤€ôø½Y¥•Ü ‰µäˆ¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰…µ¥¹ÅÕ¥Éäˆ€ü€ (€€€€€€€€ñ‘%¹ÅÕ¥ÉåA…”½¹	…¬õì ¤€ôø½Y¥•Ü ‰¡½µ”ˆ¥ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰¹•ÝÌˆ€ü€ (€€€€€€€€ñA•Ñ9•ÝÍA…”±…¹œõí±…¹ô€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Ñ¥ÁÌˆ€ü€ (€€€€€€€€ñQ¥ÁÍA…”€¼ø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Í…©Ôˆ€ü€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±•…°µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÍ…©Ôˆø(€€€€€€€€€€ñA•ÑA¥­•ÈÁ•ÑÌõí…±±A•ÑÍô…Ñ¥Ù•%õí™•…ÑÕÉ•A•Ðü¹¥‘ô½¹M•±•ÐõíÍ•Ñ•…ÑÕÉ•A•Ñ%‘ô€¼ø(€€€€€€€€€€ñM…©ÕA…”Á•Ðõí™•…ÑÕÉ•A•Ñô½¹½I•¥ÍÑ•Èõì ¤€ôøìÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¤ì½Y¥•Ü ‰Á•ÑÌˆ¤ìõô€¼ø(€€€€€€€€ð½‘¥Øø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Ñ…É½Ðˆ€ü€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±•…°µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÑ…É½Ðˆø(€€€€€€€€€€ñA•ÑA¥­•ÈÁ•ÑÌõí…±±A•ÑÍô…Ñ¥Ù•%õí™•…ÑÕÉ•A•Ðü¹¥‘ô½¹M•±•ÐõíÍ•Ñ•…ÑÕÉ•A•Ñ%‘ô€¼ø(€€€€€€€€€í™•…ÑÕÉ•A•Ð€ü€ñA•ÑQ…É½ÑA…¹•°Á•Ðõí™•…ÑÕÉ•A•Ñô±…¹œõí±…¹ô€¼ø€è€ñ‘¥Ø±…ÍÍ9…µ”ô‰™•…ÑÕÉ”µ•µÁÑäµÝÉ…Àˆøñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµ…É™•…ÑÕÉ”µ•µÁÑäµ…ÉˆøñÍÁ…¸±…ÍÍ9…µ”ô‰™•…ÑÕÉ”µ•µÁÑäµ¥½¸ˆûÂ~<ð½ÍÁ…¸øñ Èû®NÇ®†w®Bpƒ²V²vÓªÂ ƒ²V²žƒ²^²ZÓ²jPð½ ÈøñÀ±…ÍÍ9…µ”ô‰‰œµÍÕˆˆùA•Ó¶®†s®*P€Ÿ²jÃ®š°ƒ²V²vÐŸ²^@ƒ®NÇ®†w¶Vpƒ®Âc®‚“®>g®²ó®ž0ƒ²vÓ²j§¶V€ƒ²"`ƒ²z#²ZÓ²jP¸ƒ®¢ó²‚ ƒ®Âc®‚“®>g®²ó²vƒ®NÇ®†w¶VÐƒ²Žó²ã²jP¸ð½Àøñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰œµ‰Ñ¸ˆ½¹±¥¬õì ¤ôùíÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¤í½Y¥•Ü ‰Á•ÑÌˆ¥õôû²jÃ®š°ƒ²V²vÐƒ®NÇ®†w¶Vc®~°ƒªÂªâÀð½‰ÕÑÑ½¸øð½‘¥Øøð½‘¥Øùô(€€€€€€€€ð½‘¥Øø(€€€€€€¤€è•™™•Ñ¥Ù•Y¥•Ü€ôôô€‰Á•Ñ‰Ñ¤ˆ€ü€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±•…°µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÍ¡•±°™•…ÑÕÉ”µÁ…”µÁ•Ñ‰Ñ¤ˆø(€€€€€€€€€€ñA•ÑA¥­•ÈÁ•ÑÌõí…±±A•ÑÍô…Ñ¥Ù•%õí™•…ÑÕÉ•A•Ðü¹¥‘ô½¹M•±•ÐõíÍ•Ñ•…ÑÕÉ•A•Ñ%‘ô€¼ø(€€€€€€€€€€ñA•Ñ	Ñ¥A…”Á•Ðõí™•…ÑÕÉ•A•Ñô½¹UÁ‘…Ñ•A•Ñ	Ñ¤õí¡…¹‘±•UÁ‘…Ñ•A•Ñ	Ñ¥ô½¹½I•¥ÍÑ•Èõì ¤€ôøìÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¤ì½Y¥•Ü ‰Á•ÑÌˆ¤ìõô€¼ø(€€€€€€€€ð½‘¥Øø(€€€€€€¤€èÍ¡½Ý=¹‰½…É‘¥¹œ€ü€ (€€€€€€€€ñ=¹‰½…É‘¥¹A…”(€€€€€€€€€ÍÁ•¥•ÌõíÍÁ•¥•Íô(€€€€€€€€€‰É••‘É½ÕÁÌõí‰É••‘É½ÕÁÍôÍ¥é•=ÁÑ¥½¹ÌõíÍ¥é•=ÁÑ¥½¹Íô(€€€€€€€€€¥¹¥Ñ¥…±Y…±Õ•Ìõíµ½‘”€ôôô€‰•‘¥Ðˆ€üÕÉÉ•¹ÑA•Ð¹ÁÉ½™¥±”€è¹Õ±±ô(€€€€€€€€€½¹MÕ‰µ¥Ðõíµ½‘”€ôôô€‰•‘¥Ðˆ€ü¡…¹‘±•‘¥ÑAÉ½™¥±”€è¡…¹‘±•‘‘A•Ñô(€€€€€€€€€½¹…¹•°õíÕÉÉ•¹ÑA•Ð€ü€ ¤€ôøÍ•Ñ5½‘” ‰Ù¥•Üˆ¤€è¹Õ±±ô(€€€€€€€€¼ø(€€€€€€¤€è€ (€€€€€€€€ðø(€€€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…á]¥‘Ñ è€äÀÀ°µ…É¥¸è€ˆÀ…ÕÑ¼ˆ°Á…‘‘¥¹œè€ˆÀ€ÈÁÁàˆõôø(€€€€€€€€€€€€ñA•ÑMÝ¥Ñ¡•ÈÍÁ•¥•ÌõíÍÁ•¥•ÍôÁ•ÑÌõíÕÉÉ•¹Ñ1¥ÍÑô…Ñ¥Ù•A•Ñ%õíÕÉÉ•¹ÑA•Ð¹¥‘ô(€€€€€€€€€€€€€½¹M•±•Ðõì¡¥¤€ôøìÁ•ÉÍ¥ÍÑÑ¥Ù”¡ì€¸¸¹…Ñ¥Ù•%°mÍÁ•¥•Ítè¥ô¤ìÍÉ½±±Q½Q½À ¤ìõô(€€€€€€€€€€€€€½¹‘‘9•Üõì ¤€ôøÍ•Ñ5½‘” ‰½¹‰½…É‘¥¹œˆ¥ô€¼ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ñI•ÍÕ±ÑA…”(€€€€€€€€€€€Á•ÐõíÕÉÉ•¹ÑA•Ñô(€€€€€€€€€€€‰É••‘É½ÕÁÌõí‰É••‘É½ÕÁÍô(€€€€€€€€€€€½¹‘‘I•½Éõí¡…¹‘±•‘‘I•½É‘ô(€€€€€€€€€€€½¹•±•Ñ•I•½Éõí¡…¹‘±••±•Ñ•I•½É‘ô(€€€€€€€€€€€½¹‘‘A¡½Ñ¼õí¡…¹‘±•‘‘A¡½Ñ½ô(€€€€€€€€€€€½¹‘¥ÑA¡½Ñ¼õí¡…¹‘±•‘¥ÑA¡½Ñ½ô(€€€€€€€€€€€½¹•±•Ñ•A¡½Ñ¼õí¡…¹‘±••±•Ñ•A¡½Ñ½ô(€€€€€€€€€€€½¹‘¥Ðõì ¤€ôøÍ•Ñ5½‘” ‰•‘¥Ðˆ¥ô(€€€€€€€€€€€½¹•±•Ñ”õíÉ•ÅÕ•ÍÑ•±•Ñ•A•Ñô(€€€€€€€€€€€½¹UÁ‘…Ñ•AÉ½™¥±•%µ…”õí¡…¹‘±•UÁ‘…Ñ•AÉ½™¥±•%µ…•ô(€€€€€€€€€€€½¹Q½±•Y…¥¹•%Ñ•´õí¡…¹‘±•Q½±•Y…¥¹•%Ñ•µô(€€€€€€€€€€¼ø(€€€€€€€€ð¼ø(€€€€€€¥ô(€€€€€€ð½‘¥Øø((€€€€€í•™™•Ñ¥Ù•Y¥•Ü€„ôô€‰±½¥¸ˆ€˜˜€ (€€€€€€€€ñ™½½Ñ•È±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•Èˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•ÈµÍ½¥…°µÑ¥Ñ±”ˆùíÐ¹Í½¥…±Q¥Ñ±•ôð½‘¥Øø(€€€€€€€€€€ñM½¥…±1¥¹­Ì€¼ø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•Èµ‰ÕÍ¥¹•ÍÌˆû²¶bã®ªƒ²V²jÃ®š³®äƒ
Üƒ®2¶Fs²z@ƒ²‚W²z³¶bƒ
Üƒ²
³²^²zC®NÇ®†w®Ê#¶bà€ÈäÜ´ÌÈ´ÀÄÜäÈð½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•Èµ•µ…¥°ˆù¡•±À¹Á•ÑÉ½Ýµ…¥°¹½´ð½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•Èµ½Áäˆù½ÁåÉ¥¡ÐƒŠNHA•ÑÉ½Ü¸±°É¥¡ÑÌÉ•Í•ÉÙ•¸ð½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á•ÑÉ½Üµ™½½Ñ•Èµ±¥¹­Ìˆø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤ôù½Y¥•Ü ‰ÁÉ¥Ù…äˆ¥ôùíÐ¹ÁÉ¥Ù…å½½Ñ•É1¥¹­ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤ôù½Y¥•Ü ‰Ñ•ÉµÌˆ¥ôùíÐ¹Ñ•ÉµÍ½½Ñ•É1¥¹­ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤ôù½Y¥•Ü ‰Õ¥‘”ˆ¥ôùí±…¹œôôô‰•¸ˆü‰Õ¥‘”ˆè‹²‚W®ÎÓªÂ²vÓ®Np‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤ôù½Y¥•Ü ‰…µ¥¹ÅÕ¥Éäˆ¥ôùí±…¹œôôô‰•¸ˆü‰A…ÉÑ¹•ÉÍ¡¥ÁÌˆè‹ªÒGªÎƒ
ß²‚s¶rÐƒ®²ã²v`‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤ôù½Y¥•Ü ‰ÍÕÁÁ½ÉÐˆ¥ôùí±…¹œôôô‰•¸ˆü‰MÕÁÁ½ÉÐˆè‹ªÎƒªÂw²ž²n@‰ôð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½™½½Ñ•Èø(€€€€€€¥ô((€€€€€í¥Í9…Ñ¥Ù•ÁÀ€˜˜€ (€€€€€€€€ñÁÁ	½ÑÑ½µ9…Ø(€€€€€€€€€…Ñ¥Ù”õíÙ¥•Ü€ôôô€‰¡½µ”ˆ€ü€‰¡½µ”ˆ€èÙ¥•Ü€ôôô€‰Á•ÑÌˆ€ü€‰Á•ÑÌˆ€èÙ¥•Ü€ôôô€‰µÕÍ¥Œˆ€ü€‰µÕÍ¥Œˆ€èÙ¥•Ü€ôôô€‰¹•…É‰äˆ€ü€‰¹•…É‰äˆ€èÙ¥•Ü€ôôô€‰½µµÕ¹¥Ñäˆ€ü€‰½µµÕ¹¥Ñäˆ€èÙ¥•Ü€ôôô€‰µ½É”ˆ€ü€‰µ½É”ˆ€è€ˆ‰ô(€€€€€€€€€½¹9…Ù¥…Ñ”õì¡­•ä¤€ôø½Y¥•Ü¡­•ä¥ô(€€€€€€€€¼ø(€€€€€€¥ô(€€€€€€ñ!…µ‰ÕÉ•É5•¹Ô½Á•¸õí¡…µ=Á•¹ô½¹±½Í”õì ¤€ôøÍ•Ñ!…µ=Á•¸¡™…±Í”¥ôÙ¥•ÜõíÙ¥•Ýô½¹9…Ù¥…Ñ”õí½Y¥•Ýô(€€€€€€€…½Õ¹Ðõí…½Õ¹Ñô½¹=Á•¹½Õ¹Ðõì ¤€ôø€¡…½Õ¹Ð€üÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡ÑÉÕ”¤€è½Y¥•Ü ‰Á•ÑÌˆ¤¥ô€¼ø(€€€€€€ñÕ¥‘•5½‘…°½Á•¸õíÕ¥‘•=Á•¹ô½¹±½Í”õì ¤€ôøÍ•ÑÕ¥‘•=Á•¸¡™…±Í”¥ô€¼ø(€€€€€€ñ½¹™¥Éµ5½‘…°(€€€€€€€½Á•¸õì„…‘•±•Ñ•Q…É•Ñô(€€€€€€€Ñ¥Ñ±”õíÐ¹½¹™¥Éµ•±•Ñ•Q¥Ñ±•ô(€€€€€€€µ•ÍÍ…”õí‘•±•Ñ•Q…É•Ð€üÐ¹½¹™¥Éµ•±•Ñ•5Íœ¡‘•±•Ñ•Q…É•Ð¹¹…µ”¤€è€ˆ‰ô(€€€€€€€½¹™¥Éµ1…‰•°õíÐ¹½¹™¥Éµ•±•Ñ•	Ñ¹ô(€€€€€€€½¹½¹™¥É´õí½¹™¥Éµ•±•Ñ•A•Ñô(€€€€€€€½¹…¹•°õì ¤€ôøÍ•Ñ•±•Ñ•Q…É•Ð¡¹Õ±°¥ô(€€€€€€¼ø(€€€€€€ñAÕ‰±¥9½Ñ¥•A½ÁÕÀ¼ø(€€€€€€ñAÕ‰±¥¥É•Ñ‘Ì¼ø(€€€€€€ñ½Õ¹Ñ5½‘…°(€€€€€€€½Á•¸õí…½Õ¹Ñ5½‘…±=Á•¹ô(€€€€€€€½¹±½Í”õì ¤€ôøÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡™…±Í”¥ô(€€€€€€€…½Õ¹Ðõí…½Õ¹Ñô(€€€€€€€½¹1½½ÕÐõí¡…¹‘±•1½½ÕÑô(€€€€€€€½¹I•ÅÕ•ÍÑ•±•Ñ”õì ¤€ôøìÍ•Ñ½Õ¹Ñ5½‘…±=Á•¸¡™…±Í”¤ìÍ•Ñ•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¸¡ÑÉÕ”¤ìõô(€€€€€€€½¹9¥­¹…µ•UÁ‘…Ñ•õì¡¹…µ”¤€ôøÍ•Ñ½Õ¹Ð ¡ÁÉ•Ø¤€ôøÁÉ•Ø€üì€¸¸¹ÁÉ•Ø°¹…µ”ô€èÁÉ•Ø¥ô(€€€€€€€½¹=Á•¹‘µ¥¸õì ¤€ôø½Y¥•Ü ‰…‘µ¥¸ˆ¥ô(€€€€€€¼ø(€€€€€€ñ½¹™¥Éµ5½‘…°(€€€€€€€½Á•¸õí‘•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¹ô(€€€€€€€Ñ¥Ñ±”õíÐ¹‘•±•Ñ•½Õ¹Ñ½¹™¥ÉµQ¥Ñ±•ô(€€€€€€€µ•ÍÍ…”õíÐ¹‘•±•Ñ•½Õ¹Ñ½¹™¥Éµ	½‘åô(€€€€€€€½¹™¥Éµ1…‰•°õí‘•±•Ñ¥¹½Õ¹Ð€üÐ¹µ¥É…Ñ¥½¹M…Ù¥¹œ€èÐ¹…½Õ¹Ñ•±•Ñ•	Ñ¹ô(€€€€€€€½¹½¹™¥É´õí¡…¹‘±•½¹™¥Éµ•±•Ñ•½Õ¹Ñô(€€€€€€€½¹…¹•°õì ¤€ôøÍ•Ñ•±•Ñ•½Õ¹Ñ½¹™¥Éµ=Á•¸¡™…±Í”¥ô(€€€€€€€‘…¹•È(€€€€€€€‰ÕÍäõí‘•±•Ñ¥¹½Õ¹Ñô(€€€€€€¼ø(€€€€€€ñ5½‘…°½Á•¸õí‘•±•Ñ•½Õ¹Ñ½¹•=Á•¹ô½¹±½Í”õì ¤€ôøÍ•Ñ•±•Ñ•½Õ¹Ñ½¹•=Á•¸¡™…±Í”¥ôÝ¥‘Ñ õìÌØÁôø(€€€€€€€€ñ‘¥ØÍÑå±”õíìÑ•áÑ±¥¸è€‰•¹Ñ•Èˆõôø(€€€€€€€€€€ñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€Äà°™½¹Ñ]•¥¡Ðè€àÀÀ°µ…É¥¹	½ÑÑ½´è€àõôùíÐ¹‘•±•Ñ•½Õ¹Ñ½¹•Q¥Ñ±•ôð½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰œµÍÕˆˆÍÑå±”õíì™½¹ÑM¥é”è€ÄÌ°±¥¹•!•¥¡Ðè€Ä¸Ü°µ…É¥¹	½ÑÑ½´è€ÄØõôùíÐ¹‘•±•Ñ•½Õ¹Ñ½¹•	½‘åôð½‘¥Øø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÍ9…µ”ô‰‰œµ‰Ñ¸ˆÍÑå±”õíìÝ¥‘Ñ è€ˆÄÀÀ”ˆõô½¹±¥¬õì ¤€ôøÍ•Ñ•±•Ñ•½Õ¹Ñ½¹•=Á•¸¡™…±Í”¥ôû¶fW²vàð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½5½‘…°ø(€€€€€€ñ5¥É…Ñ¥½¹5½‘…°(€€€€€€€½Á•¸õì„…Á•¹‘¥¹5¥É…Ñ¥½¹ô(€€€€€€€±½…‘¥¹œõíµ¥É…Ñ¥¹ô(€€€€€€€½¹M­¥Àõì ¤€ôøÍ•ÑA•¹‘¥¹5¥É…Ñ¥½¸¡¹Õ±°¥ô(€€€€€€€½¹½¹™¥É´õí¡…¹‘±•½¹™¥Éµ5¥É…Ñ¥½¹ô(€€€€€€¼ø(€€€€€íÍ…Ù•Q½…ÍÐ€˜˜€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍ…Ù”µÑ½…ÍÐ€‘íÍ…Ù•Q½…ÍÐ€ôôô€‰•ÉÉ½Èˆ€ü€‰•ÉÉ½Èˆ€è€ˆ‰õôø(€€€€€€€€€íÍ…Ù•Q½…ÍÐ€ôôô€‰½¬ˆ€ü€ (€€€€€€€€€€€€ðøñ¡•­MÅÕ…É•%½¸ÍÑå±”õíìÝ¥‘Ñ è€ÄØ°¡•¥¡Ðè€ÄØõô€¼øíÐ¹Í…Ù•Q½…ÍÑ=­ôð¼ø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€€ðûŠjƒ¾â<íÐ¹Í…Ù•Q½…ÍÑÉÉ½Éôð¼ø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø(€€€€€€¥ô(€€€€€í±½¥¹Q½…ÍÐ€˜˜€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍ…Ù”µÑ½…ÍÐ€‘í±½¥¹Q½…ÍÐ€ôôô€‰•ÉÉ½Èˆ€ü€‰•ÉÉ½Èˆ€è€ˆ‰õôø(€€€€€€€€€í±½¥¹Q½…ÍÐ€ôôô€‰ÍÕ•ÍÌˆ€ü€ (€€€€€€€€€€€€ðøñ¡•­MÅÕ…É•%½¸ÍÑå±”õíìÝ¥‘Ñ è€ÄØ°¡•¥¡Ðè€ÄØõô€¼øíÐ¹±½¥¹Q½…ÍÑMÕ•ÍÍôð¼ø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€€ðûŠjƒ¾â<íÐ¹±½¥¹Q½…ÍÑÉÉ½Éôð¼ø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø(€€€€€€¥ô(€€€€€€ñUÁ‘…Ñ•5½‘…°(€€€€€€€½Á•¸õíÕÁ‘…Ñ•=Á•¹ô(€€€€€€€½¹™¥œõíÕÁ‘…Ñ•½¹™¥ô(€€€€€€€½¹1…Ñ•Èõì ¤€ôøÍ•ÑUÁ‘…Ñ•=Á•¸¡™…±Í”¥ô(€€€€€€¼ø(€€€€€€ñ±•ÉÑ5½‘…°(€€€€€€€½Á•¸õíÝ•±½µ•	…­=Á•¹ô(€€€€€€€µ•ÍÍ…”õíÐ¹Ý•±½µ•	…­5Íœ ¡Á•ÑÌ¹‘½lÁtñðÁ•ÑÌ¹…ÑlÁtñðíô¤¹ÁÉ½™¥±”ü¹¹…µ”ñð€ˆˆ¥ô(€€€€€€€½¹±½Í”õì ¤€ôøÍ•Ñ]•±½µ•	…­=Á•¸¡™…±Í”¥ô(€€€€€€¼ø(€€€€€í•™™•Ñ¥Ù•Y¥•Ü€„ôô€‰…‘µ¥¸ˆ€˜˜€ñ„±…ÍÍ9…µ”ô‰­…­…¼µ¡…Ðµ™…ˆˆ¡É•˜õí--=}!Q}UI1ôÑ…É•Ðô‰}‰±…¹¬ˆÉ•°ô‰¹½½Á•¹•È¹½É•™•ÉÉ•Èˆ…É¥„µ±…‰•°ô‹¶:¯ªÞã®†s²jÀƒ²æÓ²æÓ²b“¶„€ÄèÄƒ²®.Ðˆøñ-…­…½¡…¹¹•±%½¸€¼øñÍÁ…¸û²æÓ²æÓ²b“¶„ƒ²®.Ðð½ÍÁ…¸øð½„ùô(€€€€ð½‘¥Øø(€€¤ì)ô()•áÁ½ÉÐ‘•™…Õ±Ð™Õ¹Ñ¥½¸ÁÀ ¤ì(€½¹ÍÐm±…¹œ°Í•Ñ1…¹t€ôÕÍ•MÑ…Ñ”  ¤ôùíÑÉåí½¹ÍÐØõ±½…±MÑ½É…”¹•Ñ%Ñ•´ ‰Á•ÑÉ½Üé±…¹œˆ¤íÉ•ÑÕÉ¸l‰­¼ˆ°‰•¸ˆ°‰©„ˆ°‰é ‰t¹¥¹±Õ‘•Ì¡Ø¤ýØè‰­¼‰õ…Ñ¡íÉ•ÑÕÉ¸€‰­¼‰õô¤ì(€ÕÍ•™™•Ð  ¤ôùíÑÉåí±½…±MÑ½É…”¹Í•Ñ%Ñ•´ ‰Á•ÑÉ½Üé±…¹œˆ±±…¹œ¥õ…Ñ¡íõô±m±…¹t¤ì(€½¹ÍÐÁ…Ñ €ôÑåÁ•½˜Ý¥¹‘½Ü€„ôô€‰Õ¹‘•™¥¹•ˆ€üÝ¥¹‘½Ü¹±½…Ñ¥½¸¹Á…Ñ¡¹…µ”€è€ˆ¼ˆì(€½¹ÍÐ¥ÍAÉ¥Ù…åA…”€ôÁ…Ñ €ôôô€ˆ½ÁÉ¥Ù…äˆñðÁ…Ñ €ôôô€ˆ½ÁÉ¥Ù…ä¼ˆì(€½¹ÍÐ¥ÍQ•ÉµÍA…”€ôÁ…Ñ €ôôô€ˆ½Ñ•ÉµÌˆñðÁ…Ñ €ôôô€ˆ½Ñ•ÉµÌ¼ˆì(€½¹ÍÐ¥Í•±•Ñ•½Õ¹ÑA…”€ôÁ…Ñ €ôôô€ˆ½‘•±•Ñ”µ…½Õ¹ÐˆñðÁ…Ñ €ôôô€ˆ½‘•±•Ñ”µ…½Õ¹Ð¼ˆì(€É•ÑÕÉ¸€ (€€€€ñ1…¹½¹Ñ•áÐ¹AÉ½Ù¥‘•ÈÙ…±Õ”õí±…¹ôø(€€€€€í¥ÍAÉ¥Ù…åA…”€ü€ñAÉ¥Ù…åA…”€¼ø(€€€€€€€€è¥ÍQ•ÉµÍA…”€ü€ñQ•ÉµÍA…”€¼ø(€€€€€€€€è¥Í•±•Ñ•½Õ¹ÑA…”€ü€ñ•±•Ñ•½Õ¹ÑA…”€¼ø(€€€€€€€€è€ñÁÁ%¹¹•È±…¹œõí±…¹ôÍ•Ñ1…¹œõíÍ•Ñ1…¹ô€¼ùô(€€€€ð½1…¹½¹Ñ•áÐ¹AÉ½Ù¥‘•Èø(€€¤ì)ô((¼¨AQI=]}%91}Ua}AA1%|ÈÀÈØÀàÄà€¨¼(