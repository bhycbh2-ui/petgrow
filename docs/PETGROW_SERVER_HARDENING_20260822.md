# PetGrow 서버 하드닝 — 2026-08-22

이번 배치는 신규 메뉴 추가가 아니라 중앙 DB·운영·Android 배포 완성도를 높이는 작업이다.

- Android AAB에서 Capacitor PushNotifications 네이티브 플러그인 동기화/검증
- Firebase `google-services.json`을 GitHub Actions Secret으로 안전하게 주입
- 잘못된 Android 자동 AAB workflow 인자 제거 및 월/목 빌드 정책 정리
- 기존 PetGrow/PetLife 브라우저 데이터를 민감키 제외 후 `pg_user_state`에 서버 동기화
- 본인 데이터 JSON 다운로드 API 및 회원정보 버튼 추가
- 중앙 DB 핵심 스냅샷을 GZIP + AES-256-GCM 암호화 후 Vercel Blob에 보관하는 일일 백업 구조 추가
- 백업 복호화/스테이징 복구 유틸리티 추가
- 관리자센터에 PetLife 활성 사용자, 푸시 성공/실패율, 신고 상태, 백업/Blob 정합성 지표 추가
- Blob 고아 후보는 탐지만 하고 자동 삭제하지 않도록 안전장치 적용
- 운영·복구·Android 실기기 QA 체크리스트 문서화

외부 설정이 필요한 항목은 코드만으로 완료 처리하지 않는다. 실제 FCM 원격 수신은 Firebase 서비스 계정, `GOOGLE_SERVICES_JSON_BASE64`, 실제 Android 단말에서 확인해야 한다. 암호화 일일 백업도 `BACKUP_ENCRYPTION_KEY`가 등록된 이후 활성화된다.
