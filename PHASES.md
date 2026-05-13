# PrepTrack — Phase Tracker
> Junior developer yahan mark karta jaye. Har phase complete hone par `[ ]` ko `[x]` karo.

---

## How to Update

- `[ ]` = Not started
- `[~]` = In Progress (abhi chal raha hai)
- `[x]` = Done

**Current Phase:** Phase 2 — Authentication & Onboarding

---

## Progress Overview

| Phase | Name | Status | Start Date | Done Date |
|-------|------|--------|------------|-----------|
| 0  | Project Bootstrap & Infrastructure | `[~]` | 2026-05-09 | |
| 1  | Design System & Layout | `[~]` | 2026-05-09 | |
| 2  | Authentication & Onboarding | `[~]` | 2026-05-09 | |
| 3  | Syllabus Management | `[ ]` | | |
| 4  | Study Planner & Task Management | `[ ]` | | |
| 5  | Pomodoro & Study Sessions | `[ ]` | | |
| 6  | Notes System | `[ ]` | | |
| 7  | Key Notes & Spaced Repetition | `[ ]` | | |
| 8  | Resource & File Management | `[ ]` | | |
| 9  | Test & PYQ Tracker | `[ ]` | | |
| 10 | Current Affairs | `[ ]` | | |
| 11 | Long-term Roadmap | `[ ]` | | |
| 12 | Analytics Dashboard | `[ ]` | | |
| 13 | AI Assistant | `[ ]` | | |
| 14 | Notifications & Reminders | `[ ]` | | |
| 15 | Settings & Profile | `[ ]` | | |
| 16 | Testing, QA & Security | `[ ]` | | |
| 17 | Performance Optimization | `[ ]` | | |
| 18 | Production Deployment | `[ ]` | | |

---

## PHASE 0 — Project Bootstrap & Infrastructure
**Week 1 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 0

### Steps
- [x] **0.1** Node.js 20+, Git, VS Code installed
- [x] **0.2** Vite + React + TypeScript project created (`npm create vite@latest`)
- [x] **0.3** All npm dependencies installed (supabase, tanstack-query, zustand, tailwind, tiptap, recharts, etc.)
- [x] **0.4** Tailwind configured (`globals.css` with CSS variables for light + dark themes)
- [ ] **0.5** shadcn/ui initialized + all base components added
- [x] **0.6** Supabase client created (`src/lib/supabase.ts`)
- [ ] **0.7** TypeScript DB types generated (`src/lib/types/database.ts`)
- [x] **0.8** React Query + Zustand wired in `main.tsx`
- [x] **0.9** Basic routing shell (`App.tsx`, `authStore.ts`, `themeStore.ts`)
- [x] **0.10** `.env.local` filled with real Supabase URL + Anon Key from senior dev
- [ ] **0.11** GitHub repo created + code pushed
- [ ] **0.12** Vercel deployment working (app opens in browser)
- [x] **Project builds successfully** (`npm run build` passes)

### Notes / Blockers
```
✅ Build passes — 0 errors
✅ All dependencies installed
✅ CSS variables, light/dark themes configured
✅ Routing shell with auth guard and sidebar layout
⏳ shadcn/ui skipped per user request — using Tailwind CSS directly
⏳ DB types generation pending
```

**Phase 0 Status:** `[~]` In Progress

---

## PHASE 1 — Design System & Layout
**Week 2 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 1

### Steps
- [x] **1.1** `AppShell.tsx` — main layout wrapper (sidebar + topbar + outlet)
- [x] **1.2** `Sidebar.tsx` — navigation with all 10 links (Dashboard to Settings)
- [x] **1.3** Theme store (`themeStore.ts`) — light/dark/auto with CSS variable switching
- [x] **1.4** `Topbar.tsx` — search bar, theme toggle, notification bell, profile dropdown
- [x] **1.5** `EmptyState.tsx` component
- [ ] **1.6** `SkeletonList.tsx` component (simple — created when needed)
- [x] **1.7** `cn()` utility in `src/lib/utils.ts`
- [x] **1.8** `useKeyboardShortcuts.ts` hook (g+d, g+p, g+s, g+n, /)
- [x] **1.9** `Toaster` (sonner) wired in `main.tsx`

### Notes / Blockers
```
✅ All layout components created and wired
✅ Theme store with light/dark/auto + persistence
✅ Keyboard shortcuts active
✅ Toaster (sonner) wired globally
```

**Phase 1 Status:** `[~]` In Progress

---

## PHASE 2 — Authentication & Onboarding
**Weeks 3–4 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 2

### Steps
- [x] **2.1** Google OAuth enabled in Supabase Dashboard (senior dev step)
- [x] **2.2** `AuthPage.tsx` — two-panel layout (branding left, form right)
- [x] **2.3** `LoginForm.tsx` — email/password + Google OAuth button + "Forgot password?" link
- [x] **2.4** `SignupForm.tsx` — email/password signup + email verification message
- [x] **2.5** Password reset page (`ResetPasswordPage.tsx`) — request email + set new password
- [x] **2.6** Onboarding wizard `OnboardingPage.tsx` — progress bar + 7 steps
- [x] **2.7** Step 1: `WelcomeStep.tsx`
- [x] **2.8** Step 2: `ExamDateStep.tsx` — month-year picker
- [x] **2.9** Step 3: `OptionalSubjectStep.tsx` — 48 optional subjects with search
- [x] **2.10** Step 4: `ExamMediumStep.tsx` — 22 languages + English with search
- [x] **2.11** Step 5: `StudyTargetStep.tsx` — slider 4–14 hours
- [x] **2.12** Step 6: `WorkingHoursStep.tsx` — start/end time pickers with presets
- [x] **2.13** Step 7: `FamiliarityStep.tsx` — 1–5 star rating per subject
- [x] **2.14** Wizard saves all data to `profiles` table on finish
- [x] **2.15** Auto-generate starter roadmap phases (`generateRoadmap.ts`)
- [x] **2.16** Redirect logic: logged out → auth, no profile → onboarding, done → dashboard
- [ ] **2.17** Test: 2 different users sign up simultaneously — data stays separate ✓

### Files Created
```
src/pages/ResetPasswordPage.tsx
src/pages/OnboardingPage.tsx
src/components/auth/onboarding/WelcomeStep.tsx
src/components/auth/onboarding/ExamDateStep.tsx
src/components/auth/onboarding/OptionalSubjectStep.tsx
src/components/auth/onboarding/ExamMediumStep.tsx
src/components/auth/onboarding/StudyTargetStep.tsx
src/components/auth/onboarding/WorkingHoursStep.tsx
src/components/auth/onboarding/FamiliarityStep.tsx
src/lib/utils/generateRoadmap.ts
```

### Notes / Blockers
```
✅ All Phase 2 features implemented
✅ Password reset flow (request → email → set new password)
✅ 7-step onboarding wizard with progress bar
✅ OptionalSubjectStep + ExamMediumStep have fallback hardcoded lists
✅ Auto-generate roadmap on onboarding completion
✅ Redirect logic in App.tsx
✅ Build passes (0 errors, 0 TypeScript errors)
⏳ Supabase DB tables (profiles, roadmap_phases) must exist for runtime testing
```

**Phase 2 Status:** `[~]` Implementation complete — awaiting DB tables for runtime

---

## PHASE 3 — Syllabus Management
**Weeks 5–7 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 3

### Steps
- [ ] **3.1** Senior dev ne syllabus seed script run kar diya (confirm karo)
- [ ] **3.2** React Query hooks: `useSyllabusNodes()`, `useUserProgress()`, `useUpdateProgress()`
- [ ] **3.3** `SyllabusNodeRow.tsx` — recursive expandable tree row
- [ ] **3.4** Tree renders correctly for Prelims + Mains + all optionals
- [ ] **3.5** Status change works (Not Started → In Progress → Completed → Needs Revision)
- [ ] **3.6** Confidence stars (1–5) editable per node
- [ ] **3.7** `NodeDetailPanel.tsx` — sheet panel with all node details
- [ ] **3.8** Source mapping (add book/video/URL per node, stored in `node_sources`)
- [ ] **3.9** `completion.ts` utility — computes % rolled up at every level
- [ ] **3.10** Completion % visible on each parent node
- [ ] **3.11** Search + filter working (by status, confidence, subject)
- [ ] **3.12** `SyllabusPage.tsx` — two-panel layout (tree + detail)
- [ ] **3.13** Custom sub-topic add karna working

**Phase 3 Status:** `[ ]` Not Started

---

## PHASE 4 — Study Planner & Task Management
**Weeks 8–11 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 4

**Phase 4 Status:** `[ ]` Not Started

---

## PHASE 5 — Pomodoro & Study Sessions
**Week 12 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 5

**Phase 5 Status:** `[ ]` Not Started

---

## PHASE 6 — Notes System
**Weeks 13–14 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 6

**Phase 6 Status:** `[ ]` Not Started

---

## PHASE 7 — Key Notes & Spaced Repetition
**Weeks 15–16 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 7

**Phase 7 Status:** `[ ]` Not Started

---

## PHASE 8 — Resource & File Management
**Weeks 17–19 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 8

**Phase 8 Status:** `[ ]` Not Started

---

## PHASE 9 — Test & PYQ Tracker
**Weeks 20–21 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 9

**Phase 9 Status:** `[ ]` Not Started

---

## PHASE 10 — Current Affairs
**Weeks 22–23 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 10

**Phase 10 Status:** `[ ]` Not Started

---

## PHASE 11 — Long-term Roadmap
**Week 24 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 11

**Phase 11 Status:** `[ ]` Not Started

---

## PHASE 12 — Analytics Dashboard
**Weeks 25–27 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 12

**Phase 12 Status:** `[ ]` Not Started

---

## PHASE 13 — AI Assistant
**Weeks 28–30 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 13

**Phase 13 Status:** `[ ]` Not Started

---

## PHASE 14 — Notifications & Reminders
**Week 31 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 14

**Phase 14 Status:** `[ ]` Not Started

---

## PHASE 15 — Settings & Profile
**Week 32 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 15

**Phase 15 Status:** `[ ]` Not Started

---

*Last updated: 2026-05-09 by Junior Developer*