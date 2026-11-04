# Truth24x7 — Full Source Code Audit vs. Project Scope Document

> **Audit Date:** September 7, 2026 | **Codebase:** `d:\KIIT-MUN\truth24x7`
> **Scope Reference:** Project Scope Document (21 Action Items)

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented / Present in code |
| ⚠️ | Partially implemented / Needs improvement |
| ❌ | Missing / Not implemented |
| 🐛 | Bug identified in code |

---

## 2.1 Data & Analytics

### GA-1 — Google Analytics Synchronization
**Scope Requirement:** Rectify discrepancies between dashboard data and Google Analytics.

**Code Finding:**
- [`AnalyticsWrapper.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/AnalyticsWrapper.tsx) only loads GA **after** cookie consent is accepted via `localStorage.getItem("truth24x7_cookie_consent")`.
- [`layout.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/layout.tsx#L49) uses a fallback `gaId = 'G-XXXXXXXXXX'` if `NEXT_PUBLIC_GA_ID` is not set.
- GA events (`sendGAEvent`) are correctly fired in [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L109-L113) for article clicks, category clicks, and search.
- **Problem:** The admin dashboard [`MetricsCharts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/page.tsx#L59) component is present but its implementation is unknown — no GA API integration observed. Dashboard metrics are likely **mocked/static** data, not synced from Google Analytics.

**Status:** ⚠️ Partially — GA tracking fires correctly on frontend, but admin dashboard data is not synced from GA API.

---

### GA-2 — Dashboard Date Display Bug
**Scope Requirement:** Resolve interface bug preventing correct date-wise rendering on the dashboard.

**Code Finding:**
- [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts#L39-L52) has `visibility_cutoff_date` filter logic — if set, articles with `published_at > cutoff` are hidden.
- [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx#L38-L51) fetches `simulated_date` from `/api/settings` and displays a *static random time* (not live-ticking) when simulated mode is active.
- Admin dashboard at [`admin/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/page.tsx#L19) uses `new Date().toLocaleDateString()` — always today's date, no date filter UI.
- **Bug:** `handleDateFilterChange` in [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L44-L48) calls `setSimulatedDate(todayStr)` — always resets to today regardless of filter selected, so date filtering is broken.

**Status:** ❌ Not fixed — date filter always resets to today.

---

### GA-3 — Sync Diagnostics / Failed Feed Sources
**Scope Requirement:** Investigate failed feed/API sources, authentication, parsing, retry.

**Code Finding:**
- [`admin/live`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/live) directory exists but content not inspected in depth. The admin dashboard Status Core card shows hardcoded statuses (`CONNECTED`, `OPTIMAL`, `ACTIVE`) with fixed `Progress` values.
- The RSS sync process uses `/api/process-news` — no retry mechanism observed in the inspected code.
- **No automated retry, no failed source tracking UI observed.**

**Status:** ❌ Not implemented in visible code.

---

## 2.2 Content Management & Workflows

### CM-1 — News Expiry Rules / Rotation
**Scope Requirement:** Implement automated publication/expiry rotation to prevent stale news.

**Code Finding:**
- [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts#L42-L54) uses `visibility_cutoff_date` to hide older content — but this is a **global toggle** only, not per-article expiry.
- No `expires_at` column in DB queries. No scheduled job or cron for rotation.
- Articles remain in DB indefinitely with no auto-expiry.

**Status:** ❌ Not implemented.

---

### CM-2 — Duplication Prevention
**Scope Requirement:** Stop same news from appearing in multiple sections simultaneously.

**Code Finding:**
- [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L151-L166) uses `getArticlesByCategory()` which filters by category/tags. **An article with multiple categories CAN appear in multiple sections** (e.g., a "Business & Technology" article appears in both `businessTechArticles` and could match other filters).
- The `getArticlesByCategory` function uses `.includes()` on a concatenated string — no deduplication between sections.
- **Example bug:** An article categorized as both `['national', 'politics']` matches both `nationArticles` and could match other filters.

**Status:** ❌ No cross-section deduplication implemented.

---

### CM-3 — Editorial Workflows / Breaking Updates
**Scope Requirement:** Simplify backend for publishing "Breaking Updates" and editing existing news.

**Code Finding:**
- [`admin/articles/new/page.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/page.tsx) exists (40KB) — full article editor. Uses `addFeedItem` server action.
- [`admin/articles/edit`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/edit) directory exists.
- Setting article as "Breaking" requires manually typing the category — no dedicated "Breaking News" button/shortcut.
- Author is hardcoded as `'NewsBridge System'` in [`actions.ts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/actions.ts#L158) — no author assignment.
- `readingTime` is hardcoded to `'4 min'` in [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts#L102) (see CM-4).

**Status:** ⚠️ Basic workflow exists, no quick "Breaking" shortcut, author is hardcoded.

---

### CM-4 — Dynamic Reading Time
**Scope Requirement:** Replace static "4 min read" with word-count-based calculation.

**Code Finding:**
- [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts#L102): `readingTime: '4 min',` — **hardcoded string** in both `getMappedArticles()` and `getArticleByIdOrSlug()`.
- [`Hero.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Hero.tsx#L110) displays `{article.readingTime} read`.
- [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx#L333) also displays `{article.readingTime} read`.
- **Formula needed:** `Math.ceil(wordCount / 200)` minutes. `content_html` text content must be stripped of HTML tags first.

**Status:** ❌ Static "4 min" hardcoded — not dynamic.

---

## 2.3 Front-end & UX

### UX-1 — Responsive Design
**Scope Requirement:** Optimize mobile/tablet layouts, touch targets, spacing.

**Code Finding:**
- Tailwind responsive prefixes (`md:`, `lg:`) are used throughout — basic responsive structure exists.
- [`Hero.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Hero.tsx#L90-L91) uses `isMobile` state with `height: 'auto'` on mobile.
- [`MobileNav.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/MobileNav.tsx) provides bottom navigation for mobile.
- **Issue:** On mobile the main layout `pb-20` accounts for the nav bar, but `SingleArticleView` shows a different fixed bottom bar that might overlap with `MobileNav`.
- The article view's mobile bottom bar (in [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx#L505-L539)) conflicts with the global `MobileNav` in [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L304-L315) since both are `fixed bottom-0`.
- No explicit `min-h-[44px]` touch targets enforced.

**Status:** ⚠️ Basic responsive structure exists; dual fixed bottom bar conflict on mobile.

---

### UX-2 — Hamburger Menu
**Scope Requirement:** Fix hamburger menu functionality across all devices.

**Code Finding:**
- [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx#L92-L95): The mobile `<button>` that renders `<Menu className="w-6 h-6" />` (the hamburger) has **NO `onClick` handler**. Clicking it does nothing.
- The navigation (`nav`) is hidden on mobile with `hidden lg:flex` — clicking the hamburger does not reveal it.
- No mobile drawer/sidebar exists for navigation.

**Status:** ❌ **Critical Bug** — hamburger menu button has no click handler and no mobile nav drawer exists.

---

### UX-3 — Trending Topics Clickability & Routing
**Scope Requirement:** Ensure Trending Topics are clickable and properly routed.

**Code Finding:**
- [`TrendingBar.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/TrendingBar.tsx#L186): Topic buttons call `onTopicClick?.(isSelected ? null : topic.slug)`.
- [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L200-L204): `TrendingBar` is rendered but **`onTopicClick` prop is NOT passed**. `selectedTopic` prop is also not passed.
- This means clicking any trending topic **does nothing** — the `onTopicClick` callback is `undefined`.
- There is no filtering of articles based on selected trending topic.

**Status:** ❌ **Critical Bug** — `onTopicClick` not wired. Trending topic clicks are completely non-functional.

---

### UX-4 — Typography & Spacing Standardization
**Scope Requirement:** Standardize fonts for Breaking News, headlines, body text. Eliminate blank spaces.

**Code Finding:**
- Font system is defined in [`globals.css`](file:///d:/KIIT-MUN/truth24x7/src/app/globals.css): `font-helvetica`, `font-georgia`, `font-sans` (Mukta), `font-serif` (Martel).
- Breaking News category badge uses `bg-red-600` in [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx#L327) but `bg-news-breaking` in [`Hero.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Hero.tsx#L103) — **inconsistent class usage** (though they resolve to same color).
- [`CategorySection.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/CategorySection.tsx#L12): Returns `null` if no articles — **prevents "No Article" placeholder from showing**, which is good.
- If ALL category sections have no matching articles, **large blank spaces appear** between ad slots because the sections silently return null but their wrapper divs remain.
- [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L244-L247) wraps States and Business in a `grid grid-cols-2` div even if both are empty.

**Status:** ⚠️ Fonts defined but inconsistencies exist; blank space issue when categories have no articles.

---

### UX-5 — Category Routing
**Scope Requirement:** Implement dynamic bottom categories and ensure category pages load relevant news.

**Code Finding:**
- [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L134-L148): `handleCategoryClick` sets `selectedCategory` state but **the filtering is never applied**. `allArticles` is passed unchanged to all sections regardless of `selectedCategory`.
- The category filter state exists but has no effect on displayed content.
- Footer has category buttons that call `handleCategoryClick` correctly.
- Header nav items call `onCategoryClick` correctly.
- **But:** There's no code that uses `selectedCategory` to filter the article feed.

**Status:** ❌ **Critical Bug** — `selectedCategory` state set but never used to filter displayed articles.

---

### UX-6 — News Selection (Reader-Controlled)
**Scope Requirement:** Manual user controls to select alternate articles instead of forced slide sequence.

**Code Finding:**
- The `Hero` component shows only `allArticles[0]` (or the first with `featuredVideo`). No controls to browse/select alternate hero articles.
- No carousel with prev/next controls on the Hero component.
- The infinite scroll in `ArticleView` auto-loads next articles — user cannot choose which article to scroll to next.

**Status:** ❌ Not implemented.

---

## 2.4 User Engagement

### UE-1 — Feedback Mechanism
**Scope Requirement:** Integrate a direct feedback button triggering email/contact handlers.

**Code Finding:**
- The footer's "Contact Desk" link in [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L372) points to `/privacy` — **incorrect href, not a contact/feedback page**.
- The `MessageCircle` icon button in the footer (line 397-399) has **no onClick handler**.
- No feedback form, no `mailto:`, no API email handler found.

**Status:** ❌ No feedback mechanism exists.

---

### UE-2 — Social Sharing
**Scope Requirement:** Incorporate social media sharing to encourage content distribution.

**Code Finding:**
- [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx#L276-L296): Share button uses `navigator.share` (Web Share API) — falls back to clipboard copy.
- This is a **generic share** — not platform-specific social buttons (Twitter/X, WhatsApp, Facebook).
- [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx#L185-L201): Social media profile links exist in header (Instagram, YouTube, Facebook, X, LinkedIn).
- [`Sidebar.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Sidebar.tsx#L310-L338): Social follow section exists.
- **Missing:** Per-article social share buttons (WhatsApp share, Twitter share of article).
- WhatsApp channel link is a placeholder: `https://whatsapp.com/channel/YOUR_CHANNEL_ID`.

**Status:** ⚠️ Generic sharing exists; per-article social share links not platform-specific; WhatsApp channel is placeholder.

---

## Summary Table

| # | Scope Item | Status | Priority |
|---|-----------|--------|----------|
| 1 | GA Dashboard Data Sync | ⚠️ Partial | High |
| 2 | Dashboard Date Display Bug | ❌ Bug in code | High |
| 3 | Sync Diagnostics / Failed Sources | ❌ Missing | Medium |
| 4 | News Expiry Rules | ❌ Missing | Medium |
| 5 | Duplication Prevention | ❌ Missing | Medium |
| 6 | Editorial Breaking Update Workflow | ⚠️ Partial | Medium |
| 7 | Dynamic Reading Time | ❌ Hardcoded "4 min" | Medium |
| 8 | Responsive Design (Mobile/Tablet) | ⚠️ Partial | High |
| 9 | **Hamburger Menu Broken** | ❌ CRITICAL BUG | **Critical** |
| 10 | **Trending Topics Not Wired** | ❌ CRITICAL BUG | **Critical** |
| 11 | Typography & Blank Spaces | ⚠️ Partial | Medium |
| 12 | **Category Routing Broken** | ❌ CRITICAL BUG | **Critical** |
| 13 | Reader-Controlled News Selection | ❌ Missing | Medium |
| 14 | Feedback-to-Email | ❌ Missing | Medium |
| 15 | Social Sharing (Per-Article) | ⚠️ Partial | Medium |

---

## Critical Bugs Summary (Fix First)

> [!CAUTION]
> These are show-stopping bugs that break core user interactions:

### 🔴 BUG-01: Hamburger Menu has no onClick
**File:** [`Header.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/Header.tsx#L92-L94)
```tsx
// BROKEN: No onClick
<button className="lg:hidden">
  <Menu className="w-6 h-6" />
</button>
```
**Fix:** Wire a `useState` drawer/modal + pass an `onMenuClick` prop from `ClientHome`.

---

### 🔴 BUG-02: Trending Topics onTopicClick not passed
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L200-L204)
```tsx
// BROKEN: Missing onTopicClick and selectedTopic props
<TrendingBar
  selectedFilter={dateFilter}
  customDate={customArchiveDate}
  onFilterChange={handleDateFilterChange}
/>
```
**Fix:** Add `selectedTopic` state + `handleTopicClick` handler + pass both to `TrendingBar`. Also filter `allArticles` based on `selectedTopic`.

---

### 🔴 BUG-03: Category filter state set but never used
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L134-L148)
```tsx
// selectedCategory is set but allArticles is never filtered by it
const handleCategoryClick = (category: string | null) => {
  setSelectedCategory(category); // ← set...
  // but `allArticles` is never filtered by selectedCategory
};
```
**Fix:** Apply `selectedCategory` as a filter before passing to `getArticlesByCategory`.

---

### 🔴 BUG-04: Date filter resets to today always
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L44-L48)
```tsx
const handleDateFilterChange = (filter: DateFilter, date?: string) => {
  setDateFilter(filter);
  if (filter === 'custom' && date) setCustomArchiveDate(date);
  setSimulatedDate(todayStr); // ← Always resets to TODAY regardless of filter!
};
```
**Fix:** When filter is 'yesterday', set `setSimulatedDate(yesterdayStr)`. When 'custom', use the provided date.

---

### 🔴 BUG-05: Dual fixed bottom bar conflict on mobile (article view)
**File:** [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx#L505) + [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L304)

Both `MobileNav` and the article's own bottom action bar are `fixed bottom-0` simultaneously, causing overlap. `MobileNav` should be hidden in article view.

---

### 🔴 BUG-06: "Contact Desk" points to /privacy
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L372)
```tsx
{ label: 'Contact Desk', icon: Server, href: '/privacy' } // ← Wrong href
```

---

### 🔴 BUG-07: WhatsApp channel link is a placeholder
**Files:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L515), [`Sidebar.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/home/Sidebar.tsx#L259)
```tsx
href="https://whatsapp.com/channel/YOUR_CHANNEL_ID" // Placeholder!
```

---

## Medium Priority Fixes

### 🟡 FIX-01: Dynamic Reading Time
**File:** [`db.ts`](file:///d:/KIIT-MUN/truth24x7/src/lib/db.ts#L102)
Replace `readingTime: '4 min'` with:
```typescript
const wordCount = (row.content_html || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
const minutes = Math.max(1, Math.ceil(wordCount / 200));
readingTime: `${minutes} min`
```

### 🟡 FIX-02: Cross-section article deduplication
**File:** [`ClientHome.tsx`](file:///d:/KIIT-MUN/truth24x7/src/app/ClientHome.tsx#L161-L166)
Track used article IDs and exclude them from subsequent category sections.

### 🟡 FIX-03: Google Analytics dashboard integration
**File:** [`src/components/admin/MetricsCharts`]
Integrate Google Analytics Data API to pull real session/user/view counts into the admin dashboard.

### 🟡 FIX-04: Feedback/Contact form
Create `/api/contact` endpoint with email handler (e.g. Nodemailer / Resend) and a contact form page.

### 🟡 FIX-05: Per-article social share buttons
**File:** [`SingleArticleView.tsx`](file:///d:/KIIT-MUN/truth24x7/src/components/SingleArticleView.tsx)
Add Twitter/X, WhatsApp, Facebook share URLs using `encodeURIComponent(window.location.href)`.

### 🟡 FIX-06: News expiry / rotation
Add `expires_at` column to `truth_articles`. Add DB query filter. Add expiry date field to admin article editor.

### 🟡 FIX-07: Article deduplication on ingest
**File:** [`actions.ts`](file:///d:/KIIT-MUN/truth24x7/src/app/admin/articles/new/actions.ts)
Already handles slug uniqueness. Add GUID uniqueness check before insert to prevent duplicate records from RSS feeds.

---

## Deliverables Checklist vs. Code State

| Deliverable | Status |
|------------|--------|
| ☐ Make dashboard data match Google Analytics | ❌ |
| ☐ Fix three-line/hamburger menu on all devices | ❌ BUG-01 |
| ☐ Fix Trending Topics click & routing | ❌ BUG-02 |
| ☐ Optimize layout for mobile/tablets | ⚠️ |
| ☐ Article-specific reading time calculation | ❌ FIX-01 |
| ☐ Fix category pages and backend news loading | ❌ BUG-03 |
| ☐ Persistent/outdated news with rotation rules | ❌ FIX-06 |
| ☐ Resolve Sync Diagnostics / Failed Sources | ❌ |
| ☐ Correct Breaking News font size/hierarchy | ⚠️ |
| ☐ Standardize Web Article headline/body typography | ⚠️ |
| ☐ Resolve blank layouts and "No Article" states | ⚠️ |
| ☐ Reduce blank space / optimize margins | ⚠️ |
| ☐ Fix repeated news rendering across homepage | ❌ FIX-02 |
| ☐ Add reader-controlled news selection in Web Copy | ❌ |
| ☐ Add category navigation & auto-categorization | ❌ BUG-03 |
| ☐ Simplify Breaking Update admin workflow | ⚠️ |
| ☐ Simplify general news editing/update workflow | ⚠️ |
| ☐ Add functional Feedback-to-email routing | ❌ FIX-04 |
| ☐ Integrate social media sharing | ⚠️ FIX-05 |
| ☐ Fix dashboard date-wise interface | ❌ BUG-04 |
| ☐ Establish ongoing resolution process | Ongoing |
