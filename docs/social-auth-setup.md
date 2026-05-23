# 소셜 로그인 설정 (Google · Apple · 카카오 · 네이버)

XIIO는 Firebase Auth를 사용합니다. Google·Apple은 클라이언트 팝업, 카카오·네이버는 서버 검증 후 Custom Token으로 로그인합니다.

## 공통 — Firebase

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 → **Authentication** → **Sign-in method**
2. **Google** — 사용 설정 (기존)
3. **Apple** — 사용 설정
4. **Authentication** → **Settings** → **Authorized domains**
   - `localhost`
   - 프로덕션 도메인 (예: `xiio.app`)

| 환경 | 도메인 |
|------|--------|
| 로컬 | `localhost` |
| 프로덕션 | 배포 URL 호스트 |

5. 서버 API용 **Firebase Admin** — `FIREBASE_SERVICE_ACCOUNT_JSON` ( [.env.example](../.env.example) 참고)

## Apple (Sign in with Apple)

순서가 중요합니다. **Services ID(웹) 설정 전에 App ID를 먼저** 만들어야 합니다.

### 1) App ID 만들기 (먼저)

1. [Apple Developer](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**
2. **+** → **App IDs** → **App** → Continue
3. Description: `XIIO` 등, Bundle ID: Explicit 예) `com.xiio.app`
4. Capabilities에서 **Sign in with Apple** 체크 → **Continue** → **Register**
5. (선택) 방금 만든 App ID → Sign in with Apple → **Edit** → **Enable as a primary App ID** 확인

Web Authentication에서 **「No App ID is available」** / **Next 비활성** → 이 단계를 건너뛴 경우입니다.

### 2) Services ID (웹) — XIIO Login

1. Identifiers → **Services IDs** → 기존 `XIIO Login` (또는 새로 생성)
2. **Sign in with Apple** 체크 → **Configure**
3. **Primary App ID**: 위에서 만든 App ID 선택 (드롭다운에 표시됨)
4. **Domains and Subdomains**: 배포 도메인만 (프로토콜 없음)
   - 예: `xiio.vercel.app`
5. **Return URLs**: Firebase Auth handler (정확히 일치)
   - `https://<PROJECT_ID>.firebaseapp.com/__/auth/handler`
   - 예: `https://xiio-9d86b.firebaseapp.com/__/auth/handler`
6. **Next** → **Done** → **Continue** → **Save**

### 3) Key · Firebase

1. **Keys** → **+** → **Sign in with Apple** → Key 등록 → `.p8` 다운로드 (1회만)
2. Firebase Console → Authentication → Apple:
   - Services ID (웹 Client ID), Team ID, Key ID, Private Key(.p8 내용)
3. Firebase → Authentication → **Settings** → **Authorized domains**에 `xiio.vercel.app` 추가

### (참고) 스크린샷과 동일한 값

| 필드 | 값 |
|------|-----|
| Domains | `xiio.vercel.app` |
| Return URL | `https://xiio-9d86b.firebaseapp.com/__/auth/handler` |

클라이언트 env는 별도 없음 (Firebase 설정만).

## 카카오

1. [Kakao Developers](https://developers.kakao.com) → 애플리케이션 추가
2. **앱 키**
   - **JavaScript 키** → `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`
   - **REST API 키** → `KAKAO_REST_API_KEY` (서버에서 토큰 검증 시 선택)
3. **플랫폼** → Web
   - 사이트 도메인: `http://localhost:3000`, 프로덕션 URL
4. **카카오 로그인** → 활성화, Redirect URI: 사이트 도메인과 동일 (JS SDK)
5. **동의항목**: 닉네임(필수), 카카오계정(이메일) 선택 권장

## 네이버

1. [Naver Developers](https://developers.naver.com) → 애플리케이션 등록
2. **사용 API**: 네이버 로그인
3. **Callback URL** (HTTPS 필수 — 로컬은 ngrok 등 터널 사용)

| 환경 | Callback URL |
|------|----------------|
| 로컬 (ngrok) | `https://<tunnel>/api/auth/naver/callback` |
| 프로덕션 | `https://<도메인>/api/auth/naver/callback` |

4. Client ID → `NAVER_CLIENT_ID`, Client Secret → `NAVER_CLIENT_SECRET`
5. 앱 기본 URL → `NEXT_PUBLIC_APP_URL` (리다이렉트 조합용)

## 환경 변수 (.env.local)

```bash
# 카카오
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
KAKAO_REST_API_KEY=

# 네이버
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# OAuth 리다이렉트 기준 (프로덕션 필수)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 동작 확인

1. `/login` — Google, Apple, 카카오, 네이버 버튼
2. 신규 소셜 → `/signup` 프로필 위저드 → `/profiles`
3. 기존 프로필 → 로그인 후 홈/프로필 선택
4. 네이버: HTTPS 콜백 필수

## 문제 해결

| 증상 | 확인 |
|------|------|
| Apple 팝업 실패 | Firebase Apple 설정, Authorized domains |
| 카카오 `KAKAO_NOT_READY` | JS 키, 도메인 등록, KakaoScript 로드 |
| 네이버 redirect 오류 | Callback URL 정확히 일치, HTTPS |
| 503 Admin | `FIREBASE_SERVICE_ACCOUNT_JSON` 서버 env |
