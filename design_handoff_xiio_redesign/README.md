# Handoff: XIIO Redesign — Visual/UX Refresh

## Overview
This package hands off the redesigned XIIO UI (premium film/TV streaming + professional network) so it can be implemented **inside the existing XIIO Next.js codebase**, not a new project. The redesign is a visual and layout evolution of the current product — same information architecture, navigation, and functionality — with elevated typography, spacing, color, and component polish, inspired by Apple TV+, A24, Letterboxd, and LinkedIn Premium.

## About the Design Files
The bundled `XIIO Redesign.dc.html` is a **design reference built in HTML** — an interactive prototype used to iterate on look, layout, and behavior. It is NOT production code and should not be copied in directly. The task is to **recreate this design inside the existing Next.js app**, reusing current React components, routing (App Router pages under `src/app`), data-fetching logic, and business logic wherever they already exist — only updating markup/styling to match the new visual language.

**Critical constraint from the product owner:** Reuse existing components, routing, icons, and functionality wherever possible. Only update UI/layout. Do not replace existing logic unless absolutely necessary.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component states in the HTML file are final — implement them pixel-close using the codebase's existing styling system (Tailwind, per `className` usage seen in `AppSidebar.tsx` etc.). Copy still needs review with product, but layout/visual values are intended as source of truth.

## Design Tokens

**Colors**
- Background (app shell): `#0b0b0d`
- Sidebar background: `#0d0d10`
- Card / panel background: `#111114` / `#16161a` (modals)
- Text primary: `#f5f4f2`
- Text secondary: `rgba(245,244,242,0.5–0.7)` (varies by hierarchy)
- Text tertiary/faint: `rgba(245,244,242,0.35–0.45)`
- Accent (links, tags, active indicators, progress bars): `#3D7DFF` (blue — replaces the earlier gold accent per product decision)
- Gold (reserved for Films "Now Showing" tag, Business Invite gating pill): `#e3c483` / `rgba(201,161,90,*)`
- Borders/dividers: `rgba(255,255,255,0.06–0.1)`
- Success: `#7fd99a`; Destructive: `#ff8080`

**Typography**
- Display/headline serif: **Playfair Display** (500/600/700, italic 500 for quotes) — used for all H1/H2 titles, film/series titles, creator names, pull quotes.
- UI/body sans: **Inter** (400/500/600/700/800) — everything else (nav, body copy, buttons, metadata).
- Scale: hero H1 44–80px, section H2 19–32px, body 13–16px, micro-label 11–13px (uppercase, letter-spacing 0.1–0.18em, used as eyebrow/kicker text).

**Spacing/Layout**
- Sidebar width: 220px fixed, icons 18px, nav item padding 12px vertical.
- Content max-width: 1400px, centered.
- Standard hero height (Home/Discover/Films): 560px.
- Standard gap between hero and first content section: 44px top padding.
- Card radius: 12–16px; pill buttons/badges: 100px (full round).

**Active nav-item state (important interaction detail):** selected sidebar item is NOT a full pill — it has `padding: 12px 0 12px 16px`, `border-radius: 8px 0 0 8px` (rounded left corners only, flush against the right edge), with `background: rgba(255,255,255,0.08)`. This "slide/indent" effect must be preserved exactly as it exists in the current codebase's `AppSidebar.tsx` (`pl-4 pr-0 rounded-l-lg rounded-r-none`) — do not replace with a centered pill.

## Mapping to Existing Codebase (reuse, do not rebuild)

| Redesign screen | Existing route/component to update in place |
|---|---|
| Sidebar nav | `src/components/layout/AppSidebar.tsx` + `AppNavIcon.tsx` + `src/lib/appNav.ts` — reuse icons, hrefs, active-state logic, auth-gating, unread badge (`useDmUnreadCount`). Only update Tailwind classes for spacing/color per tokens above. |
| Home | `src/app/page.tsx` + `src/components/home/*`, `src/components/hero/*` |
| Discover | `src/app/discover/*` |
| Films | `src/app/movies/*` |
| Series | `src/app/series/*` |
| Entertainment | `src/app/entertainment/*` |
| Watch page | `src/app/watch/*`, `src/components/watch/*`, `PlaybackVideo.tsx` |
| Creator profile / Portfolio | `src/app/profiles/*`, `src/app/p/*`, `src/components/profile/*` |
| Upload Studio | `src/app/uploader/*`, `src/components/uploader/*` |
| Search | existing search route/component (see `src/app`) |
| Notifications | `src/app/notifications/*`, `src/components/notifications/*` |
| Messages (Messages/Groups/Requests/Invites tabs, reply, reactions, room leave, business invites) | `src/components/messages/*` — `DmSidebar.tsx`, `DmInboxTabs.tsx`, `DmConversationPane.tsx`, `RoomConversationPane.tsx`, `MessageActionsToolbar.tsx`, `BusinessInviteCard.tsx`, `BusinessInviteList.tsx`, `BusinessInviteComposerModal.tsx` — **all existing messaging logic (send/receive, reactions, replies, room membership, invite accept/decline/expand) must be preserved; only restyle.** |
| Business Invitations | `src/lib/business-invites/*` + `BusinessInviteCard.tsx` etc. (see above) |
| University Pages / Rankings | `src/app/schools/*`, `src/app/school/*`, `src/components/school/*`, `src/lib/school-brand.ts`, `src/lib/mockupCampusSpec.ts` |
| Society (professional network) | `src/app/society/*`, `src/components/society/*`, `src/lib/societyMockData.ts`, `societyTypes.ts` |
| User Settings | `src/app/settings/*`, `src/components/settings/*` |
| Admin Dashboard | `src/app/admin/*`, `src/components/admin/*` |

## Screens — Key Layout Notes

### Sidebar (global, persistent)
Fixed left rail, 220px, logo top (height 17px), primary nav (Home, Series, Films, Schools, Society, Messages w/ unread badge, My List), divider, secondary nav (Upload, About XIIO), profile row pinned to bottom with avatar + name + "View profile". Active item uses the indent/slide style described in tokens above — reuse exactly from current `AppSidebar.tsx`, just apply new color/spacing values.

### Home
Split hero: left column (max 380px / 50%) has eyebrow label, Playfair H1, synopsis, metadata line, Play + My List buttons, over a photographic background with left-to-right dark gradient scrim. A floating "Stories" panel (9:16 vertical cards, story-style progress bars, autoplay muted, horizontal swipe, scale-up on hover) sits to the right, independent content from the hero film — do not conflate the two data sources. Below: Continue Watching, Trending, Featured Creator, etc. — see file for exact section order.

### Discover
Editorial tone — hero celebrates filmmaking itself (not one title). ~5–6 sections: Featured Promos, New This Week, Trending, Featured Creator, Schools Spotlight, Continue Watching. No awards/rankings/festival sections (not enough content yet per product decision).

### Films
Cinema-experience framing — large 16:9 hero ("Now Showing" gold eyebrow), Critics' Picks with pull-quotes in italic Playfair, festival/awards-style rows kept minimal.

### Series
Season/episode-first browsing — Continue Watching row with per-episode progress bars, dedicated Episode Panel (season selector + episode list + live preview pane that updates on selection without navigation), Behind the Scenes, Cast & Crew grid (every contributor links to profile), Series Information panel, More Like This.

### Film/Series Detail (Watch-adjacent detail page)
Full-bleed 16:9 hero with title/metadata/synopsis/Play/Add-to-List. Below: tabs — **Overview** (synopsis + Behind the Scenes + Production Stills + Production Journal, nothing else duplicates this), **Details** (runtime/genre/language/release date/filming location/aspect ratio only), **Credits** (every contributor, photo + name + role, links to their XIIO profile — treat this as core, not an afterthought), **Reviews** (ratings + comments only). Below tabs: More Like This, From the Same Creator, Continue Watching.

### Messages
4 tabs: Messages, Groups, Requests, Invites. Messages tab has search + horizontal avatar shortcuts. Conversation view supports: reply-to quote banner, per-message reaction picker (emoji row), copy/delete menu, mine vs. their message bubble alignment/color. Group/Room view adds member avatar stack + "Leave Room". Invites tab = Business Invitations: offer vs. application badge, pending/accepted states, attachment chip, expandable portfolio preview, Accept/Decline or "Go to Chat" once accepted. **All of this must be wired to the existing messaging/business-invite logic already in the codebase — the redesign only changes the UI shell.**

## Assets
- Font: Google Fonts — Playfair Display, Inter (already linked via `<link>` in the prototype; codebase likely already self-hosts or links these — confirm and reuse existing font-loading strategy, e.g. `next/font`).
- Photography: placeholder cinematic images (`assets/hero_lighthouse.png`, `assets/film_hero.png`, `assets/discover_hero.png`, etc.) generated for prototyping only — replace with real production photography/CMS-driven images in the final build.
- Logo: `assets/xiio_logo_small.png` — confirm against the codebase's existing `XiioWordmark` component/asset before swapping.

## Screenshots
Desktop-viewport captures (no distinct mobile mockups in this pass — flag with product if responsive layouts are needed before build). Organized by route/component:

| Folder | File(s) | Shows |
|---|---|---|
| `screenshots/Landing/` | `landing.png` | Marketing landing page (logged-out) |
| `screenshots/Home/` | `home.png` | Home hero + floating Stories panel + rows below |
| `screenshots/Discover/` | `discover.png` | Editorial Discover page |
| `screenshots/Films/` | `films.png` | Films catalog (cinema framing, Critics' Picks) |
| `screenshots/Series/` | `series.png` | Series catalog (Continue Watching, progress bars) |
| `screenshots/Entertainment/` | `entertainment.png` | Entertainment catalog |
| `screenshots/Watch-Film/` | `watch-hero.png`, `tab-overview.png`, `tab-details.png`, `tab-credits.png`, `tab-reviews.png` | Film detail hero + all 4 tab **states** |
| `screenshots/Creator-Profile/` | `profile.png` | Creator/portfolio-holder public profile |
| `screenshots/Portfolio/` | `portfolio.png` | Shareable portfolio case-study view |
| `screenshots/Search/` | `search.png` | Global search results (active query state) |
| `screenshots/Notifications/` | `notifications-dropdown.png` | Notification bell **dropdown open state** |
| `screenshots/Messages/` | `tab-messages.png`, `tab-groups.png` (member stack + Leave Room), `tab-requests.png` (Accept/Decline), `tab-invites.png`, `invite-expanded.png` (expanded portfolio preview **interaction state**) | Messaging shell, all 4 tabs + key interaction states |
| `screenshots/University-Rankings/` | `rankings.png` | Schools/Rankings hero + podium (gold/silver/bronze) |
| `screenshots/University-Page/` | `university.png` | Individual university page |
| `screenshots/Settings/` | `settings.png` | User settings |
| `screenshots/Admin-Dashboard/` | `admin.png` | Admin console overview |

Also visible in these captures: the profile-menu dropdown (My Profile / Portfolio / Settings / Admin Dashboard / Log Out) and the sidebar's active-item indent/slide selected state (visible in every screenshot's left nav).

## Files
- `XIIO Redesign.dc.html` — full interactive design reference, all screens (single-file prototype; view in any browser).
- `screenshots/` — the visual references described above, organized by screen.
