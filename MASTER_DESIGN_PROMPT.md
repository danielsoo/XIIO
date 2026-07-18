# XIIO — Master Design & Build Prompt

This document is written so a developer or AI coding agent with zero prior context can design and build XIIO end-to-end, matching the reference implementation in this handoff package (`XIIO Redesign.dc.html`, `/screenshots`, `FULL_SPEC.md`). Read top to bottom in order.

---

## 0. What XIIO is

XIIO is a premium streaming + professional networking platform for the film/TV industry — "Netflix + LinkedIn for filmmakers." Every person (director, actor, writer, editor, cinematographer, producer, crew) has a verifiable portfolio built from real credits on real uploaded work. It is not a social media app: no likes/emoji reactions as a core mechanic, no infinite-scroll feed addiction patterns, no algorithmic engagement bait.

**Feeling to achieve:** cinematic, premium, minimal, luxurious, modern, professional. Think Apple TV+, A24, MUBI, Criterion Channel, Letterboxd, LinkedIn Premium, IMDb. Never YouTube/TikTok/Instagram/generic SaaS.

---

## 1. Design system foundations

**Color**
- Base background: near-black `#08080a` / `#0b0b0d` (app shell), card surface `#0d0d10` / `#16161a`
- Text: off-white `#f5f4f2` at 100/85/60/50/40% opacity for hierarchy (never pure white, never gray-500 SaaS gray)
- Accent: warm gold `#C9A15A` / `#e3c483` used sparingly — badges, active ranking states, admin-only labels, prestige moments (University Rankings). Do not tint every button gold.
- Hairline borders: `rgba(255,255,255,0.06–0.12)` — never a heavy 1px gray SaaS border
- No blue-purple gradients, no glassy neon, no rounded-card-with-left-accent-bar SaaS trope

**Typography**
- Headlines/editorial: elegant serif (Playfair Display or similar) — used for hero titles, section headers on editorial pages (Discover, Watch synopsis titles)
- UI/body/labels: clean grotesk sans (Inter) — nav, buttons, metadata, forms, tables
- Never mix more than these two families. Minimum 24px for any hero-scale text, 12px floor for the smallest UI label.

**Spacing & layout**
- Sidebar fixed 220px, content area fluid with 40–48px horizontal padding
- Hero-to-content gap: consistent 44px across all catalog-style pages regardless of hero height
- Card grids: CSS grid with explicit `gap` (18–24px), never margin-spaced inline cards
- Corner radii: 8–14px for cards/panels, 100px (pill) for buttons and search bars — no mixed radius scales

**Motion**
- Card hover: `scale(1.03)` + soft shadow, 200ms ease-out
- Tab underline slides 200ms
- Dropdowns/modals: fade + 4px translateY, 150ms, close on click-away/Esc
- Route/tab transitions: 150ms crossfade only — no slides, no bounce, no spring
- Everything understated; motion should never call attention to itself

---

## 2. Information architecture (sidebar order — do not reorder)

Home → Discover → Films → Series → Entertainment → (divider) → Schools → Society → My List → (divider) → Messages → Upload → About XIIO, with Avatar/profile pinned bottom.

Top bar (persists across all logged-in screens): Search field (left, ~440px max width) · Notification bell · Avatar/profile menu (right).

---

## 3. Screen-by-screen prompts

Each block below is a self-contained prompt you can hand to a coding agent for that screen. Build the global Sidebar + Topbar shell once, then compose each screen inside it.

### 3.1 Landing Page (logged out, `/`)
"Design a cinematic marketing landing page for a film-industry streaming+portfolio platform. Full-bleed hero with a moody film-production photograph, serif headline making an emotional promise ('Your work deserves a permanent record'), two pill CTAs ('Enter XIIO'). Below: 2–3 editorial sections alternating text-left/image-right explaining (a) upload & build a verifiable portfolio, (b) university program & rankings, (c) discover other creators. Nav bar transparent-over-hero, solid on scroll. Dark background throughout, gold used only as a single accent word or underline, never as a background."

### 3.2 Home (`/home`)
"Build the signed-in home feed. Hero: one large featured work (16:9 photo, gradient scrim left, serif title, metadata line 'Drama · 2026 · 18 min · USA', Play + Add-to-List buttons) — NOT full width; leave room on the right for a floating 9:16 vertical Stories rail (auto-playing muted video-style cards, story-progress bars at top, horizontal swipe, slight scale-up on the focused card) that showcases unrelated short promos — hero and stories must be independent content. Below the hero at a fixed 44px gap: horizontal rails — 'New to the Surface', 'Continue Watching' (with resume progress bars), 'Recommended for You'. Cards use consistent hover-lift."

### 3.3 Discover (`/discover`)
"Design an editorial discovery page that feels like a film magazine, not a Netflix homepage. Hero celebrates filmmaking itself (a production/camera/set photograph), no single film promoted. 5–6 curated sections only (this is an early-stage platform — do NOT invent Awards/Festivals/Top-100/Rankings sections): Featured Promos, New This Week, Trending, Featured Creator spotlight (large single-creator editorial block, not a card), Schools Spotlight, Continue Watching. Generous whitespace, large photography, minimal chrome."

### 3.4 Films (`/catalog?tab=films`)
"Design the Films destination to feel like walking into a premium cinema. Large cinematic hero banner for a featured film. Sections: Featured Films, Festival Selections, Critics' Picks, then a dense browsing grid. Bigger imagery and more dramatic framing than Discover/Series — this page is about immersive movie browsing."

### 3.5 Series (`/catalog?tab=series`)
"Design the Series destination around continuation and bingeing. Sections: Continue Watching (episode-level cards showing episode thumbnail, progress bar, remaining time, resume-on-hover), New Episodes This Week, Binge-Worthy Collections, full series grid. Feel like a premium streaming app, distinct from Films' cinema framing."

### 3.6 Entertainment (`/catalog?tab=entertainment`)
"Lighter, faster-browsing grid for shorter-form creator content (reels, behind-the-scenes, shorts). Same dark shell, smaller card aspect, denser grid than Films/Series."

### 3.7 Watch Page (`/watch/[id]`)
"Hero occupies nearly the full first viewport: real photographic still, title (serif), metadata line, short synopsis, Play + Add-to-List buttons, dark gradient scrim only (never an illustrated/abstract placeholder). Below, four tabs — Overview, Details, Credits, Reviews — each showing ONLY its own content, no duplication across tabs:
- Overview: full synopsis + Behind the Scenes + Production Stills + Production Journal + More Like This + From This Creator
- Details: runtime, genre, language, release date, filming location, aspect ratio as a clean info-grid
- Credits: every contributor (Director, Producer, Writer, Cinematographer, Editor, Sound Designer, Colorist, Composer, Actors...) each linking to their XIIO profile — this is the most important section on the page; give it real visual weight, not an afterthought list
- Reviews: viewer reviews/ratings
If it's a series episode, add a season/episode browser (season selector, episode list, live-updating episode-detail preview) above Cast & Crew."

### 3.8 Creator Profile (`/creators/[id]`)
"Editorial profile page: avatar, name, role/title, school badge, Follow/Message actions, stat row. Below: Filmography grid (their credited works), Portfolio preview, About. This should read like a premium LinkedIn/IMDb combined page, not a social profile."

### 3.9 Portfolio (`/portfolio/[id]`)
"A curated case-study grid of the creator's work, each project showing their specific role/credit, expandable to reveal full crew list per project. This is the 'resume' surface — treat it with the same weight as a design portfolio site."

### 3.10 Upload Studio (`/upload`)
"Clean multi-step upload flow: drag-and-drop video zone, metadata form (title, synopsis, genre), cast/crew tagging with autocomplete linking to real XIIO profiles, school tag, visibility setting, Publish/Save Draft. Feel like a professional production tool, not a consumer uploader."

### 3.11 Search (`/search`)
"Single search field, debounced, results grouped by type (Films, Series, Creators, Schools) as the user types. Minimal, fast, editorial result rows — not card-heavy."

### 3.12 Notifications (`/notifications`)
"Chronological, grouped-by-day list. Each notification deep-links to its target (a watch page, a profile, a message thread). Mark-all-read control."

### 3.13 Messages (`/messages`)
"Four-tab inbox: Direct Messages, Groups, Requests, Business Invites. Conversation pane on the right for Direct/Groups (thread list left, messages right, reactions on hover, reply-in-thread). Requests tab shows Accept/Decline rows. Business Invites tab shows gated invite cards with attached brief and Accept/Decline/View Details — this is where studios/productions reach out, keep it distinctly more formal than casual DMs."

### 3.14 Business Invitations (within Messages → Invites)
"Each invite card: sender company/studio, role offered, attached document preview, clear Accept/Decline, confirmation modal on Accept."

### 3.15 University Pages (`/schools/[id]`)
"School profile: banner/crest, stats (students, works produced, ranking position), student roster grid linking to profiles, notable works grid, ranking history."

### 3.16 University Rankings (`/schools`)
"This is XIIO's signature prestige moment — 'The Oscars meets the World Cup' for film schools. Cinematic hero banner (film-strip motifs, projector-light beams converging, photographic — not flat illustration), gold accent used deliberately here. Podium for top 3, then a full ranked list below. Every element should feel like an honor, not a leaderboard grind — no aggressive gamification, no red/green up-down arrows."

### 3.17 User Settings (`/settings`)
"Left section nav (Account, Profile, Notifications, Privacy, Billing), right panel content switches without reload. Standard form patterns, but keep the same dark/serif+sans/gold-accent system — never default to a generic light SaaS settings look."

### 3.18 Admin Dashboard (`/admin`, restricted)
"Metrics overview, content moderation queue (Approve/Reject), user management table. Only reachable via the profile menu for admin roles; still visually consistent with the rest of XIIO — resist the urge to make this look like a bare internal tool."

---

## 4. Build order recommendation
1. Global shell (Sidebar + Topbar + routing shell) with design tokens (colors, type scale, spacing, radii) as CSS variables/Tailwind config
2. Home, Discover, Films/Series/Entertainment (shared card/rail primitives)
3. Watch Page (Credits component is reusable — profile-linked contributor row)
4. Creator Profile + Portfolio (share the contributor-row and work-card primitives)
5. Messages + Business Invitations
6. Schools + University Rankings
7. Search, Notifications, Settings
8. Admin Dashboard last (lowest visual risk, most standard patterns)

Cross-reference every screen against its screenshot in `/screenshots` and the click-event map in `FULL_SPEC.md` before considering it done.
