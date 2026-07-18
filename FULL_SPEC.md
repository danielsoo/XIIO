# XIIO — Full Page & Click-Event Spec (for Claude Code implementation)

Use this alongside `README.md` and `/screenshots`. Every item below maps to real handlers already named in `XIIO Redesign.dc.html` — reuse those names as your function/route names in the Next.js app.

---

## Global Shell (present on every logged-in screen)

**Sidebar (220px, fixed left)**
- Logo → `goHome()`: navigate to `/` (Home)
- Home icon → `goHome()`
- Discover icon → `goDiscover()`
- Films icon → `setFilms()`: navigate to `/catalog?tab=films`
- Series icon → `setSeries()`: `/catalog?tab=series`
- Entertainment icon → `setEntertainment()`: `/catalog?tab=entertainment`
- Schools icon → `goSchools()`: `/schools` (University Rankings)
- Society icon → `goSociety()`: `/society`
- My List icon → `goMyList()`: `/my-list`
- Messages icon → `goMessages()`: `/messages`; shows unread-count badge when `unreadCount > 0`
- Upload icon → `goUpload()`: `/upload`
- About XIIO → `goAbout()`: `/about`
- Avatar (bottom) → `openMyProfile()`: `/creators/[myId]`
- Active item: filled background, icon fill/active variant, left accent notch. Inactive: 50% opacity stroke icon, hover raises to 80% opacity with 150ms ease.

**Topbar**
- Search bar click → `goSearch()`: `/search`, autofocus input
- Bell icon → `toggleNotif()`: opens Notifications dropdown panel (fixed width ~340px, right-aligned under bell); "View all notifications" row → `goNotifications()`: `/notifications`
- Avatar → `toggleProfileMenu()`: opens dropdown → My Profile (`openMyProfile`), Portfolio (`goPortfolioSelf` → `/portfolio/[myId]`), Settings (`goSettings` → `/settings`), Admin Dashboard (`goAdmin` → `/admin`, only if `isAdminUser`), Log Out (`logout` → clear session, `/`)
- Clicking outside either dropdown closes it (standard click-away).

---

## 1. Landing Page (`/`, logged out)
- Nav "For Studios & Productions" / "University Program" → anchor scroll to matching section
- "Enter XIIO" (nav + hero, 2 CTAs) → `enterApp()`: routes to `/login` or `/home` if session exists
- Scroll-triggered fade-up on each section entering viewport (IntersectionObserver, 400ms ease-out, 20px translate)

## 2. Home (`/home`)
- Hero "▶ Play" → `openHeroWork()`: `/watch/[heroWorkId]`
- Hero "+ My List" → `goMyList()` (adds to list optimistically, toast confirm)
- Stories rail: click a story tile → `story.onOpen`: opens full-screen story viewer overlay; story progress dots → `bar.onSelect` jumps to that slide; pause icon → `toggleStoryPause()` freezes autoplay/progress bar animation
- "New to the Surface" section header "View all" → `setFilms()`
- Each work card → `w.onOpen`: `/watch/[id]`; hover = scale(1.03) + shadow, 200ms
- Continue Watching cards show progress bar; resume button appears on hover → same `onOpen` handler, deep-links to saved timestamp

## 3. Discover (`/discover`)
- Editorial hero (filmmaking-celebration image, no CTA except scroll cue)
- Featured Promos rail, New This Week, Trending, Featured Creator spotlight (click → `openProfile(creatorId)`), Schools Spotlight (click → `goUniversity(schoolId)`), Continue Watching
- All cards: click → `onOpen` to Watch page; consistent hover lift

## 4. Films / Series / Entertainment (`/catalog?tab=…`)
- Tab switch via sidebar (`setFilms`/`setSeries`/`setEntertainment`) — no separate in-page tab bar; sidebar icon itself is the active-tab indicator
- **Films**: cinema-style hero, Featured Films rail, Festival Selections, Critics' Picks, full grid below
- **Series**: Continue Watching (episode-level cards w/ progress), New Episodes, Binge Collections, full grid
- **Entertainment**: reels/shorts oriented grid, lighter cards
- Card click → `onOpen`: `/watch/[id]`

## 5. Watch Page (`/watch/[id]`)
- Hero image/video (16:9), title, metadata line, synopsis, Play button (starts playback), Add to List (`goMyList`-style toggle)
- Tabs: Overview / Details / Credits / Reviews — click switches `activeTab` state, underline indicator slides (200ms) to selected tab
  - **Overview**: full synopsis + Behind the Scenes + Production Stills + Production Journal + More Like This + From Creator
  - **Details**: runtime, genre, language, release date, filming location, aspect ratio — info-grid only, no duplicated media
  - **Credits**: role-grouped contributor list; each row click → `openProfile(personId)`: `/creators/[id]`
  - **Reviews**: viewer review list, star/rating display, no input form unless logged-in user (post box at top)
- If `kind === "series"`: additional season/episode panel — season selector dropdown, episode list rows (click → `ep.onSelect`: updates episode-detail preview pane without navigation), Cast & Crew grid, Series Info panel, More Like This

## 6. Creator Profile (`/creators/[id]`)
- Header: avatar, name, role/title, school badge (click → `goUniversity(schoolId)`), Follow/Message buttons (`goMessages` prefilled thread), stats row
- Tabs or sections: Filmography (cards → `onOpen` to Watch), Portfolio preview (→ `goPortfolioSelf`/`openPortfolio(id)`), About
- "View Portfolio" button → `/portfolio/[id]`

## 7. Portfolio (`/portfolio/[id]`)
- Reel/showcase grid of works with role tags per project
- Expandable "credits" rows (`toggle expanded` state) reveal full crew list per project
- Each project thumbnail → `onOpen`: `/watch/[id]`

## 8. Upload Studio (`/upload`)
- Drag-and-drop zone (file input, accepts video)
- Metadata form: title, synopsis, genre, cast/crew tagging (autocomplete → links to existing profiles or creates placeholder), school tag, visibility toggle
- "Publish" button → submit, redirect to new Watch page; "Save Draft" → persists without publishing

## 9. Search (`/search`)
- Debounced input (300ms) filtering across films/series/creators/schools
- Result sections grouped by type; each result row → respective `onOpen`/`openProfile`/`goUniversity`
- Empty state and recent-searches list when input is blank

## 10. Notifications (`/notifications`)
- Full list version of the topbar dropdown; grouped by day
- Each row click → deep link to relevant target (watch page, profile, message thread)
- Mark-all-read action in header

## 11. Messages (`/messages`)
- Left rail: 4 tabs — Messages (direct), Groups, Requests, Business Invites — `messagesTab` state switch
- **Messages**: thread list → `th.onOpen`, conversation pane right, message input, reactions on hover, reply-in-thread
- **Groups**: member avatar stack, "Leave Room" (`leaveRoom()`)
- **Requests**: Accept/Decline buttons per row
- **Business Invites**: gated invite cards with attachment preview, Accept/Decline/View Details

## 12. Business Invitations (within Messages → Invites tab, or `/messages?tab=invites`)
- Card: sender studio/company, role offered, attached brief/doc, Accept → confirmation modal, Decline → removes with undo toast

## 13. University Pages (`/schools/[id]`)
- School hero (banner + crest/logo), stats (student count, works produced, ranking position)
- Student roster grid → `openProfile(id)`
- Notable works grid → `onOpen`
- Ranking trend/history module

## 14. University Rankings (`/schools`)
- Prestige hero banner (cinematic tidal-race / competition art)
- Podium (top 3) + full ranked list below, each row → `goUniversity(id)`
- Filter by category/region if applicable

## 15. User Settings (`/settings`)
- Section nav (Account, Profile, Notifications, Privacy, Billing) — click switches panel, no page reload
- Form fields save on blur or explicit "Save Changes" button per section
- Delete Account — destructive action behind confirm modal

## 16. Admin Dashboard (`/admin`, `isAdminUser` only)
- Metrics overview cards (users, uploads, reports)
- Content moderation queue — Approve/Reject per item
- User management table — role change, suspend actions
- Only reachable via profile-menu "Admin Dashboard" link, gated by role check server-side too

---

## Motion & interaction conventions (apply everywhere)
- Card hover: `transform: scale(1.03)` + soft shadow, 200ms ease-out
- Tab underline: slides to active tab, 200ms ease
- Dropdowns/modals: fade + 4px translateY-in, 150ms; click-away or Esc to close
- Route transitions: simple 150ms crossfade, no slide/bounce
- Progress bars (watch resume, stories): linear fill, no easing
