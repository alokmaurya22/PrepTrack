-- ============================================================
-- PrepTrack — Complete Database Schema (Supabase Postgres)
-- Version: 3.0 — Generic (any exam, not UPSC-specific)
-- Instructions: Paste entire file into Supabase SQL Editor > Run
-- For existing DBs: run supabase/migration_generic.sql instead
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. LOOKUP TABLES
-- ============================================================

-- Subjects (system defaults visible to all; user_id != NULL = user-created, visible only to owner)
-- Works for any exam: UPSC, GATE, CAT, NEET, SSC, Bank PO, JEE, State PSC, etc.
CREATE TABLE IF NOT EXISTS public.optional_subjects (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system/global
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'other',   -- free text, no check constraint
  is_literature BOOLEAN NOT NULL DEFAULT FALSE,
  language_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.optional_subjects ENABLE ROW LEVEL SECURITY;
-- System subjects (user_id IS NULL) are readable by everyone including anon
CREATE POLICY "subjects_select"      ON public.optional_subjects FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "subjects_insert_own"  ON public.optional_subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subjects_update_own"  ON public.optional_subjects FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "subjects_delete_own"  ON public.optional_subjects FOR DELETE  USING (auth.uid() = user_id);

-- ============================================================
-- 4. SYLLABUS NODES (hierarchical tree)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.syllabus_nodes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id           UUID REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  level               INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
  code                TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  description         TEXT,
  default_hours       NUMERIC(5,2) DEFAULT 2.0,
  stage               TEXT,   -- free text: 'Paper 1', 'Phase 1', 'Module A', etc.
  paper               TEXT,
  optional_subject_id INTEGER REFERENCES public.optional_subjects(id),
  is_leaf             BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syllabus_parent  ON public.syllabus_nodes(parent_id);
CREATE INDEX idx_syllabus_stage   ON public.syllabus_nodes(stage);
CREATE INDEX idx_syllabus_level   ON public.syllabus_nodes(level);
CREATE INDEX idx_syllabus_is_leaf ON public.syllabus_nodes(is_leaf) WHERE is_leaf = TRUE;
CREATE INDEX idx_syllabus_title   ON public.syllabus_nodes USING gin (title gin_trgm_ops);

ALTER TABLE public.syllabus_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syllabus_nodes_public_read" ON public.syllabus_nodes FOR SELECT USING (TRUE);

-- ============================================================
-- 5. PROFILES (auto-created on signup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                  TEXT,
  avatar_url                 TEXT,
  target_exam_name           TEXT,                                  -- 'UPSC CSE', 'GATE CS', 'CAT', 'NEET', etc.
  exam_attempt_date          DATE,
  optional_subject_id        INTEGER REFERENCES public.optional_subjects(id),
  exam_medium                TEXT,                                  -- free text, e.g. 'Hindi', 'English'
  daily_target_hours         NUMERIC(4,1) NOT NULL DEFAULT 8.0 CHECK (daily_target_hours BETWEEN 4 AND 14),
  working_hours_start        TIME NOT NULL DEFAULT '06:00',
  working_hours_end          TIME NOT NULL DEFAULT '22:00',
  timezone                   TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  theme_preference           TEXT NOT NULL DEFAULT 'auto' CHECK (theme_preference IN ('light','dark','auto')),
  onboarding_completed       BOOLEAN NOT NULL DEFAULT TRUE,         -- TRUE by default (no onboarding wizard)
  familiarity_ratings        JSONB DEFAULT '{}',
  notification_prefs         JSONB DEFAULT '{"morning_plan":true,"eod_reflection":true,"revision_due":true,"test_upcoming":true,"slip_alert":true,"weekly_report":true}',
  push_subscription          JSONB,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, onboarding_completed)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'avatar_url', TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. USER SYLLABUS PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_syllabus_progress (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  syllabus_node_id         UUID NOT NULL REFERENCES public.syllabus_nodes(id) ON DELETE CASCADE,
  status                   TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','needs_revision')),
  confidence_rating        INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  hours_estimated_override NUMERIC(5,2),
  hours_spent              NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_revised_at          TIMESTAMPTZ,
  next_revision_at         TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  revision_count           INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, syllabus_node_id)
);

CREATE INDEX idx_progress_user   ON public.user_syllabus_progress(user_id);
CREATE INDEX idx_progress_status ON public.user_syllabus_progress(user_id, status);
CREATE INDEX idx_progress_next   ON public.user_syllabus_progress(user_id, next_revision_at);

CREATE TRIGGER progress_updated_at BEFORE UPDATE ON public.user_syllabus_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_syllabus_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_all_own" ON public.user_syllabus_progress USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. NODE SOURCES (books/videos/URLs per syllabus node)
-- ============================================================
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

CREATE INDEX idx_sources_node ON public.node_sources(syllabus_node_id);

ALTER TABLE public.node_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_all_own" ON public.node_sources USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_task_id      UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  type                TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('syllabus','revision','test_pyq','answer_writing','current_affairs','custom')),
  syllabus_node_id    UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  target_date         DATE,
  target_start_time   TIME,
  target_end_time     TIME,
  estimated_minutes   INTEGER,
  actual_minutes      INTEGER,
  priority            TEXT NOT NULL DEFAULT 'p2' CHECK (priority IN ('p1','p2','p3')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','partial','skipped','cancelled')),
  skip_reason         TEXT,
  recurrence_rule     TEXT,
  recurrence_parent_id UUID,
  reminder_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user   ON public.tasks(user_id);
CREATE INDEX idx_tasks_date   ON public.tasks(user_id, target_date);
CREATE INDEX idx_tasks_status ON public.tasks(user_id, status);

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all_own" ON public.tasks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. STUDY SESSIONS (Pomodoro)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  session_type     TEXT NOT NULL DEFAULT 'focus' CHECK (session_type IN ('focus','break','long_break')),
  focus_score      INTEGER CHECK (focus_score BETWEEN 1 AND 5),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON public.study_sessions(user_id, started_at);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_all_own" ON public.study_sessions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. DAILY LOGS (end-of-day reflection)
-- ============================================================
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
  UNIQUE(user_id, date)
);

CREATE INDEX idx_dailylogs_user ON public.daily_logs(user_id, date);

CREATE TRIGGER dailylogs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dailylogs_all_own" ON public.daily_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 11. NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT 'Untitled Note',
  content_json    JSONB,
  content_md      TEXT,
  tags            TEXT[] DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  version_number  INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user    ON public.notes(user_id);
CREATE INDEX idx_notes_search  ON public.notes USING gin (title gin_trgm_ops, content_md gin_trgm_ops);

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_all_own" ON public.notes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 12. KEY NOTES (Flashcards with SM-2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.key_notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id          UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  front_text       TEXT NOT NULL,
  back_text        TEXT NOT NULL,
  ease_factor      NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days    INTEGER NOT NULL DEFAULT 0,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  next_review_at   TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_keynotes_user  ON public.key_notes(user_id);
CREATE INDEX idx_keynotes_due   ON public.key_notes(user_id, next_review_at);

ALTER TABLE public.key_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keynotes_all_own" ON public.key_notes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 13. ATTACHMENTS (File uploads)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path    TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL DEFAULT 0,
  folder_path  TEXT,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_user ON public.attachments(user_id);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_all_own" ON public.attachments USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 14. TESTS (Mock test logging)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  date              DATE NOT NULL,
  source            TEXT,
  type              TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('mock','sectional','full_length','previous_year','practice','other')),
  total_marks       INTEGER NOT NULL DEFAULT 100,
  scored_marks      INTEGER NOT NULL DEFAULT 0,
  time_taken_minutes INTEGER,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tests_user ON public.tests(user_id, date);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_all_own" ON public.tests USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Test Mistakes
CREATE TABLE IF NOT EXISTS public.test_mistakes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id          UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text    TEXT,
  image_url        TEXT,
  correct_answer   TEXT,
  your_answer      TEXT,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  reasoning        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mistakes_test ON public.test_mistakes(test_id);
CREATE INDEX idx_mistakes_user ON public.test_mistakes(user_id);

ALTER TABLE public.test_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mistakes_all_own" ON public.test_mistakes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PYQ Tracker
CREATE TABLE IF NOT EXISTS public.pyq_questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name        TEXT,                                            -- 'UPSC CSE', 'GATE CS', 'CAT', etc.
  year             INTEGER NOT NULL,
  paper            TEXT NOT NULL,
  subject          TEXT,                                            -- 'Polity', 'Maths', 'Verbal', etc.
  question_number  INTEGER,
  question_text    TEXT,
  status           TEXT NOT NULL DEFAULT 'not_attempted' CHECK (status IN ('not_attempted','correct','wrong','skipped')),
  your_answer      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pyq_user ON public.pyq_questions(user_id, year);

ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pyq_all_own" ON public.pyq_questions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mains Answers
CREATE TABLE IF NOT EXISTS public.mains_answers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id          UUID REFERENCES public.tests(id) ON DELETE SET NULL,
  question_text    TEXT NOT NULL,
  answer_image_url TEXT,
  answer_text      TEXT,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  exam_section      TEXT,                                           -- e.g. 'GS Paper 3', 'Section B'
  structure_rating  INTEGER CHECK (structure_rating BETWEEN 1 AND 5),
  content_rating    INTEGER CHECK (content_rating BETWEEN 1 AND 5),
  diagram_rating    INTEGER CHECK (diagram_rating BETWEEN 1 AND 5),
  conclusion_rating INTEGER CHECK (conclusion_rating BETWEEN 1 AND 5),
  rating_labels     JSONB DEFAULT '{"structure":"Structure","content":"Content","diagram":"Diagram","conclusion":"Conclusion"}',
  review_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mainsanswers_user ON public.mains_answers(user_id);

ALTER TABLE public.mains_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mainsanswers_all_own" ON public.mains_answers USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 15. CURRENT AFFAIRS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ca_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  source_url       TEXT,
  title            TEXT NOT NULL,
  summary          TEXT,
  tags             TEXT[] DEFAULT '{}',
  syllabus_node_ids UUID[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_entries_user ON public.ca_entries(user_id, date);
CREATE INDEX idx_ca_entries_search ON public.ca_entries USING gin (title gin_trgm_ops);

ALTER TABLE public.ca_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_all_own" ON public.ca_entries USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 16. ROADMAP PHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phase_type  TEXT NOT NULL CHECK (phase_type IN ('foundation','consolidation','revision_1','revision_2','test_series','final_sprint','custom')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_user ON public.roadmap_phases(user_id, start_date);
CREATE TRIGGER roadmap_updated_at BEFORE UPDATE ON public.roadmap_phases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmap_all_own" ON public.roadmap_phases USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  body      TEXT,
  type      TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','reminder')),
  is_read   BOOLEAN NOT NULL DEFAULT FALSE,
  link      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all_own" ON public.notifications USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 18. STORAGE BUCKETS (Run in Dashboard > Storage)
-- ============================================================
-- Bucket 1: "user-files" — Private, 50MB max file size
-- Bucket 2: "avatars"   — Public, 5MB max file size

-- Storage RLS Policies (run after creating buckets):
-- BEGIN;
-- CREATE POLICY "files_select_own" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "files_insert_own" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "files_delete_own" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- COMMIT;

-- ============================================================
-- 19. SEED DATA: Default Subjects (system-level, user_id = NULL)
--     These are pre-loaded as global defaults. Students can add
--     their own subjects on top of these via the UI.
--     UPSC optionals are included; they're also valid subject names
--     for many other Indian competitive exams.
-- ============================================================
INSERT INTO public.optional_subjects (code, name, category, is_literature) VALUES
('opt_agri',       'Agriculture',                    'science',           FALSE),
('opt_anim_husb',  'Animal Husbandry & Veterinary',  'science',           FALSE),
('opt_anthropo',   'Anthropology',                   'social_science',    FALSE),
('opt_botany',     'Botany',                         'science',           FALSE),
('opt_chemistry',  'Chemistry',                      'science',           FALSE),
('opt_civil_eng',  'Civil Engineering',              'engineering',       FALSE),
('opt_commerce',   'Commerce & Accountancy',         'social_science',    FALSE),
('opt_economics',  'Economics',                      'social_science',    FALSE),
('opt_elec_eng',   'Electrical Engineering',         'engineering',       FALSE),
('opt_geography',  'Geography',                      'social_science',    FALSE),
('opt_geology',    'Geology',                        'science',           FALSE),
('opt_history',    'History',                        'social_science',    FALSE),
('opt_law',        'Law',                            'social_science',    FALSE),
('opt_management', 'Management',                     'social_science',    FALSE),
('opt_maths',      'Mathematics',                    'science',           FALSE),
('opt_mech_eng',   'Mechanical Engineering',         'engineering',       FALSE),
('opt_med_sci',    'Medical Science',                'science',           FALSE),
('opt_philosophy', 'Philosophy',                     'social_science',    FALSE),
('opt_physics',    'Physics',                        'science',           FALSE),
('opt_pol_sci',    'Political Science & IR',         'social_science',    FALSE),
('opt_psychology', 'Psychology',                     'social_science',    FALSE),
('opt_pub_admin',  'Public Administration',          'social_science',    FALSE),
('opt_sociology',  'Sociology',                      'social_science',    FALSE),
('opt_statistics', 'Statistics',                     'science',           FALSE),
('opt_zoology',    'Zoology',                        'science',           FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.optional_subjects (code, name, category, is_literature, language_name) VALUES
('lit_assamese',   'Assamese Literature',            'literature',        TRUE, 'Assamese'),
('lit_bengali',    'Bengali Literature',             'literature',        TRUE, 'Bengali'),
('lit_bodo',       'Bodo Literature',                'literature',        TRUE, 'Bodo'),
('lit_dogri',      'Dogri Literature',               'literature',        TRUE, 'Dogri'),
('lit_english',    'English Literature',             'literature',        TRUE, 'English'),
('lit_gujarati',   'Gujarati Literature',            'literature',        TRUE, 'Gujarati'),
('lit_hindi',      'Hindi Literature',               'literature',        TRUE, 'Hindi'),
('lit_kannada',    'Kannada Literature',             'literature',        TRUE, 'Kannada'),
('lit_kashmiri',   'Kashmiri Literature',            'literature',        TRUE, 'Kashmiri'),
('lit_konkani',    'Konkani Literature',             'literature',        TRUE, 'Konkani'),
('lit_maithili',   'Maithili Literature',            'literature',        TRUE, 'Maithili'),
('lit_malayalam',  'Malayalam Literature',           'literature',        TRUE, 'Malayalam'),
('lit_manipuri',   'Manipuri Literature',            'literature',        TRUE, 'Manipuri'),
('lit_marathi',    'Marathi Literature',             'literature',        TRUE, 'Marathi'),
('lit_nepali',     'Nepali Literature',              'literature',        TRUE, 'Nepali'),
('lit_odia',       'Odia Literature',                'literature',        TRUE, 'Odia'),
('lit_punjabi',    'Punjabi Literature',             'literature',        TRUE, 'Punjabi'),
('lit_sanskrit',   'Sanskrit Literature',            'literature',        TRUE, 'Sanskrit'),
('lit_santhali',   'Santhali Literature',            'literature',        TRUE, 'Santhali'),
('lit_sindhi',     'Sindhi Literature',              'literature',        TRUE, 'Sindhi'),
('lit_tamil',      'Tamil Literature',               'literature',        TRUE, 'Tamil'),
('lit_telugu',     'Telugu Literature',              'literature',        TRUE, 'Telugu'),
('lit_urdu',       'Urdu Literature',                'literature',        TRUE, 'Urdu')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- DONE! Schema is ready.
-- exam_languages table removed — exam medium is now a free-text
-- field in profiles (target_exam_name, exam_medium).
-- ============================================================