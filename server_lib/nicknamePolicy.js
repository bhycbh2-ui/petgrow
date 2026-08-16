
const MAX_LEN = 8;
const RESERVED = ["admin","administrator","manager","moderator","운영자","관리자","petgrow","펫그로우","공식","official","staff","support","고객센터"];
const BLOCKED = [
  /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐/i,
  /섹스|sex|야동|porn|포르노|자위|딸딸|보지|자지|음란/i,
  /혐오|나치|nazi/i
];

export function normalizeNickname(v = "") {
  return String(v).trim().replace(/\s+/g, " ");
}

export function validateNickname(nickname, { allowOperator = false } = {}) {
  const n = normalizeNickname(nickname);
  if (!n) return { ok:false, reason:"empty", message:"닉네임을 입력해 주세요." };
  if (n.length < 2 || n.length > MAX_LEN) return { ok:false, reason:"length", message:"닉네임은 2~8자 이내로 입력해 주세요." };
  if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(n) || /(?:01[016789])[-\s]?\d{3,4}[-\s]?\d{4}/.test(n)) {
    return { ok:false, reason:"private", message:"전화번호나 이메일은 닉네임으로 사용할 수 없어요." };
  }
  const reservedHit = RESERVED.some((w) => n.toLowerCase().includes(w.toLowerCase()));
  if (reservedHit && !(allowOperator && n === "운영자")) {
    return { ok:false, reason:"reserved", message:"운영자나 공식 계정으로 오해할 수 있는 닉네임은 사용할 수 없어요." };
  }
  const compact = n.replace(/\s/g, "");
  if (BLOCKED.some((re) => re.test(compact))) {
    return { ok:false, reason:"blocked", message:"사용할 수 없는 표현이 포함된 닉네임이에요. 다른 닉네임을 사용해 주세요." };
  }
  return { ok:true, nickname:n };
}
