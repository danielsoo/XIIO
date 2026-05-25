# XIIO 영상계 네트워크 (제품 방향)

XIIO는 **공개 스트리밍 피드**를 유지하면서, 영화·영상 업계를 위한 **전문 프로필·크레딧·포트폴리오 제출** 기능을 더합니다.

## 핵심 개념

| 용어 | 설명 |
|------|------|
| **전문 프로필** | `/people/{handle}` — 활동 분야, 소개, 출연·감독 작품 목록 |
| **크레딧** | 작품에 연결된 XIIO 회원 (`users/{owner}/works/{id}/credits`) |
| **creditIndex** | `users/{uid}/creditIndex` — 출연작 조회용 역인덱스 |
| **포트폴리오 제출 링크** | `/p/{token}` — 비로그인, 선별·승인 작품만 재생 |

## 공개 범위

| 경로 | 로그인 | 재생 |
|------|--------|------|
| 홈·섹션 피드 | 회원 (기존) | 회원 |
| `/watch/...` | 회원 (기존) | 회원 |
| `/people/{handle}` | 불필요 | 회원만 (썸네일·메타는 공개) |
| `/p/{token}` | **불필요** | **가능** (토큰·기여 작품 검증) |

## 포트폴리오 제출 링크 규칙

작품이 링크에 포함되려면:

1. `platformStatus === "published"`
2. 링크 소유자가 **작품 owner** 이거나 **creditIndex**에 있음
3. `portfolioShares.excludedWorkIds`에 없음
4. `portfolioSubmissionHidden !== true` (또는 `includedWorkIds`에 명시)

## 환경·API

- Handle: `PATCH /api/me/professional-profile`
- 태그 검색: `GET /api/users/search-by-handle?q=`
- 크레딧: `PUT /api/me/works/{workId}/credits`
- 제출 링크: `GET/POST /api/me/portfolio-shares`, `GET /api/portfolio/{token}`

## 벤더 전환

AI 검열은 [content-moderation.md](./content-moderation.md) 참고. 네트워크 기능과 독립입니다.

## Firestore 인덱스

`firebase deploy --only firestore:indexes` — `portfolioShares.token`, `creditIndex.platformStatus` 포함.
