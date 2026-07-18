# XIIO 이미지 전송 자동화 로드맵

> 상태: 계획됨 — 공개 출시 전 P1 작업  
> 목적: 개발자가 히어로·썸네일 파일을 수동 변환하지 않아도 모든 이미지가 빠르고 선명하게 표시되게 한다.

## 현재 상태

- 고정 히어로 3장은 빌드 전에 WebP로 준비되어 있으며 `priority` preload와 blur placeholder를 사용한다.
- 영상 썸네일은 Cloudflare Stream UID에서 화면 용도에 맞는 파생 이미지를 요청한다.
- 원본 이미지는 보존하지만, 사용자 화면에는 원본 수 MB 파일을 직접 보내지 않는다.
- 이 방식은 현재 고정 자산에는 적절하지만 사용자 업로드 이미지가 늘어나면 자동 파이프라인이 필요하다.

## 목표 구조

1. **원본 보존**
   - 사용자가 올린 원본은 비공개 원본 저장소에 그대로 보관한다.
   - 원본 URL을 공개 화면에서 직접 사용하지 않는다.

2. **업로드 후 비동기 변환**
   - 이미지 업로드 완료 이벤트가 변환 작업을 큐에 넣는다.
   - Cloudflare Images를 우선 검토하고, 비용·운영 조건에 따라 Cloudflare Image Resizing + R2/Firebase Storage 조합을 선택한다.
   - 영상 스틸은 별도 이미지 업로드 없이 Cloudflare Stream thumbnail endpoint를 계속 사용한다.

3. **표준 파생 이미지 생성**

   | 용도 | 권장 크기 | 포맷 |
   |---|---:|---|
   | Blur placeholder | 24–48px | WebP |
   | Avatar | 128px, 256px | AVIF/WebP |
   | 카드 가로형 | 640×360, 1280×720 | AVIF/WebP |
   | 카드 세로형 | 360×640, 720×1280 | AVIF/WebP |
   | 히어로 | 1280px, 1920px 폭 | AVIF/WebP |

   - 브라우저 지원에 따라 AVIF → WebP 순으로 제공한다.
   - 업스케일은 하지 않는다. 원본보다 큰 파생 이미지는 생성하지 않는다.
   - EXIF 방향을 정규화하고 메타데이터는 제거한다.

4. **Firestore 이미지 메타데이터**

   작품·프로필 문서에는 단일 `thumbnailUrl`만 저장하지 않고 다음 형태의 버전된 이미지 자산 정보를 저장한다.

   ```ts
   type ImageAsset = {
     version: number;
     sourceUrl: string;
     width: number;
     height: number;
     blurDataUrl?: string;
     variants: {
       cardLandscape?: string;
       cardPortrait?: string;
       hero1280?: string;
       hero1920?: string;
       avatar128?: string;
       avatar256?: string;
     };
   };
   ```

5. **브라우저 전송 규칙**
   - 첫 화면 히어로 한 장만 preload/high priority로 요청한다.
   - 화면 밖 이미지는 lazy loading한다.
   - `srcset`/`sizes`로 현재 화면에 필요한 크기만 내려준다.
   - 파생 이미지 URL은 콘텐츠 해시 또는 버전을 포함한다.
   - 파생 이미지는 `Cache-Control: public, max-age=31536000, immutable`을 사용한다.
   - 새 이미지가 게시될 때 주요 카드·히어로 파생 이미지를 미리 생성하고 CDN을 warm-up한다.

## 구현 순서

### 1단계 — 공급자 결정

- Cloudflare Images와 Image Resizing + 기존 저장소의 비용, 변환 제한, 서명 URL, 삭제 동기화를 비교한다.
- 선택 결과와 환경 변수를 `.env.example` 및 운영 문서에 기록한다.

### 2단계 — 업로드 파이프라인

- 이미지 업로드 완료 → 작업 큐 → 변환 → 자산 메타데이터 저장 흐름을 구현한다.
- 변환 실패가 업로드 자체를 실패시키지 않도록 재시도 가능한 비동기 작업으로 만든다.
- 동일 원본·동일 변환 요청은 중복 처리하지 않는다.

### 3단계 — UI 연결

- 공통 `ResponsiveImage` 컴포넌트를 만든다.
- Home, Discover, Films, Series, Entertainment, Watch, School, Profile 순으로 교체한다.
- blur placeholder를 즉시 표시하고 준비된 파생 이미지로 자연스럽게 교체한다.

### 4단계 — 기존 데이터 마이그레이션

- Firebase/Firestore의 기존 `thumbnailUrl`, `avatarUrl`, 배너 이미지를 목록화한다.
- 백필 작업으로 파생 이미지를 만들되 원본 필드는 호환 기간 동안 유지한다.
- 모든 화면 전환 후 더 이상 사용하지 않는 원본 공개 URL 참조를 제거한다.

### 5단계 — 모니터링과 완료 기준

- 모바일 p75 LCP 2.5초 이하.
- 첫 화면 히어로 전송량은 일반적으로 250KB 이하.
- 카드 이미지는 일반적으로 150KB 이하.
- 깨진 이미지 비율 0.1% 미만.
- 동일 이미지 재방문 시 CDN cache hit 확인.
- 느린 네트워크에서도 빈 색상 박스 대신 placeholder가 즉시 표시됨.

## 구현 시 지켜야 할 원칙

- 원본 화질을 낮추거나 삭제해서 성능을 해결하지 않는다.
- 영상 전체 파일을 썸네일보다 먼저 내려받지 않는다.
- 로그인할 때마다 이미지 캐시를 삭제하지 않는다.
- 개인화 데이터와 공개 이미지 캐시는 분리한다.
- 이미지 URL 또는 자산 버전이 바뀐 경우에만 장기 캐시를 무효화한다.
- 로컬에서 빠른 것만 확인하지 말고, 새 계정·시크릿 모드·CDN cold cache 조건을 함께 측정한다.

## 다음 작업 시작 문구

다음 세션에서 아래 요청으로 바로 이어갈 수 있다.

> `docs/image-delivery-roadmap.md`의 1–3단계를 구현해 줘. 현재 Firebase Storage와 Cloudflare Stream 구성을 보존하고, 공급자 비용 비교 후 이미지 업로드 자동 변환 파이프라인과 ResponsiveImage 컴포넌트까지 적용해 줘.

