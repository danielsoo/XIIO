# Firebase Firestore rules & indexes (CI)

Next.js 앱은 **Vercel**이 배포하고, **Firestore 규칙·인덱스**만 GitHub Actions가 배포합니다.

영상은 **Cloudflare Stream**을 사용합니다. Firebase Storage rules는 CI에 포함하지 않습니다(아바타 등은 추후 R2 등으로 옮길 수 있음).

## 자동 실행 조건

- `main` 브랜치에 push
- 아래 파일 중 **하나 이상** 변경:
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`

## GitHub Secrets

| Secret | 설명 |
|--------|------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON **전체** (한 줄). JSON 안 `project_id` 확인. |
| `FIREBASE_PROJECT_ID` | **반드시** 위 JSON의 `project_id`와 동일 (예: `xiio-9d86b`) |

### 프로젝트 ID가 어긋나면 403이 납니다

GCP 콘솔 상단 프로젝트와 Secret이 **같은 프로젝트**여야 합니다.

- Firebase Console URL: `.../project/xiio-9d86b/...` → Secret도 `xiio-9d86b`
- 서비스 계정 이메일: `firebase-adminsdk-...@xiio-9d86b.iam.gserviceaccount.com` → IAM 역할도 **그 프로젝트(xiio-9d86b)** 에 부여

다른 프로젝트(예: `xiio-496818`) IAM에만 역할을 주면 CI는 계속 실패합니다.

### 서비스 계정 역할 (Firestore CI만)

대상 프로젝트 IAM에서 `client_email` 계정에:

- **Firebase Admin** (간단), 또는
- **Firebase Rules Admin** + **Cloud Datastore Index Admin**

## Storage rules (수동, 선택)

아바타용 Firebase Storage를 쓰는 동안만:

```bash
npx firebase deploy --only storage --project YOUR_PROJECT_ID
```

## 로컬 Firestore 배포

```bash
cp .firebaserc.example .firebaserc   # project id 입력
npm run firebase:deploy
```

## 수동 CI

GitHub → **Actions** → **Deploy Firebase config** → **Run workflow**

최신 워크플로는 **Firestore만** 배포합니다. 예전 Run(「Deploy Firestore and Storage rules」한 줄)은 옛 커밋이므로, 수정 후 **새 Run** 또는 **Re-run**으로 확인하세요.

## 인덱스

배포 후 Firebase Console → Firestore → Indexes에서 **Building → Enabled**까지 수 분 걸릴 수 있습니다.
