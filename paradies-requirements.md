# Paradies Frontend — Requirements Specification

## What is Paradies?

Paradies is a casting (roommate selection) management app for a WOKO student shared flat (WG) in Zurich. It serves two user groups:

1. **Residents (WG members)** — manage castings, evaluate applicants, track house admin (cleaning, birthdays, finances)
2. **Applicants** — apply for a room through a public form, track application status via magic link

---

## 1. Design Language

### 1.1 Philosophy: "Soft Bento + Editorial"

Two distinct visual modes:

- **Resident/admin pages (mobile-first):** "Soft Bento" — bento grid layouts, glassmorphism panels, compact information density, decorative ornamental details. One-hand mobile UX is the priority.
- **Applicant pages (desktop-first):** "Editorial" — large serif headlines, generous whitespace, magazine-like typography, clean forms. Applicants are typically on a laptop filling out the form.

### 1.2 Color Palette (OKLch)

All colors use OKLch color space. The palette is warm, artsy, editorial:

| Token | Description | Use |
|-------|-------------|-----|
| `--primary` | Turquoise/teal | Anchor — buttons, links, active states |
| `--skin` | Warm nude/beige | Soft backgrounds, keyword pills |
| `--rose` | Muted editorial red | Accents, review badges, keyword pills |
| `--blush` | Dusty pink | Gradient stops, keyword pills |
| `--navy` | Deep navy blue | Gradient dark anchors |
| `--periwinkle` | Soft blue-violet | Gradient stops, keyword pills |

Status colors: `--status-yes` (green), `--status-maybe` (yellow), `--status-no` (red), `--status-veto` (magenta), `--status-friend` (blue), `--status-not-woko` (muted).

Full dark mode support required.

### 1.3 Typography

- **Sans-serif (body):** Outfit Variable — all UI text, labels, buttons
- **Serif (display):** Playfair Display Variable — editorial headings, logo
- **`.editorial-heading`:** Playfair, italic, bold, tight spacing, 1.1 line-height
- **`.editorial-label`:** Outfit, 10px, semibold, 0.15em tracking, uppercase

### 1.4 Decorative Elements

- **Ornaments:** Reusable `✦` star, `·` dot, `→→→` arrows, `── ✦ ──` divider
- **Corner ornaments:** `✦` at small size + low opacity in card corners
- **Ornament dividers:** `── LABEL ──` pattern for section headers
- **Frame borders:** Double-frame effect (thin border + inset box-shadow)
- **Glassmorphism:** Frosted glass panels with backdrop-blur

### 1.5 Layout Utilities

- **Bento grid:** CSS Grid, single column on mobile, multi-column on desktop
- Cards use coordinated gradient backgrounds (not clashing)
- Rounded-3xl cards, rounded-xl list items
- All avatars are `rounded-full` (circular)

### 1.6 Date Format

European format throughout: `DD.MM.YYYY` (locale `de-CH`).

### 1.7 Icons

- Lucide React (primary icon set)
- Phosphor Icons (supplementary, used for duotone icons in the Finances card)

---

## 2. Authentication & Authorization

### 2.1 Resident Auth (full)

- Cookie-based sessions (`PARADIES_SESSION`)
- Login page: email + password
- Account setup via invite link (`/setup/:token`)
- `AuthProvider` context wrapping the app, `useAuth()` hook
- `RequireAuth` route guard on all `/admin/*` routes
- Header shows logged-in user's profile picture (not an "Admin" badge)
- Subletting residents may have restricted permissions (future)

### 2.2 Applicant Auth (magic links)

- On application submission, backend returns `{ applicationId, magicLinkToken }`
- Applicant receives a magic link to check status and withdraw
- `/status/:token` — shows application status, option to withdraw

### 2.3 Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /auth/login` | POST | Login (email, password) → AuthUser |
| `POST /auth/logout` | POST | Destroy session |
| `GET /auth/me` | GET | Current user from session |
| `GET /auth/invite/:token` | GET | Check invite validity → InviteInfo |
| `POST /auth/setup` | POST | Set password + profile pic from invite |
| `GET /magic-link/:token` | GET | Validate magic link → MagicLinkView |
| `PUT /magic-link/:token/withdraw` | PUT | Withdraw application via magic link |

---

## 3. Pages & Routes

### 3.1 Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/apply/:castingId` | ApplyPage | Eligibility questionnaire + application form |
| `/apply/:castingId/success/:applicationId` | SuccessPage | Post-submission confirmation |
| `/login` | LoginPage | Resident login |
| `/setup/:token` | SetupPage | Account setup from invite |
| `/status/:token` | MagicLinkPage | Applicant status check + withdraw |

### 3.2 Protected Routes (require auth)

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | AdminPage | Dashboard with bento grid widgets |
| `/admin/castings` | CastingsPage | All castings (active + archived) |
| `/admin/applications` | AllApplicationsPage | Review applications across castings |
| `/admin/casting/:castingId/applications` | ApplicationsPage | Applications for one casting |
| `/admin/casting/:castingId/application/:applicationId` | EvaluatePage | Full evaluation view |
| `/admin/cleaning` | CleaningPlanPage | Monthly cleaning duty assignment |
| `/admin/calendar` | WgCalendarPage | Shared WG calendar |
| `/admin/residents` | ResidentsPage | Resident management + semester cleaning |
| `/admin/castings/new` | NewCastingPage | Create a new casting |
| `/admin/castings/:castingId/manage` | CastingManagePage | Manage casting settings |

### 3.3 Catch-all

`*` → redirect to `/admin`

---

## 4. Admin Dashboard (`/admin`)

### 4.1 Layout

Bento grid layout, `max-w-2xl` centered. On mobile: single column, cards stack. On desktop: multi-column grid with cards of varying sizes.

### 4.2 Bento Cards (order top to bottom)

All bento cards are clickable and will expand downward for detailed interaction when tapped/clicked (expansion behavior TBD). Sub-items inside cards use glassy containers (`.glass-item`) with iridescent gradient borders (periwinkle → blush shimmer).

#### Cleaning Plan Card
- Cool blue-teal gradient background (dark card, white text)
- 4 cleaning types: **Wednesday**, **Sunday Kitchen**, **Sunday Living Room**, **Semester Cleaning**
- The first 3 types are assigned to a concrete roommate at the start of each month
- Display logic:
  - **The logged-in user's own upcoming cleanings** are displayed **large** (prominent glass-item)
  - **Next 2 other people's cleanings** are displayed smaller below
  - **Semester Cleaning** is always shown separately in a visually distinct style (dashed border, star icon, uppercase label)
- Count badge in header shows pending named duties (excludes semester)
- **"Mark as done" visibility rule:** The button is only shown when the current date is within the window `[dueDate − 1 day, dueDate + 2 days]` (inclusive). Outside this window the card still displays, but the action is hidden — prevents accidental early/late completions.

#### Castings Card
- Warm skin/blush gradient background (light card)
- Fetches from `GET /castings`, filters by `applicationPeriodActive`
- **Business rule:** Usually only 1 casting is active at a time. Exceptional situations where 2 castings run simultaneously can occur (e.g. two rooms become free in the same month). Because of this, the "Review Applications" button uses a **global link** (`/admin/applications`) rather than a per-casting link — residents can filter by casting on that page if needed.
- Each active casting in a `.glass-item-light` container showing:
  - Person's name, move-in date (with calendar icon)
  - Stats as pill badges: "X applied" (skin bg) + "X new" (rose bg, only if unevaluated > 0)
  - "Review →" button navigating to `/admin/casting/:id/applications`
- **Scrollable** (`max-h-72 overflow-y-auto`) — user can browse all castings without navigating away
- "New casting" button (TBD — triggers expansion)

#### Birthdays Card
- Warm rose/blush gradient background (dark card, white text)
- Always shows **next 3 upcoming birthdays** in glass-item containers
- Each birthday: initial avatar / profile picture (after it's set), name, date (DD.MM), room number, days-until badge
- Fetches from `GET /residents/upcoming-birthdays`, falls back to mock data

#### WG Finances Card (Further discussion needed)
- Navy/periwinkle gradient background (dark card, white text)
- Balance summary: CHF amount + monthly in/out as trend pill badges (green/red)
- Categories in a 2-column grid: Common Meals, Trips, Household Upgrades, LeShop, Savings, Cats
- Each category: Phosphor duotone icon + label + amount
- *Backend: not yet implemented — currently uses mock data. Next step: Transaction entity + ZKB API integration*
- **⚠ ON HOLD:** Feature is controversial — not disin played on the dashboard until the WG decides whether to proceed.

### 4.3 Cleaning Plan Page (`/admin/cleaning`)

Separate page for monthly cleaning duty assignment and tracking.

#### 4.3.1 Assignment

- Month selector (chevron navigation) to pick the target month/year
- Shows all cleaning slots for that month: every Wednesday (1 slot) and every Sunday (2 slots: Kitchen, Living Room)
- Each slot has a dropdown to assign a resident
- **Auto-assign button:** calls `GET /cleaning-duties/generate?year=X&month=Y` to get a proposed plan. The algorithm gives equal shares to all residents, only scheduling them on dates they're available (not marked absent on the WG Calendar). Residents who have uncompleted past duties (last 3 months) are penalized — the algorithm assigns them more duties to compensate.
- Already-persisted assignments are marked with a ✦ ornament and a tinted background
- **Save button** persists only new/changed assignments via `POST /cleaning-duties`
- Semester Cleaning is managed separately (see Resident Management, §4.5)

#### 4.3.2 Completion Status in the Plan

Completed and overdue duties remain visible in the plan view — they are never hidden:

- **Completed (green):** Green background, checkmark icon, resident name, "Done" label. The dropdown is locked (no re-assigning a completed duty).
- **Overdue / Missed (red):** If a duty's due date has passed (with 1 day grace period) and it's still not completed, it shows in red with a warning triangle icon. The dropdown remains editable so the duty can be reassigned if needed.
- **Pending (default):** Normal styling for future duties.

Legend at the top: `✦ Saved` / `✓ Done` / `⚠ Missed`

#### 4.3.3 Mark as Done (Homepage Card)

On the Cleaning Plan bento card (homepage):

- **"Mark as done" button** is only shown when `today ∈ [dueDate − 1, dueDate + 2]`
- Completing a duty triggers a **fullscreen celebration overlay**: blurred teal backdrop, animated pixel cat GIF (`cat-walk.gif`), floating sparkle particles, "Purrfect!" headline, auto-dismisses after ~3 seconds
- After the celebration, the duty moves to the "Recently done" section (not removed from the card)

#### 4.3.4 Recently Completed Section (Homepage Card)

- Shows duties completed in the last 7 days at the top of the Cleaning Plan card
- Light green tinted container with a **shine sweep animation** (diagonal light streak loops across)
- Each row shows:
  - Animated pixel cat GIF (`cat-rest.gif`, pixelated rendering) — a visual thank-you
  - Resident name, area, date, "Thank you!" label in green
- **"Not done" button (undo):** For other residents' completed duties, a circular undo button allows marking the duty as not actually done. This calls `PUT /cleaning-duties/:id/uncomplete`.
  - Uncompleting a duty moves it back to the pending section
  - Uncompleted duties from the past 3 months are factored into the auto-assign algorithm as a penalty — that resident gets more duties next month

### 4.5 Resident Management Page (`/admin/residents`)

Page for managing WG members and semester cleaning dates. Accessible via the **WG** tab in the bottom navigation bar.

#### 4.5.1 Resident CRUD

- List of all residents sorted by room number, each as a card showing: initial avatar (hash-based color), name, room number, age, birthday, email
- **Add resident:** form with name, birthday (custom date picker), room number, email
- **Edit resident:** inline form replacing the card, calls `PUT /residents/:id`
- **Delete resident:** two-step confirmation (click trash → "Confirm" appears)

#### 4.5.2 Semester Cleaning Dates

Below the resident list, a "Semester Cleaning" section:
- Shows all scheduled semester cleaning dates with completion progress (X/Y residents done)
- **Add date:** picking a date creates a cleaning duty for every resident on that date (area: "Semester Cleaning")
- Fully completed dates show a green "DONE" badge

#### 4.5.3 Ämtli

Below semester cleaning, an "Ämtli ✦" section listing all permanent household responsibilities.

**Concept:** Ämtli are named, ongoing duties permanently assigned to one or more residents until manually reassigned. They are not date-bound or completion-tracked — they are simply "who is responsible for what." This is distinct from CleaningDuty (rotating, dated, completable) and deserves its own backend entity.

**Known Ämtli (production-seeded on first run, list is then user-managed):**
- Compost (2 people)
- Cat toilet (1 person)
- Karton / paper (2 people)
- Trash (2 people)
- Finance (1 person)
- Laundry (1 person)

**Display:**
- Each Ämtli is a card showing: name, assigned resident avatar(s) with names, and a small "last changed by [name] on [date]" attribution line
- Unassigned Ämtli show a muted "No one assigned" placeholder

**Editing:**
- Any resident can edit any Ämtli (no permission restriction)
- Clicking a card opens an inline edit mode: multi-select resident picker (toggle avatars), save/cancel
- Every save writes a log entry (see below)

**Change log:**
- Each assignment change is persisted as a log entry: which Ämtli changed, who changed it, timestamp, old assignees → new assignees
- The most recent log entry is shown inline below the assignees ("Last changed by Alice · 28.03.2026")
- Full log history is not shown in the UI (backend stores it for audit purposes)

**Management (add/delete Ämtli):**
- A small "+ New Ämtli" button at the bottom of the section opens a minimal inline form (just a name field)
- Deleting an Ämtli requires a two-step confirmation (trash icon → "Confirm")

### 4.5 Header

- Logo (Paradies wordmark with ⊹ ornament)
- Profile picture of logged-in user (circular initial avatar)

---

## 5. Application Flow (Applicant-Facing)

### 5.1 Eligibility Questionnaire (`/apply/:castingId`)

Desktop-first, max-w-2xl. Three-step flow:

1. **Enrollment:** "Are you currently enrolled?" — Yes / No / "No but will be at contract start"
2. **University:** Select from eligible WOKO universities (UZH, ETH, ZHdK, PHZH, HfH, ZHAW, KME) or "Other"
3. **Degree:** Bachelor / Master / Doctoral (with max rental period notes)

**Progress indicator:** Editorial style: `· 01 Enrollment → 02 University → 03 Degree ·`

**Result states:**
- **Not eligible:** Error card with link to WOKO eligibility criteria
- **Eligible:** Success state with confirmation summary, "Start application" button

**to implement:**
- Greeting/welcome page before the questionnaire explaining the casting process
- Room description page showing the room from the catalogue (auto-populated from Room entity linked to the Casting)

### 5.2 Application Form

After passing eligibility. Sections with ornament-divider headers:

1. **Personal details:** Full name, pronouns (optional, with datalist suggestions), age, email, phone
2. **Profile picture:** Optional, circular preview, max 2MB, base64 encoded
3. **Occupation:** Select (Student/Employed/Self-employed/Other), conditional fields (major for students, description for other)
4. **Motivation letter:** Textarea, min 50 characters, character counter

On submit:
- Extracts keywords from motivation letter (client-side NLP: tokenize, filter stopwords EN+DE, TF scoring, top 5)
- Calls `POST /castings/:castingId/application`
- Navigates to success page

### 5.3 Success Page (`/apply/:castingId/success/:applicationId`)

- Gradient hero with checkmark + decorative ✦ ornaments
- Application ID in monospace with copy button
- "We will be in touch via email" message

### 5.4 Magic Link Status Page (`/status/:token`)

- Shows application status, applicant name, casting move-in date
- Option to withdraw application

---

## 6. Application Review & Evaluation (Resident-Facing)

### 6.1 All Applications Page (`/admin/applications`)

Mobile-first review interface. Optional `?casting=:id` filter.

**Sections:**
1. **Featured Card (Hero):** First unevaluated application displayed large on a gradient banner. Shows avatar, name, age, university/occupation, extracted keywords, quick YES/MAYBE/NO buttons
2. **The Funnel:** Remaining unevaluated applications in a grid (2 columns on tablet+). Each card shows avatar, name, age, keywords. Click navigates to full evaluation.
3. **Evaluated:** Already-evaluated applications listed below with ornament-divider heading

### 6.2 Castings Page (`/admin/castings`)

Lists all castings (active and archived) with:
- Color-coded cards with stats (applied count, unevaluated count)
- Move-in date, optional casting time
- Editorial section headings ("Active", "Archived") with counts
- Click navigates to applications filtered by casting

### 6.3 Applications Page (`/admin/casting/:castingId/applications`)

Per-casting list of ApplicationCards. Each card shows:
- Circular avatar (profile picture or initial with hash-based color)
- Name, age, university/occupation, major
- Extracted keywords as colored pills (cycling through rose, skin, blush, periwinkle, primary)
- Status badge (Pending, Submitted, Yes, No, Withdrawn, Rejected, Moved in)
- Click navigates to full evaluation

### 6.4 Evaluate Page (`/admin/casting/:castingId/application/:applicationId`)

Full evaluation detail view:

- **Gradient hero section** with corner ornament stars
  - Circular profile picture (or initial avatar)
  - Name, age, university/occupation, major
  - Extracted keywords as white pills
  - Contact info (email, phone)
- **Verdict buttons** (6 options in a decorative ring): YES, MAYBE, NO, VETO, FRIEND, NOT_WOKO
  - Color-coded with hover/active states
  - Submit button appears after selection
  - "Vote recorded" confirmation state
- **Motivation letter** card with ornament-divider header
- **Evaluation history** card showing all votes: verdict icon, label, author name, timestamp
  - Fetches from `GET /castings/:castingId/application/:applicationId/evaluations`
  - Refreshes after submitting a new vote

---

## 7. Room Catalogue

### 7.1 Backend (implemented)

- Room entity: `id`, `roomNumber`, `floor`, `sizeM2`, `description` (TEXT), `photo` (base64), `photoMimeType`
- REST: `GET /rooms`, `GET /rooms/:id`, `POST /rooms`, `DELETE /rooms/:id`
- Casting has a `ManyToOne` relationship with Room (nullable)

### 7.2 Frontend (not yet implemented)

- Room selector when creating a casting (dropdown populated from `GET /rooms`)
- Room description page in the applicant eligibility flow (shows room photo, size, floor, description from the catalogue)
- Room management UI for residents (CRUD)

---

## 8. Status Transitions & Dispatch (not yet implemented)

### 8.1 Application Statuses

`PENDING` → `SUBMITTED` → `EVALUATED_YES` / `EVALUATED_NO` → `REJECTED_AFTER_CASTING` / `MOVED_IN`

Also: `WITHDRAWN` (applicant self-service via magic link)

### 8.2 Dispatch Mechanism (planned)

- After evaluations are complete, a "dispatch" button sends bulk rejection/invitation emails
- Security: requires approval from at least 1 other WG member within 1 hour
- Status transitions happen simultaneously for all applicants
- Frontend needs: dispatch button UI, confirmation flow, approval countdown

### 8.3 Final Decision

- After the casting event, choose the final new WG member
- Transition their status to `MOVED_IN`, others to `REJECTED_AFTER_CASTING`

---

## 9. Evaluation Categories

| Category | Icon | Color | Meaning |
|----------|------|-------|---------|
| YES | CheckCircle | Emerald | Invite to casting |
| MAYBE | Question | Amber | On the fence |
| NO | XCircle | Red | Reject |
| VETO | Prohibit | Purple | Hard no from any member |
| FRIEND | Heart | Sky blue | Personal connection/bias |
| NOT_WOKO | UserMinus | Stone | Not eligible for WOKO |

Each evaluation is logged with: author (from session), verdict, timestamp. Multiple residents can evaluate the same applicant — all votes are visible as a history log.

**Upsert rule:** Each resident can only have one active evaluation per application. Submitting a new verdict replaces their previous one (backend updates the existing row in place; timestamp is refreshed). The history log therefore shows at most one entry per resident.

**Log visibility:** The evaluation history section is shown whenever at least one evaluation by the current user exists for the application (i.e. the current user has already voted).

---

## 10. Backend API Summary

### Castings
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /castings` | POST | Create casting (moveInDate, moveOutDate, replacedPersonName, applicationUntil, roomId) → returns generated UUID |
| `GET /castings` | GET | List all castings (sorted DESC) |
| `GET /castings/:id` | GET | Get single casting |
| `PUT /castings/:id/time` | PUT | Set casting time |
| `PUT /castings/:id/application-until` | PUT | Set/remove application deadline |
| `PUT /castings/:id/close-applications` | PUT | Close application period |
| `GET /castings/active/applications` | GET | Active castings with inline application overviews |

### Applications
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /castings/:id/application` | POST | Submit application → `{applicationId, magicLinkToken}` |
| `GET /castings/:id/application?id=:appId` | GET | Get full application detail |
| `GET /castings/:id/applications` | GET | List application overviews for a casting |
| `PUT /castings/:id/application/:appId/evaluation` | PUT | Submit evaluation (uses session for author) |
| `GET /castings/:id/application/:appId/evaluations` | GET | List evaluation history |

### Residents
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /residents` | GET | List all residents |
| `POST /residents` | POST | Create resident → `{id, inviteToken}` |
| `PUT /residents/:id` | PUT | Update resident (name, birthday, roomNumber, email) |
| `DELETE /residents/:id` | DELETE | Delete resident |
| `GET /residents/upcoming-birthdays` | GET | Upcoming birthdays with days-until |

### Cleaning Duties
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /cleaning-duties` | GET | List all duties (sorted by dueDate) |
| `POST /cleaning-duties` | POST | Create duty (residentId, dueDate, area) |
| `PUT /cleaning-duties/:id/complete` | PUT | Mark duty as completed |
| `PUT /cleaning-duties/:id/uncomplete` | PUT | Mark duty as not done (undo completion) |
| `DELETE /cleaning-duties` | DELETE | Delete all duties (dev/reset) |
| `GET /cleaning-duties/generate` | GET | Generate proposed plan for a month (`?year=X&month=Y`). Accounts for absences and past uncompleted duties. |

### Rooms
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /rooms` | GET | List all rooms |
| `GET /rooms/:id` | GET | Get room detail |
| `POST /rooms` | POST | Create room |
| `DELETE /rooms/:id` | DELETE | Delete room |

### Ämtli
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /aemtli` | GET | List all Ämtli with current assignees and last log entry |
| `POST /aemtli` | POST | Create new Ämtli (`{ name }`) → `{ id }` |
| `PUT /aemtli/:id/assignments` | PUT | Update assigned residents (`{ residentIds: UUID[] }`) — logs the change using session user |
| `DELETE /aemtli/:id` | DELETE | Delete Ämtli (also deletes its log entries) |

**Seeding:** The default Ämtli list (Compost, Cat toilet, Karton/paper, Trash, Finance, Laundry) must be inserted on application startup if the `aemtli` table is empty — not via `DevSeedData` but via a proper startup check so it runs in production too (e.g. a `@Singleton` `@Startup` bean or a Flyway/Liquibase migration).

**Data model — `Aemtli` entity:**
- `id` (UUID)
- `name` (String)
- `assignedResidents` (ManyToMany → Resident)

**Data model — `AemtliLogEntry` entity:**
- `id` (UUID)
- `aemtli` (ManyToOne → Aemtli)
- `changedBy` (ManyToOne → Resident)
- `changedAt` (LocalDateTime)
- `previousResidentIds` (stored as comma-separated UUIDs or JSON string)
- `newResidentIds` (stored as comma-separated UUIDs or JSON string)

`GET /aemtli` response shape per item:
```json
{
  "id": "...",
  "name": "Compost",
  "assignedResidents": [{ "id": "...", "name": "Alice", "roomNumber": "301" }],
  "lastChange": {
    "changedBy": { "id": "...", "name": "Bob" },
    "changedAt": "2026-03-28T14:22:00"
  }
}
```

---

## 11. WG Calendar (`/admin/calendar`)

### 11.1 Overview

Shared WG calendar for events (meetings, parties, outings) and absence periods (holidays, exchange semesters). Data persisted in the backend via `CalendarEntry` entity (`GET/POST/DELETE /calendar-entries`).

### 11.2 Data Model

Backend entity `CalendarEntry` with fields:
- **id** (UUID, auto-generated)
- **title** (string, required)
- **startDate** (ISO date, required)
- **endDate** (ISO date, required — same as `startDate` for point-wise events)
- **time** (HH:MM string or null — only for point-wise events)
- **color** (int, index into a 6-color palette — user-chosen)
- **category** (enum: `EVENT` | `ABSENCE` | `PARTY`)

### 11.3 Calendar Grid Display Rules

- **Month grid** with Mon–Sun columns, today highlighted, weekends tinted
- **Multi-day entries** (startDate ≠ endDate) render as colored bars spanning cells with greedy lane assignment; bars wrap correctly across week boundaries with rounded corners only at true start/end
- **Point-wise entries** (startDate = endDate) render as small colored **chips** (not dots) showing truncated title or time — more visually pronounced
- **Display cap per day:** max **3 continuous (multi-day) bars** and **1 point-wise chip** visible
- **Overflow:** if a day has more entries than the cap, a **"+N more"** indicator is shown in the day cell
- **Click-to-expand:** tapping a day selects it (ring highlight) and opens a **Day Detail panel** below the calendar listing **all** entries covering that day (both multi-day and point-wise), with title, dates/time, category badge, and color dot
- Tapping the selected day again deselects it and closes the panel

### 11.4 Entry Highlighting

- Tapping an entry in the list or Day Detail panel **highlights** it in the calendar: the bar/chip uses a deeper color variant, all other entries dim to 20% opacity
- Tapping the same entry again removes the highlight

### 11.5 Entry Creation Form

- Title, start date, end date (all required — end date is **mandatory**, not optional)
- **Calendar date picking:** when the form is open, tapping days in the calendar grid sets start/end dates (first tap = start, second tap = end); a hint banner shows which date is being picked. The date fields are **plain text inputs** (not the `DateInput` component with its dropdown mini-calendar), since the full calendar grid on this page already serves as the date picker — a redundant dropdown would conflict with it.
- Dates can also be typed manually in DD.MM.YYYY format. Focusing a date field activates the corresponding pick step (start/end) with a highlighted outline.
- **Time field** appears only when start = end (point-wise event), suggesting the user add hours
- **Category toggle pills:** Event / Away / Party
- **Color picker:** row of 6 colored circles
- Form must not overflow its container on mobile

### 11.6 List View & Filters

Below the calendar, a "This month" section lists all entries overlapping the current month:
- **Filter pills** at the top: All / Away / Party / Event — only one active, defaults to All
- Each entry shows: color dot, title, date range (or date + time for point-wise), category badge, delete button (not for virtual entries)
- Tapping an entry highlights it in the calendar (see 11.4)

### 11.7 Resident Birthdays

- Birthdays from the `/residents` endpoint are synthesized as **virtual point-wise entries** (category: event, blush color, cake icon)
- Virtual entries cannot be deleted — they are computed from resident data
- Displayed with a cake icon both in the calendar chip and in the list

### 11.8 Navigation

Accessible via the **Calendar** tab in the bottom navigation bar (3-tab layout: Home + Calendar + WG).

---

## 12. Tech Stack

- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`), hand-rolled components (no shadcn/ui)
- **Fonts:** `@fontsource-variable/outfit`, `@fontsource-variable/playfair-display`
- **Icons:** `lucide-react`, `@phosphor-icons/react`
- **Utilities:** `clsx`, `tailwind-merge`, `date-fns`
- **Dev proxy:** Vite proxy forwards `/castings`, `/residents`, `/cleaning-duties`, `/rooms`, `/auth`, `/magic-link`, `/calendar-entries`, `/aemtli` to `http://localhost:8080`

---

## 13. Key UX Principles

1. **One room per casting:** Each casting corresponds to exactly one vacant room
2. **Mobile-first for residents:** They use the app on their phones at WG meetings
3. **Desktop-first for applicants:** They fill out the form on laptops
4. **Swiss conventions:** DD.MM.YYYY dates, CHF currency
5. **Evaluation transparency:** All votes are visible as a log — enables discussion among residents
6. **Keyword extraction:** NLP microservice extracts standout words from motivation letters to help residents scan quickly

---
