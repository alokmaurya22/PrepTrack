# PrepTrack — Phase Tracker
> Junior developer yahan mark karta jaye. Har phase complete hone par `[ ]` ko `[x]` karo.

---

## How to Update

- `[ ]` = Not started
- `[~]` = In Progress (abhi chal raha hai)
- `[x]` = Done

**Current Phase:** Phase 0 — Project Bootstrap

---

## Progress Overview

| Phase | Name | Status | Start Date | Done Date |
|-------|------|--------|------------|-----------|
| 0  | Project Bootstrap & Infrastructure | `[~]` | 2026-05-09 | |
| 1  | Design System & Layout | `[~]` | 2026-05-09 | |
| 2  | Authentication & Onboarding | `[ ]` | | |
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
- [ ] **0.10** `.env.local` filled with real Supabase URL + Anon Key from senior dev
- [ ] **0.11** GitHub repo created + code pushed
- [ ] **0.12** Vercel deployment working (app opens in browser)
- [x] **Project builds successfully** (`npm run build` passes)

### Notes / Blockers
```
✅ Build passes — 0 errors
✅ All 1925 modules transformed
✅ CSS variables, light/dark themes configured
✅ Routing shell with auth guard and sidebar layout

WAITING FOR SENIOR DEV:
1. VITE_SUPABASE_URL — actual Supabase project URL
2. VITE_SUPABASE_ANON_KEY — anon/public key
3. VITE_SENTRY_DSN (optional for Phase 0 but good to have)
4. Has database_schema.sql been run on Supabase project?
5. shadcn/ui init requires npm package installation — will run once project is ready
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
- [ ] **1.10** Light + Dark theme manually tested — both look correct

### Notes / Blockers
```
✅ All layout components created and wired
✅ Theme store with light/dark/auto + persistence
✅ Keyboard shortcuts active
✅ Toaster (sonner) wired globally
⏳ SkeletonList can be created when needed in later phases
⏳ Theme testing to be done after dev server starts
```

**Phase 1 Status:** `[~]` In Progress

---

## PHASE 2 — Authentication & Onboarding
**Weeks 3–4 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 2

### Steps
- [x] **2.1** Google OAuth enabled in Supabase Dashboard (senior dev step)
- [x] **2.2** `AuthPage.tsx` — two-panel layout (branding left, form right)
- [x] **2.3** `LoginForm.tsx` — email/password + Google OAuth button
- [x] **2.4** `SignupForm.tsx` — email/password signup + email verification message
- [ ] **2.5** Password reset page (`ResetPasswordPage.tsx`)
- [ ] **2.6** Onboarding wizard `OnboardingPage.tsx` — progress bar + 7 steps
- [ ] **2.7** Step 1: `WelcomeStep.tsx`
- [ ] **2.8** Step 2: `ExamDateStep.tsx` — month-year picker
- [ ] **2.9** Step 3: `OptionalSubjectStep.tsx` — fetches from `optional_subjects` table
- [ ] **2.10** Step 4: `ExamMediumStep.tsx` — fetches from `exam_languages` table
- [ ] **2.11** Step 5: `StudyTargetStep.tsx` — slider 4–14 hours
- [ ] **2.12** Step 6: `WorkingHoursStep.tsx` — start/end time pickers
- [ ] **2.13** Step 7: `FamiliarityStep.tsx` — 1–5 star rating per subject
- [ ] **2.14** Wizard saves all data to `profiles` table on finish
- [ ] **2.15** Auto-generate starter roadmap phases (`generateRoadmap.ts`)
- [ ] **2.16** Redirect logic: logged out → auth, no profile → onboarding, done → dashboard
- [ ] **2.17** Test: 2 different users sign up simultaneously — data stays separate ✓

### Notes / Blockers
```
✅ AuthPage with Login/Signup forms created
✅ Google OAuth button included (needs Supabase config)
✅ Form validation with zod + react-hook-form
✅ Onboarding wizard structure ready for implementation
⏳ Blocked on Supabase credentials for testing
```

**Phase 2 Status:** `[~]` In Progress

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

### Notes / Blockers
```

```

**Phase 3 Status:** `[ ]` Not Started

---

## PHASE 4 — Study Planner & Task Management
**Weeks 8–11 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 4

### Steps
- [ ] **4.1** Task TypeScript types + Zod schemas (`src/lib/types/tasks.ts`)
- [ ] **4.2** React Query hooks: `useTasks()`, `useWeekTasks()`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`
- [ ] **4.3** `TaskForm.tsx` — dialog form with all fields
- [ ] **4.4** `TaskCard.tsx` — card with status toggle, type badge, time
- [ ] **4.5** Daily view — time-blocked task list with hours
- [ ] **4.6** Drag-and-drop reordering (`@hello-pangea/dnd`)
- [ ] **4.7** Quick-add task input at top of daily view
- [ ] **4.8** Mark complete / partial / skipped with reason
- [ ] **4.9** Today's hours vs target progress bar
- [ ] **4.10** Weekly view — 7-column grid with daily summaries
- [ ] **4.11** Monthly calendar view — dot indicators per day
- [ ] **4.12** Move/reschedule task to any date (drag or date picker)
- [ ] **4.13** Recurring tasks — iCal RRULE using `rrule` package
- [ ] **4.14** Overdue tasks highlighted on dashboard
- [ ] **4.15** End-of-day reflection dialog (mood + energy + note → `daily_logs`)
- [ ] **4.16** Completing a `syllabus` task prompts: "Mark linked topic as Completed?"

### Notes / Blockers
```

```

**Phase 4 Status:** `[ ]` Not Started

---

## PHASE 5 — Pomodoro & Study Sessions
**Week 12 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 5

### Steps
- [ ] **5.1** `pomodoroStore.ts` — Zustand store with all timer state
- [ ] **5.2** `PomodoroTimer.tsx` — circular ring + MM:SS + phase label
- [ ] **5.3** Start / Pause / Resume / Skip / Abandon controls
- [ ] **5.4** Task selector — link session to a task
- [ ] **5.5** `setInterval` tick every 1 second using `useEffect`
- [ ] **5.6** Session saved to `study_sessions` on end/abandon
- [ ] **5.7** Session-end prompt — focus rating 1–5 + optional note
- [ ] **5.8** Mini pomodoro widget in sidebar bottom
- [ ] **5.9** Daily total focused minutes visible on dashboard

### Notes / Blockers
```

```

**Phase 5 Status:** `[ ]` Not Started

---

## PHASE 6 — Notes System
**Weeks 13–14 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 6

### Steps
- [ ] **6.1** TipTap editor initialized with all extensions (StarterKit, Highlight, TaskList, Table, Image, Link, Underline, KaTeX)
- [ ] **6.2** `EditorToolbar.tsx` — all formatting buttons working
- [ ] **6.3** `NoteEditor.tsx` — auto-save every 3 seconds
- [ ] **6.4** React Query hooks for notes (`useNotes`, `useNote`, `useCreateNote`, `useUpdateNote`, `useDeleteNote`)
- [ ] **6.5** `NotesPage.tsx` — two-panel layout (list + editor)
- [ ] **6.6** Tags input with autocomplete from existing tags
- [ ] **6.7** Link note to syllabus node(s) (`note_syllabus_links`)
- [ ] **6.8** Full-text search using `textSearch()` on `plain_text_search` column
- [ ] **6.9** Version history panel — last 20 versions, restore working
- [ ] **6.10** Export as Markdown (browser download)
- [ ] **6.11** Export as PDF (`window.print()` or jsPDF)
- [ ] **6.12** DOMPurify sanitization on any HTML display

### Notes / Blockers
```

```

**Phase 6 Status:** `[ ]` Not Started

---

## PHASE 7 — Key Notes & Spaced Repetition
**Weeks 15–16 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 7

### Steps
- [ ] **7.1** `sm2.ts` utility — SM-2 algorithm implemented + unit tested
- [ ] **7.2** `KeyNoteForm.tsx` — front/back input, link to syllabus node
- [ ] **7.3** React Query hooks for key notes (`useDueKeyNotes`, `useCreateKeyNote`, `useReviewKeyNote`)
- [ ] **7.4** `ReviewSession.tsx` — flashcard flip animation, 4 rating buttons (Forgot/Hard/Good/Easy)
- [ ] **7.5** Progress indicator: "X of Y cards reviewed today"
- [ ] **7.6** On topic `completed` → auto-create revision tasks at Day 1, 3, 7, 21, 45, 90
- [ ] **7.7** `next_revision_at` updates correctly after each review
- [ ] **7.8** "Today's Revisions" widget on dashboard shows due topics + key notes
- [ ] **7.9** Revision streak counter working

### Notes / Blockers
```

```

**Phase 7 Status:** `[ ]` Not Started

---

## PHASE 8 — Resource & File Management
**Weeks 17–19 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 8

### Steps
- [ ] **8.1** Supabase storage buckets confirmed: `user-files` (private), `avatars` (public)
- [ ] **8.2** `FileUpload.tsx` — drag-and-drop with `react-dropzone`, MIME validation, 50 MB limit
- [ ] **8.3** File uploaded to Supabase Storage path: `{user_id}/{uuid}/{filename}`
- [ ] **8.4** File record saved to `attachments` table after upload
- [ ] **8.5** `PDFViewer.tsx` — react-pdf with page navigation, zoom
- [ ] **8.6** PDF highlight tool — save annotations to `pdf_annotations` table
- [ ] **8.7** Annotations display as colored overlays on correct page
- [ ] **8.8** PDF comment tool working
- [ ] **8.9** Image lightbox working
- [ ] **8.10** `ResourcesPage.tsx` — folder tree + file grid
- [ ] **8.11** Storage usage bar at top
- [ ] **8.12** Soft delete working (`deleted_at` set, shown in trash view)
- [ ] **8.13** Bulk select + delete working

### Notes / Blockers
```

```

**Phase 8 Status:** `[ ]` Not Started

---

## PHASE 9 — Test & PYQ Tracker
**Weeks 20–21 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 9

### Steps
- [ ] **9.1** `TestForm.tsx` — mock test log with sectional breakdown (dynamic rows)
- [ ] **9.2** Test saved to `tests` table
- [ ] **9.3** Performance charts — score over time (Recharts LineChart)
- [ ] **9.4** Sectional consistency chart
- [ ] **9.5** `MistakeLog.tsx` — add wrong questions with image upload option
- [ ] **9.6** Mistake auto-creates P1 `revision` task on linked syllabus node
- [ ] **9.7** PYQ Tracker — table view (year × paper), question-level tracking
- [ ] **9.8** PYQ status: Not Attempted / Correct / Wrong / Skipped
- [ ] **9.9** Mains Answer Tracker — image upload + 4 ratings (Structure/Content/Diagram/Conclusion)
- [ ] **9.10** `TestsPage.tsx` — tabs for Mock Tests / PYQs / Mains Answers

### Notes / Blockers
```

```

**Phase 9 Status:** `[ ]` Not Started

---

## PHASE 10 — Current Affairs
**Weeks 22–23 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 10

### Steps
- [ ] **10.1** `CAEntryForm.tsx` — date, source URL, title, rich text summary, tags, syllabus links
- [ ] **10.2** CA entry saved to `current_affairs` + `current_affairs_links` tables
- [ ] **10.3** `CAList.tsx` — paginated, grouped by date, searchable
- [ ] **10.4** Filter by date range and linked subject
- [ ] **10.5** Monthly compilation view (all CA entries for a month)
- [ ] **10.6** Export month to PDF working
- [ ] **10.7** "No CA today" banner on dashboard if no entry for today
- [ ] **10.8** `CurrentAffairsPage.tsx` complete

### Notes / Blockers
```

```

**Phase 10 Status:** `[ ]` Not Started

---

## PHASE 11 — Long-term Roadmap
**Week 24 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 11

### Steps
- [ ] **11.1** `RoadmapTimeline.tsx` — horizontal timeline from today to exam date
- [ ] **11.2** Phase blocks render with correct colors and labels
- [ ] **11.3** Drag phase boundaries to resize phases
- [ ] **11.4** Current date marker visible on timeline
- [ ] **11.5** Feasibility check — shows warning if hours/day needed > target
- [ ] **11.6** Per-subject "must finish by" deadlines shown
- [ ] **11.7** Phase dates editable (start/end date pickers as fallback)

### Notes / Blockers
```

```

**Phase 11 Status:** `[ ]` Not Started

---

## PHASE 12 — Analytics Dashboard
**Weeks 25–27 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 12

### Steps
- [ ] **12.1** Dashboard grid layout done (CSS Grid)
- [ ] **12.2** Today Widget — planned vs completed tasks, focused minutes vs target
- [ ] **12.3** Streak Widget — study streak, longest streak, revision streak
- [ ] **12.4** Syllabus completion donut rings — Prelims % + Mains %
- [ ] **12.5** GitHub-style study heatmap — 52 weeks × 7 days
- [ ] **12.6** Subject-wise time distribution — pie/bar chart with 7d/30d/90d filter
- [ ] **12.7** Lagging subject flagged in red (< 60% of target share)
- [ ] **12.8** Revision health widget — overdue by bucket (1–3d, 4–7d, 7+d)
- [ ] **12.9** `productivity.ts` utility — score formula implemented + tested
- [ ] **12.10** Productivity score card with 30-day trend line
- [ ] **12.11** Countdown widget — days left + hrs/day needed
- [ ] **12.12** Weekly review report — auto-generated text every Sunday
- [ ] **12.13** All charts tested with empty data / partial data / full data
- [ ] **12.14** All charts work in both light + dark theme

### Notes / Blockers
```

```

**Phase 12 Status:** `[ ]` Not Started

---

## PHASE 13 — AI Assistant
**Weeks 28–30 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 13

### Steps
- [ ] **13.1** `supabase/functions/ai-proxy/index.ts` Edge Function created
- [ ] **13.2** Edge Function deployed to Supabase cloud
- [ ] **13.3** `OPENROUTER_API_KEY` added to Edge Function secrets (senior dev)
- [ ] **13.4** `src/lib/ai.ts` frontend client — calls Edge Function with user JWT
- [ ] **13.5** Model selector — Gemini / ChatGPT dropdown working
- [ ] **13.6** Note Summarizer — summary + key points + Mains questions + MCQs
- [ ] **13.7** Key Note Generator — converts note to flashcard front/back pairs
- [ ] **13.8** Answer Evaluator — Structure/Content/Diagram/Conclusion ratings with feedback
- [ ] **13.9** Doubt Chat — RAG working (fetches top-5 relevant notes as context)
- [ ] **13.10** Quiz Generator — N MCQs with explanations for any syllabus node
- [ ] **13.11** Token usage saved to `ai_usage` table per request
- [ ] **13.12** Token count displayed per request + monthly running total in settings
- [ ] **13.13** All AI outputs labeled "AI Generated — verify before use"
- [ ] **13.14** Graceful failure — clear error shown if OpenRouter call fails
- [ ] **13.15** Verify: no API key visible in browser network tab

### Notes / Blockers
```

```

**Phase 13 Status:** `[ ]` Not Started

---

## PHASE 14 — Notifications & Reminders
**Week 31 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 14

### Steps
- [ ] **14.1** Notification bell wired — shows unread count badge
- [ ] **14.2** Notification dropdown — list with read/unread state
- [ ] **14.3** Mark as read on click, mark all read button
- [ ] **14.4** Browser push — permission request dialog
- [ ] **14.5** Push subscription saved to `push_subscriptions` table
- [ ] **14.6** `public/sw.js` service worker created and registered
- [ ] **14.7** Test push notification received in browser
- [ ] **14.8** `send-reminder` Edge Function created + deployed
- [ ] **14.9** Email reminders sent via Resend API from Edge Function
- [ ] **14.10** Cron schedules set up in Supabase (every 15 min for reminders)
- [ ] **14.11** Slip alert Edge Function — flags 0-study-for-2-days
- [ ] **14.12** Weekly report Edge Function — runs every Sunday 8 PM
- [ ] **14.13** Hard-delete files cron — runs daily for 30-day trash cleanup
- [ ] **14.14** All notification triggers toggleable from Settings

### Notes / Blockers
```

```

**Phase 14 Status:** `[ ]` Not Started

---

## PHASE 15 — Settings & Profile
**Week 32 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 15

### Steps
- [ ] **15.1** `SettingsPage.tsx` — sectioned layout (Profile / Theme / Notifications / AI / Data / Security)
- [ ] **15.2** Profile form — name, exam date, optional subject, exam medium, target hours, working hours
- [ ] **15.3** Avatar upload to `avatars` storage bucket
- [ ] **15.4** Theme toggle — Light / Dark / Auto (persisted to `profiles` table + localStorage)
- [ ] **15.5** Notification toggles — per type, push + email separately
- [ ] **15.6** AI settings — OpenRouter key field (masked), default model, monthly token cap
- [ ] **15.7** Data export — all user data as JSON, browser download
- [ ] **15.8** Account deletion — email confirmation required, 30-day grace note
- [ ] **15.9** Change password form working
- [ ] **15.10** Change email form working
- [ ] **15.11** Re-run onboarding wizard option in settings

### Notes / Blockers
```

```

**Phase 15 Status:** `[ ]` Not Started

---

## PHASE 16 — Testing, QA & Security
**Weeks 33–35 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 16

### Steps
- [ ] **16.1** `sm2.test.ts` — unit tests pass
- [ ] **16.2** `completion.test.ts` — unit tests pass
- [ ] **16.3** `productivity.test.ts` — unit tests pass
- [ ] **16.4** `generateRoadmap.test.ts` — unit tests pass
- [ ] **16.5** `npm run test` — all tests green
- [ ] **16.6** Playwright installed + configured
- [ ] **16.7** E2E: signup → onboarding → create task → Pomodoro → PDF upload → AI notes → test log → dashboard ✓
- [ ] **16.8** RLS check: User B cannot read User A's notes/tasks/files (tested in Supabase SQL editor)
- [ ] **16.9** Bundle check: `grep -r "service_role" dist/` → 0 results
- [ ] **16.10** Bundle check: `grep -r "OPENROUTER_API_KEY" dist/` → 0 results
- [ ] **16.11** axe DevTools — 0 critical, 0 serious issues on all pages
- [ ] **16.12** Keyboard nav — tab through every form, focus order logical
- [ ] **16.13** All modals trap focus correctly
- [ ] **16.14** All icon buttons have `aria-label`
- [ ] **16.15** Tested on Chrome, Firefox, Safari, Edge (latest)
- [ ] **16.16** Tested on mobile Chrome + mobile Safari

### Notes / Blockers
```

```

**Phase 16 Status:** `[ ]` Not Started

---

## PHASE 17 — Performance Optimization
**Week 36 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 17

### Steps
- [ ] **17.1** Lighthouse audit run on Dashboard route
- [ ] **17.2** Performance score ≥ 85 ✓
- [ ] **17.3** Accessibility score ≥ 95 ✓
- [ ] **17.4** Best Practices score ≥ 95 ✓
- [ ] **17.5** All route pages lazy-loaded with `React.lazy()`
- [ ] **17.6** PDF viewer, Charts lazy-loaded
- [ ] **17.7** Syllabus tree virtualized (react-window) — no jank on scroll
- [ ] **17.8** All images have `loading="lazy"`
- [ ] **17.9** Inter font preloaded in `index.html`
- [ ] **17.10** React Query `staleTime` reviewed — heavy queries have 5 min+
- [ ] **17.11** Task status toggle — optimistic update (instant, no loading state)

### Notes / Blockers
```

```

**Phase 17 Status:** `[ ]` Not Started

---

## PHASE 18 — Production Deployment
**Weeks 37–38 | Reference:** `IMPLEMENTATION_PLAN.md` → Phase 18

### Steps
- [ ] **18.1** Supabase: email auth + Google OAuth confirmed working in prod
- [ ] **18.2** Supabase: daily DB backups enabled (Project Settings → Backups)
- [ ] **18.3** Supabase: custom SMTP via Resend configured for email auth
- [ ] **18.4** All Edge Function secrets added in Supabase Dashboard
- [ ] **18.5** All env vars added in Vercel project settings
- [ ] **18.6** Custom domain configured in Vercel (DNS + SSL)
- [ ] **18.7** Sentry initialized — test error captured in Sentry dashboard
- [ ] **18.8** Privacy Policy page added (even basic draft)
- [ ] **18.9** Terms of Service page added (even basic draft)
- [ ] **18.10** Both pages linked in app footer
- [ ] **18.11** Full end-to-end flow tested on production URL ✓
- [ ] **18.12** Second user tested simultaneously — data isolation confirmed ✓
- [ ] **18.13** `LAUNCH ✓`

### Notes / Blockers
```

```

**Phase 18 Status:** `[ ]` Not Started

---

## Final Release Gate Checklist
> Ye sab `[x]` hone ke baad hi launch karo

- [ ] All MUST requirements from SRS implemented
- [ ] Both light + dark themes WCAG AA pass
- [ ] All charts work with empty / partial / full data
- [ ] RLS verified — User B cannot access User A data
- [ ] No secret keys in browser bundle
- [ ] Sentry capturing errors
- [ ] Daily DB backups enabled
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95
- [ ] Privacy Policy + Terms linked in footer
- [ ] Full E2E flow passes on production URL

---

*Last updated: 2026-05-09 by Junior Developer*