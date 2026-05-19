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

서비스 계정(GCP IAM → 해당 SA → **역할 부여**)에 아래가 필요합니다.

| 역할 (영문) | 용도 |
|-------------|------|
| **Service Usage Viewer** | `firebasestorage.googleapis.com` 등 API 사용 여부 조회 (`403 Permission denied to get service` 방지) |
| **Service Usage Admin** | (선택) API가 꺼져 있을 때 CLI가 자동으로 켜도록 허용 |
| **Firebase Rules Admin** | Firestore / Storage **rules** 배포 |
| **Cloud Datastore Index Admin** | Firestore **indexes** 배포 |
| **Firebase Storage Admin** | Storage rules 배포 |

빠르게 막을 때만: 동일 프로젝트에 **Firebase Admin** 하나로 위 권한을 대부분 커버할 수 있습니다(권한은 넓음).

### CI 실패: `403 ... firebasestorage.googleapis.com ... Permission denied to get service`

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 선택 → **IAM**
2. CI에 쓰는 서비스 계정( JSON의 `client_email` ) 찾기
3. **Service Usage Viewer** 추가 → 저장
4. [Firebase Console](https://console.firebase.google.com/) → **Storage**가 아직 없으면 한 번 활성화
5. GitHub Actions에서 **Re-run all jobs**

CI는 **Firestore → Storage** 순으로 별도 step입니다. Storage step만 실패해도 Firestore 규칙·인덱스는 이미 반영된 상태일 수 있습니다.

## 로컬에서 수동 배포

```bash
cp .firebaserc.example .firebaserc   # 프로젝트 ID 입력
npm run firebase:deploy
```

## 수동 CI 실행

GitHub → **Actions** → **Deploy Firebase config** → **Run workflow**

## 인덱스 빌드

`firestore.indexes.json` 배포 후 Firebase Console에서 인덱스가 **Building → Enabled**가 되기까지 수 분 걸릴 수 있습니다.
