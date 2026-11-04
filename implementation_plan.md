# Implementation Plan — Truth24x7 Full Remediation
> All 21 items from the Project Scope Document & Audit Report

---

## Overview

| Phase | Scope | Items | Risk |
|-------|-------|-------|------|
| 1 | Critical Bug Fixes | 7 bugs | Low — isolated, surgical |
| 2 | UX Enhancements | 5 items | Low — additive changes |
| 3 | News Lifecycle | 3 items | Medium — DB schema + admin UI |
| 4 | Dashboard & Analytics | 3 items | Low — mostly already wired |

---

## Phase 1 — Critical Bugs (7 fixes, 0 new files)

### BUG-01: Hamburger Menu — no onClick handler
**File:** [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx) · Lines 10–17, 92–95

**Plan:**
- Add `isMobileMenuOpen: boolean` prop to `HeaderProps`
- Add `onMenuClick?: () => void` prop  
- Wire the existing `<button className="lg:hidden">` to call `onMenuClick`
- In `ClientHome.tsx`, add `isMobileMenuOpen` state + handler, pass to `<Header>`
- Create a slide-in mobile drawer inside `Header.tsx` (`fixed inset-0 z-[200]`) showing the same nav items as the desktop nav: Politics, Business, Technology, World, Opinion, Science — each calling `onCategoryClick` and closing the drawer

---

### BUG-02: Trending Topics — onTopicClick and selectedTopic not passed
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Lines 29, 200–204

**Plan:**
- Add `selectedTopic: string | null` state (already implicitly needed, just needs wiring)
- Add `handleTopicClick = (slug: string | null) => setSelectedTopic(slug)` handler
- Pass both to `<TrendingBar onTopicClick={handleTopicClick} selectedTopic={selectedTopic} />`
- Filter `allArticles` when `selectedTopic` is set: `const visibleArticles = selectedTopic ? allArticles.filter(a => (a.tags || []).some(t => t.toLowerCase().replace(/\s+/g, '-') === selectedTopic) || a.title.toLowerCase().includes(selectedTopic.replace(/-/g, ' '))) : allArticles`
- Pass `visibleArticles` instead of `allArticles` to all section helpers

---

### BUG-03: Category filter — `selectedCategory` set but never applied
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Lines 151–166, 262+

**Plan:**
- After `selectedTopic` filter, add second filter: if `selectedCategory !== null`, filter articles by matching `a.category.toLowerCase().includes(selectedCategory.toLowerCase()) || (a.categories||[]).some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()))`
- This creates a `displayArticles` derived variable used by all sections
- Add a visual "Category: X [×]" pill below the TrendingBar when a category is active (similar to TrendingBar clear button)

---

### BUG-04: Date filter — always resets to today
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Lines 44–48

**Current broken code:**
```ts
setSimulatedDate(todayStr); // ← always overrides to today!
```

**Plan:** Replace with correct logic:
```ts
const handleDateFilterChange = (filter: DateFilter, date?: string) => {
  setDateFilter(filter);
  if (filter === 'today') setSimulatedDate(todayStr);
  else if (filter === 'yesterday') setSimulatedDate(yesterdayStr);
  else if (filter === 'custom' && date) {
    setCustomArchiveDate(date);
    setSimulatedDate(date);
  } else if (filter === 'older') setSimulatedDate(''); // show all
};
```
- Pass `simulatedDate` to the DB query filter via the settings API (the `visibility_cutoff_date` mechanism already exists in `db.ts`)
- **Important:** Since articles are fetched server-side at load time with a 60s revalidate, date filtering on the client should filter `allArticles` by `publishedAt` using the chosen date. No API re-fetch needed.

---

### BUG-05: Dual fixed bottom bar conflict on mobile (article view)
**Files:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Line 304–315, [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx) · Lines 505–539

**Plan:**
- Pass `currentView` to `<MobileNav>` (already done) — when `currentView === 'article'`, hide `MobileNav` entirely (`if (currentView === 'article') return null`)
- The `SingleArticleView` bottom bar (Home + Share + Save) remains as the sole fixed bar in article view

---

### BUG-06: "Contact Desk" footer link → `/privacy`
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Line 372

**Plan:** Change `href: '/privacy'` → `href: '/contact'` for "Contact Desk". The `/contact` page will be created in Phase 2 (FIX-04).

---

### BUG-07: WhatsApp channel placeholder URL
**Files:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Line 515, [`Sidebar.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Sidebar.tsx) · Line 259

**Plan:**
- Move the WhatsApp channel URL to an environment variable: `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL`
- Both components read `process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '#'`
- Add to `.env.local` and `.env.example`

> [!IMPORTANT]
> The actual WhatsApp channel URL needs to be provided. A placeholder will be used until configured.

---

## Phase 2 — UX Enhancements (5 items)

### FIX-01: Dynamic Reading Time (replacing hardcoded "4 min")
**File:** [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts) · Lines 102, 176

**Plan:**
- Add a `calculateReadingTime` utility function in `db.ts`:
```ts
function calculateReadingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min`;
}
```
- Replace both `readingTime: '4 min'` occurrences in `getMappedArticles()` and `getArticleByIdOrSlug()` with `readingTime: calculateReadingTime(row.content_html || '')`

---

### FIX-02: Cross-section article deduplication
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Lines 151–170

**Plan:**
- Replace `getArticlesByCategory` with a stateful deduplication system:
```ts
const usedIds = new Set<string>();
const getArticlesByCategory = (keywords: string[], count = 8) => {
  const matched = displayArticles.filter(a => {
    if (usedIds.has(a.id)) return false;
    const allCats = [a.category, ...(a.categories || [])].join(' ').toLowerCase();
    return keywords.some(k => allCats.includes(k.toLowerCase()));
  }).slice(0, count);
  matched.forEach(a => usedIds.add(a.id));
  return matched;
};
```
- This runs during render; `usedIds` ensures each article appears only once across Nation, World, States, Business, Sports, Entertainment sections

---

### FIX-03: Hero article selection controls
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) · Line 223, [`Hero.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Hero.tsx)

**Plan:**
- Add `heroIndex: number` state in `ClientHome` (default 0)
- Pass `article={allArticles[heroIndex]}` to `<Hero />`
- Add `onPrev` / `onNext` props to `Hero` to show prev/next article controls at the bottom-left of the hero panel (small dot indicators + arrow buttons)
- Auto-rotate every 8 seconds via `useEffect` with `setInterval`

---

### FIX-04: Feedback / Contact form with email routing
**Files:** [NEW] `src/app/contact/page.tsx`, [NEW] `src/app/api/contact/route.ts`

**Plan:**
- **API route** (`/api/contact`): Accept `{ name, email, message, subject }` via `POST`. Use `nodemailer` (or if already installed, check package.json) with SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO_EMAIL`) to send an email. Return `{ success: true }`.
- **Contact page** (`/contact`): Simple form with fields for name, email, subject, message. On submit calls `/api/contact`. Shows success/error toast.
- **Footer** `MessageCircle` button in `ClientHome.tsx`: Add `onClick={() => router.push('/contact')}` or open a modal feedback form inline.

> [!IMPORTANT]
> Will need SMTP credentials added to `.env.local`. Will use `nodemailer` (needs `npm install nodemailer @types/nodemailer`).

---

### FIX-05: Per-article platform-specific social sharing
**File:** [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx) · Lines 274–296, 513–530

**Plan:**
- Replace the generic `Share2` button with a social share panel showing:
  - **WhatsApp:** `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  - **Twitter/X:** `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  - **Facebook:** `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  - **Copy Link:** clipboard copy with visual confirmation tick
- Show as a tooltip/popover (using existing `Tooltip` from shadcn already imported) on the desktop toolbar
- On mobile bottom bar, tapping "Share" opens the same 4 options as a small sheet

---

## Phase 3 — News Lifecycle

### CM-01: News Expiry Rules
**Files:** [`actions.ts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/actions.ts), [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts), Admin article editor

**Plan:**
- **DB:** Add `expires_at TIMESTAMPTZ DEFAULT NULL` column to `truth_articles` via `setup_db.mjs` migration
- **`db.ts`:** Add `AND (expires_at IS NULL OR expires_at > NOW())` to both UNION queries in `getRssItems()` and `getArticleByIdOrSlug()`
- **`actions.ts`:** Accept `expires_at` from form data, include in `INSERT`
- **Admin editor** (`new/page.tsx`): Add optional "Expiry Date" `DateTimePicker` field below the "Publish Date" picker

---

### CM-02: Duplication Prevention (same article in multiple sections)
This is covered by **FIX-02** above (cross-section deduplication). For the DB level:

**File:** [`actions.ts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/actions.ts) — RSS ingest deduplication

**Plan:**
- Before the `INSERT INTO truth_articles`, check if a row with the same `canonical_url` OR `title` similarity already exists in either table
- If duplicate found, return early with `{ success: false, message: 'Duplicate article detected.' }`

---

### CM-03: Simplify Breaking News admin workflow
**File:** [`admin/articles/new/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/page.tsx)

**Plan:**
- Add a prominent "🔴 Mark as Breaking News" toggle switch near the top of the article editor form
- When toggled ON, automatically pre-fill/override the categories field with `["Breaking News"]` and adds a red visual indicator badge
- The toggle sets a hidden field `is_breaking: 'true'`
- In `actions.ts`, if `is_breaking` is set, override `categoriesArray` to `['Breaking News']`

---

## Phase 4 — Dashboard & Sync Diagnostics

### GA-03: Sync Diagnostics UI
**File:** [`admin/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/page.tsx) + [`admin/live`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/live) pages

**Plan:**
- Enhance the "Status Core" card to actually check live API health:
  - DB: already connected (the page loads its data from DB, so if it renders, DB is live)
  - RSS: call `/api/admin/rss-sources` to list sources and their last sync status
  - Show each source with `✅ OK` / `⚠️ Failed` / `🔄 Syncing` badge and a "Retry" button
- Add `/api/admin/rss-sync?source_id=X&force=true` endpoint that manually triggers a single-source re-sync

---

### GA-02: Dashboard Date Display Fix (already partially fixed via BUG-04)
**File:** [`admin/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/page.tsx)

**Plan:**
- The admin dashboard header already shows `currentDate` correctly
- Enhance `MetricsCharts` to show a date range selector (7d / 30d / 90d) that changes the `dateRanges` param sent to the GA4 Data API in `/api/admin/analytics/omni`
- Pass selected range as a query param: `/api/admin/analytics/omni?range=7d`

---

## Verification Plan

### After Phase 1 (Critical Bugs)
- [ ] Hamburger menu opens/closes mobile drawer on phone viewport
- [ ] Tapping a trending topic chip filters visible articles; tapping again clears
- [ ] Clicking "Nation" in footer/header filters homepage to national articles only
- [ ] Date filter "Yesterday" shows only yesterday's articles on the homepage
- [ ] In article view on mobile, only ONE fixed bottom bar appears (no overlap)
- [ ] "Contact Desk" link routes to `/contact`
- [ ] WhatsApp button links to the configured channel (not `YOUR_CHANNEL_ID`)

### After Phase 2 (UX)
- [ ] Article reading time shows calculated minutes (not always "4 min")
- [ ] Same article does NOT appear in both "National Desk" and "World Affairs"
- [ ] Hero section shows prev/next article controls; auto-rotates every 8s
- [ ] `/contact` page submits and sends email; footer MessageCircle button routes there
- [ ] Share button in article shows WhatsApp / Twitter / Facebook / Copy options

### After Phase 3 (Lifecycle)
- [ ] Article with past `expires_at` does not appear on homepage
- [ ] Submitting article with same URL as existing returns duplicate warning
- [ ] "Breaking" toggle in editor auto-sets category without manual typing

### After Phase 4 (Dashboard)
- [ ] RSS source list in admin shows real health status with retry buttons
- [ ] MetricsCharts date range selector fetches correct date range from GA4 API

---

## Files to Create (New)

| File | Purpose |
|------|---------|
| `src/app/contact/page.tsx` | Public contact/feedback page |
| `src/app/api/contact/route.ts` | Email handler (nodemailer) |

## Files to Modify

| File | Changes |
|------|---------|
| [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx) | BUG-01,02,03,04,06,07, FIX-02,03 |
| [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx) | BUG-01 (hamburger drawer) |
| [`MobileNav.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/MobileNav.tsx) | BUG-05 (hide in article view) |
| [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx) | FIX-05 (social share panel) |
| [`Hero.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Hero.tsx) | FIX-03 (prev/next controls) |
| [`Sidebar.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Sidebar.tsx) | BUG-07 (WhatsApp URL) |
| [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts) | FIX-01 (reading time), CM-01 (expiry filter) |
| [`admin/articles/new/actions.ts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/actions.ts) | CM-01 (expires_at), CM-02 (dedup), CM-03 (breaking toggle) |
| [`admin/articles/new/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/page.tsx) | CM-01 (expiry picker), CM-03 (breaking toggle) |
| [`admin/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/page.tsx) | GA-03 (sync diagnostics) |
| `.env.local` + `.env.example` | BUG-07 (WhatsApp URL), FIX-04 (SMTP vars) |
| `setup_db.mjs` | CM-01 (expires_at column migration) |

## Packages to Install

```bash
npm install nodemailer @types/nodemailer
```
