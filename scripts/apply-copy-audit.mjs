import fs from 'fs';
let s=fs.readFileSync('src/App.jsx','utf8');
const replacements=[
['{ title: "10. 쿠키·광고 식별자 및 이용자 선택권"','{ title: "11. 쿠키·광고 식별자 및 이용자 선택권"'],
['{ title: "11. 개인정보의 파기"','{ title: "12. 개인정보의 파기"'],
['{ title: "12. 이용자의 권리"','{ title: "13. 이용자의 권리"'],
['{ title: "13. 회원탈퇴 및 계정 삭제"','{ title: "14. 회원탈퇴 및 계정 삭제"'],
['{ title: "14. 아동의 개인정보"','{ title: "15. 아동의 개인정보"'],
['{ title: "15. 개인정보의 안전성 확보조치"','{ title: "16. 개인정보의 안전성 확보조치"'],
['{ title: "16. Pet톡(커뮤니티) 서비스와 개인정보"','{ title: "17. Pet톡(커뮤니티) 서비스와 개인정보"'],
['{ title: "17. Pet톡 게시물의 보유기간 및 삭제"','{ title: "18. Pet톡 게시물의 보유기간 및 삭제"'],
['{ title: "18. Pet톡 이미지 저장"','{ title: "19. Pet톡 이미지 저장"'],
['{ title: "19. 익명·집계형 서비스 이용 통계 및 광고 성과"','{ title: "20. 익명·집계형 서비스 이용 통계 및 광고 성과"'],
['{ title: "19-2. 내 주변 Pet 이용후기·좋아요·신고"','{ title: "21. 내 주변 Pet 이용후기·좋아요·신고"'],
[`{ title: "Nearby Pet", body: "Allow location access to find nearby animal hospitals, pharmacies, pet shops, groomers, daycare and hotels sorted by distance. See your location and business locations on the map together with business name, category, address, phone number and distance. Signed-in users can leave ratings, reviews and likes; their own reviews can be edited or deleted and other reviews can be reported. Your coordinates are used only for nearby search and are not saved to your account." }`,
`{ title: "Nearby Pet", body: "Search by an address you enter, or optionally allow location access to search around your current position. The map shows the search area, your location when permitted, nearby pet businesses and distance information. Signed-in users can leave ratings, reviews and likes; their own reviews can be edited or deleted and other reviews can be reported. Current-location coordinates are used only when needed for nearby search, map display and distance calculation and are not saved to your account." }`],
[`{ title: "7. Tips", body: "Tap the 'Tips' button in the header to search and bookmark health and lifestyle tips. Today's picks rotate automatically each day." }`,
`{ title: "7. Pet Info", body: "Open Pet Info to search and bookmark practical health, food, lifestyle, training, safety and grooming information. Today's picks rotate automatically each day." }`]
];
for(const [a,b] of replacements){if(s.includes(a))s=s.replace(a,b);}
fs.writeFileSync('src/App.jsx',s);
console.log('copy/legal audit fixes applied');
