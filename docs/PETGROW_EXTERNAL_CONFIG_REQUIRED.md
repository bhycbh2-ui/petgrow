# PetGrow 외부 설정 필요 항목

코드 반영과 별도로 아래 값은 저장소에 커밋하지 않고 운영 콘솔의 Secret/Environment Variable로만 등록한다.

## Vercel
- `FCM_PROJECT_ID`
- `FCM_CLIENT_EMAIL`
- `FCM_PRIVATE_KEY`
- `BACKUP_ENCRYPTION_KEY`
- 선택: `BACKUP_RETENTION_DAYS` (기본 30)

## GitHub Actions
- `GOOGLE_SERVICES_JSON_BASE64`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

`GOOGLE_SERVICES_JSON_BASE64`는 Firebase Console에서 PetGrow Android 앱(`kr.co.petgrow.app`)의 `google-services.json`을 받은 뒤 base64로 인코딩해 등록한다.

이 값이 없더라도 웹 프로덕션 배포는 실패하지 않도록 구성되어 있다. 다만 실제 Android 원격 FCM 푸시는 Firebase 값과 실제 단말 테스트가 완료된 뒤에만 운영 완료로 판정한다.
