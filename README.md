# 링커 — linnn.kr

**빠르고, 덜 짜치는 짧은 링크.**

링커는 보기 좋은 짧은 링크를 빠르게 만드는 한국형 URL 단축 서비스입니다.

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel |

---

## 로컬 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열고 아래 값들을 채워주세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANON_TOKEN_SECRET=change-this-to-a-random-secret-min-32chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/migrations/001_initial.sql` 전체를 실행
3. `supabase/seed.sql`을 실행하여 예약 슬러그 시드 데이터 삽입
4. **Authentication → URL Configuration**에서:
   - Site URL: `https://linnn.kr` (로컬: `http://localhost:3000`)
   - Redirect URLs에 `https://linnn.kr/auth/callback` 추가

### 4. 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000

---

## 환경 변수 목록

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (서버 전용) |
| `ANON_TOKEN_SECRET` | ✅ | 익명 세션 토큰 서명용 시크릿 (32자 이상 랜덤 문자열) |
| `NEXT_PUBLIC_APP_URL` | ✅ | 서비스 도메인 (e.g. `https://linnn.kr`) |

---

## DB 스키마 요약

### `profiles`
사용자 계정 정보. `auth.users`에 1:1 연결.
- `plan`: `free` | `pro` (익명은 profiles 행 없음)

### `links`
생성된 모든 단축 링크.
- `user_id`: nullable (비로그인 생성 시 null)
- `slug`: 유니크, URL에 사용되는 짧은 식별자
- `mode`: `quick` | `recommend` | `custom`
- `click_count`: 클릭 수 (증분 업데이트)

### `link_click_events`
링크별 클릭 이벤트 경량 로그.
- referrer, country_code 저장 (optional)

### `anon_usage`
익명 사용자 일별 사용량 및 어뷰즈 점수.
- `anon_token_hash` + `day_bucket`으로 유니크
- `abuse_score`: 0~100, 높을수록 의심

### `audit_events`
생성 시도의 감사 로그.
- 성공/차단/레이트리밋 이벤트 기록

### `reserved_slugs`
시스템 예약 슬러그 목록.

---

## 익명 사용 쿼터 동작 방식

비로그인 사용자는 **하루 5회** 단축 링크를 생성할 수 있습니다.

### 레이어 구조

| 레이어 | 방식 |
|--------|------|
| L1 | HMAC-SHA256 서명 토큰 쿠키 (`anon_token` + `anon_sig`) |
| L2 | localStorage 보조 ID (`linker_local_id`) |
| L3 | 브라우저 소프트 핑거프린트 해시 |
| L4 | IP 해시 기반 레이트 리밋 |
| L5 | 어뷰즈 점수 시스템 (0~100) |
| L6 | 버스트 쿨다운 (1분당 3회, 1분당 슬러그 체크 10회) |
| L7 | CAPTCHA 에스컬레이션 (placeholder, 미구현) |
| L8 | 쿼터 소진 시 로그인 유도 |
| L9 | 감사 로그 (`audit_events`) |
| L10 | 예약 슬러그/금지어 필터 |

- 토큰은 raw 값 저장 없이 **해시만 DB에 저장** (프라이버시)
- IP도 해시화 후 저장, 원본 미보관

---

## 플레이스홀더 (향후 구현 필요)

| 기능 | 상태 |
|------|------|
| 결제 (Stripe/TossPayments) | 미구현 — Pro 플랜 UI만 존재 |
| CAPTCHA (hCaptcha/Cloudflare Turnstile) | 미구현 — 에스컬레이션 로직 placeholder |
| 이메일 인증 흐름 | Supabase 기본 제공 (커스터마이징 필요) |
| 만료 링크 자동 정리 | DB cron job 또는 Supabase pg_cron 설정 필요 |
| 고급 클릭 분석 | `link_click_events` 테이블 준비됨, UI 미구현 |
| 커스텀 도메인 | 미구현 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx               # 루트 레이아웃 + 메타데이터
│   ├── page.tsx                 # 홈페이지
│   ├── globals.css
│   ├── not-found.tsx
│   ├── [slug]/route.ts          # 리다이렉트 핸들러 (핵심)
│   ├── auth/callback/route.ts   # Supabase OAuth 콜백
│   ├── dashboard/
│   │   ├── page.tsx             # 서버 컴포넌트 (데이터 페치)
│   │   └── DashboardClient.tsx  # 클라이언트 인터랙션
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── pricing/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   └── api/
│       ├── links/
│       │   ├── route.ts          # POST (생성), GET (목록)
│       │   ├── [id]/route.ts     # PATCH, DELETE
│       │   └── recommend/route.ts # POST (추천 슬러그 목록)
│       ├── slugs/check/route.ts  # GET (가용성 확인)
│       └── anon/init/route.ts    # GET (익명 세션 초기화)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── home/
│       ├── LinkCreator.tsx       # 메인 링크 생성 폼 (3가지 모드)
│       ├── TrustStrip.tsx
│       ├── HowItWorks.tsx
│       ├── PricingPreview.tsx
│       └── LoginCta.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # 브라우저용 Supabase 클라이언트
│   │   └── server.ts            # 서버용 클라이언트 + service role
│   ├── url/normalizer.ts        # URL 정규화 및 파싱
│   ├── slug/
│   │   ├── generator.ts         # 빠르게/추천 슬러그 생성
│   │   ├── validator.ts         # 슬러그 유효성 검사
│   │   ├── reserved.ts          # 예약어/금지어 목록
│   │   └── words.ts             # 폴백 단어 라이브러리
│   └── anon/
│       ├── session.ts           # 토큰 생성/서명/해시
│       ├── fingerprint.ts       # 소프트 핑거프린트
│       └── quota.ts             # 쿼터 확인 및 어뷰즈 로깅
├── middleware.ts                 # 보호 라우트 + Auth 세션 갱신
└── types/index.ts               # 공유 TypeScript 타입

supabase/
├── migrations/001_initial.sql   # 전체 스키마
└── seed.sql                     # 예약 슬러그 시드
```

---

## Vercel 배포

1. 이 레포를 GitHub에 푸시
2. [vercel.com](https://vercel.com)에서 프로젝트 import
3. Environment Variables에 `.env.example`의 값들 입력
4. Deploy

커스텀 도메인 `linnn.kr` 연결 후 Supabase Site URL도 업데이트 필요.

---

## 향후 개선 제안

- **결제 통합**: TossPayments 또는 Stripe로 Pro 플랜 구현
- **CAPTCHA**: Cloudflare Turnstile (무료, 프라이버시 친화적) 통합
- **클릭 분석**: `link_click_events` 기반 대시보드 그래프 추가
- **만료 링크 정리**: Supabase pg_cron으로 오래된 익명 링크 자동 삭제
- **Vercel Edge**: `[slug]/route.ts`를 Edge Runtime으로 이전해 리다이렉트 지연 최소화
- **OG 이미지**: 링크 미리보기 페이지 (선택적)
