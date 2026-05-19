# Firebase rules & indexes (CI)

Next.js 앱은 **Vercel**이 배포하고, Firestore 규칙·인덱스·Storage 규칙은 **GitHub Actions**가 배포합니다.

## 자동 실행 조건

- `main` 브랜치에 push
- 아래 파일 중 **하나 이상** 변경:
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`
  - `storage.rules`

앱 코드만 바뀐 push에서는 이 워크플로는 **실행되지 않습니다**.

## GitHub Secrets (저장소 Settings → Secrets and variables → Actions)

| Secret | 설명 |
|--------|------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase/GCP 서비스 계정 JSON **전체** (한 줄). Vercel의 `FIREBASE_SERVICE_ACCOUNT_JSON`과 동일해도 됩니다. |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`와 동일) |

서비스 계정에 필요한 역할(최소 권한 권장):

- Firebase Rules Admin
- Cloud Datastore Index Admin
- Firebase Storage Admin (Storage rules 배포용)

## 로컬에서 수동 배포

```bash
cp .firebaserc.example .firebaserc   # 프로젝트 ID 입력
npm run firebase:deploy
```

## 수동 CI 실행

GitHub → **Actions** → **Deploy Firebase config** → **Run workflow**

## 인덱스 빌드

`firestore.indexes.json` 배포 후 Firebase Console에서 인덱스가 **Building → Enabled**가 되기까지 수 분 걸릴 수 있습니다.
