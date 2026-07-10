# XIIO

대학생이 만드는 영화·예능·시리즈 콘텐츠를 업로드하고 시청하며, 자신의 학교를 대표하는 크리에이터로 소개되는 **UGC 스트리밍 플랫폼**입니다.

- **프로덕션:** [xiio.vercel.app](https://xiio.vercel.app)
- **스택:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Firebase · Cloudflare Stream · Stripe

---

## 목적

대학 영상 창작자들은 만들 곳(장비·팀)은 있어도, **보여줄 곳과 이어질 곳**이 마땅치 않습니다. XIIO는 그 둘을 한 플랫폼에서 해결하는 걸 목표로 합니다.

1. **보여줄 곳** — 영화·예능·시리즈를 정식으로 업로드·시청할 수 있는 스트리밍 공간을 제공하고, 단순히 "영상 하나 올리는 것"을 넘어 **자기 학교를 대표하는 크리에이터**로 소개되게 합니다.
2. **이어질 곳** — 업로드가 곧 포트폴리오가 되고(크레딧·협업 기록 자동 축적), 그 포트폴리오를 바탕으로 다른 창작자·팀과 협업하거나, 채용/구직 제안을 주고받을 수 있는 전문 네트워크로 확장합니다.

## 핵심 컨셉

| 컨셉 | 무엇을 의미하나 |
|------|------|
| **학교 대표** | 업로드 시 학교 태깅 → 학교 프로필·랭킹(`/schools`)·월간 대표작 자동 선정. "학교 대항전"이 아니라 "내 학교를 대표한다"는 소속감에 초점 |
| **작품이 곧 포트폴리오** | 감독·배우·스태프 크레딧이 자동으로 프로필 포트폴리오에 쌓임(`docs/product-network.md`) — 별도로 이력서를 만들 필요가 없음 |
| **보호된 소통** | 일반 1:1 DM과 별개로, 구직 제안/지원은 **양쪽이 수락해야만** 대화가 열리는 게이트를 거침 — 원치 않는 영업/제안 압박 없이 안전하게 커리어 관련 연락을 주고받음 |
| **정직한 알림** | 영상 승인/반려, 팔로우, 메시지, 제안 등 실제로 일어난 일만 종 아이콘 드롭다운으로 모아 보여줌(과도한 푸시 없이) |

## 지금 있는 것 / 앞으로의 방향

지금은 "1인 창작자가 학교 소속으로 업로드하고, 필요하면 다른 사람과 1:1 혹은 그룹으로 협업·소통한다"는 기본 골격이 갖춰진 단계입니다. 다음 방향으로 다듬어가는 중입니다:

- **법적/신뢰 기반 정리** — 저작권 귀속·회원 탈퇴 시 콘텐츠 보존 정책 등 이용약관·개인정보처리방침 초안(`docs/terms-of-service-draft.md`, `docs/privacy-policy-draft.md`)이 있고, 저작권 귀속 조항은 확정 전 단계입니다.
- **학교 대표성 강화** — 지금은 학교 랭킹·월간 대표작 정도이며, 학교 단위 참여를 더 두껍게 만드는 방향을 계속 고민 중입니다.
- **커리어 연결 고도화** — 구직 제안(Business Invite) 게이트는 만들어졌고, 그룹채팅(Rooms)까지 붙었습니다. 포트폴리오 기반 발견·매칭을 더 정교하게 만드는 게 다음 단계입니다.
- **수익화** — 업로더 보증금 Stripe MVP가 이미 있고, 이후 모델은 계속 열려 있는 상태입니다.

> 이 섹션은 실제로 구현·논의된 것을 기준으로 쓴 것이라, 방향이 바뀌면 같이 갱신해 주세요.

---

## 주요 기능

| 영역 | 설명 |
|------|------|
| **홈·카탈로그** | 영화 / 예능 / 시리즈 섹션, 쇼츠(프로모) 캐러셀 |
| **시청** | Cloudflare Stream 기반 HLS 재생 (`/watch/[ownerUid]/[workId]`) |
| **업로더** | 작품 등록·본편·프롤로그·숏폼 프로모·썸네일·크레딧·협업 초대, 업로드 시 학교 태깅 |
| **학교** | 학교 프로필 페이지(`/school/[schoolId]`), 학교 랭킹(`/schools`), 월간 대표작 자동 선정 |
| **계정·프로필** | 공개 프로필, 포트폴리오, 팔로우 |
| **메시지** | 1:1 다이렉트 메시지 + 그룹채팅(Rooms), 답글·이모지 리액션·본인 메시지 삭제, 낙관적 전송 |
| **구직 제안** | 구인/구직(Business Invite) — 양쪽이 수락해야 대화가 열리는 보호된 DM 게이트, 포트폴리오·이력서 첨부 |
| **알림** | 종 아이콘 드롭다운 — 작품 승인/반려, 새 팔로워, 새 메시지, 제안 수신/수락/거절을 한곳에서 확인, `/notifications` 전체 보기 |
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
├── components/       # UI 컴포넌트 (home, shorts, uploader, admin, messages, notifications, …)
├── context/          # Auth, Locale 등 React Context
├── hooks/            # 데이터·UI 훅
├── i18n/             # 다국어 문자열
├── lib/              # Firebase, Cloudflare, 결제, 서버 유틸
└── types/            # TypeScript 타입

docs/                 # 운영·연동·법률 가이드
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
| [`docs/product-network.md`](docs/product-network.md) | 프로필·협업·포트폴리오 네트워크 |
| [`docs/terms-of-service-draft.md`](docs/terms-of-service-draft.md) | 이용약관 초안 (저작권 귀속 조항 확정 전) |
| [`docs/privacy-policy-draft.md`](docs/privacy-policy-draft.md) | 개인정보처리방침 초안 |

---

## 라이선스

Private — 저장소 접근 권한이 있는 팀 내부용입니다.
