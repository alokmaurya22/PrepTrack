-- Migration: Habits tracker + CA source field
-- Run in Supabase SQL Editor

-- ── Habits ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habits (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT    DEFAULT '✅',
  color       TEXT    DEFAULT '#6366f1',
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  habit_id   UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  UNIQUE (user_id, habit_id, date),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habits_policy" ON public.habits;
CREATE POLICY "habits_policy" ON public.habits
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habit_logs_policy" ON public.habit_logs;
CREATE POLICY "habit_logs_policy" ON public.habit_logs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.habits     TO authenticated;
GRANT ALL ON public.habit_logs TO authenticated;

-- ── Current Affairs: add source_name ─────────────────────────────────────────

ALTER TABLE public.ca_entries ADD COLUMN IF NOT EXISTS source_name TEXT;

-- ── Seeded default habits (global, no user — for reference) ──────────────────
-- (Users create their own habits; no global seed needed)
