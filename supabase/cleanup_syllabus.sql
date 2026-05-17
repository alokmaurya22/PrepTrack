-- ============================================================
-- Cleanup: Delete all syllabus data for user
-- User ID: 3b4b6ce1-1fc3-40f2-b597-a695a8c21786
-- Run in Supabase SQL Editor
-- ============================================================

DELETE FROM public.user_syllabus_progress
WHERE user_id = '3b4b6ce1-1fc3-40f2-b597-a695a8c21786';

DELETE FROM public.node_sources
WHERE user_id = '3b4b6ce1-1fc3-40f2-b597-a695a8c21786';

DELETE FROM public.syllabus_nodes
WHERE user_id = '3b4b6ce1-1fc3-40f2-b597-a695a8c21786';

-- Verify
SELECT COUNT(*) AS remaining_nodes FROM public.syllabus_nodes
WHERE user_id = '3b4b6ce1-1fc3-40f2-b597-a695a8c21786';
