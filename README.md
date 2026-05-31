# XIIO

대학생이 만드는 영화·예능·시리즈·학교 대항전 콘텐츠를 업로드하고 시청하는 **UGC 스트리밍 플랫폼**입니다.

- **프로덕션:** [xiio.vercel.app](https://xiio.vercel.app)
- **스택:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Firebase · Cloudflare Stream · Stripe

---

## 주요 기능

| 영역 | 설명 |
|------|------|
| **홈·카탈로그** | 영화 / 예능 / 시리즈 / 학교 대항전 섹션, 쇼츠(프로모) 캐러셀 |
| **시청** | Cloudflare Stream 기반 HLS 재생 (`/watch/[ownerUid]/[workId]`) |
| **업로더** | 작품 등록·본편·프롤로그·숏폼 프로모·썸네일·크레딧·협업 초대 |
| **계정·프로필** | 공개 프로필, 포트폴리오, 팔로우, DM |
| **인증** | 이메일, Google, Apple, 카카오, 네이버 (Firebase Auth) |
| **결제** | 업로더 보증금 Stripe MVP (선택) |
| **어드민** | 콘텐츠·유저·신고·온보딩·결제 심사, AI 콘텐츠 검열 플래그 |
| **i18n** | 한국어 / 영어 UI |

---

## 사전 요구사항

- **Node.js 20 LTS 또는 22 LTS** 권장 (`node -v`로 확인)
- npm
- Firebase 프로젝트 (Auth, Firestore)
- Cloudflare Stream (영상 업로드·재생)
- 로컬 개발 시 `.env.local` (아래 설정 참고)

---

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd XIIO
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env.local
```

`.env.local`에 Firebase 클라이언트 키, Admin SDK, Cloudflare Stream 등 필요한 값을 채웁니다.  
변수별 설명은 [`.env.example`](.env.example) 주석을 참고하세요.

**Vercel 배포 시 Firestore DB 이름 일치 (중요):**  
`NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID`와 서버용 `FIREBASE_FIRESTORE_DATABASE_ID`(또는 동일 public 값)가 **로컬·프로덕션·Firebase Console에서 실제 프로필이 저장된 DB**와 같아야 합니다. 값이 비거나 다르면 로그인은 되는데 가입 화면이 다시 뜰 수 있습니다.

**최소 로컬 실행 (UI만):** Firebase `NEXT_PUBLIC_*` 클라이언트 변수  
**업로드·재생·API:** `FIREBASE_SERVICE_ACCOUNT_JSON`, Cloudflare Stream 토큰 등 추가 필요

### 3. 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

`next dev`가 멈춘 것처럼 보이면:

```bash
# 기존 프로세스 정리
pkill -f "next dev" 2>/dev/null || true
rm -rf .next

# 호스트·포트 명시 (package.json dev 스크립트 수정 없이)
npx next dev -H 127.0.0.1 -p 3000
```

Node 23 등 최신 버전에서 dev가 hang 되면 **Node 20/22 LTS**로 전환해 보세요.  
프로덕션 빌드 확인: `npm run build && npm run start`

### 4. 기타 스크립트

| 명령 | 설명 |
|------|------|
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run test` | 순수 로직 단위 테스트 |
| `npm run firebase:deploy` | Firestore 규칙·인덱스 수동 배포 |

---

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router (페이지·API Route)
├── components/       # UI 컴포넌트 (home, shorts, uploader, admin, …)
├── context/          # Auth, Locale 등 React Context
├── hooks/            # 데이터·UI 훅
├── i18n/             # 다국어 문자열
├── lib/              # Firebase, Cloudflare, 결제, 서버 유틸
└── types/            # TypeScript 타입

docs/                 # 운영·연동 가이드
firestore.rules       # Firestore 보안 규칙
firestore.indexes.json
storage.rules
firebase.json
```

---

## 배포

| 대상 | 방식 |
|------|------|
| **Next.js 앱** | Vercel (환경 변수는 Vercel 대시보드에 `.env.example`과 동일 키로 설정) |
| **Firestore 규칙·인덱스** | GitHub Actions — `main` push 시 `firebase.json` / `firestore.rules` / `firestore.indexes.json` 변경 시 자동 배포 |

자세한 CI 설정: [`docs/firebase-deploy.md`](docs/firebase-deploy.md)

---

## 문서

| 문서 | 내용 |
|------|------|
| [`.env.example`](.env.example) | 환경 변수 전체 목록 |
| [`docs/social-auth-setup.md`](docs/social-auth-setup.md) | Google · Apple · 카카오 · 네이버 로그인 |
| [`docs/firebase-deploy.md`](docs/firebase-deploy.md) | Firestore CI 배포 |
| [`docs/content-moderation.md`](docs/content-moderation.md) | AI 콘텐츠 검열 |
| [`docs/content-moderation-pricing.md`](docs/content-moderation-pricing.md) | 검열 벤더 요금 참고 |
| [`docs/product-network.md`](docs/product-network.md) | 프로필·협업·포트폴리오 |

---

## 라이선스

Private — 저장소 접근 권한이 있는 팀 내부용입니다.
