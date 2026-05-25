# AI 콘텐츠 검열 (Content Moderation)

업로드 영상이 Cloudflare Stream에서 **ready**가 되면 서버가 AI로 사전 검토하고, Firestore에 **플래그**만 저장합니다. **자동 거절·비공개는 하지 않습니다.** 최종 승인/반려는 어드민 심사 화면에서 합니다.

## 정책

- `platformStatus`는 **어드민만** 변경
- AI는 `contentModeration` 필드에 점수·플래그·한글 요약 저장
- 피드 노출은 기존과 동일하게 `published`만

## 벤더 티어 (코드: `src/lib/server/moderation/vendor-strategy.ts`)

| 티어 | 영상 API | 정책 요약 | 언제 |
|------|----------|-----------|------|
| **launch (기본)** | `google` | Gemini | 비용 우선, 월 ~100건 이하 |
| **value** | `hive` | Gemini | 월 ~120건+ (Google 무료 1,000분 초과 시) |
| **premium** | `sightengine` | Gemini | 연동·UGC 튜닝 우선 |
| **maxCoverage** | sightengine + | Gemini + ACRCloud | Phase 2 음원 저작권 |

### 전환 방법

`.env.local`에서만 변경 (코드 재배포 불필요, 해당 provider 키 필요):

```bash
CONTENT_MODERATION_ENABLED=true
CONTENT_MODERATION_VIDEO_PROVIDER=google   # → hive | sightengine
GEMINI_API_KEY=...
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `CONTENT_MODERATION_ENABLED` | `true`일 때만 webhook 후 분석 |
| `CONTENT_MODERATION_VIDEO_PROVIDER` | `google` (기본), `hive`, `sightengine` |
| `GEMINI_API_KEY` | 정책·한글 요약 ([Gemini API](https://ai.google.dev/)) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Google Video Intelligence용 (Firebase SA 재사용) |
| `HIVE_API_KEY` | Hive 전환 시 |
| `SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET` | Sightengine 전환 시 |
| `MODERATION_*_HIGH` / `MEDIUM` | 플래그 임계값 (선택) |

## GCP 설정 (Google provider)

1. [Video Intelligence API](https://console.cloud.google.com/apis/library/videointelligence.googleapis.com) 사용 설정
2. Firebase와 동일 프로젝트의 서비스 계정에 **Video Intelligence User** (또는 `cloud-platform`) 권한
3. Vercel 등: `FIREBASE_SERVICE_ACCOUNT_JSON`에 SA JSON 1줄

## Cloudflare

- 공개 영상: MP4 다운로드 URL로 Google/Hive/Sightengine에 전달
- MP4 미준비 시 HLS URL 또는 썸네일 샘플 + Gemini 보조
- `CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN` 필요 (썸네일·재생 URL)

## 어드민 UI

- **콘텐츠 → AI 고위험**: `contentModeration.hasHighSeverity === true` 이고 심사 대기 중인 항목
- 풀/쇼츠 심사 카드에 AI 요약·플래그 표시

## Firestore 인덱스

`firestore.indexes.json`에 복합 인덱스 포함. 배포:

```bash
firebase deploy --only firestore:indexes
```

## 개인정보

검열 시 영상 URL·썸네일·제목·설명이 Google / Hive / Sightengine / Gemini로 전송됩니다. 이용약관·개인정보처리방침에 명시하세요.

## 요금

**분당·월간 전체 표:** [content-moderation-pricing.md](./content-moderation-pricing.md)

| 조합 | 월 100건 대략 |
|------|----------------|
| Google + Gemini | ~$20 |
| Hive + Gemini | ~$36 |
| Sightengine + Gemini | ~$153 |
