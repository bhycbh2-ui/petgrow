# PetGrow 운영·복구·Android QA 기준

## 1. Firebase / Android 푸시

Vercel 환경변수에 `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`를 등록한다.
GitHub Actions Secret에 `GOOGLE_SERVICES_JSON_BASE64`를 등록한다. 값은 Firebase Android 앱의 `google-services.json`을 base64로 인코딩한 문자열이다.

AAB workflow는 빌드 시 `@capacitor/push-notifications@6.0.2`를 임시 설치한 뒤 Capacitor sync를 실행하고, 네이티브 플러그인이 실제 Android 프로젝트에 연결됐는지 grep 검증한다. Firebase JSON이 없으면 AAB는 만들 수 있지만 실푸시 검증은 미완료로 본다.

실기기 통과 기준:
- Android 13+ 알림 권한 팝업 표시
- 로그인 후 FCM 토큰 서버 등록
- 예방접종/약/미용 일정 D-7/D-3/D-1/D-day 수신
- 앱 실행 중 / 백그라운드 / 종료 상태 수신 확인
- 알림 탭 후 앱 복귀 및 읽음 처리

## 2. 로컬 데이터 → 중앙 DB

PetLife 핵심 데이터는 `pg_pets`, `pg_pet_life_entries` 중심으로 서버 저장한다.
기존 브라우저에 남아 있는 PetGrow/PetLife 계열의 안전한 localStorage 값은 `legacy-server-sync.js`가 로그인 세션에서 `/api/legacy-state-import`로 서버에 백업한다.

보안상 토큰, 세션, 관리자 PIN, OAuth/credential 관련 키는 서버 이전 대상에서 제외한다.
새 기기에서 해당 로컬 키가 비어 있으면 서버의 `legacy:*` 값을 복구한다. 기존 로컬 값이 존재할 때는 서버 값이 덮어쓰지 않는다.

## 3. 사용자 데이터 다운로드 / 탈퇴

`/api/data-export`는 로그인 사용자 본인 데이터만 JSON으로 내보낸다. 회원정보 화면에서는 `회원탈퇴` 버튼 앞에 `내 데이터 다운로드` 버튼을 자동 노출한다.

탈퇴 전 Blob 사진을 정리하고 사용자 레코드 삭제 시 FK cascade로 연결 데이터를 제거한다. 탈퇴 관련 변경 후에는 PetLife 사진 URL, Pet톡 이미지, `pg_user_state`, PetLife 기록이 남지 않는지 검증한다.

## 4. 암호화 백업 / 복구

Vercel 환경변수:
- `BACKUP_ENCRYPTION_KEY`: 최소 32자 이상의 무작위 값 권장
- `BACKUP_RETENTION_DAYS`: 기본 30일
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 연결 시 자동 설정

매일 PetLife cron에서 중앙 데이터 스냅샷을 GZIP 압축 후 AES-256-GCM으로 암호화해서 Blob `backups/petgrow-central/` 경로에 저장한다. 백업 키가 없으면 작업을 실패시키지 않고 안전하게 건너뛴다.

복구 절차:
1. 관리자 데이터 정합성 API에서 최근 백업 시각 확인
2. 복구 대상 백업 URL 확보
3. 운영 DB에 바로 적용하지 말고 별도 staging DB 준비
4. `BACKUP_ENCRYPTION_KEY=... node scripts/decrypt-petgrow-backup.mjs <URL> staging-backup.json`
5. JSON의 `service`, `backupVersion`, `createdAt`, 테이블별 건수를 확인
6. staging DB에 복원 후 로그인/PetLife/커뮤니티/신고 기능 검증
7. 검증된 경우에만 운영 DB 복구 계획 실행

백업은 암호화되어 있어도 공개 Blob URL 형식일 수 있으므로 URL과 암호화 키를 함께 외부에 공유하지 않는다.

## 5. 관리자 운영 점검

`/api/admin-overview-lite`에서 확인:
- 전체 회원 수
- PetLife 전체 반려동물/기록/최근 30일 기록
- 최근 30일 PetLife 활성 사용자
- 7일 내 일정
- 월간 리포트 수
- 활성 푸시 기기
- 최근 30일 푸시 시도/성공/실패/성공률
- 미처리 신고 수

`/api/admin-data-health`에서 확인:
- 최근 암호화 백업
- DB가 참조하는 Blob URL 수
- Blob에서 사라진 DB 참조
- DB에서 참조하지 않는 고아 파일 후보

고아 파일 후보는 자동 삭제하지 않는다.

## 6. AAB / 실기기 최종 QA

AAB 자동 빌드는 월/목 또는 수동 workflow_dispatch로 실행한다. 자동 workflow는 존재하지 않는 input을 전달하지 않는다.

최종 출시 전 실제 Android 단말에서 아래 순서로 검증한다.
1. 신규 설치 및 스플래시
2. 카카오 로그인
3. 우리 아이 등록/수정
4. PetLife 몸무게/예방접종/병원/약/사진 저장
5. 앱 강제종료 후 재접속하여 기록 복원
6. 다른 기기/새 설치 상태에서 서버 복원 확인
7. 일정 푸시 수신
8. 월간 리포트 표시
9. Pet톡 작성/댓글/신고/관리자 처리
10. Pet음악 재생/즐겨찾기
11. AdMob 표시 및 PetLife 진입 시 간섭 여부
12. 내 데이터 다운로드
13. 로그아웃/재로그인
14. 회원탈퇴 후 재로그인/잔존 데이터 확인
15. Play Console 내부테스트 AAB 설치 및 업데이트 테스트

코드와 빌드가 성공해도 7번의 실제 FCM 수신과 15번의 Play 설치/업데이트는 실제 Android 기기와 Firebase/Play Console 설정 없이는 통과로 표시하지 않는다.
