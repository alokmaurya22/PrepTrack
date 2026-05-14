-- ============================================================
-- Fix syllabus_nodes for user-created syllabus
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the level check constraint (was BETWEEN 1 AND 6, but user subjects start at level 0)
ALTER TABLE public.syllabus_nodes
  DROP CONSTRAINT IF EXISTS syllabus_nodes_level_check;

-- Allow any non-negative level
ALTER TABLE public.syllabus_nodes
  ADD CONSTRAINT syllabus_nodes_level_check CHECK (level >= 0);

-- 2. Drop UNIQUE constraint on code (user nodes use '' as placeholder — code was for admin data)
ALTER TABLE public.syllabus_nodes
  DROP CONSTRAINT IF EXISTS syllabus_nodes_code_key;

-- Make code nullable so user nodes don't need a code at all
ALTER TABLE public.syllabus_nodes
  ALTER COLUMN code DROP NOT NULL;

ALTER TABLE public.syllabus_nodes
  ALTER COLUMN code SET DEFAULT NULL;

-- Update existing placeholder '' codes to NULL to keep data clean
UPDATE public.syllabus_nodes
  SET code = NULL
  WHERE code = '';

-- 3. Add user_id column (safe — skips if already added by migration_user_syllabus.sql)
ALTER TABLE public.syllabus_nodes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Enable RLS (idempotent)
ALTER TABLE public.syllabus_nodes ENABLE ROW LEVEL SECURITY;

-- 5. Drop and recreate policies
DROP POLICY IF EXISTS "syllabus_nodes_public_read"  ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_select"        ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_insert"        ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_update"        ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_delete"        ON public.syllabus_nodes;

-- Users see their own nodes only (user_id = their uid)
-- Global/legacy nodes (user_id IS NULL) also visible for backwards compat
CREATE POLICY "syllabus_nodes_select" ON public.syllabus_nodes
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "syllabus_nodes_insert" ON public.syllabus_nodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "syllabus_nodes_update" ON public.syllabus_nodes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "syllabus_nodes_delete" ON public.syllabus_nodes
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Index on user_id for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_user_id ON public.syllabus_nodes(user_id);

GRANT ALL ON public.syllabus_nodes TO authenticated;
