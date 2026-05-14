-- =====================================================================
-- PrepTrack: New Features Migration
-- Adds: doubts, exam_dates, goals, quick_refs
-- Run in Supabase SQL Editor after migration_generic.sql
-- =====================================================================

-- ── 1. DOUBTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doubts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  subject          TEXT,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','resolved','deferred')),
  resolution_note  TEXT,
  resolved_at      TIMESTAMPTZ,
  source           TEXT,           -- 'self','teacher','ai','book'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doubts_user   ON public.doubts(user_id, status);
CREATE INDEX idx_doubts_subject ON public.doubts(user_id, subject);
CREATE TRIGGER doubts_updated_at BEFORE UPDATE ON public.doubts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doubts_all_own" ON public.doubts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. EXAM DATES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name   TEXT NOT NULL,
  event_type  TEXT NOT NULL DEFAULT 'other'
                CHECK (event_type IN ('notification','registration','admit_card','exam','result','interview','other')),
  event_date  DATE NOT NULL,
  description TEXT,
  url         TEXT,
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  remind_days INTEGER DEFAULT 7,   -- remind N days before
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_dates_user ON public.exam_dates(user_id, event_date);
ALTER TABLE public.exam_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_dates_all_own" ON public.exam_dates
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. GOALS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'custom'
                  CHECK (type IN ('study_hours','topics','tests','revision','pages','custom')),
  period        TEXT NOT NULL DEFAULT 'weekly'
                  CHECK (period IN ('daily','weekly','monthly','custom')),
  target_value  NUMERIC(10,2) NOT NULL DEFAULT 1,
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT 'units',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','abandoned')),
  color         TEXT DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user ON public.goals(user_id, status, end_date);
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_all_own" ON public.goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. QUICK REFERENCE (Formula / Fact Sheets) ───────────────────────
CREATE TABLE IF NOT EXISTS public.quick_refs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  subject          TEXT,
  tags             TEXT[] DEFAULT '{}',
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  is_pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  color            TEXT DEFAULT '#f8fafc',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quickrefs_user    ON public.quick_refs(user_id);
CREATE INDEX idx_quickrefs_subject ON public.quick_refs(user_id, subject);
CREATE INDEX idx_quickrefs_search  ON public.quick_refs USING gin (title gin_trgm_ops);
CREATE TRIGGER quickrefs_updated_at BEFORE UPDATE ON public.quick_refs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.quick_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quickrefs_all_own" ON public.quick_refs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 5. READING LIST ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reading_list (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'other'
                     CHECK (type IN ('book','article','video','pdf','podcast','other')),
  url              TEXT,
  author           TEXT,
  subject          TEXT,
  syllabus_node_id UUID REFERENCES public.syllabus_nodes(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'to_read'
                     CHECK (status IN ('to_read','reading','completed','dropped')),
  priority         TEXT NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('high','medium','low')),
  notes            TEXT,
  total_pages      INTEGER,
  pages_read       INTEGER DEFAULT 0,
  started_at       DATE,
  completed_at     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reading_user   ON public.reading_list(user_id, status);
CREATE INDEX idx_reading_subject ON public.reading_list(user_id, subject);
CREATE TRIGGER reading_updated_at BEFORE UPDATE ON public.reading_list
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_all_own" ON public.reading_list
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 6. GRANT PERMISSIONS ─────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',
      r.tablename
    );
  END LOOP;
END $$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT sequence_name FROM information_schema.sequences
           WHERE sequence_schema = 'public' LOOP
    EXECUTE format(
      'GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated',
      r.sequence_name
    );
  END LOOP;
END $$;

-- =====================================================================
-- DONE. New tables: doubts, exam_dates, goals, quick_refs, reading_list
-- =====================================================================
