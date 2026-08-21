export default function petgrowFullQa20260821(){
  return {
    name:"petgrow-full-qa-20260821",
    enforce:"pre",
    transform(source,id){
      const cleanId=String(id||"").split("?")[0].replace(/\\/g,"/");
      if(!cleanId.endsWith("/src/App.jsx")) return null;
      let code=source;
      const one=(from,to,label)=>{
        if(!code.includes(from)) throw new Error(`[petgrow-full-qa] source changed: ${label}`);
        code=code.replace(from,to);
      };
      const all=(from,to,label)=>{
        if(!code.includes(from)) throw new Error(`[petgrow-full-qa] source changed: ${label}`);
        code=code.split(from).join(to);
      };

      one(
        'title: "10. 쿠키·광고 식별자 및 이용자 선택권"',
        'title: "10-2. 쿠키·광고 식별자 및 이용자 선택권"',
        "privacy-ko-numbering"
      );

      one(
        "Items subject to deletion may include the PetGrow account, Kakao authentication-related identifiers, pet information, profile photos, and saved test/service results.",
        "Items subject to deletion may include the PetGrow account, Kakao authentication-related identifiers, pet information, profile photos, growth records, PetLife records/schedules/photos, saved test/service results, and Pet Talk posts/comments/likes/attached photos.",
        "privacy-en-deletion"
      );

      one('title: "19. Contact"','title: "20. Contact"',"privacy-en-contact-number");
      one(
        '  { title: "20. Contact"',
        '  { title: "19. Anonymous and Aggregated Service Analytics", body: "PetGrow may operate privacy-minimized aggregate analytics to understand service quality and operations. Aggregates may include visit sessions, estimated recently active sessions, page views by menu, web/app platform share, member and pet activity, Pet Talk activity, reports/restrictions, direct-ad activity, and ad request/success/error counts. The admin dashboard is designed not to display a user’s name, email, Kakao identifier, IP address, or per-user advertising history. Anonymous session hashes may be retained for up to 90 days for deduplication, while daily aggregate metrics may be retained for operational trend analysis." },\n  { title: "19-2. Nearby Pet Reviews, Likes, and Reports", body: "When a member writes, edits, deletes, likes, or reports a Nearby Pet place review, PetGrow may process the place identifier/name, rating, review text, like/report history, timestamps, and the internal account ID needed for ownership and moderation. Other users may see the service nickname, but Kakao identifiers and login credentials are not disclosed. Account-linked review and like records are deleted upon withdrawal unless retention is required by applicable law." },\n  { title: "20. Contact"',
        "privacy-en-analytics-nearby"
      );

      all(
        'music:"Pet음악",tips:"Pet정보"',
        'music:"Pet음악",news:"Pet뉴스",tips:"Pet정보",guide:"정보가이드"',
        "admin-label-news-guide"
      );
      all(
        'my:"회원정보",support:"고객지원",admin:"관리자"',
        'my:"회원정보",more:"더보기",support:"고객지원","ad-inquiry":"제휴문의",admin:"관리자"',
        "admin-label-more-support"
      );

      return {code,map:null};
    }
  };
}
