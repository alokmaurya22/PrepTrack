-- ============================================================
-- UPSC CSE Exam — Syllabus Seed
-- Structure: Exam (L1) → Paper/Group (L2) → Subject (L3, is_leaf)
-- User: 3b4b6ce1-1fc3-40f2-b597-a695a8c21786
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  uid UUID := '3b4b6ce1-1fc3-40f2-b597-a695a8c21786';

  -- L1
  exam_id UUID := 'e0000001-0000-0000-0000-000000000001';

  -- L2: Papers as Groups
  g_pa UUID := 'e0000001-0000-0000-0000-000000000020';  -- Paper A
  g_pb UUID := 'e0000001-0000-0000-0000-000000000021';  -- Paper B
  g_p1 UUID := 'e0000001-0000-0000-0000-000000000022';  -- Paper I  (Essay)
  g_p2 UUID := 'e0000001-0000-0000-0000-000000000023';  -- Paper II (GS-1)
  g_p3 UUID := 'e0000001-0000-0000-0000-000000000024';  -- Paper III (GS-2)
  g_p4 UUID := 'e0000001-0000-0000-0000-000000000025';  -- Paper IV (GS-3)
  g_p5 UUID := 'e0000001-0000-0000-0000-000000000026';  -- Paper V  (GS-4)
  g_p6 UUID := 'e0000001-0000-0000-0000-000000000027';  -- Paper VI (Optional 1)
  g_p7 UUID := 'e0000001-0000-0000-0000-000000000028';  -- Paper VII (Optional 2)

BEGIN

-- ============================================================
-- CLEANUP
-- ============================================================
DELETE FROM public.user_syllabus_progress WHERE user_id = uid;
DELETE FROM public.node_sources           WHERE user_id = uid;
DELETE FROM public.syllabus_nodes         WHERE user_id = uid;

-- ============================================================
-- L1: EXAM
-- ============================================================
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, description, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (exam_id, uid, NULL, 1, 'upsc_cse_exam',
   'UPSC CSE Exam',
   'Union Public Service Commission — Civil Services Examination',
   0, NULL, false, 1, '{"nodeType":"exam"}');

-- ============================================================
-- L2: PAPERS AS GROUPS
-- ============================================================
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, description, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (g_pa, uid, exam_id, 2, 'mai_paper_a',
   'Paper A — अनिवार्य भारतीय भाषा (Qualifying)',
   'Compulsory Indian Language — Qualifying, 300 marks',
   0, 'mains', false, 1, '{"nodeType":"group"}'),

  (g_pb, uid, exam_id, 2, 'mai_paper_b',
   'Paper B — English (Qualifying)',
   'Compulsory English — Qualifying, 300 marks',
   0, 'mains', false, 2, '{"nodeType":"group"}'),

  (g_p1, uid, exam_id, 2, 'mai_paper_1',
   'Paper I — निबंध (Essay)',
   '250 marks — 2 essays on contemporary/philosophical topics',
   0, 'mains', false, 3, '{"nodeType":"group"}'),

  (g_p2, uid, exam_id, 2, 'mai_paper_2',
   'Paper II — सामान्य अध्ययन I (GS-1)',
   '250 marks — Heritage, History, Society, Geography',
   0, 'mains', false, 4, '{"nodeType":"group"}'),

  (g_p3, uid, exam_id, 2, 'mai_paper_3',
   'Paper III — सामान्य अध्ययन II (GS-2)',
   '250 marks — Polity, Governance, Social Justice, IR',
   0, 'mains', false, 5, '{"nodeType":"group"}'),

  (g_p4, uid, exam_id, 2, 'mai_paper_4',
   'Paper IV — सामान्य अध्ययन III (GS-3)',
   '250 marks — Economy, Science, Environment, Security',
   0, 'mains', false, 6, '{"nodeType":"group"}'),

  (g_p5, uid, exam_id, 2, 'mai_paper_5',
   'Paper V — सामान्य अध्ययन IV (GS-4)',
   '250 marks — Ethics, Integrity, Aptitude',
   0, 'mains', false, 7, '{"nodeType":"group"}'),

  (g_p6, uid, exam_id, 2, 'mai_paper_6',
   'Paper VI — वैकल्पिक विषय पेपर 1 (Geography)',
   '250 marks — Physical & Human Geography Theory',
   0, 'mains', false, 8, '{"nodeType":"group"}'),

  (g_p7, uid, exam_id, 2, 'mai_paper_7',
   'Paper VII — वैकल्पिक विषय पेपर 2 (Geography)',
   '250 marks — Geography of India',
   0, 'mains', false, 9, '{"nodeType":"group"}');

-- ============================================================
-- L3: SUBJECTS (is_leaf = true)
-- ============================================================

-- Paper A: अनिवार्य भारतीय भाषा
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_pa, 3, 'pa_s1', 'निबंध (Essay Writing)',          20, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_pa, 3, 'pa_s2', 'गद्यांश (Comprehension)',         15, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_pa, 3, 'pa_s3', 'व्याकरण (Grammar)',               15, 'mains', true, 3, '{"nodeType":"subject"}');

-- Paper B: English
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_pb, 3, 'pb_s1', 'Comprehension (गद्यांश)',         15, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_pb, 3, 'pb_s2', 'Précis Writing (संक्षेपण)',       15, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_pb, 3, 'pb_s3', 'Word Usage & Vocabulary',          10, 'mains', true, 3, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_pb, 3, 'pb_s4', 'Grammar (व्याकरण)',               10, 'mains', true, 4, '{"nodeType":"subject"}');

-- Paper I: Essay
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p1, 3, 'p1_s1', 'Section A — समसामयिक विषय (Contemporary Topics)',   20, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p1, 3, 'p1_s2', 'Section B — दार्शनिक विषय (Philosophical Topics)',   20, 'mains', true, 2, '{"nodeType":"subject"}');

-- Paper II: GS-1
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p2, 3, 'p2_s1', 'भारतीय विरासत और संस्कृति (Art & Culture)',                           20, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p2, 3, 'p2_s2', 'आधुनिक भारत का इतिहास और स्वतंत्रता संग्राम (Modern History)',       20, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p2, 3, 'p2_s3', 'विश्व का इतिहास (World History)',                                      15, 'mains', true, 3, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p2, 3, 'p2_s4', 'भारतीय समाज और उसकी विशेषताएँ (Indian Society)',                     15, 'mains', true, 4, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p2, 3, 'p2_s5', 'विश्व और भारत का भौतिक भूगोल (Physical Geography)',                  20, 'mains', true, 5, '{"nodeType":"subject"}');

-- Paper III: GS-2
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p3, 3, 'p3_s1', 'भारतीय संविधान और राजव्यवस्था (Polity & Constitution)',  25, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p3, 3, 'p3_s2', 'शासन व्यवस्था (Governance)',                              20, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p3, 3, 'p3_s3', 'सामाजिक न्याय (Social Justice)',                          15, 'mains', true, 3, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p3, 3, 'p3_s4', 'अंतर्राष्ट्रीय संबंध (International Relations)',          20, 'mains', true, 4, '{"nodeType":"subject"}');

-- Paper IV: GS-3
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p4, 3, 'p4_s1', 'भारतीय अर्थव्यवस्था और आर्थिक विकास (Economy)',          25, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p4, 3, 'p4_s2', 'विज्ञान एवं प्रौद्योगिकी (Science & Technology)',         20, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p4, 3, 'p4_s3', 'जैव विविधता और पर्यावरण (Environment & Biodiversity)',    20, 'mains', true, 3, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p4, 3, 'p4_s4', 'आंतरिक सुरक्षा (Internal Security)',                      15, 'mains', true, 4, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p4, 3, 'p4_s5', 'आपदा प्रबंधन (Disaster Management)',                       10, 'mains', true, 5, '{"nodeType":"subject"}');

-- Paper V: GS-4
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p5, 3, 'p5_s1', 'नीतिशास्त्र (Ethics)',                               20, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p5, 3, 'p5_s2', 'सत्यनिष्ठा (Integrity)',                              15, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p5, 3, 'p5_s3', 'अभिरुचि और केस स्टडीज (Aptitude & Case Studies)',    20, 'mains', true, 3, '{"nodeType":"subject"}');

-- Paper VI: Geography Optional 1 (Theory)
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p6, 3, 'p6_s1', 'प्राकृतिक भूगोल — Physical Geography (Geomorphology, Climatology, Oceanography, Biogeography)',  50, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p6, 3, 'p6_s2', 'मानव भूगोल — Human Geography (Population, Settlement, Economic, Political Geography)',             50, 'mains', true, 2, '{"nodeType":"subject"}');

-- Paper VII: Geography Optional 2 (India)
INSERT INTO public.syllabus_nodes
  (id, user_id, parent_id, level, code, title, default_hours, stage, is_leaf, sort_order, metadata)
VALUES
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s1', 'भारत का भौतिक भूगोल (Physical Geography of India)',                    20, 'mains', true, 1, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s2', 'मानवीय भूगोल (Human Geography of India — Population, Urbanization)',   20, 'mains', true, 2, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s3', 'आर्थिक भूगोल (Economic Geography of India)',                           20, 'mains', true, 3, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s4', 'कृषि भूगोल (Agricultural Geography of India)',                         15, 'mains', true, 4, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s5', 'परिवहन और व्यापार (Transport & Trade)',                                10, 'mains', true, 5, '{"nodeType":"subject"}'),
  (gen_random_uuid(), uid, g_p7, 3, 'p7_s6', 'समसामयिक भौगोलिक मुद्दे (Contemporary Geographical Issues)',          15, 'mains', true, 6, '{"nodeType":"subject"}');

END $$;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT level, metadata->>'nodeType' AS node_type, COUNT(*) AS count
FROM public.syllabus_nodes
WHERE user_id = '3b4b6ce1-1fc3-40f2-b597-a695a8c21786'
GROUP BY level, metadata->>'nodeType'
ORDER BY level;
