-- =====================================================================
-- PrepTrack: Migration — Make Generic (any exam, not just UPSC)
-- Run once in Supabase SQL Editor
-- Safe to run on existing DB — uses IF EXISTS / IF NOT EXISTS throughout
-- =====================================================================


-- =====================================================================
-- 1. PROFILES — remove UPSC FK columns, add generic fields
-- =====================================================================

-- Drop the FK to exam_languages (UPSC medium-of-writing concept)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_exam_medium_language_id_fkey;

-- Add generic free-text exam_medium column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_medium TEXT;

-- Carry over existing language names (if any rows had this set)
UPDATE public.profiles p
  SET exam_medium = el.name
  FROM public.exam_languages el
  WHERE el.id = p.exam_medium_language_id
    AND p.exam_medium IS NULL;

-- Drop the UPSC-specific FK column and unused onboarding_step
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS exam_medium_language_id;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS onboarding_step;

-- Add generic target exam name (UPSC, GATE, CAT, NEET, SSC — anything)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_exam_name TEXT;

-- Since onboarding is removed, default onboarding_completed to TRUE for all new users
ALTER TABLE public.profiles
  ALTER COLUMN onboarding_completed SET DEFAULT TRUE;

-- Mark all existing users as onboarding done (no wizard to complete)
UPDATE public.profiles
  SET onboarding_completed = TRUE
  WHERE onboarding_completed = FALSE;


-- =====================================================================
-- 2. TRIGGER — new users auto-get onboarding_completed = TRUE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    TRUE
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- 3. SYLLABUS NODES — remove UPSC-specific stage constraint
--    stage is now free text: 'Paper 1', 'Module A', 'Phase 1', etc.
-- =====================================================================

ALTER TABLE public.syllabus_nodes
  DROP CONSTRAINT IF EXISTS syllabus_nodes_stage_check;

-- Drop the FK to exam_languages (UPSC language paper concept)
ALTER TABLE public.syllabus_nodes
  DROP CONSTRAINT IF EXISTS syllabus_nodes_language_id_fkey;

ALTER TABLE public.syllabus_nodes
  DROP COLUMN IF EXISTS language_id;


-- =====================================================================
-- 4. TESTS — replace UPSC-specific types with generic exam types
-- =====================================================================

ALTER TABLE public.tests
  DROP CONSTRAINT IF EXISTS tests_type_check;

-- Migrate old UPSC values before adding new constraint
UPDATE public.tests
  SET type = 'mock'
  WHERE type IN ('prelims', 'mains');

ALTER TABLE public.tests
  ADD CONSTRAINT tests_type_check
  CHECK (type IN ('mock', 'sectional', 'full_length', 'previous_year', 'practice', 'other'));


-- =====================================================================
-- 5. ROADMAP PHASES — replace final_60 with final_sprint (generic)
-- =====================================================================

ALTER TABLE public.roadmap_phases
  DROP CONSTRAINT IF EXISTS roadmap_phases_phase_type_check;

UPDATE public.roadmap_phases
  SET phase_type = 'final_sprint'
  WHERE phase_type = 'final_60';

ALTER TABLE public.roadmap_phases
  ADD CONSTRAINT roadmap_phases_phase_type_check
  CHECK (phase_type IN (
    'foundation', 'consolidation', 'revision_1', 'revision_2',
    'test_series', 'final_sprint', 'custom'
  ));


-- =====================================================================
-- 6. OPTIONAL_SUBJECTS → now "Subjects" (user-owned + system defaults)
--    UPSC subjects stay as system defaults (user_id = NULL = global)
--    Any user can add their own subjects for their exam
-- =====================================================================

-- Relax the hardcoded category constraint
ALTER TABLE public.optional_subjects
  DROP CONSTRAINT IF EXISTS optional_subjects_category_check;

-- Add user_id so users can create their own subjects
-- NULL user_id = system-provided (visible to everyone)
-- non-NULL user_id = user-created (visible only to that user)
ALTER TABLE public.optional_subjects
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS (may already be enabled — IF NOT EXISTS variant not available, safe to re-enable)
ALTER TABLE public.optional_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select"      ON public.optional_subjects;
DROP POLICY IF EXISTS "subjects_insert_own"  ON public.optional_subjects;
DROP POLICY IF EXISTS "subjects_update_own"  ON public.optional_subjects;
DROP POLICY IF EXISTS "subjects_delete_own"  ON public.optional_subjects;

-- Everyone can read system subjects (user_id IS NULL) or their own
CREATE POLICY "subjects_select" ON public.optional_subjects
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can only insert/update/delete their own subjects
CREATE POLICY "subjects_insert_own" ON public.optional_subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subjects_update_own" ON public.optional_subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "subjects_delete_own" ON public.optional_subjects
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================================
-- 7. MAINS_ANSWERS — make answer ratings configurable (not hardcoded
--    to UPSC's Structure/Content/Diagram/Conclusion)
-- =====================================================================

ALTER TABLE public.mains_answers
  ADD COLUMN IF NOT EXISTS rating_labels JSONB DEFAULT
    '{"structure":"Structure","content":"Content","diagram":"Diagram","conclusion":"Conclusion"}';

-- Add a generic name field so this can be used for any written answer section
ALTER TABLE public.mains_answers
  ADD COLUMN IF NOT EXISTS exam_section TEXT;


-- =====================================================================
-- 8. PYQ_QUESTIONS — add subject column for non-UPSC exams
--    (e.g., GATE: 'General Aptitude', NEET: 'Biology', CAT: 'VARC')
-- =====================================================================

ALTER TABLE public.pyq_questions
  ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.pyq_questions
  ADD COLUMN IF NOT EXISTS exam_name TEXT;


-- =====================================================================
-- 9. TASKS — 'answer_writing' renamed concept, keep backward compat
--    Add 'written_practice' as an alias-friendly check value
-- =====================================================================

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_type_check
  CHECK (type IN (
    'syllabus', 'revision', 'test_pyq', 'answer_writing',
    'current_affairs', 'written_practice', 'custom'
  ));


-- =====================================================================
-- 10. DROP exam_languages table (UPSC-specific 22 scheduled languages)
--     All FKs to this table have been removed above (profiles, syllabus_nodes)
-- =====================================================================

DROP TABLE IF EXISTS public.exam_languages;


-- =====================================================================
-- 11. PERMISSIONS — grant authenticated users access to updated tables
-- =====================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

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
  FOR r IN
    SELECT sequence_name FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format(
      'GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated',
      r.sequence_name
    );
  END LOOP;
END $$;

GRANT SELECT ON public.optional_subjects TO anon;
GRANT SELECT ON public.syllabus_nodes    TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;


-- =====================================================================
-- DONE. PrepTrack is now generic — works for UPSC, GATE, CAT, NEET,
-- SSC, Bank PO, State PSC, JEE, or any other exam.
-- =====================================================================
