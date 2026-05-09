# PrepTrack — Software Requirements Document (SRD)

**Project Name:** PrepTrack
**Document Type:** Software Requirements Specification
**Version:** 1.0
**Status:** Final — Ready for Implementation
**Audience:** Software engineers, product designers, QA, project managers

---

## 1. Document Purpose

This document is the single source of truth for building **PrepTrack**, a web application for UPSC Civil Services aspirants. It captures the product vision, every functional and non-functional requirement, the tech stack, the database design, integration points, security model, UI/UX expectations, and acceptance criteria. The engineer(s) implementing this project should be able to plan sprints, estimate effort, and ship the full product without re-asking the product owner for missing information.

The product will ship as a **single full launch** — no phased MVP. Every module described in section 6 must be present, working, and tested at v1.0 release.

---

## 2. Product Vision

UPSC preparation is a 1.5–2 year ultra-marathon with a syllabus that runs into thousands of sub-topics across Prelims, Mains, and Interview. Most aspirants juggle five different tools — a paper diary for the plan, Google Drive for PDFs, sticky notes for revision, an Excel sheet for test scores, and a phone gallery for handwritten answer photos. They lose time to coordination instead of studying.

**PrepTrack is a single web application that replaces all of those tools.** It gives the aspirant one place to map the full UPSC syllabus, plan daily/weekly/monthly study, track every topic's progress and revision cycle, store and search notes and resources, log tests and current affairs, and see honest, data-driven feedback on whether they are on track for their target attempt year.

---

## 3. Target User

- **Primary:** Full-time UPSC aspirants (no job, dedicated study).
- **Exam stages covered:** Prelims (GS + CSAT), Mains (GS1–4, Essay, Optional, Compulsory languages), Interview/Personality Test.
- **Optional subjects:** All 48 official UPSC optionals must be supported.
- **Languages:** All 22 scheduled languages of India must be selectable as the medium / optional language paper. (UI itself is English only — see section 12.)
- **Device profile:** Modern desktop / laptop browser. Mobile-friendly responsive layout, but native mobile app and PWA install are out of scope for v1.0.

---

## 4. Goals and Success Criteria

| # | Goal | Measurable Success Criterion |
|---|------|------------------------------|
| G1 | Replace paper-diary planning | A user can create, complete, and review a daily plan end-to-end in under 90 seconds |
| G2 | Give honest progress visibility | Syllabus completion % is computed live and visible from the dashboard within one click |
| G3 | Prevent revision misses | Every completed topic is automatically scheduled into a spaced-repetition revision queue |
| G4 | Centralize all resources | Notes, PDFs, images, and audio can be uploaded against any topic; full-text search returns results across every note in under 2 seconds |
| G5 | Surface lag early | The dashboard flags any subject whose actual study hours fall below 70 % of planned hours for a rolling 7-day window |
| G6 | AI-assisted prep | The aspirant can generate summaries, key points, and likely Mains questions from any uploaded PDF or pasted text using either Gemini or ChatGPT (selectable) |

---

## 5. Scope

### 5.1 In-Scope (v1.0)
- Full feature set listed in section 6.
- Web (responsive) — Chrome, Edge, Firefox, Safari (latest two major versions each).
- English UI with light + dark theme toggle.
- All 48 UPSC optional subjects pre-seeded.
- All 22 scheduled languages selectable.
- AI assistant powered by OpenRouter (user can pick Gemini or ChatGPT per request).

### 5.2 Out-of-Scope (v1.0 — planned for later)
- Progressive Web App (PWA) installation and offline mode.
- Native mobile apps (iOS / Android).
- Multi-user features: study groups, peer answer review, mentor mode.
- Payment / subscription (the product is a single-tenant build for now; pricing is not a concern).
- Localized UI in regional languages.

---

## 6. Functional Requirements

Each requirement carries an ID (FR-x.y.z) for traceability. Requirements marked **[MUST]** are required for v1.0; **[SHOULD]** are strongly recommended; **[MAY]** are nice-to-have.

### 6.1 Authentication & Onboarding

- **FR-6.1.1 [MUST]** Email + password signup and login via Supabase Auth.
- **FR-6.1.2 [MUST]** Google OAuth login via Supabase Auth.
- **FR-6.1.3 [MUST]** Password reset flow over email.
- **FR-6.1.4 [MUST]** Email verification on signup.
- **FR-6.1.5 [MUST]** Session persistence with refresh tokens; auto-logout after 30 days of inactivity.
- **FR-6.1.6 [MUST]** First-run onboarding wizard, max 7 steps:
  1. Welcome screen.
  2. Target exam attempt year (Prelims month-year picker; defaults to next May).
  3. Optional subject (single-select from full list of 48).
  4. Medium of writing the exam (single-select from 22 scheduled languages + English).
  5. Daily study target hours (slider 4–14, default 8).
  6. Working hours window (start / end times — used so the planner doesn't schedule study at 3 AM).
  7. Quick syllabus self-assessment: rate familiarity 1–5 per top-level subject.
- **FR-6.1.7 [MUST]** On wizard completion, auto-generate a starter long-term roadmap (see section 6.4) and land the user on the dashboard.
- **FR-6.1.8 [SHOULD]** Allow re-running the onboarding wizard later from Settings.

### 6.2 Syllabus Management

The syllabus is the foundation that every other module references.

- **FR-6.2.1 [MUST]** Pre-seeded hierarchical syllabus tree:
  ```
  Stage → Paper → Subject → Unit/Theme → Topic → Sub-topic
  ```
  covering Prelims (GS + CSAT), Mains (GS1, GS2, GS3, GS4, Essay, Compulsory English, Compulsory Indian Language for all 22 scheduled languages, Optional Paper 1 & 2 for all 48 optionals).
- **FR-6.2.2 [MUST]** Per-leaf node (sub-topic) status: `Not Started`, `In Progress`, `Completed`, `Needs Revision`.
- **FR-6.2.3 [MUST]** Per-leaf node confidence rating, integer 1–5 stars, editable any time.
- **FR-6.2.4 [MUST]** Per-leaf node estimated study hours (system default + user override).
- **FR-6.2.5 [MUST]** Per-node source mapping: user can attach books / videos / URLs (e.g., "Laxmikanth Ch 5", "StudyIQ playlist").
- **FR-6.2.6 [MUST]** Search and filter: by subject, status, confidence ≤ N, last-revised before date, has-notes, has-attachments.
- **FR-6.2.7 [MUST]** Computed completion percentage rolled up at every level (sub-topic → topic → unit → subject → paper → stage → overall). Re-computed on every status change.
- **FR-6.2.8 [MUST]** Tree view with collapsible nodes; clicking any node opens a detail panel showing description, sources, linked notes, attachments, linked tasks, revision history.
- **FR-6.2.9 [SHOULD]** Heatmap view: subject-by-subject grid colored by completion × confidence to show strengths/weaknesses at a glance.
- **FR-6.2.10 [MUST]** User can add custom sub-topics under any node (in case the official syllabus needs personal extension).

### 6.3 Study Planner — Daily / Weekly / Monthly

- **FR-6.3.1 [MUST]** Daily view: agenda for today with time-blocked tasks (e.g., 06:00–08:00 → Polity Ch 4).
- **FR-6.3.2 [MUST]** Drag-and-drop to reorder tasks within a day.
- **FR-6.3.3 [MUST]** Quick-add task input on every view.
- **FR-6.3.4 [MUST]** Mark task complete / partial / skipped, with optional reason note.
- **FR-6.3.5 [MUST]** End-of-day reflection prompt: summary of completed vs pending, mood (1–5), energy (1–5), free-text note.
- **FR-6.3.6 [MUST]** Weekly view: 7-day grid; weekly goals editable at top; weekly review summary at end (planned vs actual hours, completion %, carry-overs auto-suggested).
- **FR-6.3.7 [MUST]** Monthly view: full month calendar with milestone markers (test dates, topic deadlines, revision windows). Month-end report.
- **FR-6.3.8 [MUST]** Move/reschedule any task to any future date.
- **FR-6.3.9 [SHOULD]** Bulk actions: select multiple tasks → reschedule, mark done, delete.
- **FR-6.3.10 [MUST]** Recurring tasks (daily / weekdays / weekly / monthly).

### 6.4 Long-term Roadmap

- **FR-6.4.1 [MUST]** User sets a target Prelims exam date during onboarding (changeable later).
- **FR-6.4.2 [MUST]** System auto-generates phases: Foundation (1st syllabus reading) → Consolidation (2nd reading + notes) → Revision Round 1 → Revision Round 2 → Test Series + Answer Writing → Final 60 Days.
- **FR-6.4.3 [MUST]** User can drag phase boundaries on a timeline to adjust durations.
- **FR-6.4.4 [MUST]** System computes whether remaining syllabus + revision fits in the remaining time given the user's daily target hours; flags red if not.
- **FR-6.4.5 [MUST]** User can set per-subject "must finish by" deadlines that show on the calendar.

### 6.5 Task Management

- **FR-6.5.1 [MUST]** Task types: `Syllabus`, `Revision`, `Test/PYQ`, `Answer Writing`, `Current Affairs`, `Custom`.
- **FR-6.5.2 [MUST]** Task fields: title, description (rich text), linked syllabus node (optional), type, target date, target time-block, estimated minutes, actual minutes, priority (P1/P2/P3), status, attachments, recurrence rule, reminder time, parent task (for sub-tasks).
- **FR-6.5.3 [MUST]** Sub-tasks (one level deep is enough for v1.0).
- **FR-6.5.4 [MUST]** A task with no linked syllabus node is allowed (custom personal tasks).
- **FR-6.5.5 [MUST]** Marking a `Syllabus` task complete prompts: "Mark linked sub-topic as Completed?" with a one-click yes.
- **FR-6.5.6 [MUST]** Tasks can be set against an entire subject ("finish Polity") or a specific sub-topic ("Article 14–18"); system supports both granularities.
- **FR-6.5.7 [MUST]** Overdue tasks highlighted on the dashboard.

### 6.6 Pomodoro & Study Sessions

- **FR-6.6.1 [MUST]** Built-in focus timer. Defaults: 25 min focus / 5 min break / 15 min long break every 4 cycles. User-customizable.
- **FR-6.6.2 [MUST]** Start a session against a specific task; duration logged automatically into `study_sessions`.
- **FR-6.6.3 [MUST]** Pause / resume / abandon controls.
- **FR-6.6.4 [MUST]** Session-end prompt: focus self-rating 1–5, optional note.
- **FR-6.6.5 [MUST]** Daily total focused minutes feed into analytics (section 6.12).

### 6.7 Notes & Key Notes

- **FR-6.7.1 [MUST]** Rich-text editor (TipTap recommended) supporting: headings H1–H4, bold/italic/underline/strike, bullet/numbered/checkbox lists, blockquotes, code blocks, tables, inline images, links, math equations (KaTeX), highlighting in 4 colors.
- **FR-6.7.2 [MUST]** Each note links to one or more syllabus nodes.
- **FR-6.7.3 [MUST]** Tags (free-form, autocomplete on existing tags).
- **FR-6.7.4 [MUST]** Full-text search across all notes; results show snippet with the match highlighted.
- **FR-6.7.5 [MUST]** Auto-save every 3 seconds while editing.
- **FR-6.7.6 [MUST]** Version history: last 20 versions per note, restorable.
- **FR-6.7.7 [MUST]** Export note → PDF, Markdown.
- **FR-6.7.8 [MUST]** **Key Notes** = flashcard-style short summaries. Front/back format. Linked to a syllabus node. Used by the spaced-repetition engine (section 6.9).
- **FR-6.7.9 [MUST]** Generate Key Notes from a long note using AI assistant (section 6.13).

### 6.8 Resource & File Management

- **FR-6.8.1 [MUST]** Upload files: PDF, DOCX, PPTX, JPG/PNG/WEBP, MP3/M4A. Per-file max 50 MB. Per-user storage cap = Supabase quota; UI shows usage bar.
- **FR-6.8.2 [MUST]** Each file links to a syllabus node, a task, a note, or stands alone in user-defined folders.
- **FR-6.8.3 [MUST]** In-app PDF viewer with: zoom, search, page navigation, highlight (4 colors), text comments per page. Annotations stored in DB, not in the PDF.
- **FR-6.8.4 [MUST]** Image lightbox viewer.
- **FR-6.8.5 [MUST]** File metadata: name, size, type, uploaded date, tags, linked entity, AI-summary (optional, on-demand).
- **FR-6.8.6 [MUST]** Bulk upload (drag multiple files at once).
- **FR-6.8.7 [MUST]** Delete file → soft delete with 30-day trash before permanent removal.

### 6.9 Revision Engine (Spaced Repetition)

- **FR-6.9.1 [MUST]** When a sub-topic is marked `Completed`, system auto-schedules revision events at Day 1, 3, 7, 21, 45, 90 from completion date.
- **FR-6.9.2 [MUST]** Each Key Note is reviewed via the SM-2 algorithm: ease factor and next-review date adjust based on user rating after each review.
- **FR-6.9.3 [MUST]** "Today's Revisions" section on the dashboard lists all topics + Key Notes due.
- **FR-6.9.4 [MUST]** After a revision, user rates: `Forgot` / `Hard` / `Good` / `Easy`. The next interval is computed accordingly.
- **FR-6.9.5 [MUST]** A topic in `Needs Revision` status surfaces above default scheduling.
- **FR-6.9.6 [MUST]** Revision streak counter (consecutive days with at least one revision completed).

### 6.10 Test & PYQ Tracker

- **FR-6.10.1 [MUST]** Log a mock test: name, date, source (test series), total marks, scored marks, time taken, sectional / subject-wise breakdown (free-form rows).
- **FR-6.10.2 [MUST]** Performance trend charts: scores over time, sectional consistency, time taken trend.
- **FR-6.10.3 [MUST]** Mistake log: per test, log wrong/skipped questions with: question text/image, correct answer, your answer, linked syllabus node, your reasoning. A mistake auto-creates a `Revision` task on the linked sub-topic.
- **FR-6.10.4 [MUST]** PYQ tracker: a question bank organized by year (1979–latest) and by topic. User marks each PYQ as `Attempted`, `Correct`, `Wrong`, or `Skipped`, with notes. (Question text comes from user upload — we do not pre-seed copyrighted PYQs.)
- **FR-6.10.5 [MUST]** Mains answer tracker: upload handwritten answer image, link to question, self-rate (Structure / Content / Diagram / Conclusion — 5-point each), free-form review notes.

### 6.11 Current Affairs

- **FR-6.11.1 [MUST]** Daily current affairs log: entry has date, source URL, title, free-form summary (rich text), tags, linked syllabus nodes (multi-select).
- **FR-6.11.2 [MUST]** Auto-link suggestions based on tags and keywords (best-effort, user can override).
- **FR-6.11.3 [MUST]** Monthly compilation: auto-aggregated view of all CA entries for a chosen month, exportable to PDF.
- **FR-6.11.4 [MUST]** Daily reminder if no CA logged that day.
- **FR-6.11.5 [SHOULD]** "AI summarize" button on a CA entry to produce a 5-bullet revision-friendly summary.

### 6.12 Analytics & Insights Dashboard

- **FR-6.12.1 [MUST]** **Today widget:** planned tasks, completed count, completion %, focused minutes vs target.
- **FR-6.12.2 [MUST]** **Streak widget:** current daily-study streak, longest streak, revision streak.
- **FR-6.12.3 [MUST]** **Syllabus completion:** ring chart per stage (Prelims, Mains) and overall %.
- **FR-6.12.4 [MUST]** **Heatmap:** GitHub-style daily study heatmap for the past 12 months.
- **FR-6.12.5 [MUST]** **Subject-wise time distribution:** pie / bar chart over a chosen window (7d, 30d, 90d, all-time). Flags any subject whose share is < 60 % of its target share.
- **FR-6.12.6 [MUST]** **Time-to-exam countdown:** days remaining + headline metric "X% syllabus done, Y days left, Z hrs/day needed to finish on time."
- **FR-6.12.7 [MUST]** **Revision health:** number of topics overdue for revision, broken down by overdue bucket (1–3 days, 4–7 days, 7+ days).
- **FR-6.12.8 [MUST]** **Productivity score:** composite metric (40 % planned-vs-actual hours + 30 % focus session quality + 30 % revision adherence). Shown daily and as a 30-day trend.
- **FR-6.12.9 [MUST]** **Weekly review report:** auto-generated text summary every Sunday — total hours, top subject, lagging subject, completion %, suggested adjustments.
- **FR-6.12.10 [MUST]** All charts honor light/dark theme.

### 6.13 AI Assistant (OpenRouter — Gemini + ChatGPT)

- **FR-6.13.1 [MUST]** Single integration layer to OpenRouter. User-supplied API key stored encrypted at rest (or in env var for single-tenant deploy — see section 11).
- **FR-6.13.2 [MUST]** Per-request model selector: dropdown with `Google Gemini` (e.g., `google/gemini-pro-1.5`) and `OpenAI ChatGPT` (e.g., `openai/gpt-4o`). Model strings configurable in env.
- **FR-6.13.3 [MUST]** **Note summarizer:** input = note text or uploaded PDF; output = concise summary, key points list, possible Mains questions, possible Prelims-style MCQs.
- **FR-6.13.4 [MUST]** **Key Note generator:** convert long notes into front/back flashcards.
- **FR-6.13.5 [MUST]** **Answer evaluator (Mains):** paste your answer text → AI grades on Structure, Content, Diagram suggestion, Conclusion (each /5) with feedback.
- **FR-6.13.6 [MUST]** **Doubt chat:** free-form Q&A grounded on the user's notes (RAG: retrieve top-K relevant notes for the topic and pass as context).
- **FR-6.13.7 [MUST]** **Quiz generator:** given a syllabus node, generate N MCQs with explanations.
- **FR-6.13.8 [MUST]** Token usage display per request and a monthly running total.
- **FR-6.13.9 [MUST]** Graceful failure: if OpenRouter API fails, show a clear error and never silently swallow — user must always know if AI output is missing.
- **FR-6.13.10 [MUST]** Every AI output is clearly labelled as AI-generated and editable by the user before saving.

### 6.14 Reminders & Notifications

- **FR-6.14.1 [MUST]** In-app notification center with read/unread state.
- **FR-6.14.2 [MUST]** Browser push notifications (Web Push API) — user must opt in.
- **FR-6.14.3 [MUST]** Email reminders via Resend (or equivalent transactional email provider).
- **FR-6.14.4 [MUST]** Configurable triggers: morning plan (default 6 AM), end-of-day reflection (default 10 PM), revision due, test date approaching (T-7, T-3, T-1), goal deadline approaching, slip alert (zero study log for 2 consecutive days).
- **FR-6.14.5 [MUST]** All triggers individually toggleable from Settings.

### 6.15 Profile & Settings

- **FR-6.15.1 [MUST]** Profile: name, photo, exam attempt year, optional subject, exam medium language, daily target hours, working hours window, timezone.
- **FR-6.15.2 [MUST]** Theme: Light / Dark / Auto (system).
- **FR-6.15.3 [MUST]** Notification preferences (per FR-6.14.5).
- **FR-6.15.4 [MUST]** AI settings: OpenRouter key field, default model, monthly token cap (soft warning).
- **FR-6.15.5 [MUST]** Data export: full account export as a single ZIP — JSON of all DB rows + a folder of all uploaded files.
- **FR-6.15.6 [MUST]** Data deletion: delete account permanently (30-day grace then hard delete).
- **FR-6.15.7 [MUST]** Change password, change email.

### 6.16 Theme

- **FR-6.16.1 [MUST]** Light and Dark themes, both fully designed (no half-built dark mode). Theme toggle in the top bar and in Settings.
- **FR-6.16.2 [MUST]** "Auto" mode follows OS preference via `prefers-color-scheme`.
- **FR-6.16.3 [MUST]** Theme preference persisted per user.

---

## 7. Non-Functional Requirements

| # | Category | Requirement |
|---|----------|-------------|
| NFR-1 | Performance | Initial dashboard load ≤ 2.5 s on 10 Mbps; Time-To-Interactive ≤ 3.5 s. Note search returns top-20 results in ≤ 2 s for up to 5 000 notes. |
| NFR-2 | Performance | Syllabus tree (≈ 8 000 nodes) renders virtualized — never blocks the main thread for more than 100 ms on scroll. |
| NFR-3 | Scalability | Single-tenant build, but DB schema and RLS designed so multi-tenant scaling later requires no schema rewrite. |
| NFR-4 | Security | All data access enforced via Postgres Row-Level Security on `auth.uid() = user_id`. No service-role key in the browser. |
| NFR-5 | Security | OpenRouter API key never exposed to the browser; all AI calls proxied through a Supabase Edge Function. |
| NFR-6 | Security | OWASP Top 10 hardened: prepared statements (Supabase handles), CSRF-safe auth flows, input sanitization on rich-text content (DOMPurify), file MIME validation server-side, signed URLs for storage. |
| NFR-7 | Privacy | User data is never used to train models. AI requests sent to OpenRouter must use accounts/keys configured by the user. |
| NFR-8 | Accessibility | WCAG 2.1 AA: contrast ratios, keyboard navigation for every action, ARIA labels on all interactive elements, focus traps in modals. |
| NFR-9 | Browser support | Latest 2 major versions of Chrome, Edge, Firefox, Safari. |
| NFR-10 | Responsiveness | Layout works down to 360 px width. Touch targets ≥ 44 px. |
| NFR-11 | Reliability | Auto-save for notes; optimistic UI for task toggles with rollback on server error. |
| NFR-12 | Observability | Client-side error reporting (Sentry recommended). Server logs of all Edge Function invocations. |
| NFR-13 | Backups | Supabase daily automated DB backups enabled; 7-day retention minimum. |
| NFR-14 | Maintainability | Code formatted with Prettier, linted with ESLint, type-checked with TypeScript strict mode, unit tests for core utilities (revision math, completion roll-up, productivity score). |

---

## 8. Tech Stack

### 8.1 Frontend
- **React 18+** with **Vite** as the build tool.
- **TypeScript** in strict mode.
- **TailwindCSS** for styling.
- **shadcn/ui** as the component library (Radix primitives under the hood).
- **TanStack Query (React Query)** for server state.
- **Zustand** for lightweight client state.
- **TanStack Router** or **React Router v6** for routing (engineer's choice).
- **TipTap** for the rich-text editor.
- **Recharts** for charts; **Tremor** acceptable as alternative.
- **date-fns** for date math.
- **react-pdf** or **PDF.js** for the in-app PDF viewer.
- **DOMPurify** for sanitizing user-generated HTML.
- **KaTeX** for math rendering inside notes.
- **Sentry** SDK for error reporting.

### 8.2 Backend
- **Supabase** as the BaaS:
  - **Postgres** for primary DB.
  - **Auth** for email + Google OAuth.
  - **Storage** for user file uploads.
  - **Edge Functions (Deno)** for: AI proxying, scheduled jobs (revision scheduler, weekly report generator, slip-alert detector), Web Push dispatch, email dispatch.
  - **Realtime** (optional) for live UI updates if multiple tabs are open.
- **Resend** for transactional email.

### 8.3 AI Integration
- **OpenRouter** as the unified gateway.
  - Supported models (configurable via env): `google/gemini-pro-1.5` (or current Gemini variant), `openai/gpt-4o` (or current ChatGPT variant).
  - User-supplied API key passed via env (`OPENROUTER_API_KEY`).
  - All calls go through a Supabase Edge Function — never directly from the browser.

### 8.4 DevOps
- **GitHub** for source control.
- **GitHub Actions** for CI: lint + type-check + tests + build on every PR.
- **Vercel** or **Netlify** for frontend hosting.
- **Supabase Cloud** for backend hosting.
- **Environment files:** `.env.local` for development, environment variables on the host for production. Required keys listed in section 11.

---

## 9. Database Schema (Supabase Postgres)

Schema overview. Engineer will produce final SQL migrations; this is the contract.

```
profiles                — extends auth.users
  user_id (FK auth.users), full_name, avatar_url, exam_attempt_date,
  optional_subject_id, exam_medium_language, daily_target_hours,
  working_hours_start, working_hours_end, timezone, theme_preference,
  openrouter_default_model, created_at, updated_at

syllabus_nodes          — system-seeded master tree (read-only to users)
  id, parent_id, level, code, title, description, default_hours,
  metadata jsonb, created_at

user_syllabus_progress  — per-user state on each leaf
  id, user_id, syllabus_node_id, status, confidence_rating,
  hours_estimated_override, hours_spent, last_revised_at,
  next_revision_at, completed_at, notes_count, attachments_count,
  created_at, updated_at
  UNIQUE (user_id, syllabus_node_id)

tasks
  id, user_id, parent_task_id, title, description, type,
  syllabus_node_id, target_date, target_start_time, target_end_time,
  estimated_minutes, actual_minutes, priority, status,
  recurrence_rule, reminder_at, completed_at, created_at, updated_at

study_sessions
  id, user_id, task_id, started_at, ended_at, duration_minutes,
  focus_score, note, created_at

notes
  id, user_id, title, content_json, content_md, plain_text_search,
  tags text[], created_at, updated_at

note_syllabus_links     — many-to-many
  note_id, syllabus_node_id

note_versions
  id, note_id, content_json, created_at

key_notes               — flashcards
  id, user_id, syllabus_node_id, front, back, ease_factor,
  interval_days, next_review_at, last_reviewed_at, review_count,
  created_at

attachments
  id, user_id, file_path, file_name, mime_type, size_bytes,
  linked_to_type, linked_to_id, tags text[], ai_summary,
  uploaded_at, deleted_at

pdf_annotations
  id, user_id, attachment_id, page_number, type, color,
  rect jsonb, text, created_at

tests
  id, user_id, name, date, source, total_marks, scored_marks,
  time_taken_minutes, sectional_breakdown jsonb, notes, created_at

test_mistakes
  id, test_id, user_id, syllabus_node_id, question_text,
  question_image_path, correct_answer, your_answer, reasoning,
  created_at

pyq_attempts
  id, user_id, year, paper, question_text, question_image_path,
  syllabus_node_id, status, your_answer, notes, created_at

mains_answers
  id, user_id, question_text, answer_image_path, syllabus_node_id,
  rating_structure, rating_content, rating_diagram, rating_conclusion,
  review_notes, created_at

current_affairs
  id, user_id, date, source_url, title, summary_json,
  tags text[], created_at
current_affairs_links
  current_affair_id, syllabus_node_id

daily_logs
  id, user_id, date, planned_minutes, actual_minutes,
  completion_pct, mood, energy, reflection_text, created_at
  UNIQUE (user_id, date)

goals
  id, user_id, scope, period_start, period_end, target_data jsonb,
  achieved_data jsonb, created_at

reminders
  id, user_id, type, scheduled_at, payload jsonb, sent_at, channel,
  created_at

ai_usage
  id, user_id, model, prompt_tokens, completion_tokens, cost_estimate,
  feature, created_at

notifications
  id, user_id, type, title, body, link, is_read, created_at
```

**RLS policy template (applied to every user table):**
```sql
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
```

`syllabus_nodes` is publicly readable but writeable only by service role.

**Storage buckets:**
- `user-files` — private, RLS enforced via path prefix `{user_id}/...`.
- `avatars` — public read, private write (owner only).

**Indexes (must-have):**
- `tasks (user_id, target_date)`
- `tasks (user_id, status)` partial where status != completed
- `study_sessions (user_id, started_at)`
- `user_syllabus_progress (user_id, next_revision_at)`
- `key_notes (user_id, next_review_at)`
- `notes (user_id)` + GIN on `plain_text_search` (tsvector) for full-text search.
- `attachments (user_id, linked_to_type, linked_to_id)`

---

## 10. Pre-Seeded Data Requirements

Engineer must produce a seed migration (or one-off seeding script using the service-role key) that loads:

1. **Full UPSC Prelims syllabus** — GS Paper 1 + CSAT, broken down to the sub-topic level per the latest official UPSC notification.
2. **Full UPSC Mains syllabus** — GS1, GS2, GS3, GS4, Essay, Compulsory English (qualifying), Compulsory Indian Language (qualifying).
3. **All 48 Optional subjects**, each with Paper 1 and Paper 2 syllabus to the sub-topic level. The 48 optionals include: Agriculture, Animal Husbandry & Veterinary Science, Anthropology, Botany, Chemistry, Civil Engineering, Commerce & Accountancy, Economics, Electrical Engineering, Geography, Geology, History, Law, Management, Mathematics, Mechanical Engineering, Medical Science, Philosophy, Physics, Political Science & International Relations, Psychology, Public Administration, Sociology, Statistics, Zoology, plus Literature of any one of: Assamese, Bengali, Bodo, Dogri, English, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santhali, Sindhi, Tamil, Telugu, Urdu.
4. **Language list** — all 22 languages of the Eighth Schedule, plus English, available for selection as exam medium.
5. **Default estimated study hours** per leaf-node — engineer to use sensible heuristics (e.g., a sub-topic averages 1.5–3 hrs of first-reading time); user can override.

**Source of truth:** the engineer should reference the latest UPSC CSE notification PDF when seeding. Product owner will provide the PDF if asked.

---

## 11. Environment Variables

Engineer must wire the following env vars. Browser-exposed (`VITE_*`) variables must be safe to leak.

```
# Supabase (frontend-safe)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>

# Supabase (server-only — used by seed scripts and Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# OpenRouter (server-only — proxied via Edge Function, never sent to browser)
OPENROUTER_API_KEY=<openrouter-key>
OPENROUTER_MODEL_GEMINI=google/gemini-pro-1.5
OPENROUTER_MODEL_CHATGPT=openai/gpt-4o

# Email
RESEND_API_KEY=<resend-key>
EMAIL_FROM=PrepTrack <noreply@preptrack.app>

# Web Push
VAPID_PUBLIC_KEY=<vapid-public>
VAPID_PRIVATE_KEY=<vapid-private>
VAPID_SUBJECT=mailto:owner@preptrack.app

# App
APP_URL=https://preptrack.app
```

The Supabase service-role key, OpenRouter key, Resend key, and VAPID private key **must never** appear in any browser bundle.

---

## 12. UI / UX Requirements

### 12.1 Visual Design
- **Tone:** clean, exam-serious, focused. No gamification gimmicks (no confetti, no badges, no levels). Streaks are fine because they are factual, not celebratory.
- **Typography:** Inter (UI), JetBrains Mono (code blocks).
- **Color system:** built on Tailwind tokens, mapped to CSS variables so both themes share the same component code.
- **Spacing:** 4 px base grid.
- **Iconography:** lucide-react.

### 12.2 Themes
- Light theme: near-white surfaces, near-black text, single brand accent.
- Dark theme: not pure black — use a dark slate (#0F1115 ish) for surfaces, off-white text, same accent at adjusted luminance.
- Both themes fully audited for WCAG AA contrast.

### 12.3 Layout
- Persistent left sidebar: Dashboard, Plan (Daily/Weekly/Monthly), Syllabus, Notes, Resources, Tests, Current Affairs, Analytics, AI Assistant, Settings.
- Top bar: search, theme toggle, notification bell, profile menu.
- Main canvas adapts to viewport.
- Modal-heavy interactions for create/edit forms — never full page reloads.

### 12.4 Empty states
- Every list view has a designed empty state with a one-sentence explanation and a primary CTA.

### 12.5 Loading & error states
- Skeleton loaders for every async list. Toasts for transient errors. Inline error blocks for form validation.

### 12.6 Keyboard
- `g d` go dashboard, `g p` go plan, `g s` go syllabus, `g n` go notes, `c` create task, `/` focus search.

---

## 13. Key User Flows

### 13.1 First-time user
Signup → email verify → onboarding wizard → starter roadmap generated → dashboard with "Start Day 1" CTA.

### 13.2 Daily flow
Morning: open app → dashboard shows today's plan + first revision due → click "Start" on first task → Pomodoro begins → mark complete → next task → end-of-day reflection prompt at 10 PM (configurable) → reflection saved → analytics updated.

### 13.3 Weekly flow
Sunday evening: weekly review report appears as a notification → user opens it → sees planned-vs-actual + top/lagging subjects → clicks "Plan next week" → wizard suggests tasks based on roadmap + revision queue → user edits and saves.

### 13.4 Note + AI flow
User uploads a PDF → opens it in viewer → highlights key sections → clicks "Generate notes with AI" → picks Gemini or ChatGPT → AI returns structured note + key points + likely Mains questions → user edits → saves note linked to a syllabus node → key points become Key Notes (flashcards) → Key Notes enter the spaced-repetition queue.

### 13.5 Test flow
After a mock test: user logs the test with sectional scores → adds wrong questions one-by-one with linked syllabus nodes → each mistake auto-creates a Revision task on that sub-topic → analytics updates the lagging-subject signal if applicable.

---

## 14. Acceptance Criteria (v1.0 Release Gate)

The product is releasable when **every** item below passes:

1. All `[MUST]` requirements in section 6 are implemented and verified.
2. All non-functional requirements in section 7 are met.
3. Pre-seeded syllabus covers Prelims + Mains + all 48 optionals + all 22 languages.
4. Both light and dark themes pass WCAG 2.1 AA on every screen.
5. All charts render correctly with empty data, partial data, and 12-month-loaded data.
6. RLS verified: a second user cannot read or write the first user's data through any API path.
7. No service-role key, OpenRouter key, Resend key, or VAPID private key is present in the production browser bundle (verified by inspecting the built JS).
8. Sentry is wired and capturing errors.
9. Daily Supabase backups confirmed enabled.
10. End-to-end test pass: signup → onboarding → create plan → run Pomodoro → upload PDF → generate AI notes → log test with mistakes → see updated dashboard.
11. Lighthouse: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95 on the dashboard route.
12. Privacy + Terms pages drafted and linked in the footer.

---

## 15. Future Roadmap (informational, out of v1.0 scope)

- PWA install + offline mode (notes, today's plan, current Pomodoro work offline; sync on reconnect).
- React Native iOS + Android apps.
- Study groups, peer answer review, mentor mode.
- Public profile + public study log (opt-in).
- Subscription / payments.
- Localized UI (Hindi + regional languages).
- Voice notes with auto-transcription.

---

## 16. Glossary

- **UPSC** — Union Public Service Commission.
- **CSE** — Civil Services Examination.
- **GS** — General Studies (Mains has GS1 to GS4).
- **CSAT** — Civil Services Aptitude Test (Prelims Paper 2).
- **PYQ** — Previous Year Question.
- **Optional** — the optional subject the candidate picks for Mains; one of 48.
- **SM-2** — the SuperMemo-2 spaced repetition algorithm.
- **RLS** — Row-Level Security (Postgres feature used to scope rows by `auth.uid()`).
- **Edge Function** — Supabase's Deno-based serverless function.
- **OpenRouter** — unified API gateway for many LLM providers; we use it for Gemini and ChatGPT.

---

## 17. Open Questions / Owner Decisions Needed

These items are not blockers but should be confirmed before or during implementation:

1. **Test series sources** — should the engineer pre-seed any well-known test-series schedules (Vision IAS, Insights, etc.) or leave the Test module fully user-driven? Current spec assumes user-driven.
2. **Custom domain** — confirm `preptrack.app` (or chosen domain) registration and DNS.
3. **Email sending domain** — Resend requires DNS verification for the sending domain.
4. **OpenRouter monthly budget cap** — soft cap is in spec; what is the hard cap value?
5. **Privacy policy + Terms of Service** — owner to provide draft text or hire a legal reviewer.

---

**End of document.**