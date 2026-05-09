-- ============================================================
-- PrepTrack — Complete Database Schema (Supabase Postgres)
-- Version: 1.0
-- ============================================================
--
-- SENIOR DEVELOPER INSTRUCTIONS:
-- 1. Create a new Supabase project at https://supabase.com
-- 2. Go to SQL Editor > New Query
-- 3. Paste and run this ENTIRE file in one shot
-- 4. Then manually create two Storage buckets in Dashboard > Storage:
--      a. "user-files"  → Private, 50 MB max file size
--      b. "avatars"     → Public,   5 MB max file size
-- 5. Run the Storage policy block at the bottom of this file
-- 6. Share with the junior developer:
--      VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.
--    Never share: SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY,
--                 RESEND_API_KEY, VAPID_PRIVATE_KEY
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- similarity / trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive search

-- ============================================================
-- 2. SHARED HELPER: auto-update updated_at on every UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. LOOKUP / SYSTEM TABLES (read-only for end users)
-- ============================================================

-- 3.1 Optional Subjects (48 UPSC optionals)
CREATE TABLE IF NOT EXISTS public.optional_subjects (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL
                  CHECK (category IN ('science','social_science','engineering','literature','other')),
  is_literature BOOLEAN NOT NULL DEFAULT FALSE,
  language_name TEXT,          -- for literature optionals
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Exam Languages (22 Eighth Schedule + English = 23 total)
CREATE TABLE IF NOT EXISTS public.exam_languages (
  id         SERIAL PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,   -- ISO or custom code
  name       TEXT NOT NULL,
  script     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Syllabus Nodes — full UPSC hierarchical tree (system-seeded)
--
--  Levels:
--    1 = Stage        (Prelims / Mains / Interview)
--    2 = Paper        (GS Paper 1, CSAT, GS1 Mains …)
--    3 = Subject      (History, Geography …)
--    4 = Unit/Theme
--    5 = Topic
--    6 = Sub-topic    (leaf node — user tracks progress here)
--
CREATE TABLE IF NOT EXISTS public.syllabus_nodes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id           UUID REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  level               INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
  code                TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  description         TEXT,
  default_hours       NUMERIC(5,2) DEFAULT 2.0,
  stage               TEXT CHECK (stage IN ('prelims','mains','interview')),
  paper               TEXT,
  optional_subject_id INTEGER REFERENCES public.optional_subjects(id),
  language_id         INTEGER REFERENCES public.exam_languages(id),
  is_leaf             BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syllabus_parent      ON public.syllabus_nodes(parent_id);
CREATE INDEX idx_syllabus_stage       ON public.syllabus_nodes(stage);
CREATE INDEX idx_syllabus_level       ON public.syllabus_nodes(level);
CREATE INDEX idx_syllabus_is_leaf     ON public.syllabus_nodes(is_leaf) WHERE is_leaf = TRUE;

-- Syllabus is publicly readable; only service role can write
ALTER TABLE public.syllabus_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syllabus_nodes_public_read" ON public.syllabus_nodes
  FOR SELECT USING (TRUE);

-- ============================================================
-- 4. USER TABLES  (all protected by RLS: auth.uid() = user_id)
-- ============================================================

-- ── 4.1  PROFILES  ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                  TEXT,
  avatar_url                 TEXT,
  exam_attempt_date          DATE,         -- target Prelims date (e.g. 2025-05-25)
  optional_subject_id        INTEGER REFERENCES public.optional_subjects(id),
  exam_medium_language_id    INTEGER REFERENCES public.exam_languages(id),
  daily_target_hours         NUMERIC(4,1) NOT NULL DEFAULT 8.0
                               CHECK (daily_target_hours BETWEEN 4 AND 14),
  working_hours_start        TIME NOT NULL DEFAULT '06:00:00',
  working_hours_end          TIME NOT NULL DEFAULT '22:00:00',
  timezone                   TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  theme_preference           TEXT NOT NULL DEFAULT 'auto'
                               CHECK (theme_preference IN ('light','dark','auto')),
  openrouter_api_key         TEXT,         -- stored encrypted by Supabase Vault (or env-level)
  openrouter_default_model   TEXT DEFAULT 'google/gemini-pro-1.5',
  openrouter_monthly_token_cap INTEGER DEFAULT 500000,
  onboarding_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step            INTEGER NOT NULL DEFAULT 0,
  familiarity_ratings        JSONB DEFAULT '{}',  -- { "prelims_gs": 3, "mains_gs1": 2, … }
  notification_prefs         JSONB DEFAULT '{
    "morning_plan": true,
    "eod_reflection": true,
    "revision_due": true,
    "test_upcoming": true,
    "slip_alert": true,
    "weekly_report": true
  }',
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 4.2  ROADMAP PHASES  ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phase_type  TEXT NOT NULL
                CHECK (phase_type IN (
                  'foundation','consolidation','revision_1','revision_2',
                  'test_series','final_60','custom'
                )),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_user ON public.roadmap_phases(user_id, start_date);

CREATE TRIGGER roadmap_updated_at
  BEFORE UPDATE ON public.roadmap_phases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmap_all_own" ON public.roadmap_phases
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.3  USER SYLLABUS PROGRESS  ────────────────────────
CREATE TABLE IF NOT EXISTS public.user_syllabus_progress (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  syllabus_node_id         UUID NOT NULL REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  status                   TEXT NOT NULL DEFAULT 'not_started'
                             CHECK (status IN ('not_started','in_progress','completed','needs_revision')),
  confidence_rating        INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  hours_estimated_override NUMERIC(5,2),
  hours_spent              NUMERIC(6,2) NOT NULL DEFAULT 0,
  last_revised_at          TIMESTAMPTZ,
  next_revision_at         TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  revision_count           INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, syllabus_node_id)
);

CREATE INDEX idx_usp_user_node      ON public.user_syllabus_progress(user_id, syllabus_node_id);
CREATE INDEX idx_usp_next_revision  ON public.user_syllabus_progress(user_id, next_revision_at);
CREATE INDEX idx_usp_status         ON public.user_syllabus_progress(user_id, status);

CREATE TRIGGER usp_updated_at
  BEFORE UPDATE ON public.user_syllabus_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_syllabus_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usp_all_own" ON public.user_syllabus_progress
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.4  NODE SOURCES (books / videos / URLs per node per user)  ──
CREATE TABLE IF NOT EXISTS public.node_sources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  syllabus_node_id UUID NOT NULL REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('book','video','url','other')),
  title            TEXT NOT NULL,
  url              TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_node_sources_user_node ON public.node_sources(user_id, syllabus_node_id);

ALTER TABLE public.node_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "node_sources_all_own" ON public.node_sources
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.5  TASKS  ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_task_id    UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL DEFAULT 'custom'
                      CHECK (type IN ('syllabus','revision','test_pyq','answer_writing','current_affairs','custom')),
  syllabus_node_id  UUID REFERENCES public.syllabus_nodes(id),
  target_date       DATE,
  target_start_time TIME,
  target_end_time   TIME,
  estimated_minutes INTEGER CHECK (estimated_minutes > 0),
  actual_minutes    INTEGER CHECK (actual_minutes >= 0),
  priority          TEXT NOT NULL DEFAULT 'p2' CHECK (priority IN ('p1','p2','p3')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','in_progress','completed','partial','skipped','cancelled')),
  skip_reason       TEXT,
  recurrence_rule   TEXT,           -- iCal RRULE string, e.g. "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
  recurrence_parent_id UUID REFERENCES public.tasks(id),
  reminder_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_date    ON public.tasks(user_id, target_date);
CREATE INDEX idx_tasks_user_status  ON public.tasks(user_id, status) WHERE status != 'completed';
CREATE INDEX idx_tasks_syllabus     ON public.tasks(syllabus_node_id) WHERE syllabus_node_id IS NOT NULL;
CREATE INDEX idx_tasks_parent       ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all_own" ON public.tasks
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.6  STUDY SESSIONS (Pomodoro)  ──────────────────────
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  session_type     TEXT NOT NULL DEFAULT 'focus'
                     CHECK (session_type IN ('focus','break','long_break')),
  focus_score      INTEGER CHECK (focus_score BETWEEN 1 AND 5),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_time ON public.study_sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_task      ON public.study_sessions(task_id) WHERE task_id IS NOT NULL;

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_all_own" ON public.study_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.7  DAILY LOGS (end-of-day reflection)  ─────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  planned_minutes INTEGER NOT NULL DEFAULT 0,
  actual_minutes  INTEGER NOT NULL DEFAULT 0,
  completion_pct  NUMERIC(5,2),
  mood            INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy          INTEGER CHECK (energy BETWEEN 1 AND 5),
  reflection_text TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_logs_all_own" ON public.daily_logs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.8  GOALS  ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope         TEXT NOT NULL CHECK (scope IN ('daily','weekly','monthly','custom')),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  title         TEXT,
  target_data   JSONB DEFAULT '{}',
  achieved_data JSONB DEFAULT '{}',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_period ON public.goals(user_id, period_start DESC);

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_all_own" ON public.goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.9  NOTES  ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL DEFAULT 'Untitled Note',
  content_json      JSONB,           -- TipTap ProseMirror JSON doc
  content_md        TEXT,            -- markdown cache (updated on save)
  plain_text_search TSVECTOR,        -- GIN-indexed for full-text search
  tags              TEXT[] DEFAULT '{}',
  is_pinned         BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  version_number    INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user       ON public.notes(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_fts        ON public.notes USING GIN(plain_text_search);
CREATE INDEX idx_notes_tags       ON public.notes USING GIN(tags);

-- Auto-update tsvector when title or content changes
CREATE OR REPLACE FUNCTION public.notes_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.plain_text_search :=
    to_tsvector('english',
      COALESCE(NEW.title, '') || ' ' ||
      COALESCE(NEW.content_md, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_trigger
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.notes_search_update();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_all_own" ON public.notes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.10  NOTE ↔ SYLLABUS LINKS (many-to-many)  ──────────
CREATE TABLE IF NOT EXISTS public.note_syllabus_links (
  note_id          UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  syllabus_node_id UUID NOT NULL REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (note_id, syllabus_node_id)
);

CREATE INDEX idx_nsl_node ON public.note_syllabus_links(syllabus_node_id);
CREATE INDEX idx_nsl_user ON public.note_syllabus_links(user_id);

ALTER TABLE public.note_syllabus_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nsl_all_own" ON public.note_syllabus_links
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.11  NOTE VERSIONS (last 20 versions per note)  ─────
CREATE TABLE IF NOT EXISTS public.note_versions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id        UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_json   JSONB,
  content_md     TEXT,
  version_number INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_versions_note ON public.note_versions(note_id, version_number DESC);

ALTER TABLE public.note_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_versions_all_own" ON public.note_versions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-prune old versions keeping only latest 20
CREATE OR REPLACE FUNCTION public.prune_note_versions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.note_versions
  WHERE note_id = NEW.note_id
    AND id NOT IN (
      SELECT id FROM public.note_versions
      WHERE note_id = NEW.note_id
      ORDER BY version_number DESC
      LIMIT 20
    );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_note_version_insert
  AFTER INSERT ON public.note_versions
  FOR EACH ROW EXECUTE FUNCTION public.prune_note_versions();


-- ── 4.12  KEY NOTES (flashcards, SM-2 spaced repetition)  ─
CREATE TABLE IF NOT EXISTS public.key_notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id          UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  front            TEXT NOT NULL,
  back             TEXT NOT NULL,
  -- SM-2 algorithm fields
  ease_factor      NUMERIC(4,2) NOT NULL DEFAULT 2.5,  -- minimum 1.3
  interval_days    INTEGER NOT NULL DEFAULT 1,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  review_count     INTEGER NOT NULL DEFAULT 0,
  is_suspended     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_key_notes_user_review ON public.key_notes(user_id, next_review_at)
  WHERE is_suspended = FALSE;
CREATE INDEX idx_key_notes_node        ON public.key_notes(syllabus_node_id);

CREATE TRIGGER key_notes_updated_at
  BEFORE UPDATE ON public.key_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.key_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "key_notes_all_own" ON public.key_notes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.13  ATTACHMENTS (uploaded files)  ──────────────────
CREATE TABLE IF NOT EXISTS public.attachments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Supabase Storage path: {user_id}/{uuid}/{original_filename}
  file_path      TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL,
  linked_to_type TEXT
                   CHECK (linked_to_type IN ('syllabus_node','task','note','test','standalone')),
  linked_to_id   UUID,
  folder_path    TEXT NOT NULL DEFAULT '/',
  tags           TEXT[] DEFAULT '{}',
  ai_summary     TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ          -- soft delete; hard-delete after 30 days via cron
);

CREATE INDEX idx_attachments_user   ON public.attachments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_linked ON public.attachments(user_id, linked_to_type, linked_to_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_mime   ON public.attachments(user_id, mime_type);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_all_own" ON public.attachments
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.14  PDF ANNOTATIONS  ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
  page_number   INTEGER NOT NULL CHECK (page_number > 0),
  type          TEXT NOT NULL CHECK (type IN ('highlight','comment','underline')),
  color         TEXT NOT NULL DEFAULT '#FFFF00'
                  CHECK (color IN ('#FFFF00','#FF6B6B','#51CF66','#339AF0')),
  rect          JSONB NOT NULL,   -- {x1,y1,x2,y2} normalized 0–1 relative to page
  selected_text TEXT,
  comment_text  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_ann_attachment ON public.pdf_annotations(attachment_id, page_number);

CREATE TRIGGER pdf_annotations_updated_at
  BEFORE UPDATE ON public.pdf_annotations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pdf_ann_all_own" ON public.pdf_annotations
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.15  TESTS (mock tests / PYQ sets)  ─────────────────
CREATE TABLE IF NOT EXISTS public.tests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  date                DATE NOT NULL,
  source              TEXT,
  test_type           TEXT DEFAULT 'mock'
                        CHECK (test_type IN ('mock','pyq_set','sectional','full_length')),
  total_marks         NUMERIC(6,2) NOT NULL,
  scored_marks        NUMERIC(6,2) NOT NULL,
  time_taken_minutes  INTEGER,
  sectional_breakdown JSONB DEFAULT '{}',  -- {"Polity": {"total": 25, "scored": 18}}
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tests_user_date ON public.tests(user_id, date DESC);

CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_all_own" ON public.tests
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.16  TEST MISTAKES  ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.test_mistakes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id             UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  syllabus_node_id    UUID REFERENCES public.syllabus_nodes(id),
  question_text       TEXT,
  question_image_path TEXT,
  correct_answer      TEXT,
  your_answer         TEXT,
  reasoning           TEXT,
  revision_task_id    UUID REFERENCES public.tasks(id),  -- auto-created Revision task
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_mistakes_test ON public.test_mistakes(test_id);
CREATE INDEX idx_test_mistakes_user ON public.test_mistakes(user_id);
CREATE INDEX idx_test_mistakes_node ON public.test_mistakes(syllabus_node_id);

ALTER TABLE public.test_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_mistakes_all_own" ON public.test_mistakes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.17  PYQ ATTEMPTS  ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pyq_attempts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year                INTEGER NOT NULL CHECK (year BETWEEN 1979 AND 2035),
  paper               TEXT NOT NULL,
  question_text       TEXT,
  question_image_path TEXT,
  syllabus_node_id    UUID REFERENCES public.syllabus_nodes(id),
  status              TEXT NOT NULL DEFAULT 'not_attempted'
                        CHECK (status IN ('not_attempted','attempted','correct','wrong','skipped')),
  your_answer         TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pyq_user_year ON public.pyq_attempts(user_id, year DESC);
CREATE INDEX idx_pyq_node      ON public.pyq_attempts(syllabus_node_id);

CREATE TRIGGER pyq_updated_at
  BEFORE UPDATE ON public.pyq_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pyq_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pyq_all_own" ON public.pyq_attempts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.18  MAINS ANSWERS  ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mains_answers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  answer_image_path TEXT,
  answer_text      TEXT,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id),
  rating_structure INTEGER CHECK (rating_structure BETWEEN 1 AND 5),
  rating_content   INTEGER CHECK (rating_content BETWEEN 1 AND 5),
  rating_diagram   INTEGER CHECK (rating_diagram BETWEEN 1 AND 5),
  rating_conclusion INTEGER CHECK (rating_conclusion BETWEEN 1 AND 5),
  review_notes     TEXT,
  ai_feedback      JSONB,  -- AI evaluation JSON
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mains_user ON public.mains_answers(user_id, created_at DESC);

CREATE TRIGGER mains_updated_at
  BEFORE UPDATE ON public.mains_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.mains_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mains_all_own" ON public.mains_answers
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.19  CURRENT AFFAIRS  ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.current_affairs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  source_url   TEXT,
  title        TEXT NOT NULL,
  summary_json JSONB,          -- TipTap JSON for rich text
  summary_text TEXT,           -- plain text cache for search
  tags         TEXT[] DEFAULT '{}',
  ai_bullets   TEXT[],         -- AI-generated 5-bullet summary
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_user_date ON public.current_affairs(user_id, date DESC);
CREATE INDEX idx_ca_tags      ON public.current_affairs USING GIN(tags);

CREATE TRIGGER ca_updated_at
  BEFORE UPDATE ON public.current_affairs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_all_own" ON public.current_affairs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.20  CURRENT AFFAIRS ↔ SYLLABUS LINKS  ─────────────
CREATE TABLE IF NOT EXISTS public.current_affairs_links (
  current_affair_id UUID NOT NULL REFERENCES public.current_affairs(id) ON DELETE CASCADE,
  syllabus_node_id  UUID NOT NULL REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (current_affair_id, syllabus_node_id)
);

CREATE INDEX idx_cal_node ON public.current_affairs_links(syllabus_node_id);

ALTER TABLE public.current_affairs_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_all_own" ON public.current_affairs_links
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.21  NOTIFICATIONS (in-app)  ────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read)
  WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all_own" ON public.notifications
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.22  PUSH SUBSCRIPTIONS (Web Push API)  ─────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_user ON public.push_subscriptions(user_id) WHERE is_active = TRUE;

CREATE TRIGGER push_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_all_own" ON public.push_subscriptions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.23  REMINDERS (scheduled, tracked by Edge Functions)  ─
CREATE TABLE IF NOT EXISTS public.reminders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  payload      JSONB DEFAULT '{}',
  sent_at      TIMESTAMPTZ,
  channel      TEXT NOT NULL DEFAULT 'push'
                 CHECK (channel IN ('push','email','in_app')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_scheduled ON public.reminders(user_id, scheduled_at)
  WHERE sent_at IS NULL;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_all_own" ON public.reminders
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 4.24  AI USAGE TRACKING  ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model             TEXT NOT NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  cost_estimate     NUMERIC(10,6),
  feature           TEXT NOT NULL,  -- 'note_summarizer','key_note_gen','answer_eval','doubt_chat','quiz_gen'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user ON public.ai_usage(user_id, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_all_own" ON public.ai_usage
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 5. USEFUL VIEWS
-- ============================================================

-- Overdue revisions per user (accessed with user JWT — inherits RLS)
CREATE OR REPLACE VIEW public.v_overdue_revisions AS
SELECT
  usp.user_id,
  usp.syllabus_node_id,
  sn.title           AS topic_title,
  sn.code            AS topic_code,
  sn.stage,
  usp.next_revision_at,
  NOW() - usp.next_revision_at AS overdue_duration,
  CASE
    WHEN NOW() - usp.next_revision_at < INTERVAL '3 days' THEN '1-3 days'
    WHEN NOW() - usp.next_revision_at < INTERVAL '7 days' THEN '4-7 days'
    ELSE '7+ days'
  END AS overdue_bucket
FROM public.user_syllabus_progress usp
JOIN public.syllabus_nodes sn ON sn.id = usp.syllabus_node_id
WHERE usp.next_revision_at < NOW()
  AND usp.status IN ('completed','needs_revision');

-- Key notes due for review today
CREATE OR REPLACE VIEW public.v_due_key_notes AS
SELECT
  kn.user_id,
  kn.id,
  kn.front,
  kn.back,
  kn.ease_factor,
  kn.interval_days,
  kn.review_count,
  kn.next_review_at,
  sn.title AS linked_topic
FROM public.key_notes kn
LEFT JOIN public.syllabus_nodes sn ON sn.id = kn.syllabus_node_id
WHERE kn.next_review_at <= NOW()
  AND kn.is_suspended = FALSE;


-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- 6.1 Optional Subjects (48 total)
INSERT INTO public.optional_subjects (code, name, category, is_literature) VALUES
  ('agriculture',           'Agriculture',                                    'science',       FALSE),
  ('animal_husbandry',      'Animal Husbandry & Veterinary Science',          'science',       FALSE),
  ('anthropology',          'Anthropology',                                   'social_science',FALSE),
  ('botany',                'Botany',                                         'science',       FALSE),
  ('chemistry',             'Chemistry',                                      'science',       FALSE),
  ('civil_engineering',     'Civil Engineering',                              'engineering',   FALSE),
  ('commerce',              'Commerce & Accountancy',                         'other',         FALSE),
  ('economics',             'Economics',                                      'social_science',FALSE),
  ('electrical_engineering','Electrical Engineering',                         'engineering',   FALSE),
  ('geography',             'Geography',                                      'social_science',FALSE),
  ('geology',               'Geology',                                        'science',       FALSE),
  ('history',               'History',                                        'social_science',FALSE),
  ('law',                   'Law',                                            'other',         FALSE),
  ('management',            'Management',                                     'other',         FALSE),
  ('mathematics',           'Mathematics',                                    'science',       FALSE),
  ('mechanical_engineering','Mechanical Engineering',                         'engineering',   FALSE),
  ('medical_science',       'Medical Science',                                'science',       FALSE),
  ('philosophy',            'Philosophy',                                     'other',         FALSE),
  ('physics',               'Physics',                                        'science',       FALSE),
  ('political_science',     'Political Science & International Relations',    'social_science',FALSE),
  ('psychology',            'Psychology',                                     'social_science',FALSE),
  ('public_administration', 'Public Administration',                          'social_science',FALSE),
  ('sociology',             'Sociology',                                      'social_science',FALSE),
  ('statistics',            'Statistics',                                     'science',       FALSE),
  ('zoology',               'Zoology',                                        'science',       FALSE),
  -- Literature optionals (23, one per language)
  ('lit_assamese', 'Assamese Literature', 'literature', TRUE),
  ('lit_bengali',  'Bengali Literature',  'literature', TRUE),
  ('lit_bodo',     'Bodo Literature',     'literature', TRUE),
  ('lit_dogri',    'Dogri Literature',    'literature', TRUE),
  ('lit_english',  'English Literature',  'literature', TRUE),
  ('lit_gujarati', 'Gujarati Literature', 'literature', TRUE),
  ('lit_hindi',    'Hindi Literature',    'literature', TRUE),
  ('lit_kannada',  'Kannada Literature',  'literature', TRUE),
  ('lit_kashmiri', 'Kashmiri Literature', 'literature', TRUE),
  ('lit_konkani',  'Konkani Literature',  'literature', TRUE),
  ('lit_maithili', 'Maithili Literature', 'literature', TRUE),
  ('lit_malayalam','Malayalam Literature','literature', TRUE),
  ('lit_manipuri', 'Manipuri Literature', 'literature', TRUE),
  ('lit_marathi',  'Marathi Literature',  'literature', TRUE),
  ('lit_nepali',   'Nepali Literature',   'literature', TRUE),
  ('lit_odia',     'Odia Literature',     'literature', TRUE),
  ('lit_punjabi',  'Punjabi Literature',  'literature', TRUE),
  ('lit_sanskrit', 'Sanskrit Literature', 'literature', TRUE),
  ('lit_santhali', 'Santhali Literature', 'literature', TRUE),
  ('lit_sindhi',   'Sindhi Literature',   'literature', TRUE),
  ('lit_tamil',    'Tamil Literature',    'literature', TRUE),
  ('lit_telugu',   'Telugu Literature',   'literature', TRUE),
  ('lit_urdu',     'Urdu Literature',     'literature', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 6.2 Exam Languages (22 Eighth Schedule + English)
INSERT INTO public.exam_languages (code, name, script) VALUES
  ('as',   'Assamese',  'Assamese script'),
  ('bn',   'Bengali',   'Bengali script'),
  ('bodo', 'Bodo',      'Devanagari'),
  ('doi',  'Dogri',     'Devanagari'),
  ('gu',   'Gujarati',  'Gujarati script'),
  ('hi',   'Hindi',     'Devanagari'),
  ('kn',   'Kannada',   'Kannada script'),
  ('ks',   'Kashmiri',  'Perso-Arabic / Devanagari'),
  ('kok',  'Konkani',   'Devanagari'),
  ('mai',  'Maithili',  'Devanagari'),
  ('ml',   'Malayalam', 'Malayalam script'),
  ('mni',  'Manipuri',  'Bengali / Meitei Mayek'),
  ('mr',   'Marathi',   'Devanagari'),
  ('ne',   'Nepali',    'Devanagari'),
  ('or',   'Odia',      'Odia script'),
  ('pa',   'Punjabi',   'Gurmukhi'),
  ('sa',   'Sanskrit',  'Devanagari'),
  ('sat',  'Santhali',  'Ol Chiki'),
  ('sd',   'Sindhi',    'Devanagari / Perso-Arabic'),
  ('ta',   'Tamil',     'Tamil script'),
  ('te',   'Telugu',    'Telugu script'),
  ('ur',   'Urdu',      'Perso-Arabic'),
  ('en',   'English',   'Latin')
ON CONFLICT (code) DO NOTHING;

-- NOTE: Syllabus nodes (syllabus_nodes table) must be seeded separately
-- using a Node.js seed script run with SUPABASE_SERVICE_ROLE_KEY.
-- The seed script is described in Phase 3 of the Implementation Plan.
-- Seeding via SQL INSERT is impractical due to the volume (~8000 nodes).


-- ============================================================
-- 7. GRANTS
-- ============================================================
GRANT SELECT ON public.optional_subjects   TO authenticated, anon;
GRANT SELECT ON public.exam_languages      TO authenticated, anon;
GRANT SELECT ON public.syllabus_nodes      TO authenticated, anon;
GRANT SELECT ON public.v_overdue_revisions TO authenticated;
GRANT SELECT ON public.v_due_key_notes     TO authenticated;


-- ============================================================
-- 8. STORAGE BUCKET POLICIES
-- ============================================================
-- IMPORTANT: Run this AFTER manually creating the buckets in the
-- Supabase Dashboard (Storage > New bucket):
--   "user-files" → Private  → 52428800 bytes (50 MB) max
--   "avatars"    → Public   →  5242880 bytes ( 5 MB) max

-- user-files: owner-only read/write
CREATE POLICY "user_files_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "user_files_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "user_files_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "user_files_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- avatars: public read, owner write
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- ============================================================
-- END OF SCHEMA — PrepTrack v1.0
-- ============================================================
