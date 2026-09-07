async function sendAuthEmail({ to, subject, heading, description, code }) {
  const apiKey = String(process.env.RESEND_API_KEY || "");
  const from = String(process.env.AUTH_EMAIL_FROM || process.env.REPORT_EMAIL_FROM || "PetGrow <onboarding@resend.dev>");
  if (!apiKey) throw new Error("AUTH_EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>${heading}</h2><p>${description}</p><p>인증번호는 <strong style="font-size:24px;letter-spacing:4px">${code}</strong> 입니다.</p><p>10분 안에 입력해 주세요. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("AUTH_EMAIL_SEND_FAILED");
}

export function sendPasswordResetEmail({ to, code }) {
  return sendAuthEmail({
    to, code,
    subject: "[PetGrow] 비밀번호 재설정 인증번호",
    heading: "PetGrow 비밀번호 재설정",
    description: "비밀번호 변경을 위한 이메일 인증번호입니다.",
  });
}

export function sendEmailVerificationEmail({ to, code, purpose }) {
  const attach = purpose === "attach";
  return sendAuthEmail({
    to, code,
    subject: attach ? "[PetGrow] 아이디 로그인 연결 인증번호" : "[PetGrow] 회원가입 인증번호",
    heading: attach ? "PetGrow 아이디 로그인 연결" : "PetGrow 회원가입",
    description: attach ? "현재 계정에 아이디 로그인을 연결하기 위한 인증번호입니다." : "회원가입을 위한 이메일 인증번호입니다.",
  });
}
