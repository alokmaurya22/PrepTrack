-- Add user_id to syllabus_nodes so each user owns their own tree
ALTER TABLE public.syllabus_nodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.syllabus_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "syllabus_nodes_select" ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_insert" ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_update" ON public.syllabus_nodes;
DROP POLICY IF EXISTS "syllabus_nodes_delete" ON public.syllabus_nodes;

-- Users see their own nodes OR legacy global nodes (user_id IS NULL)
CREATE POLICY "syllabus_nodes_select" ON public.syllabus_nodes
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "syllabus_nodes_insert" ON public.syllabus_nodes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "syllabus_nodes_update" ON public.syllabus_nodes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "syllabus_nodes_delete" ON public.syllabus_nodes
  FOR DELETE USING (user_id = auth.uid());

GRANT ALL ON public.syllabus_nodes TO authenticated;

CREATE INDEX IF NOT EXISTS idx_syllabus_nodes_user_id ON public.syllabus_nodes(user_id);
