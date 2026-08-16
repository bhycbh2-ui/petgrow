const BLOCKED = [
  /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐/i,
  /섹스|sex|야동|porn|포르노|자위|딸딸|보지|자지|음란/i,
  /나치|nazi|혐오|살해협박|죽여버/i,
];
const PRIVATE_INFO = [
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /(?:01[016789])[-\s]?\d{3,4}[-\s]?\d{4}/,
];

export function validateCommunityText(...values) {
  const joined = values.filter(Boolean).map(String).join(" ");
  const compact = joined.replace(/[\s._\-~!@#$%^&*()+=|\\/]/g, "");
  if (BLOCKED.some((re) => re.test(compact))) {
    return { ok:false, reason:"blocked", message:"사용할 수 없는 표현이 포함되어 있어요. 내용을 수정해 주세요." };
  }
  if (PRIVATE_INFO.some((re) => re.test(joined))) {
    return { ok:false, reason:"private", message:"전화번호나 이메일 같은 개인정보는 Pet톡에 직접 작성하지 말아 주세요." };
  }
  return { ok:true };
}
