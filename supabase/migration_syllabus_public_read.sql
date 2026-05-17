-- ============================================================
-- Enable cross-user syllabus discovery (for "Copy from Existing" feature)
-- Run ONCE in Supabase SQL Editor
-- ============================================================
-- By default, users can only see their own nodes (user_id = auth.uid()).
-- This migration allows all authenticated users to read ALL nodes so
-- the search-and-copy feature can find syllabi created by other users.

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "syllabus_nodes_select_own" ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_public_read" ON public.syllabus_nodes;

-- Allow all authenticated users to read all syllabus nodes
CREATE POLICY "syllabus_nodes_authenticated_read" ON public.syllabus_nodes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT / UPDATE / DELETE policies remain unchanged (user can only modify their own nodes):
-- INSERT: WITH CHECK (user_id = auth.uid())
-- UPDATE: USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
-- DELETE: USING (user_id = auth.uid())
