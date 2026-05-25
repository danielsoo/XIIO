# XIIO 영상계 네트워크 (제품 방향)

XIIO는 **공개 스트리밍 피드**를 유지하면서, 영화·영상 업계를 위한 **전문 프로필·크레딧·포트폴리오 제출·창구(발견)·팔로우·DM** 기능을 더합니다.

## 핵심 개념

| 용어 | 설명 |
|------|------|
| **전문 프로필** | `/people/{handle}` — 헤드라인·소개·역할 칩·출연·감독 작품 |
| **프로필 꾸미기** | `/account/profile` — 소개·역할·협업 창구·포트폴리오 제출 링크 |
| **창구** | `/discover` — 프로필 카드로 배우·크루·작가 검색 |
| **크레딧** | 작품에 연결된 XIIO 회원 (`users/{owner}/works/{id}/credits`) |
| **creditIndex** | `users/{uid}/creditIndex` — 출연작 조회용 역인덱스 |
| **포트폴리오 제출 링크** | `/p/{token}` — 비로그인, 선별·승인 작품만 재생 |
| **팔로우** | `follows/{follower}_{following}` |
| **DM** | `dmThreads/{id}/messages` — 프로필에서 시작하는 1:1 텍스트 |

## 프로필 표현

- **헤드라인·bio** — 사용자 자유 입력 (링크드인형)
- **roleTags** — `director` / `actor` / `crew` 복수 선택 (최대 3, 단일 분야 강제 없음)
- **crewRoles** — 조명·편집 등 자유 태그
- **openToCollaborate** + **collaborationNote** — 창구·프로필 「협업 가능」

레거시 `primaryField` 단일 값은 UI에서 사용하지 않으며, `roleTags`가 없을 때만 읽기 호환용으로 매핑합니다.

## 공개 범위

| 경로 | 로그인 | 재생 |
|------|--------|------|
| 홈·섹션 피드 | 회원 (기존) | 회원 |
| `/watch/...` | 회원 (기존) | 회원 |
| `/people/{handle}` | 불필요 (메타·팔로우·DM은 로그인) | 회원만 |
| `/discover` | 회원 | — |
| `/messages` | 회원 | — |
| `/p/{token}` | **불필요** | **가능** |

## API 요약

| API | 용도 |
|-----|------|
| `GET/PATCH /api/me/professional-profile` | 프로필 꾸미기 |
| `GET /api/people/{handle}` | 공개 프로필 (+ viewer 팔로우 여부) |
| `GET /api/discover/people` | 창구 목록 |
| `POST/DELETE /api/me/follows/{uid}` | 팔로우 |
| `GET/POST /api/me/dm/threads` | 대화 목록·생성 |
| `GET/POST /api/me/dm/threads/{id}/messages` | 메시지 |
| `POST/DELETE /api/me/blocks/{uid}` | 차단 |
| `GET/POST /api/me/portfolio-shares` | 제출 링크 |
| `GET /api/portfolio/{token}` | 비로그인 제출 뷰 |

## 포트폴리오 제출 링크 규칙

작품이 링크에 포함되려면:

1. `platformStatus === "published"`
2. 링크 소유자가 **작품 owner** 이거나 **creditIndex**에 있음
3. `portfolioShares.excludedWorkIds`에 없음
4. `portfolioSubmissionHidden !== true` (또는 `includedWorkIds`에 명시)

## DM·안전

- 텍스트만 (이미지 DM 없음)
- 차단 시 새 메시지 불가
- 신고는 기존 `POST /api/reports` 확장 예정 (`user` / `dm_message` 타입)

## Firestore 인덱스

`firebase deploy --only firestore:indexes`

- `users`: `isDiscoverable` + `updatedAt`
- `follows`: `followerUid` + `createdAt`
- `dmThreads`: `participantIds` + `lastMessageAt`
- `portfolioShares.token`, `creditIndex` (기존)

## 벤더 전환

AI 검열은 [content-moderation.md](./content-moderation.md) 참고. 네트워크 기능과 독립입니다.
