# Plan: Mobile-First Responsive PWA with Loading States

> Source PRD: [CrystalGamesStudio/exsize-prod#35](https://github.com/CrystalGamesStudio/exsize-prod/issues/35)

## Architectural decisions

Durable decisions that apply across all phases:

- **Architecture style**: React 19 SPA with Vite, deployed on Cloudflare Pages at exsize.pages.dev
- **Frontend stack**: React 19, Vite, Tailwind CSS v4, shadcn/ui components, Lucide icons
- **Backend**: FastAPI on Fly.io — unchanged, no modifications needed
- **Auth**: Existing JWT auth context — provides user role (parent/child) for role-aware UI
- **PWA tooling**: vite-plugin-pwa with Workbox for service worker generation
- **Design reference**: Habitica-like gamification UX, current color scheme preserved
- **Key constraint**: All changes are frontend-only. Backend API is frozen for this plan.

---

## Phase 1: useLoading Hook + Auth Loaders

**User stories**: #1, #2, #7

### What to build

Create a reusable `useLoading` hook that wraps any async action with loading and error state. Apply it to the login and register buttons — when clicked, the button text swaps to a spinner icon, the button becomes disabled, and on error the button shows the error message. This validates the hook pattern on the simplest user-facing flow before expanding elsewhere.

### Acceptance criteria

- [ ] `useLoading` hook exists and returns `{ isLoading, error, execute }`
- [ ] Hook sets `isLoading: true` during async call, `false` on completion
- [ ] Hook captures errors and exposes them via `error` state
- [ ] Login button shows spinner and disables while API call is in flight
- [ ] Register button shows spinner and disables while API call is in flight
- [ ] Both buttons clear loading state on success or error
- [ ] No double-submit possible on auth buttons

---

## Phase 2: Loaders on Task Actions

**User stories**: #3, #4

### What to build

Apply `useLoading` to task-related buttons: the "add task" form submit button and the "join family" button. Both should show spinner + disabled state during their API calls. This extends the loading pattern to the parent's primary workflow.

### Acceptance criteria

- [ ] "Add task" button shows spinner + disabled while task is being created
- [ ] "Join family" button shows spinner + disabled while processing
- [ ] Loading state clears on success (task created / family joined)
- [ ] Loading state clears on error with error message visible

---

## Phase 3: Loaders on Shop Actions + Error States

**User stories**: #5, #6, #8

### What to build

Apply `useLoading` to shop and reward buttons: purchase in avatar shop, claim reward, and any remaining action buttons. Ensure all loaders also display error feedback when API calls fail — this phase cements the loading pattern as complete across the entire app.

### Acceptance criteria

- [ ] Avatar shop "purchase" button shows spinner + disabled during purchase
- [ ] "Claim reward" button shows spinner + disabled during claim
- [ ] All remaining action buttons in the app have loading states
- [ ] Failed API calls show an error indication on or near the button
- [ ] Every action button in the app is covered — audit complete

---

## Phase 4: Parent Bottom Tab Bar + Top Bar

**User stories**: #9, #10, #16

### What to build

Build the parent-specific mobile navigation: a bottom tab bar with three items — Dashboard, a large prominent "+" (add task), and ExBucks. Above it, a top bar with Settings icon (left), Family, and SizePass button. The bottom tab bar is always visible on mobile. The "+" button should be oversized and visually distinct (Habitica-style prominent action button). On desktop, render a horizontal nav instead.

### Acceptance criteria

- [ ] Parent bottom tab bar shows: Dashboard | "+" | ExBucks
- [ ] "+" button is visually larger/more prominent than other tabs
- [ ] Top bar shows: Settings icon | Family | SizePass
- [ ] Bottom tab bar is sticky at bottom of viewport on mobile
- [ ] Each tab navigates to the correct page
- [ ] Active tab is visually highlighted
- [ ] Desktop shows alternative horizontal nav layout

---

## Phase 5: Child Bottom Tab Bar

**User stories**: #11, #17

### What to build

Build the child-specific mobile navigation: a bottom tab bar with four items — Tasks, Shop, Leaderboard, and a hamburger menu icon. Tabs are large and tappable with clear icons and labels. The hamburger menu item is present but the drawer itself is built in Phase 6.

### Acceptance criteria

- [ ] Child bottom tab bar shows: Tasks | Shop | Leaderboard | Hamburger icon
- [ ] All tab icons are large enough for easy tapping (min 44px touch target)
- [ ] Bottom tab bar is sticky at bottom of viewport on mobile
- [ ] Active tab is visually highlighted
- [ ] Hamburger icon is tappable (drawer opens in Phase 6)
- [ ] Desktop shows alternative horizontal nav layout

---

## Phase 6: Hamburger Drawer (Child)

**User stories**: #12

### What to build

Build a slide-in drawer from the right that opens when the child taps the hamburger menu icon. The drawer contains navigation items: Profile, Settings, Family, ExBucks, and SizePass. Drawer has a smooth slide animation, a semi-transparent backdrop, and closes on backdrop click or item selection.

### Acceptance criteria

- [ ] Hamburger icon opens a slide-in drawer from the right
- [ ] Drawer contains: Profile, Settings, Family, ExBucks, SizePass
- [ ] Drawer has smooth slide-in/slide-out animation
- [ ] Semi-transparent backdrop appears behind drawer
- [ ] Backdrop click closes the drawer
- [ ] Selecting a drawer item navigates and closes the drawer
- [ ] Drawer is keyboard-accessible (Escape to close)

---

## Phase 7: Child Tasks Top Bar — Stats Display

**User stories**: #13

### What to build

Add a top bar to the child's Tasks page showing: a home icon (navigation to dashboard), and the child's current badges, streak count, level, and ExBucks balance. This gives the child an at-a-glance view of their gamification progress while browsing tasks.

### Acceptance criteria

- [ ] Tasks page top bar shows: Home icon | Badges | Streak | Level | ExBucks balance
- [ ] Home icon navigates to dashboard
- [ ] Stats are pulled from existing user data (no new API)
- [ ] Top bar is sticky at top of viewport
- [ ] Stats display is compact and readable on mobile

---

## Phase 8: Blocking Auth Modal

**User stories**: #14

### What to build

Replace the current login/register pages with a blocking modal that appears over a dimmed/blank app shell. The modal has tabs to switch between login and register forms. There is no close button, no backdrop click dismiss — the user must authenticate. After successful auth, the modal disappears and the app loads.

### Acceptance criteria

- [ ] Unauthenticated users see auth modal immediately on app load
- [ ] Modal has no close button — cannot be dismissed
- [ ] Backdrop click does nothing
- [ ] Modal has tabs to switch between Login and Register forms
- [ ] Forms reuse existing auth logic and API endpoints
- [ ] After successful login/register, modal closes and app content appears
- [ ] Browser back button does not bypass the modal

---

## Phase 9: Responsive Layouts — Parent Pages

**User stories**: #15

### What to build

Make all parent-facing pages (Dashboard, Tasks management, Family management, Settings, ExBucks, SizePass, Profile) fully responsive. Content should reflow from desktop multi-column layouts to single-column mobile layouts. Touch targets meet 44px minimum. Tables become card lists on mobile. Forms stack vertically.

### Acceptance criteria

- [ ] Dashboard responsive: cards stack vertically on mobile
- [ ] Task list responsive: table becomes card list on mobile
- [ ] Family management responsive on mobile
- [ ] Settings page responsive on mobile
- [ ] All forms stack vertically on mobile with proper spacing
- [ ] Touch targets are minimum 44px on mobile
- [ ] Tested at 320px, 375px, 768px, 1024px+ widths

---

## Phase 10: Responsive Layouts — Child Pages

**User stories**: #15

### What to build

Make all child-facing pages (Tasks, Shop, Leaderboard, Avatar Items, Profile, ExBucks, SizePass) fully responsive. Same mobile-first approach as Phase 9 — single column on mobile, expanding to multi-column on larger screens.

### Acceptance criteria

- [ ] Tasks page responsive on mobile
- [ ] Shop grid adapts from multi-column to 2-column on mobile
- [ ] Leaderboard table becomes card list on mobile
- [ ] Avatar items grid responsive on mobile
- [ ] Profile page responsive on mobile
- [ ] All pages tested at 320px, 375px, 768px, 1024px+ widths

---

## Phase 11: PWA Manifest + Icons + Splash Screen

**User stories**: #18, #19, #22

### What to build

Add a web app manifest with app name "ExSize", icons in all required sizes (192px, 512px), theme colors matching current design, and splash screen configuration. The app should become installable — Chrome should show the install prompt, and the app should appear with an icon on the home screen.

### Acceptance criteria

- [ ] manifest.json generated via vite-plugin-pwa
- [ ] App name "ExSize" appears in manifest
- [ ] Icons provided at 192px and 512px minimum
- [ ] Theme color and background color match current app theme
- [ ] Splash screen shows on launch from home screen
- [ ] Chrome shows install prompt (A2HS)
- [ ] Lighthouse "Installable" audit passes

---

## Phase 12: Service Worker + App Shell Caching

**User stories**: #21

### What to build

Configure vite-plugin-pwa to generate a service worker that caches the app shell (HTML, JS, CSS, fonts, images). Use cache-first strategy for static assets. The app should load instantly from cache on repeat visits. Service worker registers non-blocking on app mount.

### Acceptance criteria

- [ ] Service worker is generated on build via vite-plugin-pwa
- [ ] Service worker registers on app mount (non-blocking)
- [ ] App shell (HTML, JS, CSS, fonts) is cached on first visit
- [ ] Repeat visits load from cache instantly
- [ ] Static assets use cache-first strategy
- [ ] Lighthouse "PWA" category passes

---

## Phase 13: Custom Offline Fallback Page

**User stories**: #20

### What to build

Create a custom "No Internet" page that the service worker serves when the user is offline and tries to navigate. The page shows a friendly message, the ExSize branding, and a "Retry" button. The retry button checks connectivity and reloads the app when internet is restored.

### Acceptance criteria

- [ ] Custom offline page exists with ExSize branding
- [ ] Service worker serves offline page when user is offline
- [ ] Offline page shows clear "No Internet" message
- [ ] "Retry" button detects connectivity and reloads app
- [ ] Offline page is styled consistently with app theme
- [ ] Tested by going offline in DevTools and navigating
