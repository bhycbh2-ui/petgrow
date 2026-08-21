# PetGrow 서버 하드닝 검증표

| 영역 | 자동 검증 | 외부/실기기 검증 |
|---|---|---|
| 웹 Production build | Vercel Preview Build | - |
| 보호 API 인증 | 비로그인 401 확인 | 로그인 사용자 기능 확인 |
| PetLife 중앙 DB | API/스키마/권한 | 새 설치 후 로그인 복원 |
| Legacy state sync | allowlist + 민감키 제거 | 기존 설치 데이터 이전 |
| 사용자 데이터 다운로드 | 인증 API + JSON attachment | 회원정보 버튼 다운로드 |
| 탈퇴 | 기존 Blob 삭제 + FK cascade | 탈퇴 후 재로그인/잔존 데이터 |
| 일정 알림 | 큐/FCM 서버 엔진 | Android 종료 상태 수신 |
| Android Push plugin | AAB workflow 네이티브 sync/grep | 실제 FCM token 및 수신 |
| 월간 리포트 | 서버 생성/저장 | PetLife 리포트 화면 |
| 관리자 통계 | 관리자 인증 API | 관리자센터 카드 표시 |
| 신고/모더레이션 | 기존 DB/API 유지 | 관리자 처리 UI |
| 암호화 백업 | AES-256-GCM/GZIP 코드 및 cron | 운영 Secret 설정 후 백업 생성/복호화 |
| Blob 정합성 | 관리자 health API | 고아 후보 검토 |
| AdMob | Android 연동 코드/app-ads.txt | 실제 AAB 광고 노출 |
| AAB | GitHub Actions release/debug build | Play 내부테스트 설치/업데이트 |

실기기/외부 인증이 필요한 칸은 자동 빌드 성공만으로 통과 처리하지 않는다.
