export default function petgrowPetLifeLegalAudit20260821(){
  return {
    name:"petgrow-petlife-legal-audit-20260821",
    enforce:"pre",
    transform(source,id){
      const cleanId=String(id||"").split("?")[0].replace(/\\/g,"/");
      if(!cleanId.endsWith("/src/App.jsx")) return null;
      let code=source;
      const replaceOne=(from,to,label)=>{
        if(!code.includes(from)) throw new Error(`[petlife-legal-audit] source changed: ${label}`);
        code=code.replace(from,to);
      };
      const replaceAll=(from,to,label)=>{
        if(!code.includes(from)) throw new Error(`[petlife-legal-audit] source changed: ${label}`);
        code=code.split(from).join(to);
      };

      replaceOne(
        "반려동물 정보 저장 및 기기 간 동기화, PetBTI 등 서비스 결과 저장·다시보기",
        "반려동물 정보 저장 및 기기 간 동기화, PetLife 평생기록(몸무게·예방접종·병원방문·약·사료·산책·목욕·미용·사진·건강 메모 및 다음 일정) 저장·조회·리포트·성장앨범 제공, PetBTI 등 서비스 결과 저장·다시보기",
        "privacy-ko-purpose"
      );
      replaceOne(
        "이용자가 등록한 반려동물 정보와 프로필 사진은 해당 PetGrow 계정과 연결하여 저장될 수 있으며, 우리 아이, 성장정보, Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), Pet타로(주제별 하루 1회), PetBTI 등 반려동물별 기능 제공에 이용될 수 있습니다.",
        "이용자가 등록한 반려동물 정보와 프로필 사진은 해당 PetGrow 계정과 연결하여 저장될 수 있으며, 우리 아이, 성장정보, PetLife, Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), Pet타로(주제별 하루 1회), PetBTI 등 반려동물별 기능 제공에 이용될 수 있습니다. PetLife에서는 몸무게, 예방접종, 병원방문, 약, 사료, 산책, 목욕, 미용, 사진, 건강 메모, 병원명 및 다음 일정 등 이용자가 직접 입력한 기록을 아이별 타임라인·일정·30일 리포트·성장앨범 제공을 위해 처리합니다. PetLife 기록과 사진은 회원이 해당 기록·반려동물·계정을 삭제할 때까지 보관될 수 있으며, 관계 법령상 별도 보관 의무가 있는 경우를 제외하고 삭제합니다.",
        "privacy-ko-pet-info"
      );
      replaceOne(
        "Vercel Blob(Pet톡 게시글 사진 및 Pet음악 음원·커버 이미지 저장)",
        "Vercel Blob(Pet톡 게시글 사진, PetLife 사진 및 Pet음악 음원·커버 이미지 저장)",
        "privacy-ko-blob"
      );
      replaceOne(
        "삭제 대상에는 PetGrow 계정, 카카오 인증 관련 식별정보, 반려동물 정보, 프로필 사진, 저장된 검사 및 서비스 결과, Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진 등이 포함될 수 있습니다.",
        "삭제 대상에는 PetGrow 계정, 카카오 인증 관련 식별정보, 반려동물 정보, 프로필 사진, 성장기록 및 PetLife의 몸무게·예방접종·병원방문·약·사료·산책·목욕·미용·사진·건강 메모·다음 일정, 저장된 검사 및 서비스 결과, Pet톡에 작성한 게시글·댓글·좋아요 기록 및 첨부 사진 등이 포함될 수 있습니다.",
        "privacy-ko-deletion"
      );
      replaceOne(
        "이번 개정에는 광고·제휴 문의 시 처리되는 정보와 Google AdMob/Google Mobile Ads SDK를 통한 광고 관련 자동 처리 항목 및 이용자 선택권에 관한 내용을 보다 구체적으로 반영했습니다.",
        "이번 개정에는 PetLife에서 처리하는 평생기록·사진·건강일정과 회원탈퇴 시 관련 파일 삭제 기준을 추가하고, 광고·제휴 문의 시 처리되는 정보와 Google AdMob/Google Mobile Ads SDK를 통한 광고 관련 자동 처리 항목 및 이용자 선택권에 관한 내용을 보다 구체적으로 반영했습니다.",
        "privacy-ko-change-note"
      );
      replaceOne(
        "최종 업데이트: 2026년 8월 17일\\\n시행일: 2026년 8월 17일",
        "최종 업데이트: 2026년 8월 21일\\\n시행일: 2026년 8월 21일",
        "privacy-ko-date"
      );

      replaceOne(
        "storing and syncing pet information across devices; saving and re-viewing results such as PetBTI",
        "storing and syncing pet information across devices; providing PetLife lifetime records for weight, vaccinations, hospital visits, medication, food, walks, baths, grooming, photos, health notes and upcoming care dates, including timelines, schedules, 30-day reports and growth albums; saving and re-viewing results such as PetBTI",
        "privacy-en-purpose"
      );
      replaceOne(
        "Pet information and profile photos you register may be stored linked to your PetGrow account, and used to provide pet-specific features such as My Pets, growth info, Saju, and PetBTI.",
        "Pet information and profile photos you register may be stored linked to your PetGrow account, and used to provide pet-specific features such as My Pets, growth info, PetLife, Saju, and PetBTI. PetLife may process user-entered weight, vaccination, hospital visit, medication, food, walk, bath, grooming, photo, health-note, clinic-name, and next-care-date records to provide the pet timeline, schedule, 30-day report, and growth album. PetLife records and photos may be retained until the relevant record, pet, or account is deleted, except where retention is required by applicable law.",
        "privacy-en-pet-info"
      );
      replaceOne(
        "Vercel Blob (storage for Pet Talk post photos)",
        "Vercel Blob (storage for Pet Talk post photos and PetLife photos)",
        "privacy-en-blob"
      );
      replaceOne(
        "Last updated: August 16, 2026\\\nEffective date: August 16, 2026",
        "Last updated: August 21, 2026\\\nEffective date: August 21, 2026",
        "privacy-en-date"
      );

      replaceOne(
        "반려동물 등록·성장정보·Pet사주·PetBTI·Pet정보 및 기타 관련 기능",
        "반려동물 등록·성장정보·PetLife 평생기록·Pet사주·PetBTI·Pet정보 및 기타 관련 기능",
        "terms-ko-definition"
      );
      replaceOne(
        "PetGrow는 우리 아이 등록·관리, 성장 예상 및 성장정보, Pet사주, PetBTI,",
        "PetGrow는 우리 아이 등록·관리, 성장 예상 및 성장정보, PetLife(몸무게·예방접종·병원방문·약·사료·산책·목욕·미용·사진·건강기록·일정·리포트·성장앨범), Pet사주, PetBTI,",
        "terms-ko-service"
      );
      replaceOne(
        "PetGrow에서 제공하는 건강, 식단, 영양 및 관리 정보는 일반적인 참고정보이며 수의사의 진료, 진단 또는 처방을 대신하지 않습니다. 반려동물에게 이상 증상이나 응급상황이 있는 경우 수의사 또는 동물병원의 진료를 받아야 합니다.",
        "PetGrow에서 제공하는 건강, 식단, 영양 및 관리 정보와 PetLife에 저장·표시되는 기록·리포트는 일반적인 기록·참고정보이며 수의사의 진료, 진단, 처방 또는 공식 진료기록을 대신하지 않습니다. PetLife의 리포트는 이용자가 입력한 기록을 바탕으로 한 관리 보조 정보입니다. 반려동물에게 이상 증상이나 응급상황이 있는 경우 수의사 또는 동물병원의 진료를 받아야 합니다.",
        "terms-ko-health"
      );
      replaceOne(
        "본 약관은 2026년 8월 17일부터 시행합니다.\\\n최종 업데이트: 2026년 8월 17일",
        "본 약관은 2026년 8월 21일부터 시행합니다.\\\n최종 업데이트: 2026년 8월 21일",
        "terms-ko-date"
      );

      replaceOne(
        "pet registration, growth info, Saju, PetBTI, Pet Info, and other related features",
        "pet registration, growth info, PetLife lifetime records, Saju, PetBTI, Pet Info, and other related features",
        "terms-en-definition"
      );
      replaceOne(
        "registering/managing pets, growth prediction and growth info, basic Pet Saju, Daily Pet Fortune, Guardian Compatibility, PetBTI,",
        "registering/managing pets, growth prediction and growth info, PetLife lifetime records (weight, vaccinations, hospital visits, medication, food, walks, baths, grooming, photos, health records, schedules, reports and growth albums), basic Pet Saju, Daily Pet Fortune, Guardian Compatibility, PetBTI,",
        "terms-en-service"
      );
      replaceOne(
        "Health, diet, nutrition, and care information provided by PetGrow is general reference information and does not replace examination, diagnosis, or treatment by a veterinarian. If your pet shows abnormal symptoms or an emergency, please see a veterinarian or animal hospital.",
        "Health, diet, nutrition, and care information provided by PetGrow, as well as records and reports shown in PetLife, is general record-keeping and reference information and does not replace examination, diagnosis, treatment, or official veterinary medical records. PetLife reports are management aids based on information entered by the user. If your pet shows abnormal symptoms or an emergency, please see a veterinarian or animal hospital.",
        "terms-en-health"
      );
      replaceOne(
        "These Terms take effect on August 16, 2026.\\\nLast updated: August 16, 2026.",
        "These Terms take effect on August 21, 2026.\\\nLast updated: August 21, 2026.",
        "terms-en-date"
      );

      replaceOne(
        "반려동물 이름·종류·품종·생년월일·성별·현재 체중·프로필 사진, PetBTI 결과",
        "반려동물 이름·종류·품종·생년월일·성별·현재 체중·프로필 사진, PetLife 기록(몸무게·예방접종·병원방문·약·사료·산책·목욕·미용·사진·건강 메모·병원명·다음 일정), PetBTI 결과",
        "login-consent-petlife"
      );
      replaceOne(
        '"성장 기록 등 저장된 데이터",',
        '"성장 기록 및 PetLife 기록(몸무게·예방접종·병원방문·약·사료·산책·사진·건강 메모 등)",',
        "delete-account-list"
      );
      replaceOne(
        "반려동물 정보·프로필 사진, 성장 기록, PetBTI 결과",
        "반려동물 정보·프로필 사진, 성장 기록, PetLife 기록·일정·사진, PetBTI 결과",
        "delete-account-confirm"
      );

      replaceOne(
        '    {key:"saju",icon:"🔮",title:"Pet사주"',
        '    {key:"petlife",icon:"🐾",title:"PetLife",sub:"몸무게부터 건강일정까지 평생기록",tone:"mint",intro:"몸무게·예방접종·병원방문·약·사료·산책·목욕·미용·사진·건강 메모를 아이별 타임라인에 모아 관리해요.",steps:["홈의 PetLife 또는 PetLife 전체보기를 열고 우리 아이를 선택해요.","기록 종류를 선택해 날짜와 필요한 항목을 입력해 저장해요.","기록·일정·30일 리포트·성장앨범에서 누적 내용을 확인해요."],faq:"PetLife 기록은 로그인한 PetGrow 계정에 저장·동기화되며 건강 관련 내용은 기록·참고용으로 수의사의 진단을 대신하지 않아요.",tip:"접종·병원 기록에 다음 일정을 입력하면 일정 탭에서 한눈에 확인할 수 있어요."},\n    {key:"saju",icon:"🔮",title:"Pet사주"',
        "usage-guide-petlife"
      );
      replaceAll(
        'pets:"우리 아이",nearby:"내 주변 Pet"',
        'pets:"우리 아이",petlife:"PetLife",nearby:"내 주변 Pet"',
        "admin-menu-label-petlife"
      );

      return {code,map:null};
    }
  };
}
