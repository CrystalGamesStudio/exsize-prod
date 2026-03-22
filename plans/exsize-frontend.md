# Plan: ExSize Frontend

> Source PRD: [GitHub Issue #13](https://github.com/tkowalczyk/exsize/issues/13)

## Architectural decisions

Durable decisions that apply across all phases:

- **Architecture style**: React SPA with client-side routing (React Router), bundled with Vite. No SSR/SSG.
- **Monorepo structure**: Frontend lives in `frontend/` within the existing repository alongside the FastAPI backend in `src/`.
- **UI framework**: Shadcn UI components + Tailwind CSS. Tweakcn for iterative visual customization.
- **Theming**: One base minimalist theme (parents/admin) + a youth-friendly overlay for child views. Same components, different visual treatment. Subtle and age-appropriate (7–18), not childish.
- **Data fetching**: TanStack Query (React Query) for server state — caching, refetching, optimistic updates.
- **API client**: Thin fetch wrapper consuming the existing FastAPI backend at `/api/*` endpoints.
- **Authentication**: JWT token stored in JavaScript memory (not localStorage). 60-minute expiry. Re-login required after page refresh or tab close.
- **Routing & layouts**: Role-based layouts — parent layout (Dashboard, Tasks, Family, Settings), admin layout (same + Rewards tab), child layout (gamification overlay in header). Auth pages use a standalone layout.
- **Language**: English only. i18n deferred.
- **Responsive design**: Mobile-first. All views must work at 375px (mobile), 768px (tablet), and 1280px (desktop).
- **Testing**: Unit/component tests (Vitest + React Testing Library) and E2E tests (Agent Browser) from Phase 1.
- **Deployment**: Free-tier hosting (Vercel or Netlify), decision deferred.

---

## Phase 1: Project Foundation & Auth

**User stories**: 1, 2, 3, 4, 5, 6

### What to build

Initialize the frontend project with Vite, React, React Router, Shadcn UI, Tweakcn, Tailwind CSS, and TanStack Query. Set up the API client with JWT token management (in-memory). Build the authentication flow: a login page and a registration page where the user selects their role (parent/child/admin) and provides email + password. After login, the user is redirected to a role-appropriate dashboard shell (empty placeholder content). Unauthenticated users are redirected to login. Build the app shell with role-based navigation: parent nav (Dashboard, Tasks, Family, Settings), admin nav (same + Rewards), child nav (Tasks, Shop, Profile, Settings). The base minimalist theme is applied and the child overlay is set up (even if child views are empty at this point). Component tests cover auth forms and route guards. E2E tests cover register → login → see dashboard.

### Acceptance criteria

- [ ] Vite + React + React Router + Shadcn + Tweakcn + Tailwind + TanStack Query project scaffolded in `frontend/`
- [ ] API client configured to call the FastAPI backend with JWT Bearer token
- [ ] JWT token stored in memory, attached to all API requests, cleared on logout
- [ ] Registration page: email, password, role selection (parent/child/admin) → calls `POST /api/auth/register`
- [ ] Login page: email, password → calls `POST /api/auth/login` → stores token → redirects to role dashboard
- [ ] Role-based navigation rendered after login (parent, child, admin each see appropriate nav items)
- [ ] Auth guard: unauthenticated access to protected routes redirects to login
- [ ] Dashboard shells (empty placeholders) for parent, child, and admin roles
- [ ] Base minimalist theme applied; child theme overlay structure in place
- [ ] Responsive layout works at mobile, tablet, and desktop breakpoints
- [ ] Component tests for login form, registration form, and auth guard
- [ ] E2E test: register as parent → login → see parent dashboard shell
- [ ] E2E test: register as child → login → see child dashboard shell

---

## Phase 2: Family Setup

**User stories**: 7, 8, 9, 10, 11, 12, 13

### What to build

Family creation and joining flow. When a parent has no family, they see a prompt to create one. Creating a family displays the generated PIN with a copy-to-clipboard button. The family management page lists all members with roles. The parent can remove a child from the family. When a child registers/logs in without a family, they see a "Join Family" screen with a PIN input. Entering a valid PIN joins the family; invalid PIN shows an error. Free tier limits are enforced visually — when the family hits max members, a clear upgrade prompt is shown instead of the join/add action. Component tests cover family creation form, PIN display, join form, and member list. E2E tests cover the full flow: parent creates family → child joins with PIN → parent sees child in member list.

### Acceptance criteria

- [ ] Parent without a family sees "Create Family" prompt
- [ ] Creating a family calls `POST /api/family/` and displays the generated PIN
- [ ] PIN has a copy-to-clipboard button with visual feedback
- [ ] Family management page lists all members with their roles via `GET /api/family/`
- [ ] Parent can remove a child from the family via `DELETE /api/family/members/{user_id}`
- [ ] Child without a family sees "Join Family" screen with PIN input
- [ ] Entering a valid PIN calls `POST /api/family/join` and joins the family
- [ ] Invalid PIN shows a clear error message
- [ ] Free tier limit reached → upgrade prompt shown (max 2 parents, 1 child)
- [ ] Component tests for family creation, PIN display, join form, member list
- [ ] E2E test: parent creates family → copies PIN → child joins → parent sees child in members

---

## Phase 3: Task Lifecycle

**User stories**: 14, 18, 19, 20, 22, 24

### What to build

Core task loop end-to-end. Parent view: a form to create a task (name, description, ExBucks value, assign to a specific child) and a list of tasks pending approval with approve/reject buttons. Child view: a list of assigned tasks for today with clear status indicators (assigned, accepted, completed, approved, rejected) and a button to mark a task as completed. When the parent approves, the task shows as done. When rejected, it returns to the child's list. Task status transitions are visually distinct. Component tests cover task creation form, task list, status badges, and approve/reject actions. E2E test: parent creates task → child sees it → child completes → parent approves.

### Acceptance criteria

- [ ] Parent can create a task via form: name, description, ExBucks value, child selector → `POST /api/tasks/`
- [ ] Parent sees a list of all tasks via `GET /api/tasks/` with status indicators
- [ ] Parent sees tasks pending approval and can approve (`PATCH /api/tasks/{id}/approve`) or reject (`PATCH /api/tasks/{id}/reject`)
- [ ] Child sees their assigned tasks via `GET /api/tasks/`
- [ ] Child can mark a task as completed via `PATCH /api/tasks/{id}/complete`
- [ ] Task status indicators are visually distinct: assigned → accepted → completed → approved/rejected
- [ ] Task list refreshes after status changes (TanStack Query invalidation)
- [ ] Component tests for task creation form, task list items, status badges, approve/reject buttons
- [ ] E2E test: parent creates task → child sees task → child completes → parent approves → task shows as done

---

## Phase 4: ExBucks Economy

**User stories**: 25, 26, 27, 28

### What to build

Wire ExBucks visibility into the UI. Child view: prominent ExBucks balance display (visible in header or top of main view) and a transaction history page showing all transactions (earned, spent, penalties) with type, amount, description, and timestamp. Parent view: ability to view transaction history per child and a penalty form to assign negative ExBucks with a reason. Balance updates are reflected immediately after task approval (from Phase 3) via TanStack Query cache invalidation. Component tests cover balance display, transaction list, and penalty form. E2E test: parent approves task → child balance increases → transaction appears in history. Parent assigns penalty → child balance decreases.

### Acceptance criteria

- [ ] Child sees ExBucks balance prominently displayed via `GET /api/exbucks/balance`
- [ ] Child sees transaction history via `GET /api/exbucks/transactions` with type, amount, description, timestamp
- [ ] Parent can view per-child transaction history via `GET /api/exbucks/transactions/{child_id}`
- [ ] Parent can assign a penalty via `POST /api/exbucks/penalty` with child selector and reason
- [ ] Balance and transaction history update immediately after task approval or penalty
- [ ] Component tests for balance display, transaction list, penalty form
- [ ] E2E test: parent approves task → child balance increases → parent assigns penalty → child balance decreases

---

## Phase 5: Reward Shop

**User stories**: 29, 30, 31, 32, 33, 34, 35, 36

### What to build

Admin view: a "Rewards" tab in navigation leading to a reward management page with a table of existing rewards and forms to create, edit, and delete rewards (name, description, ExBucks price). Child view: a reward catalog page showing all available rewards with prices, a purchase button per reward, and a purchase history page. Purchasing a reward deducts ExBucks instantly and shows in history. If balance is insufficient, the purchase button is disabled or shows a clear error. Parent view: a page showing all reward purchases across their children. Component tests cover reward CRUD forms, catalog display, purchase button states, and purchase history. E2E test: admin creates reward → child browses catalog → child purchases → balance deducted → parent sees purchase.

### Acceptance criteria

- [ ] Admin sees "Rewards" tab in navigation
- [ ] Admin can create a reward via `POST /api/rewards/` with name, description, price
- [ ] Admin can edit (`PATCH /api/rewards/{id}`) and delete (`DELETE /api/rewards/{id}`) rewards
- [ ] Child sees reward catalog via `GET /api/rewards/` with prices
- [ ] Child can purchase a reward via `POST /api/rewards/{id}/purchase` if balance sufficient
- [ ] Purchase blocked with clear message when balance is insufficient
- [ ] Child sees purchase history via `GET /api/rewards/purchases`
- [ ] Parent sees all children's purchases via `GET /api/rewards/purchases/{child_id}`
- [ ] ExBucks balance updates immediately after purchase
- [ ] Component tests for reward CRUD, catalog, purchase button, purchase history
- [ ] E2E test: admin creates reward → child purchases → balance deducted → parent sees purchase in history

---

## Phase 6: Weekly Plans & Task Controls

**User stories**: 15, 16, 17, 21, 23

### What to build

Extend the task module with weekly planning and full task controls. Parent view: when creating or editing a task, an optional day-of-week selector allows assigning tasks to specific days (Mon–Sun). Parent can edit any task field (name, description, value, assigned child, day) and delete tasks. Child view: tasks organized in a weekly view by day. Child can accept or reject an assigned task. Child on SizePass can attach a photo URL when completing a task. Component tests cover the day selector, weekly view layout, edit/delete actions, accept/reject flow, and photo attachment. E2E test: parent creates weekly tasks → child sees weekly view → child accepts/rejects → parent edits a task → child sees updated task.

### Acceptance criteria

- [ ] Task creation/edit form includes optional day-of-week selector
- [ ] Parent can edit any task via `PUT /api/tasks/{id}` (name, description, value, child, day)
- [ ] Parent can delete any task via `DELETE /api/tasks/{id}` with confirmation
- [ ] Child sees tasks organized by day in a weekly view
- [ ] Child can accept a task via `PATCH /api/tasks/{id}/accept`
- [ ] Child can reject a task via `PATCH /api/tasks/{id}/reject`
- [ ] Child on SizePass can provide a photo URL when completing a task
- [ ] Component tests for day selector, weekly view, edit/delete, accept/reject, photo input
- [ ] E2E test: parent creates weekly task → child sees it on correct day → child accepts → child completes → parent edits another task → child sees update

---

## Phase 7: Gamification — XP, Levels & Streaks

**User stories**: 37, 38, 39, 40

### What to build

Add gamification display to the child experience. Child view: current level number with title, XP count, a progress bar showing percentage to next level, current streak count, and a badges display showing earned badges. This data comes from `GET /api/gamification/profile`. The gamification info is visible both as a compact summary in the child's header/nav area and in expanded form. The progress bar and level display should feel rewarding — the youth-friendly theme overlay makes these elements visually engaging. Badges show as icons or cards with earned/locked state. Component tests cover level display, progress bar calculation, streak counter, and badge grid. E2E test: child completes tasks → XP increases → progress bar advances → level title updates.

### Acceptance criteria

- [ ] Child sees current level number and title via `GET /api/gamification/profile`
- [ ] Child sees total XP and XP needed for next level
- [ ] Progress bar shows accurate percentage to next level
- [ ] Streak count is visible and accurate
- [ ] Earned badges displayed (Freemium badge for Free users)
- [ ] Gamification summary visible in child's header/nav area
- [ ] Youth-friendly theme overlay makes gamification elements visually engaging
- [ ] Component tests for level display, progress bar, streak counter, badge grid
- [ ] E2E test: child has tasks approved → gamification profile reflects updated XP and level progress

---

## Phase 8: Player Profile

**User stories**: 42, 43

### What to build

A dedicated profile page for the child aggregating all progress data in one place. Shows level with title, XP with progress bar, current streak, all earned badges, and transaction/purchase history. The profile uses the youth-friendly theme overlay and feels rewarding to visit. Parent can view their child's profile page (same view, read-only). Accessible from the child's main navigation and from the parent's family/dashboard views. Component tests cover the profile page layout and data rendering. E2E test: child navigates to profile → sees all gamification data → parent navigates to child's profile → sees the same data.

### Acceptance criteria

- [ ] Child has a "Profile" link in navigation leading to their profile page
- [ ] Profile page displays level, title, XP, progress bar via `GET /api/profile/`
- [ ] Profile page displays streak count
- [ ] Profile page displays earned badges
- [ ] Profile page displays transaction history via `GET /api/exbucks/transactions`
- [ ] Parent can view child's profile via `GET /api/profile/{child_id}`
- [ ] Profile page uses the youth-friendly visual overlay
- [ ] Component tests for profile page layout and sections
- [ ] E2E test: child views own profile → parent views child's profile → data matches

---

## Phase 9: Parent Dashboard & Statistics

**User stories**: 44, 45

### What to build

Replace the parent's empty dashboard shell with a full statistics dashboard. The dashboard is the parent's landing page after login. It shows per-child cards with: percentage of tasks completed this week, current streak, total ExBucks earned and spent. Below the per-child cards, a weekly overview displays task completion across all children organized by day, making trends visible (e.g., which days are weakest). Data comes from `GET /api/dashboard`. The dashboard handles both single-child (Free) and multi-child (SizePass) families. Component tests cover stat cards, weekly overview grid, and data formatting. E2E test: parent logs in → sees dashboard with accurate per-child stats → approves a task → dashboard updates.

### Acceptance criteria

- [ ] Parent dashboard is the default landing page after login
- [ ] Dashboard shows per-child stats: % tasks completed, streak, ExBucks earned/spent via `GET /api/dashboard`
- [ ] Weekly overview shows task completion across all children by day
- [ ] Dashboard handles single-child and multi-child families
- [ ] Data refreshes when tasks are approved/rejected (TanStack Query invalidation)
- [ ] Component tests for stat cards, weekly overview, data formatting
- [ ] E2E test: parent logs in → dashboard shows stats → parent approves task → stats update

---

## Phase 10: SizePass & Feature Gating

**User stories**: 41, 46, 47, 48, 49

### What to build

Subscription status display and feature gating across the UI. Parent view: a subscription section in settings showing current plan status via `GET /api/subscription/`. Throughout the app, premium features are gated: when a Free user tries to access a SizePass feature (photo proof, leaderboard, advanced stats, extra badges), they see an upgrade prompt instead. Gated elements have a visual indicator (lock icon or badge). Child view (SizePass): sibling leaderboard page via `GET /api/leaderboard/`. Parent view (SizePass): advanced dashboard stats showing XP and level per child. The backend enforces the actual gate; the frontend provides the visual experience. Component tests cover upgrade prompts, gated element rendering, leaderboard, and subscription display. E2E test: Free family → user sees upgrade prompts → SizePass family → user sees premium features.

### Acceptance criteria

- [ ] Parent sees subscription status in settings via `GET /api/subscription/`
- [ ] Free users see upgrade prompts when accessing premium features
- [ ] Gated UI elements have visual indicators (lock icon or similar)
- [ ] Child on SizePass sees sibling leaderboard via `GET /api/leaderboard/`
- [ ] Parent on SizePass sees advanced stats (XP, level per child) on dashboard
- [ ] Photo proof input (Phase 6) is gated for Free users
- [ ] Badge unlocks at level milestones visible for SizePass users
- [ ] Component tests for upgrade prompts, gated elements, leaderboard, subscription display
- [ ] E2E test: Free user sees upgrade prompts on premium features → SizePass user sees leaderboard and advanced stats

---

## Phase 11: Account Management & GDPR

**User stories**: 50, 51, 52, 53, 54

### What to build

Account deletion flows accessible from settings. Parent view: delete a child's account from the family management page with a confirmation dialog warning about permanent data loss. Delete own account with a warning about cascading effects (if last parent, all family data is deleted). View and approve/deny pending deletion requests from children. Child view: request account deletion from settings. All destructive actions require a confirmation dialog with a clear warning that the action is irreversible. Component tests cover deletion buttons, confirmation dialogs, and deletion request list. E2E test: child requests deletion → parent sees request → parent approves → child account removed.

### Acceptance criteria

- [ ] Parent can delete a child's account via `DELETE /api/account/children/{child_id}` from family page
- [ ] Parent can delete own account via `DELETE /api/account/me` from settings
- [ ] Deletion of last parent shows warning about cascading family deletion
- [ ] Child can request deletion via `POST /api/account/deletion-requests` from settings
- [ ] Parent sees pending deletion requests via `GET /api/account/deletion-requests`
- [ ] Parent can approve deletion via `POST /api/account/deletion-requests/{id}/approve`
- [ ] All destructive actions show confirmation dialog with irreversibility warning
- [ ] After deletion, user is logged out and redirected to login
- [ ] Component tests for deletion buttons, confirmation dialogs, request list
- [ ] E2E test: child requests deletion → parent sees and approves → child account removed → parent's member list updated
